import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {buildExpeditionMapDiorama,buildExpeditionLevelDiorama} from "../src/expedition/diorama.js";
import {createDioramaKit,DIORAMA_BIOMES} from "../src/diorama-kit.js";
import {EXPEDITION_NODES,EXPEDITION_EVENT_TYPES} from "../src/expedition/content.js";

function collect(group,property){
  const values=[];
  group.traverse(object=>{if(object.userData?.[property])values.push(object.userData[property]);});
  return values;
}

test("el kit compartido expone piezas locales y biomas reutilizables",()=>{
  assert.ok(DIORAMA_BIOMES["woodland-map"]);
  assert.ok(DIORAMA_BIOMES["mossy-stone"]);
  const kit=createDioramaKit({shape:"esferico",radius:2.5,seed:42,paletteOverrides:{rock:0x123456}});
  const scene=new THREE.Group();
  const assets=[
    kit.addAsset(scene,"fern-bed",{position:[.5,0,-.2],groundY:.078,scale:.9,density:.8,size:.34,fronds:4}),
    kit.addAsset(scene,"moss-bed",{position:[-.45,0,.2],groundY:.078,scale:1,density:.8}),
    kit.addAsset(scene,"rock-scatter",{position:[.15,0,.5],groundY:.078,scale:1,density:.8}),
    kit.addAsset(scene,"bark-shelter",{position:[-.65,0,-.35],groundY:.078,length:.92,thickness:.24}),
    kit.addAsset(scene,"fallen-fruit",{position:[-.3,0,.2],groundY:.078,size:.38})
  ];
  assert.ok(assets.every(asset=>asset.isGroup),"addAsset siempre devuelve un Group");
  for(const [index,asset] of assets.entries()){
    const bounds=new THREE.Box3().setFromObject(asset),size=bounds.getSize(new THREE.Vector3());
    assert.ok(size.x<1.4&&size.z<1.4,"la pieza "+index+" no debe rellenar una escena completa");
  }
  const biome=kit.addBiome(scene,"rotting-log",{position:[.25,0,-.1],scale:.9});
  assert.equal(biome.userData.dioramaBiome,"rotting-log");
  assert.equal(kit.materials.rock.color.getHex(),0x123456);
  assert.ok(collect(scene,"dioramaAsset").includes("fallen-fruit"));
  assert.throws(()=>kit.addAsset(scene,"missing"),/Asset de diorama desconocido/);
  assert.throws(()=>kit.addBiome(scene,"missing"),/Bioma de diorama desconocido/);
  kit.dispose();
});

test("el mismo kit soporta la altura del suelo de expedición y del hábitat principal",()=>{
  const expeditionKit=createDioramaKit({shape:"esferico",radius:2.5,seed:12});
  const habitatKit=createDioramaKit({shape:"esferico",radius:1.48,seed:12,surfaceOffset:.19});
  assert.equal(expeditionKit.surfaceOffset,.078);
  assert.equal(habitatKit.surfaceOffset,.19);
  assert.ok(Math.abs(expeditionKit.surfaceHeightAt(0,0)-.078)<1e-9);
  assert.ok(Math.abs(habitatKit.surfaceHeightAt(0,0)-.19)<1e-9);
  const parent=new THREE.Group();
  const shelter=habitatKit.addAsset(parent,"bark-shelter",{position:[0,0,0]});
  const localBase=habitatKit.surfaceHeightAt(0,0);
  assert.ok(Math.abs(shelter.position.y+localBase-.19)<1e-9,
    "los recursos se apoyan en el suelo real del terrario sin quedar enterrados");
  expeditionKit.dispose();
  habitatKit.dispose();
});

test("la base es un suelo orgánico con relieve y estratos, no un disco plano",()=>{
  const kit=createDioramaKit({shape:"esferico",radius:2.5,seed:77});
  const base=kit.createBase(2.5);
  const surface=base.getObjectByName("organic-diorama-surface");
  const strata=base.getObjectByName("soil-strata-cutaway");
  assert.ok(surface?.isMesh);
  assert.ok(strata?.isMesh);
  const positions=surface.geometry.attributes.position,heights=[];
  for(let i=0;i<positions.count;i++)heights.push(positions.getY(i));
  assert.ok(Math.max(...heights)-Math.min(...heights)>.05,"el terreno debe conservar irregularidad");
  assert.equal(base.userData.dioramaSurface.kind,"organic-soil-cutaway");
  assert.equal(typeof base.userData.dioramaKitDispose,"function");
  kit.dispose();
});

test("el mapa de expedición tiene cinco lugares físicos sobre un suelo continuo",()=>{
  const scene=buildExpeditionMapDiorama(THREE,{
    nodes:EXPEDITION_NODES,currentNodeId:"garden-entry",visitedNodes:["garden-entry"],seed:7821
  });
  const ids=[...new Set(collect(scene,"expeditionNodeId"))].sort();
  assert.deepEqual(ids,Object.keys(EXPEDITION_NODES).sort());
  assert.equal(scene.userData.expeditionScene,"map");
  assert.equal(scene.userData.biomeId,"woodland-map");
  assert.equal(scene.userData.surfaceType,"organic-soil-cutaway");
  assert.equal(scene.userData.landmarkCount,5);
  assert.equal(Object.keys(scene.userData.mapPositions).length,5);
  assert.ok(collect(scene,"dioramaBiome").length>=6);
  const landmarks=scene.children.filter(child=>typeof child.userData?.expeditionNodeId==="string");
  assert.equal(landmarks.length,5,"cada lugar se integra como landmark en el mismo terreno");
  const groundcover=scene.getObjectByName("expedition-groundcover");
  const leafLitter=scene.getObjectByName("expedition-leaf-litter");
  assert.ok(groundcover?.isInstancedMesh&&groundcover.count>=250);
  assert.ok(leafLitter?.isInstancedMesh&&leafLitter.count>=190);
  assert.ok(scene.userData.expeditionTrailCount>=5);
  const trails=[];
  scene.traverse(object=>{if(object.userData?.expeditionTrail)trails.push(object);});
  assert.equal(trails.length,scene.userData.expeditionTrailCount);
  assert.ok(trails.every(path=>path.geometry.isBufferGeometry&&path.userData.halfWidth<=.09),
    "los caminos son bandas de suelo, no tubos");
  let rings=0,meshes=0;
  scene.traverse(object=>{
    if(object.isMesh||object.isInstancedMesh)meshes++;
    if(object.isMesh&&object.geometry?.type==="TorusGeometry")rings++;
  });
  assert.equal(rings,0,"el mapa no debe usar aros/medallones como landmarks");
  assert.ok(meshes>45);
});

test("la selección previa no se confunde con la posición actual",()=>{
  const scene=buildExpeditionMapDiorama(THREE,{
    nodes:EXPEDITION_NODES,currentNodeId:null,previewNodeId:"rotten-fruit",seed:7821
  });
  const markers=[];
  scene.traverse(object=>{if(object.userData?.expeditionNodeId)markers.push(object);});
  assert.ok(markers.some(marker=>marker.userData.isPreview&&marker.userData.expeditionNodeId==="rotten-fruit"));
  assert.equal(markers.filter(marker=>marker.userData.isCurrent).length,0);
});

test("la distribución del mapa es determinista por semilla y cambia con otra",()=>{
  const build=seed=>buildExpeditionMapDiorama(THREE,{nodes:EXPEDITION_NODES,seed});
  const a=build(1234),b=build(1234),c=build(9876);
  assert.deepEqual(a.userData.mapPositions,b.userData.mapPositions);
  assert.notDeepEqual(a.userData.mapPositions,c.userData.mapPositions);
});

test("los encuentros muestran el actor y usan objetos físicos para cada opción",()=>{
  const nodeByType={web:"rotting-log",fruit:"rotten-fruit",mites:"mossy-stone",dew:"garden-entry",compost:"compost-bin"};
  for(const [type,template] of Object.entries(EXPEDITION_EVENT_TYPES)){
    const nodeId=nodeByType[type],event={type,nodeId,options:template.options};
    const scene=buildExpeditionLevelDiorama(THREE,{
      nodeId,event,seed:91,makeIsopod:()=>new THREE.Group()
    });
    const targets=scene.children.filter(child=>typeof child.userData?.expeditionChoiceId==="string");
    assert.equal(scene.userData.expeditionScene,"level");
    assert.equal(scene.userData.eventType,type);
    assert.equal(scene.userData.biomeId,nodeId);
    assert.equal(scene.userData.surfaceType,"organic-soil-cutaway");
    assert.deepEqual(targets.map(target=>target.userData.expeditionChoiceId),template.options.map(option=>option.id));
    const actor=scene.getObjectByName("expedition-isopod");
    assert.ok(actor&&actor.scale.x>=.9,"el isópodo no puede desaparecer frente a la decoración");
    const colliders=collect(scene,"expeditionChoiceId");
    assert.ok(colliders.length>=template.options.length*2);
    let visibleMarkers=0,rings=0;
    scene.traverse(object=>{
      if(object.isMesh&&object.geometry?.type==="TorusGeometry")rings++;
      if(object.isMesh&&typeof object.userData?.expeditionChoiceId==="string"&&object.material?.opacity!==0)visibleMarkers++;
    });
    assert.equal(rings,0,"las opciones no se representan con aros");
    assert.equal(visibleMarkers,0,"las hitboxes de decisión son invisibles");
  }
});
