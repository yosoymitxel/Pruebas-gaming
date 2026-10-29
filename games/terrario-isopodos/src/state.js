export function createTerrariumState(){
  const state={
    version:1,
    name:"Pequeño bosque",
    clockMinutes:480,
    running:false,
    speed:1,
    habitat:{shape:"rectangular",humidity:.78,temperatureC:21.4,light:.35},
    entities:[
      {id:"isopod-001",kind:"armadillidium-vulgare",x:-.88,z:-.42,heading:.4,energy:.84,hydration:.82,stress:.18,alive:true,behavior:"exploring"},
      {id:"isopod-002",kind:"armadillidium-vulgare",x:-.38,z:.48,heading:1.1,energy:.76,hydration:.79,stress:.16,alive:true,behavior:"exploring"},
      {id:"isopod-003",kind:"armadillidium-vulgare",x:.12,z:.04,heading:2.4,energy:.81,hydration:.86,stress:.2,alive:true,behavior:"exploring"},
      {id:"isopod-004",kind:"armadillidium-vulgare",x:.62,z:-.52,heading:3.1,energy:.73,hydration:.8,stress:.14,alive:true,behavior:"exploring"},
      {id:"isopod-005",kind:"armadillidium-vulgare",x:.98,z:.42,heading:4.2,energy:.79,hydration:.84,stress:.17,alive:true,behavior:"exploring"}
    ],
    resources:[
      {id:"leaf-litter-1",type:"leaf-litter",amount:.65,x:-.8,z:.45},
      {id:"shelter-1",type:"shelter",amount:1,x:.8,z:-.45}
    ],
    settings:{
      presentation:{mode:"diorama",autoRotate:true},
      quality:"balanced"
    }
  };

  Object.defineProperty(state,"presentation",{
    configurable:true,
    enumerable:true,
    get(){return this.settings.presentation;},
    set(value){if(!value||typeof value!=="object")throw new TypeError("presentation debe ser un objeto");this.settings.presentation={...this.settings.presentation,...value};}
  });

  return state;
}

export function snapshotDomain(s){
  if(!s||typeof s!=="object")throw new TypeError("Se requiere un estado del terrario");
  return JSON.stringify({
    version:s.version ?? 1,
    name:String(s.name ?? "Pequeño bosque").slice(0,40),
    clockMinutes:Number(s.clockMinutes ?? 0),
    running:Boolean(s.running),
    speed:Number(s.speed ?? 1),
    habitat:{...s.habitat},
    entities:structuredClone(Array.isArray(s.entities)?s.entities:[]),
    resources:structuredClone(Array.isArray(s.resources)?s.resources:[])
  });
}

export function advanceMinutes(s,n){
  if(!s||typeof s!=="object")throw new TypeError("Se requiere un estado del terrario");
  if(!Number.isFinite(n)||n<0)throw new RangeError("minutes debe ser un número no negativo");
  s.clockMinutes=Number(s.clockMinutes ?? 0)+n;
  if(!Number.isFinite(s.clockMinutes))throw new RangeError("minutes resultó no finito");
  return s.clockMinutes;
}

export function formatClock(n){
  if(!Number.isFinite(n)||n<0)throw new RangeError("minutes debe ser un número no negativo");
  const day=Math.floor(n/1440)+1;
  const minutes=n%1440;
  return `DÍA ${String(day).padStart(2,"0")} · ${String(Math.floor(minutes/60)).padStart(2,"0")}:${String(Math.floor(minutes%60)).padStart(2,"0")}`;
}
