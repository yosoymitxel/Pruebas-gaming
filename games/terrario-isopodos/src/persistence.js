export const SAVE_KEY="terrario-isopodos.save.v1";
export function serializeTerrarium(state){return JSON.stringify({schemaVersion:1,savedAt:new Date().toISOString(),state:{version:state.version,clockMinutes:state.clockMinutes,running:false,speed:state.speed,habitat:structuredClone(state.habitat),entities:structuredClone(state.entities),resources:structuredClone(state.resources??[])}});}
export function parseTerrarium(raw){
 let data;try{data=JSON.parse(raw);}catch{throw new Error("El guardado no es JSON válido");}
 const s=data?.state;
 if(data?.schemaVersion!==1||!s||s.version!==1||!Number.isFinite(s.clockMinutes)||s.clockMinutes<0||!s.habitat||!Array.isArray(s.entities)||!Array.isArray(s.resources))throw new Error("El guardado no coincide con el esquema 1");
 if(!["rectangular","cilindrico"].includes(s.habitat.shape)||!Number.isFinite(s.habitat.humidity)||s.habitat.humidity<0||s.habitat.humidity>1||!Number.isFinite(s.habitat.temperatureC)||!s.entities.every(e=>typeof e.id==="string"&&Number.isFinite(e.x)&&Number.isFinite(e.z)))throw new Error("El guardado contiene valores inválidos");
 return {...structuredClone(s),running:false,presentation:{mode:"diorama",autoRotate:true}};
}
export function saveTerrarium(state,storage=globalThis.localStorage){const raw=serializeTerrarium(state);storage.setItem(SAVE_KEY,raw);return raw;}
export function loadTerrarium(storage=globalThis.localStorage){const raw=storage.getItem(SAVE_KEY);if(!raw)return null;return parseTerrarium(raw);}
