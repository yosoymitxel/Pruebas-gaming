const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
export const MODEL_VERSION=1;
export function stepSimulation(state,minutes=1){
 if(!Number.isInteger(minutes)||minutes<1||minutes>1440)throw new RangeError("minutes debe ser entero entre 1 y 1440");
 for(let minute=0;minute<minutes;minute++){
  state.clockMinutes++;
  const h=state.habitat;
  h.humidity=clamp(h.humidity,0,1);h.temperatureC=clamp(h.temperatureC,5,35);
  for(const e of state.entities){
   if(e.alive===false)continue;
   e.hydration=clamp((e.hydration??.8)-(0.00012*Math.max(.2,1-h.humidity)),0,1);
   e.energy=clamp((e.energy??.8)-.00008,0,1);
   const food=state.resources.find(r=>r.type==="leaf-litter"&&r.amount>0);
   const shelter=state.resources.find(r=>r.type==="shelter");
   let target=null;
   if(e.hydration<.48||e.stress>.7)target=shelter;
   else if(e.energy<.65)target=food;
   if(target){
    const dx=target.x-e.x,dz=target.z-e.z,d=Math.hypot(dx,dz);
    if(d<.12){e.behavior=target.type==="leaf-litter"?"feeding":"resting";if(target.type==="leaf-litter"){target.amount=Math.max(0,target.amount-.0007);e.energy=clamp(e.energy+.0018,0,1);}else{e.hydration=clamp(e.hydration+.0008,0,1);e.stress=clamp((e.stress??.2)-.0008,0,1);}}
    else{const move=Math.min(.018,d);e.x+=dx/d*move;e.z+=dz/d*move;e.heading=Math.atan2(dx,dz);e.behavior=target.type==="leaf-litter"?"seeking-food":"seeking-shelter";}
   }else{e.behavior="exploring";const turn=Math.sin((state.clockMinutes+e.id.length)*.13)*.035;e.heading=(e.heading??0)+turn;e.x+=Math.sin(e.heading)*.003;e.z+=Math.cos(e.heading)*.003;}
   const radius=h.shape==="cilindrico"?1.28:1.55;
   if(h.shape==="cilindrico"){const d=Math.hypot(e.x,e.z);if(d>radius){e.x=e.x/d*radius;e.z=e.z/d*radius;}}
   else{e.x=clamp(e.x,-1.75,1.75);e.z=clamp(e.z,-1.15,1.15);}
   if(e.hydration<=0||e.energy<=0)e.stress=clamp((e.stress??0)+.002,0,1);
   if(e.hydration<.15&&e.energy<.1)e.alive=false;
  }
 }
 return state;
}
export function addFood(state){const existing=state.resources.find(r=>r.type==="leaf-litter");if(existing)existing.amount=Math.min(1,existing.amount+.35);else state.resources.push({id:"leaf-litter-1",type:"leaf-litter",amount:.35,x:-.8,z:.45});return state;}
export function addShelter(state){if(!state.resources.some(r=>r.type==="shelter"))state.resources.push({id:"shelter-1",type:"shelter",amount:1,x:.8,z:-.45});return state;}
