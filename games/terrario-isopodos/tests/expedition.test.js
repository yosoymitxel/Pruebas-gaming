import test from "node:test";
import assert from "node:assert/strict";
import {createTerrariumState} from "../src/state.js";
import {serializeTerrarium,parseTerrarium} from "../src/persistence.js";
import {createRng,deriveSeed,weightedPick} from "../src/expedition/rng.js";
import {EXPEDITION_NODES,EXPEDITION_UPGRADES,START_NODE_ID} from "../src/expedition/content.js";
import {isExpeditionGraphConnected,startExpedition,travelToNode,resolveExpeditionEvent,returnFromExpedition,buyExpeditionUpgrade} from "../src/expedition/system.js";
function fresh(seed=0x12345678){return createTerrariumState({seed});}
function startAtEventType(type){
  for(let seed=1;seed<10000;seed++){
    const state=fresh(seed);startExpedition(state,"isopod-001");resolveFirst(state);travelToNode(state,"rotting-log");
    if(state.expeditionProgress.active.pendingEvent.type===type)return state;
  }
  throw new Error("No se encontró una semilla de prueba para el evento "+type);
}
function resolveFirst(state){return resolveExpeditionEvent(state,state.expeditionProgress.active.pendingEvent.options[0].id);}

test("PRNG propio y semillas derivadas reproducen la secuencia y separan contextos",()=>{
  const a=createRng(987654321),b=createRng(987654321),sequence=Array.from({length:5},()=>a());
  assert.deepEqual(sequence,[0.9514403040520847,0.13489632960408926,0.01530607370659709,0.9139348547905684,0.6291038701310754]);
  assert.deepEqual(sequence,Array.from({length:5},()=>b()));assert.ok(sequence.every(v=>v>=0&&v<1));
  assert.notEqual(deriveSeed(12,"garden-entry",0),deriveSeed(12,"garden-entry",1));
  assert.notEqual(deriveSeed(12,"garden-entry",0),deriveSeed(12,"rotting-log",0));
  assert.throws(()=>createRng(-1),RangeError);
});
test("la selección ponderada es determinista y rechaza tablas inválidas",()=>{
  assert.equal(weightedPick(123,[{value:"a",weight:1},{value:"b",weight:4}]),weightedPick(123,[{value:"a",weight:1},{value:"b",weight:4}]));
  assert.throws(()=>weightedPick(1,[]),/vacía/);assert.throws(()=>weightedPick(1,[{value:"x",weight:0}]),/positivos/);
});
test("el mapa tiene cinco nodos y es totalmente alcanzable",()=>{
  assert.equal(Object.keys(EXPEDITION_NODES).length,5);assert.equal(isExpeditionGraphConnected(),true);
  assert.ok(EXPEDITION_NODES[START_NODE_ID].links.length>0);
  for(const node of Object.values(EXPEDITION_NODES))for(const other of node.links)assert.ok(EXPEDITION_NODES[other].links.includes(node.id));
});
test("iniciar una expedición fija semilla, día, explorador y seis acciones",()=>{
  const state=fresh(),run=startExpedition(state,"isopod-001",{wasRunning:true});
  assert.equal(run.day,1);assert.equal(run.seed,deriveSeed(0x12345678,1,"expedition-v1"));assert.equal(run.actionPoints,6);
  assert.equal(run.energy,84);assert.equal(run.currentNodeId,START_NODE_ID);assert.ok(run.pendingEvent);assert.equal(state.running,false);
  assert.throws(()=>startExpedition(state,"isopod-002"),/activa/);
  assert.throws(()=>startExpedition(fresh(),"missing"),/vivo/);
  const tired=fresh();tired.entities[0].energy=.2;assert.throws(()=>startExpedition(tired,"isopod-001"),/30 de energía/);
});
test("viajar valida conexiones, cobra acciones y genera un evento al descubrir nodo",()=>{
  const state=fresh(),run=startExpedition(state,"isopod-001");resolveFirst(state);
  const before=run.actionPoints,travel=travelToNode(state,"rotting-log");
  assert.equal(run.actionPoints,before-1);assert.equal(travel.nodeId,"rotting-log");assert.ok(run.pendingEvent);
  assert.throws(()=>travelToNode(state,"compost-bin"),/Resuelve/);resolveFirst(state);
  run.actionPoints=0;assert.throws(()=>travelToNode(state,"compost-bin"),/No quedan acciones/);
  assert.throws(()=>travelToNode(state,"not-a-node"),/no existe/);
});
test("cada nodo entrega un solo evento por expedición y no regenera botín al revisitarlo",()=>{
  const state=fresh(),run=startExpedition(state,"isopod-001");resolveFirst(state);
  travelToNode(state,"mossy-stone");const eventId=run.pendingEvent.id;resolveFirst(state);
  travelToNode(state,"garden-entry");const actions=run.actionPoints;
  const visit=travelToNode(state,"mossy-stone");
  assert.equal(visit.event,null);assert.equal(run.pendingEvent,null);assert.ok(run.actionPoints<actions);assert.ok(run.resolvedEventIds.includes(eventId));
});
test("las elecciones pagan puntos y energía antes de aplicar recompensa",()=>{
  const state=startAtEventType("mites"),run=state.expeditionProgress.active;
  const before=run.energy,actions=run.actionPoints,result=resolveExpeditionEvent(state,"forage");
  assert.equal(run.energy,before-10);assert.equal(run.actionPoints,actions-1);assert.equal(result.rewards.organicMatter,2);
  assert.throws(()=>resolveExpeditionEvent(state,"forage"),/No hay un evento pendiente/);
});
test("la elección con energía insuficiente no consume acción ni cambia el botín",()=>{
  const state=startAtEventType("web"),run=state.expeditionProgress.active;
  run.energy=0;const actions=run.actionPoints,loot=structuredClone(run.loot);
  assert.throws(()=>resolveExpeditionEvent(state,"break"),/energía suficiente/);
  assert.equal(run.actionPoints,actions);assert.deepEqual(run.loot,loot);
});
test("el mismo mundo y la misma secuencia de decisiones producen los mismos eventos y recompensas",()=>{
  const a=fresh(),b=fresh(),ra=startExpedition(a,"isopod-001"),rb=startExpedition(b,"isopod-001");
  assert.deepEqual(ra.pendingEvent,rb.pendingEvent);
  resolveFirst(a);resolveFirst(b);travelToNode(a,"rotting-log");travelToNode(b,"rotting-log");
  assert.deepEqual(a.expeditionProgress.active.pendingEvent,b.expeditionProgress.active.pendingEvent);
  resolveFirst(a);resolveFirst(b);assert.deepEqual(a.expeditionProgress.active,b.expeditionProgress.active);
});
test("el regreso liquida botín una vez, recupera energía y avanza exactamente un día",()=>{
  const state=fresh(),run=startExpedition(state,"isopod-001"),previousClock=state.clockMinutes;
  run.loot.organicMatter=3;run.loot.dewDrops=2;
  const result=returnFromExpedition(state);
  assert.equal(result.dayAfter,result.dayBefore+1);assert.equal(state.clockMinutes,previousClock+1440);
  assert.equal(state.expeditionProgress.inventory.organicMatter,3);assert.equal(state.expeditionProgress.inventory.dewDrops,2);
  assert.equal(state.expeditionProgress.active,null);assert.equal(state.running,run.wasRunning);assert.throws(()=>returnFromExpedition(state),/No hay una expedición activa/);
});
test("el guardado v3 conserva run activa, evento pendiente y semilla exacta",()=>{
  const state=fresh();startExpedition(state,"isopod-002");
  const raw=serializeTerrarium(state),restored=parseTerrarium(raw);
  assert.equal(JSON.parse(raw).schemaVersion,3);assert.deepEqual(restored.expeditionProgress,state.expeditionProgress);
  resolveExpeditionEvent(restored,restored.expeditionProgress.active.pendingEvent.options[0].id);
  assert.equal(restored.expeditionProgress.active.pendingEvent,null);
});
test("los guardados v1 y v2 se migran sin alterar el terrario y crean progreso vacío",()=>{
  const state=fresh(),source=JSON.parse(serializeTerrarium(state));
  for(const version of [1,2]){
    const legacy=structuredClone(source);legacy.schemaVersion=version;delete legacy.state.expeditionProgress;
    const restored=parseTerrarium(JSON.stringify(legacy));
    assert.equal(restored.clockMinutes,state.clockMinutes);assert.equal(restored.expeditionProgress.worldSeed,0x1a2b3c4d);
    assert.equal(restored.expeditionProgress.expeditionCount,0);assert.equal(restored.expeditionProgress.active,null);
  }
});
test("instalar mejoras descuenta materiales y bellotas y crea recursos físicos compatibles",()=>{
  const state=fresh(),progress=state.expeditionProgress;
  progress.inventory={organicMatter:10,decomposedWood:8,freshMoss:8,dewDrops:4};state.coins=20;
  for(const id of Object.keys(EXPEDITION_UPGRADES)){
    const result=buyExpeditionUpgrade(state,id);
    assert.ok(state.resources.some(resource=>resource.id===`expedition-upgrade-${id}`&&resource.type===EXPEDITION_UPGRADES[id].resource.type));
    assert.ok(result.coins>=0);
  }
  assert.deepEqual([...progress.upgrades].sort(),["bark-shelter","moss-garden","organic-bed"]);
  assert.throws(()=>buyExpeditionUpgrade(state,"organic-bed"),/ya está instalada/);
});
test("la compra de mejora es atómica cuando faltan materiales o hay una run activa",()=>{
  const state=fresh(),before=structuredClone(state);
  assert.throws(()=>buyExpeditionUpgrade(state,"organic-bed"),/Falta/);assert.equal(state.coins,before.coins);assert.deepEqual(state.resources,before.resources);
  startExpedition(state,"isopod-001");assert.throws(()=>buyExpeditionUpgrade(state,"organic-bed"),/regresar/);
});
test("retirada desde un encuentro sin resolver no liquida recompensa",()=>{
  const state=fresh();startExpedition(state,"isopod-001");
  const result=returnFromExpedition(state);assert.equal(result.inventory.organicMatter,0);assert.equal(state.expeditionProgress.active,null);
});

test("guardar una ruta que vuelve atrás y descubre una rama conectada conserva el run",()=>{
  const state=fresh();startExpedition(state,"isopod-001");resolveFirst(state);
  travelToNode(state,"mossy-stone");resolveFirst(state);
  travelToNode(state,"garden-entry");
  travelToNode(state,"rotting-log");
  const restored=parseTerrarium(serializeTerrarium(state));
  assert.deepEqual(restored.expeditionProgress.active,state.expeditionProgress.active);
});

test("el cupo diario se bloquea aunque no haya una expedición activa",()=>{
  const state=fresh();
  state.expeditionProgress.lastExpeditionDay=1;
  assert.throws(()=>startExpedition(state,"isopod-001"),/ya realizó una expedición hoy/);
  assert.equal(state.expeditionProgress.active,null);
  assert.equal(state.expeditionProgress.expeditionCount,0);
});
test("el coste exacto permite gastar la última acción y toda la energía sin valores negativos",()=>{
  const state=startAtEventType("web"),run=state.expeditionProgress.active;
  run.actionPoints=1;run.energy=25;
  const result=resolveExpeditionEvent(state,"break");
  assert.equal(result.actionPoints,0);
  assert.equal(result.energy,0);
  assert.equal(run.actionPoints,0);
  assert.equal(run.energy,0);
});
test("las acciones de mapa no avanzan la ecología; solo el regreso procesa 1440 minutos",()=>{
  const state=fresh(),clock=state.clockMinutes,entities=structuredClone(state.entities);
  startExpedition(state,"isopod-001");
  resolveFirst(state);
  travelToNode(state,"mossy-stone");
  resolveFirst(state);
  assert.equal(state.clockMinutes,clock);
  assert.deepEqual(state.entities,entities);
  const result=returnFromExpedition(state);
  assert.equal(result.dayAfter,result.dayBefore+1);
  assert.equal(state.clockMinutes,clock+1440);
});
