import test from "node:test";
import assert from "node:assert/strict";
import {createTerrariumState,advanceMinutes,formatClock,snapshotDomain} from "../src/state.js";
import {addFood,addShelter,stepSimulation} from "../src/simulation.js";
import {parseTerrarium,serializeTerrarium,saveTerrarium,loadTerrarium,SAVE_KEY} from "../src/persistence.js";

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
 const s=createTerrariumState(),before=snapshotDomain(s);
 s.presentation.mode="voxel";s.presentation.autoRotate=false;
 assert.equal(snapshotDomain(s),before);
});
test("el reloj acumula tiempo y cruza de día",()=>{
 const s=createTerrariumState();advanceMinutes(s,20);
 assert.equal(s.clockMinutes,500);advanceMinutes(s,1440);
 assert.equal(s.clockMinutes,1940);assert.equal(formatClock(s.clockMinutes),"DÍA 02 · 08:20");
});
test("rechaza avance de reloj inválido",()=>{
 const s=createTerrariumState();for(const n of [-1,NaN,Infinity])assert.throws(()=>advanceMinutes(s,n),RangeError);
});
test("la simulación es determinista para el mismo estado inicial",()=>{
 const a=createTerrariumState(),b=createTerrariumState();
 stepSimulation(a,60);stepSimulation(b,60);
 assert.deepEqual(a,b);assert.equal(a.clockMinutes,540);assert.notEqual(a.entities[0].x,-.88);
});
test("la temperatura fuera del rango lúdico aumenta el estrés",()=>{
 const s=createTerrariumState();s.habitat.temperatureC=30;
 const before=s.entities[0].stress;stepSimulation(s,60);
 assert.ok(s.entities[0].stress>before);
});
test("en temperatura cómoda el estrés no aumenta por temperatura",()=>{
 const s=createTerrariumState();s.habitat.temperatureC=21.4;
 const before=s.entities[0].stress;stepSimulation(s,1);
 assert.ok(s.entities[0].stress<=before);
});
test("añadir recursos es estable e idempotente para refugios",()=>{
 const s=createTerrariumState();addFood(s);addFood(s);addShelter(s);
 assert.ok(s.resources.filter(r=>r.type==="shelter").length===1);
 assert.ok(s.resources.find(r=>r.type==="leaf-litter").amount<=1);
});
test("guardado recupera dominio y nombre, no la presentación",()=>{
 const s=createTerrariumState();s.name="Bosque de prueba";stepSimulation(s,30);s.presentation.mode="voxel";
 const loaded=parseTerrarium(serializeTerrarium(s));
 assert.equal(loaded.clockMinutes,510);assert.equal(loaded.name,"Bosque de prueba");
 assert.equal(loaded.presentation.mode,"diorama");assert.deepEqual(loaded.entities,s.entities);
});
test("guardado inválido se rechaza",()=>{
 assert.throws(()=>parseTerrarium("{"));
 assert.throws(()=>parseTerrarium(JSON.stringify({schemaVersion:1,state:{version:1,clockMinutes:-2,habitat:{shape:"rectangular",humidity:.7,temperatureC:20},entities:[],resources:[]}})));
});
test("la colonia alterna exploración y conductas de descanso",()=>{
 const s=createTerrariumState(),behaviors=new Set();
 for(let i=0;i<90;i++){stepSimulation(s,1);for(const e of s.entities)behaviors.add(e.behavior);}
 assert.ok(behaviors.size>=3,`Se esperaban al menos 3 conductas, recibidas: ${[...behaviors].join(", ")}`);
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
 assert.equal(formatClock(480),"DÍA 01 · 08:00");assert.equal(formatClock(1440),"DÍA 02 · 00:00");
});

test("el guardado rechaza versiones futuras y entidades duplicadas",()=>{
 const valid=JSON.parse(serializeTerrarium(createTerrariumState()));
 const future=structuredClone(valid);future.schemaVersion=2;
 assert.throws(()=>parseTerrarium(JSON.stringify(future)),/versión más reciente/);
 const duplicate=structuredClone(valid);duplicate.state.entities[1].id=duplicate.state.entities[0].id;
 assert.throws(()=>parseTerrarium(JSON.stringify(duplicate)),/valores inválidos/);
});
test("el guardado valida rangos de velocidad y microclima",()=>{
 const valid=JSON.parse(serializeTerrarium(createTerrariumState()));
 const invalidSpeed=structuredClone(valid);invalidSpeed.state.speed=9;
 assert.throws(()=>parseTerrarium(JSON.stringify(invalidSpeed)),/esquema 1/);
 const invalidHumidity=structuredClone(valid);invalidHumidity.state.habitat.humidity=1.5;
 assert.throws(()=>parseTerrarium(JSON.stringify(invalidHumidity)),/valores inválidos/);
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
