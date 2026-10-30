# Plan de recuperación del MVP — Terrario de isópodos

**Auditoría normativa:** `framework/BASELINE-VIDEOJUEGO.md` y `framework/CONFLICTOS-Y-FUENTE-DE-VERDAD.md`.  
**Producto:** [Especificación técnica](ESPECIFICACION-TERRARIO-ISOPODOS.md).  
**Base de auditoría:** `main` en `6590ff5ffc7f892962d17f389015cde0ba6eacd2` (29-10-2026), contrastada con el código de la rama activa.  
**Integración actual:** PR #14 se fusionó mediante squash en `main` como `7bf5ff65521b4581126367c0190226f2115a0e9e`; las correcciones documentales posteriores se mantienen en la única rama activa `feat/isopod-render-spike`.  
**Validación de PR #14:** Framework checks [40979999450](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/40979999450) y Terrario checks [40979999742](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/40979999742) terminaron correctamente. Playwright registró el merge ref `10b3d2af6c1a4b00c5a5a5e5c340d1cc0aee7e75`; su evidencia está en el [artefacto 12944302939](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/40979999742/artifacts/12944302939). No se ha verificado todavía el deployment de Pages del SHA integrado.  
**Estado general:** vertical jugable; **MVP completo NO APROBADO**. No confundir código presente con criterio de aceptación demostrado.

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
