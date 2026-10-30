import { normalizeSeed, deriveSeed } from "./rng.js";
import { ACTION_POINTS_PER_RUN, START_NODE_ID, EXPEDITION_NODES, EXPEDITION_EVENT_TYPES, EXPEDITION_UPGRADES, INVENTORY_KEYS } from "./content.js";
export const DEFAULT_WORLD_SEED=0x1a2b3c4d;
const isRecord=value=>Boolean(value)&&typeof value==="object"&&!Array.isArray(value);
export function createExpeditionProgress(worldSeed=DEFAULT_WORLD_SEED){
  return {version:1,worldSeed:normalizeSeed(worldSeed),expeditionCount:0,lastExpeditionDay:0,
    inventory:{organicMatter:0,decomposedWood:0,freshMoss:0,dewDrops:0},upgrades:[],discoveries:[],active:null};
}
function normalizeRun(run,progress){
  if(run===null||run===undefined)return null;
  if(!isRecord(run)||run.status!=="active")throw new Error("La expedición guardada no tiene un estado válido");
  if(!Number.isSafeInteger(run.seed)||run.seed<0||run.seed>0xffffffff)throw new Error("La semilla de expedición no es válida");
  if(typeof run.id!=="string"||run.id!==`expedition-${String(progress.expeditionCount).padStart(4,"0")}`)throw new Error("El identificador de expedición no coincide con el contador");
  if(typeof run.explorerId!=="string"||!run.explorerId.trim())throw new Error("La expedición guardada no tiene explorador");
  if(!Number.isSafeInteger(run.day)||run.day<1||run.day!==progress.lastExpeditionDay)throw new Error("El día de la expedición activa no coincide con el progreso");
  if(run.seed!==deriveSeed(progress.worldSeed,progress.expeditionCount,"expedition-v1"))throw new Error("La semilla de la run no coincide con el mundo");
  if(!Number.isSafeInteger(run.actionPoints)||run.actionPoints<0||run.actionPoints>ACTION_POINTS_PER_RUN)throw new Error("Las acciones guardadas no son válidas");
  if(!Number.isSafeInteger(run.energy)||run.energy<0||run.energy>100)throw new Error("La energía guardada no es válida");
  if(typeof run.currentNodeId!=="string"||!EXPEDITION_NODES[run.currentNodeId])throw new Error("La posición de expedición no es válida");
  if(!Array.isArray(run.visitedNodes)||run.visitedNodes[0]!==START_NODE_ID||!run.visitedNodes.every(id=>Boolean(EXPEDITION_NODES[id]))||new Set(run.visitedNodes).size!==run.visitedNodes.length||!run.visitedNodes.includes(run.currentNodeId))throw new Error("Los nodos visitados no son válidos");
  for(let i=1;i<run.visitedNodes.length;i++)if(!EXPEDITION_NODES[run.visitedNodes[i-1]].links.includes(run.visitedNodes[i]))throw new Error("La ruta guardada contiene nodos desconectados");
  if(!Array.isArray(run.resolvedEventIds)||!run.resolvedEventIds.every(id=>typeof id==="string")||new Set(run.resolvedEventIds).size!==run.resolvedEventIds.length)throw new Error("El historial de eventos no es válido");
  if(!isRecord(run.loot))throw new Error("El botín guardado no es válido");
  const loot={organicMatter:0,decomposedWood:0,freshMoss:0,dewDrops:0};
  for(const key of INVENTORY_KEYS){const amount=run.loot[key]??0;if(!Number.isSafeInteger(amount)||amount<0)throw new Error("El botín contiene una cantidad no válida");loot[key]=amount;}
  const discoveries=run.loot.discoveries??[];
  if(!Array.isArray(discoveries)||!discoveries.every(id=>typeof id==="string"&&id.length>0))throw new Error("Los descubrimientos del botín no son válidos");
  loot.discoveries=[...new Set(discoveries)];
  let pendingEvent=null;
  if(run.pendingEvent!==null&&run.pendingEvent!==undefined){
    const event=run.pendingEvent,slot=run.visitedNodes.indexOf(event?.nodeId),template=EXPEDITION_EVENT_TYPES[event?.type];
    if(!isRecord(event)||!template||event.nodeId!==run.currentNodeId||slot<0||event.id!==`${run.id}:${event.nodeId}:${slot}:${event.type}`||run.resolvedEventIds.includes(event.id))throw new Error("El evento pendiente no coincide con la ruta guardada");
    const allowed=EXPEDITION_NODES[event.nodeId].events.some(([type])=>type===event.type);
    if(!allowed||event.title!==template.title||event.description!==template.description||JSON.stringify(event.options)!==JSON.stringify(template.options))throw new Error("El contenido del evento guardado no es válido");
    pendingEvent=structuredClone(event);
  }
  return {id:run.id,day:run.day,seed:run.seed>>>0,explorerId:run.explorerId,wasRunning:Boolean(run.wasRunning),status:"active",
    actionPoints:run.actionPoints,energy:run.energy,currentNodeId:run.currentNodeId,visitedNodes:[...run.visitedNodes],
    resolvedEventIds:[...run.resolvedEventIds],pendingEvent,loot};
}
export function normalizeExpeditionProgress(value,worldSeed=DEFAULT_WORLD_SEED){
  if(value===null||value===undefined)return createExpeditionProgress(worldSeed);
  if(!isRecord(value))throw new TypeError("El progreso de expediciones debe ser un objeto");
  const seed=normalizeSeed(value.worldSeed);
  if(value.version!==1)throw new Error("La versión del progreso de expediciones no es compatible");
  if(!Number.isSafeInteger(value.expeditionCount)||value.expeditionCount<0)throw new Error("El contador de expediciones no es válido");
  if(!Number.isSafeInteger(value.lastExpeditionDay)||value.lastExpeditionDay<0)throw new Error("El día de la última expedición no es válido");
  const inventory={organicMatter:0,decomposedWood:0,freshMoss:0,dewDrops:0};
  if(!isRecord(value.inventory))throw new Error("El inventario de expedición no es válido");
  for(const key of INVENTORY_KEYS){const amount=value.inventory[key]??0;if(!Number.isSafeInteger(amount)||amount<0)throw new Error("El inventario contiene una cantidad no válida");inventory[key]=amount;}
  if(!Array.isArray(value.upgrades)||!value.upgrades.every(id=>Object.hasOwn(EXPEDITION_UPGRADES,id))||new Set(value.upgrades).size!==value.upgrades.length)throw new Error("Las mejoras instaladas no son válidas");
  if(!Array.isArray(value.discoveries)||!value.discoveries.every(id=>typeof id==="string"&&id.length>0))throw new Error("Los descubrimientos no son válidos");
  const active=normalizeRun(value.active,{...value,worldSeed:seed});
  return {version:1,worldSeed:seed,expeditionCount:value.expeditionCount,lastExpeditionDay:value.lastExpeditionDay,inventory,upgrades:[...value.upgrades],discoveries:[...new Set(value.discoveries)],active};
}
