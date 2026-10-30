import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {buildExpeditionMapDiorama,buildExpeditionLevelDiorama} from "../src/expedition/diorama.js";
import {EXPEDITION_NODES,EXPEDITION_EVENT_TYPES} from "../src/expedition/content.js";

function collect(group,property){
  const values=[];
  group.traverse(object=>{if(object.userData?.[property])values.push(object.userData[property]);});
  return values;
}

test("el mapa procedural construye cinco lugares físicos seleccionables y conserva el grafo",()=>{
  const scene=buildExpeditionMapDiorama(THREE,{nodes:EXPEDITION_NODES,currentNodeId:"garden-entry",visitedNodes:["garden-entry"],seed:7821});
  const ids=[...new Set(collect(scene,"expeditionNodeId"))].sort();
  assert.deepEqual(ids,Object.keys(EXPEDITION_NODES).sort());
  assert.equal(scene.userData.expeditionScene,"map");
  assert.equal(Object.keys(scene.userData.mapPositions).length,5);
  assert.ok(scene.children.length>20,"el mapa debe contener terreno, senderos y elementos naturales");
});

test("la distribución del mapa se reproduce con la misma semilla y varía con otra",()=>{
  const build=seed=>buildExpeditionMapDiorama(THREE,{nodes:EXPEDITION_NODES,seed});
  const a=build(1234),b=build(1234),c=build(9876);
  assert.deepEqual(a.userData.mapPositions,b.userData.mapPositions);
  assert.notDeepEqual(a.userData.mapPositions,c.userData.mapPositions);
});

test("cada familia de encuentro monta un diorama y un hotspot real por opción",()=>{
  const nodeByType={web:"rotting-log",fruit:"rotten-fruit",mites:"mossy-stone",dew:"garden-entry",compost:"compost-bin"};
  for(const [type,template] of Object.entries(EXPEDITION_EVENT_TYPES)){
    const event={type,nodeId:nodeByType[type],options:template.options};
    const scene=buildExpeditionLevelDiorama(THREE,{nodeId:event.nodeId,event,seed:91});
    const targets=scene.children.filter(child=>typeof child.userData?.expeditionChoiceId==="string");
    assert.equal(scene.userData.expeditionScene,"level");
    assert.equal(scene.userData.eventType,type);
    assert.deepEqual(targets.map(target=>target.userData.expeditionChoiceId),template.options.map(option=>option.id));
    const colliders=[];
    scene.traverse(object=>{if(object.userData?.expeditionChoiceId)colliders.push(object);});
    assert.ok(colliders.length>=template.options.length*2,"cada interacción requiere grupo visible y volumen seleccionable");
  }
});
