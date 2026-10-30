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
 page.on("pageerror",e=>errors.push(e.message));
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
 if(await cameraCanvas.getAttribute("data-render-mode")!=="voxel")throw new Error("La selección Voxel inicial no se aplicó al renderizador real");
  if(await cameraCanvas.getAttribute("data-container-shape")!=="cilindrico"||await cameraCanvas.getAttribute("data-container-wall-count")!=="1")throw new Error("El terrario cilíndrico no construyó sus paredes verticales");
 if(await cameraCanvas.getAttribute("data-art-version")!=="woodland-diorama-v2")throw new Error("No se montó el nuevo kit de ecosistema");
 if(await cameraCanvas.getAttribute("data-terrain-layer-count")!=="3")throw new Error("El sustrato no expone sus tres estratos");
 if(Number(await cameraCanvas.getAttribute("data-leaf-count"))<150)throw new Error("Falta hojarasca individual instanciada");
 if(Number(await cameraCanvas.getAttribute("data-fern-leaves"))<300)throw new Error("No se generaron frondas suficientes en el diorama");
 if(Number(await cameraCanvas.getAttribute("data-moss-count"))<30)throw new Error("El tapiz de musgo no está presente");
 await page.waitForFunction(()=>Number(document.querySelector("#scene canvas")?.dataset.renderCalls)>0&&Number(document.querySelector("#scene canvas")?.dataset.renderTriangles)>0);
 if(Number(await cameraCanvas.getAttribute("data-render-calls"))>150)throw new Error("La escena excede el presupuesto orientativo de llamadas de dibujo móvil");
 if(Number(await cameraCanvas.getAttribute("data-render-triangles"))>300000)throw new Error("La escena excede el presupuesto orientativo de triángulos móvil");
 await page.screenshot({path:"artifacts/visual/gameplay-voxel-1440x1000.png",fullPage:true});
 const initialDistance=Number(await cameraCanvas.getAttribute("data-camera-distance"));
 await cameraCanvas.evaluate(canvas=>{const fire=(type,pointerId,x,y)=>canvas.dispatchEvent(new PointerEvent(type,{pointerId,pointerType:"touch",isPrimary:pointerId===11,button:0,clientX:x,clientY:y,bubbles:true}));fire("pointerdown",11,100,100);fire("pointerdown",12,200,100);fire("pointermove",12,240,100);fire("pointerup",12,240,100);fire("pointerup",11,100,100);});
 const pinchDistance=Number(await cameraCanvas.getAttribute("data-camera-distance"));
 if(!(pinchDistance<initialDistance))throw new Error(`El gesto de pellizco no acerca la cámara: inicial=${initialDistance}, final=${pinchDistance}`);
 await page.getByRole("button",{name:"Acercar cámara"}).click();
 await page.getByRole("button",{name:"Alejar cámara"}).click();

 await page.waitForFunction(()=>{const c=document.querySelector("#scene canvas");return c&&c.width>1&&c.height>1;});
 await page.locator("#open-settings-game").click();
 if(await page.locator("#modal-title").textContent()!=="Ajustes")throw new Error("Los ajustes de la barra de juego no abren");
 await page.waitForFunction(()=>document.activeElement?.id==="close-modal");
 await page.keyboard.press("Escape");
 if(await page.locator("#screen-modal").isVisible())throw new Error("Escape no cierra ajustes");
 await page.waitForFunction(()=>document.activeElement?.id==="open-settings-game");
 await page.locator("#open-help-game").click();
 if(await page.locator("#modal-title").textContent()!=="Cómo se juega")throw new Error("La ayuda de la barra de juego no abre");
 await page.waitForFunction(()=>document.activeElement?.id==="close-modal");
 await page.keyboard.press("Escape");
 if(await page.locator("#screen-modal").isVisible())throw new Error("Escape no cierra Ayuda");
 await page.waitForFunction(()=>document.activeElement?.id==="open-help-game");
 await page.getByRole("button",{name:/Diorama/}).click();
 if(await page.locator("#view-label").textContent()!=="DIORAMA 3D"||await cameraCanvas.getAttribute("data-render-mode")!=="diorama")throw new Error("No cambió realmente a Diorama");
 if(Number(await cameraCanvas.getAttribute("data-render-triangles"))<=0)throw new Error("Diorama quedó sin geometría tras cambiar de modo");
 await page.screenshot({path:"artifacts/visual/gameplay-diorama-1440x1000.png",fullPage:true});
 await page.getByRole("button",{name:/Voxel/}).click();
 if(await page.locator("#view-label").textContent()!=="VOXEL / 3D"||await cameraCanvas.getAttribute("data-render-mode")!=="voxel")throw new Error("No volvió realmente a Voxel");
 if(Number(await cameraCanvas.getAttribute("data-render-triangles"))<=0)throw new Error("Voxel quedó sin el terrario 3D después del cambio de modo");
 await page.getByRole("button",{name:/Pausar/}).click();
 await page.locator("#pause-settings").click();
 if(await page.locator("#modal-title").textContent()!=="Ajustes")throw new Error("No se abre Ajustes desde pausa");
 await page.locator("#save-settings").click();
 if(await page.locator("#modal-title").textContent()!=="Partida en pausa")throw new Error("Al guardar ajustes no se regresa al menú de pausa");
 await page.locator("#pause-help").click();
 if(await page.locator("#modal-title").textContent()!=="Cómo se juega")throw new Error("No se abre Ayuda desde pausa");
 await page.keyboard.press("Escape");
 if(await page.locator("#modal-title").textContent()!=="Partida en pausa")throw new Error("Escape no regresa de Ayuda al menú de pausa");
 const clockBeforeStep=await page.locator("#clock").textContent();
 const beforeMatch=clockBeforeStep.match(/(\d{2}):(\d{2})$/);
 if(!beforeMatch)throw new Error(`No se pudo leer el reloj antes del avance: ${clockBeforeStep}`);
 const minutesBeforeStep=Number(beforeMatch[1])*60+Number(beforeMatch[2]);
 await page.getByRole("button",{name:/Avanzar 1 minuto sin reanudar/}).click();
 const clockAfterStep=await page.locator("#clock").textContent();
 const afterMatch=clockAfterStep.match(/(\d{2}):(\d{2})$/);
 const minutesAfterStep=afterMatch?Number(afterMatch[1])*60+Number(afterMatch[2]):-1;
 if(minutesAfterStep!==minutesBeforeStep+1)throw new Error(`El avance manual debe sumar exactamente un minuto: antes=${clockBeforeStep}, después=${clockAfterStep}`);
 await page.getByRole("button",{name:/Continuar observando/}).click();
 if(await page.locator("#count").textContent()!=="05")throw new Error("La colonia inicial no contiene cinco individuos");
 await page.locator('[data-buy="mushroom"]').click();
 if(await page.locator("#coins").textContent()!=="23")throw new Error("La tienda no descontó el coste de las setas");
 if(!(await page.locator("#shop-note").textContent()).includes("Setas de bosque"))throw new Error("La tienda no confirmó el artículo comprado");

 await page.locator("#humidity-input").evaluate(el=>{el.value="0.4";el.dispatchEvent(new Event("input",{bubbles:true}));});
 if(await page.locator("#humidity").textContent()!=="40")throw new Error("No se pudo cambiar la humedad");
 await page.getByRole("button",{name:/Pausar/}).click();
 let savedClock=await page.locator("#clock").textContent();
 await page.locator("#pause-save").click();
 await page.getByRole("button",{name:/Volver al terrario/}).click();
 await page.getByRole("button",{name:"Menú"}).click();
 savedClock=await page.locator("#clock").textContent();
 await page.getByRole("button",{name:/Volver al menú principal/}).click();
 await page.reload({waitUntil:"networkidle"});
 await page.getByRole("button",{name:/Continuar partida/}).click();
 const restoredClock=await page.locator("#clock").textContent();const savedMatch=savedClock.match(/(\d{2}):(\d{2})$/),restoredMatch=restoredClock.match(/(\d{2}):(\d{2})$/);const savedMinutes=savedMatch?Number(savedMatch[1])*60+Number(savedMatch[2]):-1,restoredMinutes=restoredMatch?Number(restoredMatch[1])*60+Number(restoredMatch[2]):-1;if(restoredMinutes<savedMinutes||restoredMinutes>savedMinutes+1)throw new Error(`El reloj restaurado está fuera de tolerancia: guardado=${savedClock}, restaurado=${restoredClock}`);
 if(await page.locator("#humidity").textContent()!=="40")throw new Error("El guardado no restauró la humedad tras recarga");
 if(await page.locator("#count").textContent()!=="05")throw new Error("La colonia cambió al restaurar");
 if(await page.locator("#coins").textContent()!=="23")throw new Error("El saldo de la tienda no sobrevivió a guardar/cargar");
 const hasPurchasedItem=await page.evaluate(()=>JSON.parse(localStorage.getItem("terrario-isopodos.save.v1")).state.resources.some(r=>r.type==="mushroom"));
 if(!hasPurchasedItem)throw new Error("El objeto comprado no sobrevivió a guardar/cargar");

 if(await page.locator("#view-label").textContent()!=="VOXEL / 3D"||await page.locator("#scene canvas").getAttribute("data-render-mode")!=="voxel")throw new Error("Guardar/cargar no restauró el modo visual real elegido");
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
 await page.getByRole("button",{name:"Menú"}).click();
 await page.getByRole("button",{name:/Volver al menú principal/}).click();
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
 await page.getByRole("button",{name:"Menú"}).click();
 await page.getByRole("button",{name:/Volver al menú principal/}).click();
 await page.getByRole("button",{name:/Nuevo terrario/}).click();
 await page.locator('[data-setup-shape="esferico"]').click();
 await page.getByRole("button",{name:/Entrar al terrario/}).click();
 await page.waitForFunction(()=>{const c=document.querySelector("#scene canvas");return c&&c.width>1&&c.height>1;});
 const orb=page.locator("#scene canvas");
 if(await orb.getAttribute("data-container-shape")!=="esferico"||await orb.getAttribute("data-container-kind")!=="spherical-globe")throw new Error("No se creó el globo esférico real");
 const orbDistance=Number(await orb.getAttribute("data-camera-distance")),orbFit=Number(await orb.getAttribute("data-camera-fit-distance"));
 if(!Number.isFinite(orbDistance)||!Number.isFinite(orbFit)||orbDistance+.02<orbFit)throw new Error("La cámara no encuadra el globo en móvil");
 await page.screenshot({path:"artifacts/visual/spherical-orb-390x844.png",fullPage:true});

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
 if(!await unsupportedPage.locator("#screen-modal").isVisible())throw new Error("La falta de WebGL no muestra un aviso recuperable");
 if(!(await unsupportedPage.locator("#modal-title").textContent()).includes("No se pudo iniciar"))throw new Error("El aviso WebGL no identifica el fallo");
 if(unsupportedErrors.length)throw new Error("El fallo WebGL provoca excepciones no capturadas: "+unsupportedErrors.join(" | "));
 await unsupportedPage.close();
 
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
  mossPillows:Number(canvas.dataset.mossCount)
 }));
 if(!Number.isFinite(renderMetrics.calls)||!Number.isFinite(renderMetrics.triangles))throw new Error("No se recibieron diagnósticos reales del renderer");
 if(errors.length)throw new Error(`Errores de consola/red: ${errors.join(" | ")}`);
 await writeFile("artifacts/visual/evidence.json",JSON.stringify({repository:"yosoymitxel/Pruebas-gaming",branch:process.env.GITHUB_HEAD_REF||process.env.GITHUB_REF||"local",sha:process.env.GITHUB_SHA||"local-unavailable",origin:url,capturedAt:new Date().toISOString(),browser:browser.version(),viewports:["1440x1000","390x844"],screenshots:["menu-1440x1000.png","setup-1440x1000.png","gameplay-voxel-1440x1000.png","gameplay-diorama-1440x1000.png","desktop-1440x1000.png","mobile-390x844.png","mobile-controls-390x844.png","rectangular-walls-390x844.png","spherical-orb-390x844.png"],checks:{menuFocus:"PASS",duplicateIds:"PASS",setupAriaPressed:"PASS",gameSettings:"PASS",gameHelp:"PASS",modalEscapeAndFocus:"PASS",rendererSwitch:"PASS",touchPinch:"PASS",saveReload:"PASS",mobileDrawer:"PASS",horizontalOverflow:false,webglUnavailableRecovery:"PASS",woodlandInterior:"PASS",consoleErrors:errors},rendererMetrics:renderMetrics},null,2));
 console.log(JSON.stringify({result:"PASS",url,desktop:"1440x1000",mobile:"390x844",menuFocus:"PASS",duplicateIds:"PASS",setupAriaPressed:"PASS",gameSettings:"PASS",gameHelp:"PASS",rendererSwitch:"PASS",manualClockStep:"PASS",fiveStableEntities:"PASS",saveReload:"PASS",mobileDrawer:"PASS",mobileHorizontalOverflow:false,sphericalContainer:"PASS",webglUnavailableRecovery:"PASS",woodlandInterior:"PASS",rendererMetrics:renderMetrics,errors},null,2));
}catch(error){console.error(error);if(errors.length)console.error("Browser errors:",errors);process.exitCode=1;}
finally{await browser?.close();await new Promise(resolveClose=>server.close(resolveClose));}
