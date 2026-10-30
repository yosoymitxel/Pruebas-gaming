import test from "node:test";
import assert from "node:assert/strict";
import { createTerrariumState } from "../src/state.js";
import { stepSimulation } from "../src/simulation.js";
import { resolveIsopodRefugePose } from "../src/isopod-placement.js";
import { REFUGE_MODEL_PROFILES } from "../src/habitat.js";

test("isópodos que excavan o descansan bajo Tronco hueco se representan debajo del arco",()=>{
  for(const behavior of ["burrowing","resting"]){
    const pose=resolveIsopodRefugePose({behavior},{resource:{type:"bark"},distance:.2});
    assert.equal(pose.underCover,true);
    assert.equal(pose.perched,false);
    assert.equal(pose.heightOffset,0);
  }
});

test("los isópodos pueden seguir encaramándose sobre los refugios normales",()=>{
  const pose=resolveIsopodRefugePose({behavior:"burrowing"},{resource:{type:"shelter"},distance:.2});
  assert.equal(pose.underCover,false);
  assert.equal(pose.perched,true);
  assert.ok(Math.abs(pose.heightOffset-(REFUGE_MODEL_PROFILES.shelter.thickness*REFUGE_MODEL_PROFILES.shelter.scale*REFUGE_MODEL_PROFILES.shelter.verticalScale+REFUGE_MODEL_PROFILES.shelter.perchClearance))<1e-9);
});

test("un isópodo que camina sobre Tronco hueco sigue usando la superficie superior",()=>{
  const pose=resolveIsopodRefugePose({behavior:"exploring"},{resource:{type:"bark"},distance:.2});
  assert.equal(pose.underCover,false);
  assert.equal(pose.perched,true);
  assert.ok(Math.abs(pose.heightOffset-(REFUGE_MODEL_PROFILES.bark.thickness*REFUGE_MODEL_PROFILES.bark.scale*REFUGE_MODEL_PROFILES.bark.verticalScale+REFUGE_MODEL_PROFILES.bark.perchClearance))<1e-9);
});

test("excavar fuera de un refugio conserva la pose bajo la hojarasca",()=>{
  const pose=resolveIsopodRefugePose({behavior:"burrowing"},null);
  assert.equal(pose.underCover,false);
  assert.equal(pose.perched,false);
  assert.equal(pose.heightOffset,-.045);
});

test("la pose bajo el tronco solo se activa dentro del alcance del arco",()=>{
  const pose=resolveIsopodRefugePose({behavior:"burrowing"},{resource:{type:"bark"},distance:.6});
  assert.equal(pose.underCover,false);
  assert.equal(pose.perched,false);
  assert.equal(pose.heightOffset,-.045);
});

test("la simulación dirige al isópodo estresado al tronco hueco y activa la pose inferior",()=>{
  const state=createTerrariumState();
  const entity=state.entities[0];
  const bark={id:"bark-test",type:"bark",amount:1,x:entity.x+.1,z:entity.z};
  state.resources=[bark];
  entity.energy=.9;entity.hydration=.9;entity.stress=.8;entity.behavior="exploring";
  stepSimulation(state,1);
  assert.equal(entity.behavior,"burrowing");
  const distance=Math.hypot(entity.x-bark.x,entity.z-bark.z);
  const pose=resolveIsopodRefugePose(entity,{resource:bark,distance});
  assert.equal(pose.underCover,true);
  assert.equal(pose.perched,false);
  assert.equal(pose.heightOffset,0);
});
