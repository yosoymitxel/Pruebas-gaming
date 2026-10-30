import * as T from "three";
import {
  createSeededRandom,createLeafGeometry,buildLeafInstances,
  buildFernBed,buildForestRosettes,buildMossBed,buildRockScatter,
  buildFallenLog,buildRootArch,buildMushroomCluster,createWoodlandMaterials
} from "./terrarium-art.js";

export const DIORAMA_BIOMES=Object.freeze({
  "woodland-map":Object.freeze([
    Object.freeze({type:"fern-bed",position:[-1.78,0,.52],scale:.48,density:.55}),
    Object.freeze({type:"moss-bed",position:[-1,0,-.92],scale:.44,density:.32}),
    Object.freeze({type:"fallen-log",position:[.9,0,.62],scale:1.55}),
    Object.freeze({type:"mushroom-cluster",position:[1.32,0,-1.35],scale:1.35}),
    Object.freeze({type:"rock-scatter",position:[1.68,0,.96],scale:.72,density:.5})
  ]),
  "garden-entry":Object.freeze([
    Object.freeze({type:"root-arch",scale:.8}),
    Object.freeze({type:"moss-bed",position:[.16,0,-.08],scale:.22,density:.16}),
    Object.freeze({type:"dew",position:[.2,0,.14],scale:.7})
  ]),
  "mossy-stone":Object.freeze([
    Object.freeze({type:"rock-scatter",scale:.94,density:.3}),
    Object.freeze({type:"moss-bed",position:[-.08,0,.05],scale:.34,density:.16}),
    Object.freeze({type:"fern-bed",position:[-.4,0,-.2],scale:.2,density:.28})
  ]),
  "rotting-log":Object.freeze([
    Object.freeze({type:"fallen-log",scale:1.45}),
    Object.freeze({type:"moss-bed",position:[-.18,0,.1],scale:.23,density:.14}),
    Object.freeze({type:"mushroom-cluster",position:[.42,0,-.3],scale:1.1})
  ]),
  "rotten-fruit":Object.freeze([
    Object.freeze({type:"fallen-fruit",scale:1,size:.42}),
    Object.freeze({type:"mushroom-cluster",position:[.58,0,-.12],scale:1.25}),
    Object.freeze({type:"leaf-litter",position:[.35,0,.32],scale:.36,count:75,kind:"ground"})
  ]),
  "compost-bin":Object.freeze([
    Object.freeze({type:"compost-pile",scale:1.08,size:.55}),
    Object.freeze({type:"moss-bed",position:[.28,0,-.1],scale:.25,density:.14}),
    Object.freeze({type:"mushroom-cluster",position:[-.5,0,.28],scale:.72,density:.55})
  ])
});

export const DIORAMA_ASSETS=Object.freeze([
  "leaf-litter","groundcover","fern-bed","forest-rosettes","moss-bed",
  "rock-scatter","fallen-log","root-arch","mushroom-cluster",
  "fallen-fruit","compost-pile","mites","dew","web"
]);

export function createDioramaKit({
  shape="esferico",radius=1.48,seed=884201,paletteOverrides={}
}={}) {
  if(!["rectangular","cilindrico","esferico"].includes(shape))throw new RangeError("Forma de diorama desconocida: "+shape);
  if(!Number.isFinite(radius)||radius<=0)throw new RangeError("El radio del diorama debe ser positivo");
  const random=createSeededRandom(seed>>>0);
  const materials=createWoodlandMaterials();
  for(const [key,value] of Object.entries(paletteOverrides)){
    if(materials[key]?.color)materials[key].color.set(value);
  }
  materials.fruit=new T.MeshStandardMaterial({color:paletteOverrides.fruit??0x80503b,roughness:.98});
  materials.fruitStem=new T.MeshStandardMaterial({color:paletteOverrides.fruitStem??0x50402d,roughness:.95});
  materials.fruitLeaf=new T.MeshStandardMaterial({color:paletteOverrides.fruitLeaf??0x657a43,roughness:.98});
  materials.compost=new T.MeshStandardMaterial({color:paletteOverrides.compost??0x4b4030,roughness:.99});
  materials.compostFragment=new T.MeshStandardMaterial({color:paletteOverrides.compostFragment??0x816a43,roughness:.99});
  materials.mite=new T.MeshStandardMaterial({color:paletteOverrides.mite??0x756145,roughness:.82});
  materials.web=new T.MeshBasicMaterial({color:paletteOverrides.web??0xc7c8b0,transparent:true,opacity:.62});
  materials.dew=new T.MeshPhysicalMaterial({color:paletteOverrides.dew??0xb5d7d2,roughness:.08,metalness:.02,transparent:true,opacity:.78,clearcoat:1});
  const leaves=createLeafGeometry();
  function addAsset(parent,type,options={}){
    if(!parent?.add)throw new TypeError("addAsset necesita un grupo Three.js");
    const direct=options.direct===true,target=direct?parent:new T.Group();
    if(!direct){
      const position=options.position??[options.x??0,0,options.z??0];
      target.position.set(Number(position[0]??0),Number(options.groundY??.19)-.19+Number(position[1]??0),Number(position[2]??0));
      target.scale.setScalar(Number(options.scale??1));
      target.userData.dioramaAsset=type;parent.add(target);
    }
    const density=Math.max(.12,Math.min(2,Number(options.density??1)));
    const x=Number(options.localX??(direct?options.x:0)??0),z=Number(options.localZ??(direct?options.z:0)??0);
    let result=target;
    switch(type){
      case "leaf-litter":
      case "groundcover":{
        result=buildLeafInstances(random,leaves,type==="groundcover"?materials.groundcover:materials.leaf,shape,radius,
          Math.max(1,Math.round(Number(options.count??150)*density)),
          options.colors??(type==="groundcover"?[0x496b3b,0x5d7d43,0x759451]:[0x6c5038,0x856343,0xa17c4f,0x596542,0xb18a58]),
          options.kind??(type==="groundcover"?"groundcover":"ground"));
        if(options.name)result.name=options.name;
        target.add(result);break;
      }
      case "fern-bed":result=buildFernBed(target,random,shape,radius,materials,leaves,{density});break;
      case "forest-rosettes":result=buildForestRosettes(target,random,shape,radius,materials,leaves,{density});break;
      case "moss-bed":result=buildMossBed(target,random,shape,radius,materials,leaves,{density});break;
      case "rock-scatter":buildRockScatter(target,random,shape,radius,materials.rock,{density});break;
      case "fallen-log":buildFallenLog(target,x,z,shape,radius,materials,random);break;
      case "root-arch":buildRootArch(target,x,z,shape,radius,materials);break;
      case "mushroom-cluster":buildMushroomCluster(target,x,z,shape,radius,random,materials,{density});break;
      case "fallen-fruit":{
        const size=Number(options.size??.34),fruit=new T.Group();
        const apple=new T.Mesh(new T.SphereGeometry(1,18,14),materials.fruit);
        apple.position.set(x,.19+size*.56,z);apple.scale.set(size,size*.83,size*.88);apple.rotation.z=Number(options.tilt??.17);
        apple.castShadow=true;apple.receiveShadow=true;
        const stem=new T.Mesh(new T.CylinderGeometry(.015,.021,.12,6),materials.fruitStem);
        stem.position.set(x,.19+size*1.38,z);stem.rotation.z=-.3;
        const leaf=new T.Mesh(leaves,materials.fruitLeaf);
        leaf.position.set(x+size*.32,.19+size*1.5,z);leaf.scale.set(size*.45,1,size*.2);
        fruit.add(apple,stem,leaf);fruit.userData.dioramaAsset="fallen-fruit";target.add(fruit);result=fruit;break;
      }
      case "compost-pile":{
        const size=Number(options.size??.55),mound=new T.Mesh(new T.SphereGeometry(1,20,14),materials.compost);
        mound.position.set(x,.19+size*.04,z);mound.scale.set(size,size*.24,size*.84);
        mound.castShadow=true;mound.receiveShadow=true;target.add(mound);
        const count=Math.max(1,Math.floor(Number(options.fragments??24)*density));
        const fragments=new T.InstancedMesh(new T.SphereGeometry(1,7,5),materials.compostFragment,count),dummy=new T.Object3D();
        for(let i=0;i<count;i++){const angle=i*2.399963229728653,distance=.08+((i*37)%11)/11*size*.75;
          dummy.position.set(x+Math.cos(angle)*distance,.19+size*.1,z+Math.sin(angle)*distance);
          dummy.rotation.y=angle;dummy.scale.set(.055,.022,.04);dummy.updateMatrix();fragments.setMatrixAt(i,dummy.matrix);}
        fragments.instanceMatrix.needsUpdate=true;fragments.castShadow=true;target.add(fragments);target.userData.dioramaAsset="compost-pile";break;
      }
      case "mites":{
        const count=Math.max(1,Math.floor(Number(options.count??24)*density)),cluster=new T.Group();
        const swarm=new T.InstancedMesh(new T.SphereGeometry(Number(options.size??.027),7,5),materials.mite,count),dummy=new T.Object3D();
        for(let i=0;i<count;i++){const angle=i*2.399963229728653,distance=.08+((i*17)%13)/13*Number(options.radius??.28);
          dummy.position.set(x+Math.cos(angle)*distance,.19+Number(options.height??.01)+(i%3)*.009,z+Math.sin(angle)*distance);
          dummy.scale.set(1.35,.8,1);dummy.rotation.y=angle;dummy.updateMatrix();swarm.setMatrixAt(i,dummy.matrix);}
        swarm.instanceMatrix.needsUpdate=true;cluster.add(swarm);cluster.userData.dioramaAsset="mites";target.add(cluster);result=cluster;break;
      }
      case "dew":{
        const count=Math.max(1,Math.floor(Number(options.count??7)*density)),cluster=new T.Group();
        for(let i=0;i<count;i++){const angle=i*2.399963229728653,distance=Number(options.radius??.1)+(i%3)*.12;
          const drop=new T.Mesh(new T.SphereGeometry(Number(options.size??.085),12,9),materials.dew);
          drop.position.set(x+Math.cos(angle)*distance,.19+Number(options.height??.11)+(i%2)*.045,z+Math.sin(angle)*distance);
          drop.scale.set(.68,1.25,.68);cluster.add(drop);}
        cluster.userData.dioramaAsset="dew";target.add(cluster);result=cluster;break;
      }
      case "web":{
        const center=options.center??[x,.65,z],span=Number(options.span??.54),web=new T.Group();
        const hub=new T.Vector3(...center),rays=Number(options.rays??9);
        for(let i=0;i<rays;i++){const angle=i/rays*Math.PI*2,end=new T.Vector3(center[0]+Math.cos(angle)*span,center[1]+Math.sin(angle)*.12,center[2]+Math.sin(angle)*.19);
          const curve=new T.CatmullRomCurve3([hub.clone(),hub.clone().lerp(end,.5).add(new T.Vector3(0,.025,0)),end]);
          web.add(new T.Line(new T.BufferGeometry().setFromPoints(curve.getPoints(14)),materials.web));}
        for(const ringRadius of [.12,.23,.34,.45,.54]){const points=[];for(let i=0;i<=48;i++){const angle=i/48*Math.PI*2;points.push(new T.Vector3(center[0]+Math.cos(angle)*ringRadius,center[1]+Math.sin(angle)*.06,center[2]+Math.sin(angle)*ringRadius*.36));}
          web.add(new T.Line(new T.BufferGeometry().setFromPoints(points),materials.web));}
        web.userData.dioramaAsset="web";target.add(web);result=web;break;
      }
      default:throw new RangeError("Asset de diorama desconocido: "+type);
    }
    return result;
  }
  function addBiome(parent,biomeId,options={}){
    const definitions=DIORAMA_BIOMES[biomeId];if(!definitions)throw new RangeError("Bioma de diorama desconocido: "+biomeId);
    const origin=options.position??[0,0,0],scale=Number(options.scale??1),container=new T.Group();
    container.position.set(Number(origin[0]??0),Number(origin[1]??0),Number(origin[2]??0));container.userData.dioramaBiome=biomeId;parent.add(container);
    for(const def of definitions){const p=def.position??[0,0,0];
      addAsset(container,def.type,{...def,position:[Number(p[0]??0)*scale,Number(p[1]??0),Number(p[2]??0)*scale],
        scale:Number(def.scale??1)*scale,groundY:options.groundY??.19,
        density:Number(def.density??1)*Number(options.density??1)});}
    return container;
  }
  function createBase(baseRadius=radius,options={}){
    const root=new T.Group(),depth=Number(options.plinthDepth??.22),soilDepth=Number(options.soilDepth??.12),segments=Number(options.segments??56);
    const material=(key,fallback,roughness=.98,extra={})=>new T.MeshStandardMaterial({color:paletteOverrides[key]??fallback,roughness,...extra});
    const plinth=new T.Mesh(new T.CylinderGeometry(baseRadius,baseRadius+Number(options.plinthOverhang??.07),depth,segments),material("plinth",0x553f2d));
    plinth.position.set(0,-depth*.68,0);
    const soil=new T.Mesh(new T.CylinderGeometry(baseRadius*.985,baseRadius,soilDepth,segments),material("soilBase",0x514735));soil.position.set(0,.015,0);
    const top=new T.Mesh(new T.CircleGeometry(baseRadius*.985,Number(options.topSegments??64)),material("ground",0x69734d,.99,{side:T.DoubleSide}));
    top.position.set(0,.078,0);top.rotation.x=-Math.PI/2;
    const rim=new T.Mesh(new T.TorusGeometry(baseRadius*.99,Number(options.rimRadius??.035),8,72),material("rim",0x8d704c,.9));
    rim.position.set(0,.078,0);rim.rotation.x=Math.PI/2;
    for(const object of [plinth,soil,top,rim]){object.castShadow=true;object.receiveShadow=true;root.add(object);}
    root.userData.dioramaRadius=baseRadius;root.userData.dioramaPalette={...paletteOverrides};return root;
  }
  return Object.freeze({shape,radius,seed:seed>>>0,random,materials,leafGeometry:leaves,addAsset,addBiome,createBase});
}
