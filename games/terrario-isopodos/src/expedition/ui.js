import { snapshotDomain } from "../state.js";
import {
  startExpedition,
  travelToNode,
  resolveExpeditionEvent,
  returnFromExpedition,
  buyExpeditionUpgrade,
  isExpeditionNodeUnlocked
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
  "compost-bin":"Restos vegetales en descomposición",
  "abandoned-pot":"Raíces finas bajo una maceta caída",
  "mite-nest":"Un refugio activo entre fibras y corteza",
  "web-zone":"Hilos tensos entre hojas y ramas"
});
const UNLOCK_HINTS=Object.freeze({
  "compost-access":"Seguí las raíces bajo la Maceta abandonada.",
  "mite-colony":"Observá una colonia de ácaros para localizar el nido.",
  "web-passage":"Rompé la telaraña del Tronco podrido para abrir el paso."
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
            '<div class="expedition-explorer-heading"><span>EXPLORADORES DE LA COLONIA</span><small>Necesitan 30% de energía para salir</small></div>',
            '<p id="expedition-readiness" class="expedition-readiness" role="status" aria-live="polite"></p>',
            '<div id="expedition-roster-list" class="expedition-roster-list"></div>',
            '<button id="expedition-start" type="button" class="expedition-primary">Comenzar en Jardín húmedo</button>',
          '</div>',
        '</section>',
        '<section id="expedition-level-layer" class="expedition-level-layer" hidden>',
          '<div class="expedition-event" id="expedition-event" aria-live="polite"><p class="expedition-event-location" id="expedition-event-location"></p><h2 id="expedition-event-title" tabindex="-1"></h2><p id="expedition-event-description"></p><div id="expedition-run-actions" class="expedition-run-actions" hidden><button type="button" id="expedition-save" class="expedition-secondary">Guardar</button><button type="button" id="expedition-return" class="expedition-primary expedition-retreat">Retirarse</button></div></div>',
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
    const living=state.entities.filter(entity=>entity.alive!==false);
    const eligible=eligibleExplorers();
    if(eligible.length&&!eligible.some(entity=>entity.id===selectedExplorerId)){
      selectedExplorerId=eligible[0].id;
    }else if(!eligible.length&&!living.some(entity=>entity.id===selectedExplorerId)){
      selectedExplorerId=living[0]?.id??null;
    }
  }
  function renderExplorerDock(){
    ensureSelectedExplorer();
    const living=state.entities.filter(entity=>entity.alive!==false);
    const eligible=eligibleExplorers();
    const unavailable=state.expeditionProgress.lastExpeditionDay>=dayOf(state);
    $("#expedition-roster-list").innerHTML=living.length?living.map((entity,index)=>{
      const energy=Math.round((entity.energy??0)*100);
      const ready=energy>=MIN_EXPLORER_ENERGY;
      const selected=entity.id===selectedExplorerId;
      const remaining=Math.max(0,MIN_EXPLORER_ENERGY-energy);
      return '<button type="button" class="expedition-explorer'+(selected?" is-selected":"")+(ready?" is-ready":" is-tired")+'" data-explorer-id="'+entity.id+'" aria-pressed="'+selected+'" aria-label="Isópodo '+String(index+1)+', '+energy+'% de energía, '+(ready?"disponible":"necesita "+remaining+" puntos para salir")+'"'+(ready?"":" disabled")+'><span class="expedition-explorer-number">'+String(index+1).padStart(2,"0")+'</span><span class="expedition-explorer-copy"><strong>Isópodo '+String(index+1).padStart(2,"0")+'</strong><small>'+(ready?"Puede explorar":"Descansar · faltan "+remaining+" puntos")+'</small><span class="expedition-energy-track" aria-hidden="true"><span style="width:'+energy+'%"></span></span></span><span class="expedition-energy">'+energy+'<small>%</small></span></button>';
    }).join(""):'<p class="expedition-roster-empty">No quedan isópodos vivos en la colonia.</p>';

    root.classList.toggle("is-exhausted",!eligible.length&&living.length>0);
    const selected=living.find(entity=>entity.id===selectedExplorerId);
    const selectedReady=Boolean(selected&&Math.round((selected.energy??0)*100)>=MIN_EXPLORER_ENERGY);
    const bestEnergy=living.length?Math.max(...living.map(entity=>Math.round((entity.energy??0)*100))):0;
    const readiness=$("#expedition-readiness");
    const action=$("#expedition-start");
    let actionMode="start";
    if(unavailable){
      actionMode="daily";
      readiness.textContent="La colonia ya realizó su salida de hoy. Avanzá el día en el terrario para habilitar otra expedición.";
      action.textContent="Volver al terrario";
    }else if(eligible.length){
      actionMode="start";
      readiness.textContent=eligible.length+" de "+living.length+" isópodos pueden salir. La ruta comienza en Jardín húmedo.";
      action.textContent="Comenzar en Jardín húmedo";
    }else if(living.length){
      actionMode="recover";
      readiness.textContent="Ningún isópodo alcanza el 30%. El mejor está al "+bestEnergy+"%: faltan "+Math.max(0,MIN_EXPLORER_ENERGY-bestEnergy)+" puntos. Volvé al terrario, revisá humedad, alimento y refugios y dejá avanzar la simulación.";
      action.textContent="Volver al terrario para recuperar energía";
    }else{
      actionMode="empty";
      readiness.textContent="No hay individuos vivos que puedan explorar. Revisá el estado de la colonia en el terrario.";
      action.textContent="Volver al terrario";
    }
    if(actionMode==="start"&&!selectedReady)action.textContent="Elegí un explorador disponible";
    action.dataset.action=actionMode;
    action.disabled=false;
    action.setAttribute("aria-label",action.textContent);
    $("#expedition-explorer-dock").hidden=Boolean(activeRun());
  }
  function renderMap(){
    const run=activeRun(),nodeId=run?.currentNodeId??selectedMapNodeId;
    const visited=run?.visitedNodes??[];
    const current=run?EXPEDITION_NODES[nodeId]:null;
    const neighbors=new Set(current?.links??[]);
    const hasPending=Boolean(run?.pendingEvent);
    root.classList.toggle("has-active-expedition",Boolean(run));
    root.classList.toggle("has-pending-event",hasPending);
    root.classList.remove("is-level","is-settlement");
    $("#expedition-map-layer").classList.toggle("is-running",Boolean(run));
    const unlockedNodeIds=Object.keys(EXPEDITION_NODES).filter(id=>isExpeditionNodeUnlocked(state,id));
    renderer().setExpeditionView("map",{
      nodes:EXPEDITION_NODES,
      visitedNodes:visited,
      currentNodeId:run?.currentNodeId??null,
      previewNodeId:run?null:selectedMapNodeId,
      unlockedNodeIds,
      seed:run?.seed??state.expeditionProgress.worldSeed
    });
    $("#expedition-map-layer").hidden=false;
    $("#expedition-level-layer").hidden=true;
    $("#expedition-location-caption").hidden=false;
    $("#expedition-event").hidden=true;
    $("#expedition-settlement").hidden=true;
    $("#expedition-vitals").hidden= !run;
    $("#expedition-map-layer").append($("#expedition-run-actions"));
    $("#expedition-run-actions").hidden=!run;
    $("#expedition-map-back").hidden=true;
    $("#expedition-resume-event").hidden=!hasPending;
    $("#expedition-close").hidden=Boolean(run);
    $("#expedition-home").hidden=true;
    $("#expedition-title").textContent="El jardín olvidado";
    $("#expedition-day").textContent="DÍA "+String(dayOf(state)).padStart(2,"0")+" · MAPA DE EXPLORACIÓN";
    $("#expedition-kicker").textContent=run?"RUTAS DEL JARDÍN":"MAPA DEL JARDÍN";
    const preview=EXPEDITION_NODES[selectedMapNodeId]??EXPEDITION_NODES[START_NODE_ID];
    const previewUnlocked=isExpeditionNodeUnlocked(state,preview.id);
    const previewHint=preview.unlockDiscovery?UNLOCK_HINTS[preview.unlockDiscovery]??preview.unlockHint:"";
    $("#expedition-location-title").textContent=run?current.label:preview.label;
    $("#expedition-location-copy").textContent=run
      ?(hasPending?"Hay un encuentro pendiente. Resuélvelo para abrir nuevas rutas.":NODE_NOTES[nodeId]+". Toca un lugar conectado para continuar.")
      :(!previewUnlocked?"Zona bloqueada. "+previewHint:"Vista previa: "+(NODE_NOTES[selectedMapNodeId]??preview.label)+". La expedición siempre comienza en Jardín húmedo; elegí un explorador para salir.");
    $("#expedition-run-label").textContent=run?"EXPEDICIÓN "+run.id.toUpperCase()+" · SEMILLA "+run.seed:"UNA EXPEDICIÓN POR DÍA";
    $("#expedition-actions").textContent=String(run?.actionPoints??6).padStart(2,"0");
    $("#expedition-energy-value").textContent=String(run?.energy??0).padStart(2,"0");
    $("#expedition-map-nodes").innerHTML=Object.values(EXPEDITION_NODES).map(node=>{
      const active=Boolean(run)&&node.id===nodeId;
      const previewSelected=!run&&node.id===selectedMapNodeId;
      const seen=visited.includes(node.id),connected=neighbors.has(node.id);
      const unlocked=isExpeditionNodeUnlocked(state,node.id);
      const selectable=run?(!hasPending&&!active&&connected&&unlocked&&run.actionPoints>=node.travelCost):true;
      const status=!unlocked?"Bloqueado":run?(active?"Posición actual":seen?"Visitado":connected?"Ruta abierta":"Por descubrir"):(previewSelected?"Vista previa":"Consultar zona");
      const cost=node.travelCost===0?"Inicio":node.travelCost+(node.travelCost===1?" acción":" acciones");
      const risk=node.risk==="high"?"Riesgo alto":node.risk==="medium"?"Riesgo medio":"Riesgo bajo";
      const hint=node.unlockDiscovery?UNLOCK_HINTS[node.unlockDiscovery]??node.unlockHint:"";
      return '<button type="button" class="expedition-node'+(active?" is-current":"")+(previewSelected?" is-selected":"")+(seen&&!active?" is-visited":"")+(connected&&!active&&run?" is-connected":"")+(unlocked?"":" is-locked")+'" data-node-id="'+node.id+'" data-unlocked="'+String(unlocked)+'" data-discovery="'+(node.unlockDiscovery??"")+'" aria-label="'+node.label+". "+status+". "+cost+". "+risk+(hint?" · "+hint:"")+'" aria-pressed="'+previewSelected+'"'+(active?' aria-current="location"':"")+(selectable?"":" disabled")+'><strong>'+node.label+'</strong><small>'+status+' · '+cost+' · '+risk+'</small></button>';
    }).join("");
    renderExplorerDock();
    $("#expedition-session-message").textContent=feedback;
  }
  function renderLevel(){
    const run=activeRun(),event=run?.pendingEvent;
    if(!run||!event){renderMap();return;}
    root.classList.add("has-active-expedition","is-level");
    root.classList.remove("is-settlement","is-exhausted","has-pending-event");
    $("#expedition-map-layer").classList.add("is-running");
    const node=EXPEDITION_NODES[event.nodeId];
    renderer().setExpeditionView("level",{nodeId:event.nodeId,event,seed:run.seed});
    $("#expedition-map-layer").hidden=true;
    $("#expedition-level-layer").hidden=false;
    $("#expedition-location-caption").hidden=true;
    $("#expedition-event").hidden=false;
    $("#expedition-settlement").hidden=true;
    $("#expedition-vitals").hidden=false;
    $("#expedition-event").append($("#expedition-run-actions"));
    $("#expedition-run-actions").hidden=false;
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
    root.classList.remove("has-active-expedition","is-level","is-exhausted","has-pending-event");
    root.classList.add("is-settlement");
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
    $("#expedition-run-actions").hidden=true;
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
  function commitMutation(action,onSuccess=()=>{}){
    const previous=JSON.parse(snapshotDomain(state));
    let result;
    try{
      result=action();
      onSuccess(result);
    }catch(error){
      Object.assign(state,previous);
      onChange();
      render();
      throw error;
    }
    if(!persist()){
      const failure=feedback;
      Object.assign(state,previous);
      onChange();
      feedback=failure+" La acción se deshizo; no se consumieron energía ni acciones.";
      render();
      return null;
    }
    onChange();
    return result;
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
    root.classList.remove("is-settlement","is-level");
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
      const run=commitMutation(()=>startExpedition(state,selectedExplorerId,{wasRunning:resumeAfterClose}),()=>{
        feedback="La colonia ha encontrado el primer rastro.";
      });
      if(!run)return;
      selectedMapNodeId=START_NODE_ID;
      renderLevel();
      $("#expedition-choice-dock button:not(:disabled)")?.focus({preventScroll:true});
    }catch(error){
      feedback=error.message;
      $("#expedition-session-message").textContent=feedback;
    }
  }
  function selectNode(nodeId){
    const run=activeRun();
    if(!run){
      selectedMapNodeId=nodeId;
      renderMap();
      return;
    }
    if(run.pendingEvent&&nodeId===run.currentNodeId){renderLevel();return;}
    try{
      const result=commitMutation(()=>travelToNode(state,nodeId),value=>{
        feedback=value.event?"Nuevo encuentro descubierto.":"Ya conoces este lugar; no quedan hallazgos nuevos aquí.";
      });
      if(!result)return;
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
      const result=commitMutation(()=>resolveExpeditionEvent(state,choiceId),value=>{
        const rewards=Object.entries(value.rewards).map(([key,amount])=>"+"+amount+" "+materialName(key).toLowerCase()).join(" · ");
        feedback=rewards||(value.discoveries.length?"Nuevo descubrimiento registrado.":"Decisión registrada.");
        if(value.discoveries.length)feedback+=" · "+value.discoveries.length+" descubrimiento(s)";
      });
      if(!result)return;
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
      const result=commitMutation(()=>{
        const outcome=returnFromExpedition(state);
        state.running=false;
        return outcome;
      },()=>{feedback="";});
      if(!result)return;
      settlement=result;
      resumeAfterClose=Boolean(settlement.wasRunning);
      renderSettlement();
      $("#expedition-home").focus({preventScroll:true});
    }catch(error){
      feedback=error.message;
      $("#expedition-session-message").textContent=feedback;
    }
  }

  trigger.addEventListener("click",()=>show());
  $("#expedition-close").addEventListener("click",closePreparation);
  $("#expedition-start").addEventListener("click",()=>{
    const action=$("#expedition-start").dataset.action;
    if(action==="start"){start();return;}
    finishToTerrarium(resumeAfterClose);
  });
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
        const result=commitMutation(()=>buyExpeditionUpgrade(state,upgrade.dataset.expeditionUpgrade),value=>{
          feedback=value.label+" instalado en el hábitat.";
        });
        if(!result)return;
        renderSettlement();
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
