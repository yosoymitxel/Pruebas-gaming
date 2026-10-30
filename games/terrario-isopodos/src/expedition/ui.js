import {
  startExpedition,
  travelToNode,
  resolveExpeditionEvent,
  returnFromExpedition,
  buyExpeditionUpgrade
} from "./system.js";
import { EXPEDITION_NODES, EXPEDITION_UPGRADES, INVENTORY_KEYS, MIN_EXPLORER_ENERGY, START_NODE_ID } from "./content.js";

const MATERIAL_LABELS=Object.freeze({
  organicMatter:"Materia orgánica",
  decomposedWood:"Madera descompuesta",
  freshMoss:"Musgo fresco",
  dewDrops:"Gotas de rocío"
});
const NODE_NOTES=Object.freeze({
  "garden-entry":"El primer claro entre las hojas",
  "mossy-stone":"Una piedra fría cubierta de musgo",
  "rotting-log":"Corteza húmeda y túneles diminutos",
  "rotten-fruit":"Pulpa fermentada y esporas",
  "compost-bin":"Restos vegetales en descomposición"
});
const text=value=>String(value??"");
const dayOf=state=>Math.floor(state.clockMinutes/1440)+1;
const materialName=key=>MATERIAL_LABELS[key]??key;
const costText=option=>{
  const actions=option.actionCost+" "+(option.actionCost===1?"acción":"acciones");
  return actions+(option.energyCost?" · "+option.energyCost+" energía":"");
};

export function mountExpeditionScreen({
  state,
  getRenderer=()=>null,
  onEnter=()=>false,
  onExit=()=>{},
  onSave=()=>true,
  onChange=()=>{}
}){
  if(!state)throw new TypeError("Se requiere TerrariumState para montar las expediciones");
  const root=document.createElement("section");
  root.id="screen-expedition";
  root.className="game-screen expedition-screen";
  root.hidden=true;
  root.setAttribute("role","dialog");
  root.setAttribute("aria-modal","true");
  root.setAttribute("aria-labelledby","expedition-title");
  root.innerHTML=[
    '<div class="expedition-shell">',
      '<header class="expedition-header">',
        '<button type="button" id="expedition-close" class="expedition-back">← Volver al terrario</button>',
        '<div class="expedition-heading"><p id="expedition-day">DÍA 01 · CUADERNO DE CAMPO</p><h1 id="expedition-title">El jardín olvidado</h1></div>',
        '<div class="expedition-wordmark"><span>MICROCOSMOS</span><strong>EXPLORACIÓN NATURAL</strong></div>',
      '</header>',
      '<div class="expedition-stage" id="expedition-stage">',
        '<div class="expedition-diorama" id="expedition-diorama" aria-label="Diorama tridimensional interactivo del jardín"></div>',
        '<div class="expedition-location-caption" id="expedition-location-caption"><span id="expedition-kicker">MAPA DEL JARDÍN</span><h2 id="expedition-location-title">Un pequeño mundo por descubrir</h2><p id="expedition-location-copy">Toca un lugar del diorama o elige un nombre en el sendero para acercarte.</p></div>',
        '<div class="expedition-vitals" id="expedition-vitals" hidden><div><small>Acciones</small><strong id="expedition-actions">06</strong></div><div><small>Energía</small><strong id="expedition-energy-value">84</strong></div></div>',
        '<section id="expedition-map-layer" class="expedition-map-layer">',
          '<nav class="expedition-map" id="expedition-map" tabindex="-1" aria-label="Lugares del jardín"><div id="expedition-map-nodes" class="expedition-map-nodes"></div></nav><button type="button" id="expedition-resume-event" class="expedition-resume-event" hidden>Retomar el encuentro actual ↗</button>',
          '<div id="expedition-explorer-dock" class="expedition-explorer-dock">',
            '<div class="expedition-explorer-heading"><span>ELIGE A TU EXPLORADOR</span><small>Un individuo con 30 de energía o más</small></div>',
            '<div id="expedition-roster-list" class="expedition-roster-list"></div>',
            '<button id="expedition-start" type="button" class="expedition-primary">Entrar al jardín <span aria-hidden="true">↗</span></button>',
          '</div>',
        '</section>',
        '<section id="expedition-level-layer" class="expedition-level-layer" hidden>',
          '<div class="expedition-event" id="expedition-event" aria-live="polite"><p class="expedition-event-location" id="expedition-event-location"></p><h2 id="expedition-event-title" tabindex="-1"></h2><p id="expedition-event-description"></p></div>',
          '<div id="expedition-choice-dock" class="expedition-choice-dock"></div>',
          '<button type="button" id="expedition-map-back" class="expedition-map-back">← Volver al mapa</button>',
        '</section>',
        '<section id="expedition-settlement" class="expedition-settlement" hidden>',
          '<div class="expedition-settlement-card"><span class="expedition-kicker">REGISTRO DE REGRESO</span><h2>De vuelta bajo la corteza.</h2><p id="expedition-settlement-copy"></p>',
            '<div id="expedition-settlement-inventory" class="expedition-settlement-inventory"></div>',
            '<div id="expedition-settlement-upgrades" class="expedition-settlement-upgrades"></div>',
            '<button type="button" id="expedition-home" class="expedition-primary">Volver al terrario</button>',
          '</div>',
        '</section>',
        '<p id="expedition-session-message" class="expedition-message" role="status" aria-live="polite"></p>',
        '<footer class="expedition-footer">',
          '<span id="expedition-run-label">UNA EXPEDICIÓN POR DÍA</span>',
          '<div><button type="button" id="expedition-save" class="expedition-secondary" hidden>Guardar recorrido</button><button type="button" id="expedition-return" class="expedition-primary expedition-retreat" hidden>Regresar al terrario</button></div>',
        '</footer>',
      '</div>',
    '</div>'
  ].join("");
  document.body.append(root);

  const $=selector=>root.querySelector(selector);
  const viewHead=document.querySelector(".viewhead");
  const trigger=document.createElement("button");
  trigger.type="button";
  trigger.id="open-expedition";
  trigger.className="expedition-trigger";
  trigger.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19c4-1 7-4 8-8m-1-6c4-2 7-1 9 1 2 3 0 8-4 10-3 1-6 0-7-3-1-3 0-6 2-8Zm-6 15 3-7"/></svg><span>Explorar</span>';
  trigger.setAttribute("aria-haspopup","dialog");
  viewHead?.append(trigger);

  let selectedExplorerId=null;
  let selectedMapNodeId=START_NODE_ID;
  let resumeAfterClose=false;
  let settlement=null;
  let lastFocus=null;
  let feedback="";
  let mode="map";

  function activeRun(){return state.expeditionProgress.active;}
  function eligibleExplorers(){
    return state.entities.filter(entity=>entity.alive!==false&&Math.round((entity.energy??0)*100)>=MIN_EXPLORER_ENERGY);
  }
  function inventoryMarkup(inventory){
    return INVENTORY_KEYS.map(key=>'<div class="expedition-inventory-row"><span>'+materialName(key)+'</span><strong>'+text(inventory?.[key]??0)+'</strong></div>').join("");
  }
  function canAfford(upgrade){
    return Object.entries(upgrade.cost).every(([key,cost])=>(key==="coins"?state.coins:state.expeditionProgress.inventory[key]??0)>=cost);
  }
  function upgradeMarkup(){
    return Object.values(EXPEDITION_UPGRADES).map(upgrade=>{
      const installed=state.expeditionProgress.upgrades.includes(upgrade.id),affordable=canAfford(upgrade);
      const cost=Object.entries(upgrade.cost).map(([key,amount])=>amount+" "+(key==="coins"?"bellotas":materialName(key).toLowerCase())).join(" · ");
      return '<div class="expedition-upgrade-row"><div><strong>'+upgrade.label+'</strong><small>'+cost+'</small></div><button type="button" data-expedition-upgrade="'+upgrade.id+'"'+(installed||!affordable?" disabled":"")+'>'+(installed?"Instalada":"Construir")+'</button></div>';
    }).join("");
  }
  function renderer(){
    const instance=getRenderer();
    if(!instance)throw new Error("El renderer del terrario todavía no está disponible");
    return instance;
  }
  function ensureSelectedExplorer(){
    const eligible=eligibleExplorers();
    if(!eligible.some(entity=>entity.id===selectedExplorerId))selectedExplorerId=eligible[0]?.id??null;
  }
  function renderExplorerDock(){
    ensureSelectedExplorer();
    $("#expedition-roster-list").innerHTML=state.entities.filter(entity=>entity.alive!==false).map((entity,index)=>{
      const energy=Math.round((entity.energy??0)*100),ready=energy>=MIN_EXPLORER_ENERGY,selected=entity.id===selectedExplorerId;
      return '<button type="button" class="expedition-explorer'+(selected?" is-selected":"")+'" data-explorer-id="'+entity.id+'" aria-pressed="'+selected+'"'+(ready?"":" disabled")+'><span class="expedition-explorer-number">'+String(index+1).padStart(2,"0")+'</span><span class="expedition-explorer-copy"><strong>Isópodo '+String(index+1).padStart(2,"0")+'</strong><small>'+ (ready?"Listo para salir":"Necesita descansar")+'</small></span><span class="expedition-energy">'+energy+'<small>% energía</small></span></button>';
    }).join("");
    const unavailable=state.expeditionProgress.lastExpeditionDay>=dayOf(state);
    $("#expedition-start").disabled=!selectedExplorerId||unavailable;
    $("#expedition-start").textContent=unavailable?"La colonia ya salió hoy":"Entrar al jardín";
    if(unavailable)$("#expedition-location-copy").textContent="La siguiente salida se habilitará cuando el terrario avance al próximo día.";
    else if(!selectedExplorerId)$("#expedition-location-copy").textContent="No hay un isópodo con energía suficiente para explorar.";
    $("#expedition-explorer-dock").hidden=Boolean(activeRun());
  }
  function renderMap(){
    const run=activeRun(),nodeId=run?.currentNodeId??selectedMapNodeId;
    const visited=run?.visitedNodes??[START_NODE_ID];
    const current=EXPEDITION_NODES[nodeId];
    const neighbors=new Set(current?.links??[]);
    const hasPending=Boolean(run?.pendingEvent);
    renderer().setExpeditionView("map",{
      nodes:EXPEDITION_NODES,
      visitedNodes:visited,
      currentNodeId:nodeId,
      seed:run?.seed??state.expeditionProgress.worldSeed
    });
    $("#expedition-map-layer").hidden=false;
    $("#expedition-level-layer").hidden=true;
    $("#expedition-location-caption").hidden=false;
    $("#expedition-event").hidden=true;
    $("#expedition-settlement").hidden=true;
    $("#expedition-vitals").hidden= !run;
    $("#expedition-save").hidden=!run;
    $("#expedition-return").hidden=!run;
    $("#expedition-map-back").hidden=true;
    $("#expedition-resume-event").hidden=!hasPending;
    $("#expedition-close").hidden=Boolean(run);
    $("#expedition-home").hidden=true;
    $("#expedition-title").textContent="El jardín olvidado";
    $("#expedition-day").textContent="DÍA "+String(dayOf(state)).padStart(2,"0")+" · MAPA DE EXPLORACIÓN";
    $("#expedition-kicker").textContent=run?"RUTAS DEL JARDÍN":"MAPA DEL JARDÍN";
    $("#expedition-location-title").textContent=run?current.label:(selectedMapNodeId===START_NODE_ID?"Un pequeño mundo por descubrir":EXPEDITION_NODES[selectedMapNodeId]?.label??"Un pequeño mundo por descubrir");
    $("#expedition-location-copy").textContent=run
      ?(hasPending?"Hay un encuentro pendiente. Resuélvelo para abrir nuevas rutas.":NODE_NOTES[nodeId]+". Toca un lugar conectado para continuar.")
      :selectedMapNodeId===START_NODE_ID?"Toca los lugares del diorama. La salida comienza en el jardín húmedo; cada zona guarda un encuentro distinto.":(NODE_NOTES[selectedMapNodeId]??"Un lugar del jardín.")+". La salida comienza en el jardín húmedo.";
    $("#expedition-run-label").textContent=run?"EXPEDICIÓN "+run.id.toUpperCase()+" · SEMILLA "+run.seed:"UNA EXPEDICIÓN POR DÍA";
    $("#expedition-actions").textContent=String(run?.actionPoints??6).padStart(2,"0");
    $("#expedition-energy-value").textContent=String(run?.energy??0).padStart(2,"0");
    $("#expedition-map-nodes").innerHTML=Object.values(EXPEDITION_NODES).map(node=>{
      const active=node.id===nodeId,seen=visited.includes(node.id),connected=neighbors.has(node.id);
      const selectable=run?(!hasPending&&!active&&connected&&run.actionPoints>=node.travelCost):true;
      const status=active?"Posición actual":seen?"Visitado":connected?"Ruta abierta":"Por descubrir";
      const cost=node.travelCost===0?"Inicio":node.travelCost+(node.travelCost===1?" acción":" acciones");
      return '<button type="button" class="expedition-node'+(active?" is-current":"")+(seen&&!active?" is-visited":"")+(connected&&!active?" is-connected":"")+'" data-node-id="'+node.id+'" aria-label="'+node.label+". "+status+". "+cost+'"'+(active?' aria-current="location"':"")+(selectable?"":" disabled")+'><strong>'+node.label+'</strong><small>'+status+' · '+cost+'</small></button>';
    }).join("");
    renderExplorerDock();
    $("#expedition-session-message").textContent=feedback;
  }
  function renderLevel(){
    const run=activeRun(),event=run?.pendingEvent;
    if(!run||!event){renderMap();return;}
    const node=EXPEDITION_NODES[event.nodeId];
    renderer().setExpeditionView("level",{nodeId:event.nodeId,event,seed:run.seed});
    $("#expedition-map-layer").hidden=true;
    $("#expedition-level-layer").hidden=false;
    $("#expedition-location-caption").hidden=true;
    $("#expedition-event").hidden=false;
    $("#expedition-settlement").hidden=true;
    $("#expedition-vitals").hidden=false;
    $("#expedition-save").hidden=false;
    $("#expedition-return").hidden=false;
    $("#expedition-map-back").hidden=false;
    $("#expedition-resume-event").hidden=true;
    $("#expedition-close").hidden=true;
    $("#expedition-home").hidden=true;
    $("#expedition-explorer-dock").hidden=true;
    $("#expedition-title").textContent=node.label;
    $("#expedition-day").textContent="DÍA "+String(run.day).padStart(2,"0")+" · ENCUENTRO";
    $("#expedition-kicker").textContent="OBSERVACIÓN DE CAMPO";
    $("#expedition-location-title").textContent=node.label;
    $("#expedition-location-copy").textContent="Encuentro activo · elige una interacción en el diorama.";
    $("#expedition-event-location").textContent="ENCUENTRO · "+node.label.toUpperCase();
    $("#expedition-event-title").textContent=event.title;
    $("#expedition-event-description").textContent=event.description;
    $("#expedition-run-label").textContent="ELIGE UNA INTERACCIÓN EN EL DIORAMA";
    $("#expedition-actions").textContent=String(run.actionPoints).padStart(2,"0");
    $("#expedition-energy-value").textContent=String(run.energy).padStart(2,"0");
    $("#expedition-choice-dock").innerHTML=event.options.map((option,index)=>{
      const available=run.actionPoints>=option.actionCost&&run.energy>=option.energyCost;
      return '<button type="button" class="expedition-choice" data-choice-id="'+option.id+'"'+(available?"":" disabled")+'><span class="expedition-choice-letter">'+String.fromCharCode(65+index)+'</span><span class="expedition-choice-copy"><strong>'+option.label+'</strong><small>'+option.detail+'</small></span><em>'+costText(option)+'</em></button>';
    }).join("");
    $("#expedition-session-message").textContent=feedback;
  }
  function renderSettlement(){
    if(!settlement)return;
    renderer().setExpeditionView("map",{nodes:EXPEDITION_NODES,visitedNodes:[START_NODE_ID],currentNodeId:START_NODE_ID,seed:state.expeditionProgress.worldSeed});
    $("#expedition-map-layer").hidden=true;
    $("#expedition-level-layer").hidden=true;
    $("#expedition-location-caption").hidden=true;
    $("#expedition-event").hidden=true;
    $("#expedition-settlement").hidden=false;
    $("#expedition-close").hidden=true;
    $("#expedition-home").hidden=false;
    $("#expedition-explorer-dock").hidden=true;
    $("#expedition-map-back").hidden=true;
    $("#expedition-resume-event").hidden=true;
    $("#expedition-vitals").hidden=true;
    $("#expedition-save").hidden=true;
    $("#expedition-return").hidden=true;
    $("#expedition-title").textContent="Regreso al terrario";
    $("#expedition-day").textContent="DÍA "+String(settlement.dayAfter).padStart(2,"0")+" · REGRESO";
    $("#expedition-kicker").textContent="REGISTRO DE CAMPO";
    $("#expedition-location-title").textContent="De vuelta bajo la corteza";
    $("#expedition-location-copy").textContent="El explorador regresó. La simulación ecológica avanzó una jornada.";
    $("#expedition-settlement-copy").textContent=settlement.expeditionId+" terminó. Los materiales ya están disponibles para mejorar el hábitat.";
    $("#expedition-settlement-inventory").innerHTML=inventoryMarkup(settlement.inventory);
    $("#expedition-settlement-upgrades").innerHTML=upgradeMarkup();
  }
  function render(){
    if(settlement){renderSettlement();return;}
    const run=activeRun();
    if(run?.pendingEvent){mode="level";renderLevel();}
    else{mode="map";renderMap();}
  }
  function persist(){
    try{
      const saved=onSave();
      if(saved===false)throw new Error("El guardado no pudo completarse.");
      return true;
    }catch(error){
      feedback="No se pudo guardar: "+error.message;
      $("#expedition-session-message").textContent=feedback;
      return false;
    }
  }
  function finishToTerrarium(resume){
    root.hidden=true;
    const currentRenderer=getRenderer();
    currentRenderer?.setExpeditionInteractionHandler(null);
    currentRenderer?.showTerrarium();
    const terrariumHost=document.querySelector("#scene");
    if(currentRenderer&&terrariumHost)currentRenderer.setHost(terrariumHost);
    onExit({resume:Boolean(resume),result:settlement});
    const focusTarget=lastFocus?.isConnected&&!lastFocus.closest("[hidden]")?lastFocus:trigger;
    focusTarget?.focus?.({preventScroll:true});
    if(document.activeElement!==focusTarget)trigger.focus({preventScroll:true});
    lastFocus=null;
  }
  function show({resumeRunning}={}){
    if(typeof resumeRunning==="boolean")resumeAfterClose=resumeRunning;
    else resumeAfterClose=Boolean(onEnter());
    if(activeRun())resumeAfterClose=Boolean(activeRun().wasRunning);
    settlement=null;
    feedback="";
    selectedMapNodeId=activeRun()?.currentNodeId??START_NODE_ID;
    lastFocus=document.activeElement;
    root.hidden=false;
    const currentRenderer=renderer();
    currentRenderer.setHost($("#expedition-diorama"));
    currentRenderer.setExpeditionInteractionHandler(target=>{
      if(target.kind==="node")selectNode(target.id);
      else if(target.kind==="choice")choose(target.id);
    });
    render();
    requestAnimationFrame(()=>{
      const target=activeRun()?.pendingEvent?$("#expedition-choice-dock button:not(:disabled)"):$("#expedition-start");
      (target||$("#expedition-map")).focus({preventScroll:true});
    });
  }
  function closePreparation(){
    if(activeRun()||settlement)return;
    finishToTerrarium(resumeAfterClose);
  }
  function start(){
    try{
      startExpedition(state,selectedExplorerId,{wasRunning:resumeAfterClose});
      feedback="La colonia ha encontrado el primer rastro.";
      persist();
      renderLevel();
      $("#expedition-choice-dock button:not(:disabled)")?.focus({preventScroll:true});
    }catch(error){
      $("#expedition-location-copy").textContent=error.message;
    }
  }
  function selectNode(nodeId){
    const run=activeRun();
    if(!run){
      selectedMapNodeId=nodeId;
      selectedMapNodeId=nodeId;
      renderMap();
      return;
    }
    if(run.pendingEvent&&nodeId===run.currentNodeId){renderLevel();return;}
    try{
      const result=travelToNode(state,nodeId);
      feedback=result.event?"Nuevo encuentro descubierto.":"Ya conoces este lugar; no quedan hallazgos nuevos aquí.";
      persist();
      if(result.event){mode="level";renderLevel();}
      else renderMap();
      (result.event?$("#expedition-choice-dock button:not(:disabled)"):$("#expedition-map")).focus({preventScroll:true});
    }catch(error){
      feedback=error.message;
      $("#expedition-session-message").textContent=feedback;
    }
  }
  function choose(choiceId){
    try{
      const result=resolveExpeditionEvent(state,choiceId);
      const rewards=Object.entries(result.rewards).map(([key,amount])=>"+"+amount+" "+materialName(key).toLowerCase()).join(" · ");
      feedback=rewards|| (result.discoveries.length?"Nuevo descubrimiento registrado.":"Decisión registrada.");
      if(result.discoveries.length)feedback+=" · "+result.discoveries.length+" descubrimiento(s)";
      persist();
      mode="map";
      renderMap();
      $("#expedition-session-message").textContent=feedback;
      $("#expedition-map").focus({preventScroll:true});
    }catch(error){
      feedback=error.message;
      $("#expedition-session-message").textContent=feedback;
    }
  }
  function settle(){
    try{
      settlement=returnFromExpedition(state);
      resumeAfterClose=Boolean(settlement.wasRunning);
      state.running=false;
      feedback="";
      onChange();
      persist();
      renderSettlement();
      $("#expedition-home").focus({preventScroll:true});
    }catch(error){
      $("#expedition-session-message").textContent=error.message;
    }
  }

  trigger.addEventListener("click",()=>show());
  $("#expedition-close").addEventListener("click",closePreparation);
  $("#expedition-start").addEventListener("click",start);
  $("#expedition-map-back").addEventListener("click",()=>{if(activeRun()){mode="map";renderMap();$("#expedition-map").focus({preventScroll:true});}});
  $("#expedition-resume-event").addEventListener("click",()=>{if(activeRun()?.pendingEvent){mode="level";renderLevel();$("#expedition-choice-dock button:not(:disabled)")?.focus({preventScroll:true});}});
  $("#expedition-save").addEventListener("click",()=>{
    const saved=persist();
    $("#expedition-session-message").textContent=saved?"Recorrido guardado en este navegador.":feedback;
  });
  $("#expedition-return").addEventListener("click",settle);
  $("#expedition-home").addEventListener("click",()=>finishToTerrarium(resumeAfterClose));

  root.addEventListener("click",event=>{
    const explorer=event.target.closest("[data-explorer-id]");
    if(explorer){
      selectedExplorerId=explorer.dataset.explorerId;
      renderExplorerDock();
      root.querySelector('[data-explorer-id="'+selectedExplorerId+'"]')?.focus({preventScroll:true});
      return;
    }
    const node=event.target.closest("[data-node-id]");
    if(node){selectNode(node.dataset.nodeId);return;}
    const choice=event.target.closest("[data-choice-id]");
    if(choice){choose(choice.dataset.choiceId);return;}
    const upgrade=event.target.closest("[data-expedition-upgrade]");
    if(upgrade){
      try{
        const result=buyExpeditionUpgrade(state,upgrade.dataset.expeditionUpgrade);
        feedback=result.label+" instalado en el hábitat.";
        onChange();persist();renderSettlement();
        $("#expedition-session-message").textContent=feedback;
      }catch(error){$("#expedition-settlement-copy").textContent=error.message;}
    }
  });
  root.addEventListener("keydown",event=>{
    if(event.key==="Escape"){
      if(!activeRun()&&!settlement){event.preventDefault();closePreparation();}
      else if(activeRun()?.pendingEvent){event.preventDefault();mode="map";renderMap();}
      return;
    }
    if(event.key!=="Tab")return;
    const focusable=[...root.querySelectorAll('button:not(:disabled),[href],input:not(:disabled),[tabindex]:not([tabindex="-1"])')].filter(element=>!element.hidden&&element.getClientRects().length);
    if(!focusable.length)return;
    const first=focusable[0],last=focusable[focusable.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  return {show,render,close:closePreparation,get element(){return root;},get trigger(){return trigger;}};
}
