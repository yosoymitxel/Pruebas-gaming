const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const identity=e=>[...String(e.id)].reduce((n,c)=>((n*33)^c.charCodeAt(0))>>>0,5381);
export const MODEL_VERSION=1;
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
  if(!state||typeof state!=="object")throw new TypeError("Se requiere un estado del terrario");
  if(!Number.isInteger(minutes)||minutes<1||minutes>1440)throw new RangeError("minutes debe ser entero entre 1 y 1440");

  for(let minute=0;minute<minutes;minute++){
    state.clockMinutes++;
    const h=state.habitat;
    h.humidity=clamp(Number(h.humidity ?? .78),0,1);
    h.temperatureC=clamp(Number(h.temperatureC ?? 21.4),5,35);
    const temperatureDistance=Math.max(0,
      BIOLOGY_RULES.temperatureComfortMinC-h.temperatureC,
      h.temperatureC-BIOLOGY_RULES.temperatureComfortMaxC
    );

    for(const e of state.entities){
      if(e.alive===false)continue;
      const seed=identity(e),cycle=(state.clockMinutes+seed)%47,phase=state.clockMinutes*.11+(seed%97)*.17;
      e.hydration=clamp((e.hydration ?? .8)-(BIOLOGY_RULES.hydrationLossPerMinute*Math.max(.2,1-h.humidity)),0,1);
      e.energy=clamp((e.energy ?? .8)-BIOLOGY_RULES.energyLossPerMinute,0,1);
      e.stress=clamp((e.stress ?? .2)+temperatureDistance*BIOLOGY_RULES.temperatureStressPerDegreeMinute-(temperatureDistance===0?BIOLOGY_RULES.comfortableStressRecoveryPerMinute:0),0,1);

      const food=state.resources.filter(r=>r.type==="leaf-litter"&&r.amount>0).sort((a,b)=>Math.hypot(a.x-e.x,a.z-e.z)-Math.hypot(b.x-e.x,b.z-e.z))[0];
      const shelter=state.resources.filter(r=>r.type==="shelter").sort((a,b)=>Math.hypot(a.x-e.x,a.z-e.z)-Math.hypot(b.x-e.x,b.z-e.z))[0];
      let target=null;
      if(e.stress>.84||(cycle>=18&&cycle<21))e.behavior="defensive-curl";
      else if(e.hydration<.48||e.stress>.7)target=shelter;
      else if(e.energy<.65)target=food;

      if(target){
        const dx=target.x-e.x,dz=target.z-e.z,d=Math.hypot(dx,dz);
        if(d<.14){
          e.behavior=target.type==="leaf-litter"?(cycle%5===0?"grooming":"feeding"):"resting";
          if(target.type==="leaf-litter"){target.amount=Math.max(0,target.amount-.009);e.energy=clamp(e.energy+BIOLOGY_RULES.foodEnergyGainPerMinute,0,1);}
          else{e.hydration=clamp(e.hydration+BIOLOGY_RULES.shelterHydrationGainPerMinute,0,1);e.stress=clamp(e.stress-.006,0,1);}
        }else{
          const move=Math.min(.034+(seed%4)*.004,d),wobble=Math.sin(phase)*.11;
          e.x+=dx/d*move+Math.cos(phase)*wobble*.18;
          e.z+=dz/d*move+Math.sin(phase)*wobble*.18;
          e.heading=Math.atan2(dx,dz)+wobble;
          e.behavior=target.type==="leaf-litter"?"seeking-food":"seeking-shelter";
        }
      }else if(e.behavior==="defensive-curl"){
        e.heading=(e.heading ?? 0)+Math.sin(phase)*.006;
      }else if(cycle>=21&&cycle<27&&h.humidity>=.5){
        e.behavior="burrowing";e.x+=Math.sin(phase)*.003;e.z+=Math.cos(phase)*.003;
      }else{
        const others=state.entities.filter(other=>other!==e&&other.alive!==false);
        const neighbor=others.map(other=>({other,d:Math.hypot(other.x-e.x,other.z-e.z)})).sort((a,b)=>a.d-b.d)[0];
        if(neighbor&&neighbor.d<.23&&cycle%4!==0){
          e.behavior="socializing";
          const away=Math.atan2(e.x-neighbor.other.x,e.z-neighbor.other.z);
          e.heading=(e.heading ?? 0)+Math.sin(away-(e.heading ?? 0))*.06;
          e.x+=Math.sin(e.heading)*.003;
          e.z+=Math.cos(e.heading)*.003;
        }else if(cycle<3){e.behavior="resting";}
        else if(cycle>=3&&cycle<6){e.behavior="grooming";e.heading=(e.heading ?? 0)+Math.sin(phase)*.04;}
        else if(cycle===6){e.behavior="investigating";e.heading=(e.heading ?? 0)+Math.sin(phase)*.12;}
        else{
          e.behavior="exploring";
          const turn=Math.sin(phase)*.045+Math.cos(phase*.37)*.022;
          e.heading=(e.heading ?? 0)+turn;
          const stride=.012+(seed%5)*.003;
          e.x+=Math.sin(e.heading)*stride;
          e.z+=Math.cos(e.heading)*stride;
        }
      }

      const radius=h.shape==="cilindrico"?1.28:1.55;
      if(h.shape==="cilindrico"){const d=Math.hypot(e.x,e.z);if(d>radius){e.x=e.x/d*radius;e.z=e.z/d*radius;e.heading=Math.atan2(-e.x,-e.z);}}
      else{if(e.x<-1.75||e.x>1.75)e.heading=-e.heading;e.x=clamp(e.x,-1.75,1.75);e.z=clamp(e.z,-1.15,1.15);if(e.z<=-1.15||e.z>=1.15)e.heading=-e.heading;}
      if(e.hydration<=0||e.energy<=0)e.stress=clamp(e.stress+.002,0,1);
      if(e.hydration<.15&&e.energy<.1)e.alive=false;
    }
  }
  return state;
}

export function addFood(state){
  if(!state||typeof state!=="object")throw new TypeError("Se requiere un estado del terrario");
  const existing=state.resources.find(r=>r.type==="leaf-litter");
  if(existing){existing.amount=Math.min(1,existing.amount+.35);}
  else state.resources.push({id:"leaf-litter-1",type:"leaf-litter",amount:.35,x:-.8,z:.45});
  return state;
}

export function addShelter(state){
  if(!state||typeof state!=="object")throw new TypeError("Se requiere un estado del terrario");
  if(!state.resources.some(r=>r.type==="shelter"))state.resources.push({id:"shelter-1",type:"shelter",amount:1,x:.8,z:-.45});
  return state;
}


export const SHOP_ITEMS=Object.freeze([
  {id:"leaf-litter",label:"Hojarasca fresca",type:"leaf-litter",price:4,description:"Recarga energía y favorece la búsqueda de alimento."},
  {id:"shelter",label:"Refugio de corteza",type:"shelter",price:12,description:"Un escondite que reduce estrés y conserva humedad."},
  {id:"fern",label:"Helecho pequeño",type:"fern",price:8,description:"Vegetación para dar volumen al diorama."},
  {id:"mushroom",label:"Setas de bosque",type:"mushroom",price:7,description:"Un pequeño grupo de setas decorativas."},
  {id:"stone",label:"Piedras húmedas",type:"stone",price:5,description:"Rocas para romper la superficie plana."},
  {id:"bark",label:"Tronco hueco",type:"bark",price:10,description:"Un tronco que aporta textura y refugio visual."},
  {id:"moss",label:"Isla de musgo",type:"moss",price:6,description:"Una mancha de musgo para enriquecer el suelo."}
]);

export function purchaseItem(state,itemId){
  if(!state||typeof state!=="object"||!Array.isArray(state.resources))throw new TypeError("Se requiere un estado válido del terrario");
  const item=SHOP_ITEMS.find(entry=>entry.id===itemId);
  if(!item)throw new Error("Artículo de tienda desconocido");
  const coins=Number.isSafeInteger(state.coins)&&state.coins>=0?state.coins:0;
  if(coins<item.price)throw new Error("No tienes suficientes bellotas para esta compra");
  const index=state.resources.length;
  const angle=index*2.399963229728653;
  const radius=.35+(index%4)*.22;
  const shape=state.habitat?.shape;
  const x=shape==="cilindrico"?Math.cos(angle)*Math.min(radius,1.05):Math.max(-1.55,Math.min(1.55,Math.cos(angle)*radius));
  const z=shape==="cilindrico"?Math.sin(angle)*Math.min(radius,.85):Math.max(-.95,Math.min(.95,Math.sin(angle)*radius));
  const resource={id:`shop-${item.id}-${Date.now().toString(36)}-${index}`,type:item.type,amount:item.type==="leaf-litter"?.55:1,x,z};
  state.coins=coins-item.price;
  state.resources.push(resource);
  return {item,resource,coins:state.coins};
}
