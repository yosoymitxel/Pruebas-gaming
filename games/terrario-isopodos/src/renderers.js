import * as T from "three";

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

function isopod(voxel){
  const root=new T.Group();
  const dark=mat(0x39392e), shell=mat(0x756c57), light=mat(0xb2a17d), seam=mat(0x4d4a3a);
  const add=(g,m,p)=>root.add(mesh(g,m,p));
  root.userData.legs=[];
  root.userData.antennae=[];
  if(voxel){
    const sprite=new T.Sprite(getVoxelMaterial());
    sprite.position.y=.28;
    sprite.scale.set(.88,.48,1);
    root.add(sprite);
  } else {
    add(new T.SphereGeometry(.29,24,16),dark,[0,.17,0]);
    for(let i=0;i<7;i++){
      const t=i/7;
      const x=.25-t*.52;
      const s=.22*Math.sin(Math.PI*(.13+t*.82));
      const o=mesh(new T.SphereGeometry(1,18,12), i%2 ? shell : light, [x, .27 + Math.sin(t*Math.PI)*.055, 0]);
      o.scale.set(.14,.19+s*.2,.22);
      root.add(o);
    }
    add(new T.SphereGeometry(.145,20,14),shell,[.32,.25,0]);
    for(const z of [-1,1]){
      add(new T.SphereGeometry(.035,10,8),dark,[.39,.29,z*.105]);
      for(let i=0;i<7;i++){
        const l=mesh(new T.CylinderGeometry(.012,.018,.14,6),dark,[.2-i*.062,.105,z*.19]);
        l.rotation.z = (z > 0 ? 1 : -1) * .45;
        root.add(l);
      }
    }
  }
  root.traverse(o=>{ if(o.isMesh) o.castShadow=true; });
  root.scale.setScalar(voxel ? .92 : .72);
  root.userData.baseScale = voxel ? .92 : .72;
  return root;
}

export class TerrariumRenderer {
  constructor(el,state){
    this.el=el;
    this.state=state;
    this.scene=new T.Scene();
    this.scene.background=new T.Color(0x31483a);
    this.scene.fog=new T.Fog(0x31483a,8,17);
    const ambientLight=new T.HemisphereLight(0xe6ead1,0x493a2a,1.85);
    this.scene.add(ambientLight);
    const keyLight=new T.DirectionalLight(0xffe2b2,2.2);
    keyLight.position.set(-3.5,7,4.5);
    keyLight.castShadow=true;
    keyLight.shadow.mapSize.set(1024,1024);
    this.scene.add(keyLight);
    const fillLight=new T.DirectionalLight(0xb2d1aa,.8);
    fillLight.position.set(4,3,-4);
    this.scene.add(fillLight);
    this.camera=new T.PerspectiveCamera(33,1,.1,100);
    this.renderer=new T.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.65));
    this.renderer.shadowMap.enabled=true;
    this.renderer.shadowMap.type=T.PCFSoftShadowMap;
    this.renderer.setClearColor(0x31483a,1);
    this.renderer.outputColorSpace=T.SRGBColorSpace;
    this.renderer.toneMapping=T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.12;
    this.renderer.domElement.style.touchAction="none";
    el.appendChild(this.renderer.domElement);
    this.world=new T.Group();
    this.habitat=new T.Group();
    this.life=new T.Group();
    this.resourcesGroup=new T.Group();
    this.ground=new T.Mesh(new T.PlaneGeometry(40,40), new T.MeshStandardMaterial({color:0x2d3c2d, roughness:1}));
    this.ground.rotation.x=-Math.PI/2;
    this.ground.position.y=-.2;
    this.world.add(this.ground,this.habitat,this.resourcesGroup,this.life);
    this.scene.add(this.world);
    this.angle=.68; this.elevation=.55; this.distance=6.8;
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
      this.distance=T.MathUtils.clamp(this.distance+delta,3.1,10.2);
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

  cameraUpdate(){
    const target=new T.Vector3(0,.32,0);
    const horizontal=Math.cos(this.elevation)*this.distance;
    this.camera.position.set(
      Math.sin(this.angle)*horizontal,
      target.y + Math.sin(this.elevation)*this.distance,
      Math.cos(this.angle)*horizontal
    );
    this.camera.lookAt(target);
    this.renderer.domElement.dataset.cameraDistance=this.distance.toFixed(2);
  }

  zoom(delta){
    this.distance=T.MathUtils.clamp(this.distance+delta,3.1,10.2);
    this.cameraUpdate();
  }

  resetCamera(){
    this.angle=.68;
    this.elevation=.55;
    this.distance=6.8;
    this.cameraUpdate();
  }

  clear(group){
    while(group.children.length){
      const o=group.children[group.children.length-1];
      group.remove(o);
      o.traverse(c=>{
        c.geometry?.dispose();
        if(c.material){
          const materials=Array.isArray(c.material)?c.material:[c.material];
          for(const m of materials){m.dispose();}
        }
      });
    }
  }

  terrain(shape){
    if(shape === "cilindrico"){
      const g=new T.CircleGeometry(1.61,56);
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
    const soil=mat(0x40372a), humus=mat(0x5d4b34), glass=()=>new T.MeshPhysicalMaterial({color:0xc5d8bf,transparent:true,opacity:.11,roughness:.2,transmission:.4});
    const base=this.terrain(shape);
    this.habitat.add(mesh(base, soil, [0,0,0]));
    if(shape === "cilindrico"){
      this.habitat.add(mesh(new T.CylinderGeometry(1.48,1.48,.12,48), humus, [0,.04,0]));
      const glassMesh=mesh(new T.CylinderGeometry(1.52,1.52,.14,48), glass(), [0,.09,0]);
      glassMesh.rotation.x = 0;
      this.habitat.add(glassMesh);
    } else {
      this.habitat.add(mesh(new T.BoxGeometry(3.2,.12,2.1), humus, [0,.04,0]));
      this.habitat.add(mesh(new T.BoxGeometry(3.35,.14,2.2), glass(), [0,.09,0]));
    }

    const random=rng(shape === "cilindrico" ? 991 : 551);
    const inside=(x,z)=>shape === "cilindrico" ? x*x + z*z < 1.45*1.45 : Math.abs(x)<1.88 && Math.abs(z)<1.22;

    for(let i=0;i<48;i++){
      const x=(random()-.5)*(shape === "cilindrico" ? 2.7 : 3.7);
      const z=(random()-.5)*(shape === "cilindrico" ? 2.7 : 2.35);
      if(!inside(x,z)) continue;
      const s=.09 + random()*.23;
      const o=mesh(new T.SphereGeometry(1,7,5), mat([0x736b5d,0x514f3c,0x8a8068][i%3], .96), [x,.22+s*.012,z]);
      o.scale.set(s,.014 + s*.008,s*.56);
      this.habitat.add(o);
    }

    for(let i=0;i<42;i++){
      const x=(random()-.5)*(shape === "cilindrico" ? 2.6 : 3.7);
      const z=(random()-.5)*(shape === "cilindrico" ? 2.6 : 2.35);
      if(!inside(x,z)) continue;
      this.addLeaf(x,z,.12 + random()*.29, random()*Math.PI, [0x87765d,0x6d7a48,0x87904c][i%3]);
    }

    for(let i=0;i<9;i++){
      const x=(random()-.5) * 3.3;
      const z=(random()-.5) * 2.05;
      if(inside(x,z)) this.addFern(x,z,.45 + random()*.35,100+i);
    }

    this.addMushrooms(-.95, -.55, .85);
    this.addMushrooms(1.18, .48, .65);

    for(let i=0;i<12;i++){
      const x=(random()-.5)*3.2;
      const z=(random()-.5)*2.1;
      if(!inside(x,z)) continue;
      this.addMossPatch(x,z,.18 + random()*.22, 70+i);
    }
  }

  setMode(mode){
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
    const t=performance.now()*.001;
    for(const o of this.life.children){
      const e=byId.get(o.userData.entityId);
      if(!e){ o.visible=false; continue; }
      o.visible=e.alive !== false;
      const phase=(t + Number((e.id||"0").slice(-2))) * 1.7;
      o.position.set(e.x, .12 + (Math.sin(phase) * 0.04), e.z);
      o.rotation.y = e.heading ?? 0;
      o.rotation.x = e.behavior === "burrowing" ? -0.5 : 0;
      o.rotation.z = e.behavior === "defensive-curl" ? 1.2 : 0;
      const base = o.userData.baseScale ?? 1;
      o.scale.setScalar(base * (e.behavior === "defensive-curl" ? 1.08 : 1));
    }
  }

  syncResources(){
    const sig=JSON.stringify(this.state.resources.map(r => [r.id,r.type,Math.round((r.amount ?? 1)*10)/10,r.x,r.z]));
    if(sig===this.resourceSignature) return;
    this.resourceSignature=sig;
    this.clear(this.resourcesGroup);

    for(const r of this.state.resources){
      let meshObj = null;
      if(r.type === "leaf-litter"){
        const p=mesh(new T.SphereGeometry(.18,8,6), mat(0x7f6d4a,.98), [r.x,.15,r.z]);
        p.scale.set(1.4,.45,1.1);
        meshObj = p;
      } else if(r.type === "shelter"){
        const p=mesh(new T.CylinderGeometry(.14,.2,.12,8), mat(0x6d4c35,.9), [r.x,.12,r.z]);
        p.scale.set(1.9,1.4,1.9);
        meshObj = p;
      } else if(r.type === "fern"){
        meshObj=mesh(new T.ConeGeometry(.13,.18,6), mat(0x5b7d45,.95), [r.x,.14,r.z]);
      } else if(r.type === "mushroom"){
        meshObj=mesh(new T.CylinderGeometry(.08,.12,.16,7), mat(0xd7d0b4,.9), [r.x,.12,r.z]);
      } else if(r.type === "stone"){
        meshObj=mesh(new T.DodecahedronGeometry(.12), mat(0x7e7d77,.9), [r.x,.13,r.z]);
      } else if(r.type === "bark"){
        meshObj=mesh(new T.CylinderGeometry(.14,.18,.34,7), mat(0x8a5d3a,.85), [r.x,.18,r.z]);
      } else if(r.type === "moss"){
        meshObj=mesh(new T.SphereGeometry(.16,8,6), mat(0x4f7d44,.98), [r.x,.13,r.z]);
        meshObj.scale.set(1.5,.6,1.7);
      }
      if(meshObj){ this.resourcesGroup.add(meshObj); }
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
    this.renderer.setSize(w,h,false);
  }

  draw(){
    if(this.state.presentation.autoRotate){
      this.angle += .0009;
      this.cameraUpdate();
    }
    this.syncEntities();
    this.syncResources();
    this.renderer.render(this.scene,this.camera);
    this.frame=requestAnimationFrame(()=>this.draw());
  }

  dispose(){
    cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
    this.clear(this.world);
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
