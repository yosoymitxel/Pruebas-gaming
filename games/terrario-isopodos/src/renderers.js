import * as T from "three";
import { HABITAT_GEOMETRY } from "./habitat.js";
import { buildWoodlandInterior, terrainHeightAt } from "./terrarium-art.js";

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
  const halfLength=.205,halfWidth=.145,height=.112;
  const plateTones=[0x737b73,0x81877b,0x707970,0x8c9182,0x747d73,0x69736b,0x7d857a].map(hex=>new T.Color(hex));
  for(let i=0;i<=lengthSegments;i++){
    const t=i/lengthSegments;
    const x=(t-.5)*halfLength*2;
    const longitudinal=Math.max(0,1-((x/halfLength)**2));
    const taper=Math.pow(longitudinal,.34);
    const platePosition=t*7;
    const plateIndex=Math.min(6,Math.floor(Math.min(platePosition,6.999999)));
    const local=platePosition-plateIndex;
    const seamDistance=Math.min(local,1-local);
    const groove=Math.exp(-((seamDistance/.043)**2));
    for(let j=0;j<=widthSegments;j++){
      const angle=(j/widthSegments*2-1)*1.28;
      const z=Math.sin(angle)*halfWidth*taper;
      const dome=Math.cos(angle)*height*taper;
      const y=.025+dome-groove*.011*taper;
      positions.push(x,y,z);
      uvs.push(t,j/widthSegments);
      const tone=plateTones[plateIndex].clone().multiplyScalar(1-groove*.34);
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
    image.data[i+1]=Math.max(0,Math.min(255,158+broad*.9+grain*.92+mottling));
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
  const unit=.032;
  const geometry=new T.BoxGeometry(1,1,1);
  const material=new T.MeshStandardMaterial({color:0xffffff,roughness:.84,metalness:.008,flatShading:true});
  const blocks=new T.InstancedMesh(geometry,material,280);
  blocks.name="voxel-isopod-volume";
  blocks.instanceMatrix.setUsage(T.DynamicDrawUsage);
  const dummy=new T.Object3D();
  const shellPalette=[0x606c64,0x6f7a70,0x7b8577,0x58655e,0x879080,0x66736a,0x748076];
  const legPalette=[0x343e39,0x47534a,0x596456];
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

  // Dark underside and a broad, rounded-rectangular armoured dorsum.
  for(let ix=-6;ix<=6;ix++){
    const taper=Math.sqrt(Math.max(0,1-(ix/7.25)**2));
    const halfWidth=Math.max(1,Math.round(4.25*taper));
    const plate=Math.max(0,Math.min(6,Math.floor((ix+7)/2)));
    const shell=shellPalette[plate];
    const seam=(ix===-4||ix===-2||ix===0||ix===2||ix===4);
    for(let iz=-halfWidth;iz<=halfWidth;iz++){
      const edge=Math.abs(iz)===halfWidth;
      addBlock([ix*unit,.012,iz*unit],edge?0x46534b:shell,[unit,unit,unit]);
      if(Math.abs(iz)<=halfWidth-1){
        const shade=seam?0x47534b:shell;
        addBlock([ix*unit,.044,iz*unit],shade,[unit,.98*unit,unit]);
      }
      if(Math.abs(iz)<=Math.max(1,Math.floor(halfWidth*.48))){
        const ridge=seam?0x526057:([0x7c887a,0x869081,0x748174,0x8d9683,0x717e73,0x657268,0x7a8679][plate]);
        addBlock([ix*unit,.072,iz*unit],ridge,[unit,.88*unit,unit]);
      }
    }
  }

  // Head, dark eyes, antennae and tail are all separate voxel details.
  for(let ix=7;ix<=8;ix++){
    const width=ix===7?2:1;
    for(let iz=-width;iz<=width;iz++){
      addBlock([ix*unit,.034,iz*unit],0x8a8a75);
      if(Math.abs(iz)<=1)addBlock([ix*unit,.064,iz*unit],0x9b987e,[unit,.82*unit,unit]);
    }
  }
  for(const side of [-1,1]){
    addBlock([9*unit,.047,side*1.35*unit],0x151d19,[unit*.6,unit*.6,unit*.6]);
    addBlock([9.1*unit,.058,side*2.1*unit],0x171f1b,[unit*.52,unit*.52,unit*.52]);
    for(let segment=0;segment<3;segment++){
      addBlock([(9.25+segment*.82)*unit,.078+segment*.012,side*(2.1+segment*.85)*unit],
        segment===2?0xaaa98e:0xb0ad91,[unit*.68,unit*.48,unit*.48]);
    }
  }
  for(const side of [-1,1]){
    addBlock([-7*unit,.008,side*1.4*unit],0x4c554b,[unit*.9,unit*.7,unit*.75]);
    addBlock([-7.7*unit,-.006,side*2.0*unit],0x3d493f,[unit*.8,unit*.55,unit*.65]);
  }

  // Seven pairs of visible walking legs, each built from two moving blocks.
  for(let pair=0;pair<7;pair++){
    const x=(5-pair*1.7)*unit;
    const widthCells=Math.max(2,Math.round(4.25*Math.sqrt(Math.max(0,1-((5-pair*1.7)/7.25)**2))));
    for(const side of [-1,1]){
      const z=(widthCells+.35)*unit*side;
      const first=addBlock([x,.002,z],legPalette[pair%legPalette.length],[unit*.78,unit*.72,unit*.9]);
      const second=addBlock([x-.2*unit,-.027,z+side*.9*unit],legPalette[(pair+1)%legPalette.length],
        [unit*.65,unit*.62,unit*.78]);
      legIndices.push({first,second,x,side,z});
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
  root.userData.baseScale=1.08;
  root.scale.setScalar(1.08);
  return root;
}

function updateVoxelIsopod(object,phase,moving,curled){
  const blocks=object.userData.voxelBlocks;
  if(!blocks)return;
  const unit=.032,dummy=new T.Object3D();
  for(const leg of object.userData.voxelLegIndices??[]){
    const wave=moving?Math.sin(phase*2.0-leg.first*.47+leg.side*Math.PI):Math.sin(phase*.28+leg.first)*.035;
    const lift=moving?Math.max(0,Math.cos(phase*2.0-leg.first*.47+leg.side))*unit*.65:0;
    dummy.position.set(leg.x+wave*.012,.002+lift,leg.z);
    dummy.scale.set(unit*.78,unit*.72,unit*.9);
    dummy.updateMatrix();
    blocks.setMatrixAt(leg.first,dummy.matrix);
    dummy.position.set(leg.x+wave*.02,-.027+lift*.5,leg.z+leg.side*unit*.9);
    dummy.scale.set(unit*.65,unit*.62,unit*.78);
    dummy.updateMatrix();
    blocks.setMatrixAt(leg.second,dummy.matrix);
  }
  if(curled){
    object.scale.set(1.08,1.05,1.08);
  }else{
    object.scale.setScalar(object.userData.baseScale);
  }
  blocks.instanceMatrix.needsUpdate=true;
}

function isopod(voxel){
  if(voxel)return createVoxelIsopod();
  const root=new T.Group();
  root.userData.isVoxel=false;
  root.userData.baseScale=1.02;
  const shellTexture=getIsopodShellTexture();
  const shellMaterial=new T.MeshStandardMaterial({
    color:0xf7f1df,map:shellTexture,vertexColors:true,roughness:.84,metalness:.008
  });
  const headShellMaterial=new T.MeshStandardMaterial({
    color:0x9b9b87,map:shellTexture,roughness:.9,metalness:.002
  });
  const undersideMaterial=mat(0x343d39,.94);
  const edgeMaterial=mat(0x59645d,.84);
  const legMaterial=mat(0x414b44,.86);
  const jointMaterial=mat(0x68736a,.82);
  const eyeMaterial=mat(0x101817,.42);
  const antennaMaterial=mat(0xb1ae93,.78);
  const bumpMaterial=mat(0x77745f,.92);

  const carapace=mesh(dorsalCarapaceGeometry(),shellMaterial,[0,0,0]);
  carapace.name="continuous-seven-tergite-carapace";
  root.add(carapace);
  const abdomen=mesh(new T.SphereGeometry(1,22,14),undersideMaterial,[0,.045,0]);
  abdomen.scale.set(.19,.047,.125);
  root.add(abdomen);

  const head=new T.Group();
  head.position.set(.185,.078,0);
  const cephalon=mesh(new T.SphereGeometry(1,20,14),headShellMaterial,[.012,.012,0]);
  cephalon.scale.set(.072,.052,.095);
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
    pivot.add(new T.Mesh(new T.TubeGeometry(curve,16,.0062,6,false),antennaMaterial));
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

  const legUpper=new T.InstancedMesh(new T.CylinderGeometry(.011,.016,1,7),legMaterial,14);
  const legLower=new T.InstancedMesh(new T.CylinderGeometry(.008,.012,1,7),jointMaterial,14);
  legUpper.name="fourteen-pereopod-coxae";
  legLower.name="fourteen-pereopod-tibiae";
  legUpper.instanceMatrix.setUsage(T.DynamicDrawUsage);
  legLower.instanceMatrix.setUsage(T.DynamicDrawUsage);
  const legPairs=[];
  for(let i=0;i<7;i++){
    for(const side of [-1,1]){
      const index=i*2+(side===1?1:0),x=.125-i*.041;
      const hip=[x,.081,side*.106],knee=[x,.054,side*.173],toe=[x,.033,side*.222];
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
  root.userData.baseScale=1.02;
  root.scale.setScalar(1.02);
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
      const hip=[x,.081,side*.106];
      const knee=[
        x+wave*.022,
        .045+(tuck*.025),
        side*(.137-tuck*.018)
      ];
      const toe=[
        x+wave*.042+(moving?Math.cos(phase*2.1-index*.76+side)*.009:0),
        .024+(tuck*.024),
        side*(.176-tuck*.036)
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
    object.userData.headRig.position.x=curled?.182:.205;
    object.userData.headRig.rotation.z=curled?-.14:Math.sin(phase*.2)*.008;
  }
}
export class TerrariumRenderer {
  constructor(el,state){
    this.interpolationAlpha=1;
    this.el=el;
    this.state=state;
    this.scene=new T.Scene();
    this.scene.background=new T.Color(0x354238);
    this.scene.fog=new T.Fog(0x354238,15,34);
    const ambientLight=new T.HemisphereLight(0xdfe6d7,0x343a31,1.35);
    this.scene.add(ambientLight);
    const keyLight=new T.DirectionalLight(0xffe2bd,2.75);
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
    this.ground=new T.Mesh(new T.PlaneGeometry(40,40), new T.MeshStandardMaterial({color:0x3e483c, roughness:.99}));
    this.ground.rotation.x=-Math.PI/2;
    this.ground.position.y=-.2;
    this.world.add(this.ground,this.habitat,this.resourcesGroup,this.life);
    this.scene.add(this.world);
    this.angle=.68;
    this.elevation=state.habitat.shape==="cilindrico"?.38:.68;
    this.distance=6.8;
    this.userAdjustedCamera=false;
    this.resourceSignature="";
    this.bind();
    this.resizeObserver=new ResizeObserver(()=>this.resize());
    this.resizeObserver.observe(el);
    this.cameraUpdate();
    this.setShape(state.habitat.shape);
    this.setMode(state.presentation.mode);
    this.resize();
    this.draw();
  }

  bind(){
    const c=this.renderer.domElement;
    const pointers=new Map();
    let drag=null;
    let pinchDistance=null;

    const zoomBy=delta=>{
      this.distance=T.MathUtils.clamp(this.distance+delta,3.1,24);
      this.userAdjustedCamera=true;
      this.cameraUpdate();
    };

    c.style.touchAction="none";

    c.addEventListener("pointerdown",e=>{
      if(e.pointerType==="mouse" && e.button!==0) return;
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
      if(!pointers.has(e.pointerId))return;
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
      pointers.delete(e.pointerId);
      if(pointers.size<2) pinchDistance=null;
      if(pointers.size===0) drag=null;
    });

    c.addEventListener("pointercancel",()=>{
      pointers.clear();
      drag=null;
      pinchDistance=null;
    });

    c.addEventListener("wheel",e=>{
      e.preventDefault();
      zoomBy(-e.deltaY*0.006);
    },{passive:false});
  }

  fitDistance(){
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
    const target=new T.Vector3(0,.32,0);
    const horizontal=Math.cos(this.elevation)*this.distance;
    this.camera.position.set(
      Math.sin(this.angle)*horizontal,
      target.y + Math.sin(this.elevation)*this.distance,
      Math.cos(this.angle)*horizontal
    );
    this.camera.lookAt(target);
    // El fit móvil puede alejar la cámara más allá de la niebla fija original (8–17).
    // Escalar el rango evita que un recipiente bien encuadrado desaparezca en el fondo.
    this.scene.fog.near=Math.max(8,this.distance*1.2);
    this.scene.fog.far=Math.max(17,this.distance*2.6);
    this.renderer.domElement.dataset.cameraDistance=this.distance.toFixed(2);
    this.renderer.domElement.dataset.cameraFitDistance=this.fitDistance().toFixed(2);
    this.renderer.domElement.dataset.fogNear=this.scene.fog.near.toFixed(2);
    this.renderer.domElement.dataset.fogFar=this.scene.fog.far.toFixed(2);
  }

  zoom(delta){
    this.distance=T.MathUtils.clamp(this.distance+delta,3.1,24);
    this.userAdjustedCamera=true;
    this.cameraUpdate();
  }

  resetCamera(){
    this.angle=.68;
    this.elevation=this.state.habitat.shape==="cilindrico"?.38:.68;
    this.userAdjustedCamera=false;
    this.distance=Math.max(6.8,this.fitDistance());
    this.cameraUpdate();
  }

  clear(group){
    const geometries=new Set(),materials=new Set(),textures=new Set();
    for(const child of [...group.children]){
      group.remove(child);
      child.traverse(object=>{
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
    const plinth=round
      ? mesh(new T.CylinderGeometry(spec.outerRadius*1.08,spec.outerRadius*1.1,.14,64),timber,[0,-.15,0])
      : mesh(new T.BoxGeometry(spec.outerWidth*1.08,.14,spec.outerDepth*1.08),timber,[0,-.15,0]);
    this.habitat.add(plinth);
    if(round){
      const foot=mesh(new T.TorusGeometry(spec.outerRadius*1.08,.018,8,64),timberEdge,[0,-.215,0]);
      foot.rotation.x=Math.PI/2;
      const upper=mesh(new T.TorusGeometry(spec.outerRadius*1.04,.012,7,64),frame,[0,-.08,0]);
      upper.rotation.x=Math.PI/2;
      this.habitat.add(foot,upper);
    }else{
      this.habitat.add(
        mesh(new T.BoxGeometry(spec.outerWidth*1.08,.018,.024),timberEdge,[0,-.215,spec.outerDepth*.54]),
        mesh(new T.BoxGeometry(spec.outerWidth*1.08,.018,.024),timberEdge,[0,-.215,-spec.outerDepth*.54]),
        mesh(new T.BoxGeometry(.024,.018,spec.outerDepth*1.08),timberEdge,[spec.outerWidth*.54,-.215,0]),
        mesh(new T.BoxGeometry(.024,.018,spec.outerDepth*1.08),timberEdge,[-spec.outerWidth*.54,-.215,0])
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
    this.renderer.domElement.dataset.terrainRelief=String(interior.userData.visualStats.terrainRelief);

    const wallMaterial=glass(shape==="cilindrico"?.055:.065);
    const floorTop=.19,wallY=floorTop+spec.wallHeight/2,rimY=floorTop+spec.wallHeight;
    const highlight=new T.MeshBasicMaterial({color:0xd7e4cc,transparent:true,opacity:.17,depthWrite:false});
    if(shape==="esferico"){
      const centerY=.1+spec.outerRadius;
      const globe=mesh(new T.SphereGeometry(spec.outerRadius,64,48),glass(.045),[0,centerY,0]);
      globe.renderOrder=5;
      this.habitat.add(globe);
      const points=[];
      for(let i=0;i<=28;i++){
        const t=-1.32+i/28*2.64,x=-spec.outerRadius*.34;
        const y=centerY+Math.sin(t)*spec.outerRadius*.88;
        const z=Math.sqrt(Math.max(.01,spec.outerRadius**2-x*x-(y-centerY)**2))*1.002;
        points.push([x,y,z]);
      }
      const shine=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),36,.008,5,false),highlight);
      this.habitat.add(shine);
      const foot=mesh(new T.TorusGeometry(spec.outerRadius*.48,.025,10,64),frame,[0,.13,0]);
      foot.rotation.x=Math.PI/2;
      this.habitat.add(foot);
      this.renderer.domElement.dataset.containerWallCount="1";
      this.renderer.domElement.dataset.containerKind="spherical-globe";
    }else if(shape==="cilindrico"){
      this.habitat.add(mesh(
        new T.CylinderGeometry(spec.outerRadius,spec.outerRadius,spec.wallHeight,64,1,true),
        wallMaterial,[0,wallY,0]
      ));
      const rim=mesh(new T.TorusGeometry(spec.outerRadius-spec.wallThickness/2,.007,7,64),frame,[0,rimY,0]);
      rim.rotation.x=Math.PI/2;
      this.habitat.add(rim);
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
      this.renderer.domElement.dataset.containerWallCount="4";
      this.renderer.domElement.dataset.containerKind="rectangular-vivarium";
    }
    this.renderer.domElement.dataset.containerShape=shape;
  }

  setMode(mode){
    this.renderer.domElement.dataset.renderMode=mode;
    this.renderer.domElement.dataset.isopodModel=mode==="voxel"?"voxel-isopod-mesh":"continuous-carapace-seven-tergites-fourteen-pereopods";
    this.renderer.domElement.dataset.isopodDorsalPlates="7";
    this.renderer.domElement.dataset.isopodShellProfile=mode==="voxel"?"voxel-domed-shell":"continuous-domed-carapace";
    this.renderer.domElement.dataset.isopodWalkingLegs="14";
    this.renderer.domElement.dataset.isopodAntennae="2";
    this.clear(this.life);
    for(const e of this.state.entities){
      const o=isopod(mode === "voxel");
      if(mode==="voxel"){
        this.renderer.domElement.dataset.isopodVoxelBlocks=String(o.userData.voxelBlockCount);
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
      object.position.set(x,floorY+(object.userData.isVoxel?.035:.006)-(entity.behavior==="burrowing"?.045:0),z);
      object.rotation.y=entity.heading??0;
      if(object.userData.isVoxel){
        updateVoxelIsopod(object,phase,moving,curled);
      }else{
        object.scale.setScalar(object.userData.baseScale);
        updateIsopodRig(object,phase,moving,curled);
      }
    }
  }

  syncResources(){
    const sig=JSON.stringify(this.state.resources.map(r=>[r.id,r.type,Math.round((r.amount??1)*10)/10,r.x,r.z]));
    if(sig===this.resourceSignature)return;
    this.resourceSignature=sig;
    this.clear(this.resourcesGroup);
    const shape=this.state.habitat.shape;
    const radius=HABITAT_GEOMETRY[shape].floorRadius;
    const makeLeaf=()=>{
      const positions=[-.09,0,0,-.045,.018,-.026,0,.026,0,.045,.018,.026,.09,0,0];
      const geometry=new T.BufferGeometry();
      geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));
      geometry.setIndex([0,1,2,2,1,3,2,3,4]);
      geometry.computeVertexNormals();
      return geometry;
    };
    for(const resource of this.state.resources){
      const floor=terrainHeightAt(resource.x,resource.z,shape,radius);
      if(resource.type==="leaf-litter"){
        const leafMaterial=mat(0x806342,.98,{side:T.DoubleSide});
        const geometry=makeLeaf();
        for(let i=0;i<3;i++){
          const leaf=mesh(geometry,leafMaterial,[resource.x+(i-1)*.035,floor+.014+i*.002,resource.z+(i%2)*.025]);
          leaf.rotation.y=i*.92;
          leaf.scale.setScalar(.75+i*.12);
          this.resourcesGroup.add(leaf);
        }
      }else if(resource.type==="shelter"||resource.type==="bark"){
        const length=resource.type==="shelter"?.34:.42;
        const thickness=resource.type==="shelter"?.115:.078;
        const barkMaterial=mat(0x634832,.98,{side:T.DoubleSide,flatShading:true});
        const archGeometry=new T.CylinderGeometry(thickness,thickness*.92,length,20,5,true,0,Math.PI);
        const position=archGeometry.attributes.position;
        for(let i=0;i<position.count;i++){
          const x=position.getX(i),y=position.getY(i),z=position.getZ(i);
          const ripple=1+Math.sin(x*63+z*28)*.035+Math.cos(y*41-z*17)*.022;
          position.setXYZ(i,x*ripple,y*ripple,z*ripple);
        }
        archGeometry.computeVertexNormals();
        const arch=mesh(archGeometry,barkMaterial,[resource.x,floor+thickness*.72,resource.z]);
        arch.rotation.z=Math.PI/2;
        arch.rotation.x=.06;
        this.resourcesGroup.add(arch);
        const entrance=mesh(new T.CircleGeometry(thickness*.82,18),mat(0x241f18,1),
          [resource.x+length*.47,floor+thickness*.12,resource.z]);
        entrance.rotation.y=Math.PI/2;
        entrance.rotation.z=.08;
        this.resourcesGroup.add(entrance);
      }else if(resource.type==="fern"){
        const plant=new T.Group();
        const stemMaterial=mat(0x49653a,.98);
        const leafMaterial=mat(0x66834a,.96,{side:T.DoubleSide});
        for(let frond=0;frond<5;frond++){
          const angle=frond/5*Math.PI*2;
          const tip=new T.Vector3(Math.cos(angle)*.12,.2,Math.sin(angle)*.12);
          const curve=new T.CatmullRomCurve3([
            new T.Vector3(0,.012,0),new T.Vector3(tip.x*.42,.11,tip.z*.42),tip
          ]);
          plant.add(new T.Mesh(new T.TubeGeometry(curve,12,.004,5,false),stemMaterial));
          for(let leaf=1;leaf<=5;leaf++){
            const t=leaf/6,point=curve.getPoint(t);
            const blade=mesh(new T.SphereGeometry(1,8,6),leafMaterial,[point.x,point.y,point.z]);
            blade.scale.set(.035,.009,.012);
            blade.rotation.y=angle+(leaf%2?-.55:.55);
            plant.add(blade);
          }
        }
        plant.position.set(resource.x,floor,resource.z);
        this.resourcesGroup.add(plant);
      }else if(resource.type==="mushroom"){
        const stem=mesh(new T.CylinderGeometry(.018,.024,.075,9),mat(0xd2c6aa,.98),
          [resource.x,floor+.038,resource.z]);
        const cap=mesh(new T.SphereGeometry(1,14,9),mat(0x8a6345,.96),
          [resource.x,floor+.082,resource.z]);
        cap.scale.set(.052,.025,.052);
        this.resourcesGroup.add(stem,cap);
      }else if(resource.type==="stone"){
        const geometry=new T.IcosahedronGeometry(.075,1);
        const p=geometry.attributes.position;
        for(let i=0;i<p.count;i++){
          const scale=.88+Math.sin(i*2.17)*.1;
          p.setXYZ(i,p.getX(i)*scale,p.getY(i)*(.7+Math.cos(i*1.9)*.12),p.getZ(i)*scale);
        }
        geometry.computeVertexNormals();
        const stone=mesh(geometry,mat(0x76776d,.99,{flatShading:true}),
          [resource.x,floor+.026,resource.z]);
        stone.rotation.y=resource.x*2.3;
        this.resourcesGroup.add(stone);
      }else if(resource.type==="moss"){
        const patch=new T.Group();
        for(let i=0;i<18;i++){
          const angle=i*2.399963229728653;
          const distance=.045*Math.sqrt((i+.5)/18);
          const tuft=mesh(new T.IcosahedronGeometry(.014+(i%3)*.002,0),
            mat([0x4e6942,0x627d48,0x7d9253][i%3],.99,{flatShading:true}),
            [Math.cos(angle)*distance,.012,Math.sin(angle)*distance]);
          tuft.scale.y=1.2;
          patch.add(tuft);
        }
        patch.position.set(resource.x,floor,resource.z);
        this.resourcesGroup.add(patch);
      }
    }
  }

  setQuality(quality){
    const economy=quality === "economy";
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, economy ? 1 : 1.65));
    this.renderer.shadowMap.enabled = !economy;
    this.resize();
  }

  resize(){
    const w=Math.max(1,this.el.clientWidth||400);
    const h=Math.max(1,this.el.clientHeight||260);
    this.camera.aspect=w/h;
    this.camera.updateProjectionMatrix();
    const fit=this.fitDistance();
    if(this.userAdjustedCamera) this.distance=Math.max(this.distance,fit);
    else this.distance=Math.max(6.8,fit);
    this.renderer.setSize(w,h,false);
    this.cameraUpdate();
  }

  draw(){
    if(this.state.presentation.autoRotate){
      this.angle += .0009;
      this.cameraUpdate();
    }
    this.syncEntities();
    this.syncResources();
    this.renderer.render(this.scene,this.camera);
    const diagnostics=this.renderer.info,canvas=this.renderer.domElement;
    canvas.dataset.renderCalls=String(diagnostics.render.calls);
    canvas.dataset.renderTriangles=String(diagnostics.render.triangles);
    canvas.dataset.renderGeometries=String(diagnostics.memory.geometries);
    canvas.dataset.renderTextures=String(diagnostics.memory.textures);
    this.frame=requestAnimationFrame(()=>this.draw());
  }

  dispose(){
    cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
    this.clear(this.world);
    this.renderer.dispose();
    isopodShellTexture?.dispose();isopodShellTexture=null;
    this.renderer.domElement.remove();
  }
}
