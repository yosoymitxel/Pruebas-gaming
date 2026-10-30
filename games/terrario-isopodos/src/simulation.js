import { constrainToHabitat, constrainBarkToHabitat, constrainShelterToHabitat, REFUGE_MODEL_PROFILES } from "./habitat.js";

const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const identity=entity=>[...String(entity.id)].reduce((n,c)=>((n*33)^c.charCodeAt(0))>>>0,5381);
export const MODEL_VERSION=2;
export const BIOLOGY_RULES=Object.freeze({
  hydrationLossPerMinute:0.0011,
  energyLossPerMinute:0.00075,
  restEnergyGainPerMinute:0.00125,
  temperatureComfortMinC:16,
  temperatureComfortMaxC:25,
  temperatureStressPerDegreeMinute:0.0005,
  comfortableStressRecoveryPerMinute:0.00018,
  defensiveRecoveryInShadePerMinute:0.018,
  defensiveRecoveryExposedPerMinute:0.006,
  foodEnergyGainPerMinute:0.014,
  shelterHydrationGainPerMinute:0.008,
  minimumCollisionDistance:0.205
});

const RESOURCE_COVER=Object.freeze({
  shelter:{radius:.58,moisture:.28,shade:.58,collision:.19},
  bark:{radius:.52,moisture:.19,shade:.47,collision:.17},
  moss:{radius:.44,moisture:.22,shade:.24,collision:.045},
  fern:{radius:.38,moisture:.045,shade:.28,collision:.105},
  stone:{radius:.26,moisture:.035,shade:.16,collision:.17},
  mushroom:{radius:.2,moisture:.008,shade:.015,collision:.075}
});

export function sampleMicroclimate(state,x,z){
  const habitat=state?.habitat??{};
  const humidity=clamp(Number(habitat.humidity??.78),0,1);
  const temperatureC=clamp(Number(habitat.temperatureC??21.4),5,35);
  const lightSetting=clamp(Number(habitat.light??.35),0,1);
  const minuteOfDay=((Number(state?.clockMinutes??480)%1440)+1440)%1440;
  const hour=minuteOfDay/60;
  const daylight=clamp(Math.sin((hour-6)*Math.PI/12),0,1);
  const ambientLight=daylight*(.22+.78*lightSetting);
  const weather=habitat.weather==="rain"?"rain":habitat.weather==="mist"?"mist":"clear";
  const weatherHumidity=weather==="rain"?.12:weather==="mist"?.065:0;
  const weatherShade=weather==="rain"?.22:weather==="mist"?.3:0;
  let moisturePocket=0,shade=0;

  for(const resource of Array.isArray(state?.resources)?state.resources:[]){
    if(!Number.isFinite(resource.x)||!Number.isFinite(resource.z))continue;
    const cover=RESOURCE_COVER[resource.type];
    if(!cover)continue;
    const distance=Math.hypot(x-resource.x,z-resource.z);
    if(distance>=cover.radius)continue;
    const falloff=(1-distance/cover.radius)**2;
    moisturePocket+=cover.moisture*falloff;
    shade+=cover.shade*falloff;
  }

  return {
    humidity:clamp(humidity+moisturePocket+weatherHumidity,0,.98),
    light:clamp(ambientLight-shade-weatherShade,0,1),
    temperatureC:clamp(temperatureC+daylight*lightSetting*.72-shade*.62-(weather==="rain"?.45:weather==="mist"?.18:0),5,35),
    daylight,
    shade:clamp(shade,0,1)
  };
}

function distanceBetween(a,b){
  return Math.hypot((b?.x??0)-(a?.x??0),(b?.z??0)-(a?.z??0));
}

function candidateFor(entity,resources,types,urgency,weight=1){
  if(urgency<=.055)return null;
  let best=null;
  for(const resource of resources){
    if(!types.includes(resource.type))continue;
    if(resource.type==="leaf-litter"&&Number(resource.amount??0)<=.015)continue;
    const distance=distanceBetween(entity,resource);
    const availability=resource.type==="leaf-litter"?clamp(Number(resource.amount??0),0,1):1;
    const score=urgency*weight*availability/(.34+distance);
    if(!best||score>best.score)best={resource,distance,score,urgency};
  }
  return best;
}

/** Utility arbitration + hysteresis: a small change in needs does not flip targets every minute. */
function chooseIntent(entity,resources,needs){
  const food=candidateFor(entity,resources,["leaf-litter"],needs.energy,1.12);
  const refugeUrgency=needs.hydration+needs.shade+needs.stress;
  const refuge=candidateFor(entity,resources,["shelter","bark","moss","fern","stone"],refugeUrgency,1);
  let best=food&&refuge?(food.score>=refuge.score?food:refuge):(food??refuge);
  const previous=resources.find(resource=>resource.id===entity.targetResourceId);
  if(previous){
    const types=previous.type==="leaf-litter"?["leaf-litter"]:["shelter","bark","moss","fern","stone"];
    const urgency=previous.type==="leaf-litter"?needs.energy:refugeUrgency;
    const weight=previous.type==="leaf-litter"?1.12:1;
    const current=candidateFor(entity,[previous],types,urgency,weight);
    if(current&&best&&current.score>=best.score*.88)best=current;
  }
  entity.targetResourceId=best?.resource.id??null;
  entity.intent=best?.resource.type==="leaf-litter"?"food":best?"shelter":"wander";
  return best;
}

function obstacleRadius(resource){
  return RESOURCE_COVER[resource.type]?.collision??0;
}

function steerEntity(entity,target,resources,speed,phase,neighbors=[]){
  const dx=target.x-entity.x,dz=target.z-entity.z;
  const distance=Math.hypot(dx,dz);
  if(distance<1e-5)return;
  let vx=dx/distance,vz=dz/distance;
  let avoidX=0,avoidZ=0,detourX=0,detourZ=0;

  for(const obstacle of resources){
    if(obstacle===target)continue;
    const radius=obstacleRadius(obstacle);
    if(!radius)continue;
    const ox=entity.x-obstacle.x,oz=entity.z-obstacle.z,d=Math.hypot(ox,oz);
    if(d<1e-4||d>=radius)continue;
    const strength=(radius-d)/radius;
    avoidX+=ox/d*strength;
    avoidZ+=oz/d*strength;
    // A tangent component lets an animal pass an obstacle directly between it and its goal.
    const side=(identity(entity)&1)?1:-1;
    detourX+=(-vz)*side*strength*.72;
    detourZ+=(vx)*side*strength*.72;
  }

  vx+=avoidX*1.1+detourX;
  vz+=avoidZ*1.1+detourZ;
  for(const neighbor of neighbors){
    if(neighbor===entity||neighbor.alive===false)continue;
    const ox=entity.x-neighbor.x,oz=entity.z-neighbor.z,d=Math.hypot(ox,oz);
    if(d>1e-4&&d<BIOLOGY_RULES.minimumCollisionDistance){
      const strength=(BIOLOGY_RULES.minimumCollisionDistance-d)/BIOLOGY_RULES.minimumCollisionDistance;
      vx+=ox/d*strength*.65;
      vz+=oz/d*strength*.65;
    }
  }

  const length=Math.hypot(vx,vz)||1;
  vx/=length;vz/=length;
  const desiredHeading=Math.atan2(vx,vz);
  const currentHeading=Number(entity.heading??0);
  const difference=Math.atan2(Math.sin(desiredHeading-currentHeading),Math.cos(desiredHeading-currentHeading));
  entity.heading=currentHeading+clamp(difference,-.28,.28);
  const step=Math.min(distance,speed);
  const wander=Math.sin(phase)*.00065;
  entity.x+=vx*step+Math.cos(phase)*wander;
  entity.z+=vz*step+Math.sin(phase)*wander;
}

function applySocialSeparation(living,habitat){
  const minimumDistance=BIOLOGY_RULES.minimumCollisionDistance;
  for(let i=0;i<living.length;i++){
    const entity=living[i];
    if(entity.alive===false)continue;
    for(let j=i+1;j<living.length;j++){
      const other=living[j];
      if(other.alive===false)continue;
      const dx=entity.x-other.x,dz=entity.z-other.z;
      const distance=Math.hypot(dx,dz);
      if(distance>=minimumDistance)continue;
      let nx,nz;
      if(distance<=1e-6){
        // Pair identity fixes the fallback axis; no random jitter or frame-dependent direction.
        const seed=(identity(entity)^identity(other))>>>0;
        const angle=seed/0x100000000*Math.PI*2;
        nx=Math.cos(angle);
        nz=Math.sin(angle);
      }else{
        nx=dx/distance;
        nz=dz/distance;
      }
      const correction=(minimumDistance-distance)*.5;
      entity.x+=nx*correction;
      entity.z+=nz*correction;
      other.x-=nx*correction;
      other.z-=nz*correction;
    }
  }
  // Separation can move an animal toward the glass; restore valid floor limits afterwards.
  for(const entity of living)if(entity.alive!==false)settlePosition(entity,habitat);
}

function settlePosition(entity,habitat){
  const constrained=constrainToHabitat(entity.x,entity.z,habitat.shape,.2);
  if(constrained.x!==entity.x||constrained.z!==entity.z){
    entity.x=constrained.x;entity.z=constrained.z;
    const normalX=-entity.x,normalZ=-entity.z;
    const magnitude=Math.hypot(normalX,normalZ)||1;
    const reflected=Math.atan2(normalX/magnitude,normalZ/magnitude);
    entity.heading=habitat.shape==="rectangular"?-(entity.heading??0):reflected;
  }
}

function temperatureDistance(temperatureC){
  return Math.max(0,BIOLOGY_RULES.temperatureComfortMinC-temperatureC,
    temperatureC-BIOLOGY_RULES.temperatureComfortMaxC);
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
      const wasResting=["resting","burrowing","feeding"].includes(entity.behavior);
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

      const foodUrgency=Math.max(0,.67-entity.energy)*1.55;
      const hydrationUrgency=Math.max(0,.61-entity.hydration)*1.8+
        Math.max(0,.54-micro.humidity)*1.35+
        Math.max(0,hotColdStress-.5)*.18;
      const shadeUrgency=Math.max(0,micro.light-.58)*1.3;
      const stressUrgency=Math.max(0,(entity.stress??0)-.28)*.72;
      const needs={energy:foodUrgency,hydration:hydrationUrgency,shade:shadeUrgency,stress:stressUrgency};

      // Conglobation is a temporary defence, not a permanent dead-end state.
      if(entity.behavior==="defensive-curl"){
        entity.defensiveTicks=(entity.defensiveTicks??0)+1;
        const sheltered=micro.shade>.16||micro.humidity>.7;
        const recovery=sheltered?BIOLOGY_RULES.defensiveRecoveryInShadePerMinute:BIOLOGY_RULES.defensiveRecoveryExposedPerMinute;
        entity.stress=clamp(entity.stress-recovery,0,1);
        if(entity.stress<=.62||entity.defensiveTicks>=30){
          entity.behavior="resting";
          entity.defensiveTicks=0;
          entity.defensiveCooldown=18;
        }else{
          if(entity.hydration<.15&&entity.energy<.1)entity.alive=false;
          continue;
        }
      }else if((entity.defensiveCooldown??0)>0){
        entity.defensiveCooldown--;
      }

      if(entity.stress>=.88&&(entity.defensiveCooldown??0)===0){
        entity.behavior="defensive-curl";
        entity.defensiveTicks=0;
        entity.targetResourceId=null;
        entity.intent="defend";
        continue;
      }

      const chosen=chooseIntent(entity,state.resources,needs);
      const target=chosen?.resource??null;
      if(target){
        if(chosen.distance<.16){
          if(target.type==="leaf-litter"){
            entity.behavior=entity.energy<.55?"feeding":"grooming";
            target.amount=Math.max(0,(target.amount??1)-.0038);
            entity.energy=clamp(entity.energy+BIOLOGY_RULES.foodEnergyGainPerMinute,0,1);
          }else{
            entity.behavior=entity.hydration<.55?"resting":"burrowing";
            const hydrationGain=target.type==="shelter"?BIOLOGY_RULES.shelterHydrationGainPerMinute:
              target.type==="bark"?.006:target.type==="moss"?.004:target.type==="fern"?.0018:.0012;
            entity.hydration=clamp(entity.hydration+hydrationGain,0,1);
            entity.stress=clamp(entity.stress-.0035,0,1);
            entity.energy=clamp(entity.energy+BIOLOGY_RULES.restEnergyGainPerMinute,0,1);
          }
        }else{
          const lightDampening=1-micro.light*.24;
          const speed=(.018+(seed%5)*.0018)*(1+dryExposure*.52)*lightDampening;
          steerEntity(entity,target,state.resources,speed,phase,living);
          entity.behavior=target.type==="leaf-litter"?"seeking-food":"seeking-shelter";
        }
      }else{
        entity.targetResourceId=null;
        entity.intent="wander";
        const neighbor=living
          .filter(other=>other!==entity&&other.alive!==false)
          .map(other=>({other,d:distanceBetween(entity,other)}))
          .filter(item=>item.d<.24)
          .sort((a,b)=>a.d-b.d)[0];
        if(neighbor&&micro.temperatureC>=18&&micro.temperatureC<=28&&micro.humidity>.48&&entity.stress<.62){
          entity.behavior="socializing";
          const attraction=neighbor.d>.14?.0011:-.0008;
          const dx=neighbor.other.x-entity.x,dz=neighbor.other.z-entity.z,d=neighbor.d||1;
          entity.x+=dx/d*attraction;
          entity.z+=dz/d*attraction;
          entity.heading=Math.atan2(dx,dz);
        }else if(entity.energy<.34){
          entity.behavior="resting";
          entity.energy=clamp(entity.energy+BIOLOGY_RULES.restEnergyGainPerMinute,0,1);
          entity.heading=(entity.heading??0)+Math.sin(phase)*.002;
        }else{
          entity.behavior=entity.energy>.82&&entity.stress<.3&&Math.sin(phase*.17+seed%11)>.94?"grooming":"exploring";
          const turn=Math.sin(phase)*.012+Math.cos(phase*.37+seed%17)*.008;
          entity.heading=(entity.heading??0)+turn;
          const stride=(.0085+(seed%5)*.0015)*(1+dryExposure*.5)*(1-micro.light*.28);
          entity.x+=Math.sin(entity.heading)*stride;
          entity.z+=Math.cos(entity.heading)*stride;
        }
      }

      if(entity.hydration<=0||entity.energy<=0)entity.stress=clamp(entity.stress+.002,0,1);
      if(entity.hydration<.15&&entity.energy<.1)entity.alive=false;
    }
    applySocialSeparation(living,habitat);
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

export function startleIsopod(state,id){
  const entity=state?.entities?.find(item=>item.id===id&&item.alive!==false);
  if(!entity)return null;
  entity.stress=1;
  entity.behavior="defensive-curl";
  entity.defensiveTicks=0;
  entity.defensiveCooldown=0;
  entity.targetResourceId=null;
  entity.intent="defend";
  return entity;
}

export function moveIsopod(state,id,x,z){
  if(!Number.isFinite(x)||!Number.isFinite(z))throw new RangeError("La posición del isópodo no es válida");
  const entity=state?.entities?.find(item=>item.id===id&&item.alive!==false);
  if(!entity)return null;
  const point=constrainToHabitat(x,z,state.habitat?.shape,.2);
  entity.previousX=point.x;
  entity.previousZ=point.z;
  entity.x=point.x;
  entity.z=point.z;
  entity.targetResourceId=null;
  return entity;
}

export function moveResource(state,id,x,z){
  if(!Number.isFinite(x)||!Number.isFinite(z))throw new RangeError("La posición del recurso no es válida");
  const resource=state?.resources?.find(item=>item.id===id);
  if(!resource)return null;
  const amount=Math.max(.4,Math.min(1.2,Number(resource.amount??1)));
  const point=resource.type==="bark"
    ?constrainBarkToHabitat(x,z,state.habitat?.shape,REFUGE_MODEL_PROFILES.bark.scale*amount)
    :resource.type==="shelter"
      ?constrainShelterToHabitat(x,z,state.habitat?.shape,REFUGE_MODEL_PROFILES.shelter.scale*amount)
      :constrainToHabitat(x,z,state.habitat?.shape,.12);
  resource.x=point.x;
  resource.z=point.z;
  return resource;
}

export function fitResourcesToHabitat(state){
  if(!state||typeof state!=="object"||!Array.isArray(state.resources))throw new TypeError("Se requiere un estado válido del terrario");
  const shape=state.habitat?.shape;
  for(const resource of state.resources){
    const amount=Math.max(.4,Math.min(1.2,Number(resource.amount??1)));
    const point=resource.type==="bark"
      ?constrainBarkToHabitat(resource.x,resource.z,shape,REFUGE_MODEL_PROFILES.bark.scale*amount)
      :resource.type==="shelter"
        ?constrainShelterToHabitat(resource.x,resource.z,shape,REFUGE_MODEL_PROFILES.shelter.scale*amount)
        :constrainToHabitat(resource.x,resource.z,shape,.12);
    resource.x=point.x;
    resource.z=point.z;
  }
  return state.resources;
}

export const SHOP_ITEMS=Object.freeze([
  {id:"leaf-litter",label:"Hojarasca fresca",type:"leaf-litter",price:4,description:"Recarga energía y favorece la búsqueda de alimento."},
  {id:"shelter",label:"Refugio de corteza",type:"shelter",price:12,description:"Un escondite que reduce estrés y conserva humedad."},
  {id:"fern",label:"Helecho pequeño",type:"fern",price:8,description:"Vegetación para dar volumen al diorama."},
  {id:"mushroom",label:"Setas de bosque",type:"mushroom",price:7,description:"Un pequeño grupo de setas decorativas."},
  {id:"stone",label:"Piedras húmedas",type:"stone",price:5,description:"Rocas para romper la superficie plana."},
  {id:"bark",label:"Tronco hueco",type:"bark",price:10,description:"Un tronco que aporta textura y refugio."},
  {id:"moss",label:"Isla de musgo",type:"moss",price:6,description:"Un cojín de musgo para conservar humedad y sombra."}
]);

export function purchaseItem(state,itemId,position=null){
  if(!state||typeof state!=="object"||!Array.isArray(state.resources))throw new TypeError("Se requiere un estado válido del terrario");
  const item=SHOP_ITEMS.find(entry=>entry.id===itemId);
  if(!item)throw new Error("Artículo de tienda desconocido");
  const coins=Number.isSafeInteger(state.coins)&&state.coins>=0?state.coins:0;
  if(coins<item.price)throw new Error("No tienes suficientes bellotas para esta compra");
  const index=state.resources.length;
  const angle=index*2.399963229728653;
  const radius=.35+(index%4)*.22;
  const shape=state.habitat?.shape;
  const proposedX=Number.isFinite(position?.x)?position.x:(shape==="cilindrico"?Math.cos(angle)*Math.min(radius,1.05):Math.cos(angle)*radius);
  const proposedZ=Number.isFinite(position?.z)?position.z:(shape==="cilindrico"?Math.sin(angle)*Math.min(radius,.85):Math.sin(angle)*radius);
  const amount=item.type==="leaf-litter"?.55:1;
  const point=item.type==="bark"
    ?constrainBarkToHabitat(proposedX,proposedZ,shape,REFUGE_MODEL_PROFILES.bark.scale*amount)
    :item.type==="shelter"
      ?constrainShelterToHabitat(proposedX,proposedZ,shape,REFUGE_MODEL_PROFILES.shelter.scale*amount)
      :constrainToHabitat(proposedX,proposedZ,shape,.12);
  const existing=item.type==="leaf-litter"?state.resources.find(r=>r.type==="leaf-litter"&&Math.hypot(r.x-point.x,r.z-point.z)<.18):null;
  let resource;
  if(existing){
    existing.amount=Math.min(1,Number(existing.amount??0)+.45);
    resource=existing;
  }else{
    let id=`shop-${item.id}-${index}`;
    while(state.resources.some(r=>r.id===id))id+="-";
    resource={id,type:item.type,amount:item.type==="leaf-litter"?.55:1,x:point.x,z:point.z};
    state.resources.push(resource);
  }
  state.coins=coins-item.price;
  return {item,resource,coins:state.coins};
}
