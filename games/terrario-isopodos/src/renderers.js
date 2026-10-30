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

let voxelMaterial;
function getVoxelMaterial(){
  if(voxelMaterial)return voxelMaterial;
  const canvas=document.createElement("canvas");
  canvas.width=64; canvas.height=32;
  const c=canvas.getContext("2d");
  c.imageSmoothingEnabled=false;
  const px=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  const outline="#272d23",dark="#464637",mid="#7c795b",light="#a6a080",shine="#c3b995";
  px(13,7,37,18,outline);px(17,5,28,22,outline);
  px(17,7,28,18,mid);px(21,6,20,20,light);px(23,7,16,17,mid);
  for(let i=0;i<6;i++){
    const x=18+i*5;
    px(x,7,3,17,i%2?light:mid);px(x,7,1,17,dark);px(x,8,2,2,shine);px(x,22,3,2,dark);
  }
  px(43,10,10,13,outline);px(44,11,8,10,light);px(48,12,4,7,mid);
  px(51,13,5,5,outline);px(52,14,2,2,"#e9d9a7");px(54,15,1,1,outline);
  for(let i=0;i<7;i++){
    const x=17+i*4;
    px(x,23,2,4,outline);px(x-2,26,3,2,dark);px(x+1,26,3,2,dark);
  }
  px(51,10,5,2,outline);px(54,7,2,5,dark);px(55,6,2,2,outline);
  px(12,12,3,2,outline);px(10,10,3,2,dark);
  const texture=new T.CanvasTexture(canvas);
  texture.colorSpace=T.SRGBColorSpace;
  texture.magFilter=T.NearestFilter;
  texture.minFilter=T.NearestFilter;
  voxelMaterial=new T.SpriteMaterial({map:texture,transparent:true,alphaTest:.08,depthWrite:false});
  return voxelMaterial;
}

function segmentMatrix(start,end){
  const a=new T.Vector3(...start),b=new T.Vector3(...end);
  const direction=b.clone().sub(a);
  const length=direction.length();
  const quaternion=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());
  return new T.Matrix4().compose(a.add(b).multiplyScalar(.5),quaternion,new T.Vector3(1,length,1));
}

function shellPlateGeometry(){
  const positions=[],uvs=[],indices=[];
  const lengthSegments=7,widthSegments=18,stride=widthSegments+1;
  for(let xStep=0;xStep<=lengthSegments;xStep++){
    const t=xStep/lengthSegments;
    const x=(t-.5)*.11;
    const edgeSoftening=.96+.04*Math.sin(Math.PI*t);
    for(let j=0;j<=widthSegments;j++){
      const angle=(j/widthSegments*2-1)*1.28;
      const z=Math.sin(angle)*.125*edgeSoftening;
      const y=.013+Math.cos(angle)*.105*edgeSoftening;
      positions.push(x,y,z);
      uvs.push(t,j/widthSegments);
      if(xStep<lengthSegments&&j<widthSegments){
        const a=xStep*stride+j,b=a+1,c=a+stride,d=c+1;
        indices.push(a,b,c,b,d,c);
      }
    }
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute("uv",new T.Float32BufferAttribute(uvs,2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
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
function isopod(voxel){
  const root=new T.Group();
  root.userData.isVoxel=voxel;
  root.userData.baseScale=voxel?.92:.86;
  if(voxel){
    const sprite=new T.Sprite(getVoxelMaterial());
    sprite.position.y=.23;
    sprite.scale.set(.88,.48,1);
    root.add(sprite);
    return root;
  }

  const shellTexture=getIsopodShellTexture();
  const shellMaterial=new T.MeshStandardMaterial({
    color:0xf7f1df,map:shellTexture,roughness:.84,metalness:.008
  });
  const undersideMaterial=mat(0x343d39,.92);
  const edgeMaterial=mat(0x59645d,.76);
  const legMaterial=mat(0x414b44,.82);
  const jointMaterial=mat(0x68736a,.78);
  const eyeMaterial=mat(0x101817,.42);
  const antennaMaterial=mat(0x879184,.72);
  const bumpMaterial=mat(0x6d725e,.92);

  const abdomen=mesh(new T.SphereGeometry(1,22,14),undersideMaterial,[0,.078,0]);
  abdomen.scale.set(.255,.063,.106);
  root.add(abdomen);

  const plates=new T.InstancedMesh(shellPlateGeometry(),shellMaterial,7);
  plates.name="seven-overlapping-tergites";
  plates.instanceMatrix.setUsage(T.DynamicDrawUsage);
  const plateColors=[0xc8c2a5,0xbab9a1,0xb0ae98,0xd1c9ab,0xb8b59b,0xa9a992,0xbab79d];
  const dummy=new T.Object3D();
  for(let i=0;i<7;i++){
    const x=.18-i*.066;
    dummy.position.set(x,.105,0);
    dummy.rotation.set(0,0,(i-3)*-.012);
    dummy.scale.set(1,1,1-i*.027);
    dummy.updateMatrix();
    plates.setMatrixAt(i,dummy.matrix);
    plates.setColorAt(i,new T.Color(plateColors[i]));
  }
  plates.instanceMatrix.needsUpdate=true;
  if(plates.instanceColor)plates.instanceColor.needsUpdate=true;
  root.add(plates);

  const head=new T.Group();
  head.position.set(.252,.112,0);
  const cephalon=mesh(new T.SphereGeometry(1,20,14),shellMaterial,[0,0,0]);
  cephalon.scale.set(.095,.062,.102);
  head.add(cephalon);
  const eyes=new T.InstancedMesh(new T.SphereGeometry(1,10,8),eyeMaterial,2);
  for(let i=0;i<2;i++){
    dummy.position.set(.056,.012,(i===0?-1:1)*.073);
    dummy.scale.set(.018,.018,.018);
    dummy.updateMatrix();
    eyes.setMatrixAt(i,dummy.matrix);
  }
  eyes.instanceMatrix.needsUpdate=true;
  head.add(eyes);

  const antennae=[];
  for(const side of [-1,1]){
    const pivot=new T.Group();
    pivot.position.set(.055,.018,side*.045);
    const curve=new T.CatmullRomCurve3([
      new T.Vector3(0,0,0),
      new T.Vector3(.055,.018,side*.012),
      new T.Vector3(.11,.047,side*.026),
      new T.Vector3(.16,.061,side*.048)
    ]);
    const feeler=new T.Mesh(new T.TubeGeometry(curve,14,.0045,5,false),antennaMaterial);
    pivot.add(feeler);
    head.add(pivot);
    antennae.push({pivot,side});
  }
  root.add(head);
  root.userData.headRig=head;
  root.userData.antennae=antennae;

  const tail=mesh(new T.SphereGeometry(1,16,10),edgeMaterial,[-.258,.075,0]);
  tail.scale.set(.075,.036,.078);
  root.add(tail);
  const uropods=new T.InstancedMesh(new T.ConeGeometry(.008,.075,6),jointMaterial,2);
  for(let i=0;i<2;i++){
    const side=i===0?-1:1;
    uropods.setMatrixAt(i,segmentMatrix(
      [-.285,.075,side*.045],
      [-.355,.045,side*.095]
    ));
  }
  uropods.instanceMatrix.needsUpdate=true;
  root.add(uropods);

  const legUpper=new T.InstancedMesh(new T.CylinderGeometry(.006,.010,1,6),legMaterial,14);
  const legLower=new T.InstancedMesh(new T.CylinderGeometry(.004,.007,1,6),jointMaterial,14);
  legUpper.name="fourteen-pereopod-coxae";
  legLower.name="fourteen-pereopod-tibiae";
  legUpper.instanceMatrix.setUsage(T.DynamicDrawUsage);
  legLower.instanceMatrix.setUsage(T.DynamicDrawUsage);

  const legPairs=[];
  for(let i=0;i<7;i++){
    for(const side of [-1,1]){
      const index=i*2+(side===1?1:0),x=.17-i*.066;
      const hip=[x,.097,side*.087],knee=[x,.061,side*.128],toe=[x,.035,side*.168];
      legUpper.setMatrixAt(index,segmentMatrix(hip,knee));
      legLower.setMatrixAt(index,segmentMatrix(knee,toe));
      legPairs.push({index,x,side});
    }
  }
  legUpper.instanceMatrix.needsUpdate=true;
  legLower.instanceMatrix.needsUpdate=true;
  root.add(legUpper,legLower);

  const granules=new T.InstancedMesh(
    new T.SphereGeometry(1,7,5),bumpMaterial,28
  );
  let bumpIndex=0;
  for(let i=0;i<7;i++){
    const centerX=.18-i*.066;
    for(const z of [-.072,0,.072]){
      const px=centerX+((i%2)*.011-.005);
      const pz=z;
      const topY=.105+.013+.105*Math.sqrt(Math.max(0,1-(pz/.125)**2));
      dummy.position.set(px,topY,pz);
      const size=.0027+(bumpIndex%4)*.00045;
      dummy.scale.set(size,size*.7,size);
      dummy.rotation.y=(i+bumpIndex)*.4;
      dummy.updateMatrix();
      granules.setMatrixAt(bumpIndex,dummy.matrix);
      bumpIndex++;
    }
  }
  granules.count=bumpIndex;
  granules.instanceMatrix.needsUpdate=true;
  root.add(granules);

  root.userData.shellPlates=plates;
  root.userData.legUpper=legUpper;
  root.userData.legLower=legLower;
  root.userData.legPairs=legPairs;
  root.userData.baseScale=.86;
  root.scale.setScalar(.86);
  root.traverse(object=>{if(object.isMesh){object.castShadow=true;object.receiveShadow=true;}});
  return root;
}

function updateIsopodRig(object,phase,moving,curled){
  const plates=object.userData.shellPlates;
  if(plates){
    const dummy=new T.Object3D();
    for(let i=0;i<7;i++){
      const compression=curled?.82:1;
      dummy.position.set((.18-i*.066)*compression,.105+(curled?.008:0),0);
      dummy.rotation.z=(i-3)* (curled?.045:-.012);
      dummy.scale.set(curled?.9:1,curled?1.04:1,1-i*.027);
      dummy.updateMatrix();
      plates.setMatrixAt(i,dummy.matrix);
    }
    plates.instanceMatrix.needsUpdate=true;
  }

  const upper=object.userData.legUpper,lower=object.userData.legLower;
  if(upper&&lower){
    const pairs=object.userData.legPairs??[];
    for(const leg of pairs){
      const {index,x,side}=leg;
      const wave=moving?Math.sin(phase*2.1-index*.76+side*Math.PI):Math.sin(phase*.32+index)*.05;
      const tuck=curled?1:0;
      const hip=[x,.097,side*.087];
      const knee=[
        x+wave*.024,
        .061+(tuck*.028),
        side*(.128-tuck*.018)
      ];
      const toe=[
        x+wave*.045+(moving?Math.cos(phase*2.1-index*.76+side)*.009:0),
        .035+(tuck*.027),
        side*(.168-tuck*.038)
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
  if(object.userData.headRig)object.userData.headRig.rotation.z=curled?-.14:Math.sin(phase*.2)*.008;
}

export class TerrariumRenderer {
  constructor(el,state){
    this.interpolationAlpha=1;
    this.el=el;
    this.state=state;
    this.scene=new T.Scene();
    this.scene.background=new T.Color(0x536a4c);
    this.scene.fog=new T.Fog(0x536a4c,12,26);
    const ambientLight=new T.HemisphereLight(0xeaf0d7,0x62503b,2.15);
    this.scene.add(ambientLight);
    const keyLight=new T.DirectionalLight(0xffe6be,2.65);
    keyLight.position.set(-3.5,7,4.5);
    keyLight.castShadow=true;
    keyLight.shadow.mapSize.set(1024,1024);
    this.scene.add(keyLight);
    const fillLight=new T.DirectionalLight(0xc3d7b3,1.05);
    fillLight.position.set(4,3,-4);
    this.scene.add(fillLight);
    const rimLight=new T.DirectionalLight(0xf2e7c9,.62);
    rimLight.position.set(2.5,4,-5.5);
    this.scene.add(rimLight);
    this.camera=new T.PerspectiveCamera(33,1,.1,100);
    this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.65));
    this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=T.PCFSoftShadowMap;
    this.renderer.setClearColor(0x536a4c,1);
    this.renderer.outputColorSpace=T.SRGBColorSpace;
    this.renderer.toneMapping=T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.22;
    this.renderer.domElement.style.touchAction="none";
    el.appendChild(this.renderer.domElement);
    this.world=new T.Group();
    this.habitat=new T.Group();
    this.life=new T.Group();
    this.resourcesGroup=new T.Group();
    this.ground=new T.Mesh(new T.PlaneGeometry(40,40), new T.MeshStandardMaterial({color:0x4a6042, roughness:1}));
    this.ground.rotation.x=-Math.PI/2;
    this.ground.position.y=-.2;
    this.world.add(this.ground,this.habitat,this.resourcesGroup,this.life);
    this.scene.add(this.world);
    this.angle=.68;
    this.elevation=state.habitat.shape==="cilindrico"?.59:.72;
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
    this.elevation=this.state.habitat.shape==="cilindrico"?.59:.72;
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
            if(material===voxelMaterial)continue;
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

    const wallMaterial=glass(shape==="cilindrico"?.1:.065);
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
      const rim=mesh(new T.TorusGeometry(spec.outerRadius-spec.wallThickness/2,.012,8,64),frame,[0,rimY,0]);
      rim.rotation.x=Math.PI/2;
      const points=[];
      for(let i=0;i<=20;i++){const a=2.0+i/20*2.28;points.push([Math.sin(a)*(spec.outerRadius+.002),floorTop+spec.wallHeight*.56,Math.cos(a)*(spec.outerRadius+.002)]);}
      const arc=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),32,.0045,5,false),highlight);
      this.habitat.add(rim,arc);
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
    this.renderer.domElement.dataset.isopodModel=mode==="voxel"?"voxel-sprite":"seven-tergites-fourteen-pereopods";
    this.renderer.domElement.dataset.isopodDorsalPlates=mode==="voxel"?"sprite":"7";
    this.renderer.domElement.dataset.isopodWalkingLegs=mode==="voxel"?"sprite":"14";
    this.renderer.domElement.dataset.isopodAntennae=mode==="voxel"?"sprite":"2";
    this.clear(this.life);
    for(const e of this.state.entities){
      const o=isopod(mode === "voxel");
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
      object.position.set(x,floorY-(object.userData.isVoxel?.047:.02)-(entity.behavior==="burrowing"?.07:0),z);
      object.rotation.y=entity.heading??0;
      if(object.userData.isVoxel){
        object.scale.setScalar(object.userData.baseScale*(curled?1.08:1));
      }else{
        object.scale.setScalar(object.userData.baseScale);
        updateIsopodRig(object,phase,moving,curled);
      }
    }
  }

  syncResources(){
    const sig=JSON.stringify(this.state.resources.map(r => [r.id,r.type,Math.round((r.amount ?? 1)*10)/10,r.x,r.z]));
    if(sig===this.resourceSignature) return;
    this.resourceSignature=sig;
    this.clear(this.resourcesGroup);

    const shape=this.state.habitat.shape;
    const radius=HABITAT_GEOMETRY[shape].floorRadius;
    for(const r of this.state.resources){
      const floor=terrainHeightAt(r.x,r.z,shape,radius);
      let object=null;
      if(r.type==="leaf-litter"){
        object=mesh(new T.SphereGeometry(.16,10,7),mat(0x8a6844,.97),[r.x,floor+.02,r.z]);
        object.scale.set(1.35,.035,.62);
      }else if(r.type==="shelter"||r.type==="bark"){
        const length=r.type==="bark"?.42:.34,thickness=r.type==="bark"?.12:.16;
        object=mesh(new T.CylinderGeometry(thickness*.9,thickness,length,12,1,true),mat(0x795034,.94,{side:T.DoubleSide}),[r.x,floor+thickness*.58,r.z]);
        object.rotation.z=Math.PI/2;
      }else if(r.type==="fern"){
        object=mesh(new T.ConeGeometry(.13,.24,7),mat(0x5b7d45,.95),[r.x,floor+.12,r.z]);
      }else if(r.type==="mushroom"){
        const stem=mesh(new T.CylinderGeometry(.035,.05,.12,9),mat(0xe0d4b8,.98),[r.x,floor+.06,r.z]);
        const cap=mesh(new T.SphereGeometry(1,12,8),mat(0x986348,.96),[r.x,floor+.15,r.z]);
        cap.scale.set(.095,.045,.095);
        this.resourcesGroup.add(stem,cap);
      }else if(r.type==="stone"){
        object=mesh(new T.DodecahedronGeometry(.12,1),mat(0x817966,.98,{flatShading:true}),[r.x,floor+.045,r.z]);
        object.scale.set(1.2,.65,1);
      }else if(r.type==="moss"){
        object=mesh(new T.SphereGeometry(.13,10,7),mat(0x5e8242,.99),[r.x,floor+.02,r.z]);
        object.scale.set(1.5,.28,1.3);
      }
      if(object)this.resourcesGroup.add(object);
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
    if(voxelMaterial){voxelMaterial.map?.dispose();voxelMaterial.dispose();voxelMaterial=null;}
    this.renderer.domElement.remove();
  }
}
