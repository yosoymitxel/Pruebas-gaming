import { stepSimulation } from "../simulation.js";
import { constrainToHabitat } from "../habitat.js";
import { normalizeExpeditionProgress } from "./state.js";
import { deriveSeed, weightedPick } from "./rng.js";
import { ACTION_POINTS_PER_RUN, MIN_EXPLORER_ENERGY, START_NODE_ID, EXPEDITION_NODES, EXPEDITION_EVENT_TYPES, EXPEDITION_UPGRADES, INVENTORY_KEYS } from "./content.js";
const clamp01=value=>Math.min(1,Math.max(0,value));
const currentDay=state=>Math.floor(state.clockMinutes/1440)+1;
function requireProgress(state){
  if(!state||typeof state!=="object"||!Array.isArray(state.entities)||!Array.isArray(state.resources)||!state.habitat)throw new TypeError("Se requiere un terrario válido");
  state.expeditionProgress=normalizeExpeditionProgress(state.expeditionProgress);
  return state.expeditionProgress;
}
function requireRun(state){
  const progress=requireProgress(state);
  if(!progress.active)throw new Error("No hay una expedición activa");
  return {progress,run:progress.active};
}
const emptyLoot=()=>({organicMatter:0,decomposedWood:0,freshMoss:0,dewDrops:0,discoveries:[]});
function createNodeEvent(run,nodeId,slot){
  const node=EXPEDITION_NODES[nodeId],seed=deriveSeed(run.seed,nodeId,slot,"event");
  const type=weightedPick(seed,node.events.map(([value,weight])=>({value,weight})));
  const template=EXPEDITION_EVENT_TYPES[type];
  return {id:`${run.id}:${nodeId}:${slot}:${type}`,type,nodeId,title:template.title,description:template.description,options:template.options.map(option=>structuredClone(option))};
}
export function listReachableNodes(nodeId){const node=EXPEDITION_NODES[nodeId];return node?[...node.links]:[];}
export function isExpeditionGraphConnected(){
  const visited=new Set([START_NODE_ID]),queue=[START_NODE_ID];
  while(queue.length){const current=queue.shift();for(const next of EXPEDITION_NODES[current].links)if(!visited.has(next)){visited.add(next);queue.push(next);}}
  return visited.size===Object.keys(EXPEDITION_NODES).length;
}
export function startExpedition(state,explorerId,{wasRunning=Boolean(state?.running)}={}){
  const progress=requireProgress(state);
  if(progress.active)throw new Error("Ya hay una expedición activa");
  const day=currentDay(state);
  if(progress.lastExpeditionDay>=day)throw new Error("La colonia ya realizó una expedición hoy");
  const explorer=state.entities.find(entity=>entity.id===explorerId&&entity.alive!==false);
  if(!explorer)throw new Error("El explorador debe pertenecer a la colonia y seguir vivo");
  const energy=Math.round(clamp01(Number(explorer.energy)||0)*100);
  if(energy<MIN_EXPLORER_ENERGY)throw new Error("El explorador necesita al menos 30 de energía");
  const count=progress.expeditionCount+1,seed=deriveSeed(progress.worldSeed,count,"expedition-v1");
  const run={id:`expedition-${String(count).padStart(4,"0")}`,day,seed,explorerId,wasRunning,status:"active",
    actionPoints:ACTION_POINTS_PER_RUN,energy,currentNodeId:START_NODE_ID,visitedNodes:[START_NODE_ID],resolvedEventIds:[],pendingEvent:null,loot:emptyLoot()};
  run.pendingEvent=createNodeEvent(run,START_NODE_ID,0);
  progress.expeditionCount=count;progress.lastExpeditionDay=day;progress.active=run;state.running=false;
  return run;
}
export function travelToNode(state,nodeId){
  const {run}=requireRun(state);
  if(run.pendingEvent)throw new Error("Resuelve el encuentro actual antes de viajar");
  const destination=EXPEDITION_NODES[nodeId];
  if(!destination)throw new Error("El lugar seleccionado no existe");
  const current=EXPEDITION_NODES[run.currentNodeId];
  if(!current?.links.includes(nodeId))throw new Error("Ese lugar no está conectado con tu posición actual");
  if(run.actionPoints<destination.travelCost)throw new Error("No quedan acciones suficientes para llegar a ese lugar");
  if(run.visitedNodes.includes(nodeId)){run.actionPoints-=destination.travelCost;run.currentNodeId=nodeId;return {nodeId,event:null,actionPoints:run.actionPoints};}
  run.actionPoints-=destination.travelCost;run.currentNodeId=nodeId;run.visitedNodes.push(nodeId);
  run.pendingEvent=createNodeEvent(run,nodeId,run.visitedNodes.length-1);
  return {nodeId,event:run.pendingEvent,actionPoints:run.actionPoints};
}
export function resolveExpeditionEvent(state,choiceId){
  const {run}=requireRun(state),event=run.pendingEvent;
  if(!event)throw new Error("No hay un evento pendiente que resolver");
  if(run.resolvedEventIds.includes(event.id))throw new Error("Este evento ya fue resuelto");
  const choice=event.options.find(option=>option.id===choiceId);
  if(!choice)throw new Error("La opción elegida no existe para este evento");
  if(run.actionPoints<choice.actionCost)throw new Error("No quedan acciones suficientes para esa elección");
  if(run.energy<choice.energyCost)throw new Error("El explorador no tiene energía suficiente");
  const rewards=choice.rewards??{};
  for(const key of Object.keys(rewards))if(!INVENTORY_KEYS.includes(key)||!Number.isSafeInteger(rewards[key])||rewards[key]<0)throw new Error("La recompensa del evento no es válida");
  const discoveries=choice.discoveries??[];
  if(!Array.isArray(discoveries)||!discoveries.every(id=>typeof id==="string"&&id.length>0))throw new Error("El descubrimiento del evento no es válido");
  run.actionPoints-=choice.actionCost;run.energy-=choice.energyCost;
  for(const key of INVENTORY_KEYS)run.loot[key]+=rewards[key]??0;
  for(const id of discoveries)if(!run.loot.discoveries.includes(id))run.loot.discoveries.push(id);
  run.resolvedEventIds.push(event.id);run.pendingEvent=null;
  return {eventId:event.id,choiceId,actionPoints:run.actionPoints,energy:run.energy,rewards:structuredClone(rewards),discoveries:[...discoveries]};
}
export function returnFromExpedition(state){
  const {progress,run}=requireRun(state),explorer=state.entities.find(entity=>entity.id===run.explorerId);
  if(!explorer||explorer.alive===false)throw new Error("El explorador ya no está disponible para regresar");
  const newInventory={...progress.inventory};
  for(const key of INVENTORY_KEYS)newInventory[key]+=run.loot[key];
  const nextDiscoveries=[...new Set([...progress.discoveries,...run.loot.discoveries])];
  const habitatBonus=Number(state.habitat.humidity)>=.65?10:0,stressPenalty=Number(explorer.stress)>=.7?10:0;
  const recoveredEnergy=Math.min(100,run.energy+30+habitatBonus-stressPenalty);
  explorer.energy=clamp01(recoveredEnergy/100);
  explorer.stress=clamp01(Number(explorer.stress||0)+(100-run.energy)/100*.08);
  progress.inventory=newInventory;progress.discoveries=nextDiscoveries;progress.active=null;
  state.running=false;
  stepSimulation(state,1440);
  state.running=run.wasRunning;
  return {expeditionId:run.id,dayBefore:run.day,dayAfter:currentDay(state),inventory:{...newInventory},discoveries:[...nextDiscoveries],wasRunning:run.wasRunning};
}
export function buyExpeditionUpgrade(state,upgradeId){
  const progress=requireProgress(state);
  if(progress.active)throw new Error("Debes regresar de la expedición antes de mejorar el terrario");
  const upgrade=EXPEDITION_UPGRADES[upgradeId];
  if(!upgrade)throw new Error("La mejora seleccionada no existe");
  if(progress.upgrades.includes(upgradeId))throw new Error("Esta mejora ya está instalada");
  const coins=Number.isSafeInteger(state.coins)&&state.coins>=0?state.coins:0;
  for(const [key,cost] of Object.entries(upgrade.cost)){
    const available=key==="coins"?coins:progress.inventory[key]??0;
    if(available<cost)throw new Error(`Falta ${key==="coins"?"bellotas":key} para instalar la mejora`);
  }
  const resourceId=`expedition-upgrade-${upgradeId}`;
  if(state.resources.some(resource=>resource.id===resourceId))throw new Error("El recurso de esta mejora ya existe en el terrario");
  const position=constrainToHabitat(upgrade.resource.x,upgrade.resource.z,state.habitat.shape,.12);
  const resource={id:resourceId,type:upgrade.resource.type,amount:upgrade.resource.amount,x:position.x,z:position.z};
  const nextInventory={...progress.inventory};
  for(const [key,cost] of Object.entries(upgrade.cost))if(key!=="coins")nextInventory[key]-=cost;
  progress.inventory=nextInventory;state.coins=coins-(upgrade.cost.coins??0);state.resources.push(resource);progress.upgrades.push(upgradeId);
  return {upgradeId,label:upgrade.label,resource:structuredClone(resource),inventory:{...progress.inventory},coins:state.coins};
}
