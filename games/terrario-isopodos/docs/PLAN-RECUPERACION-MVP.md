# Plan de recuperación del MVP — Terrario de isópodos

**Auditoría normativa:** `framework/BASELINE-VIDEOJUEGO.md` y `framework/CONFLICTOS-Y-FUENTE-DE-VERDAD.md`.  
**Producto:** [Especificación técnica](ESPECIFICACION-TERRARIO-ISOPODOS.md).  
**Snapshot vigente — 30-10-2026:** `main` = `2f5dbe1c63f644f820d7897e022aabda0b7533c3`, PR #19 fusionada mediante squash. La rama `feat/isopod-render-spike` contiene únicamente seguimiento documental posterior; el código del juego no diverge del merge de PR #19. El SHA probado antes del squash fue `99e860ad05bb06553bd29c5360dea17ab1638edd`.  
**Validación vigente:** Terrario MVP [41089329251](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41089329251), Terrario game [41089338122](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41089338122) y Framework [41089338312](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41089338312) terminaron PASS. Artefacto visual inspeccionado: [12993906214](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41089329251/artifacts/12993906214).  
**Pages:** build y deployment publicados para el merge SHA por [run 41091166831](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41091166831); URL: https://yosoymitxel.github.io/Pruebas-gaming/. La validación Playwright post-deployment [41091167637](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41091167637) también terminó PASS.  
**Estado general:** expediciones 3D funcionales e integradas; DESIGN_GATE parcial por deuda visual. **MVP completo NO APROBADO.** La auditoría vigente añadida al final de este documento supersede snapshots históricos.

## Auditoría histórica de errores y tareas — snapshot temprano f751e32 (30-10-2026)

**Snapshot comprobado:** main = 714504c0562bda5734cd6238fff8cd5611e9e91c; rama activa feat/isopod-render-spike = f751e327c156fef9997aac76441858a8a583af96. No hay PR abierta. Los commits visuales de esta rama todavía no están integrados en main ni publicados en Pages.

**CI vigente:** [Terrario MVP checks — run 41052207493](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41052207493), SHA f751e32 — **PASS** en instalación, auditoría con umbral high, tests Node, build, Playwright y carga de evidencia. No hay un fallo de CI activo en este snapshot.

**Regresión de pruebas ya corregida:** los runs [41051711014](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41051711014) y [41051911417](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41051911417) fallaron en Playwright al comprobar el color de los botones Diorama/Voxel durante la transición CSS. El problema estaba en la captura/espera del test; el smoke ahora emula prefers-reduced-motion antes de validar el estado estable. El run f751e32 pasó y las capturas muestran la selección correcta. Mantener esta comprobación.

### Errores y deuda nueva detectada

| Prioridad | Incidencia | Evidencia / diagnóstico | Trabajo requerido |
|---|---|---|---|
| P0 | Build no reproducible | No existe games/terrario-isopodos/package-lock.json versionado; el workflow usa npm install. El lockfile aparece en los artefactos porque npm lo genera durante CI, no porque esté en Git. | Generar y revisar el lockfile con Node/npm del proyecto; cambiar CI y Pages a npm ci; validar desde checkout limpio. |
| P1 | Vulnerabilidad moderada en Vite | npm audit identifica Vite 6.4.4 y [GHSA-8g5g-mxqh-grgj](https://github.com/advisories/GHSA-8g5g-mxqh-grgj), bypass de server.fs.deny mediante queries. El audit no rompe porque CI usa --audit-level=high; no significa que esté limpio. El log indica fix disponible en 6.4.5. | Actualizar Vite a una versión corregida compatible, regenerar lockfile y exigir npm audit sin vulnerabilidades conocidas; no usar --force a ciegas. |
| P1 | Bundle principal supera 500 kB | El build de Vite muestra warning de chunks mayores a 500 kB minificados. Build termina bien, pero la carga inicial y el rendimiento móvil quedan por optimizar. | Inspeccionar el chunk real; separar Three.js/render y módulos diferibles mediante dynamic import() o manualChunks, sin subir el límite para ocultar el aviso. Medir resultado. |
| P1 | Encuadre móvil con demasiado espacio vacío | La captura mobile-390x844.png del SHA f751e32 deja una zona verde grande sobre el terrario; el hábitat ocupa una fracción reducida del viewport. No hay overflow horizontal (false), pero el reparto vertical es débil. | Ajustar el encuadre/escala inicial en retrato sin cortar el recipiente ni solapar reloj, herramientas y bandeja; añadir captura comparativa. |
| P1 | Bandeja móvil: recorrido completo de controles no demostrado | En mobile-controls-390x844.png el final de la tienda queda cortado por el borde de la captura. CSS define overflow-y:auto en el contenido, así que no está demostrado que sea un bloqueo funcional; falta probar desplazamiento hasta el último control. | Añadir Playwright que abra la bandeja, haga scroll interno hasta el último artículo y compruebe que todos los botones son visibles y accionables; corregir altura/safe-area si falla. |
| P1 | Diorama todavía se lee como bandeja/pedestal | Las capturas muestran el sustrato como un disco elevado y la base de madera sigue dominando el perfil. Los cambios de relieve y grosor mejoraron el conjunto, pero aún no cumplen plenamente «microbosque, no placa con props». | Rehacer por iteración la silueta del sustrato y la transición de estratos/borde; integrar más suelo orgánico y madera descompuesta sin perder el espacio central de observación. |
| P1 | Movimiento reducido incompleto | CSS respeta prefers-reduced-motion, pero el giro automático de cámara del renderer aún no consulta esa preferencia. | Desactivar/evitar auto-rotación al detectar movimiento reducido y mantener el ajuste manual disponible; cubrirlo en navegador. |
| P1 | Fuente única de verdad incompleta | main.js aún muta directamente estado del dominio y duplica preferencias de presentación. | Encapsular cambios en comandos/funciones de dominio y separar TerrariumState, preferencias y estado de UI; añadir pruebas de invariantes. |
| P1 | Persistencia incompleta | Solo hay una partida local; faltan autoguardado, slots, backup del último guardado válido, migraciones y exportación/importación. | Implementar de forma segura y versionada, con pruebas de corrupción, versiones futuras, fallo de almacenamiento y roundtrip. |
| P1 | Observación y ciclo vital incompletos | Selección/ficha de isópodo, reproducción/nacimientos y catálogo de descubrimientos siguen ausentes o parciales frente a la especificación. | Priorizar selección por ID estable y ficha; después reglas de ciclo vital y descubrimientos reproducibles, sin atribuir realismo científico al modelo lúdico. |
| P2 | Advertencias de compatibilidad en CI | Los logs muestran advertencia de acciones GitHub que todavía apuntan a Node.js 20 y avisos DEP0040 (punycode) / DEP0169 (url.parse). No hicieron fallar la ejecución. | Identificar dependencias/acciones que originan los avisos y actualizar versiones compatibles con Node 24; no confundir estas advertencias de tooling con errores del juego. |
| P2 | Cobertura de dispositivos reales | CI usa Chromium en 1440x1000 y 390x844; no certifica Safari/iOS, Android físico, orientación horizontal ni safe areas de dispositivos reales. | Probar al menos un iPhone/Safari y un Android real, con scroll, zoom, orientación y recuperación de pestaña. |

### Métricas verificadas en la evidencia vigente

Artefacto del run 41052207493, SHA f751e32: 93 draw calls, 117.125 triángulos, 85 geometrías, 5 texturas, 570 instancias de hojarasca/cobertura, 645 hojas de helecho y 32 almohadillas de musgo. Playwright registra cero errores de consola y horizontalOverflow = false. Menú, setup, modos, guardado/recarga, pinch, bandeja móvil, recuperación cuando WebGL no está disponible y escena woodland pasan en el smoke. Esto valida la vertical probada, no el MVP completo ni la recuperación ante pérdida del contexto WebGL.

### Cierre de la auditoría

- No hay error de ejecución ni fallo de CI vigente en el SHA f751e32.
- La vulnerabilidad moderada y el warning de chunk siguen presentes aunque el pipeline termine en PASS.
- El problema de resaltado de modo queda corregido en el test; no volver a tratar las dos ejecuciones históricas como fallos actuales.
- No declarar integración/publicación hasta fusionar la rama y verificar el workflow de Pages sobre el SHA integrado.


## Tabla de verdad obligatoria del esqueleto

La columna «Decisión» utiliza los estados del framework. «Estado de implementación» indica lo que realmente existe hoy.

| Sistema transversal | Decisión | Estado de implementación | Criterio de aceptación / brecha |
|---|---|---|---|
| Arranque y menú principal | INCLUIR | Implementado y probado en smoke actual | Menú inicial, nueva partida y continuar solo si el guardado es válido. Una partida corrupta no debe bloquear una partida nueva. |
| Flujo de pantallas | INCLUIR | Parcial | Menú → configuración → juego → pausa/ajustes/ayuda → regreso al menú. Existe coordinación en `main.js`, no una máquina formal de estados; probar todas las transiciones y cerrar overlays sin dejar la simulación en estado incorrecto. |
| HUD y fuente única de verdad | INCLUIR | Parcial | Reloj, colonia, microclima, monedas y conducta se derivan del estado, pero `main.js` todavía muta campos de dominio directamente y hay duplicidad de preferencias. Definir comandos/propietarios y probar consistencia tras cada acción. |
| Pausa y reanudación | INCLUIR | Implementado y probado en smoke actual | Pausar congela pasos de simulación; reanudar no debe saltar tiempo ni cerrar una pantalla incorrecta. Avance manual pausado suma exactamente un minuto. |
| Nueva partida y reinicio | INCLUIR | Parcial | Nueva partida crea el estado inicial; volver al menú intenta guardar automáticamente, sin una política configurable de borrar/reiniciar. Probar reset y recuperación ante fallo de guardado. |
| Configuración persistente | INCLUIR | Parcial | Modo visual, giro y calidad se guardan en preferencias locales; validar que reaparecen tras recarga y no mutan indebidamente la biología guardada. Forma y nombre pertenecen a la partida. |
| Idiomas | INCLUIR | Pendiente | El producto publica español, pero hay cadenas dispersas por HTML y `main.js`. Crear catálogo español con fallback definido; no hace falta añadir traducciones nuevas para satisfacer el primer idioma. |
| Temas | NO APLICA | No hay sistema de temas | Diorama y Voxel son representaciones, no temas. No crear un catálogo de temas sin requisito de producto. |
| Guardado y carga | INCLUIR | Parcial | Esquema v1, validación estructural y restauración existen; no hay migraciones históricas, backup de último guardado válido ni slots. Probar JSON corrupto, versión futura, fallo de almacenamiento y restauración completa. |
| Exportar e importar | PENDIENTE | No implementado | Definir formato versionado. Importar debe validar el archivo completo antes de sustituir el estado; un archivo inválido no puede dañar la partida actual. |
| Autoguardado | INCLUIR | Ausente | Añadir guardado automático throttled en puntos seguros, separado del manual, con feedback de éxito/error; no escribir en cada frame. |
| Victoria, derrota y resultados terminales | NO APLICA | Sandbox sin condición final obligatoria | No inventar una condición terminal ni permitir que la presentación decida resultados. La mortalidad de un individuo no termina automáticamente la partida. |
| Ayuda / tutorial | INCLUIR | Parcial | Hay ayuda básica sobre cámara, microclima y guardado. Completarla con controles soportados, límites de la simulación y significado de necesidades/monedas. |
| Input | INCLUIR | Parcial | Ratón y tacto controlan cámara; botones controlan el resto; teclado permite navegación normal y de diálogos, pero no todos los controles del juego tienen alternativa de teclado. Probar teclado, ratón y tacto; valorar navegación de selección de animales por teclado. |
| Audio | PENDIENTE | No hay audio | No bloquea el MVP actual. Si se introduce, mute/volumen y preferencias persistentes son requisito previo a distribuir sonido. |
| Responsive y safe areas | INCLUIR | Implementado en el alcance probado; baseline completo aún parcial | Hay bandeja móvil plegable y padding de safe areas. El smoke actual comprueba ambos recipientes y la cámara dinámica; se inspeccionó el rectángulo móvil, ya legible y completo, y se revisaron desktop y controles móviles. La validación de otros móviles físicos sigue pendiente. |
| Accesibilidad | INCLUIR | Parcial | Diálogos tienen foco/retorno y la CSS respeta reduced-motion, pero la rotación automática del renderer aún no consulta esa preferencia. Revisar foco visible, contraste, teclado y estados activos. |
| Errores y diagnóstico | INCLUIR | Parcial | Guardado/carga informan errores; no está resuelta la pérdida o indisponibilidad de contexto WebGL con una salida recuperable. Añadir prueba de fallo de contexto o registrar bloqueo técnico si no puede simularse en CI. |
| Build y publicación estática | INCLUIR | Build pasa en revisiones probadas; reproducción de dependencias pendiente | Vite genera build con rutas relativas; falta lockfile versionado y `npm ci`. Confirmar Pages sobre el SHA exacto tras merge. |
| QA y evidencia visual | INCLUIR | PASS para el alcance de PR #14 | Tests Node, build y smoke Playwright pasaron en [run 40979999742](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/40979999742); framework checks en [run 40979999450](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/40979999450). La evidencia trazable está en [artefacto 12944302939](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/40979999742/artifacts/12944302939). El deployment post-merge sigue pendiente de verificación. |

## Lo que ya existe

- Escena Three.js, cámara orbital/zoom y representaciones Diorama y Voxel en la misma sesión de dominio.
- Formas rectangular/cilíndrica, simulación heurística determinista, reloj, pausa/avance manual/velocidad y conductas básicas.
- Ajuste de humedad/temperatura, tienda de siete recursos, moneda y acciones de hojarasca/refugio.
- Preferencias locales de modo visual, giro automático y calidad.
- Guardado local de una sola partida en esquema v1.
- Pruebas Node y smoke test Playwright con flujos de menú, modos, controles, tienda, persistencia y móvil.

## Brechas y prioridades

| Prioridad | Sistema | Estado | Acción requerida |
|---|---|---|---|
| P0 | Continuar con partida corrupta | Corregido y validado en tests Node y smoke Playwright de PR #14 | `hasValidTerrariumSave()` valida con el parser antes de habilitar Continuar. Las pruebas cubren almacenamiento vacío, JSON corrupto, guardado válido y esquema futuro; el navegador confirma que una partida nueva sigue disponible. |
| P0 | Screenshot timeout en Diorama | RESUELTO y validado | Las ejecuciones iniciales agotaron 30 s al capturar después de cambiar de Voxel a Diorama. Se quitó `transmission` y se usa sombreado estándar transparente. La ejecución actual termina el smoke completo y se inspeccionaron capturas reales de Diorama y Voxel en escritorio y del recipiente rectangular en móvil: [run 40979999742](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/40979999742), [artefacto 12944302939](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/40979999742/artifacts/12944302939). |
| P0 | Paredes de vidrio | Implementadas y validadas visualmente | El renderer dibuja paredes y bordes en ambas formas. El panel inferior está debajo del sustrato; las paredes rectangulares usan opacidad menor para no velar el hábitat. El artefacto móvil actual muestra el recipiente completo. |
| P0 | Límites compartidos | Implementados y probados | `src/habitat.js` centraliza dimensiones y `constrainToHabitat`; simulación y compra de recursos lo usan. Tests de dominio comprueban límites rectangular y circular; el browser verifica distancia de cámara mínima. |
| P0 | Dependencias reproducibles | Pendiente | Generar `package-lock.json` con npm/Node compatibles, revisarlo y pasar CI a `npm ci`; no inventar el lockfile. |
| P0 | Cámara / niebla | Implementado y validado en móvil | La cámara calcula el fit mínimo por forma/aspecto; `scene.fog.near/far` escalan con la distancia para que un encuadre más lejano no lave el modelo contra el fondo. El smoke comprueba el fit y el rango de niebla para ambas formas. |
| P0 | Ajustes / estado autoritativo | Parcial | Separar claramente preferencias persistentes de la sesión y del dominio; dejar de mutar estado de partida desde UI fuera de comandos/funciones validadas. |
| P1 | Población y dimensiones iniciales | Ausente en configuración | Permitir configurar cantidad y dimensiones/tamaño, con límites validados y pruebas de colisiones/IDs. |
| P1 | Selección y ficha de isópodo | Ausente | Selección por ID estable; mostrar especie, necesidades, conducta y ciclo vital derivados del modelo, consistente entre renderers. |
| P1 | Reproducción / ciclo vital | Incompleto | Hay mortalidad simplificada, pero no nacimiento/reproducción ni eventos de ciclo vital coherentes. Separar reglas de renderer y fijar parámetros como lúdicos. |
| P1 | Descubrimientos | Ausente | Catálogo versionado, condiciones reproducibles y persistencia; no bloquear el sandbox si no se desbloquean. |
| P1 | Múltiples partidas | Ausente | Slots con IDs estables, renombrado/borrado con confirmación y gestión de errores. |
| P1 | Exportar/importar y migración | Ausente | Formato versionado, fixtures antiguos, rechazo seguro de versiones futuras e importación inválida sin alterar el estado vigente. |
| P1 | Catálogo de idioma | Ausente como sistema | Centralizar textos españoles y fallback en catálogo; no asumir que «solo español» equivale a sistema de localización implementado. |
| P1 | Sprite/atlas Voxel | Parcial frente a la decisión original | El código genera una textura pixelada mediante Canvas y la muestra como `THREE.Sprite`; está dentro de escena 3D, pero no usa un atlas/spritesheet de isópodos con procedencia registrada. Inspeccionar assets existentes antes de sustituirlo. |
| P1 | Recuperación WebGL | Ausente/no demostrada | Mostrar error recuperable si no se crea o se pierde el contexto. |
| P2 | Movimiento reducido | Parcial | CSS reduce transiciones, pero giro automático de cámara debe respetar `prefers-reduced-motion`. |
| P2 | Recursos no renderizados | Parcial | Verificar que cada tipo comprado tenga geometría adecuada, límites de colocación y roundtrip de guardado/carga. |
| P2 | Documentación | Esta sincronización corrige los estados de CI, merge, ramas y brechas del esqueleto | Mantener `README.md`, `DECISION-RENDER.md`, `SPIKE-RENDER.md` y este informe alineados con el código, evidencia y SHA reales. |

## Correcciones añadidas en esta rama

- `src/habitat.js` centraliza dimensiones de suelo y recipiente y expone una función pura para limitar posiciones.
- `src/simulation.js` usa la geometría compartida al mover animales y colocar recursos comprados.
- `src/renderers.js` crea paredes de vidrio y bordes para ambos recipientes; el vidrio inferior queda debajo del sustrato, y las paredes rectangulares tienen opacidad ajustada. Se usa sombreado estándar transparente, no transmisión física.
- Cámara: `fitDistance()` adapta distancia a geometría y aspecto; la elevación inicial ofrece mejor lectura en retrato y la niebla sigue la distancia para evitar que el modelo se pierda contra el fondo.
- `src/persistence.js` exporta `hasValidTerrariumSave()`; el menú no habilita Continuar para JSON corrupto o esquemas que el parser rechaza.
- `tests/state.test.js` cubre guardados inválidos y límites de ambas formas.
- `tests/browser-smoke.mjs` comprueba guardado corrupto, renderer real, paredes, fit y niebla en móvil, pausa, guardado/recarga y bandeja móvil.

## Puertas de calidad del framework

| Puerta | Estado actual | Evidencia |
|---|---|---|
| CODE_GATE | PASS para el alcance validado de PR #14 | Tests Node y build de producción pasaron en [run 40979999742](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/40979999742); framework checks en [run 40979999450](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/40979999450). La instalación estricta sigue pendiente por falta de lockfile. |
| GAMEPLAY_GATE | PASS para el alcance del smoke | Menú, setup, renderer, pausa, recursos, guardado/recarga y controles móviles pasan en Playwright. Esto no certifica los sistemas ausentes del esqueleto. |
| DESIGN_GATE | PASS para la corrección visual probada | Se inspeccionaron capturas actuales del artefacto 12944302939: Diorama y Voxel en escritorio y recipiente rectangular en móvil. El smoke no registró overflow ni errores de consola. |
| INTEGRATION_GATE | PENDIENTE SOLO PARA PUBLICACIÓN | PR #14 está fusionada; `main` recibió el commit `7bf5ff65521b4581126367c0190226f2115a0e9e`. Ambos workflows de PR pasaron. Falta verificar que GitHub Pages publicó ese SHA. |

## Orden de recuperación

1. **P0 — cerrar reproducibilidad:** generar `package-lock.json` de forma real, pasar CI a `npm ci` y probarlo en entorno limpio.
2. **P0 — fuente única de verdad:** separar estado de dominio, sesión, presentación y preferencias.
3. **P1 — dominio y observación:** selección/fichas, ciclo vital/reproducción y descubrimientos.
4. **P1 — persistencia completa:** slots, autoguardado, migraciones y export/import seguro.
5. **P2 — pulido transversal:** catálogo de idioma, reduced-motion, teclado, recuperación WebGL, recursos y comprobaciones en dispositivos reales.
6. No declarar el MVP completo hasta que los criterios aplicables estén PASS o tengan excepción explícita aprobada.

## Skills y fuentes

- **Locales leídas:** `game-project-orchestrator`, `game-project-skeleton`; contratos consultados en `AGENTS.md`, `framework/BASELINE-VIDEOJUEGO.md`, `framework/CONFLICTOS-Y-FUENTE-DE-VERDAD.md`, `framework/QUALITY-GATES.md`, `framework/ORCHESTRATION.md`, `framework/TASK-PROFILES.md`, `docs/CATALOGO.md`, `docs/CATALOGO-REFERENCIAS.md`, `docs/REGISTRO-SKILLS.md` y `docs/EVIDENCIA-VISUAL.md`.
- **Catalogadas, no instaladas localmente:** `game-ui-ux`, `save-systems`, `input-systems`; no se declara su ejecución como si fueran locales.
- **Skills visuales:** Anti-Slop, Ponytail, Taste e Impeccable están en el catálogo, pero `sources/manifest.tsv` no las marca como disponibles localmente. No se finge una instalación.


## Alcance nuevo: expediciones por turnos (30-10-2026)

Se incorpora una ampliación opcional, sin sustituir el sandbox libre. La especificación normativa está en [EXPEDICIONES-POR-TURNOS.md](EXPEDICIONES-POR-TURNOS.md).

| Fase | Estado | Salida / criterio |
|---|---|---|
| INTAKE | PASS | Petición convertida en bucle diario, mapa de nodos, eventos, economía y criterios verificables |
| PLAN | PASS | 5 nodos, 5 familias de eventos, PRNG persistido, 6 acciones/run y 3 mejoras definidas |
| IMPLEMENT | PENDIENTE | Sistema de dominio, persistencia v3, pantalla, inventario y mejoras |
| CODE_GATE | PENDIENTE | Pruebas de transiciones, RNG, costes, migraciones y build |
| GAMEPLAY_GATE | PENDIENTE | Expedición completa, decisiones, retorno, día siguiente y sandbox intacto |
| DESIGN_GATE | PENDIENTE | Mapa, opciones, feedback, responsive y accesibilidad en tres viewports |
| INTEGRATION_GATE | PENDIENTE | Mismo renderer y dominio, guardados antiguos compatibles y smoke completo |

La implementación se hará en la rama activa `feat/isopod-render-spike`, sin ramas paralelas. No se modifica la lógica interna de `stepSimulation`; el retorno llama a la función existente una sola vez con 1440 minutos. Las acciones del mapa no avanzan el reloj ecológico. El mapa v0.1 es autorado y conectado; los eventos y recompensas son deterministas por semilla. Combate, nuevas especies y minijuegos quedan fuera del primer corte.


## Expediciones — estado de implementación (30-10-2026)

La especificación de diseño está implementada en el dominio y conectada a una primera pantalla funcional dentro del mismo proceso de renderizado. Commit de referencia: `1ccbedfd08c249581aeb015249309f271b8411ea`; el ajuste de selectores, foco y evidencia se registra en el historial Git posterior.

| Área | Estado observado | Pendiente para PASS |
|---|---|---|
| PRNG, mapa y reglas de encuentros | Implementado; tests unitarios pasan en CI | Revisión completa de casos límite en Gameplay Gate |
| Economía y tres mejoras | Implementadas; descuentos atómicos y recursos físicos | Prueba visual y de efecto en los tres recursos |
| Persistencia v3 y migración v1/v2 | Implementada; tests unitarios pasan | Reanudar una run con browser smoke y guardado real |
| Pantalla preparación/mapa/evento/regreso | Conectada en `src/expedition/ui.js` | Playwright completo, foco y responsive |
| Identidad del renderer | Overlay no destruye canvas por diseño | Confirmación browser-side antes/después y al recargar |
| CODE_GATE | Tests y build PASS en SHA 1ccbedf | Smoke de navegador todavía FAIL |
| GAMEPLAY_GATE | PENDIENTE | Recorrido Playwright completo y casos límite |
| DESIGN_GATE | PENDIENTE | Capturas reales desktop/móvil, overflow y foco |
| INTEGRATION_GATE | PENDIENTE | Save/load, render modes y flujos previos sin regresión |

No integrar a `main` hasta que las cuatro puertas aplicables estén verificadas en el mismo SHA.


## Seguimiento histórico tras PR #18 — 30-10-2026

**Integración periódica:** PR #18, `feat(terrario): add turn-based expeditions`, fusionada mediante squash en `main`. SHA integrado: `c09945d6e5e683e96eb9a96655ee748a8b009d89`. La rama de trabajo única `feat/isopod-render-spike` quedó sincronizada al mismo SHA.

**Validación del SHA de trabajo previo al squash:** Terrario MVP checks [41071083299](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41071083299) — PASS; Framework checks [41071094067](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41071094067) — PASS; Terrario game checks [41071094062](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41071094062) terminó PASS tras el merge. El artefacto de navegador [12985955331](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41071083299/artifacts/12985955331) contiene capturas desktop y móvil, mapa de expedición 360×640/390×844/1440×1000 y liquidación; su evidence.json liga el resultado al SHA `463cf765daf8cada5b84d3009b6e7f2cf3637662`.

### Estado de requisitos visuales solicitados

| Requisito | Estado actual | Evidencia / siguiente prueba |
|---|---|---|
| Refugios con tamaño legible y animales encima | Implementado: refugio de 0.88 de longitud, offset de posado y refugio de corteza | Captura Diorama 1440×1000; añadir test que valide la regla de posado según distancia |
| Mover isópodos, alimento y refugios con Mano | Hand tool y callbacks conectados a `moveIsopod`/`moveResource`; al tocar un isópodo se activa defensa | Añadidos tests unitarios de posiciones/limites/persistencia en el lote siguiente; falta smoke de drag con puntero sobre el mesh real |
| Evitar accesos duplicados a tienda/alimento/refugios | Herramientas de colocación en barra inferior; tienda separada | Verificado por estructura/captura y smoke de compra/colocación |
| Rail de cámara plegable | Implementado | Playwright comprueba expandir/plegar y zoom táctil |
| Mano/hojarasca/refugio como herramientas | Implementado | Playwright comprueba activación y colocación; test de arrastre pendiente |
| Cabecera y pausa flotante | Pausa flotante implementada; cabecera mantiene barra superior compacta | Captura pausa flotante; refinamiento visual no bloqueante |
| Microclima sin formulario duplicado | Implementado: lectura única, medidor y stepper con límites | Captura mobile-controls y Playwright comprueba bajar humedad a 40% |
| Clima procedural | Lluvia y bruma con objetos animados | Playwright: lluvia, bruma, quitar clima y restauración desde save |
| Pantalla completa | Acciones conectadas a configuración y menú de pausa | Verificar cambio real de Fullscreen API en browser en una prueba dedicada |
| Jerarquía menú/ajustes/pausa | Implementada | Playwright comprueba foco, Escape, ayuda y pausa |
| Once variantes de carga temáticas | Implementadas; selector de 11 motivos y animación de loader | Smoke comprueba una variante por ejecución; rotación visual de las once no es aún una aserción exhaustiva |

### Estado de expediciones

La pantalla de preparación, el grafo de cinco nodos, los encuentros de decisión, inventario, tres mejoras, liquidación y restauración de run activa están conectados a `src/expedition/ui.js`. Se conserva el mismo canvas/renderer, con test de identidad antes/después de pasar por mapa y volver. El dominio no ejecuta pasos ecológicos por acción de mapa; la jornada ecológica se procesa al regresar. Tests unitarios, build y recorrido de browser del MVP están en PASS para el SHA probado.

### Despliegue Pages

Para el commit integrado `c09945d6e5e683e96eb9a96655ee748a8b009d89`, el build de Pages terminó PASS, pero el job Deploy devolvió HTTP 500 al crear la deployment: el log de [run 41071640149](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41071640149) indica explícitamente error de servidor de GitHub Pages. No apunta a fallo de compilación ni a permisos insuficientes (el job tenía `pages: write`). El workflow alternativo [41071639490](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41071639490) sigue ejecutándose; no declarar el sitio publicado hasta verificar el deployment y la URL.

### Puertas pendientes

- CODE_GATE: tests/build/análisis del SHA squash aprobados por CI; se refuerza ahora cobertura de interacción directa.
- GAMEPLAY_GATE: recorrido de expedición validado; drag sobre meshes y casos de borde quedan por demostrar en navegador.
- DESIGN_GATE: capturas reales actuales del SHA pre-squash; la siguiente ejecución sobre `main` debe volver a producir evidencia tras los cambios nuevos.
- INTEGRATION_GATE: no se observó pérdida del renderer en la expedición; deployment Pages pendiente del servicio.


## Auditoría vigente tras PR #19 — 30-10-2026

### Integración y evidencia

- `main` = `2f5dbe1c63f644f820d7897e022aabda0b7533c3`.
- `feat/isopod-render-spike` quedó sincronizada a ese mismo SHA.
- PR #19 integró el mapa y encuentros como dioramas 3D, picking por hitboxes y el kit compartido.
- SHA probado antes del squash: `99e860ad05bb06553bd29c5360dea17ab1638edd`.
- Terrario MVP [41089329251](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41089329251), Terrario game [41089338122](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41089338122) y Framework [41089338312](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41089338312): PASS.
- Evidencia Playwright [12993906214](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41089329251/artifacts/12993906214): 1440×1000, 390×844 y 360×640; Chromium 156.0.8078.4; zero console errors; no horizontal overflow.
- Pages build/deploy [41091166831](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41091166831): build y deploy PASS para el merge SHA. El workflow de verificación post-deployment [41091167637](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41091167637) también terminó PASS.

### Pendientes vigentes, por prioridad

| Prioridad | Tarea | Criterio de cierre |
|---|---|---|
| P0 | Lockfile reproducible | Versionar `package-lock.json`, sustituir `npm install` por `npm ci` en CI/Pages y probar checkout limpio. |
| P0 | Fuente única de verdad | Dominio solo cambia mediante comandos validados; preferencias, sesión y estado UI separados. Añadir tests de invariantes. |
| P1 | Vite con vulnerabilidad moderada | `package.json` fija Vite 6.4.4; npm audit detecta GHSA-8g5g-mxqh-grgj. Revisar compatibilidad y subir a versión corregida; quitar la tolerancia al nivel high tras limpiar el árbol. |
| P1 | Chunk principal >500 kB | Build informa un chunk minificado sobre 500 kB; analizar bundle y aplicar code splitting real sin elevar el límite como atajo. |
| P1 | Pulido del mapa de expedición | Más cobertura orgánica irregular, escala de props y hotspots legible; HUD no debe restar lectura al diorama. Capturas comparativas. |
| P1 | Ficha y selección de isópodo | Selección por ID estable y ficha coherente en ambos renderers. |
| P1 | Ciclo vital / descubrimientos | Reglas deterministas de nacimientos/reproducción y catálogo de descubrimientos con persistencia. |
| P1 | Persistencia completa | Autosave, slots, renombrar/borrar, backup válido, migraciones y export/import seguro. |
| P1 | Navegación ecológica | Colisionadores del dressing procedural integrados en la navegación sin acoplar reglas al renderer. |
| P2 | Accesibilidad y motion | Teclado/foco, contraste, safe areas y `prefers-reduced-motion` para la cámara y animaciones. |
| P2 | WebGL | Probar recuperación real ante pérdida de contexto, además del caso de contexto no disponible al inicio. |
| P2 | Movimiento reducido y accesibilidad | La animación de clima/actor consulta `prefers-reduced-motion`, pero la auto-rotación de cámara aún incrementa el ángulo sin comprobarlo. Añadir una prueba Playwright y ampliar teclado/foco/contraste. |
| P2 | Dispositivos físicos | Safari/iOS y Android, orientación, zoom, scroll y restauración de pestaña. |
| P2 | Toolchain CI | Avisos Node 20 en acciones de GitHub y deprecaciones `punycode`/`url.parse`; actualizar cuando las acciones/dependencias compatibles estén disponibles. |

### Decisión Voxel aclarada

La implementación actual crea el isópodo Voxel con bloques volumétricos de `THREE.InstancedMesh` en `src/renderers.js`; no utiliza un sprite Canvas 2D como representación principal. Las referencias históricas de este plan a un sprite/atlas no describen el renderer actual y deben leerse como una decisión anterior que fue sustituida por voxel volumétrico. Mantener una comprobación visual y de rendimiento antes de cerrar el criterio Voxel de la especificación.

### Skills

`game-project-orchestrator` y `game-project-skeleton` están disponibles localmente y se leyeron en esta revisión. Anti-Slop, Ponytail, Taste, Impeccable y las skills especializadas de GameDev/UI/save/input figuran en el catálogo o manifest, pero no están instaladas como copias locales validadas en este checkout.
