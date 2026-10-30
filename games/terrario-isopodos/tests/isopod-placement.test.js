import test from "node:test";
import assert from "node:assert/strict";
import { createTerrariumState } from "../src/state.js";
import { stepSimulation } from "../src/simulation.js";
import { resolveIsopodRefugePose } from "../src/isopod-placement.js";
import { REFUGE_MODEL_PROFILES } from "../src/habitat.js";

test("la simulación dirige al isópodo hacia Tronco hueco y lo muestra bajo el arco al entrar",()=>{
  const state=createTerrariumState();
  const entity=state.entities[0];
  const bark={id:"bark-approach",type:"bark",amount:1,x:-.02,z:entity.z};
  state.resources=[bark];
  entity.x=-.35;
  entity.z=bark.z;
  entity.energy=.95;
  entity.hydration=.3;
  entity.stress=.05;
  entity.behavior="exploring";

  stepSimulation(state,1);

  assert.equal(entity.intent,"shelter");
  assert.equal(entity.targetResourceId,bark.id);
  assert.equal(entity.behavior,"seeking-shelter");
  const distance=Math.hypot(entity.x-bark.x,entity.z-bark.z);
  assert.ok(distance<.43&&distance>.16,"El isópodo debe estar acercándose, no ya descansando");
  const pose=resolveIsopodRefugePose(entity,{resource:bark,distance});
  assert.equal(pose.underCover,true);
  assert.equal(pose.perched,false);
  assert.equal(pose.heightOffset,0);
});

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

test("un isópodo que busca Tronco hueco se representa debajo del arco durante la aproximación",()=>{
  const entity={behavior:"seeking-shelter",intent:"shelter",targetResourceId:"bark-approach"};
  const refuge={resource:{id:"bark-approach",type:"bark"},distance:.38};
  const pose=resolveIsopodRefugePose(entity,refuge);
  assert.equal(pose.underCover,true);
  assert.equal(pose.perched,false);
  assert.equal(pose.heightOffset,0);
});

test("un isópodo que busca otro refugio no se oculta bajo un Tronco hueco cercano",()=>{
  const entity={behavior:"seeking-shelter",intent:"shelter",targetResourceId:"shelter-target"};
  const refuge={resource:{id:"bark-nearby",type:"bark"},distance:.2};
  const pose=resolveIsopodRefugePose(entity,refuge);
  assert.equal(pose.underCover,false);
  assert.equal(pose.perched,true);
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
