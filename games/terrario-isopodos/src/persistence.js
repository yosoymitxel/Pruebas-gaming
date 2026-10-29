const VALID_SHAPES=new Set(["rectangular","cilindrico"]);
const VALID_MODES=new Set(["diorama","voxel"]);

function normalizeHabitat(habitat){
  const habitatShape=habitat?.shape;
  if(!VALID_SHAPES.has(habitatShape))throw new Error("El guardado contiene una forma de terrario no válida");
  if(!Number.isFinite(habitat?.humidity)||habitat.humidity<.2||habitat.humidity>1)
    throw new Error("El guardado contiene humedad fuera de rango");
  if(!Number.isFinite(habitat?.temperatureC)||habitat.temperatureC<10||habitat.temperatureC>30)
    throw new Error("El guardado contiene temperatura fuera de rango");
  return {
    shape: habitatShape,
    humidity:Number(habitat.humidity),
    temperatureC:Number(habitat.temperatureC),
    light:Number.isFinite(habitat?.light)?Number(habitat.light):.35
  };
}

function normalizeEntity(entity,index){
  if(!entity||typeof entity!=="object")throw new Error(`La entidad ${index} del guardado es inválida`);
  if(typeof entity.id!=="string"||!entity.id.trim())throw new Error("El guardado contiene una entidad sin id");
  if(typeof entity.kind!=="string"||!entity.kind.trim())throw new Error("El guardado contiene una entidad sin especie");
  if(!Number.isFinite(entity.x)||!Number.isFinite(entity.z))throw new Error("El guardado contiene posiciones no válidas");
  if(!Number.isFinite(entity.energy)||!Number.isFinite(entity.hydration)||!Number.isFinite(entity.stress))
    throw new Error("El guardado contiene atributos biológicos no válidos");
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

export const SAVE_KEY="terrario-isopodos.save.v1";
const SCHEMA_VERSION=1;

export function serializeTerrarium(state){
  if(!state||typeof state!=="object")throw new TypeError("Se requiere un estado del terrario");
  const habitat=normalizeHabitat(state.habitat ?? {shape:"rectangular",humidity:.78,temperatureC:21.4,light:.35});
  const entities=Array.isArray(state.entities)?state.entities.map(normalizeEntity):[];
  const resources=Array.isArray(state.resources)?state.resources.map(normalizeResource):[];
  return JSON.stringify({
    schemaVersion:SCHEMA_VERSION,
    gameId:"terrario-isopodos",
    savedAt:new Date().toISOString(),
    state:{
      version:state.version ?? 1,
      name:typeof state.name==="string"&&state.name.trim()?state.name.trim().slice(0,40):"Pequeño bosque",
      clockMinutes:Number.isFinite(state.clockMinutes)?Number(state.clockMinutes):0,
      running:false,
      speed:Number.isFinite(state.speed)?Number(state.speed):1,
      habitat,
      entities,
      resources
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

  const habitat=normalizeHabitat(s.habitat);
  const entities=s.entities.map(normalizeEntity);
  const resources=s.resources.map(normalizeResource);
  if(new Set(entities.map(e=>e.id)).size!==entities.length)throw new Error("El guardado contiene IDs duplicados");

  return {
    ...structuredClone(s),
    version:1,
    name:typeof s.name==="string"&&s.name.trim()?s.name.trim().slice(0,40):"Pequeño bosque",
    running:false,
    speed:Number(s.speed),
    habitat,
    entities,
    resources,
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
