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

test("el kit compartido expone piezas configurables y biomas reutilizables",()=>{
  assert.ok(DIORAMA_BIOMES["woodland-map"]);
  assert.ok(DIORAMA_BIOMES["mossy-stone"]);
  const kit=createDioramaKit({shape:"esferico",radius:1.48,seed:42,paletteOverrides:{rock:0x123456}});
  const scene=new THREE.Group();
  kit.addAsset(scene,"rock-scatter",{density:.28,position:[.4,0,-.2],groundY:.078,scale:.7});
  kit.addAsset(scene,"fallen-fruit",{position:[-.3,0,.2],groundY:.078,size:.38});
  const biome=kit.addBiome(scene,"rotting-log",{groundY:.078,scale:.9});
  assert.equal(biome.userData.dioramaBiome,"rotting-log");
  assert.equal(kit.materials.rock.color.getHex(),0x123456);
  assert.ok(collect(scene,"dioramaAsset").includes("fallen-fruit"));
  assert.throws(()=>kit.addAsset(scene,"missing"),/Asset de diorama desconocido/);
  assert.throws(()=>kit.addBiome(scene,"missing"),/Bioma de diorama desconocido/);
});

test("el mapa de expedición contiene cinco nodos seleccionables y biomas del kit",()=>{
  const scene=buildExpeditionMapDiorama(THREE,{nodes:EXPEDITION_NODES,currentNodeId:"garden-entry",visitedNodes:["garden-entry"],seed:7821});
  const ids=[...new Set(collect(scene,"expeditionNodeId"))].sort();
  assert.deepEqual(ids,Object.keys(EXPEDITION_NODES).sort());
  assert.equal(scene.userData.expeditionScene,"map");
  assert.equal(scene.userData.biomeId,"woodland-map");
  assert.equal(Object.keys(scene.userData.mapPositions).length,5);
  assert.ok(collect(scene,"dioramaBiome").length>=6);
  const groundcover=scene.getObjectByName("expedition-groundcover");
  const leafLitter=scene.getObjectByName("expedition-leaf-litter");
  assert.ok(groundcover?.isInstancedMesh&&groundcover.count>=250,"el mapa tiene cobertura baja instanciada");
  assert.ok(leafLitter?.isInstancedMesh&&leafLitter.count>=190,"el suelo conserva hojarasca visible instanciada");
  let meshes=0;scene.traverse(object=>{if(object.isMesh||object.isInstancedMesh)meshes++;});
  assert.ok(meshes>45,"la escena debe contener vegetación y nodos 3D");
});

test("la selección previa del mapa no se confunde con la posición actual",()=>{
  const scene=buildExpeditionMapDiorama(THREE,{nodes:EXPEDITION_NODES,currentNodeId:null,previewNodeId:"rotten-fruit",seed:7821});
  const markers=[];
  scene.traverse(object=>{if(object.userData?.expeditionNodeId)markers.push(object);});
  assert.ok(markers.some(marker=>marker.userData.isPreview&&marker.userData.expeditionNodeId==="rotten-fruit"));
  assert.equal(markers.filter(marker=>marker.userData.isCurrent).length,0);
});

test("los senderos del mapa quedan integrados en el suelo y no parecen tubos",()=>{
  const scene=buildExpeditionMapDiorama(THREE,{nodes:EXPEDITION_NODES,seed:7821});
  const trails=[];
  scene.traverse(object=>{if(object.userData?.expeditionTrail)trails.push(object);});
  assert.equal(trails.length,scene.userData.expeditionTrailCount);
  assert.ok(trails.length>=5);
  assert.ok(trails.every(path=>path.geometry.parameters.radius<=0.018));
  assert.ok(trails.every(path=>path.castShadow===false));
});

test("la distribución del mapa es determinista por semilla y cambia con otra",()=>{
  const build=seed=>buildExpeditionMapDiorama(THREE,{nodes:EXPEDITION_NODES,seed});
  const a=build(1234),b=build(1234),c=build(9876);
  assert.deepEqual(a.userData.mapPositions,b.userData.mapPositions);
  assert.notDeepEqual(a.userData.mapPositions,c.userData.mapPositions);
});

test("los biomas de nivel y las familias de encuentro crean hotspots por opción",()=>{
  const nodeByType={web:"rotting-log",fruit:"rotten-fruit",mites:"mossy-stone",dew:"garden-entry",compost:"compost-bin"};
  for(const [type,template] of Object.entries(EXPEDITION_EVENT_TYPES)){
    const nodeId=nodeByType[type],event={type,nodeId,options:template.options};
    const scene=buildExpeditionLevelDiorama(THREE,{nodeId,event,seed:91});
    const targets=scene.children.filter(child=>typeof child.userData?.expeditionChoiceId==="string");
    assert.equal(scene.userData.expeditionScene,"level");
    assert.equal(scene.userData.eventType,type);
    assert.equal(scene.userData.biomeId,nodeId);
    assert.deepEqual(targets.map(target=>target.userData.expeditionChoiceId),template.options.map(option=>option.id));
    const colliders=collect(scene,"expeditionChoiceId");
    assert.ok(colliders.length>=template.options.length*2);
  }
});
