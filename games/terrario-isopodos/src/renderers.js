import * as T from "three";
import { HABITAT_GEOMETRY, HOLLOW_BARK_ROTATION, getBarkFootprint, REFUGE_MODEL_PROFILES } from "./habitat.js";
import { buildWoodlandInterior, terrainHeightAt } from "./terrarium-art.js";
import { createDioramaKit } from "./diorama-kit.js";
import { resolveIsopodRefugePose } from "./isopod-placement.js";
import { buildExpeditionMapDiorama, buildExpeditionLevelDiorama } from "./expedition/diorama.js";

const mat=(c,r=.88,extra={})=>new T.MeshStandardMaterial({color:c,roughness:r,...extra});

function mesh(g,m,p){
  const o=new T.Mesh(g,m);
  o.position.set(...p);
  o.castShadow=false;
  o.receiveShadow=true;
  return o;
}

function rng(seed){
  let n=seed>>>0;
  return ()=>{
    n=(1664525*n+1013904223)>>>0;
    return n/4294967296;
  };
}

function rod(group,a,b,r,m){
  const v=new T.Vector3(...a),w=new T.Vector3(...b);
  const d=w.clone().sub(v);
  const o=mesh(new T.CylinderGeometry(r*.72,r,d.length(),7),m,v.add(w).multiplyScalar(.5).toArray());
  o.rotation.set(Math.PI/2,0,0);
  group.add(o);
}


function segmentMatrix(start,end){
  const a=new T.Vector3(...start),b=new T.Vector3(...end);
  const direction=b.clone().sub(a);
  const length=direction.length();
  const quaternion=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());
  return new T.Matrix4().compose(a.add(b).multiplyScalar(.5),quaternion,new T.Vector3(1,length,1));
}

function dorsalCarapaceGeometry(){
  const positions=[],colors=[],uvs=[],indices=[];
  const lengthSegments=56,widthSegments=24,stride=widthSegments+1;
  const halfLength=.235,halfWidth=.132,height=.097;
  const plateTones=[0x929f8e,0x9ca892,0x899787,0xa6ae9a,0x929f8e,0x818f81,0x98a38f].map(hex=>new T.Color(hex));
  for(let i=0;i<=lengthSegments;i++){
    const t=i/lengthSegments;
    const x=(t-.5)*halfLength*2;
    const longitudinal=Math.max(0,1-((x/halfLength)**2));
    const taper=Math.pow(longitudinal,.34);
    const platePosition=t*7;
    const plateIndex=Math.min(6,Math.floor(Math.min(platePosition,6.999999)));
    const local=platePosition-plateIndex;
    const seamDistance=Math.min(local,1-local);
    const groove=Math.exp(-((seamDistance/.067)**2));
    const lip=Math.exp(-(((seamDistance-.105)/.035)**2));
    for(let j=0;j<=widthSegments;j++){
      const angle=(j/widthSegments*2-1)*1.28;
      const z=Math.sin(angle)*halfWidth*taper;
      const dome=Math.cos(angle)*height*taper;
      const y=.025+dome-groove*.018*taper+lip*.0035*taper;
      positions.push(x,y,z);
      uvs.push(t,j/widthSegments);
      const tone=plateTones[plateIndex].clone().multiplyScalar(1-groove*.4+lip*.075);
      const flank=1-Math.abs(Math.sin(angle))*.045;
      tone.multiplyScalar(flank);
      colors.push(tone.r,tone.g,tone.b);
      if(i<lengthSegments&&j<widthSegments){
        const a=i*stride+j,b=a+1,c=a+stride,d=c+1;
        indices.push(a,b,c,b,d,c);
      }
    }
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute("color",new T.Float32BufferAttribute(colors,3));
  geometry.setAttribute("uv",new T.Float32BufferAttribute(uvs,2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}
let isopodShellTexture=null;
function getIsopodShellTexture(){
  if(isopodShellTexture)return isopodShellTexture;
  const canvas=document.createElement("canvas");
  canvas.width=256;canvas.height=128;
  const context=canvas.getContext("2d");
  if(!context)return null;
  const image=context.createImageData(canvas.width,canvas.height);
  let seed=0x51a7c3;
  const random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
    const i=(y*canvas.width+x)*4;
    const broad=Math.sin(x*.073+Math.sin(y*.041)*1.4)*5+Math.cos(y*.13-x*.017)*3;
    const grain=(random()-.5)*19;
    const mottling=Math.sin(x*.33+Math.sin(y*.19)*2.2)*Math.cos(y*.27)*4;
    image.data[i]=Math.max(0,Math.min(255,166+broad+grain+mottling));
    image.data[i+1]=Math.max(0,Math.min(255,160+broad*.9+grain*.92+mottling));
    image.data[i+2]=Math.max(0,Math.min(255,133+broad*.72+grain*.78+mottling*.8));
    image.data[i+3]=255;
  }
  context.putImageData(image,0,0);
  for(let i=0;i<720;i++){
    const x=random()*canvas.width,y=random()*canvas.height,r=.3+random()*.9;
    context.fillStyle=random()>.5?"rgba(226,219,188,.18)":"rgba(58,53,39,.13)";
    context.beginPath();context.ellipse(x,y,r,r*.55,random()*Math.PI,0,Math.PI*2);context.fill();
  }
  isopodShellTexture=new T.CanvasTexture(canvas);
  isopodShellTexture.colorSpace=T.SRGBColorSpace;
  isopodShellTexture.wrapS=T.RepeatWrapping;
  isopodShellTexture.wrapT=T.ClampToEdgeWrapping;
  isopodShellTexture.anisotropy=4;
  return isopodShellTexture;
}
function createVoxelIsopod(){
  const root=new T.Group();
  root.userData.isVoxel=true;
  const unit=.023;
  const geometry=new T.BoxGeometry(1,1,1);
  const material=new T.MeshStandardMaterial({color:0xffffff,roughness:.86,metalness:.006,flatShading:true});
  const blocks=new T.InstancedMesh(geometry,material,768);
  blocks.name="voxel-isopod-domed-tergites";
  blocks.instanceMatrix.setUsage(T.DynamicDrawUsage);
  const dummy=new T.Object3D();
  const platePalette=[0x687764,0x77836d,0x626f5b,0x828d74,0x6d7963,0x5a6853,0x748066];
  const ridgePalette=[0x879574,0x96a27f,0x7f8e6e,0xa1aa83,0x8d9a79,0x758668,0x94a17a];
  const legPalette=[0x55624e,0x68745a,0x7b8261];
  const legIndices=[];
  let count=0;
  const addBlock=(position,color,scale=[unit,unit,unit])=>{
    if(count>=blocks.instanceMatrix.count)throw new Error("El modelo voxel del isópodo superó su capacidad");
    dummy.position.set(...position);
    dummy.scale.set(...scale);
    dummy.rotation.set(0,0,0);
    dummy.updateMatrix();
    blocks.setMatrixAt(count,dummy.matrix);
    blocks.setColorAt(count,new T.Color(color));
    return count++;
  };

  // Seventeen longitudinal slices form an oval hull. The cross-section rises in
  // stepped layers toward the dorsal centre, while each of seven plates changes tone.
  const seamSlices=new Set([-6,-4,-1,1,4,6]);
  for(let ix=-8;ix<=8;ix++){
    const longitudinal=ix/9;
    const taper=Math.sqrt(Math.max(0,1-longitudinal*longitudinal));
    const halfWidth=Math.max(1,Math.round(5.1*taper));
    const plate=Math.max(0,Math.min(6,Math.floor((ix+8)*7/17)));
    const seam=seamSlices.has(ix);
    for(let iz=-halfWidth;iz<=halfWidth;iz++){
      const lateral=Math.abs(iz)/(halfWidth+.55);
      const dome=Math.sqrt(Math.max(0,1-lateral*lateral));
      const edge=Math.abs(iz)===halfWidth;
      addBlock([ix*unit,.011,iz*unit],
        edge?0x53604f:0x64705b,[unit*.96,unit*.72,unit*.96]);
      const layers=1+Math.round(dome*2);
      for(let level=0;level<layers;level++){
        const upper=level===layers-1;
        const color=seam
          ? (upper?0x677462:0x4c5a4d)
          : upper?ridgePalette[plate]:platePalette[plate];
        const y=.029+level*.022;
        addBlock([ix*unit,y,iz*unit],color,[unit*.95,unit*.88,unit*.95]);
      }
    }
  }

  // Cephalon and glossy eyes sit in front of the first tergite.
  for(let ix=9;ix<=10;ix++){
    const width=ix===9?2:1;
    for(let iz=-width;iz<=width;iz++){
      addBlock([ix*unit,.034,iz*unit],0x8f9877,[unit*.92,unit*.85,unit*.9]);
      if(Math.abs(iz)<=1)addBlock([ix*unit,.055,iz*unit],0xa0a381,[unit*.9,unit*.7,unit*.9]);
    }
  }
  for(const side of [-1,1]){
    addBlock([10.65*unit,.048,side*2.05*unit],0x17221b,[unit*.66,unit*.72,unit*.66]);
    // Short, segmented antennae that project forward, not sideways.
    addBlock([11.05*unit,.064,side*2.05*unit],0x948b6f,[unit*.78,unit*.48,unit*.44]);
    addBlock([11.72*unit,.078,side*2.35*unit],0x7c795f,[unit*.72,unit*.42,unit*.4]);
    addBlock([12.25*unit,.09,side*2.72*unit],0xa09272,[unit*.58,unit*.38,unit*.36]);
    // Tail uropods are short paired projections.
    addBlock([-8.65*unit,.01,side*1.35*unit],0x596653,[unit*.78,unit*.55,unit*.62]);
    addBlock([-9.15*unit,-.002,side*1.95*unit],0x485847,[unit*.7,unit*.48,unit*.55]);
  }

  // Seven pairs of three-part walking limbs sit under the lateral shell margin.
  for(let pair=0;pair<7;pair++){
    const xCell=6-pair*2;
    const x=xCell*unit;
    const widthCells=Math.max(2,Math.round(5.1*Math.sqrt(Math.max(0,1-(xCell/9)**2))));
    for(const side of [-1,1]){
      const z=(widthCells+.2)*unit*side;
      const hip=addBlock([x,.008,z],legPalette[pair%legPalette.length],[unit*.72,unit*.68,unit*.72]);
      const knee=addBlock([x-.55*unit,-.006,z+side*.72*unit],legPalette[(pair+1)%legPalette.length],
        [unit*.68,unit*.58,unit*.68]);
      const toe=addBlock([x-1.05*unit,-.016,z+side*1.45*unit],legPalette[(pair+2)%legPalette.length],
        [unit*.58,unit*.48,unit*.58]);
      legIndices.push({hip,knee,toe,x,widthCells,side});
    }
  }

  blocks.count=count;
  blocks.instanceMatrix.needsUpdate=true;
  if(blocks.instanceColor)blocks.instanceColor.needsUpdate=true;
  blocks.castShadow=true;
  blocks.receiveShadow=true;
  root.add(blocks);
  root.userData.voxelBlocks=blocks;
  root.userData.voxelLegIndices=legIndices;
  root.userData.voxelBlockCount=count;
  root.userData.voxelBlockCapacity=blocks.instanceMatrix.count;
  root.userData.baseScale=.74;
  root.scale.setScalar(.74);
  return root;
}

function updateVoxelIsopod(object,phase,moving,curled){
  const blocks=object.userData.voxelBlocks;
  if(!blocks)return;
  const unit=.023,dummy=new T.Object3D();
  for(const leg of object.userData.voxelLegIndices??[]){
    const gait=phase*2.15-leg.hip*.31+leg.side*Math.PI;
    const wave=moving?Math.sin(gait):Math.sin(phase*.28+leg.hip)*.035;
    const lift=moving?Math.max(0,Math.cos(gait))*unit*.72:0;
    const side=leg.side;
    dummy.position.set(leg.x+wave*.012,.008+lift,side*(leg.widthCells+.2)*unit);
    dummy.scale.set(unit*.72,unit*.68,unit*.72);
    dummy.updateMatrix();
    blocks.setMatrixAt(leg.hip,dummy.matrix);
    dummy.position.set(leg.x-.55*unit+wave*.019,-.006+lift*.5,side*(leg.widthCells+.92)*unit);
    dummy.scale.set(unit*.68,unit*.58,unit*.68);
    dummy.updateMatrix();
    blocks.setMatrixAt(leg.knee,dummy.matrix);
    dummy.position.set(leg.x-1.05*unit+wave*.025,-.016+lift*.25,side*(leg.widthCells+1.65)*unit);
    dummy.scale.set(unit*.58,unit*.48,unit*.58);
    dummy.updateMatrix();
    blocks.setMatrixAt(leg.toe,dummy.matrix);
  }
  object.scale.set(
    object.userData.baseScale*(curled?1.06:1),
    object.userData.baseScale*(curled?1.08:1),
    object.userData.baseScale*(curled?1.04:1)
  );
  blocks.instanceMatrix.needsUpdate=true;
}

function isopod(voxel){
  if(voxel)return createVoxelIsopod();
  const root=new T.Group();
  root.userData.isVoxel=false;
  root.userData.baseScale=.74;
  const shellTexture=getIsopodShellTexture();
  const shellMaterial=new T.MeshStandardMaterial({
    color:0xf7f1df,map:shellTexture,vertexColors:true,roughness:.84,metalness:.008
  });
  const headShellMaterial=new T.MeshStandardMaterial({
    color:0xf4eed9,map:shellTexture,roughness:.9,metalness:.002
  });
  const undersideMaterial=mat(0x343d39,.94);
  const edgeMaterial=mat(0x59645d,.84);
  const legMaterial=mat(0x626c59,.86);
  const jointMaterial=mat(0x87917a,.84);
  const eyeMaterial=mat(0x101817,.42);
  const antennaMaterial=mat(0xa49b7b,.82);
  const bumpMaterial=mat(0xa1a58a,.92);

  const carapace=mesh(dorsalCarapaceGeometry(),shellMaterial,[0,0,0]);
  carapace.name="continuous-seven-tergite-carapace";
  root.add(carapace);
  const abdomen=mesh(new T.SphereGeometry(1,22,14),undersideMaterial,[0,.045,0]);
  abdomen.scale.set(.19,.047,.125);
  root.add(abdomen);

  const head=new T.Group();
  head.position.set(.225,.074,0);
  const cephalon=mesh(new T.SphereGeometry(1,20,14),headShellMaterial,[.012,.012,0]);
  cephalon.scale.set(.068,.046,.094);
  head.add(cephalon);
  const eyes=new T.InstancedMesh(new T.SphereGeometry(1,10,8),eyeMaterial,2);
  const dummy=new T.Object3D();
  for(let i=0;i<2;i++){
    dummy.position.set(.052,.021,(i===0?-1:1)*.073);
    dummy.scale.set(.018,.018,.018);
    dummy.updateMatrix();
    eyes.setMatrixAt(i,dummy.matrix);
  }
  eyes.instanceMatrix.needsUpdate=true;
  head.add(eyes);

  const antennae=[];
  for(const side of [-1,1]){
    const pivot=new T.Group();
    pivot.position.set(.052,.018,side*.044);
    const curve=new T.CatmullRomCurve3([
      new T.Vector3(0,0,0),
      new T.Vector3(.04,.018,side*.015),
      new T.Vector3(.09,.044,side*.032),
      new T.Vector3(.135,.055,side*.054)
    ]);
    pivot.add(new T.Mesh(new T.TubeGeometry(curve,16,.0048,6,false),antennaMaterial));
    head.add(pivot);
    antennae.push({pivot,side});
  }
  root.add(head);
  root.userData.headRig=head;
  root.userData.antennae=antennae;

  const tail=mesh(new T.SphereGeometry(1,16,10),edgeMaterial,[-.199,.052,0]);
  tail.scale.set(.058,.031,.075);
  root.add(tail);
  const uropods=new T.InstancedMesh(new T.ConeGeometry(.007,.068,6),jointMaterial,2);
  for(let i=0;i<2;i++){
    const side=i===0?-1:1;
    uropods.setMatrixAt(i,segmentMatrix(
      [-.225,.052,side*.044],
      [-.29,.028,side*.085]
    ));
  }
  uropods.instanceMatrix.needsUpdate=true;
  root.add(uropods);

  const legUpper=new T.InstancedMesh(new T.CylinderGeometry(.013,.017,1,7),legMaterial,14);
  const legLower=new T.InstancedMesh(new T.CylinderGeometry(.009,.013,1,7),jointMaterial,14);
  legUpper.name="fourteen-pereopod-coxae";
  legLower.name="fourteen-pereopod-tibiae";
  legUpper.instanceMatrix.setUsage(T.DynamicDrawUsage);
  legLower.instanceMatrix.setUsage(T.DynamicDrawUsage);
  const legPairs=[];
  for(let i=0;i<7;i++){
    for(const side of [-1,1]){
      const index=i*2+(side===1?1:0),x=.125-i*.041;
      const hip=[x,.076,side*.103],knee=[x-.014,.047,side*.145],toe=[x-.032,.023,side*.194];
      legUpper.setMatrixAt(index,segmentMatrix(hip,knee));
      legLower.setMatrixAt(index,segmentMatrix(knee,toe));
      legPairs.push({index,x,side});
    }
  }
  legUpper.instanceMatrix.needsUpdate=true;
  legLower.instanceMatrix.needsUpdate=true;
  root.add(legUpper,legLower);

  const granules=new T.InstancedMesh(new T.SphereGeometry(1,7,5),bumpMaterial,14);
  let bumpIndex=0;
  for(let i=0;i<7;i++){
    const t=(i+.5)/7,x=(t-.5)*.41;
    const taper=Math.pow(Math.max(0,1-(x/.205)**2),.34);
    for(const side of [-1,1]){
      const z=side*.082*taper;
      const y=.025+.111*Math.sqrt(Math.max(0,1-(z/(.153*taper))**2))*taper+.0015;
      dummy.position.set(x,y,z);
      const size=.0028+(i%3)*.0003;
      dummy.scale.set(size,size*.65,size);
      dummy.rotation.y=(i+bumpIndex)*.42;
      dummy.updateMatrix();
      granules.setMatrixAt(bumpIndex,dummy.matrix);
      bumpIndex++;
    }
  }
  granules.count=bumpIndex;
  granules.instanceMatrix.needsUpdate=true;
  root.add(granules);

  root.userData.carapace=carapace;
  root.userData.dorsalPlateCount=7;
  root.userData.legUpper=legUpper;
  root.userData.legLower=legLower;
  root.userData.legPairs=legPairs;
  root.userData.baseScale=.74;
  root.scale.setScalar(.74);
  root.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;}});
  return root;
}
function updateIsopodRig(object,phase,moving,curled){
  const carapace=object.userData.carapace;
  if(carapace){
    carapace.scale.set(curled?.93:1,curled?1.025:1,curled?.97:1);
    carapace.position.y=.025+(curled?.004:0);
  }

  const upper=object.userData.legUpper,lower=object.userData.legLower;
  if(upper&&lower){
    const pairs=object.userData.legPairs??[];
    for(const leg of pairs){
      const {index,x,side}=leg;
      const wave=moving?Math.sin(phase*2.1-index*.76+side*Math.PI):Math.sin(phase*.32+index)*.05;
      const tuck=curled?1:0;
      const hip=[x,.076,side*.103];
      const knee=[
        x-.014+wave*.02,
        .047+(tuck*.022),
        side*(.145-tuck*.016)
      ];
      const toe=[
        x-.032+wave*.038+(moving?Math.cos(phase*2.1-index*.76+side)*.008:0),
        .023+(tuck*.021),
        side*(.194-tuck*.032)
      ];
      upper.setMatrixAt(index,segmentMatrix(hip,knee));
      lower.setMatrixAt(index,segmentMatrix(knee,toe));
    }
    upper.instanceMatrix.needsUpdate=true;
    lower.instanceMatrix.needsUpdate=true;
  }
  for(const antenna of object.userData.antennae??[]){
    antenna.pivot.rotation.z=Math.sin(phase*.31+antenna.side)*.055;
    antenna.pivot.rotation.y=Math.sin(phase*.22+antenna.side)*.045;
  }
  if(object.userData.headRig){
    object.userData.headRig.position.x=curled?.198:.225;
    object.userData.headRig.rotation.z=curled?-.14:Math.sin(phase*.2)*.008;
  }
}
export class TerrariumRenderer {
  constructor(el,state){
    this.interpolationAlpha=1;
    this.motionQuery=window.matchMedia?.("(prefers-reduced-motion: reduce)")??null;
    this.el=el;
    this.host=el;
    this.state=state;
    this.scene=new T.Scene();
    this.scene.background=new T.Color(0x354238);
    this.scene.fog=new T.Fog(0x354238,15,34);
    const ambientLight=new T.HemisphereLight(0xdfe6d7,0x343a31,1.35);
    this.scene.add(ambientLight);
    const keyLight=new T.DirectionalLight(0xffe2bd,2.75);
    this.keyLight=keyLight;
    keyLight.position.set(-3.5,7,4.5);
    keyLight.castShadow=true;
    keyLight.shadow.mapSize.set(1024,1024);
    this.scene.add(keyLight);
    const fillLight=new T.DirectionalLight(0xb9d1bd,1.05);
    fillLight.position.set(4,3,-4);
    this.scene.add(fillLight);
    const rimLight=new T.DirectionalLight(0xe6e8d9,.62);
    rimLight.position.set(2.5,4,-5.5);
    this.scene.add(rimLight);
    this.camera=new T.PerspectiveCamera(33,1,.1,100);
    this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.65));
    this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=T.PCFSoftShadowMap;
    this.renderer.setClearColor(0x354238,1);
    this.renderer.outputColorSpace=T.SRGBColorSpace;
    this.renderer.toneMapping=T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.16;
    this.renderer.domElement.style.touchAction="none";
    el.appendChild(this.renderer.domElement);
    this.world=new T.Group();
    this.habitat=new T.Group();
    this.life=new T.Group();
    this.resourcesGroup=new T.Group();
    this.weatherGroup=new T.Group();
    this.expeditionGroup=new T.Group();
    this.expeditionGroup.visible=false;
    this.expeditionMode=false;
    this.expeditionViewKind=null;
    this.expeditionHandler=null;
    this.expeditionCameraSnapshot=null;
    this.expeditionActor=null;
    this.ground=new T.Mesh(new T.PlaneGeometry(40,40), new T.MeshStandardMaterial({color:0x3e483c, roughness:.99}));
    this.ground.rotation.x=-Math.PI/2;
    this.ground.position.y=-.2;
    this.world.add(this.ground,this.habitat,this.resourcesGroup,this.life,this.weatherGroup);
    this.scene.add(this.world,this.expeditionGroup);
    this.tool="camera";
    this.selectedTarget=null;
    this.selectionOutline=null;
    this.onSelectionChange=null;
    this.onInteractionStart=null;
    this.onInteractionMove=null;
    this.onInteractionEnd=null;
    this.onWorldAction=null;
    this.angle=.68;
    this.elevation=state.habitat.shape==="cilindrico"?.68:state.habitat.shape==="esferico"?.78:.72;
    this.distance=6.8;
    this.userAdjustedCamera=false;
    this.resourceSignature="";
    this.bind();
    this.resizeObserver=new ResizeObserver(()=>this.resize());
    this.resizeObserver.observe(this.host);
    this.cameraUpdate();
    this.setShape(state.habitat.shape);
    this.setMode(state.presentation.mode);
    this.setWeather(state.habitat.weather??"clear");
    this.resize();
    this.draw();
  }

  bind(){
    const c=this.renderer.domElement;
    const pointers=new Map();
    const raycaster=new T.Raycaster();
    const pointer=new T.Vector2();
    const groundPlane=new T.Plane(new T.Vector3(0,1,0),-.19);
    let interaction=null;
    let expeditionTap=null;
    let drag=null;
    let pinchDistance=null;

    const projectGround=e=>{
      const rect=c.getBoundingClientRect();
      pointer.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
      raycaster.setFromCamera(pointer,this.camera);
      const point=new T.Vector3();
      return raycaster.ray.intersectPlane(groundPlane,point)?point:null;
    };
    const targetAt=e=>{
      const rect=c.getBoundingClientRect();
      pointer.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
      raycaster.setFromCamera(pointer,this.camera);
      const roots=[...this.life.children,...this.resourcesGroup.children];
      for(const hit of raycaster.intersectObjects(roots,true)){
        let node=hit.object;
        while(node){
          if(node.userData?.entityId)return {kind:"entity",id:node.userData.entityId,object:node};
          if(node.userData?.resourceId)return {kind:"resource",id:node.userData.resourceId,object:node};
          node=node.parent;
        }
      }
      return null;
    };
    const expeditionTargetAt=e=>{
      const rect=c.getBoundingClientRect();
      pointer.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);
      raycaster.setFromCamera(pointer,this.camera);
      // Solo las hitboxes explícitas reciben interacción. La geometría decorativa
      // del bioma no debe interceptar el rayo ni seleccionar otro nodo por delante.
      const targets=[];
      this.expeditionGroup.traverse(object=>{
        if(object.isMesh&&(object.userData?.expeditionNodeId||object.userData?.expeditionChoiceId))targets.push(object);
      });
      for(const hit of raycaster.intersectObjects(targets,false)){
        const target=hit.object.userData;
        if(target.expeditionNodeId)return {kind:"node",id:target.expeditionNodeId};
        if(target.expeditionChoiceId)return {kind:"choice",id:target.expeditionChoiceId};
      }
      return null;
    };
    const zoomBy=delta=>{
      this.distance=T.MathUtils.clamp(this.distance+delta,3.1,24);
      this.userAdjustedCamera=true;
      this.cameraUpdate();
    };

    c.style.touchAction="none";

    c.addEventListener("pointerdown",e=>{
      if(e.pointerType==="mouse" && e.button!==0) return;
      if(this.expeditionMode){
        const target=expeditionTargetAt(e);
        c.dataset.expeditionLastPointerTarget=target?target.kind+":"+target.id:"none";
        expeditionTap={pointerId:e.pointerId,target,x:e.clientX,y:e.clientY,moved:false};
        pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
        if(pointers.size===1)drag={x:e.clientX,y:e.clientY,id:e.pointerId};
        if(pointers.size===2){const pts=[...pointers.values()];pinchDistance=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);}
        c.setPointerCapture?.(e.pointerId);
        e.preventDefault();
        return;
      }
      if(this.tool==="leaf-litter"||this.tool==="shelter"){
        const point=projectGround(e);
        if(point)this.onWorldAction?.(this.tool,point.x,point.z);
        e.preventDefault();
        return;
      }
      if(this.tool==="hand"){
        if(e.shiftKey)return;
        const target=targetAt(e);
        if(!target){
          this.clearSelection();
          return;
        }
        const alreadySelected=this.selectedTarget?.kind===target.kind&&this.selectedTarget?.id===target.id;
        if(!alreadySelected){
          this.selectTarget(target.object,target.kind,target.id);
          e.preventDefault();
          return;
        }
        const point=projectGround(e);
        interaction={
          pointerId:e.pointerId,
          kind:target.kind,
          id:target.id,
          startX:point?.x,
          startZ:point?.z,
          moved:false
        };
        c.setPointerCapture?.(e.pointerId);
        if(target.kind==="entity")this.onInteractionStart?.(interaction);
        e.preventDefault();
        return;
      }
      if(this.tool!=="camera")return;
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pointers.size===1){
        drag={x:e.clientX,y:e.clientY,id:e.pointerId};
      }
      if(pointers.size===2){
        const pts=[...pointers.values()];
        pinchDistance=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
      }
    });

    c.addEventListener("pointermove",e=>{
      if(interaction?.pointerId===e.pointerId){
        const point=projectGround(e);
        if(point){
          if(Number.isFinite(interaction.startX)&&Math.hypot(point.x-interaction.startX,point.z-interaction.startZ)>.025)interaction.moved=true;
          this.onInteractionMove?.(interaction,point.x,point.z);
        }
        e.preventDefault();
        return;
      }
      if(!pointers.has(e.pointerId))return;
      if(expeditionTap?.pointerId===e.pointerId&&Math.hypot(e.clientX-expeditionTap.x,e.clientY-expeditionTap.y)>6)expeditionTap.moved=true;
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});

      if(pointers.size===2){
        const pts=[...pointers.values()];
        const nextDistance=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
        if(pinchDistance!==null){
          const delta=-(nextDistance-pinchDistance)*0.015;
          zoomBy(delta);
        }
        pinchDistance=nextDistance;
        drag=null;
        return;
      }

      if(drag && drag.id===e.pointerId){
        const dx=e.clientX-drag.x;
        const dy=e.clientY-drag.y;
        drag.x=e.clientX;
        drag.y=e.clientY;
        this.angle -= dx * 0.006;
        this.elevation = T.MathUtils.clamp(this.elevation + dy * 0.004, 0.25, 1.2);
        this.userAdjustedCamera=true;
        this.cameraUpdate();
      }
    });

    c.addEventListener("pointerup",e=>{
      if(interaction?.pointerId===e.pointerId){const completed=interaction;interaction=null;this.onInteractionEnd?.(completed);return;}
      if(expeditionTap?.pointerId===e.pointerId){const completed=expeditionTap;expeditionTap=null;if(!completed.moved&&completed.target){c.dataset.expeditionLastActivated=completed.target.kind+":"+completed.target.id;this.expeditionHandler?.(completed.target);}else if(!completed.moved){c.dataset.expeditionLastActivated="none";}}
      pointers.delete(e.pointerId);
      if(pointers.size<2) pinchDistance=null;
      if(pointers.size===0) drag=null;
    });

    c.addEventListener("pointercancel",()=>{
      if(interaction)this.onInteractionEnd?.(interaction);
      interaction=null;
      expeditionTap=null;
      pointers.clear();
      drag=null;
      pinchDistance=null;
    });

    c.addEventListener("wheel",e=>{
      e.preventDefault();
      zoomBy(-e.deltaY*0.006);
    },{passive:false});
  }

  setHost(host){
    if(!host)throw new TypeError("Se requiere un contenedor para el diorama");
    if(this.host===host&&this.renderer.domElement.parentElement===host){this.resize();return;}
    this.resizeObserver?.unobserve(this.host);
    this.host=host;
    if(this.renderer.domElement.parentElement!==host)host.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.width="100%";
    this.renderer.domElement.style.height="100%";
    this.resizeObserver?.observe(host);
    this.resize();
  }

  setExpeditionInteractionHandler(handler){
    this.expeditionHandler=typeof handler==="function"?handler:null;
  }

  setExpeditionView(kind,data={}){
    if(kind!=="map"&&kind!=="level")throw new Error("Vista de expedición desconocida: "+kind);
    if(!this.expeditionMode){
      this.expeditionCameraSnapshot={angle:this.angle,elevation:this.elevation,distance:this.distance,fov:this.camera.fov,userAdjustedCamera:this.userAdjustedCamera,background:this.scene.background.clone(),fog:this.scene.fog.color.clone(),fogNear:this.scene.fog.near,fogFar:this.scene.fog.far,keyIntensity:this.keyLight.intensity};
      this.world.visible=false;
      this.expeditionGroup.visible=true;
      this.expeditionMode=true;
    }
    this.clear(this.expeditionGroup);
    const makeIsopod=()=>isopod(this.state.presentation.mode==="voxel");
    const portrait=this.isExpeditionPortrait();
    const scene=kind==="map"
      ?buildExpeditionMapDiorama(T,{...data,aspect:portrait?0.65:this.camera.aspect,makeIsopod})
      :buildExpeditionLevelDiorama(T,{...data,aspect:portrait?0.65:this.camera.aspect,makeIsopod});
    this.expeditionGroup.add(scene);
    this.expeditionViewKind=kind;
    this.expeditionActor=scene.getObjectByName("expedition-isopod");
    this.camera.fov=54;
    this.camera.updateProjectionMatrix();
    this.angle=portrait?0:(kind==="map"?.58:.68);
    this.elevation=portrait?(kind==="map"?1.05:1.0):(kind==="map"?.78:.72);
    this.distance=Math.max(this.fitDistance(),kind==="map"?4.45:3.35);
    this.userAdjustedCamera=false;
    this.scene.background.setHex(kind==="map"?0x293c2c:0x344330);
    this.scene.fog.color.setHex(kind==="map"?0x293c2c:0x344330);
    this.scene.fog.near=kind==="map"?9:7;
    this.scene.fog.far=kind==="map"?24:19;
    this.keyLight.intensity=kind==="map"?2.55:2.8;
    const canvas=this.renderer.domElement;
    canvas.dataset.expeditionMapPositions=JSON.stringify(scene.userData.mapPositions??{});
    canvas.dataset.expeditionView=kind;
    canvas.dataset.expeditionPortrait=String(this.isExpeditionPortrait());
    canvas.dataset.expeditionSurface=scene.userData.surfaceType??"unknown";
    canvas.dataset.expeditionTrailCount=String(scene.userData.expeditionTrailCount??0);
    canvas.dataset.expeditionLandmarkCount=String(scene.userData.landmarkCount??0);
    canvas.dataset.expeditionLockedNodeCount=String(scene.userData.lockedNodeCount??0);
    canvas.dataset.expeditionUnlockedNodeCount=String((scene.userData.landmarkCount??0)-(scene.userData.lockedNodeCount??0));
    canvas.dataset.expeditionActorScale=String(this.expeditionActor?.scale.x??0);
    canvas.dataset.expeditionFov=this.camera.fov.toFixed(2);
    canvas.dataset.expeditionNodeCount=String(Object.keys(data.nodes??{}).length);
    canvas.dataset.expeditionInteractionTargets=String(scene.userData.expeditionScene==="level"?scene.children.filter(child=>child.userData?.expeditionChoiceId).length:scene.children.filter(child=>child.userData?.expeditionNodeId).length);
    this.cameraUpdate();
    this.resize();
  }

  syncExpeditionTargetScreens(){
    if(!this.expeditionMode)return;
    const canvas=this.renderer.domElement,rect=canvas.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    this.camera.updateMatrixWorld(true);
    this.expeditionGroup.updateMatrixWorld(true);
    const screens={};
    const point=new T.Vector3();
    this.expeditionGroup.traverse(object=>{
      const id=object.userData?.expeditionNodeId??object.userData?.expeditionChoiceId;
      if(!object.isMesh||!id)return;
      object.getWorldPosition(point);
      point.project(this.camera);
      screens[id]={
        x:rect.left+(point.x+1)*rect.width/2,
        y:rect.top+(1-point.y)*rect.height/2,
        visible:point.z>=-1&&point.z<=1&&Math.abs(point.x)<=1&&Math.abs(point.y)<=1
      };
    });
    canvas.dataset.expeditionTargetScreens=JSON.stringify(screens);
  }

  showTerrarium(){
    if(!this.expeditionMode)return;
    this.clear(this.expeditionGroup);
    this.expeditionGroup.visible=false;
    this.world.visible=true;
    this.expeditionMode=false;
    this.expeditionViewKind=null;
    this.expeditionActor=null;
    this.expeditionHandler=null;
    const snapshot=this.expeditionCameraSnapshot;
    if(snapshot){
      this.angle=snapshot.angle;this.elevation=snapshot.elevation;this.distance=snapshot.distance;this.camera.fov=snapshot.fov??33;this.camera.updateProjectionMatrix();this.userAdjustedCamera=snapshot.userAdjustedCamera;
      this.scene.background.copy(snapshot.background);this.scene.fog.color.copy(snapshot.fog);
      this.scene.fog.near=snapshot.fogNear;this.scene.fog.far=snapshot.fogFar;this.keyLight.intensity=snapshot.keyIntensity;
    }
    this.expeditionCameraSnapshot=null;
    this.renderer.domElement.dataset.expeditionView="terrarium";
    this.cameraUpdate();
    this.syncEntities();this.syncResources();
  }

  setTool(tool){
    if(!new Set(["camera","hand","leaf-litter","shelter"]).has(tool))throw new Error("Herramienta desconocida: "+tool);
    if(tool!=="hand")this.clearSelection();
    this.tool=tool;
    this.renderer.domElement.dataset.activeTool=tool;
  }

  clearSelection(){
    const selected=this.selectedTarget,outline=this.selectionOutline;
    if(outline){
      selected?.object?.remove(outline);
      outline.traverse(node=>{
        if(node.isMesh&&node.material){
          for(const material of (Array.isArray(node.material)?node.material:[node.material]))material.dispose?.();
        }
      });
    }
    this.selectedTarget=null;
    this.selectionOutline=null;
    this.renderer.domElement.dataset.selectedTarget="none";
    this.renderer.domElement.dataset.selectionOutline="none";
    this.onSelectionChange?.(null);
  }

  selectTarget(object,kind,id){
    if(this.selectedTarget?.kind===kind&&this.selectedTarget?.id===id)return;
    this.clearSelection();
    const outline=object.clone(true);
    outline.name="selection-outline-"+kind+"-"+id;
    outline.position.set(0,0,0);
    outline.rotation.set(0,0,0);
    // Expand the actual shell silhouette; flat entrance discs are excluded.
    outline.scale.setScalar(1.14);
    outline.userData.selectionOutline=true;
    let excludedMeshes=0;
    outline.traverse(node=>{
      if(node.name?.includes("entrance")){
        node.visible=false;
        excludedMeshes++;
      }
      if(node.isMesh){
        const makeMaterial=()=>new T.MeshBasicMaterial({
          color:0xffd76c,side:T.BackSide,transparent:false,opacity:1,
          depthTest:false,depthWrite:false,toneMapped:false
        });
        node.material=Array.isArray(node.material)?node.material.map(makeMaterial):makeMaterial();
        node.castShadow=false;
        node.receiveShadow=false;
        node.renderOrder=1000;
      }
      node.raycast=()=>{};
    });
    object.add(outline);
    this.selectedTarget={kind,id,object};
    this.selectionOutline=outline;
    this.renderer.domElement.dataset.selectedTarget=kind+":"+id;
    this.renderer.domElement.dataset.selectionOutline="3d-inverted-hull";
    this.renderer.domElement.dataset.selectionOutlineScale="1.14";
    this.renderer.domElement.dataset.selectionOutlineDepthTest="false";
    this.renderer.domElement.dataset.selectionOutlineExcludedMeshes=String(excludedMeshes);
    this.onSelectionChange?.({kind,id});
  }

  setWeather(weather){
    const kind=new Set(["clear","mist","rain"]).has(weather)?weather:"clear";
    this.weather=kind;
    this.clear(this.weatherGroup);
    this.weatherState=null;
    const tones={clear:0x354238,mist:0x465346,rain:0x293a3a};
    this.scene.background.setHex(tones[kind]);
    this.scene.fog.color.setHex(tones[kind]);
    this.keyLight.intensity=kind==="rain"?2.05:kind==="mist"?2.35:2.75;
    if(kind==="mist"){
      for(let i=0;i<7;i++){
        const cloud=new T.Mesh(
          new T.SphereGeometry(1,14,9),
          new T.MeshBasicMaterial({color:0xd5ddc9,transparent:true,opacity:.075+(i%3)*.018,depthWrite:false})
        );
        cloud.scale.set(.62+(i%2)*.2,.075,.28+(i%3)*.05);
        cloud.position.set(Math.sin(i*2.13)*.72,.42+(i%3)*.075,Math.cos(i*1.71)*.48);
        cloud.userData.baseX=cloud.position.x;
        cloud.userData.baseZ=cloud.position.z;
        cloud.userData.phase=i*.8;
        this.weatherGroup.add(cloud);
      }
    }else if(kind==="rain"){
      const count=54,positions=new Float32Array(count*6),seeds=[];
      const random=rng(0x4a17+count);
      for(let i=0;i<count;i++){
        const x=(random()-.5)*3.25,z=(random()-.5)*2.3,y=.28+random()*.95;
        seeds.push({x,z,y,phase:random()});
        const offset=i*6;
        positions[offset]=x;positions[offset+1]=y;positions[offset+2]=z;
        positions[offset+3]=x-.022;positions[offset+4]=y-.105;positions[offset+5]=z;
      }
      const geometry=new T.BufferGeometry();
      geometry.setAttribute("position",new T.BufferAttribute(positions,3));
      const drops=new T.LineSegments(geometry,new T.LineBasicMaterial({color:0xb8d1d2,transparent:true,opacity:.34}));
      drops.frustumCulled=false;
      this.weatherGroup.add(drops);
      this.weatherState={kind:"rain",geometry,positions,seeds};
    }
    this.renderer.domElement.dataset.weather=kind;
    this.renderer.domElement.dataset.weatherObjects=String(this.weatherGroup.children.length);
  }

  updateWeather(time){
    const motionAllowed=this.state.running&&!this.motionQuery?.matches;
    this.renderer.domElement.dataset.weatherMotion=motionAllowed?"running":"static";
    if(!motionAllowed)return;
    if(this.weather==="mist"){
      for(const cloud of this.weatherGroup.children){
        cloud.position.x=cloud.userData.baseX+Math.sin(time*.18+cloud.userData.phase)*.12;
        cloud.position.z=cloud.userData.baseZ+Math.cos(time*.14+cloud.userData.phase)*.08;
      }
    }else if(this.weatherState?.kind==="rain"){
      const {positions,seeds,geometry}=this.weatherState;
      for(let i=0;i<seeds.length;i++){
        const seed=seeds[i],offset=i*6;
        const y=.28+((seed.y-.28-(time*.48+seed.phase)%1.05+1.05)%1.05);
        positions[offset]=seed.x;positions[offset+1]=y;positions[offset+2]=seed.z;
        positions[offset+3]=seed.x-.022;positions[offset+4]=y-.105;positions[offset+5]=seed.z;
      }
      geometry.attributes.position.needsUpdate=true;
    }
  }

  fitDistance(){
    if(this.expeditionMode){
      const portrait=this.isExpeditionPortrait();
      const halfWidth=this.expeditionViewKind==="map"?(portrait?1.62:2.85):(portrait?1.42:1.95);
      const halfHeight=this.expeditionViewKind==="map"?(portrait?2.62:2.05):(portrait?1.8:1.42);
      const verticalFov=T.MathUtils.degToRad(this.camera.fov);
      const horizontalFov=2*Math.atan(Math.tan(verticalFov/2)*Math.max(this.camera.aspect,.1));
      return Math.max(3.05,halfWidth/Math.tan(horizontalFov/2),halfHeight/Math.tan(verticalFov/2))*1.045;
    }
    const shape=this.state.habitat.shape;
    const spec=HABITAT_GEOMETRY[shape];
    const round=shape!=="rectangular";
    const halfWidth=round?spec.outerRadius:Math.max(spec.outerWidth,3.6)/2;
    const halfDepth=round?spec.outerRadius:Math.max(spec.outerDepth,2.4)/2;
    const projectedHalfWidth=round?halfWidth:Math.abs(Math.cos(this.angle))*halfWidth+Math.abs(Math.sin(this.angle))*halfDepth;
    const projectedGroundHalfHeight=round?halfWidth*Math.abs(Math.sin(this.elevation)):(Math.abs(Math.sin(this.angle))*halfWidth+Math.abs(Math.cos(this.angle))*halfDepth)*Math.abs(Math.sin(this.elevation));
    const projectedHalfHeight=shape==="esferico"?spec.outerRadius+.12:projectedGroundHalfHeight+(spec.wallHeight/2+.34)*Math.abs(Math.cos(this.elevation));
    const verticalFov=T.MathUtils.degToRad(this.camera.fov);
    const horizontalFov=2*Math.atan(Math.tan(verticalFov/2)*Math.max(this.camera.aspect,.1));
    const horizontalDistance=projectedHalfWidth/Math.tan(horizontalFov/2);
    const verticalDistance=projectedHalfHeight/Math.tan(verticalFov/2);
    return Math.max(4.4,horizontalDistance,verticalDistance)*1.12;
  }

  cameraUpdate(){
    if(this.expeditionMode){
      const target=new T.Vector3(0,.2,0),horizontal=Math.cos(this.elevation)*this.distance;
      this.camera.position.set(Math.sin(this.angle)*horizontal,target.y+Math.sin(this.elevation)*this.distance,Math.cos(this.angle)*horizontal);
      this.camera.lookAt(target);
      this.scene.fog.near=Math.max(7,this.distance*1.18);this.scene.fog.far=Math.max(18,this.distance*2.75);
      this.renderer.domElement.dataset.cameraDistance=this.distance.toFixed(2);
      this.renderer.domElement.dataset.cameraFitDistance=this.fitDistance().toFixed(2);
      this.renderer.domElement.dataset.cameraElevation=this.elevation.toFixed(2);
      this.renderer.domElement.dataset.cameraAngle=this.angle.toFixed(4);
      this.renderer.domElement.dataset.fogNear=this.scene.fog.near.toFixed(2);
      this.renderer.domElement.dataset.fogFar=this.scene.fog.far.toFixed(2);
      this.syncExpeditionTargetScreens();
      return;
    }
    const target=new T.Vector3(0,this.state.habitat.shape==="esferico"?.84:.32,0);
    const horizontal=Math.cos(this.elevation)*this.distance;
    this.camera.position.set(
      Math.sin(this.angle)*horizontal,
      target.y + Math.sin(this.elevation)*this.distance,
      Math.cos(this.angle)*horizontal
    );
    this.camera.lookAt(target);
    this.renderer.domElement.dataset.cameraFov=this.camera.fov.toFixed(2);
    // El fit móvil puede alejar la cámara más allá de la niebla fija original (8–17).
    // Escalar el rango evita que un recipiente bien encuadrado desaparezca en el fondo.
    this.scene.fog.near=Math.max(8,this.distance*1.2);
    this.scene.fog.far=Math.max(17,this.distance*2.6);
    this.renderer.domElement.dataset.cameraDistance=this.distance.toFixed(2);
    this.renderer.domElement.dataset.cameraFitDistance=this.fitDistance().toFixed(2);
    this.renderer.domElement.dataset.cameraElevation=this.elevation.toFixed(2);
    this.renderer.domElement.dataset.cameraAngle=this.angle.toFixed(4);
    this.renderer.domElement.dataset.fogNear=this.scene.fog.near.toFixed(2);
    this.renderer.domElement.dataset.fogFar=this.scene.fog.far.toFixed(2);
  }

  zoom(delta){
    this.distance=T.MathUtils.clamp(this.distance+delta,3.1,24);
    this.userAdjustedCamera=true;
    this.cameraUpdate();
  }

  resetCamera(){
    if(this.expeditionMode){
      const portrait=this.isExpeditionPortrait();
      this.angle=portrait?0:(this.expeditionViewKind==="map"?.58:.68);
      this.elevation=portrait?1.05:(this.expeditionViewKind==="map"?.78:.72);
      this.userAdjustedCamera=false;
      this.distance=Math.max(this.expeditionViewKind==="map"?4.45:3.35,this.fitDistance());
      this.cameraUpdate();
      return;
    }
    this.angle=.68;
    this.elevation=this.state.habitat.shape==="cilindrico"?.68:this.state.habitat.shape==="esferico"?.78:.72;
    this.userAdjustedCamera=false;
    this.distance=Math.max(6.8,this.fitDistance());
    this.cameraUpdate();
  }

  clear(group){
    const geometries=new Set(),materials=new Set(),textures=new Set();
    const disposeKit=node=>{
      const dispose=node?.userData?.dioramaKitDispose;
      if(typeof dispose==="function"){
        delete node.userData.dioramaKitDispose;
        dispose();
      }
    };
    disposeKit(group);
    for(const child of [...group.children]){
      group.remove(child);
      child.traverse(object=>{
        disposeKit(object);
        if(object.geometry)geometries.add(object.geometry);
        if(object.material){
          const list=Array.isArray(object.material)?object.material:[object.material];
          for(const material of list){
            materials.add(material);
            for(const value of Object.values(material)){
              if(value?.isTexture&&value!==isopodShellTexture)textures.add(value);
            }
          }
        }
      });
    }
    for(const texture of textures)texture.dispose();
    for(const material of materials)material.dispose();
    for(const geometry of geometries)geometry.dispose();
  }

  terrain(shape){
    if(shape !== "rectangular"){
      const g=new T.CircleGeometry(HABITAT_GEOMETRY[shape].floorRadius,56);
      const p=g.attributes.position;
      for(let i=0;i<p.count;i++){
        const x=p.getX(i), z=p.getY(i);
        const r=Math.hypot(x,z), a=Math.atan2(z,x);
        p.setXYZ(i, Math.cos(a)*r, 0, Math.sin(a)*r);
      }
      g.computeVertexNormals();
      return g;
    }
    return new T.BoxGeometry(3.6, .15, 2.4);
  }

  addLeaf(x,z,s,a,c){
    const o=mesh(new T.SphereGeometry(1,9,6), mat(c,.98), [x,.22+s*.012,z]);
    o.scale.set(s, .012+s*.004, s*.43);
    o.rotation.y=a;
    this.habitat.add(o);
  }

  addFern(x,z,size,seed){
    const r=rng(seed);
    const stem=mat(0x62794b), leaf=mat(0x81955c), young=mat(0xa6b17a);
    rod(this.habitat,[x,.22,z],[x+.035*size,.22+size,z-.015*size],.012*size,stem);
    for(let i=0;i<5;i++){
      const t=(i+1)/6;
      const px=x+Math.cos(i*.8)*.08*size;
      const pz=z+Math.sin(i*.8)*.08*size;
      const p=mesh(new T.SphereGeometry(1,8,6), (i%2?leaf:young), [px,.22+size*.38*(0.8+t),pz]);
      p.scale.set(.09*size, .18*size, .04*size);
      p.rotation.y=i * 0.7;
      this.habitat.add(p);
    }
  }

  addMushrooms(x,z,size){
    const stem=mat(0xd7d0b4), cap=mat(0xc2b58b), dark=mat(0x877a58);
    for(let i=0;i<3;i++){
      const dx=(i-1)*.055*size;
      const dz=(i%2)*.045*size;
      const h=(.065+i%2*.035)*size;
      this.habitat.add(mesh(new T.CylinderGeometry(.02*size,.028*size,h,6),stem,[x+dx,.15+ h/2,z+dz]));
      this.habitat.add(mesh(new T.SphereGeometry(.06*size,10,8), i%2 ? cap : dark, [x+dx,.15 + h + .03*size, z+dz]));
    }
  }

  addMossPatch(x,z,radius,seed){
    const random=rng(seed);
    const mats=[mat(0x536d3f,.98),mat(0x6e854b,.99),mat(0x82935a,.98),mat(0x425d36,.99)];
    const count=8+Math.floor(random()*7);
    for(let i=0;i<count;i++){
      const a=random()*Math.PI*2;
      const r=random()*radius;
      const pos=[x + Math.cos(a)*r, .2 + random()*0.04, z + Math.sin(a)*r];
      const o=mesh(new T.SphereGeometry(.08 + random()*0.12, 6, 5), mats[i % mats.length], pos);
      o.scale.set(1.6, .35, 1.15);
      this.habitat.add(o);
    }
  }

  setShape(shape){
    this.clear(this.habitat);
    this.resourceSignature="";
    const spec=HABITAT_GEOMETRY[shape];
    if(!spec)throw new Error("Forma de terrario desconocida: "+shape);
    const glass=(opacity=.1)=>new T.MeshStandardMaterial({
      color:0xcbdccb,transparent:true,opacity,roughness:.22,
      metalness:.015,side:T.DoubleSide,depthWrite:false
    });
    const frame=mat(0x69765f,.42,{metalness:.025});
    const timber=mat(0x493323,.88);
    const timberEdge=mat(0x9c754a,.7);
    const round=shape!=="rectangular";
    const baseGlass=round
      ? mesh(new T.CylinderGeometry(spec.outerRadius,spec.outerRadius,.06,64),glass(.11),[0,-.055,0])
      : mesh(new T.BoxGeometry(spec.outerWidth,.06,spec.outerDepth),glass(.11),[0,-.055,0]);
    this.habitat.add(baseGlass);
    const baseScale=1.04,baseThickness=.09,baseY=-.125;
    const baseTop=baseY+baseThickness/2,baseBottom=baseY-baseThickness/2;
    const plinth=round
      ? mesh(new T.CylinderGeometry(spec.outerRadius*baseScale,spec.outerRadius*1.055,baseThickness,64),timber,[0,baseY,0])
      : mesh(new T.BoxGeometry(spec.outerWidth*baseScale,baseThickness,spec.outerDepth*baseScale),timber,[0,baseY,0]);
    this.habitat.add(plinth);
    this.renderer.domElement.dataset.containerBaseStyle="slim-support";
    this.renderer.domElement.dataset.containerBaseThickness=String(baseThickness);
    this.renderer.domElement.dataset.containerBaseScale=String(baseScale);
    if(round){
      const foot=mesh(new T.TorusGeometry(spec.outerRadius*baseScale,.01,8,64),timberEdge,[0,baseBottom,0]);
      foot.rotation.x=Math.PI/2;
      const upper=mesh(new T.TorusGeometry(spec.outerRadius*1.015,.008,7,64),frame,[0,baseTop,0]);
      upper.rotation.x=Math.PI/2;
      this.habitat.add(foot,upper);
    }else{
      const baseWidth=spec.outerWidth*baseScale,baseDepth=spec.outerDepth*baseScale;
      this.habitat.add(
        mesh(new T.BoxGeometry(baseWidth,.012,.018),timberEdge,[0,baseBottom,spec.outerDepth*.52]),
        mesh(new T.BoxGeometry(baseWidth,.012,.018),timberEdge,[0,baseBottom,-spec.outerDepth*.52]),
        mesh(new T.BoxGeometry(.018,.012,baseDepth),timberEdge,[spec.outerWidth*.52,baseBottom,0]),
        mesh(new T.BoxGeometry(.018,.012,baseDepth),timberEdge,[-spec.outerWidth*.52,baseBottom,0])
      );
    }

    const interior=buildWoodlandInterior(shape,spec);
    this.habitat.add(interior);
    this.renderer.domElement.dataset.artVersion=interior.userData.visualStats.version;
    this.renderer.domElement.dataset.sceneSeed=String(interior.userData.visualStats.seed);
    this.renderer.domElement.dataset.terrainLayerCount=String(interior.userData.visualStats.substrateLayers);
    this.renderer.domElement.dataset.leafCount=String(interior.userData.visualStats.leafInstances);
    this.renderer.domElement.dataset.fernLeaves=String(interior.userData.visualStats.fernLeaves);
    this.renderer.domElement.dataset.mossCount=String(interior.userData.visualStats.mossPillows);
    this.renderer.domElement.dataset.mossBlades=String(interior.userData.visualStats.mossBlades);
    this.renderer.domElement.dataset.terrainRelief=String(interior.userData.visualStats.terrainRelief);

    const floorTop=.19,wallY=floorTop+spec.wallHeight/2,rimY=floorTop+spec.wallHeight;
    const cylinderGlassOpacity=.12,cylinderReflectionOpacity=.38;
    const wallMaterial=shape==="cilindrico"
      ? new T.MeshPhysicalMaterial({
          color:0xdde8e4,transparent:true,opacity:cylinderGlassOpacity,roughness:.1,
          metalness:.012,clearcoat:1,clearcoatRoughness:.075,
          side:T.DoubleSide,depthWrite:false
        })
      : glass(.065);
    const highlight=new T.MeshBasicMaterial({color:0xe4eee9,transparent:true,opacity:.25,depthWrite:false});
    const cylinderReflection=new T.MeshBasicMaterial({
      color:0xe4eee9,transparent:true,opacity:cylinderReflectionOpacity,depthWrite:false
    });
    if(shape==="esferico"){
      const centerY=floorTop+Math.sqrt(spec.outerRadius**2-spec.floorRadius**2);
      const cutAngle=Math.acos((floorTop-centerY)/spec.outerRadius);
      const globeGeometry=new T.SphereGeometry(spec.outerRadius,64,48,0,Math.PI*2,0,cutAngle);
      const globe=mesh(globeGeometry,glass(.055),[0,centerY,0]);
      globe.renderOrder=5;
      this.habitat.add(globe);
      const points=[];
      for(let i=0;i<=28;i++){
        const t=-.72+i/28*1.44,x=-spec.outerRadius*.34;
        const y=centerY+Math.sin(t)*spec.outerRadius*.94;
        const z=Math.sqrt(Math.max(.01,spec.outerRadius**2-x*x-(y-centerY)**2))*1.002;
        points.push([x,y,z]);
      }
      const shine=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),36,.008,5,false),highlight);
      this.habitat.add(shine);
      const foot=mesh(new T.TorusGeometry(spec.floorRadius*1.035,.022,10,64),frame,[0,floorTop-.035,0]);
      foot.rotation.x=Math.PI/2;
      this.habitat.add(foot);
      this.renderer.domElement.dataset.containerGlobeFloorRadius=String(spec.floorRadius);
      this.renderer.domElement.dataset.containerGlobeTop=String(centerY+spec.outerRadius);
      this.renderer.domElement.dataset.containerGlobeCut="flat-base";
      this.renderer.domElement.dataset.containerRimStyle="spherical-shell";
      this.renderer.domElement.dataset.containerWallCount="1";
      this.renderer.domElement.dataset.containerKind="spherical-globe";
    }else if(shape==="cilindrico"){
      this.habitat.add(mesh(
        new T.CylinderGeometry(spec.outerRadius,spec.outerRadius,spec.wallHeight,64,1,true),
        wallMaterial,[0,wallY,0]
      ));
      const rimRadius=spec.outerRadius-spec.wallThickness/2;
      const glassLip=new T.MeshPhysicalMaterial({
        color:0xdde8e4,transparent:true,opacity:.42,roughness:.13,
        metalness:.005,clearcoat:.95,clearcoatRoughness:.08,
        side:T.DoubleSide,depthWrite:false
      });
      const rimThickness=.0055;
      const rim=new T.Mesh(new T.TorusGeometry(rimRadius,rimThickness,8,96),glassLip);
      rim.name="cylinder-full-glass-rim";
      rim.position.y=rimY;
      rim.rotation.x=Math.PI/2;
      this.habitat.add(rim);

      const innerFoot=new T.Mesh(
        new T.TorusGeometry(spec.floorRadius-.012,.005,6,80),
        highlight
      );
      innerFoot.position.y=floorTop+.012;
      innerFoot.rotation.x=Math.PI/2;
      this.habitat.add(innerFoot);

      const cameraAzimuth=Math.atan2(Math.cos(this.angle),Math.sin(this.angle));
      for(const side of [-1,1]){
        const angle=cameraAzimuth+side*.43;
        const x=Math.cos(angle)*rimRadius*1.002;
        const z=Math.sin(angle)*rimRadius*1.002;
        const curve=new T.CatmullRomCurve3([
          new T.Vector3(x,floorTop+.08,z),
          new T.Vector3(x*1.004,floorTop+spec.wallHeight*.34,z*1.004),
          new T.Vector3(x*1.002,rimY-.12,z*1.002)
        ]);
        const reflection=new T.Mesh(new T.TubeGeometry(curve,28,.0055,6,false),cylinderReflection);
        reflection.name="cylinder-glass-reflection";
        this.habitat.add(reflection);
      }
      this.renderer.domElement.dataset.containerRimStyle="full-circle-glass-rim";
      this.renderer.domElement.dataset.containerRimTreatment="pale-clear-glass-edge";
      this.renderer.domElement.dataset.containerRimThickness=String(rimThickness);
      this.renderer.domElement.dataset.containerGlassTreatment="clearcoat-wall-reflections";
      this.renderer.domElement.dataset.containerGlassWallOpacity=String(cylinderGlassOpacity);
      this.renderer.domElement.dataset.containerGlassReflectionOpacity=String(cylinderReflectionOpacity);
      this.renderer.domElement.dataset.containerWallCount="1";
      this.renderer.domElement.dataset.containerKind="cylindrical-jar";
    }else{
      const halfW=spec.outerWidth/2-spec.wallThickness/2,halfD=spec.outerDepth/2-spec.wallThickness/2;
      this.habitat.add(
        mesh(new T.BoxGeometry(spec.outerWidth,spec.wallHeight,spec.wallThickness),wallMaterial,[0,wallY,halfD]),
        mesh(new T.BoxGeometry(spec.outerWidth,spec.wallHeight,spec.wallThickness),wallMaterial,[0,wallY,-halfD]),
        mesh(new T.BoxGeometry(spec.wallThickness,spec.wallHeight,spec.outerDepth),wallMaterial,[halfW,wallY,0]),
        mesh(new T.BoxGeometry(spec.wallThickness,spec.wallHeight,spec.outerDepth),wallMaterial,[-halfW,wallY,0]),
        mesh(new T.BoxGeometry(spec.outerWidth,.045,.045),frame,[0,rimY,halfD]),
        mesh(new T.BoxGeometry(spec.outerWidth,.045,.045),frame,[0,rimY,-halfD]),
        mesh(new T.BoxGeometry(.045,.045,spec.outerDepth),frame,[halfW,rimY,0]),
        mesh(new T.BoxGeometry(.045,.045,spec.outerDepth),frame,[-halfW,rimY,0])
      );
      this.renderer.domElement.dataset.containerRimStyle="four-side-frame";
      this.renderer.domElement.dataset.containerWallCount="4";
      this.renderer.domElement.dataset.containerKind="rectangular-vivarium";
    }
    this.renderer.domElement.dataset.containerShape=shape;
    this.renderer.domElement.dataset.containerWallHeight=String(spec.wallHeight);
  }

  setMode(mode){
    this.clearSelection();
    this.renderer.domElement.dataset.renderMode=mode;
    this.renderer.domElement.dataset.isopodModel=mode==="voxel"?"voxel-isopod-mesh":"continuous-carapace-seven-tergites-fourteen-pereopods";
    this.renderer.domElement.dataset.isopodVoxelPalette=mode==="voxel"?"forest-floor-olive-v1":"not-applicable";
    this.renderer.domElement.dataset.isopodDorsalPlates="7";
    this.renderer.domElement.dataset.isopodShellProfile=mode==="voxel"?"voxel-domed-shell":"continuous-domed-carapace";
    this.renderer.domElement.dataset.isopodWalkingLegs="14";
    this.renderer.domElement.dataset.isopodAntennae="2";
    this.clear(this.life);
    for(const e of this.state.entities){
      const o=isopod(mode === "voxel");
      this.renderer.domElement.dataset.isopodDisplayScale=String(o.userData.baseScale);
      if(mode==="voxel"){
        this.renderer.domElement.dataset.isopodVoxelBlocks=String(o.userData.voxelBlockCount);
        this.renderer.domElement.dataset.isopodVoxelCapacity=String(o.userData.voxelBlockCapacity);
      }
      o.userData.entityId=e.id;
      this.life.add(o);
    }
    this.syncEntities();
  }

  syncEntities(){
    const byId=new Map(this.state.entities.map(e=>[e.id,e]));
    const simTime=this.state.clockMinutes+(this.interpolationAlpha??1);
    const alpha=T.MathUtils.clamp(this.interpolationAlpha??1,0,1);
    let underCoverCount=0,perchedCount=0;
    for(const object of this.life.children){
      const entity=byId.get(object.userData.entityId);
      if(!entity){object.visible=false;continue;}
      object.visible=entity.alive!==false;
      const previousX=Number.isFinite(entity.previousX)?entity.previousX:entity.x;
      const previousZ=Number.isFinite(entity.previousZ)?entity.previousZ:entity.z;
      const x=T.MathUtils.lerp(previousX,entity.x,alpha);
      const z=T.MathUtils.lerp(previousZ,entity.z,alpha);
      const phase=simTime*.72+Number((entity.id||"0").slice(-2))*.37;
      const moving=["exploring","seeking-food","seeking-shelter"].includes(entity.behavior);
      const curled=entity.behavior==="defensive-curl";
      const shape=this.state.habitat.shape;
      const floorY=terrainHeightAt(x,z,shape,HABITAT_GEOMETRY[shape].floorRadius);
      const gaitBob=moving?Math.abs(Math.sin(phase*2.1))*.0025:0;
      const refuge=this.state.resources
        .filter(resource=>resource.type==="shelter"||resource.type==="bark")
        .map(resource=>({resource,distance:Math.hypot(resource.x-x,resource.z-z)}))
        .sort((a,b)=>a.distance-b.distance)[0];
      const refugePose=resolveIsopodRefugePose(entity,refuge);
      if(refugePose.underCover)underCoverCount++;
      if(refugePose.perched)perchedCount++;
      object.position.set(x,floorY+(object.userData.isVoxel?.035:.006)+refugePose.heightOffset+gaitBob,z);
      // Both animal models are authored nose-forward along local +X;
      // simulation headings use +Z at zero (x=sin(h), z=cos(h)).
      object.rotation.y=(entity.heading??0)-Math.PI/2;
      if(object.userData.isVoxel){
        updateVoxelIsopod(object,phase,moving,curled);
      }else{
        object.scale.setScalar(object.userData.baseScale);
        updateIsopodRig(object,phase,moving,curled);
      }
    }
    this.renderer.domElement.dataset.isopodsUnderCover=String(underCoverCount);
    this.renderer.domElement.dataset.isopodsPerched=String(perchedCount);
  }

  syncResources(){
    const signature=JSON.stringify(this.state.resources.map(resource=>[
      resource.id,resource.type,Math.round((resource.amount??1)*10)/10,resource.x,resource.z
    ]));
    if(signature===this.resourceSignature)return;
    this.resourceSignature=signature;
    if(this.selectedTarget?.kind==="resource")this.clearSelection();
    this.clear(this.resourcesGroup);
    const shape=this.state.habitat.shape;
    const radius=HABITAT_GEOMETRY[shape].floorRadius;
    const kit=createDioramaKit({
      shape,
      radius,
      seed:(0x49534f+this.state.resources.length*97)>>>0,
      surfaceOffset:.19
    });
    const profiles={
      "leaf-litter":{asset:"leaf-litter",options:{count:24,kind:"local-litter",scale:1.18}},
      shelter:{asset:"bark-shelter",options:{
        length:REFUGE_MODEL_PROFILES.shelter.length,
        thickness:REFUGE_MODEL_PROFILES.shelter.thickness,
        scale:REFUGE_MODEL_PROFILES.shelter.scale
      }},
      bark:{asset:"bark-shelter",options:{
        length:REFUGE_MODEL_PROFILES.bark.length,
        thickness:REFUGE_MODEL_PROFILES.bark.thickness,
        scale:REFUGE_MODEL_PROFILES.bark.scale
      }},
      fern:{asset:"fern-bed",options:{local:true,size:.4,fronds:5,density:.95,scale:1.08}},
      mushroom:{asset:"mushroom-cluster",options:{density:1.05,scale:1.08}},
      stone:{asset:"rock-scatter",options:{local:true,density:1.02,scale:1.02}},
      moss:{asset:"moss-bed",options:{local:true,size:.46,density:1.08,scale:1.12}}
    };
    const canvas=this.renderer.domElement;
    for(const resource of this.state.resources){
      const profile=profiles[resource.type];
      if(!profile)continue;
      const groundY=kit.surfaceHeightAt(resource.x,resource.z);
      const amount=Math.max(.4,Math.min(1.2,Number(resource.amount??1)));
      const object=kit.addAsset(this.resourcesGroup,profile.asset,{
        ...profile.options,
        position:[resource.x,0,resource.z],
        groundY,
        scale:Number(profile.options.scale??1)*amount,
        density:Number(profile.options.density??1)*amount
      });
      object.name="resource-diorama-"+resource.type+"-"+resource.id;
      if(resource.type==="bark"){
        object.rotation.y=HOLLOW_BARK_ROTATION;
        object.userData.barkFootprint=getBarkFootprint(REFUGE_MODEL_PROFILES.bark.scale*amount);
      }
      object.userData.resourceId=resource.id;
      object.userData.resourceType=resource.type;
      if(resource.type==="shelter"||resource.type==="bark"){
        object.updateMatrixWorld(true);
        const size=new T.Box3().setFromObject(object).getSize(new T.Vector3());
        const key=resource.type==="shelter"?"shelterModel":"barkModel";
        canvas.dataset[key+"Length"]=size.x.toFixed(3);
        canvas.dataset[key+"Height"]=size.y.toFixed(3);
        canvas.dataset[key+"Depth"]=size.z.toFixed(3);
      }
    }
    this.resourceKit=kit;
    this.resourcesGroup.userData.dioramaKitDispose=kit.dispose;
    canvas.dataset.resourceCount=String(this.state.resources.length);
    canvas.dataset.shelterCount=String(this.state.resources.filter(r=>r.type==="shelter").length);
    canvas.dataset.foodCount=String(this.state.resources.filter(r=>r.type==="leaf-litter").length);
    canvas.dataset.resourceArt="shared-diorama-kit";
    const barkResources=this.state.resources.filter(resource=>resource.type==="bark");
    canvas.dataset.barkDiagonalCount=String(barkResources.length);
    canvas.dataset.barkRotation=String(HOLLOW_BARK_ROTATION);
    canvas.dataset.barkFootprints=JSON.stringify(barkResources.map(resource=>({
      id:resource.id,x:resource.x,z:resource.z,
      ...getBarkFootprint(REFUGE_MODEL_PROFILES.bark.scale*Math.max(.4,Math.min(1.2,Number(resource.amount??1))))
    })));
  }

  isExpeditionPortrait(){
    const mobilePortrait=typeof window!=="undefined"&&Boolean(window.matchMedia?.("(max-width:760px) and (orientation:portrait)").matches);
    return this.camera.aspect<.78||mobilePortrait;
  }

  syncExpeditionComposition(){
    const scene=this.expeditionGroup.children[0];
    if(!scene)return;
    const portrait=this.isExpeditionPortrait();
    if(Boolean(scene.userData.expeditionPortrait)===portrait)return;
    scene.userData.expeditionPortrait=portrait;
    if(scene.userData.expeditionScene==="map"){
      const scaleX=portrait?.55:1,scaleZ=portrait?1.05:1;
      scene.scale.set(scaleX,1,scaleZ);
      const local=scene.userData.mapPositionsLocal??{};
      const positions=Object.fromEntries(Object.entries(local).map(([id,[x,z]])=>[id,[x*scaleX,z*scaleZ]]));
      scene.userData.mapPositions=positions;
      this.renderer.domElement.dataset.expeditionMapPositions=JSON.stringify(positions);
    }else if(scene.userData.expeditionScene==="level"){
      scene.scale.set(portrait?.72:1,1,portrait?1.25:1);
    }
    this.renderer.domElement.dataset.expeditionPortrait=String(portrait);
  }

  setQuality(quality){
    const economy=quality === "economy";
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, economy ? 1 : 1.65));
    this.renderer.shadowMap.enabled = !economy;
    this.resize();
  }

  resize(){
    const w=Math.max(1,this.host?.clientWidth||this.el.clientWidth||400);
    const h=Math.max(1,this.host?.clientHeight||this.el.clientHeight||260);
    this.camera.aspect=w/h;
    this.camera.updateProjectionMatrix();
    if(this.expeditionMode)this.syncExpeditionComposition();
    const fit=this.fitDistance();
    if(this.expeditionMode){
      if(this.userAdjustedCamera)this.distance=Math.max(this.distance,fit);
      else this.distance=Math.max(this.distance,fit);
    }else if(this.userAdjustedCamera)this.distance=Math.max(this.distance,fit);
    else this.distance=Math.max(6.8,fit);
    this.renderer.setSize(w,h,false);
    this.cameraUpdate();
  }

  draw(now=performance.now()){
    if(!this.expeditionMode&&this.state.presentation.autoRotate){
      this.angle += .0009;
      this.cameraUpdate();
    }
    if(this.expeditionMode){
      if(this.expeditionActor){
        const moving=!this.motionQuery?.matches;
        const phase=moving?now*.0007:0;
        this.expeditionActor.position.x=this.expeditionActor.userData.baseX+(moving?Math.sin(phase)*.07:0);
        this.expeditionActor.position.z=this.expeditionActor.userData.baseZ+(moving?Math.cos(phase*.73)*.035:0);
        const curled=false;
        if(this.expeditionActor.userData.isVoxel)updateVoxelIsopod(this.expeditionActor,phase,moving,curled);
        else updateIsopodRig(this.expeditionActor,phase,moving,curled);
      }
    }else{
      this.syncEntities();
      this.syncResources();
      this.updateWeather(now*.001);
    }
    this.renderer.render(this.scene,this.camera);
    const diagnostics=this.renderer.info,canvas=this.renderer.domElement;
    canvas.dataset.renderCalls=String(diagnostics.render.calls);
    canvas.dataset.renderTriangles=String(diagnostics.render.triangles);
    canvas.dataset.renderGeometries=String(diagnostics.memory.geometries);
    canvas.dataset.renderTextures=String(diagnostics.memory.textures);
    this.frame=requestAnimationFrame(time=>this.draw(time));
  }

  dispose(){
    cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
    this.clear(this.expeditionGroup);
    this.clear(this.world);
    this.renderer.dispose();
    isopodShellTexture?.dispose();isopodShellTexture=null;
    this.renderer.domElement.remove();
  }
}
