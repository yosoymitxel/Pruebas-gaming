import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const port=4173;
const requestedBasePath=process.env.TERRARIO_TEST_BASE_PATH||"/Pruebas-gaming/games/terrario-isopodos/";
const basePrefix=`/${requestedBasePath.split("/").filter(Boolean).join("/")}/`;
const url=`http://127.0.0.1:${port}${basePrefix}`;
const distRoot=resolve("dist");
const mimeTypes={".css":"text/css; charset=utf-8",".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/json; charset=utf-8",".svg":"image/svg+xml",".png":"image/png",".webp":"image/webp",".woff2":"font/woff2"};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,url).pathname);
  if(!pathname.startsWith(basePrefix)){res.writeHead(404);res.end("Not found");return;}
  const relative=pathname.slice(basePrefix.length);
  let filePath=resolve(distRoot,relative||"index.html");
  if(filePath!==distRoot&&!filePath.startsWith(`${distRoot}${sep}`)){res.writeHead(403);res.end("Forbidden");return;}
  let body;
  try{body=await readFile(filePath);}
  catch(error){
   if(relative&&extname(relative)){res.writeHead(404);res.end("Not found");return;}
   filePath=resolve(distRoot,"index.html");body=await readFile(filePath);
  }
  res.writeHead(200,{"content-type":mimeTypes[extname(filePath)]||"application/octet-stream","cache-control":"no-store"});
  res.end(body);
 }catch(error){res.writeHead(500);res.end("Static build test server: "+error.message);}
});
let browser;const errors=[];
try{
 await new Promise((resolveListen,reject)=>{server.once("error",reject);server.listen(port,"127.0.0.1",resolveListen);});
 const response=await fetch(url);
 if(!response.ok)throw new Error(`Build estático no disponible en ${url}: HTTP ${response.status}`);
 await mkdir("artifacts/visual",{recursive:true});
 browser=await chromium.launch({headless:true,args:["--use-gl=angle","--use-angle=swiftshader","--enable-webgl","--ignore-gpu-blocklist"]});
 const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
 page.on("pageerror",e=>errors.push(e.stack||e.message));
 page.on("console",m=>{if(m.type()==="error")errors.push(m.text());});
 page.on("requestfailed",r=>errors.push(`request failed: ${r.url()} ${r.failure()?.errorText??""}`));
 await page.addInitScript(()=>{if(!sessionStorage.getItem("terrario-test-corrupt-save-injected")){localStorage.setItem("terrario-isopodos.save.v1","{");sessionStorage.setItem("terrario-test-corrupt-save-injected","1");}});
 await page.goto(url,{waitUntil:"networkidle",timeout:30000});
 if(!await page.locator("#screen-menu").isVisible())throw new Error("No aparece el menú de inicio");
 if(!await page.locator("#continue-game").isDisabled())throw new Error("Un guardado corrupto no debe habilitar Continuar partida");
 const menuBg=await page.locator("#screen-menu").evaluate(el=>getComputedStyle(el).backgroundColor);
 if(!menuBg||menuBg==="rgba(0, 0, 0, 0)")throw new Error("El CSS del menú no está aplicado");
 const duplicateIds=await page.evaluate(()=>{const ids=[...document.querySelectorAll("[id]")].map(el=>el.id);return [...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];});
 if(duplicateIds.length)throw new Error("Hay IDs duplicados: "+duplicateIds.join(", "));
 await page.screenshot({path:"artifacts/visual/menu-1440x1000.png",fullPage:true});

 // Flujo real por tacto en un teléfono compacto: menú, opciones y creación de partida.
 const mobileMenuPage=await browser.newPage({viewport:{width:360,height:640},deviceScaleFactor:1,isMobile:true,hasTouch:true});
 const mobileMenuErrors=[];
 mobileMenuPage.on("pageerror",e=>mobileMenuErrors.push(e.stack||e.message));
 mobileMenuPage.on("console",m=>{if(m.type()==="error")mobileMenuErrors.push(m.text());});
 mobileMenuPage.on("requestfailed",r=>mobileMenuErrors.push(`request failed: ${r.url()} ${r.failure()?.errorText??""}`));
 await mobileMenuPage.goto(url,{waitUntil:"networkidle",timeout:30000});
 const mobileTap=async selector=>{
   const target=mobileMenuPage.locator(selector);
   const bounds=await target.boundingBox();
   if(!bounds)throw new Error(`El control móvil no está visible: ${selector}`);
   if(bounds.x<0||bounds.y<0||bounds.x+bounds.width>360||bounds.y+bounds.height>640)
     throw new Error(`El control móvil queda fuera del viewport 360x640: ${selector} ${JSON.stringify(bounds)}`);
   await mobileMenuPage.touchscreen.tap(bounds.x+bounds.width/2,bounds.y+bounds.height/2);
 };
 for(const selector of ["#new-game","#open-settings","#open-help","#menu-fullscreen"]){
   const bounds=await mobileMenuPage.locator(selector).boundingBox();
   if(!bounds||bounds.y<0||bounds.y+bounds.height>640)
     throw new Error(`La opción principal no cabe en 360x640: ${selector} ${JSON.stringify(bounds)}`);
 }
 await mobileMenuPage.screenshot({path:"artifacts/visual/mobile-menu-360x640.png",fullPage:true});
 await mobileTap("#open-settings");
 if(!await mobileMenuPage.locator("#settings-fullscreen").isVisible())throw new Error("Ajustes no ofrece pantalla completa");
 if(!await mobileMenuPage.locator("#screen-modal").isVisible()||await mobileMenuPage.locator("#modal-title").textContent()!=="Ajustes")
   throw new Error("Ajustes del menú principal no responde al tacto móvil");
 await mobileTap("#close-modal");
 if(await mobileMenuPage.locator("#screen-modal").isVisible())throw new Error("No se pudo cerrar Ajustes del menú móvil");
 await mobileTap("#open-help");
 if(!await mobileMenuPage.locator("#screen-modal").isVisible()||await mobileMenuPage.locator("#modal-title").textContent()!=="Cómo se juega")
   throw new Error("Ayuda del menú principal no responde al tacto móvil");
 await mobileTap("#close-modal");
 await mobileTap("#new-game");
 if(!await mobileMenuPage.locator("#screen-setup").isVisible())throw new Error("Nuevo terrario no abre configuración en móvil");
 const setupButtonBounds=await mobileMenuPage.locator("#start-game").boundingBox();
 if(!setupButtonBounds||setupButtonBounds.y<0||setupButtonBounds.y+setupButtonBounds.height>640)
   throw new Error(`El botón Entrar al terrario no queda accesible en 360x640: ${JSON.stringify(setupButtonBounds)}`);
 await mobileMenuPage.screenshot({path:"artifacts/visual/mobile-setup-360x640.png",fullPage:true});
 await mobileMenuPage.route(url=>url.href.includes("renderers-"),async route=>{await new Promise(resolve=>setTimeout(resolve,420));await route.continue();});
 await mobileTap("#start-game");
 await mobileMenuPage.locator("#screen-loading").waitFor({state:"visible",timeout:2500});
 const loadingTheme=await mobileMenuPage.locator("#screen-loading").getAttribute("data-theme");
 if(!new Set(["bark","moss","leaves","tunnel","molt","colony","night","fern","shelter","mist","tracks"]).has(loadingTheme))throw new Error("La pantalla de carga no seleccionó uno de los 11 motivos de isópodos: "+loadingTheme);
 await mobileMenuPage.screenshot({path:"artifacts/visual/mobile-loading-360x640.png",fullPage:true});
 await mobileMenuPage.locator("#screen-loading").waitFor({state:"hidden",timeout:15000});
 await mobileMenuPage.locator("#scene canvas").waitFor({state:"visible",timeout:15000});
 await mobileMenuPage.waitForFunction(()=>{
   const canvas=document.querySelector("#scene canvas");
   return !document.querySelector(".shell").hidden&&canvas&&canvas.width>1&&canvas.height>1&&canvas.dataset.renderMode==="diorama";
 },{timeout:15000});
 if(await mobileMenuPage.locator("#count").textContent()!=="05")throw new Error("Nueva partida móvil no crea la colonia inicial completa");
 if(mobileMenuErrors.length)throw new Error("Errores en el flujo táctil móvil: "+mobileMenuErrors.join(" | "));
 await mobileMenuPage.screenshot({path:"artifacts/visual/mobile-new-game-360x640.png",fullPage:true});
 await mobileMenuPage.close();

 await page.keyboard.press("Tab");
 if(await page.evaluate(()=>document.activeElement?.id)!=="new-game")throw new Error("El foco inicial del teclado no llega a Nuevo terrario");
 await page.getByRole("button",{name:/Nuevo terrario/}).click();
 if(!await page.locator("#screen-setup").isVisible())throw new Error("No se abrió la configuración inicial");
 await page.screenshot({path:"artifacts/visual/setup-1440x1000.png",fullPage:true});
 if(await page.locator('[data-setup-shape="rectangular"]').getAttribute("aria-pressed")!=="true")throw new Error("La forma inicial no expone la selección accesible");
 await page.locator('[data-setup-shape="cilindrico"]').click();
 await page.locator('[data-setup-mode="voxel"]').click();
 if(await page.locator('[data-setup-shape="cilindrico"]').getAttribute("aria-pressed")!=="true"||await page.locator('[data-setup-mode="voxel"]').getAttribute("aria-pressed")!=="true")throw new Error("Las opciones de configuración no actualizan aria-pressed");
 await page.getByRole("button",{name:/Entrar al terrario/}).click();
 await page.locator("#scene canvas").waitFor({state:"visible",timeout:10000});
 await page.waitForFunction(()=>{const c=document.querySelector("#scene canvas");return c&&c.width>1&&c.height>1;});
 const cameraCanvas=page.locator("#scene canvas");
 if(await page.getByRole("button",{name:"Abrir menú de pausa"}).count()!==1)throw new Error("La pausa debe conservar un nombre accesible aunque solo muestre el icono");
 if(await page.locator("#view-label").count()!==0)throw new Error("La cabecera aún repite el modo visual junto al selector de representación");
 const exploreButton=page.locator("#open-expedition");
 if(!await exploreButton.isVisible()||(await exploreButton.innerText()).trim()!=="Explorar")throw new Error("Explorar debe estar visible desde el terrario");
 const exploreBounds=await exploreButton.boundingBox();
 if(!exploreBounds||exploreBounds.height<44||exploreBounds.width<90)throw new Error("Explorar no tiene jerarquía táctil suficiente");
 if(await cameraCanvas.getAttribute("data-render-mode")!=="voxel")throw new Error("La selección Voxel inicial no se aplicó al renderizador real");
 if(await cameraCanvas.getAttribute("data-isopod-model")!=="voxel-isopod-mesh")throw new Error("No se aplicó el modelo voxel de la especie");
  if(await cameraCanvas.getAttribute("data-isopod-voxel-palette")!=="forest-floor-olive-v1")throw new Error("El caparazón voxel no usa la paleta naturalista del suelo del bosque");
 if(await cameraCanvas.getAttribute("data-isopod-shell-profile")!=="voxel-domed-shell"||await cameraCanvas.getAttribute("data-isopod-dorsal-plates")!=="7"||await cameraCanvas.getAttribute("data-isopod-walking-legs")!=="14"||await cameraCanvas.getAttribute("data-isopod-antennae")!=="2")throw new Error("El modelo voxel no tiene volumen, placas, patas y antenas");
 if(Number(await cameraCanvas.getAttribute("data-isopod-voxel-blocks"))<160)throw new Error("El isópodo voxel no construyó un cuerpo volumétrico suficiente");
 if(Number(await cameraCanvas.getAttribute("data-isopod-voxel-blocks"))>Number(await cameraCanvas.getAttribute("data-isopod-voxel-capacity")))throw new Error("El caparazón voxel superó su capacidad instanciada");
 if(Number(await cameraCanvas.getAttribute("data-isopod-voxel-capacity"))<700)throw new Error("La reserva de bloques Voxel no tiene margen suficiente");

  if(await cameraCanvas.getAttribute("data-container-shape")!=="cilindrico"||await cameraCanvas.getAttribute("data-container-wall-count")!=="1")throw new Error("El terrario cilíndrico no construyó sus paredes verticales");
 if(Number(await cameraCanvas.getAttribute("data-container-wall-height"))>0.9)throw new Error("El tarro cilíndrico sigue teniendo una pared excesivamente alta");
 if(await cameraCanvas.getAttribute("data-container-base-style")!=="slim-support"||Number(await cameraCanvas.getAttribute("data-container-base-thickness"))>.1)throw new Error("La base del recipiente debe ser fina y no parecer un pedestal");
 if(await cameraCanvas.getAttribute("data-container-rim-style")!=="full-circle-glass-rim"||await cameraCanvas.getAttribute("data-container-glass-treatment")!=="clearcoat-wall-reflections")throw new Error("El tarro debe mostrar el borde circular completo y reflejos de vidrio");
  if(Number(await cameraCanvas.getAttribute("data-container-glass-wall-opacity"))<.11||Number(await cameraCanvas.getAttribute("data-container-glass-reflection-opacity"))<.35)throw new Error("Las paredes del cilindro deben leerse como vidrio transparente con reflejos visibles");
 if(await cameraCanvas.getAttribute("data-container-rim-treatment")!=="pale-clear-glass-edge"||Number(await cameraCanvas.getAttribute("data-container-rim-thickness"))>.006)throw new Error("El borde superior debe ser fino y translúcido, no un aro opaco dominante");
 if(Number(await cameraCanvas.getAttribute("data-isopod-display-scale"))>.75)throw new Error("El isópodo debe conservar una escala natural respecto al microhábitat");
 if(Number(await cameraCanvas.getAttribute("data-camera-elevation"))<0.6)throw new Error("La cámara cilíndrica está demasiado baja");
 const terrainRelief=Number(await cameraCanvas.getAttribute("data-terrain-relief"));
 if(!(terrainRelief>=0.12))throw new Error(`El relieve del microbosque es insuficiente: ${terrainRelief}`);
 if(await cameraCanvas.getAttribute("data-art-version")!=="woodland-diorama-v12")throw new Error("No se montó el nuevo kit de ecosistema");
 if(await cameraCanvas.getAttribute("data-terrain-layer-count")!=="3")throw new Error("El sustrato no expone sus tres estratos");
 if(Number(await cameraCanvas.getAttribute("data-leaf-count"))<550)throw new Error("Falta hojarasca individual instanciada");
 if(Number(await cameraCanvas.getAttribute("data-fern-leaves"))<280)throw new Error("No se generaron frondas suficientes en el diorama");
 if(Number(await cameraCanvas.getAttribute("data-moss-count"))<20)throw new Error("El tapiz de musgo no está presente");
 if(Number(await cameraCanvas.getAttribute("data-moss-blades"))<1000)throw new Error("El musgo no tiene suficiente detalle de hojas");
 await page.waitForFunction(()=>Number(document.querySelector("#scene canvas")?.dataset.renderCalls)>0&&Number(document.querySelector("#scene canvas")?.dataset.renderTriangles)>0);
 if(Number(await cameraCanvas.getAttribute("data-render-calls"))>150)throw new Error("La escena excede el presupuesto orientativo de llamadas de dibujo móvil");
 if(Number(await cameraCanvas.getAttribute("data-render-triangles"))>300000)throw new Error("La escena excede el presupuesto orientativo de triángulos móvil");
 await page.screenshot({path:"artifacts/visual/gameplay-voxel-1440x1000.png",fullPage:true});
 await page.locator("#tool-camera").click();
  if(await cameraCanvas.getAttribute("data-active-tool")!=="camera"||await page.locator("#tool-camera").getAttribute("aria-pressed")!=="true")throw new Error("La herramienta Cámara no controla explícitamente la órbita");
  const initialAngle=Number(await cameraCanvas.getAttribute("data-camera-angle"));
  const initialDistance=Number(await cameraCanvas.getAttribute("data-camera-distance"));
 await cameraCanvas.evaluate(canvas=>{const fire=(type,pointerId,x,y)=>canvas.dispatchEvent(new PointerEvent(type,{pointerId,pointerType:"touch",isPrimary:pointerId===11,button:0,clientX:x,clientY:y,bubbles:true}));fire("pointerdown",11,100,100);fire("pointerdown",12,200,100);fire("pointermove",12,240,100);fire("pointerup",12,240,100);fire("pointerup",11,100,100);});
 const pinchDistance=Number(await cameraCanvas.getAttribute("data-camera-distance"));
 if(!(pinchDistance<initialDistance))throw new Error(`El gesto de pellizco no acerca la cámara: inicial=${initialDistance}, final=${pinchDistance}`);
  await cameraCanvas.evaluate(canvas=>{const r=canvas.getBoundingClientRect(),fire=(type,pointerId,x,y)=>canvas.dispatchEvent(new PointerEvent(type,{pointerId,pointerType:"touch",isPrimary:true,button:0,clientX:x,clientY:y,bubbles:true}));fire("pointerdown",21,r.left+100,r.top+110);fire("pointermove",21,r.left+145,r.top+130);fire("pointerup",21,r.left+145,r.top+130);});
  const rotatedAngle=Number(await cameraCanvas.getAttribute("data-camera-angle"));
  if(Math.abs(rotatedAngle-initialAngle)<.08)throw new Error("Arrastrar con Cámara activa no orbita el terrario");
  await page.locator("#tool-hand").click();
  const handAngleBefore=Number(await cameraCanvas.getAttribute("data-camera-angle"));
  await cameraCanvas.evaluate(canvas=>{const r=canvas.getBoundingClientRect(),fire=(type,pointerId,x,y)=>canvas.dispatchEvent(new PointerEvent(type,{pointerId,pointerType:"touch",isPrimary:true,button:0,clientX:x,clientY:y,bubbles:true}));fire("pointerdown",22,r.left+2,r.top+2);fire("pointermove",22,r.left+80,r.top+35);fire("pointerup",22,r.left+80,r.top+35);});
  const handAngleAfter=Number(await cameraCanvas.getAttribute("data-camera-angle"));
  if(Math.abs(handAngleAfter-handAngleBefore)>.04)throw new Error("Mano no debe mover la cámara al arrastrar el fondo");
 await page.locator("#camera-toggle").click();
 if(await page.locator("#camera-toggle").getAttribute("aria-expanded")!=="true"||await page.locator("#camera-tools").isHidden())throw new Error("El rail de cámara no se despliega");
 await page.locator("#zoom-in").click();
 await page.locator("#zoom-out").click();
 await page.locator("#camera-toggle").click();
 if(await page.locator("#camera-toggle").getAttribute("aria-expanded")!=="false")throw new Error("El rail de cámara no se repliega");

 await page.waitForFunction(()=>{const c=document.querySelector("#scene canvas");return c&&c.width>1&&c.height>1;});
 await page.getByRole("button",{name:"Lluvia",exact:true}).click();
 if(await cameraCanvas.getAttribute("data-weather")!=="rain"||Number(await cameraCanvas.getAttribute("data-weather-objects"))!==1)throw new Error("La lluvia procedural no aparece en el terrario");
 await page.getByRole("button",{name:"Bruma",exact:true}).click();
 if(await cameraCanvas.getAttribute("data-weather")!=="mist"||Number(await cameraCanvas.getAttribute("data-weather-objects"))!==7)throw new Error("La bruma no crea sus capas animadas");
 await page.getByRole("button",{name:"Claro",exact:true}).click();
 if(await cameraCanvas.getAttribute("data-weather")!=="clear")throw new Error("No se puede retirar el clima");
 await page.locator('.weather-control button[data-weather="rain"]').click();
 await page.locator("#open-game-menu").click();
 await page.waitForFunction(()=>document.querySelector("#scene canvas")?.dataset.weatherMotion==="static");
 await page.screenshot({path:"artifacts/visual/pause-floating-1440x1000.png",fullPage:true});
 if(!await page.locator("#screen-modal").evaluate(el=>el.classList.contains("is-pause")))throw new Error("La pausa no usa el menú flotante compacto");
 if(!await page.locator("#pause-fullscreen").isVisible())throw new Error("La pausa no ofrece pantalla completa");
 const pauseBounds=await page.locator("#screen-modal .modal-card").boundingBox();
 if(!pauseBounds||pauseBounds.width>320)throw new Error("El menú de pausa ocupa demasiado espacio");
 await page.locator("#pause-settings").click();
 if(await page.locator("#modal-title").textContent()!=="Ajustes")throw new Error("Los ajustes desde pausa no abren");
 await page.locator("#save-settings").click();
 if(await page.locator("#modal-title").textContent()!=="Pausa")throw new Error("Al guardar ajustes no se regresa al menú de pausa");
 await page.locator("#pause-help").click();
 if(await page.locator("#modal-title").textContent()!=="Cómo se juega")throw new Error("La ayuda desde pausa no abre");
 await page.keyboard.press("Escape");
 if(await page.locator("#modal-title").textContent()!=="Pausa")throw new Error("Escape no regresa de Ayuda al menú de pausa");
 await page.keyboard.press("Escape");
 if(await page.locator("#screen-modal").isVisible())throw new Error("Escape no cierra el menú de pausa");
 await page.waitForFunction(()=>document.activeElement?.id==="open-game-menu");
 await page.emulateMedia({reducedMotion:"reduce"}); // elimina transiciones del UI para capturas de estado deterministas
 await page.getByRole("button",{name:/Diorama/}).click();
 if(await page.locator("#view-label").count()!==0||await cameraCanvas.getAttribute("data-render-mode")!=="diorama")throw new Error("No cambió realmente a Diorama");
 if(await page.locator('[data-mode="diorama"]').getAttribute("aria-pressed")!=="true"||await page.locator('[data-mode="voxel"]').getAttribute("aria-pressed")!=="false")throw new Error("La selección accesible no coincide con el modo Diorama visible");
 const dioramaVisual=await page.locator('[data-mode="diorama"]').evaluate(el=>({active:el.classList.contains("active"),background:getComputedStyle(el).backgroundColor}));
 const voxelVisual=await page.locator('[data-mode="voxel"]').evaluate(el=>({active:el.classList.contains("active"),background:getComputedStyle(el).backgroundColor}));
 if(!dioramaVisual.active||voxelVisual.active||dioramaVisual.background!=="rgb(220, 229, 204)"||dioramaVisual.background===voxelVisual.background)throw new Error("Resaltado Diorama incorrecto: "+JSON.stringify({dioramaVisual,voxelVisual,ariaDiorama:await page.locator('[data-mode="diorama"]').getAttribute("aria-pressed"),ariaVoxel:await page.locator('[data-mode="voxel"]').getAttribute("aria-pressed")}));
 if(await cameraCanvas.getAttribute("data-isopod-model")!=="continuous-carapace-seven-tergites-fourteen-pereopods")throw new Error("El modelo Diorama no presenta placas y patas articuladas");
 if(await cameraCanvas.getAttribute("data-isopod-dorsal-plates")!=="7"||await cameraCanvas.getAttribute("data-isopod-walking-legs")!=="14"||await cameraCanvas.getAttribute("data-isopod-antennae")!=="2")throw new Error("El isópodo Diorama no completa su anatomía base");
 if(await cameraCanvas.getAttribute("data-isopod-shell-profile")!=="continuous-domed-carapace")throw new Error("El isópodo no usa el caparazón continuo con siete suturas");

 if(Number(await cameraCanvas.getAttribute("data-render-triangles"))<=0)throw new Error("Diorama quedó sin geometría tras cambiar de modo");
 await page.screenshot({path:"artifacts/visual/gameplay-diorama-1440x1000.png",fullPage:true});
 await page.getByRole("button",{name:/Voxel/}).click();
 if(await page.locator("#view-label").count()!==0||await cameraCanvas.getAttribute("data-render-mode")!=="voxel")throw new Error("No volvió realmente a Voxel");
 if(await page.locator('[data-mode="voxel"]').getAttribute("aria-pressed")!=="true"||await page.locator('[data-mode="diorama"]').getAttribute("aria-pressed")!=="false")throw new Error("La selección accesible no coincide con el modo Voxel visible");
 const voxelVisualAfter=await page.locator('[data-mode="voxel"]').evaluate(el=>({active:el.classList.contains("active"),background:getComputedStyle(el).backgroundColor}));
 const dioramaVisualAfter=await page.locator('[data-mode="diorama"]').evaluate(el=>({active:el.classList.contains("active"),background:getComputedStyle(el).backgroundColor}));
 if(!voxelVisualAfter.active||dioramaVisualAfter.active||voxelVisualAfter.background!=="rgb(220, 229, 204)"||voxelVisualAfter.background===dioramaVisualAfter.background)throw new Error("Resaltado Voxel incorrecto: "+JSON.stringify({voxelVisualAfter,dioramaVisualAfter,ariaVoxel:await page.locator('[data-mode="voxel"]').getAttribute("aria-pressed"),ariaDiorama:await page.locator('[data-mode="diorama"]').getAttribute("aria-pressed")}));
 if(Number(await cameraCanvas.getAttribute("data-render-triangles"))<=0)throw new Error("Voxel quedó sin el terrario 3D después del cambio de modo");
 await page.getByRole("button",{name:/Pausar/}).click();
 await page.locator("#pause-settings").click();
 if(await page.locator("#modal-title").textContent()!=="Ajustes")throw new Error("No se abre Ajustes desde pausa");
 await page.locator("#save-settings").click();
 if(await page.locator("#modal-title").textContent()!=="Pausa")throw new Error("Al guardar ajustes no se regresa al menú de pausa");
 await page.locator("#pause-help").click();
 if(await page.locator("#modal-title").textContent()!=="Cómo se juega")throw new Error("No se abre Ayuda desde pausa");
 await page.keyboard.press("Escape");
 if(await page.locator("#modal-title").textContent()!=="Pausa")throw new Error("Escape no regresa de Ayuda al menú de pausa");
 const clockBeforeStep=await page.locator("#clock").textContent();
 const beforeMatch=clockBeforeStep.match(/(\d{2}):(\d{2})$/);
 if(!beforeMatch)throw new Error(`No se pudo leer el reloj antes del avance: ${clockBeforeStep}`);
 const minutesBeforeStep=Number(beforeMatch[1])*60+Number(beforeMatch[2]);
 await page.getByRole("button",{name:/Avanzar 1 minuto/}).click();
 const clockAfterStep=await page.locator("#clock").textContent();
 const afterMatch=clockAfterStep.match(/(\d{2}):(\d{2})$/);
 const minutesAfterStep=afterMatch?Number(afterMatch[1])*60+Number(afterMatch[2]):-1;
 if(minutesAfterStep!==minutesBeforeStep+1)throw new Error(`El avance manual debe sumar exactamente un minuto: antes=${clockBeforeStep}, después=${clockAfterStep}`);
 await page.getByRole("button",{name:/Volver al terrario/}).click();
 if(await page.locator("#count").textContent()!=="05")throw new Error("La colonia inicial no contiene cinco individuos");
 if(!((await page.locator("#tool-food").innerText()).includes("Coste: 4 bellotas"))||!((await page.locator("#tool-shelter").innerText()).includes("Coste: 12 bellotas")))throw new Error("Las herramientas deben identificar los números como precios, no como stock");
 if(await page.locator("#tool-food [data-placed-count]").textContent()!=="1"||await page.locator("#tool-shelter [data-placed-count]").textContent()!=="1")throw new Error("La barra no refleja los recursos iniciales realmente colocados");
 if(await page.locator("#shop-grid [data-placed-count=\"fern\"]").textContent()!=="0")throw new Error("El contador visual debe iniciar con cero helechos colocados");
 await page.locator('[data-buy="mushroom"]').click();
 if(await page.locator("#coins").textContent()!=="23")throw new Error("La tienda no descontó el coste de las setas");
 if(!(await page.locator("#shop-note").textContent()).includes("Setas de bosque"))throw new Error("La tienda no confirmó el artículo comprado");
 if(await page.locator("#shop-grid [data-placed-count=\"mushroom\"]").textContent()!=="1")throw new Error("El contador de setas colocadas no se actualizó tras la compra");
 await page.waitForFunction(()=>{
  const canvas=document.querySelector("#scene canvas");
  return canvas?.dataset.resourceArt==="shared-diorama-kit"&&Number(canvas.dataset.resourceCount)>=3;
 });
 if(Number(await cameraCanvas.getAttribute("data-resource-count"))<3)throw new Error("La tienda no montó los objetos en el motor compartido");
 await page.locator("#tool-food").click();
 if(await cameraCanvas.getAttribute("data-active-tool")!=="leaf-litter")throw new Error("No se activa la herramienta de hojarasca");
 const toolBounds=await cameraCanvas.boundingBox();
 await cameraCanvas.click({position:{x:Math.floor(toolBounds.width*.56),y:Math.floor(toolBounds.height*.68)}});
 if(await page.locator("#coins").textContent()!=="19")throw new Error("La colocación de hojarasca no cobra cuatro bellotas");
 if(!(await page.locator("#shop-note").textContent()).includes("Hojarasca"))throw new Error("La colocación de hojarasca no informa el resultado");
 await page.locator("#tool-shelter").click();
 if(await cameraCanvas.getAttribute("data-active-tool")!=="shelter")throw new Error("No se activa la herramienta de refugio");
 await cameraCanvas.click({position:{x:Math.floor(toolBounds.width*.67),y:Math.floor(toolBounds.height*.66)}});
 if(await page.locator("#coins").textContent()!=="7")throw new Error("La colocación de refugio no cobra doce bellotas");
 await page.waitForFunction(()=>document.querySelector("#scene canvas")?.dataset.shelterCount==="2");
  if(await page.locator("#tool-shelter [data-placed-count]").textContent()!=="2")throw new Error("El contador de refugios no se actualizó tras colocarlo");
 await page.locator("#tool-hand").click();
 if(await cameraCanvas.getAttribute("data-active-tool")!=="hand")throw new Error("No se puede recuperar la herramienta Mano");
 // Mano: comprobar arrastre real de recursos e isópodos sobre el canvas 3D.
 const interactionCanvas=await cameraCanvas.boundingBox();
 const dragAcrossCanvas=async(accept)=>{
  let result=null;
  for(let y=.22;y<=.78&&!result;y+=.055){
   for(let x=.22;x<=.78&&!result;x+=.055){
    const before=await page.locator("#resource-note").textContent();
    const px=interactionCanvas.x+interactionCanvas.width*x,py=interactionCanvas.y+interactionCanvas.height*y;
    await page.mouse.move(px,py);await page.mouse.down();await page.mouse.move(px+32,py+18,{steps:2});await page.mouse.up();
    const after=await page.locator("#resource-note").textContent();
    if(after!==before&&accept(after))result=after;
   }
  }
  return result;
 };
 const draggedIsopodNote=await dragAcrossCanvas(note=>note.includes("Isópodo ")&&note.includes("reubicado"));
 if(!draggedIsopodNote)throw new Error("La herramienta Mano no pudo arrastrar un isópodo en el renderer real");
 const draggedId=draggedIsopodNote.match(/Isópodo (isopod-[0-9]+)/)?.[1];
 const savedAfterEntityDrag=await page.evaluate(()=>JSON.parse(localStorage.getItem("terrario-isopodos.save.v1")).state);
 if(!draggedId||!savedAfterEntityDrag.entities.some(entity=>entity.id===draggedId&&Number.isFinite(entity.x)&&Number.isFinite(entity.z)))throw new Error("El arrastre del isópodo no se persistió");
 const draggedResourceNote=await dragAcrossCanvas(note=>/^(Hojarasca|Refugio|Tronco|Musgo|Helecho|Piedra|Setas) reubicado$/.test(note));
 if(!draggedResourceNote)throw new Error("La herramienta Mano no pudo arrastrar hojarasca/refugio en el renderer real");
 const savedAfterResourceDrag=await page.evaluate(()=>JSON.parse(localStorage.getItem("terrario-isopodos.save.v1")).state);
 if(!savedAfterResourceDrag.resources.some(resource=>Number.isFinite(resource.x)&&Number.isFinite(resource.z)))throw new Error("El arrastre del recurso no se persistió");


 for(let step=0;step<19;step++)await page.getByRole("button",{name:"Reducir humedad"}).click();
 if(await page.locator("#humidity").textContent()!=="40")throw new Error("No se pudo cambiar la humedad");
 await page.getByRole("button",{name:/Pausar/}).click();
 let savedClock=await page.locator("#clock").textContent();
 await page.locator("#pause-save").click();
 await page.getByRole("button",{name:/Volver al terrario/}).click();
 await page.locator("#open-game-menu").click();
 savedClock=await page.locator("#clock").textContent();
 await page.getByRole("button",{name:/Salir al menú/}).click();
 await page.reload({waitUntil:"networkidle"});
 const menuClockBeforeContinue=await page.locator("#clock").textContent();
 await page.getByRole("button",{name:/Continuar partida/}).click();
 await page.locator("#scene canvas").waitFor({state:"visible",timeout:15000});
 await page.waitForFunction(previous=>document.querySelector("#clock")?.textContent!==previous,menuClockBeforeContinue,{timeout:15000});
 const restoredClock=await page.locator("#clock").textContent();const savedMatch=savedClock.match(/(\d{2}):(\d{2})$/),restoredMatch=restoredClock.match(/(\d{2}):(\d{2})$/);const savedMinutes=savedMatch?Number(savedMatch[1])*60+Number(savedMatch[2]):-1,restoredMinutes=restoredMatch?Number(restoredMatch[1])*60+Number(restoredMatch[2]):-1;if(restoredMinutes<savedMinutes||restoredMinutes>savedMinutes+1)throw new Error(`El reloj restaurado está fuera de tolerancia: guardado=${savedClock}, restaurado=${restoredClock}`);
 if(await page.locator("#humidity").textContent()!=="40")throw new Error("El guardado no restauró la humedad tras recarga");
 if(await page.locator("#count").textContent()!=="05")throw new Error("La colonia cambió al restaurar");
 if(await page.locator("#coins").textContent()!=="7")throw new Error("El saldo no conservó las compras y las colocaciones al guardar/cargar");
 const savedResources=await page.evaluate(()=>JSON.parse(localStorage.getItem("terrario-isopodos.save.v1")).state.resources);
 if(!savedResources.some(r=>r.type==="mushroom")||!savedResources.some(r=>r.type==="shelter"&&r.id!=="shelter-1")||!savedResources.some(r=>r.type==="leaf-litter"))throw new Error("Los objetos colocados/comprados no sobrevivieron a guardar/cargar");
 if(await page.locator("#scene canvas").getAttribute("data-weather")!=="rain")throw new Error("El guardado no restauró el clima lluvioso");
 if(await page.locator('.weather-control button[data-weather="rain"]').getAttribute("aria-pressed")!=="true")throw new Error("El selector no refleja el clima restaurado");

 if(await page.locator("#view-label").count()!==0||await page.locator("#scene canvas").getAttribute("data-render-mode")!=="voxel")throw new Error("Guardar/cargar no restauró el modo visual real elegido");
 await page.screenshot({path:"artifacts/visual/desktop-1440x1000.png",fullPage:true});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(400);
 const cylinderDistance=Number(await page.locator("#scene canvas").getAttribute("data-camera-distance"));
 const cylinderFit=Number(await page.locator("#scene canvas").getAttribute("data-camera-fit-distance"));
 if(!Number.isFinite(cylinderDistance)||!Number.isFinite(cylinderFit)||cylinderDistance+.02<cylinderFit)throw new Error(`La cámara no encuadra el recipiente cilíndrico en móvil: distancia=${cylinderDistance}, mínimo=${cylinderFit}`);
 const cylinderFogNear=Number(await page.locator("#scene canvas").getAttribute("data-fog-near"));
 const cylinderFogFar=Number(await page.locator("#scene canvas").getAttribute("data-fog-far"));
 if(!(cylinderFogNear>cylinderDistance&&cylinderFogFar>cylinderFit*2))throw new Error("La niebla oculta el recipiente cilíndrico al alejar la cámara en móvil");
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth+1);
 if(overflow)throw new Error("Hay overflow horizontal en viewport móvil");
 if(!await page.locator("#panel-toggle").isVisible())throw new Error("No aparece la bandeja de controles en móvil");
 if(await page.locator("#panel-toggle").getAttribute("aria-expanded")!=="false")throw new Error("La bandeja móvil debe iniciar plegada");
 await page.screenshot({path:"artifacts/visual/mobile-390x844.png",fullPage:true});
 await page.locator("#panel-toggle").click();
 if(await page.locator("#panel-toggle").getAttribute("aria-expanded")!=="true"||!await page.locator("#controls-panel").evaluate(el=>el.classList.contains("is-expanded")))throw new Error("No se expande la bandeja de controles en móvil");
 const panelBox=await page.locator("#controls-panel").boundingBox();
 if(!panelBox||panelBox.height<260)throw new Error("La bandeja expandida no ofrece área suficiente para controles");
 await page.screenshot({path:"artifacts/visual/mobile-controls-390x844.png",fullPage:true});
 await page.locator('[data-buy="mushroom"]').scrollIntoViewIfNeeded();
 if(!await page.locator('[data-buy="mushroom"]').isVisible())throw new Error("La tienda no es accesible desde la bandeja expandida");
 await page.locator("#save").scrollIntoViewIfNeeded();
 if(!await page.locator("#save").isVisible())throw new Error("Guardar terrario no es accesible al final de los controles móviles");
 await page.locator("#panel-toggle").click();
 if(await page.locator("#panel-toggle").getAttribute("aria-expanded")!=="false")throw new Error("La bandeja móvil no se pliega");

 // Segunda escena: comprobar las cuatro paredes del recipiente rectangular en el render real.
 await page.locator("#open-game-menu").click();
 await page.getByRole("button",{name:/Salir al menú/}).click();
 await page.getByRole("button",{name:/Nuevo terrario/}).click();
 await page.locator('[data-setup-shape="rectangular"]').click();
 await page.locator('[data-setup-mode="diorama"]').click();
 await page.getByRole("button",{name:/Entrar al terrario/}).click();
 await page.waitForFunction(()=>{const c=document.querySelector("#scene canvas");return c&&c.width>1&&c.height>1;});
 await page.waitForTimeout(500); // deja completar el primer render tras reconstruir el hábitat
 if(await page.locator("#scene canvas").getAttribute("data-container-shape")!=="rectangular"||await page.locator("#scene canvas").getAttribute("data-container-wall-count")!=="4")throw new Error("El terrario rectangular no construyó sus cuatro paredes verticales");
 const rectangleDistance=Number(await page.locator("#scene canvas").getAttribute("data-camera-distance"));
 const rectangleFit=Number(await page.locator("#scene canvas").getAttribute("data-camera-fit-distance"));
 if(!Number.isFinite(rectangleDistance)||!Number.isFinite(rectangleFit)||rectangleDistance+.02<rectangleFit)throw new Error(`La cámara no encuadra el recipiente rectangular en móvil: distancia=${rectangleDistance}, mínimo=${rectangleFit}`);
 const rectangleFogNear=Number(await page.locator("#scene canvas").getAttribute("data-fog-near"));
 const rectangleFogFar=Number(await page.locator("#scene canvas").getAttribute("data-fog-far"));
 if(!(rectangleFogNear>rectangleDistance&&rectangleFogFar>rectangleFit*2))throw new Error("La niebla oculta el recipiente rectangular al alejar la cámara en móvil");
 await page.screenshot({path:"artifacts/visual/rectangular-walls-390x844.png",fullPage:true});
 await page.locator("#open-game-menu").click();
 await page.getByRole("button",{name:/Salir al menú/}).click();
 await page.getByRole("button",{name:/Nuevo terrario/}).click();
 await page.locator('[data-setup-shape="esferico"]').click();
 await page.getByRole("button",{name:/Entrar al terrario/}).click();
 await page.waitForFunction(()=>{const c=document.querySelector("#scene canvas");return c&&c.width>1&&c.height>1;});
 await page.waitForTimeout(450);
 if(Number(await page.locator("#scene canvas").getAttribute("data-render-calls"))>150)throw new Error("Diorama esférico excede 150 draw calls en móvil");
 const orb=page.locator("#scene canvas");
 if(await orb.getAttribute("data-container-shape")!=="esferico"||await orb.getAttribute("data-container-kind")!=="spherical-globe")throw new Error("No se creó el globo esférico real");
 if(await orb.getAttribute("data-container-globe-cut")!=="flat-base")throw new Error("El globo no tiene una base de vidrio truncada al nivel del suelo");
 if(Math.abs(Number(await orb.getAttribute("data-container-globe-floor-radius"))-1.18)>.01)throw new Error("El suelo esférico sobresale del radio de su base");
 if(Number(await orb.getAttribute("data-container-globe-top"))>2.1)throw new Error("El globo conserva demasiado volumen vacío sobre el terrario");
 const orbDistance=Number(await orb.getAttribute("data-camera-distance")),orbFit=Number(await orb.getAttribute("data-camera-fit-distance"));
 if(!Number.isFinite(orbDistance)||!Number.isFinite(orbFit)||orbDistance+.02<orbFit)throw new Error("La cámara no encuadra el globo en móvil");
 await page.screenshot({path:"artifacts/visual/spherical-orb-390x844.png",fullPage:true});


 // Expedition: the same WebGL canvas moves between the terrarium, the garden map and a node diorama.
 await page.evaluate(()=>{window.__terrariumCanvasBeforeExpedition=document.querySelector("#scene canvas");});
 await page.locator("#open-expedition").click();
 await page.locator("#screen-expedition").waitFor({state:"visible"});
 const expeditionCanvas=page.locator("#expedition-diorama canvas");
 await expeditionCanvas.waitFor({state:"visible",timeout:15000});
 if(!await page.evaluate(()=>window.__terrariumCanvasBeforeExpedition===document.querySelector("#expedition-diorama canvas")))throw new Error("La expedición creó otro canvas en vez de reutilizar el del terrario");
 if(await expeditionCanvas.getAttribute("data-expedition-view")!=="map")throw new Error("Explorar no abrió el diorama del mapa");
 if(Number(await expeditionCanvas.getAttribute("data-expedition-interaction-targets"))!==8)throw new Error("El mapa 3D no tiene ocho lugares seleccionables");
 if(Number(await expeditionCanvas.getAttribute("data-expedition-landmark-count"))!==8)throw new Error("El renderer no creó ocho landmarks físicos");
 if(Number(await expeditionCanvas.getAttribute("data-expedition-locked-node-count"))!==3)throw new Error("El renderer no conserva las tres rutas bloqueadas");
 if(Number(await expeditionCanvas.getAttribute("data-expedition-unlocked-node-count"))!==5)throw new Error("El mapa inicial debe mostrar cinco destinos accesibles");
 const lockedNodes=page.locator(".expedition-node.is-locked");
 if(await lockedNodes.count()!==3)throw new Error("La interfaz no identifica visualmente los tres destinos bloqueados");
 for(const id of ["compost-bin","mite-nest","web-zone"]){
  const node=page.locator('[data-node-id="'+id+'"]');
  if(!await node.evaluate(element=>element.classList.contains("is-locked")))throw new Error("El nodo "+id+" no muestra el estado bloqueado");
  if(!(await node.getAttribute("aria-label")).includes("Bloqueado"))throw new Error("El nodo "+id+" no anuncia que está bloqueado");
 }
 if(await expeditionCanvas.getAttribute("data-expedition-surface")!=="organic-soil-cutaway")throw new Error("El mapa no usa la superficie orgánica del kit");
 if(Number(await expeditionCanvas.getAttribute("data-expedition-trail-count"))<5)throw new Error("El mapa no montó sus senderos físicos");
 if(Number(await expeditionCanvas.getAttribute("data-expedition-fov"))!==54)throw new Error("La cámara del mapa no usa su encuadre específico");
 await page.screenshot({path:"artifacts/visual/expedition-map-390x844.png",fullPage:true});
 if(!await page.locator("#expedition-readiness").isVisible())throw new Error("Falta la explicación de disponibilidad antes de iniciar");
 if(await page.locator("#expedition-start").isDisabled())throw new Error("El CTA de recuperación debe permanecer disponible");
 if(await page.locator("#expedition-start").textContent()!=="Comenzar en Jardín húmedo")throw new Error("El CTA no identifica el punto real de inicio");
 const previewNode=page.locator('[data-node-id="rotten-fruit"]');
 await previewNode.click();
 if(await previewNode.getAttribute("aria-pressed")!=="true"||await previewNode.getAttribute("aria-current"))throw new Error("Una vista previa aparece falsamente como posición actual");
 if(!(await page.locator("#expedition-location-copy").textContent()).includes("siempre comienza en Jardín húmedo"))throw new Error("La vista previa no explica el punto real de inicio");
 const mapPanel=await page.locator("#expedition-map-layer").boundingBox();
 const mapScene=await page.locator("#expedition-diorama").boundingBox();
 if(!mapPanel||!mapScene||mapScene.y+mapScene.height>mapPanel.y+2)throw new Error("El panel de mapa tapa el área 3D reservada");
 await page.evaluate(()=>{
  const original=Storage.prototype.setItem;
  window.__expeditionOriginalSetItem=original;
  Storage.prototype.setItem=function(key,value){if(key==="terrario-isopodos.save.v1")throw new Error("fallo de cuota de prueba");return original.call(this,key,value);};
 });
 await page.locator("#expedition-start").click();
 if(await page.locator("#expedition-event-title").isVisible())throw new Error("La expedición avanzó aunque el guardado falló");
 if(!(await page.locator("#expedition-session-message").textContent()).includes("La acción se deshizo"))throw new Error("El fallo de guardado no revirtió y explicó la acción");
 const rolledBackRun=await page.evaluate(()=>JSON.parse(localStorage.getItem("terrario-isopodos.save.v1")).state.expeditionProgress.active);
 if(rolledBackRun)throw new Error("El fallo de guardado dejó una expedición activa");
 await page.evaluate(()=>{Storage.prototype.setItem=window.__expeditionOriginalSetItem;delete window.__expeditionOriginalSetItem;});
 await page.locator("#expedition-start").click();
 const startedRun=await page.evaluate(()=>JSON.parse(localStorage.getItem("terrario-isopodos.save.v1")).state.expeditionProgress.active);
 if(startedRun?.currentNodeId!=="garden-entry")throw new Error("La expedición comenzó en la zona de vista previa y no en Jardín húmedo");
 if(!await page.locator("#expedition-event-title").isVisible())throw new Error("No se generó el encuentro inicial");
 if(await expeditionCanvas.getAttribute("data-expedition-view")!=="level"||Number(await expeditionCanvas.getAttribute("data-expedition-interaction-targets"))!==2)throw new Error("El encuentro no abrió su diorama con dos interacciones");
 if(await expeditionCanvas.getAttribute("data-expedition-surface")!=="organic-soil-cutaway")throw new Error("El encuentro no usa el motor de suelo compartido");
 if(Number(await expeditionCanvas.getAttribute("data-expedition-actor-scale"))<.9)throw new Error("El isópodo explorador no tiene escala legible en el encuentro");
 if(!await page.locator("#expedition-run-actions").isVisible())throw new Error("Guardar/retirarse no está disponible dentro del nivel");
 const eventHeader=await page.locator(".expedition-header").boundingBox();
 const mapBackBox=await page.locator("#expedition-map-back").boundingBox();
 const vitalsBox=await page.locator("#expedition-vitals").boundingBox();
 const headerTitleBox=await page.locator(".expedition-heading").boundingBox();
 const decisionPanel=await page.locator("#expedition-decision-panel").boundingBox();
 const eventCard=await page.locator("#expedition-event").boundingBox();
 const choicePanel=await page.locator("#expedition-choice-dock").boundingBox();
 const levelScene=await page.locator("#expedition-diorama").boundingBox();
 const viewportHeight=await page.evaluate(()=>window.innerHeight);
 const overlaps=(a,b)=>Boolean(a&&b&&Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>1&&Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>1);
 if(!eventHeader||!mapBackBox||!vitalsBox||!headerTitleBox||!decisionPanel||!eventCard||!choicePanel||!levelScene)throw new Error("La composición del encuentro no expone todas sus regiones");
 if(!await page.locator("#expedition-map-back").evaluate(el=>el.parentElement?.classList.contains("expedition-header")))throw new Error("Volver al mapa debe estar integrado en la cabecera");
 if(!await page.locator("#expedition-vitals").evaluate(el=>el.parentElement?.classList.contains("expedition-header")))throw new Error("Las métricas deben compartir la cabecera compacta");
 if(overlaps(mapBackBox,headerTitleBox)||overlaps(headerTitleBox,vitalsBox)||overlaps(mapBackBox,vitalsBox))throw new Error("La cabecera del encuentro tiene controles solapados");
 if(overlaps(eventCard,choicePanel))throw new Error("La descripción del encuentro se solapa con las opciones");
 if(levelScene.y+levelScene.height>decisionPanel.y+2)throw new Error("El panel de decisión invade el espacio reservado al diorama 3D");
 if(decisionPanel.y+decisionPanel.height>viewportHeight+1)throw new Error("El panel de decisión queda fuera del viewport móvil");
 if((await page.locator("#expedition-event-location").textContent())!=="ENCUENTRO")throw new Error("El evento repite el nombre de la zona que ya aparece en la cabecera");
 if((await page.locator("#expedition-session-message").textContent()).trim())throw new Error("Un mensaje de inicio redundante aparece encima del encuentro");

 const firstChoiceBox=await page.locator(".expedition-choice:not(:disabled)").first().boundingBox();
 const firstChoiceHit=await page.evaluate(({x,y})=>document.elementFromPoint(x,y)?.closest("[data-choice-id]")?.dataset.choiceId??null,{x:firstChoiceBox.x+firstChoiceBox.width/2,y:firstChoiceBox.y+firstChoiceBox.height/2});
 if(!firstChoiceHit)throw new Error("El HUD tapa la zona de decisión del encuentro");
 await page.screenshot({path:"artifacts/visual/expedition-level-garden-390x844.png",fullPage:true});
 const chooseFirstExpeditionAction=async()=>{
  const first=page.locator(".expedition-choice:not(:disabled)").first();
  if(await first.count()===0)throw new Error("El encuentro no ofrece una acción accesible");
  await first.click();
  await page.locator("#expedition-map-layer").waitFor({state:"visible"});
 };
 await chooseFirstExpeditionAction();

 const clickDioramaNode=async nodeId=>{
  await page.waitForFunction(id=>{
   const canvas=document.querySelector("#expedition-diorama canvas");
   try{return Boolean(JSON.parse(canvas?.dataset.expeditionTargetScreens||"{}")[id]);}
   catch{return false;}
  },nodeId,{timeout:5000});
  const point=await expeditionCanvas.evaluate((canvas,id)=>{
   const targets=JSON.parse(canvas.dataset.expeditionTargetScreens||"{}");
   const target=targets[id];
   return target?{x:target.x,y:target.y,inside:target.visible}:null;
  },nodeId);
  if(!point?.inside)throw new Error("El hotspot 3D "+nodeId+" quedó fuera del encuadre del mapa: "+JSON.stringify(point));
  await page.mouse.click(point.x,point.y);
 };
 await clickDioramaNode("mossy-stone");
  await page.waitForTimeout(120);
  const physicalNodeResult=await page.evaluate(()=>({
   hit:document.querySelector("#expedition-diorama canvas")?.dataset.expeditionLastPointerTarget??"no-pointerdown",
   activated:document.querySelector("#expedition-diorama canvas")?.dataset.expeditionLastActivated??"not-activated",
   view:document.querySelector("#expedition-diorama canvas")?.dataset.expeditionView??"no-view",
   message:document.querySelector("#expedition-session-message")?.textContent??""
  }));
  if(physicalNodeResult.hit!=="node:mossy-stone"||physicalNodeResult.activated!=="node:mossy-stone")throw new Error("El raycast 3D no respetó la hitbox del nodo pulsado: "+JSON.stringify(physicalNodeResult));
 if(!await page.locator("#expedition-event-title").isVisible())throw new Error("El nodo físico no abrió su nivel: "+JSON.stringify(physicalNodeResult));
 if(await expeditionCanvas.getAttribute("data-expedition-view")!=="level")throw new Error("Tocar un lugar del diorama no abrió su nivel");
 await page.screenshot({path:"artifacts/visual/expedition-level-moss-390x844.png",fullPage:true});
 await page.locator("#expedition-map-back").click();
 if(!await page.locator("#expedition-resume-event").isVisible())throw new Error("El mapa no permite retomar un encuentro pendiente");
 const assertExpeditionNodesDoNotOverlap=async()=>{
  const boxes=await page.locator(".expedition-node:visible").evaluateAll(nodes=>nodes.map(node=>{const r=node.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};}));
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){
   const a=boxes[i],b=boxes[j],overlapX=Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x),overlapY=Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y);
   if(overlapX>1&&overlapY>1)throw new Error("Los lugares del mapa se solapan en responsive");
  }
 };
 await assertExpeditionNodesDoNotOverlap();
 await page.setViewportSize({width:360,height:640});
 await page.waitForTimeout(120);
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw new Error("El diorama del mapa genera overflow a 360x640");
 if(await expeditionCanvas.getAttribute("data-expedition-portrait")!=="true")throw new Error("El mapa no adopta composición vertical en móvil");
 await assertExpeditionNodesDoNotOverlap();
 await page.screenshot({path:"artifacts/visual/expedition-map-360x640.png",fullPage:true});
 const compactPanel=await page.locator("#expedition-map-layer").boundingBox();
 const compactScene=await page.locator("#expedition-diorama").boundingBox();
 if(!compactPanel||!compactScene||compactScene.height<200||compactPanel.height>330||compactScene.y+compactScene.height>compactPanel.y+2)throw new Error("A 360x640 no queda una zona 3D suficiente y separada del panel: "+JSON.stringify({panel:compactPanel,scene:compactScene}));
 const resumeBox=await page.locator("#expedition-resume-event").boundingBox();
 const runActionsBox=await page.locator("#expedition-run-actions").boundingBox();
 if(!resumeBox||!runActionsBox)throw new Error("El mapa debe ofrecer Retomar, Guardar y Retirarse cuando hay un encuentro pendiente");
 const resumeActionsOverlap=Math.min(resumeBox.x+resumeBox.width,runActionsBox.x+runActionsBox.width)-Math.max(resumeBox.x,runActionsBox.x)>1&&Math.min(resumeBox.y+resumeBox.height,runActionsBox.y+runActionsBox.height)-Math.max(resumeBox.y,runActionsBox.y)>1;
 if(resumeActionsOverlap)throw new Error("Retomar el encuentro se solapa con Guardar/Retirarse a 360x640");
 await page.setViewportSize({width:1440,height:1000});
 await page.waitForTimeout(120);
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw new Error("El diorama del mapa genera overflow a 1440x1000");
 if(await expeditionCanvas.getAttribute("data-expedition-portrait")!=="false")throw new Error("El mapa conserva composición de teléfono en escritorio");
 await assertExpeditionNodesDoNotOverlap();
 await page.screenshot({path:"artifacts/visual/expedition-map-1440x1000.png",fullPage:true});
 await page.setViewportSize({width:390,height:844});
 await page.locator("#expedition-resume-event").click();
 await page.locator("#expedition-event-title").waitFor({state:"visible"});
 if(!await page.evaluate(()=>window.__terrariumCanvasBeforeExpedition===document.querySelector("#expedition-diorama canvas")))throw new Error("Cambiar entre mapa y nivel reemplazó el canvas");
 await page.locator("#expedition-map-back").click();
 await page.locator("#expedition-save").click();
 const activeRun=await page.evaluate(()=>{
  const run=JSON.parse(localStorage.getItem("terrario-isopodos.save.v1")).state.expeditionProgress.active;
  localStorage.setItem("terrario-test.expedition-id",run.id);
  return run;
 });
 if(!activeRun||activeRun.currentNodeId!=="mossy-stone")throw new Error("El guardado no conserva la ubicación seleccionada en el mapa");
 await page.reload({waitUntil:"networkidle"});
 await page.getByRole("button",{name:/Continuar partida/}).click();
 await page.locator("#expedition-diorama canvas").waitFor({state:"visible",timeout:15000});
 await page.locator("#screen-expedition").waitFor({state:"visible",timeout:15000});
 const restored=await page.evaluate(()=>{
  window.__restoredExpeditionCanvas=document.querySelector("#expedition-diorama canvas");
  return{run:JSON.parse(localStorage.getItem("terrario-isopodos.save.v1")).state.expeditionProgress.active,expected:localStorage.getItem("terrario-test.expedition-id")};
 });
 if(!restored.run||restored.run.id!==restored.expected||restored.run.currentNodeId!==activeRun.currentNodeId||!await page.locator("#expedition-event-title").isVisible())throw new Error("La misma expedición y nivel no se restauraron al recargar");
 await page.locator("#expedition-return").click();
 if(!await page.locator("#expedition-home").isVisible())throw new Error("No aparece el registro de regreso");
 if(!(await page.locator("#expedition-day").textContent()).includes("DÍA 02"))throw new Error("El regreso no avanzó exactamente una jornada");
 await page.screenshot({path:"artifacts/visual/expedition-settlement-390x844.png",fullPage:true});
 await page.locator("#expedition-home").click();
 if(await page.locator("#screen-expedition").isVisible())throw new Error("La pantalla de expedición no se cerró");
 if(!await page.locator("#scene canvas").isVisible())throw new Error("El renderer no regresó al terrario");
 if(!await page.evaluate(()=>window.__restoredExpeditionCanvas===document.querySelector("#scene canvas")))throw new Error("El retorno reconstruyó el canvas del terrario");
 if(await page.locator("#scene canvas").getAttribute("data-expedition-view")!=="terrarium")throw new Error("El renderer siguió mostrando la escena de expedición tras regresar");
 if(Number(await page.locator("#scene canvas").getAttribute("data-camera-fov"))!==33)throw new Error("La cámara del terrario no restauró su FOV al volver");
 if(await page.locator("#scene canvas").getAttribute("data-resource-art")!=="shared-diorama-kit")throw new Error("El terrario no conservó los recursos renderizados por el kit al regresar");
 if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))throw new Error("La expedición genera overflow horizontal en móvil");
 // Colonia exhausta: explicar el requisito y ofrecer el regreso al terrario.
 // Reutilizar el canvas/página principal: Chromium/SwiftShader puede limitar los contextos WebGL simultáneos.
 await page.locator("#open-game-menu").click();
 await page.getByRole("button",{name:/Salir al menú/}).click();
 await page.getByRole("button",{name:/Nuevo terrario/}).click();
 await page.getByRole("button",{name:/Entrar al terrario/}).click();
 await page.locator("#scene canvas").waitFor({state:"visible",timeout:15000});
 await page.locator("#open-game-menu").click();
 await page.locator("#pause-save").click();
 await page.locator("#resume-game").click();
 await page.evaluate(()=>{
  const key="terrario-isopodos.save.v1",save=JSON.parse(localStorage.getItem(key));
  for(const entity of save.state.entities)if(entity.alive!==false)entity.energy=.17;
  localStorage.setItem(key,JSON.stringify(save));
 });
 await page.reload({waitUntil:"networkidle"});
 await page.getByRole("button",{name:/Continuar partida/}).click();
 await page.locator("#scene canvas").waitFor({state:"visible",timeout:15000});
 await page.locator("#open-expedition").click();
 await page.locator("#expedition-readiness").waitFor({state:"visible"});
 const exhaustedMessage=await page.locator("#expedition-readiness").textContent();
 if(!exhaustedMessage.includes("17%")||!exhaustedMessage.includes("faltan 13 puntos"))throw new Error("No se muestra el déficit energético real: "+exhaustedMessage);
 const exhaustedPanel=await page.locator("#expedition-map-layer").boundingBox();
 const exhaustedScene=await page.locator("#expedition-diorama").boundingBox();
 if(!exhaustedPanel||!exhaustedScene||exhaustedScene.y+exhaustedScene.height>exhaustedPanel.y+2)throw new Error("El panel de recuperación tapa el diorama con la colonia agotada");
 if(await page.locator("#expedition-start").isDisabled()||!(await page.locator("#expedition-start").textContent()).includes("recuperar energía"))throw new Error("Una colonia agotada sigue bloqueada sin salida hacia el terrario");
 await page.screenshot({path:"artifacts/visual/expedition-exhausted-390x844.png",fullPage:true});
 await page.locator("#expedition-start").click();
 await page.locator("#screen-expedition").waitFor({state:"hidden"});
 if(!await page.locator("#scene canvas").isVisible())throw new Error("El CTA de recuperación no devolvió al terrario");
 if(await page.locator("#pause").getAttribute("aria-pressed")!=="true")throw new Error("La recuperación no reanudó la simulación ecológica");
 if(errors.length)throw new Error("La ruta de recuperación produjo errores: "+errors.join(" | "));
 
 const renderMetrics=await page.locator("#scene canvas").evaluate(canvas=>({
  calls:Number(canvas.dataset.renderCalls),
  triangles:Number(canvas.dataset.renderTriangles),
  geometries:Number(canvas.dataset.renderGeometries),
  textures:Number(canvas.dataset.renderTextures),
  artVersion:canvas.dataset.artVersion,
  seed:Number(canvas.dataset.sceneSeed),
  substrateLayers:Number(canvas.dataset.terrainLayerCount),
  leafInstances:Number(canvas.dataset.leafCount),
  fernLeaves:Number(canvas.dataset.fernLeaves),
  mossPillows:Number(canvas.dataset.mossCount),
  staticMeshesMerged:Number(canvas.dataset.staticMeshesMerged),
  staticDrawMeshes:Number(canvas.dataset.staticDrawMeshes),
  staticDrawCallsSaved:Number(canvas.dataset.staticDrawCallsSaved)
 }));
 if(!Number.isFinite(renderMetrics.calls)||!Number.isFinite(renderMetrics.triangles))throw new Error("No se recibieron diagnósticos reales del renderer");
 if(renderMetrics.calls>150)throw new Error(`La escena móvil supera 150 draw calls tras el batching: ${renderMetrics.calls}`);
 if(renderMetrics.geometries>200)throw new Error(`La escena móvil supera 200 geometrías: ${renderMetrics.geometries}`);
 if(renderMetrics.triangles>300000)throw new Error(`La escena móvil supera 300k triángulos: ${renderMetrics.triangles}`);
 if(errors.length)throw new Error(`Errores de consola/red: ${errors.join(" | ")}`);
 await page.close();

 const unsupportedPage=await browser.newPage({viewport:{width:390,height:844}});
 const unsupportedErrors=[];
 unsupportedPage.on("pageerror",error=>unsupportedErrors.push(error.message));
 await unsupportedPage.addInitScript(()=>{
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...args){
   if(typeof type==="string"&&["webgl2","webgl","experimental-webgl"].includes(type.toLowerCase()))return null;
   return original.call(this,type,...args);
  };
 });
 await unsupportedPage.goto(url,{waitUntil:"networkidle",timeout:30000});
 await unsupportedPage.getByRole("button",{name:/Nuevo terrario/}).click();
 await unsupportedPage.getByRole("button",{name:/Entrar al terrario/}).click();
 await unsupportedPage.locator("#screen-modal").waitFor({state:"visible",timeout:15000});
 if(!await unsupportedPage.locator("#screen-modal").isVisible())throw new Error("La falta de WebGL no muestra un aviso recuperable");
 if(!(await unsupportedPage.locator("#modal-title").textContent()).includes("No se pudo iniciar"))throw new Error("El aviso WebGL no identifica el fallo");
 if(unsupportedErrors.length)throw new Error("El fallo WebGL provoca excepciones no capturadas: "+unsupportedErrors.join(" | "));
 await unsupportedPage.close();
 

 await writeFile("artifacts/visual/evidence.json",JSON.stringify({repository:"yosoymitxel/Pruebas-gaming",branch:process.env.GITHUB_HEAD_REF||process.env.GITHUB_REF||"local",sha:process.env.GITHUB_SHA||"local-unavailable",origin:url,capturedAt:new Date().toISOString(),browser:browser.version(),viewports:["1440x1000","390x844","360x640"],screenshots:["mobile-menu-360x640.png","mobile-setup-360x640.png","mobile-new-game-360x640.png","mobile-loading-360x640.png","menu-1440x1000.png","setup-1440x1000.png","gameplay-voxel-1440x1000.png","gameplay-diorama-1440x1000.png","desktop-1440x1000.png","mobile-390x844.png","mobile-controls-390x844.png","rectangular-walls-390x844.png","spherical-orb-390x844.png","expedition-map-390x844.png","expedition-level-garden-390x844.png","expedition-level-moss-390x844.png","expedition-map-360x640.png","expedition-map-1440x1000.png","expedition-settlement-390x844.png"],checks:{menuFocus:"PASS",mobileMenuTouch:"PASS",newGamePlayable:"PASS",loadingTheme:"PASS",duplicateIds:"PASS",setupAriaPressed:"PASS",gameSettings:"PASS",gameHelp:"PASS",modalEscapeAndFocus:"PASS",rendererSwitch:"PASS",cameraRail:"PASS",weatherEffects:"PASS",pauseMenu:"PASS",touchPinch:"PASS",saveReload:"PASS",mobileDrawer:"PASS",horizontalOverflow:false,webglUnavailableRecovery:"PASS",woodlandInterior:"PASS",expeditionFlow:"PASS",rendererIdentity:"PASS",expeditionMapDiorama:"PASS",expeditionLevelDiorama:"PASS",expedition3dNodePicking:"PASS",activeRunRestore:"PASS",daySettlement:"PASS",consoleErrors:errors},rendererMetrics:renderMetrics},null,2));
 console.log(JSON.stringify({result:"PASS",url,desktop:"1440x1000",mobile:"390x844",menuFocus:"PASS",mobileMenuTouch:"PASS",newGamePlayable:"PASS",duplicateIds:"PASS",setupAriaPressed:"PASS",gameSettings:"PASS",gameHelp:"PASS",rendererSwitch:"PASS",cameraRail:"PASS",weatherEffects:"PASS",pauseMenu:"PASS",loadingTheme:"PASS",manualClockStep:"PASS",fiveStableEntities:"PASS",saveReload:"PASS",mobileDrawer:"PASS",mobileHorizontalOverflow:false,sphericalContainer:"PASS",webglUnavailableRecovery:"PASS",woodlandInterior:"PASS",expeditionFlow:"PASS",rendererIdentity:"PASS",expeditionMapDiorama:"PASS",expeditionLevelDiorama:"PASS",expedition3dNodePicking:"PASS",activeRunRestore:"PASS",daySettlement:"PASS",rendererMetrics:renderMetrics,errors},null,2));
}catch(error){console.error(error);if(errors.length)console.error("Browser errors:",errors);process.exitCode=1;}
finally{await browser?.close();await new Promise(resolveClose=>server.close(resolveClose));}
