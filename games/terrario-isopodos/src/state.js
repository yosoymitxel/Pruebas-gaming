export function createTerrariumState(){
 return {
  version:1,
  name:"Pequeño bosque",
  clockMinutes:480,
  running:false,
  speed:1,
  habitat:{shape:"rectangular",humidity:.78,temperatureC:21.4,light:.35},
  presentation:{mode:"diorama",autoRotate:true},
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
  ]
 };
}
export function snapshotDomain(s){return JSON.stringify({version:s.version,name:s.name,clockMinutes:s.clockMinutes,running:s.running,speed:s.speed,habitat:s.habitat,entities:s.entities,resources:s.resources});}
export function advanceMinutes(s,n){if(!Number.isFinite(n)||n<0)throw new RangeError("minutes debe ser un número no negativo");s.clockMinutes+=n;return s.clockMinutes;}
export function formatClock(n){const day=Math.floor(n/1440)+1,m=n%1440;return `DÍA ${String(day).padStart(2,"0")} · ${String(Math.floor(m/60)).padStart(2,"0")}:${String(Math.floor(m%60)).padStart(2,"0")}`;}
