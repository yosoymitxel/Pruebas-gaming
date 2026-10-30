import * as T from "three";
import {
  createSeededRandom,createLeafGeometry,buildLeafInstances,
  buildFernBed,buildForestRosettes,buildMossBed,buildRockScatter,
  buildFallenLog,buildRootArch,buildMushroomCluster,createWoodlandMaterials,
  terrainHeightAt
} from "./terrarium-art.js";

export const DIORAMA_BIOMES=Object.freeze({
  "woodland-map":Object.freeze([
    Object.freeze({type:"fern-bed",position:[-1.9,0,.62],scale:.82,density:.82,size:.34,fronds:4}),
    Object.freeze({type:"moss-bed",position:[-1.08,0,-.96],scale:.78,density:.74}),
    Object.freeze({type:"fallen-log",position:[.88,0,.78],scale:1.55}),
    Object.freeze({type:"mushroom-cluster",position:[1.54,0,-1.14],scale:1.22,density:.82}),
    Object.freeze({type:"rock-scatter",position:[1.92,0,.95],scale:.86,density:.76})
  ]),
  "garden-entry":Object.freeze([
    Object.freeze({type:"root-arch",scale:1.18}),
    Object.freeze({type:"moss-bed",position:[.18,0,-.06],scale:.55,density:.68}),
    Object.freeze({type:"dew",position:[.2,0,.14],scale:.76,count:5,size:.07})
  ]),
  "mossy-stone":Object.freeze([
    Object.freeze({type:"rock-scatter",scale:1.3,density:.9}),
    Object.freeze({type:"moss-bed",position:[-.08,0,.05],scale:.72,density:.8}),
    Object.freeze({type:"fern-bed",position:[-.4,0,-.2],scale:.46,density:.72,size:.29,fronds:3})
  ]),
  "rotting-log":Object.freeze([
    Object.freeze({type:"fallen-log",scale:1.72}),
    Object.freeze({type:"moss-bed",position:[-.18,0,.1],scale:.52,density:.72}),
    Object.freeze({type:"mushroom-cluster",position:[.42,0,-.3],scale:1.02,density:.82})
  ]),
  "rotten-fruit":Object.freeze([
    Object.freeze({type:"fallen-fruit",scale:1,size:.58}),
    Object.freeze({type:"mushroom-cluster",position:[.58,0,-.12],scale:1.08,density:.82}),
    Object.freeze({type:"leaf-litter",position:[.35,0,.32],scale:1,count:22,kind:"local-litter"})
  ]),
  "compost-bin":Object.freeze([
    Object.freeze({type:"compost-pile",scale:1.12,size:.68}),
    Object.freeze({type:"moss-bed",position:[.28,0,-.1],scale:.56,density:.72}),
    Object.freeze({type:"mushroom-cluster",position:[-.5,0,.28],scale:.82,density:.68})
  ]),
  "abandoned-pot":Object.freeze([
    Object.freeze({type:"broken-pot",scale:1.04,size:.82}),
    Object.freeze({type:"root-arch",position:[.42,0,-.2],scale:.76}),
    Object.freeze({type:"moss-bed",position:[-.36,0,.22],scale:.52,density:.66})
  ]),
  "mite-nest":Object.freeze([
    Object.freeze({type:"mites",position:[-.12,0,.08],scale:1.08,count:30,size:.033,radius:.24}),
    Object.freeze({type:"fallen-log",position:[.56,0,-.2],scale:.88}),
    Object.freeze({type:"leaf-litter",position:[-.38,0,-.18],scale:.82,count:34,kind:"local-litter"})
  ]),
  "web-zone":Object.freeze([
    Object.freeze({type:"web",position:[-.12,0,-.08],scale:1.08,span:.68}),
    Object.freeze({type:"fallen-log",position:[.52,0,.2],scale:1.14}),
    Object.freeze({type:"moss-bed",position:[-.46,0,.22],scale:.56,density:.7})
  ])
});

export const DIORAMA_ASSETS=Object.freeze([
  "leaf-litter","groundcover","fern-bed","forest-rosettes","moss-bed",
  "rock-scatter","fallen-log","bark-shelter","root-arch","mushroom-cluster",
  "fallen-fruit","broken-pot","compost-pile","mites","dew","web"
]);

const SOIL_TONES=Object.freeze([0x493a2b,0x5b4532,0x756045,0x95805d]);

export function createDioramaKit({
  shape="esferico",radius=1.48,seed=884201,paletteOverrides={},
  surfaceOffset=.078
}={}) {
  if(!["rectangular","cilindrico","esferico"].includes(shape))throw new RangeError("Forma de diorama desconocida: "+shape);
  if(!Number.isFinite(radius)||radius<=0)throw new RangeError("El radio del diorama debe ser positivo");
  if(!Number.isFinite(surfaceOffset))throw new RangeError("El desplazamiento de superficie debe ser finito");
  const random=createSeededRandom(seed>>>0);
  const materials=createWoodlandMaterials();
  for(const [key,value] of Object.entries(paletteOverrides)){
    if(materials[key]?.color)materials[key].color.set(value);
  }
  materials.path=new T.MeshStandardMaterial({color:paletteOverrides.path??0x786448,roughness:1});
  materials.fruit=new T.MeshStandardMaterial({color:paletteOverrides.fruit??0x80503b,roughness:.98});
  materials.fruitStem=new T.MeshStandardMaterial({color:paletteOverrides.fruitStem??0x50402d,roughness:.95});
  materials.fruitLeaf=new T.MeshStandardMaterial({color:paletteOverrides.fruitLeaf??0x657a43,roughness:.98});
  materials.pot=new T.MeshStandardMaterial({color:paletteOverrides.pot??0x895a3d,roughness:.96,side:T.DoubleSide});
  materials.potEdge=new T.MeshStandardMaterial({color:paletteOverrides.potEdge??0xb07a51,roughness:.94,side:T.DoubleSide});
  materials.barkInterior=new T.MeshStandardMaterial({color:paletteOverrides.barkInterior??0x302318,roughness:1,side:T.DoubleSide});
  materials.compost=new T.MeshStandardMaterial({color:paletteOverrides.compost??0x4b4030,roughness:.99});
  materials.compostFragment=new T.MeshStandardMaterial({color:paletteOverrides.compostFragment??0x816a43,roughness:.99});
  materials.mite=new T.MeshStandardMaterial({color:paletteOverrides.mite??0x756145,roughness:.82});
  materials.web=new T.MeshBasicMaterial({color:paletteOverrides.web??0xc7c8b0,transparent:true,opacity:.62});
  materials.dew=new T.MeshPhysicalMaterial({color:paletteOverrides.dew??0xb5d7d2,roughness:.08,metalness:.02,transparent:true,opacity:.78,clearcoat:1});
  const leaves=createLeafGeometry();
  let disposed=false;
  function dispose(){
    if(disposed)return;
    disposed=true;
    const disposedTextures=new Set();
    for(const material of new Set(Object.values(materials))){
      if(!material)continue;
      for(const value of Object.values(material)){
        if(value?.isTexture&&!disposedTextures.has(value)){
          disposedTextures.add(value);
          value.dispose();
        }
      }
      if(material.dispose)material.dispose();
    }
    leaves.dispose();
  }
  const localBase=terrainHeightAt(0,0,shape,radius);
  const surfaceHeightAt=(x,z,surfaceRadius=radius)=>surfaceOffset+terrainHeightAt(x,z,shape,surfaceRadius)-terrainHeightAt(0,0,shape,surfaceRadius);

  function addAsset(parent,type,options={}) {
    if(!parent?.add)throw new TypeError("addAsset necesita un grupo Three.js");
    const target=new T.Group();
    const position=options.position??[options.x??0,0,options.z??0];
    const originX=Number(position[0]??0),originZ=Number(position[2]??0);
    const groundY=Number(options.groundY??surfaceHeightAt(originX,originZ));
    target.position.set(originX,groundY-localBase+Number(position[1]??0),originZ);
    target.scale.setScalar(Number(options.scale??1));
    parent.add(target);
    target.userData.dioramaAsset=type;
    const density=Math.max(.12,Math.min(2,Number(options.density??1)));
    const x=Number(options.localX??0);
    const z=Number(options.localZ??0);
    const relativeY=(value,offset=0)=>localBase+Number(value??offset);
    switch(type){
      case "leaf-litter":
      case "groundcover":{
        const kind=options.kind??(type==="groundcover"?"groundcover-random":"random");
        const litter=buildLeafInstances(random,leaves,type==="groundcover"?materials.groundcover:materials.leaf,shape,radius,
          Math.max(1,Math.round(Number(options.count??150)*density)),
          options.colors??(type==="groundcover"?[0x496b3b,0x5d7d43,0x759451]:[0x6c5038,0x856343,0xa17c4f,0x596542,0xb18a58]),kind);
        litter.name=options.name??(type==="groundcover"?"groundcover-instances":"leaf-litter-instances");
        target.add(litter);
        target.userData.dioramaStats={instances:litter.count};
        break;
      }
      case "fern-bed":{
        const count=buildFernBed(target,random,shape,radius,materials,leaves,{
          density,local:options.local!==false,size:Number(options.assetSize??options.size??.36),
          fronds:Number(options.fronds??4)
        });
        target.userData.dioramaStats={fernLeaves:count};
        break;
      }
      case "forest-rosettes":{
        const count=buildForestRosettes(target,random,shape,radius,materials,leaves,{
          density,local:options.local!==false,size:Number(options.assetSize??options.size??.42)
        });
        target.userData.dioramaStats={rosetteLeaves:count};
        break;
      }
      case "moss-bed":
        target.userData.dioramaStats=buildMossBed(target,random,shape,radius,materials,leaves,{
          density,local:options.local!==false,size:Number(options.assetSize??options.size??.42)
        });
        break;
      case "rock-scatter":{
        const count=buildRockScatter(target,random,shape,radius,materials.rock,{
          density,local:options.local!==false
        });
        target.userData.dioramaStats={rocks:count??target.children.length};
        break;
      }
      case "fallen-log":
        buildFallenLog(target,x,z,shape,radius,materials,random);
        break;
      case "bark-shelter":{
        const length=Number(options.length??.92);
        const thickness=Number(options.thickness??.25);
        // Semicírculo superior: los extremos quedan apoyados en el sustrato y el hueco abre hacia abajo.
        const archGeometry=new T.CylinderGeometry(thickness,thickness*.92,length,24,7,true,-Math.PI/2,Math.PI);
        const position=archGeometry.attributes.position;
        for(let i=0;i<position.count;i++){
          const px=position.getX(i),py=position.getY(i),pz=position.getZ(i);
          const ripple=1+Math.sin(px*53+pz*31)*.026+Math.cos(py*39-pz*17)*.018;
          position.setXYZ(i,px*ripple,py*ripple,pz*ripple);
        }
        archGeometry.computeVertexNormals();
        const arch=new T.Mesh(archGeometry,materials.bark);
        arch.name="bark-shelter-shell";
        arch.position.set(x,localBase,z);
        arch.rotation.z=Math.PI/2;
        arch.scale.x=1.45;
        arch.rotation.x=.045;
        arch.castShadow=true;arch.receiveShadow=true;
        const entrance=new T.Mesh(new T.CircleGeometry(thickness*.8,20),materials.barkInterior);
        entrance.name="bark-shelter-entrance";
        entrance.position.set(x+length*.47,localBase+thickness*.12,z);
        entrance.rotation.y=Math.PI/2;
        entrance.rotation.z=.08;
        target.add(arch,entrance);
        target.userData.dioramaStats={length,thickness};
        break;
      }
      case "broken-pot":{
        const size=Number(options.size??.32),height=size*.78,outer=size*.5;
        const shellGeometry=new T.CylinderGeometry(outer*.94,outer*.72,height,30,1,true,.12,Math.PI*1.78);
        const shell=new T.Mesh(shellGeometry,materials.pot);
        shell.name="abandoned-pot-shell";
        shell.position.set(x,localBase+height*.5,z);
        shell.castShadow=true;shell.receiveShadow=true;
        const rimGeometry=new T.TorusGeometry(outer*.94,.019*size/.32,8,32,Math.PI*1.78);
        const rim=new T.Mesh(rimGeometry,materials.potEdge);
        rim.name="abandoned-pot-rim";
        rim.position.set(x,localBase+height,z);
        rim.rotation.x=-Math.PI/2;
        const floor=new T.Mesh(new T.CircleGeometry(outer*.68,24),materials.compost);
        floor.name="abandoned-pot-soil";
        floor.position.set(x,localBase+.018,z);
        floor.rotation.x=-Math.PI/2;
        target.add(shell,rim,floor);
        target.userData.dioramaStats={height,diameter:outer*2,brokenOpening:true};
        break;
      }
      case "root-arch":
        buildRootArch(target,x,z,shape,radius,materials);
        break;
      case "mushroom-cluster":
        buildMushroomCluster(target,x,z,shape,radius,random,materials,{density});
        break;
      case "fallen-fruit":{
        const size=Number(options.size??.34),fruit=new T.Group();
        const apple=new T.Mesh(new T.SphereGeometry(1,20,15),materials.fruit);
        apple.position.set(x,relativeY(size*.56),z);apple.scale.set(size,size*.83,size*.88);apple.rotation.z=Number(options.tilt??.17);
        apple.castShadow=true;apple.receiveShadow=true;
        const stem=new T.Mesh(new T.CylinderGeometry(.015,.021,.12,7),materials.fruitStem);
        stem.position.set(x,relativeY(size*1.38),z);stem.rotation.z=-.3;
        const leaf=new T.Mesh(leaves,materials.fruitLeaf);
        leaf.position.set(x+size*.32,relativeY(size*1.5),z);leaf.scale.set(size*.45,1,size*.2);
        fruit.add(apple,stem,leaf);target.add(fruit);
        target.userData.dioramaStats={fruitSize:size};
        break;
      }
      case "compost-pile":{
        const size=Number(options.size??.55),mound=new T.Mesh(new T.SphereGeometry(1,22,15),materials.compost);
        mound.position.set(x,relativeY(size*.04),z);mound.scale.set(size,size*.24,size*.84);
        mound.castShadow=true;mound.receiveShadow=true;target.add(mound);
        const count=Math.max(1,Math.floor(Number(options.fragments??24)*density));
        const fragments=new T.InstancedMesh(new T.SphereGeometry(1,7,5),materials.compostFragment,count),dummy=new T.Object3D();
        for(let i=0;i<count;i++){
          const angle=i*2.399963229728653,distance=.08+((i*37)%11)/11*size*.75;
          dummy.position.set(x+Math.cos(angle)*distance,relativeY(size*.1),z+Math.sin(angle)*distance);
          dummy.rotation.y=angle;dummy.scale.set(.055,.022,.04);dummy.updateMatrix();fragments.setMatrixAt(i,dummy.matrix);
        }
        fragments.instanceMatrix.needsUpdate=true;fragments.castShadow=true;target.add(fragments);
        target.userData.dioramaStats={fragments:count};
        break;
      }
      case "mites":{
        const count=Math.max(1,Math.floor(Number(options.count??24)*density)),swarm=new T.InstancedMesh(new T.SphereGeometry(Number(options.size??.027),7,5),materials.mite,count),dummy=new T.Object3D();
        for(let i=0;i<count;i++){
          const angle=i*2.399963229728653,distance=.08+((i*17)%13)/13*Number(options.radius??.28);
          dummy.position.set(x+Math.cos(angle)*distance,relativeY(Number(options.height??.01)+(i%3)*.009),z+Math.sin(angle)*distance);
          dummy.scale.set(1.35,.8,1);dummy.rotation.y=angle;dummy.updateMatrix();swarm.setMatrixAt(i,dummy.matrix);
        }
        swarm.name="mite-instances";swarm.instanceMatrix.needsUpdate=true;target.add(swarm);
        target.userData.dioramaStats={mites:count};
        break;
      }
      case "dew":{
        const count=Math.max(1,Math.floor(Number(options.count??7)*density)),cluster=new T.Group();
        for(let i=0;i<count;i++){
          const angle=i*2.399963229728653,distance=Number(options.radius??.1)+(i%3)*.12;
          const drop=new T.Mesh(new T.SphereGeometry(Number(options.size??.085),12,9),materials.dew);
          drop.position.set(x+Math.cos(angle)*distance,relativeY(Number(options.height??.11)+(i%2)*.045),z+Math.sin(angle)*distance);
          drop.scale.set(.68,1.25,.68);cluster.add(drop);
        }
        target.add(cluster);target.userData.dioramaStats={drops:count};
        break;
      }
      case "web":{
        const center=options.center??[x,relativeY(.65),z],span=Number(options.span??.54),web=new T.Group();
        const hub=new T.Vector3(...center),rays=Number(options.rays??9);
        for(let i=0;i<rays;i++){
          const angle=i/rays*Math.PI*2,end=new T.Vector3(center[0]+Math.cos(angle)*span,center[1]+Math.sin(angle)*.12,center[2]+Math.sin(angle)*.19);
          const curve=new T.CatmullRomCurve3([hub.clone(),hub.clone().lerp(end,.5).add(new T.Vector3(0,.025,0)),end]);
          web.add(new T.Line(new T.BufferGeometry().setFromPoints(curve.getPoints(14)),materials.web));
        }
        for(const ringRadius of [.12,.23,.34,.45,.54]){
          const points=[];
          for(let i=0;i<=48;i++){const angle=i/48*Math.PI*2;points.push(new T.Vector3(center[0]+Math.cos(angle)*ringRadius,center[1]+Math.sin(angle)*.06,center[2]+Math.sin(angle)*ringRadius*.36));}
          web.add(new T.Line(new T.BufferGeometry().setFromPoints(points),materials.web));
        }
        target.add(web);target.userData.dioramaStats={webRays:rays};
        break;
      }
      default:throw new RangeError("Asset de diorama desconocido: "+type);
    }
    return target;
  }

  function addBiome(parent,biomeId,options={}) {
    const definitions=DIORAMA_BIOMES[biomeId];
    if(!definitions)throw new RangeError("Bioma de diorama desconocido: "+biomeId);
    const origin=options.position??[0,0,0],scale=Number(options.scale??1);
    const container=new T.Group();
    container.position.set(Number(origin[0]??0),Number(origin[1]??0),Number(origin[2]??0));
    container.userData.dioramaBiome=biomeId;
    parent.add(container);
    for(const def of definitions){
      const p=def.position??[0,0,0];
      const offsetX=Number(p[0]??0)*scale,offsetZ=Number(p[2]??0)*scale;
      const worldX=Number(origin[0]??0)+offsetX,worldZ=Number(origin[2]??0)+offsetZ;
      const groundY=surfaceHeightAt(worldX,worldZ)-Number(origin[1]??0);
      addAsset(container,def.type,{
        ...def,
        position:[offsetX,Number(p[1]??0),offsetZ],
        groundY,
        scale:Number(def.scale??1)*scale,
        density:Number(def.density??1)*Number(options.density??1),
        local:def.local??true
      });
    }
    return container;
  }

  function createBase(baseRadius=radius,options={}) {
    const root=new T.Group();
    const segments=Math.max(32,Math.floor(Number(options.segments??80)));
    const radialSegments=Math.max(8,Math.floor(Number(options.radialSegments??24)));
    const depth=Number(options.plinthDepth??.14);
    const soilDepth=Number(options.soilDepth??.14);
    const overhang=Number(options.plinthOverhang??.045);
    const stride=segments+1;
    const positions=[],colors=[],uvs=[],indices=[];
    const edgeNoise=angle=>1+Math.sin(angle*3+(seed%97))*.009+Math.cos(angle*7-(seed%53))*.006;
    for(let ring=0;ring<=radialSegments;ring++){
      const t=ring/radialSegments;
      for(let i=0;i<=segments;i++){
        const angle=i/segments*Math.PI*2;
        const edge=edgeNoise(angle);
        const r=baseRadius*.985*t*edge;
        const x=Math.cos(angle)*r,z=Math.sin(angle)*r;
        const y=surfaceHeightAt(x,z,baseRadius);
        const shade=.91+Math.sin(x*5.2+z*2.1)*.025+Math.cos(z*7.4-x*1.8)*.02;
        positions.push(x,y,z);
        colors.push(shade,shade*.96,shade*.9);
        uvs.push(x*.9+.5,z*.9+.5);
        if(ring<radialSegments&&i<segments){
          const a=ring*stride+i,b=a+1,c=a+stride,d=c+1;
          indices.push(a,c,b,b,c,d);
        }
      }
    }
    const surfaceGeometry=new T.BufferGeometry();
    surfaceGeometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));
    surfaceGeometry.setAttribute("color",new T.Float32BufferAttribute(colors,3));
    surfaceGeometry.setAttribute("uv",new T.Float32BufferAttribute(uvs,2));
    surfaceGeometry.setIndex(indices);
    surfaceGeometry.computeVertexNormals();
    surfaceGeometry.computeBoundingSphere();
    const topMaterial=materials.topsoil.clone();
    topMaterial.vertexColors=true;
    topMaterial.side=T.DoubleSide;
    const top=new T.Mesh(surfaceGeometry,topMaterial);
    top.name="organic-diorama-surface";
    top.receiveShadow=true;

    const skirtPositions=[],skirtColors=[],skirtIndices=[];
    const skirtLevels=[0,.34,.68,1];
    const bottomY=surfaceOffset-soilDepth;
    for(let level=0;level<skirtLevels.length;level++){
      const t=skirtLevels[level];
      for(let i=0;i<=segments;i++){
        const angle=i/segments*Math.PI*2,r=baseRadius*.985*edgeNoise(angle);
        const x=Math.cos(angle)*r,z=Math.sin(angle)*r;
        const topY=surfaceHeightAt(x,z,baseRadius);
        const y=topY-(topY-bottomY)*t;
        const tone=new T.Color(SOIL_TONES[Math.min(SOIL_TONES.length-1,level)]);
        if(i%7===0)tone.multiplyScalar(.93);
        skirtPositions.push(x,y,z);
        skirtColors.push(tone.r,tone.g,tone.b);
        if(level<skirtLevels.length-1&&i<segments){
          const a=level*stride+i,b=a+1,c=a+stride,d=c+1;
          skirtIndices.push(a,b,c,b,d,c);
        }
      }
    }
    const skirtGeometry=new T.BufferGeometry();
    skirtGeometry.setAttribute("position",new T.Float32BufferAttribute(skirtPositions,3));
    skirtGeometry.setAttribute("color",new T.Float32BufferAttribute(skirtColors,3));
    skirtGeometry.setIndex(skirtIndices);
    skirtGeometry.computeVertexNormals();
    const soilSide=new T.Mesh(skirtGeometry,new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:1,side:T.DoubleSide}));
    soilSide.name="soil-strata-cutaway";
    soilSide.receiveShadow=true;

    const plinthGeometry=new T.CylinderGeometry(baseRadius,baseRadius+overhang,depth,segments,2);
    const plinth=new T.Mesh(plinthGeometry,new T.MeshStandardMaterial({color:paletteOverrides.plinth??0x4a3526,roughness:.98}));
    plinth.position.y=bottomY-depth*.5;
    const objects=[soilSide,plinth,top];
    for(const object of objects){object.castShadow=object!==top;object.receiveShadow=true;root.add(object);}
    root.userData.dioramaRadius=baseRadius;
    root.userData.dioramaSurfaceOffset=surfaceOffset;
    root.userData.dioramaPalette={...paletteOverrides};
    root.userData.dioramaKitDispose=dispose;
    root.userData.dioramaSurface={kind:"organic-soil-cutaway",radialSegments,angularSegments:segments,relief:true};
    return root;
  }

  return Object.freeze({
    shape,radius,seed:seed>>>0,surfaceOffset,random,materials,leafGeometry:leaves,
    addAsset,addBiome,createBase,surfaceHeightAt,dispose
  });
}
