import test from "node:test";
import assert from "node:assert/strict";
import {createTerrariumState,advanceMinutes,formatClock,snapshotDomain} from "../src/state.js";
import {addFood,addShelter,stepSimulation,sampleMicroclimate} from "../src/simulation.js";
import {constrainToHabitat,HABITAT_GEOMETRY} from "../src/habitat.js";
import {parseTerrarium,serializeTerrarium,saveTerrarium,loadTerrarium,hasValidTerrariumSave,SAVE_KEY} from "../src/persistence.js";

test("el estado inicial contiene una colonia con IDs estables",()=>{
  const s=createTerrariumState();
  assert.equal(s.entities.length,5);
  assert.equal(s.entities[0].id,"isopod-001");
  assert.equal(new Set(s.entities.map(e=>e.id)).size,s.entities.length);
  assert.equal(s.clockMinutes,480);
  assert.equal(s.running,false);
  assert.ok(s.resources.length>=2);
});

test("cambiar presentación no muta el dominio",()=>{
  const s=createTerrariumState();
  const before=snapshotDomain(s);
  s.presentation.mode="voxel";
  s.presentation.autoRotate=false;
  assert.equal(snapshotDomain(s),before);
  assert.equal(s.settings.presentation.mode,"voxel");
  assert.equal(s.settings.presentation.autoRotate,false);
});

test("el reloj acumula tiempo y cruza de día",()=>{
  const s=createTerrariumState();
  advanceMinutes(s,20);
  assert.equal(s.clockMinutes,500);
  advanceMinutes(s,1440);
  assert.equal(s.clockMinutes,1940);
  assert.equal(formatClock(s.clockMinutes),"DÍA 02 · 08:20");
});

test("rechaza avance de reloj inválido",()=>{
  const s=createTerrariumState();
  for(const n of [-1,NaN,Infinity])assert.throws(()=>advanceMinutes(s,n),RangeError);
});

test("formato de hora rechaza valores negativos o no finitos",()=>{
  assert.throws(()=>formatClock(-1),RangeError);
  assert.throws(()=>formatClock(Number.NaN),RangeError);
});

test("la simulación es determinista para el mismo estado inicial",()=>{
  const a=createTerrariumState(),b=createTerrariumState();
  stepSimulation(a,60);
  stepSimulation(b,60);
  assert.deepEqual(a,b);
  assert.equal(a.clockMinutes,540);
  assert.notEqual(a.entities[0].x,-.88);
});

test("la temperatura fuera del rango lúdico aumenta el estrés",()=>{
  const s=createTerrariumState();
  s.habitat.temperatureC=30;
  const before=s.entities[0].stress;
  stepSimulation(s,60);
  assert.ok(s.entities[0].stress>before);
});

test("en temperatura cómoda el estrés no aumenta por temperatura",()=>{
  const s=createTerrariumState();
  s.habitat.temperatureC=21.4;
  const before=s.entities[0].stress;
  stepSimulation(s,1);
  assert.ok(s.entities[0].stress<=before);
});

test("añadir recursos es estable e idempotente para refugios",()=>{
  const s=createTerrariumState();
  addFood(s);
  addFood(s);
  addShelter(s);
  assert.ok(s.resources.filter(r=>r.type==="shelter").length===1);
  assert.ok(s.resources.find(r=>r.type==="leaf-litter").amount<=1);
});

test("guardado recupera dominio y nombre, no la presentación",()=>{
  const s=createTerrariumState();
  s.name="Bosque de prueba";
  stepSimulation(s,30);
  s.presentation.mode="voxel";
  const loaded=parseTerrarium(serializeTerrarium(s));
  assert.equal(loaded.clockMinutes,510);
  assert.equal(loaded.name,"Bosque de prueba");
  assert.equal(loaded.presentation.mode,"diorama");
  assert.deepEqual(loaded.entities,s.entities);
});

test("guardado inválido se rechaza",()=>{
  assert.throws(()=>parseTerrarium("{"));
  assert.throws(()=>parseTerrarium(JSON.stringify({schemaVersion:1,state:{version:1,clockMinutes:-2,habitat:{shape:"rectangular",humidity:.7,temperatureC:20},entities:[],resources:[]}})));
  assert.throws(()=>parseTerrarium(JSON.stringify({schemaVersion:1,gameId:"terrario-isopodos",state:{version:1,clockMinutes:120,habitat:{shape:"triangular",humidity:.7,temperatureC:20},entities:[],resources:[]}})));
});

test("la colonia cambia de conducta cuando sus necesidades evolucionan durante una observación larga",()=>{
  const s=createTerrariumState(),behaviors=new Set();
  for(let i=0;i<480;i++){stepSimulation(s,1);for(const e of s.entities)behaviors.add(e.behavior);}
  assert.ok(behaviors.size>=3,`Se esperaban al menos 3 conductas tras ocho horas simuladas, recibidas: ${[...behaviors].join(", ")}`);
});

test("las necesidades disparan búsqueda de comida, refugio y defensa",()=>{
  const s=createTerrariumState();
  s.entities[0].energy=.2;
  s.entities[1].hydration=.2;
  s.entities[2].stress=.95;
  stepSimulation(s,1);
  assert.ok(["seeking-food","feeding","grooming"].includes(s.entities[0].behavior),`Conducta de comida inesperada: ${s.entities[0].behavior}`);
  assert.ok(["seeking-shelter","resting"].includes(s.entities[1].behavior),`Conducta de refugio inesperada: ${s.entities[1].behavior}`);
  assert.equal(s.entities[2].behavior,"defensive-curl");
});

test("formatea día y hora",()=>{
  assert.equal(formatClock(480),"DÍA 01 · 08:00");
  assert.equal(formatClock(1440),"DÍA 02 · 00:00");
});

test("el guardado rechaza versiones futuras y entidades duplicadas",()=>{
  const valid=JSON.parse(serializeTerrarium(createTerrariumState()));
  const future=structuredClone(valid);future.schemaVersion=2;
  assert.throws(()=>parseTerrarium(JSON.stringify(future)),/versión más reciente/);
  const duplicate=structuredClone(valid);duplicate.state.entities[1].id=duplicate.state.entities[0].id;
  assert.throws(()=>parseTerrarium(JSON.stringify(duplicate)),/valores inválidos|IDs duplicados|esquema 1/);
});

test("el guardado valida rangos de velocidad y microclima",()=>{
  const valid=JSON.parse(serializeTerrarium(createTerrariumState()));
  const invalidSpeed=structuredClone(valid);invalidSpeed.state.speed=9;
  assert.throws(()=>parseTerrarium(JSON.stringify(invalidSpeed)),/esquema 1/);
  const invalidHumidity=structuredClone(valid);invalidHumidity.state.habitat.humidity=1.5;
  assert.throws(()=>parseTerrarium(JSON.stringify(invalidHumidity)),/humedad fuera de rango|esquema 1/);
});

test("guardar y cargar usan una clave estable y propagan fallos de almacenamiento",()=>{
  const values=new Map(),storage={setItem:(k,v)=>values.set(k,v),getItem:k=>values.get(k)??null};
  const state=createTerrariumState();
  saveTerrarium(state,storage);
  assert.ok(values.has(SAVE_KEY));
  assert.equal(loadTerrarium(storage).clockMinutes,state.clockMinutes);
  const blocked={setItem(){throw new Error("quota")},getItem(){throw new Error("blocked")}};
  assert.throws(()=>saveTerrarium(state,blocked),/quota/);
  assert.throws(()=>loadTerrarium(blocked),/blocked/);
});

test("la persistencia admite posiciones válidas en los bordes del recipiente",()=>{
  const s=createTerrariumState();
  s.entities[0].x=1.7;
  s.entities[0].z=1.1;
  const loaded=parseTerrarium(serializeTerrarium(s));
  assert.equal(loaded.entities[0].x,1.7);
  assert.equal(loaded.entities[0].z,1.1);
});

test("solo considera continuable un guardado que se puede restaurar",()=>{
  const values=new Map(),storage={setItem:(k,v)=>values.set(k,v),getItem:k=>values.get(k)??null};
  assert.equal(hasValidTerrariumSave(storage),false);
  storage.setItem(SAVE_KEY,"{");
  assert.equal(hasValidTerrariumSave(storage),false);
  const valid=serializeTerrarium(createTerrariumState());
  storage.setItem(SAVE_KEY,valid);
  assert.equal(hasValidTerrariumSave(storage),true);
  const future=JSON.parse(valid);future.schemaVersion=2;
  storage.setItem(SAVE_KEY,JSON.stringify(future));
  assert.equal(hasValidTerrariumSave(storage),false);
});

test("la geometría compartida mantiene entidades dentro de ambos recipientes",()=>{
  const rectangular=constrainToHabitat(99,-99,"rectangular",.2);
  assert.equal(rectangular.x,HABITAT_GEOMETRY.rectangular.floorWidth/2-.2);
  assert.equal(rectangular.z,-(HABITAT_GEOMETRY.rectangular.floorDepth/2-.2));
  const cylindrical=constrainToHabitat(10,10,"cilindrico",.2);
  assert.ok(Math.hypot(cylindrical.x,cylindrical.z)<=HABITAT_GEOMETRY.cilindrico.floorRadius-.2+1e-9);
});

test("la simulación no permite que un isópodo atraviese el límite rectangular o circular",()=>{
  for(const shape of ["rectangular","cilindrico","esferico"]){
    const s=createTerrariumState();
    s.habitat.shape=shape;
    s.entities[0].x=99;
    s.entities[0].z=-99;
    stepSimulation(s,1);
    if(shape!=="rectangular"){
      assert.ok(Math.hypot(s.entities[0].x,s.entities[0].z)<=HABITAT_GEOMETRY[shape].floorRadius-.2+1e-9);
    }else{
      assert.ok(Math.abs(s.entities[0].x)<=1.4+1e-9);
      assert.ok(Math.abs(s.entities[0].z)<=.85+1e-9);
    }
  }
});


test("la forma esférica se conserva al guardar y restaurar",()=>{
  const s=createTerrariumState();s.habitat.shape="esferico";
  assert.equal(parseTerrarium(serializeTerrarium(s)).habitat.shape,"esferico");
});


test("el refugio y el musgo crean un microclima local más húmedo y oscuro",()=>{
  const s=createTerrariumState();
  s.clockMinutes=720;
  s.habitat.light=1;
  s.resources.push({id:"moss-test",type:"moss",amount:1,x:-.3,z:.2});
  const exposed=sampleMicroclimate(s,1.25,.85);
  const shaded=sampleMicroclimate(s,.8,-.45);
  const moss=sampleMicroclimate(s,-.3,.2);
  assert.ok(shaded.humidity>exposed.humidity);
  assert.ok(shaded.light<exposed.light);
  assert.ok(moss.humidity>exposed.humidity);
  assert.ok(moss.shade>0);
});

test("la luz intensa provoca búsqueda de sombra sin depender de un ciclo artificial",()=>{
  const s=createTerrariumState();
  s.clockMinutes=720;
  s.habitat.light=1;
  Object.assign(s.entities[0],{hydration:.95,energy:.95,stress:.1});
  stepSimulation(s,1);
  assert.equal(s.entities[0].behavior,"seeking-shelter");
});

test("en un ambiente seco el movimiento aumenta y la conducta busca refugio",()=>{
  const damp=createTerrariumState(),dry=createTerrariumState();
  damp.entities[0].x=dry.entities[0].x=.15;
  damp.entities[0].z=dry.entities[0].z=.25;
  damp.habitat.humidity=.88;
  dry.habitat.humidity=.18;
  stepSimulation(damp,1);
  stepSimulation(dry,1);
  const dampDistance=Math.hypot(damp.entities[0].x-.15,damp.entities[0].z-.25);
  const dryDistance=Math.hypot(dry.entities[0].x-.15,dry.entities[0].z-.25);
  assert.equal(dry.entities[0].behavior,"seeking-shelter");
  assert.ok(dryDistance>dampDistance);
});

test("el estado de conglobación depende del estrés y no de un temporizador",()=>{
  const s=createTerrariumState();
  for(const entity of s.entities){entity.hydration=.8;entity.energy=.8;entity.stress=.24;}
  stepSimulation(s,50);
  assert.ok(s.entities.every(entity=>entity.behavior!=="defensive-curl"));
  s.entities[0].stress=.95;
  stepSimulation(s,1);
  assert.equal(s.entities[0].behavior,"defensive-curl");
});

test("la defensa por conglobación se recupera en un refugio y no queda bloqueada",()=>{
  const s=createTerrariumState();
  const entity=s.entities[0];
  const refuge=s.resources.find(resource=>resource.type==="shelter");
  entity.x=refuge.x;entity.z=refuge.z;
  entity.energy=.82;entity.hydration=.82;entity.stress=.95;
  stepSimulation(s,24);
  assert.notEqual(entity.behavior,"defensive-curl","el animal debe abandonar la defensa cuando recupera seguridad");
  assert.ok(entity.stress<.64,"el estrés debe bajar en sombra, recibido "+entity.stress);
  assert.equal(entity.defensiveTicks,0);
});

test("descansar bajo refugio recupera energía e hidratación",()=>{
  const s=createTerrariumState();
  const entity=s.entities[0];
  const refuge=s.resources.find(resource=>resource.type==="shelter");
  const food=s.resources.find(resource=>resource.type==="leaf-litter");
  entity.x=refuge.x;entity.z=refuge.z;entity.energy=.2;entity.hydration=.2;
  food.amount=0;
  const energyBefore=entity.energy,hydrationBefore=entity.hydration;
  stepSimulation(s,20);
  assert.ok(entity.energy>energyBefore,"la energía no se recuperó: "+entity.energy);
  assert.ok(entity.hydration>hydrationBefore,"la hidratación no se recuperó: "+entity.hydration);
  assert.ok(["resting","burrowing"].includes(entity.behavior));
});

test("la navegación esquiva una piedra que bloquea el trayecto a la comida",()=>{
  const s=createTerrariumState();
  const entity=s.entities[0];
  entity.x=0;entity.z=0;entity.energy=.2;entity.hydration=.95;entity.stress=.05;
  const food=s.resources.find(resource=>resource.type==="leaf-litter");
  food.x=0;food.z=.42;food.amount=.8;
  s.resources.push({id:"blocking-stone",type:"stone",amount:1,x:0,z:.085});
  stepSimulation(s,1);
  assert.equal(entity.behavior,"seeking-food");
  assert.ok(Math.abs(entity.x)>.0001,"la ruta debe desviarse lateralmente y no atravesar el obstáculo");
  assert.ok(Number.isFinite(entity.heading));
});

test("la intención conserva el recurso elegido ante pequeñas variaciones de utilidad",()=>{
  const s=createTerrariumState();
  const entity=s.entities[0];
  entity.x=0;entity.z=0;entity.energy=.18;entity.hydration=.8;
  const food=s.resources.find(resource=>resource.type==="leaf-litter");
  food.x=0;food.z=.35;food.amount=.9;
  stepSimulation(s,1);
  assert.equal(entity.targetResourceId,food.id);
  s.resources.push({id:"nearby-moss",type:"moss",amount:1,x:.02,z:.03});
  entity.hydration=.77;
  stepSimulation(s,1);
  assert.equal(entity.targetResourceId,food.id,"no debe alternar comida/refugio por una fluctuación pequeña");
});

test("el tarro cilíndrico mantiene proporciones bajas frente a su diámetro",()=>{
  const {floorRadius,wallHeight}=HABITAT_GEOMETRY.cilindrico;
  assert.ok(wallHeight<=1.0,`el tarro no debe volver a una pared de pecera: ${wallHeight}`);
  assert.ok(wallHeight>floorRadius*.5 && wallHeight<floorRadius*.7);
});

test("el globo esférico tiene base plana coherente con el diámetro del suelo",()=>{
  const {floorRadius,outerRadius,wallHeight}=HABITAT_GEOMETRY.esferico;
  assert.ok(floorRadius<outerRadius,"el suelo debe quedar dentro del radio exterior");
  const capHeight=outerRadius+Math.sqrt(outerRadius**2-floorRadius**2);
  assert.ok(Math.abs(capHeight-wallHeight)<.025,"la altura de la cúpula debe coincidir con el corte de su base");
  assert.ok(wallHeight>1.6 && wallHeight<2.0,"el globo no debe recuperar el exceso de cámara vacía");
});
