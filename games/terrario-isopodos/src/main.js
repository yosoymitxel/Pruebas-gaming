import "./style.css";
import{createTerrariumState,formatClock,snapshotDomain}from"./state.js";
import{stepSimulation,addFood,addShelter}from"./simulation.js";
import{saveTerrarium,loadTerrarium}from"./persistence.js";
import{TerrariumRenderer}from"./renderers.js";
const state=createTerrariumState(),renderer=new TerrariumRenderer(document.querySelector("#scene"),state),$=s=>document.querySelector(s);
let last=performance.now(),acc=0,saveMessage="";
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
$("#pause").addEventListener("click",()=>{state.running=!state.running;last=performance.now();acc=0;update();});
$("#step").addEventListener("click",()=>{stepSimulation(state,1);update();});
$("#speed").addEventListener("input",e=>{state.speed=Number(e.target.value);update();});
$("#rotate").addEventListener("click",e=>{state.presentation.autoRotate=!state.presentation.autoRotate;e.currentTarget.setAttribute("aria-pressed",String(state.presentation.autoRotate));});
$("#reset").addEventListener("click",()=>renderer.resetCamera());
$("#humidity-input").addEventListener("input",e=>{state.habitat.humidity=Number(e.target.value);update();});
$("#temperature-input").addEventListener("input",e=>{state.habitat.temperatureC=Number(e.target.value);update();});
$("#add-food").addEventListener("click",()=>{addFood(state);saveMessage="Hojarasca añadida";update();});
$("#add-shelter").addEventListener("click",()=>{addShelter(state);saveMessage="Refugio disponible";update();});
$("#save").addEventListener("click",()=>{try{saveTerrarium(state);saveMessage="Terrario guardado en este navegador";}catch(e){saveMessage="No se pudo guardar: "+e.message;}update();});
$("#load").addEventListener("click",()=>{try{const loaded=loadTerrarium();if(!loaded){saveMessage="No hay un guardado todavía";update();return;}Object.assign(state,loaded);renderer.setShape(state.habitat.shape);renderer.setMode(state.presentation.mode);saveMessage="Guardado recuperado";}catch(e){saveMessage="Guardado rechazado: "+e.message;}update();});
function tick(now){const dt=Math.min((now-last)/1000,.25);last=now;if(state.running){acc+=dt*state.speed;let steps=0;while(acc>=1&&steps<20){stepSimulation(state,1);acc--;steps++;}update();}requestAnimationFrame(tick);}
window.addEventListener("beforeunload",()=>renderer.dispose(),{once:true});update();requestAnimationFrame(tick);
