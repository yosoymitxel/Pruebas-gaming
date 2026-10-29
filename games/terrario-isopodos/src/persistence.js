export const SAVE_KEY="terrario-isopodos.save.v1";
const SCHEMA_VERSION=1;
const SHAPES=new Set(["rectangular","cilindrico"]);
const MODES=new Set(["diorama","voxel"]);

export function serializeTerrarium(state){
 return JSON.stringify({
  schemaVersion:SCHEMA_VERSION,
  gameId:"terrario-isopodos",
  savedAt:new Date().toISOString(),
  state:{
   version:state.version,
   name:state.name??"Pequeño bosque",
   clockMinutes:state.clockMinutes,
   running:false,
   speed:state.speed,
   habitat:structuredClone(state.habitat),
   entities:structuredClone(state.entities),
   resources:structuredClone(state.resources??[])
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
 const h=s.habitat;
 if(!SHAPES.has(h.shape)||!Number.isFinite(h.humidity)||h.humidity<.2||h.humidity>1||
  !Number.isFinite(h.temperatureC)||h.temperatureC<10||h.temperatureC>30||
  !s.entities.every(e=>e&&typeof e.id==="string"&&e.id.length>0&&typeof e.kind==="string"&&
   Number.isFinite(e.x)&&e.x>=-1.75&&e.x<=1.75&&Number.isFinite(e.z)&&e.z>=-1.28&&e.z<=1.28)||
  new Set(s.entities.map(e=>e.id)).size!==s.entities.length||
  !s.resources.every(r=>r&&typeof r.id==="string"&&typeof r.type==="string"&&
   Number.isFinite(r.amount)&&r.amount>=0&&Number.isFinite(r.x)&&Number.isFinite(r.z)))
  throw new Error("El guardado contiene valores inválidos");
 return {
  ...structuredClone(s),
  name:typeof s.name==="string"&&s.name.trim()?s.name.trim().slice(0,40):"Pequeño bosque",
  running:false,
  presentation:{mode:"diorama",autoRotate:true}
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
