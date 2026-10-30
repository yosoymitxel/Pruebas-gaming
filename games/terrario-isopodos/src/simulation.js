import { constrainToHabitat } from "./habitat.js";

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

export function sampleMicroclimate(state,x,z){
  const habitat=state?.habitat??{};
  const humidity=clamp(Number(habitat.humidity??.78),0,1);
  const temperatureC=clamp(Number(habitat.temperatureC??21.4),5,35);
  const lightSetting=clamp(Number(habitat.light??.35),0,1);
  const minuteOfDay=((Number(state?.clockMinutes??480)%1440)+1440)%1440;
  const hour=minuteOfDay/60;
  // A simple daylight curve: dawn at 06:00, peak at noon, dusk at 18:00.
  const daylight=clamp(Math.sin((hour-6)*Math.PI/12),0,1);
  const ambientLight=daylight*(.22+.78*lightSetting);
  let moisturePocket=0,shade=0;

  for(const resource of Array.isArray(state?.resources)?state.resources:[]){
    if(!Number.isFinite(resource.x)||!Number.isFinite(resource.z))continue;
    const distance=Math.hypot(x-resource.x,z-resource.z);
    const radius=resource.type==="shelter"? .58 :
      resource.type==="bark"? .52 :
      resource.type==="moss"? .44 :
      resource.type==="fern"? .38 :
      resource.type==="stone"? .26 : .2;
    if(distance>=radius)continue;
    const falloff=(1-distance/radius)**2;
    if(resource.type==="shelter"){moisturePocket+=.28*falloff;shade+=.58*falloff;}
    else if(resource.type==="bark"){moisturePocket+=.19*falloff;shade+=.47*falloff;}
    else if(resource.type==="moss"){moisturePocket+=.22*falloff;shade+=.24*falloff;}
    else if(resource.type==="fern"){moisturePocket+=.045*falloff;shade+=.28*falloff;}
    else if(resource.type==="stone"){moisturePocket+=.035*falloff;shade+=.16*falloff;}
  }

  const localHumidity=clamp(humidity+moisturePocket,0,.98);
  const localLight=clamp(ambientLight-shade,0,1);
  const localTemperature=clamp(temperatureC+daylight*lightSetting*.72-shade*.62,5,35);
  return {
    humidity:localHumidity,
    light:localLight,
    temperatureC:localTemperature,
    daylight,
    shade:clamp(shade,0,1)
  };
}

function closestResource(entity,resources,types){
  let best=null,bestDistance=Infinity;
  for(const resource of resources){
    if(!types.includes(resource.type))continue;
    if(resource.type==="leaf-litter"&&(Number(resource.amount??0)<=0))continue;
    const distance=Math.hypot(resource.x-entity.x,resource.z-entity.z);
    if(distance<bestDistance){best=resource;bestDistance=distance;}
  }
  return best?{resource:best,distance:bestDistance}:null;
}

function steerEntity(entity,target,resources,speed,phase){
  const dx=target.x-entity.x,dz=target.z-entity.z;
  const distance=Math.hypot(dx,dz);
  if(distance<1e-5)return;
  let vx=dx/distance,vz=dz/distance;

  // Gentle local avoidance keeps animals from walking through placed stones and props.
  let avoidX=0,avoidZ=0;
  for(const obstacle of resources){
    if(obstacle===target)continue;
    if(!["stone","mushroom","fern"].includes(obstacle.type))continue;
    const ox=entity.x-obstacle.x,oz=entity.z-obstacle.z,d=Math.hypot(ox,oz);
    const radius=obstacle.type==="stone"?.2:.15;
    if(d>1e-4&&d<radius){
      const strength=(radius-d)/radius;
      avoidX+=ox/d*strength;
      avoidZ+=oz/d*strength;
    }
  }
  vx+=avoidX*.85;vz+=avoidZ*.85;
  const length=Math.hypot(vx,vz)||1;
  vx/=length;vz/=length;

  const desiredHeading=Math.atan2(vx,vz);
  const currentHeading=Number(entity.heading??0);
  const difference=Math.atan2(Math.sin(desiredHeading-currentHeading),Math.cos(desiredHeading-currentHeading));
  entity.heading=currentHeading+clamp(difference,-.24,.24);
  const step=Math.min(distance,speed);
  const wander=Math.sin(phase)*.0015;
  entity.x+=vx*step+Math.cos(phase)*wander;
  entity.z+=vz*step+Math.sin(phase)*wander;
}

export function stepSimulation(state,minutes=1){
  if(!state||typeof state!=="object")throw new TypeError("Se requiere un estado del terrario");
  if(!Number.isInteger(minutes)||minutes<1||minutes>1440)throw new RangeError("minutes debe ser entero entre 1 y 1440");

  for(let minute=0;minute<minutes;minute++){
    state.clockMinutes++;
    const habitat=state.habitat;
    habitat.humidity=clamp(Number(habitat.humidity??.78),0,1);
    habitat.temperatureC=clamp(Number(habitat.temperatureC??21.4),5,35);
    habitat.light=clamp(Number(habitat.light??.35),0,1);
    const temperatureDistance=(temperatureC)=>{
      return Math.max(0,BIOLOGY_RULES.temperatureComfortMinC-temperatureC,
        temperatureC-BIOLOGY_RULES.temperatureComfortMaxC);
    };

    const living=state.entities.filter(entity=>entity.alive!==false);
    if(state.clockMinutes%60===0&&living.some(e=>e.hydration>.35&&e.energy>.25&&e.stress<.8)){
      state.coins=(Number.isSafeInteger(state.coins)&&state.coins>=0?state.coins:0)+1;
    }

    for(const entity of living){
      entity.previousX=entity.x;
      entity.previousZ=entity.z;
      const seed=identity(entity);
      const phase=state.clockMinutes*.11+(seed%97)*.17;
      const micro=sampleMicroclimate(state,entity.x,entity.z);
      const hotColdStress=temperatureDistance(micro.temperatureC);
      const wasResting=["resting","burrowing"].includes(entity.behavior);

      // Needs react to the local pocket, not just the global slider.
      const dryExposure=Math.max(0,1-micro.humidity);
      entity.hydration=clamp((entity.hydration??.8)-
        BIOLOGY_RULES.hydrationLossPerMinute*Math.max(.12,dryExposure),0,1);
      const activityCost=wasResting?.42:1;
      entity.energy=clamp((entity.energy??.8)-
        BIOLOGY_RULES.energyLossPerMinute*activityCost,0,1);
      const heatStress=hotColdStress*BIOLOGY_RULES.temperatureStressPerDegreeMinute;
      const lightStress=Math.max(0,micro.light-.62)*.00022;
      if(heatStress+lightStress>0)entity.stress=clamp((entity.stress??.2)+heatStress+lightStress,0,1);
      else entity.stress=clamp((entity.stress??.2)-BIOLOGY_RULES.comfortableStressRecoveryPerMinute,0,1);

      const food=closestResource(entity,state.resources,["leaf-litter"]);
      const refuge=closestResource(entity,state.resources,["shelter","bark","moss","fern","stone"]);
      const hydrationNeed=Math.max(0,.61-entity.hydration)*1.8+
        Math.max(0,.54-micro.humidity)*1.35+
        Math.max(0,micro.light-.55)*1.25+
        Math.max(0,hotColdStress-.5)*.18;
      const energyNeed=Math.max(0,.67-entity.energy)*1.55;
      let target=null;

      // Armadillidium rolls into a ball when seriously threatened or stressed;
      // no arbitrary 47-minute schedule forces the response.
      if(entity.stress>=.88){
        entity.behavior="defensive-curl";
        entity.heading=(entity.heading??0)+Math.sin(phase)*.003;
        continue;
      }
      if(entity.behavior==="defensive-curl"&&entity.stress>.62){
        entity.behavior="defensive-curl";
        continue;
      }

      if(hydrationNeed>.12&&refuge){
        target=refuge.resource;
      }else if(energyNeed>.08&&food){
        target=food.resource;
      }else if(micro.light>.7&&refuge){
        target=refuge.resource;
      }

      if(target){
        const distance=Math.hypot(target.x-entity.x,target.z-entity.z);
        if(distance<.15){
          if(target.type==="leaf-litter"){
            entity.behavior=entity.energy<.55?"feeding":"grooming";
            target.amount=Math.max(0,(target.amount??1)-.0065);
            entity.energy=clamp(entity.energy+BIOLOGY_RULES.foodEnergyGainPerMinute,0,1);
          }else{
            entity.behavior=entity.hydration<.55?"resting":"burrowing";
            entity.hydration=clamp(entity.hydration+BIOLOGY_RULES.shelterHydrationGainPerMinute,0,1);
            entity.stress=clamp(entity.stress-.0035,0,1);
          }
        }else{
          const drynessBoost=1+dryExposure*.72;
          const lightDampening=1-micro.light*.24;
          const speed=(.022+(seed%5)*.002)*drynessBoost*lightDampening;
          steerEntity(entity,target,state.resources,speed,phase);
          entity.behavior=target.type==="leaf-litter"?"seeking-food":"seeking-shelter";
        }
      }else if(entity.hydration<.42&&micro.humidity<.48){
        entity.behavior="burrowing";
        entity.heading=(entity.heading??0)+Math.sin(phase)*.008;
        entity.x+=Math.sin(entity.heading)*.0025;
        entity.z+=Math.cos(entity.heading)*.0025;
      }else{
        const neighbors=living.filter(other=>other!==entity);
        const neighbor=neighbors.map(other=>({other,d:Math.hypot(other.x-entity.x,other.z-entity.z)}))
          .filter(item=>item.d<.26).sort((a,b)=>a.d-b.d)[0];
        if(neighbor&&micro.temperatureC>=20&&micro.temperatureC<=30&&micro.humidity>.48){
          entity.behavior="socializing";
          const attraction=neighbor.d>.105?.002:-.001;
          const dx=neighbor.other.x-entity.x,dz=neighbor.other.z-entity.z,d=neighbor.d||1;
          entity.x+=dx/d*attraction;
          entity.z+=dz/d*attraction;
          entity.heading=Math.atan2(dx,dz);
        }else if(micro.light>.68&&refuge){
          entity.behavior="seeking-shelter";
          const targetShade=refuge.resource;
          steerEntity(entity,targetShade,state.resources,.018,phase);
        }else if(entity.energy>.82&&entity.stress<.3&&Math.sin(phase*.17+seed%11)>.92){
          entity.behavior="grooming";
          entity.heading=(entity.heading??0)+Math.sin(phase)*.025;
        }else if(entity.energy<.35){
          entity.behavior="resting";
          entity.heading=(entity.heading??0)+Math.sin(phase)*.003;
        }else{
          entity.behavior="exploring";
          const drynessBoost=1+dryExposure*.72;
          const lightDampening=1-micro.light*.28;
          const turn=Math.sin(phase)*.035+Math.cos(phase*.37)*.018;
          entity.heading=(entity.heading??0)+turn;
          const stride=(.009+(seed%5)*.002)*drynessBoost*lightDampening;
          entity.x+=Math.sin(entity.heading)*stride;
          entity.z+=Math.cos(entity.heading)*stride;
        }
      }

      const constrained=constrainToHabitat(entity.x,entity.z,habitat.shape,.2);
      if(constrained.x!==entity.x||constrained.z!==entity.z){
        entity.x=constrained.x;entity.z=constrained.z;
        entity.heading=habitat.shape==="cilindrico"?Math.atan2(-entity.x,-entity.z):-(entity.heading??0);
      }
      if(entity.hydration<=0||entity.energy<=0)entity.stress=clamp(entity.stress+.002,0,1);
      if(entity.hydration<.15&&entity.energy<.1)entity.alive=false;
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
  const proposedX=shape==="cilindrico"?Math.cos(angle)*Math.min(radius,1.05):Math.cos(angle)*radius;
  const proposedZ=shape==="cilindrico"?Math.sin(angle)*Math.min(radius,.85):Math.sin(angle)*radius;
  const {x,z}=constrainToHabitat(proposedX,proposedZ,shape,.08);
  const resource={id:`shop-${item.id}-${index}`,type:item.type,amount:item.type==="leaf-litter"?.55:1,x,z};
  state.coins=coins-item.price;
  state.resources.push(resource);
  return {item,resource,coins:state.coins};
}
