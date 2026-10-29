const VALID_SHAPES=new Set(["rectangular","cilindrico"]);
const VALID_MODES=new Set(["diorama","voxel"]);

function normalizeHabitat(habitat){
  const habitatShape=habitat?.shape;
  if(!VALID_SHAPES.has(habitatShape))throw new Error("El guardado contiene una forma de terrario no válida");
  if(!Number.isFinite(habitat?.humidity)||habitat.humidity<.2||habitat.humidity>1)
    throw new Error("El guardado contiene humedad fuera de rango");
  if(!Number.isFinite(habitat?.temperatureC)||habitat.temperatureC<10||habitat.temperatureC>30)
    throw new Error("El guardado contiene temperatura fuera de rango");
  if(!Number.isFinite(habitat?.light)||habitat.light<0||habitat.light>1)
    throw new Error("El guardado contiene luz fuera de rango");
  return {
    shape: habitatShape,
    humidity:Number(habitat.humidity),
    temperatureC:Number(habitat.temperatureC),
    light:Number(habitat.light)
  };
}

function normalizeEntity(entity,index){
  if(!entity||typeof entity!=="object")throw new Error(`La entidad ${index} del guardado es inválida`);
  if(typeof entity.id!=="string"||!entity.id.trim())throw new Error("El guardado contiene una entidad sin id");
  if(typeof entity.kind!=="string"||!entity.kind.trim())throw new Error("El guardado contiene una entidad sin especie");
  if(!Number.isFinite(entity.x)||!Number.isFinite(entity.z))throw new Error("El guardado contiene posiciones no válidas");
  if(!Number.isFinite(entity.energy)||entity.energy<0||entity.energy>1)throw new Error("El guardado contiene energía fuera de rango");
  if(!Number.isFinite(entity.hydration)||entity.hydration<0||entity.hydration>1)throw new Error("El guardado contiene hidratación fuera de rango");
  if(!Number.isFinite(entity.stress)||entity.stress<0||entity.stress>1)throw new Error("El guardado contiene estrés fuera de rango");
  return {
    ...structuredClone(entity),
    id: entity.id,
    kind: entity.kind,
    x:Number(entity.x),
    z:Number(entity.z),
    heading:Number.isFinite(entity.heading)?Number(entity.heading):0,
    energy:Number(entity.energy),
    hydration:Number(entity.hydration),
    stress:Number(entity.stress),
    alive:Boolean(entity.alive ?? true),
    behavior: typeof entity.behavior === "string" ? entity.behavior : "exploring"
  };
}

function normalizeResource(resource,index){
  if(!resource||typeof resource!=="object")throw new Error(`El recurso ${index} del guardado es inválido`);
  if(typeof resource.id!=="string"||!resource.id.trim())throw new Error("El guardado contiene un recurso sin id");
  if(typeof resource.type!=="string"||!resource.type.trim())throw new Error("El guardado contiene un recurso sin tipo");
  if(!Number.isFinite(resource.amount)||resource.amount<0)throw new Error("El guardado contiene un recurso con cantidad inválida");
  if(!Number.isFinite(resource.x)||!Number.isFinite(resource.z))throw new Error("El guardado contiene un recurso con coordenadas inválidas");
  return {
    ...structuredClone(resource),
    id: resource.id,
    type: resource.type,
    amount:Number(resource.amount),
    x:Number(resource.x),
    z:Number(resource.z)
  };
}

function validateStateShape(state){
  if(!state||typeof state!=="object")throw new TypeError("Se requiere un estado del terrario");
  const habitat=normalizeHabitat(state.habitat ?? {shape:"rectangular",humidity:.78,temperatureC:21.4,light:.35});
  const entities=Array.isArray(state.entities)?state.entities.map(normalizeEntity):[];
  const resources=Array.isArray(state.resources)?state.resources.map(normalizeResource):[];
  if(new Set(entities.map(e=>e.id)).size!==entities.length)throw new Error("El guardado contiene IDs duplicados");
  if(new Set(resources.map(r=>r.id)).size!==resources.length)throw new Error("El guardado contiene IDs duplicados en recursos");
  return {
    version:Number(state.version ?? 1),
    name:typeof state.name==="string"&&state.name.trim()?state.name.trim().slice(0,40):"Pequeño bosque",
    clockMinutes:Number.isFinite(state.clockMinutes)?Number(state.clockMinutes):0,
    running:Boolean(state.running),
    speed:Number.isFinite(state.speed)?Number(state.speed):1,
    habitat,
    entities,
    resources,
    coins:Number.isSafeInteger(state.coins)&&state.coins>=0?state.coins:0
  };
}

export const SAVE_KEY="terrario-isopodos.save.v1";
const SCHEMA_VERSION=1;

export function serializeTerrarium(state){
  const validated=validateStateShape(state);
  return JSON.stringify({
    schemaVersion:SCHEMA_VERSION,
    gameId:"terrario-isopodos",
    savedAt:new Date().toISOString(),
    state:{
      ...validated,
      version:1,
      running:false,
      speed:validated.speed
    }
  });
}

export function parseTerrarium(raw){
  let data;
  try{data=JSON.parse(raw);}catch{throw new Error("El guardado no es JSON válido");}
  if(data?.schemaVersion>SCHEMA_VERSION)throw new Error("El guardado pertenece a una versión más reciente del juego");
  const s=data?.state;
  if(data?.schemaVersion!==SCHEMA_VERSION||(data?.gameId&&data.gameId!=="terrario-isopodos")||!s||s.version!==1||
     !Number.isFinite(s.clockMinutes)||s.clockMinutes<0||!Number.isFinite(s.speed)||s.speed<1||s.speed>4||
     !s.habitat||!Array.isArray(s.entities)||!Array.isArray(s.resources))
    throw new Error("El guardado no coincide con el esquema 1");

  const sanitized=validateStateShape(s);
  return {
    ...sanitized,
    version:1,
    name:sanitized.name,
    running:false,
    speed:Number(s.speed),
    presentation:{mode:VALID_MODES.has(s.presentation?.mode)?s.presentation.mode:"diorama",autoRotate:Boolean(s.presentation?.autoRotate ?? true)}
  };
}

export function saveTerrarium(state,storage=globalThis.localStorage){
  const raw=serializeTerrarium(state);
  storage.setItem(SAVE_KEY,raw);
  return raw;
}

export function loadTerrarium(storage=globalThis.localStorage){
  const raw=storage.getItem(SAVE_KEY);
  if(!raw)return null;
  return parseTerrarium(raw);
}
