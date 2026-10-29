const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
export const MODEL_VERSION=1;
// Parámetros lúdicos centralizados; no representan umbrales biológicos validados.
export const BIOLOGY_RULES=Object.freeze({
 hydrationLossPerMinute:0.0011,
 energyLossPerMinute:0.00075,
 temperatureComfortMinC:16,
 temperatureComfortMaxC:25,
 temperatureStressPerDegreeMinute:0.0005,
 comfortableStressRecoveryPerMinute:0.00018,
 foodEnergyGainPerMinute:0.012,
 shelterHydrationGainPerMinute:0.008
});
export function stepSimulation(state,minutes=1){
 if(!Number.isInteger(minutes)||minutes<1||minutes>1440)throw new RangeError("minutes debe ser entero entre 1 y 1440");
 for(let minute=0;minute<minutes;minute++){
  state.clockMinutes++;
  const h=state.habitat;
  h.humidity=clamp(h.humidity,0,1);
  h.temperatureC=clamp(h.temperatureC,5,35);
  const temperatureDistance=Math.max(0,BIOLOGY_RULES.temperatureComfortMinC-h.temperatureC,h.temperatureC-BIOLOGY_RULES.temperatureComfortMaxC);
  for(const e of state.entities){
   if(e.alive===false)continue;
   e.hydration=clamp((e.hydration??.8)-(BIOLOGY_RULES.hydrationLossPerMinute*Math.max(.2,1-h.humidity)),0,1);
   e.energy=clamp((e.energy??.8)-BIOLOGY_RULES.energyLossPerMinute,0,1);
   e.stress=clamp((e.stress??.2)+temperatureDistance*BIOLOGY_RULES.temperatureStressPerDegreeMinute-(temperatureDistance===0?BIOLOGY_RULES.comfortableStressRecoveryPerMinute:0),0,1);
   const food=state.resources.find(r=>r.type==="leaf-litter"&&r.amount>0);
   const shelter=state.resources.find(r=>r.type==="shelter");
   let target=null;
   if(e.hydration<.48||e.stress>.7)target=shelter;
   else if(e.energy<.65)target=food;
   if(target){
    const dx=target.x-e.x,dz=target.z-e.z,d=Math.hypot(dx,dz);
    if(d<.12){
     e.behavior=target.type==="leaf-litter"?"feeding":"resting";
     if(target.type==="leaf-litter"){target.amount=Math.max(0,target.amount-.009);e.energy=clamp(e.energy+BIOLOGY_RULES.foodEnergyGainPerMinute,0,1);}
     else{e.hydration=clamp(e.hydration+BIOLOGY_RULES.shelterHydrationGainPerMinute,0,1);e.stress=clamp(e.stress-.006,0,1);}
    }else{
     const move=Math.min(.055,d);e.x+=dx/d*move;e.z+=dz/d*move;e.heading=Math.atan2(dx,dz);e.behavior=target.type==="leaf-litter"?"seeking-food":"seeking-shelter";
    }
   }else{
    e.behavior="exploring";
    const turn=Math.sin((state.clockMinutes+e.id.length)*.13)*.035;e.heading=(e.heading??0)+turn;e.x+=Math.sin(e.heading)*.012;e.z+=Math.cos(e.heading)*.012;
   }
   const radius=h.shape==="cilindrico"?1.28:1.55;
   if(h.shape==="cilindrico"){const d=Math.hypot(e.x,e.z);if(d>radius){e.x=e.x/d*radius;e.z=e.z/d*radius;}}
   else{e.x=clamp(e.x,-1.75,1.75);e.z=clamp(e.z,-1.15,1.15);}
   if(e.hydration<=0||e.energy<=0)e.stress=clamp(e.stress+.002,0,1);
   if(e.hydration<.15&&e.energy<.1)e.alive=false;
  }
 }
 return state;
}
export function addFood(state){const existing=state.resources.find(r=>r.type==="leaf-litter");if(existing)existing.amount=Math.min(1,existing.amount+.35);else state.resources.push({id:"leaf-litter-1",type:"leaf-litter",amount:.35,x:-.8,z:.45});return state;}
export function addShelter(state){if(!state.resources.some(r=>r.type==="shelter"))state.resources.push({id:"shelter-1",type:"shelter",amount:1,x:.8,z:-.45});return state;}
