export const START_NODE_ID="garden-entry";
export const ACTION_POINTS_PER_RUN=6;
export const MIN_EXPLORER_ENERGY=30;
export const EXPEDITION_NODES=Object.freeze({
  "garden-entry":Object.freeze({id:"garden-entry",label:"Jardín húmedo",description:"El suelo conserva humedad bajo las hojas.",travelCost:0,links:["mossy-stone","rotting-log"],events:[["dew",5],["fruit",2]]}),
  "mossy-stone":Object.freeze({id:"mossy-stone",label:"Piedra musgosa",description:"Una roca fresca cubierta de musgo.",travelCost:1,links:["garden-entry","rotten-fruit"],events:[["dew",5],["mites",2]]}),
  "rotting-log":Object.freeze({id:"rotting-log",label:"Tronco podrido",description:"La corteza húmeda oculta pequeños caminos.",travelCost:1,links:["garden-entry","rotten-fruit","compost-bin"],events:[["web",4],["mites",3]]}),
  "rotten-fruit":Object.freeze({id:"rotten-fruit",label:"Fruta caída",description:"Pulpa fermentada y restos vegetales.",travelCost:1,links:["mossy-stone","rotting-log","compost-bin"],events:[["fruit",4],["mites",2]]}),
  "compost-bin":Object.freeze({id:"compost-bin",label:"Compostero",description:"Materia orgánica concentrada entre capas.",travelCost:2,links:["rotting-log","rotten-fruit"],events:[["compost",5],["mites",1]]})
});
export const EXPEDITION_EVENT_TYPES=Object.freeze({
  web:Object.freeze({id:"web",title:"Una telaraña corta el camino",description:"Los hilos tensos bloquean el paso bajo el tronco.",options:Object.freeze([
    Object.freeze({id:"break",label:"Romper la telaraña",detail:"Consume 1 acción y 25 de energía.",actionCost:1,energyCost:25,rewards:{decomposedWood:1}}),
    Object.freeze({id:"detour",label:"Rodear por las hojas",detail:"Consume 2 acciones y conserva energía.",actionCost:2,energyCost:0,rewards:{organicMatter:1}})
  ])}),
  fruit:Object.freeze({id:"fruit",title:"Fruta en descomposición",description:"La pulpa blanda está llena de pequeños restos aprovechables.",options:Object.freeze([
    Object.freeze({id:"collect",label:"Recolectar pulpa",detail:"Consume 1 acción.",actionCost:1,energyCost:0,rewards:{organicMatter:3}}),
    Object.freeze({id:"investigate",label:"Investigar las esporas",detail:"Consume 1 acción y registra un descubrimiento.",actionCost:1,energyCost:0,rewards:{freshMoss:1},discoveries:["decaying-fruit"]})
  ])}),
  mites:Object.freeze({id:"mites",title:"Colonia de ácaros",description:"Un grupo de ácaros se mueve entre las fibras del sustrato.",options:Object.freeze([
    Object.freeze({id:"observe",label:"Observar la colonia",detail:"Consume 1 acción y registra un descubrimiento.",actionCost:1,energyCost:0,discoveries:["mite-colony"]}),
    Object.freeze({id:"forage",label:"Buscar restos",detail:"Consume 1 acción y 10 de energía.",actionCost:1,energyCost:10,rewards:{organicMatter:2}})
  ])}),
  dew:Object.freeze({id:"dew",title:"Bolsillo de rocío",description:"Varias gotas permanecen atrapadas bajo el musgo.",options:Object.freeze([
    Object.freeze({id:"collect",label:"Recoger gotas",detail:"Consume 1 acción.",actionCost:1,energyCost:0,rewards:{dewDrops:2}}),
    Object.freeze({id:"inspect",label:"Inspeccionar el musgo",detail:"Consume 1 acción.",actionCost:1,energyCost:0,rewards:{freshMoss:1}})
  ])}),
  compost:Object.freeze({id:"compost",title:"Compost maduro",description:"El material oscuro está listo para recuperarse.",options:Object.freeze([
    Object.freeze({id:"collect",label:"Recoger materia orgánica",detail:"Consume 1 acción.",actionCost:1,energyCost:0,rewards:{organicMatter:4}}),
    Object.freeze({id:"turn",label:"Remover el compost",detail:"Consume 2 acciones.",actionCost:2,energyCost:0,rewards:{organicMatter:2,dewDrops:1}})
  ])})
});
export const EXPEDITION_UPGRADES=Object.freeze({
  "organic-bed":Object.freeze({id:"organic-bed",label:"Capa de humus",description:"Añade hojarasca funcional al suelo.",cost:{organicMatter:10,coins:5},resource:{type:"leaf-litter",amount:.9,x:-.34,z:.28}}),
  "bark-shelter":Object.freeze({id:"bark-shelter",label:"Refugio de corteza",description:"Incorpora un tronco bajo que conserva humedad.",cost:{decomposedWood:8,coins:5},resource:{type:"bark",amount:1,x:.28,z:-.3}}),
  "moss-garden":Object.freeze({id:"moss-garden",label:"Jardín de musgo",description:"Añade una almohadilla de musgo al microhábitat.",cost:{freshMoss:8,dewDrops:4,coins:5},resource:{type:"moss",amount:1,x:-.45,z:-.26}})
});
export const INVENTORY_KEYS=Object.freeze(["organicMatter","decomposedWood","freshMoss","dewDrops"]);
