export const START_NODE_ID="garden-entry";
export const ACTION_POINTS_PER_RUN=6;
export const MIN_EXPLORER_ENERGY=30;

export const EXPEDITION_NODES=Object.freeze({
  "garden-entry":Object.freeze({
    id:"garden-entry",label:"Jardín húmedo",description:"El suelo conserva humedad bajo las hojas.",
    travelCost:0,risk:"low",links:["mossy-stone","rotting-log","abandoned-pot"],events:[["dew",5],["fruit",2]]
  }),
  "mossy-stone":Object.freeze({
    id:"mossy-stone",label:"Piedra musgosa",description:"Una roca fresca cubierta de musgo.",
    travelCost:1,risk:"low",links:["garden-entry","rotten-fruit","mite-nest"],events:[["dew",5],["mites",2]]
  }),
  "rotting-log":Object.freeze({
    id:"rotting-log",label:"Tronco podrido",description:"La corteza húmeda oculta pequeños caminos.",
    travelCost:1,risk:"medium",links:["garden-entry","rotten-fruit","compost-bin","mite-nest","web-zone"],events:[["web",4],["mites",3]]
  }),
  "rotten-fruit":Object.freeze({
    id:"rotten-fruit",label:"Fruta caída",description:"Pulpa fermentada y restos vegetales.",
    travelCost:1,risk:"medium",links:["mossy-stone","rotting-log","abandoned-pot","compost-bin"],events:[["fruit",4],["mites",2]]
  }),
  "abandoned-pot":Object.freeze({
    id:"abandoned-pot",label:"Maceta abandonada",description:"Raíces finas forman pequeños refugios bajo la cerámica.",
    travelCost:1,risk:"low",links:["garden-entry","rotten-fruit","compost-bin"],events:[["roots",1]]
  }),
  "compost-bin":Object.freeze({
    id:"compost-bin",label:"Compostero antiguo",description:"Materia orgánica concentrada entre capas.",
    travelCost:2,risk:"medium",unlockDiscovery:"compost-access",
    unlockHint:"Seguí las raíces de la Maceta abandonada.",
    links:["rotting-log","rotten-fruit","abandoned-pot","web-zone"],events:[["compost",5],["mites",1]]
  }),
  "mite-nest":Object.freeze({
    id:"mite-nest",label:"Nido de ácaros",description:"Una colonia se refugia entre fibras y restos de corteza.",
    travelCost:2,risk:"high",unlockDiscovery:"mite-colony",
    unlockHint:"Observá una colonia de ácaros antes de acercarte.",
    links:["mossy-stone","rotting-log","web-zone"],events:[["mites",1]]
  }),
  "web-zone":Object.freeze({
    id:"web-zone",label:"Zona de telarañas",description:"Varios hilos tensos conectan hojas, raíces y corteza.",
    travelCost:2,risk:"high",unlockDiscovery:"web-passage",
    unlockHint:"Abrí un paso rompiendo la telaraña del Tronco podrido.",
    links:["rotting-log","compost-bin","mite-nest"],events:[["web",1]]
  })
});

export const EXPEDITION_EVENT_TYPES=Object.freeze({
  web:Object.freeze({
    id:"web",title:"Una telaraña corta el camino",
    description:"Los hilos tensos bloquean el paso bajo el tronco.",
    options:Object.freeze([
      Object.freeze({
        id:"break",label:"Romper la telaraña",detail:"Abre el paso y recupera madera descompuesta.",
        actionCost:1,energyCost:25,rewards:{decomposedWood:1},discoveries:["web-passage"]
      }),
      Object.freeze({
        id:"detour",label:"Rodear por las hojas",detail:"Conserva energía y recoge restos vegetales.",
        actionCost:2,energyCost:0,rewards:{organicMatter:1}
      })
    ])
  }),
  fruit:Object.freeze({
    id:"fruit",title:"Fruta en descomposición",
    description:"La pulpa blanda está llena de pequeños restos aprovechables.",
    options:Object.freeze([
      Object.freeze({
        id:"collect",label:"Recolectar pulpa",detail:"Aumenta la reserva de materia orgánica.",
        actionCost:1,energyCost:0,rewards:{organicMatter:3}
      }),
      Object.freeze({
        id:"investigate",label:"Investigar las esporas",detail:"Registra las esporas encontradas en la pulpa.",
        actionCost:1,energyCost:0,rewards:{freshMoss:1},discoveries:["decaying-fruit"]
      })
    ])
  }),
  mites:Object.freeze({
    id:"mites",title:"Colonia de ácaros",
    description:"Un grupo de ácaros se mueve entre las fibras del sustrato.",
    options:Object.freeze([
      Object.freeze({
        id:"observe",label:"Observar la colonia",detail:"Registra el movimiento de la colonia y localiza su nido.",
        actionCost:1,energyCost:0,discoveries:["mite-colony"]
      }),
      Object.freeze({
        id:"forage",label:"Buscar restos",detail:"Recupera nutrientes entre las fibras.",
        actionCost:1,energyCost:10,rewards:{organicMatter:2}
      })
    ])
  }),
  dew:Object.freeze({
    id:"dew",title:"Bolsillo de rocío",
    description:"Varias gotas permanecen atrapadas bajo el musgo.",
    options:Object.freeze([
      Object.freeze({
        id:"collect",label:"Recoger gotas",detail:"Añade agua a la reserva de exploración.",
        actionCost:1,energyCost:0,rewards:{dewDrops:2}
      }),
      Object.freeze({
        id:"inspect",label:"Inspeccionar el musgo",detail:"Recupera musgo fresco del borde húmedo.",
        actionCost:1,energyCost:0,rewards:{freshMoss:1}
      })
    ])
  }),
  compost:Object.freeze({
    id:"compost",title:"Compost maduro",
    description:"El material oscuro está listo para recuperarse.",
    options:Object.freeze([
      Object.freeze({
        id:"collect",label:"Recoger materia orgánica",detail:"Añade materia orgánica al inventario.",
        actionCost:1,energyCost:0,rewards:{organicMatter:4}
      }),
      Object.freeze({
        id:"turn",label:"Remover el compost",detail:"Recupera también una gota de rocío.",
        actionCost:2,energyCost:0,rewards:{organicMatter:2,dewDrops:1}
      })
    ])
  }),
  roots:Object.freeze({
    id:"roots",title:"Raíces bajo la maceta",
    description:"Una red de raíces finas desciende hacia una cavidad húmeda.",
    options:Object.freeze([
      Object.freeze({
        id:"trace",label:"Seguir el túnel de raíces",detail:"Descubre un acceso bajo el compostero.",
        actionCost:1,energyCost:0,discoveries:["compost-access"]
      }),
      Object.freeze({
        id:"harvest",label:"Recolectar corteza suelta",detail:"Recupera un fragmento útil sin alejarte del refugio.",
        actionCost:1,energyCost:0,rewards:{decomposedWood:1}
      })
    ])
  })
});

export const EXPEDITION_UPGRADES=Object.freeze({
  "organic-bed":Object.freeze({
    id:"organic-bed",label:"Capa de humus",description:"Añade hojarasca funcional al suelo.",
    cost:{organicMatter:10,coins:5},resource:{type:"leaf-litter",amount:.9,x:-.34,z:.28}
  }),
  "bark-shelter":Object.freeze({
    id:"bark-shelter",label:"Refugio de corteza",description:"Incorpora un tronco bajo que conserva humedad.",
    cost:{decomposedWood:8,coins:5},resource:{type:"bark",amount:1,x:.28,z:-.3}
  }),
  "moss-garden":Object.freeze({
    id:"moss-garden",label:"Jardín de musgo",description:"Añade una almohadilla de musgo al microhábitat.",
    cost:{freshMoss:8,dewDrops:4,coins:5},resource:{type:"moss",amount:1,x:-.45,z:-.26}
  })
});
export const INVENTORY_KEYS=Object.freeze(["organicMatter","decomposedWood","freshMoss","dewDrops"]);
