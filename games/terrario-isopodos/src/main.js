import "./style.css";
import{createTerrariumState,formatClock,snapshotDomain}from"./state.js";
import{stepSimulation,addFood,addShelter}from"./simulation.js";
import{SAVE_KEY,saveTerrarium,loadTerrarium}from"./persistence.js";
import{TerrariumRenderer}from"./renderers.js";
const state=createTerrariumState(),renderer=new TerrariumRenderer(document.querySelector("#scene"),state),$=s=>document.querySelector(s);
let last=performance.now(),acc=0,saveMessage="",setupShape="rectangular",setupMode="diorama",settings=loadSettings();
const menu=$("#screen-menu"),setup=$("#screen-setup"),modal=$("#screen-modal"),shell=document.querySelector(".shell");
function loadSettings(){try{return{autoRotate:true,quality:"normal",...JSON.parse(localStorage.getItem("terrario-isopodos.settings.v1")||"{}")}}catch{return{autoRotate:true,quality:"normal"}}}
function saveSettings(){localStorage.setItem("terrario-isopodos.settings.v1",JSON.stringify(settings));}
function hasSave(){try{return Boolean(localStorage.getItem(SAVE_KEY))}catch{return false}}
function refreshMenu(){ $("#continue-game").disabled=!hasSave(); }
function enterGame(){menu.hidden=true;setup.hidden=true;modal.hidden=true;shell.hidden=false;renderer.resize();state.running=true;last=performance.now();acc=0;update();renderer.resetCamera();}
function openModal(title,body){$("#modal-title").textContent=title;$("#modal-body").innerHTML=body;modal.hidden=false;}
function closeModal(){modal.hidden=true;}
function showPauseMenu(){state.running=false;update();openModal("Partida en pausa",`<p>El tiempo y los comportamientos están detenidos. Tu colonia sigue exactamente donde la dejaste.</p><button class="menu-primary" id="resume-game">Continuar observando <span>↗</span></button><button class="menu-secondary modal-action" id="step-paused">Avanzar 1 minuto sin reanudar</button><button class="menu-secondary modal-action" id="pause-save">Guardar terrario</button><button class="menu-secondary modal-action" id="return-title">Volver al menú principal</button>`);}
function showSettings(){openModal("Ajustes",`<p>Preferencias locales de esta instalación.</p><label>Giro automático de cámara <input id="setting-rotate" type="checkbox" ${settings.autoRotate?"checked":""}></label><label>Calidad visual <select id="setting-quality"><option value="normal" ${settings.quality==="normal"?"selected":""}>Normal</option><option value="economy" ${settings.quality==="economy"?"selected":""}>Ahorro de rendimiento</option></select></label><p>Idioma: Español. El juego no utiliza audio todavía.</p><button class="menu-primary" id="save-settings">Guardar ajustes <span>✓</span></button>`);}
function showHelp(){openModal("Cómo se juega",`<p><b>Explora.</b> Arrastra sobre el terrario para orbitar la cámara y usa la rueda para acercarte.</p><p><b>Observa.</b> Alterna Diorama y Voxel sin reiniciar la colonia. La forma del recipiente se elige al crear el terrario.</p><p><b>Experimenta.</b> Inicia, pausa o acelera el tiempo. Ajusta humedad y temperatura, añade hojarasca y refugios.</p><p><b>Conserva.</b> Guarda el terrario en este navegador. Es una simulación lúdica simplificada, no un modelo científico.</p>`);}
$("#new-game").addEventListener("click",()=>{menu.hidden=true;setup.hidden=false;setup.querySelector("#setup-name").focus();});
$("#back-to-menu").addEventListener("click",()=>{setup.hidden=true;menu.hidden=false;refreshMenu();});
document.querySelectorAll("[data-setup-shape]").forEach(b=>b.addEventListener("click",()=>{setupShape=b.dataset.setupShape;document.querySelectorAll("[data-setup-shape]").forEach(x=>x.classList.toggle("selected",x===b));}));
document.querySelectorAll("[data-setup-mode]").forEach(b=>b.addEventListener("click",()=>{setupMode=b.dataset.setupMode;document.querySelectorAll("[data-setup-mode]").forEach(x=>x.classList.toggle("selected",x===b));}));
$("#start-game").addEventListener("click",()=>{Object.assign(state,createTerrariumState());state.habitat.shape=setupShape;state.presentation.mode=setupMode;state.presentation.autoRotate=settings.autoRotate;state.name=$("#setup-name").value.trim()||"Pequeño bosque";renderer.setShape(setupShape);state.running=true;enterGame();});
$("#continue-game").addEventListener("click",()=>{try{const loaded=loadTerrarium();if(!loaded){refreshMenu();return;}Object.assign(state,loaded);state.presentation={...state.presentation,mode:setupMode,autoRotate:settings.autoRotate};renderer.setShape(state.habitat.shape);renderer.setMode(state.presentation.mode);enterGame();}catch(e){openModal("No se pudo continuar",`<p>${e.message}</p>`);}});
$("#open-settings").addEventListener("click",showSettings);$("#open-help").addEventListener("click",showHelp);$("#close-modal").addEventListener("click",closeModal);
$("#open-game-menu").addEventListener("click",showPauseMenu);
modal.addEventListener("click",e=>{const t=e.target.closest("button");if(!t)return;if(t.id==="resume-game"){closeModal();state.running=true;last=performance.now();update();}else if(t.id==="step-paused"){stepSimulation(state,1);update();}else if(t.id==="pause-save"){try{saveTerrarium(state);saveMessage="Terrario guardado en este navegador";refreshMenu();openModal("Terrario guardado",`<p>La colonia quedó guardada en este navegador.</p><button class="menu-primary" id="resume-game">Volver al terrario <span>↗</span></button>`);}catch(err){openModal("Error al guardar",`<p>${err.message}</p>`);}}else if(t.id==="return-title"){state.running=false;shell.hidden=true;closeModal();menu.hidden=false;refreshMenu();}else if(t.id==="save-settings"){settings.autoRotate=$("#setting-rotate").checked;settings.quality=$("#setting-quality").value;state.presentation.autoRotate=settings.autoRotate;saveSettings();$("#rotate").setAttribute("aria-pressed",String(settings.autoRotate));closeModal();} });
refreshMenu();
function update(){
 $("#clock").textContent=formatClock(state.clockMinutes);$("#state-note").textContent=state.running?"Simulación en marcha":"Simulación en pausa";$("#pause").textContent=state.running?"Ⅱ Pausar":"▶ Iniciar";$("#speed-label").textContent=state.speed+"×";$("#count").textContent=String(state.entities.filter(e=>e.alive!==false).length).padStart(2,"0");
 $("#humidity").textContent=Math.round(state.habitat.humidity*100);$("#temperature").textContent=state.habitat.temperatureC.toFixed(1);$("#humidity-input").value=state.habitat.humidity;$("#temperature-input").value=state.habitat.temperatureC;
 $("#behavior").textContent=state.entities[0]?.behavior??"sin individuos";$("#resource-note").textContent=saveMessage||`Hojarasca: ${Math.round((state.resources.find(r=>r.type==="leaf-litter")?.amount??0)*100)}% · Refugios: ${state.resources.filter(r=>r.type==="shelter").length}`;
 $("#pause").setAttribute("aria-pressed",String(state.running));$("#view-label").textContent=state.presentation.mode==="voxel"?"VOXEL / 3D":"DIORAMA 3D";
 document.querySelectorAll("[data-mode]").forEach(b=>{const a=b.dataset.mode===state.presentation.mode;b.classList.toggle("active",a);b.setAttribute("aria-pressed",String(a));});
 document.querySelectorAll("[data-shape]").forEach(b=>{const a=b.dataset.shape===state.habitat.shape;b.classList.toggle("active",a);b.setAttribute("aria-pressed",String(a));});
 renderer.syncEntities(); 
}
document.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>{const before=snapshotDomain(state);renderer.setMode(b.dataset.mode);if(snapshotDomain(state)!==before)throw Error("El renderer alteró el estado de dominio");saveMessage="";update();}));
document.querySelectorAll("[data-shape]").forEach(b=>b.addEventListener("click",()=>{renderer.setShape(b.dataset.shape);update();}));
$("#pause").addEventListener("click",()=>{if(state.running){showPauseMenu();}else{state.running=true;last=performance.now();acc=0;closeModal();update();}});
$("#step").addEventListener("click",()=>{stepSimulation(state,1);update();});
$("#speed").addEventListener("input",e=>{state.speed=Number(e.target.value);update();});
$("#rotate").addEventListener("click",e=>{state.presentation.autoRotate=!state.presentation.autoRotate;settings.autoRotate=state.presentation.autoRotate;saveSettings();e.currentTarget.setAttribute("aria-pressed",String(state.presentation.autoRotate));});
$("#reset").addEventListener("click",()=>renderer.resetCamera());
$("#humidity-input").addEventListener("input",e=>{state.habitat.humidity=Number(e.target.value);update();});
$("#temperature-input").addEventListener("input",e=>{state.habitat.temperatureC=Number(e.target.value);update();});
$("#add-food").addEventListener("click",()=>{addFood(state);saveMessage="Hojarasca añadida";update();});
$("#add-shelter").addEventListener("click",()=>{addShelter(state);saveMessage="Refugio disponible";update();});
$("#save").addEventListener("click",()=>{try{saveTerrarium(state);saveMessage="Terrario guardado en este navegador";}catch(e){saveMessage="No se pudo guardar: "+e.message;}update();});
$("#load").addEventListener("click",()=>{try{const loaded=loadTerrarium();if(!loaded){saveMessage="No hay un guardado todavía";update();return;}Object.assign(state,loaded);renderer.setShape(state.habitat.shape);renderer.setMode(state.presentation.mode);saveMessage="Guardado recuperado";}catch(e){saveMessage="Guardado rechazado: "+e.message;}update();});
function tick(now){const dt=Math.min((now-last)/1000,.25);last=now;if(state.running){acc+=dt*state.speed;let steps=0;while(acc>=1&&steps<20){stepSimulation(state,1);acc--;steps++;}update();}requestAnimationFrame(tick);}
window.addEventListener("beforeunload",()=>renderer.dispose(),{once:true});state.presentation.autoRotate=settings.autoRotate;$("#rotate").setAttribute("aria-pressed",String(settings.autoRotate));update();refreshMenu();requestAnimationFrame(tick);
