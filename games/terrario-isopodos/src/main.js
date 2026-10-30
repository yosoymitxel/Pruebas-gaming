import "./style.css";
import{createTerrariumState,formatClock,snapshotDomain}from"./state.js";
import{stepSimulation,addFood,addShelter,purchaseItem}from"./simulation.js";
import{hasValidTerrariumSave,saveTerrarium,loadTerrarium}from"./persistence.js";
import{TerrariumRenderer}from"./renderers.js";
const state=createTerrariumState(),$=s=>document.querySelector(s);
let renderer=null;
let last=performance.now(),acc=0,saveMessage="",setupShape="rectangular",settings=loadSettings(),setupMode=settings.mode,lastModalFocus=null;
const modalHistory=[];
const menu=$("#screen-menu"),setup=$("#screen-setup"),modal=$("#screen-modal"),shell=document.querySelector(".shell"),workspace=$(".workspace"),panel=$("#controls-panel"),panelToggle=$("#panel-toggle");
function loadSettings(){try{const raw=JSON.parse(localStorage.getItem("terrario-isopodos.settings.v1")||"{}");return{autoRotate:typeof raw.autoRotate==="boolean"?raw.autoRotate:true,quality:raw.quality==="economy"?"economy":"normal",mode:raw.mode==="voxel"?"voxel":"diorama"}}catch{return{autoRotate:true,quality:"normal",mode:"diorama"}}}
function saveSettings(){try{localStorage.setItem("terrario-isopodos.settings.v1",JSON.stringify(settings));return true}catch(error){saveMessage="No se pudieron guardar los ajustes: "+error.message;return false}}
function refreshMenu(){ $("#continue-game").disabled=!hasValidTerrariumSave(); }
function enterGame(){if(!ensureRenderer())return false;renderer.setShape(state.habitat.shape);renderer.setMode(state.presentation.mode);renderer.setQuality(settings.quality);menu.hidden=true;setup.hidden=true;modal.hidden=true;modalHistory.length=0;lastModalFocus=null;shell.hidden=false;renderer.resize();state.running=true;last=performance.now();acc=0;update();renderer.resetCamera();return true;}
function openModal(title,body,{push=true}={}){
 if(!modal.hidden&&push)modalHistory.push({title:$("#modal-title").textContent,body:$("#modal-body").innerHTML,focusId:document.activeElement?.id??""});
 else if(modal.hidden){lastModalFocus=document.activeElement;modalHistory.length=0;}
 $("#modal-title").textContent=title;$("#modal-body").innerHTML=body;modal.hidden=false;
 $("#close-modal").focus({preventScroll:true});
}
function ensureRenderer(){
 if(renderer)return renderer;
 try{
  renderer=new TerrariumRenderer($("#scene"),state);
  renderer.setQuality(settings.quality);
  return renderer;
 }catch(error){
  renderer=null;
  $("#scene").replaceChildren();
  console.error("[Terrario] No se pudo inicializar WebGL:",error);
  openModal("No se pudo iniciar el terrario",`<p>El navegador no pudo crear la escena 3D necesaria para este terrario.</p><p>Comprueba que WebGL y la aceleración por hardware estén disponibles, actualiza el navegador y vuelve a intentar.</p><button class="menu-primary" id="reload-app">Reintentar</button>`);
  return null;
 }
}
function closeModal({all=false}={}){
 if(!all&&modalHistory.length){
  const previous=modalHistory.pop();openModal(previous.title,previous.body,{push:false});
  const restore=previous.focusId?[...modal.querySelectorAll("[id]")].find(el=>el.id===previous.focusId):null;
  if(restore?.isConnected)restore.focus({preventScroll:true});
  return;
 }
 modal.hidden=true;modalHistory.length=0;
 const target=lastModalFocus;lastModalFocus=null;
 if(target?.isConnected&&target.getClientRects().length)target.focus({preventScroll:true});
}
function dismissModal(){
 if(modalHistory.length){closeModal();return;}
 const resume=!shell.hidden&&!state.running;
 closeModal({all:true});
 if(resume){state.running=true;last=performance.now();acc=0;update();}
}
function showPauseMenu(){state.running=false;update();openModal("Partida en pausa",`<p>El tiempo y los comportamientos están detenidos. Tu colonia sigue exactamente donde la dejaste.</p><button class="menu-primary" id="resume-game">Continuar observando <span aria-hidden="true">↗</span></button><button class="menu-secondary modal-action" id="pause-settings">Ajustes</button><button class="menu-secondary modal-action" id="pause-help">Cómo se juega</button><button class="menu-secondary modal-action" id="step-paused">Avanzar 1 minuto sin reanudar</button><button class="menu-secondary modal-action" id="pause-save">Guardar terrario</button><button class="menu-secondary modal-action" id="return-title">Volver al menú principal</button>`);}
function showSettings(){openModal("Ajustes",`<p>Preferencias locales de esta instalación.</p><label>Representación inicial y al continuar <select id="setting-mode"><option value="diorama" ${settings.mode==="diorama"?"selected":""}>Diorama 3D</option><option value="voxel" ${settings.mode==="voxel"?"selected":""}>Voxel 3D</option></select></label><label>Giro automático de cámara <input id="setting-rotate" type="checkbox" ${settings.autoRotate?"checked":""}></label><label>Calidad visual <select id="setting-quality"><option value="normal" ${settings.quality==="normal"?"selected":""}>Normal</option><option value="economy" ${settings.quality==="economy"?"selected":""}>Ahorro de rendimiento</option></select></label><p>Idioma: Español. El juego no utiliza audio todavía.</p><button class="menu-primary" id="save-settings">Guardar ajustes <span>✓</span></button>`);}
function showHelp(){openModal("Cómo se juega",`<p><b>Explora.</b> Arrastra sobre el terrario para orbitar la cámara y usa la rueda para acercarte.</p><p><b>Observa.</b> Alterna Diorama y Voxel sin reiniciar la colonia. La forma del recipiente se elige al crear el terrario.</p><p><b>Experimenta.</b> Inicia, pausa o acelera el tiempo. Ajusta humedad y temperatura, añade hojarasca y refugios.</p><p><b>Conserva.</b> Guarda el terrario en este navegador. Es una simulación lúdica simplificada, no un modelo científico.</p>`);}
$("#new-game").addEventListener("click",()=>{setupMode=settings.mode;document.querySelectorAll("[data-setup-mode]").forEach(x=>{const selected=x.dataset.setupMode===setupMode;x.classList.toggle("selected",selected);x.setAttribute("aria-pressed",String(selected));});menu.hidden=true;setup.hidden=false;requestAnimationFrame(()=>setup.querySelector("#setup-name").focus({preventScroll:true}));});
$("#back-to-menu").addEventListener("click",()=>{setup.hidden=true;menu.hidden=false;refreshMenu();});
document.querySelectorAll("[data-setup-shape]").forEach(b=>b.addEventListener("click",()=>{setupShape=b.dataset.setupShape;document.querySelectorAll("[data-setup-shape]").forEach(x=>{const selected=x===b;x.classList.toggle("selected",selected);x.setAttribute("aria-pressed",String(selected));});}));
document.querySelectorAll("[data-setup-mode]").forEach(b=>b.addEventListener("click",()=>{setupMode=b.dataset.setupMode;document.querySelectorAll("[data-setup-mode]").forEach(x=>{const selected=x===b;x.classList.toggle("selected",selected);x.setAttribute("aria-pressed",String(selected));});}));
$("#start-game").addEventListener("click",()=>{Object.assign(state,createTerrariumState());state.habitat.shape=setupShape;state.presentation.mode=setupMode;state.presentation.autoRotate=settings.autoRotate;settings.mode=setupMode;saveSettings();state.name=$("#setup-name").value.trim()||"Pequeño bosque";state.running=true;enterGame();});
$("#continue-game").addEventListener("click",()=>{try{const loaded=loadTerrarium();if(!loaded){refreshMenu();return;}Object.assign(state,loaded);state.presentation={...state.presentation,mode:settings.mode,autoRotate:settings.autoRotate};enterGame();}catch(e){openModal("No se pudo continuar",`<p>${e.message}</p>`);}});
$("#open-settings").addEventListener("click",showSettings);$("#open-settings-game").addEventListener("click",showSettings);$("#open-help").addEventListener("click",showHelp);$("#open-help-game").addEventListener("click",showHelp);$("#close-modal").addEventListener("click",dismissModal);
$("#open-game-menu").addEventListener("click",showPauseMenu);
panelToggle.addEventListener("click",()=>{
 const expanded=!panel.classList.contains("is-expanded");
 panel.classList.toggle("is-expanded",expanded);
 panelToggle.setAttribute("aria-expanded",String(expanded));
 workspace.classList.toggle("controls-expanded",expanded);
});
modal.addEventListener("keydown",e=>{
 if(e.key==="Escape"){e.preventDefault();dismissModal();return;}
 if(e.key!=="Tab")return;
 const focusable=[...modal.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])')].filter(el=>!el.hidden&&el.getClientRects().length);
 if(!focusable.length)return;
 const first=focusable[0],lastFocusable=focusable[focusable.length-1];
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();lastFocusable.focus();}
 else if(!e.shiftKey&&document.activeElement===lastFocusable){e.preventDefault();first.focus();}
});
modal.addEventListener("click",e=>{const t=e.target.closest("button");if(!t)return;if(t.id==="reload-app"){window.location.reload();return;}if(t.id==="resume-game"){closeModal({all:true});state.running=true;last=performance.now();acc=0;update();}else if(t.id==="pause-settings"){showSettings();}else if(t.id==="pause-help"){showHelp();}else if(t.id==="step-paused"){stepSimulation(state,1);renderer.interpolationAlpha=1;update();}else if(t.id==="pause-save"){try{saveTerrarium(state);saveMessage="Terrario guardado en este navegador";refreshMenu();openModal("Terrario guardado",`<p>La colonia quedó guardada en este navegador.</p><button class="menu-primary" id="resume-game">Volver al terrario <span>↗</span></button>`);}catch(err){openModal("Error al guardar",`<p>${err.message}</p>`);}}else if(t.id==="return-title-anyway"){state.running=false;closeModal({all:true});shell.hidden=true;menu.hidden=false;refreshMenu();$("#continue-game").focus({preventScroll:true});}else if(t.id==="return-title"){try{saveTerrarium(state);saveMessage="";}catch(err){openModal("No se pudo guardar la partida",`<p>${err.message}</p><button class="menu-secondary" id="return-title-anyway">Salir sin guardar</button>`);return;}state.running=false;closeModal({all:true});shell.hidden=true;menu.hidden=false;refreshMenu();$("#continue-game").focus({preventScroll:true});}else if(t.id==="save-settings"){settings.autoRotate=$("#setting-rotate").checked;settings.quality=$("#setting-quality").value;settings.mode=$("#setting-mode").value;state.presentation.autoRotate=settings.autoRotate;if(!saveSettings()){openModal("No se pudieron guardar los ajustes",`<p>${saveMessage}</p>`);return;}renderer?.setQuality(settings.quality);if(!shell.hidden){state.presentation.mode=settings.mode;renderer?.setMode(settings.mode);update();}$("#rotate").setAttribute("aria-pressed",String(settings.autoRotate));closeModal();} });
refreshMenu();
function update(){
 const alive=state.entities.filter(e=>e.alive!==false).length,humidity=Math.round(state.habitat.humidity*100);$("#clock").textContent=formatClock(state.clockMinutes);$("#state-note").textContent=state.running?"Simulación en marcha":"Simulación en pausa";$("#pause").textContent=state.running?"Ⅱ Pausar":"▶ Iniciar";$("#speed-label").textContent=state.speed+"×";$("#count").textContent=String(alive).padStart(2,"0");$("#panel-summary").textContent=`${String(alive).padStart(2,"0")} individuos · ${humidity} % humedad`;$("#humidity-value").textContent=humidity+" %";$("#temperature-value").textContent=state.habitat.temperatureC.toFixed(1)+" °C";
 $("#coins").textContent=String(state.coins??0);$("#humidity").textContent=humidity;$("#temperature").textContent=state.habitat.temperatureC.toFixed(1);$("#humidity-input").value=state.habitat.humidity;$("#temperature-input").value=state.habitat.temperatureC;$("#speed").value=state.speed;
 const behaviorEntity=state.entities.find(e=>e.alive!==false&&["defensive-curl","burrowing","feeding","grooming","resting","socializing"].includes(e.behavior))??state.entities.find(e=>e.alive!==false);const behaviorLabels={"defensive-curl":"Se hace bolita para protegerse","burrowing":"Cavando bajo la hojarasca","feeding":"Comiendo hojarasca","grooming":"Acicalándose","resting":"Descansando","socializing":"Interactuando con otro isópodo","seeking-food":"Buscando comida","seeking-shelter":"Buscando refugio","investigating":"Investigando el entorno","exploring":"Explorando el terrario"};$("#behavior").textContent=behaviorEntity?(behaviorLabels[behaviorEntity.behavior]??"Explorando el terrario"):"La colonia no tiene individuos vivos";$("#resource-note").textContent=saveMessage||`Hojarasca: ${Math.round((state.resources.find(r=>r.type==="leaf-litter")?.amount??0)*100)}% · Refugios: ${state.resources.filter(r=>r.type==="shelter").length}`;
 $("#pause").setAttribute("aria-pressed",String(state.running));$("#view-label").textContent=state.presentation.mode==="voxel"?"VOXEL / 3D":"DIORAMA 3D";
 document.querySelectorAll("[data-mode]").forEach(b=>{const a=b.dataset.mode===state.presentation.mode;b.classList.toggle("active",a);b.setAttribute("aria-pressed",String(a));});
 document.querySelectorAll("[data-shape]").forEach(b=>{const a=b.dataset.shape===state.habitat.shape;b.classList.toggle("active",a);b.setAttribute("aria-pressed",String(a));});
 renderer?.syncEntities(); 
}
document.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>{const before=snapshotDomain(state);renderer.setMode(b.dataset.mode);if(snapshotDomain(state)!==before)throw Error("El renderer alteró el estado de dominio");state.presentation.mode=b.dataset.mode;settings.mode=b.dataset.mode;saveSettings();saveMessage="";update();}));
document.querySelectorAll("[data-shape]").forEach(b=>b.addEventListener("click",()=>{state.habitat.shape=b.dataset.shape;renderer.setShape(b.dataset.shape);update();}));
$("#pause").addEventListener("click",()=>{if(state.running){showPauseMenu();}else{state.running=true;last=performance.now();acc=0;closeModal();update();}});
$("#step").addEventListener("click",()=>{stepSimulation(state,1);renderer.interpolationAlpha=1;update();});
$("#speed").addEventListener("input",e=>{state.speed=Number(e.target.value);update();});
$("#rotate").addEventListener("click",e=>{state.presentation.autoRotate=!state.presentation.autoRotate;settings.autoRotate=state.presentation.autoRotate;saveSettings();e.currentTarget.setAttribute("aria-pressed",String(state.presentation.autoRotate));});
$("#reset").addEventListener("click",()=>renderer.resetCamera());$("#zoom-in").addEventListener("click",()=>renderer.zoom(-.65));$("#zoom-out").addEventListener("click",()=>renderer.zoom(.65));
$("#humidity-input").addEventListener("input",e=>{state.habitat.humidity=Number(e.target.value);update();});
$("#temperature-input").addEventListener("input",e=>{state.habitat.temperatureC=Number(e.target.value);update();});
$("#add-food").addEventListener("click",()=>{addFood(state);saveMessage="Hojarasca añadida";update();});
$("#add-shelter").addEventListener("click",()=>{addShelter(state);saveMessage="Refugio disponible";update();});
$("#shop-grid").addEventListener("click",e=>{const button=e.target.closest("[data-buy]");if(!button)return;try{const result=purchaseItem(state,button.dataset.buy);saveMessage="";$("#shop-note").textContent=`${result.item.label} colocado. Quedan ${result.coins} bellotas.`;update();}catch(error){$("#shop-note").textContent=error.message;}});
$("#save").addEventListener("click",()=>{try{saveTerrarium(state);saveMessage="Terrario guardado en este navegador";}catch(e){saveMessage="No se pudo guardar: "+e.message;}update();});
$("#load").addEventListener("click",()=>{try{const loaded=loadTerrarium();if(!loaded){saveMessage="No hay un guardado todavía";update();return;}Object.assign(state,loaded);state.presentation.mode=settings.mode;state.presentation.autoRotate=settings.autoRotate;renderer.setShape(state.habitat.shape);renderer.setMode(state.presentation.mode);renderer.setQuality(settings.quality);saveMessage="Guardado recuperado";}catch(e){saveMessage="Guardado rechazado: "+e.message;}update();});
function tick(now){const dt=Math.min((now-last)/1000,.25);last=now;if(state.running){acc+=dt*state.speed;let steps=0;while(acc>=1&&steps<20){stepSimulation(state,1);acc--;steps++;}renderer.interpolationAlpha=acc;update();}requestAnimationFrame(tick);}
window.addEventListener("beforeunload",()=>renderer?.dispose(),{once:true});state.presentation.autoRotate=settings.autoRotate;$("#rotate").setAttribute("aria-pressed",String(settings.autoRotate));update();refreshMenu();requestAnimationFrame(tick);
