# Informe de calidad — Terrario de isópodos

**Rama activa del juego:** `feat/isopod-render-spike`  
**Integración:** PR #14 fusionada mediante squash en `main`; merge commit `7bf5ff65521b4581126367c0190226f2115a0e9e`. Las correcciones documentales posteriores se trabajan en la misma rama activa.  
**Estado:** CI de PR aprobado para el alcance probado; deployment de Pages del SHA integrado pendiente de verificación. **MVP completo NO APROBADO.**

La matriz normativa del esqueleto, los sistemas ausentes y sus criterios están en [PLAN-RECUPERACION-MVP.md](PLAN-RECUPERACION-MVP.md).

## Evidencia actual de PR #14

- **Terrario game checks:** [run 40979999742](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/40979999742), job `validate` completado con éxito. Los pasos de tests unitarios, build de producción, smoke Playwright y subida de evidencia terminaron correctamente.
- **Framework checks:** [run 40979999450](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/40979999450), job `validate` completado con éxito.
- **Commit ejecutado por Playwright:** el manifiesto registra el merge ref sintético `10b3d2af6c1a4b00c5a5a5e5c340d1cc0aee7e75` (PR head `67f54cc87f2dc74f2ef2d053c5d04616b3697c61` integrado temporalmente sobre la base `6590ff5ffc7f892962d17f389015cde0ba6eacd2`). PR #14 quedó después fusionada por squash en `7bf5ff65521b4581126367c0190226f2115a0e9e`; no se afirma que esos workflows se ejecutaran después del squash.
- **Artefacto visual:** [evidencia Playwright 12944302939](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/40979999742/artifacts/12944302939), ZIP de 1.9 MB, Chromium 156.0.8078.4, viewports 1440×1000 y 390×844. Se inspeccionaron capturas de Diorama y Voxel en escritorio y del recipiente rectangular en móvil.
- El manifiesto registra menú, setup, IDs únicos, ajustes/ayuda, foco y Escape de diálogos, cambio de renderer, zoom táctil, guardado/recarga, bandeja móvil, ausencia de overflow horizontal y cero errores de consola/red.
- **GitHub Pages:** el deployment asociado al merge SHA no se ha verificado en este informe.

## Estado del esqueleto transversal

| Sistema | Estado | Hallazgo |
|---|---|---|
| Inicio / menú / nueva partida | PASS en el alcance probado | El menú carga y una partida corrupta no bloquea crear una nueva. |
| Flujo de pantallas | PARCIAL | Hay navegación funcional; falta formalizar y cubrir todas las transiciones como router/estados explícitos. |
| HUD y autoridad del estado | PARCIAL | La vista se deriva en buena medida del dominio, pero persisten mutaciones desde UI y duplicidad entre preferencias, sesión y dominio. |
| Pausa / reanudación | PASS en el smoke | Se prueba pausa y avance manual; falta ampliar pruebas de regresión de transiciones. |
| Nueva partida / reinicio | PARCIAL | Nueva partida funciona; política completa de reinicio/borrado/recuperación no está cerrada. |
| Configuración persistente | PARCIAL | Hay preferencias locales de modo visual, giro y calidad; falta prueba completa de aislamiento y persistencia de todos los ajustes aplicables. |
| Idioma | PENDIENTE | No existe catálogo i18n con fallback; cadenas españolas permanecen dispersas. |
| Temas | NO APLICA | Diorama y Voxel son representaciones del mismo mundo, no temas. |
| Guardado / carga | PARCIAL | Un único slot local, esquema v1 y validación; faltan migraciones probadas, backup válido, slots y recuperación integral. |
| Exportar / importar | PENDIENTE | No implementado. |
| Autoguardado | PENDIENTE | No implementado con puntos seguros y feedback. |
| Victoria / derrota | NO APLICA | Es un sandbox libre sin condición final obligatoria; no se inventa una pantalla terminal. |
| Ayuda | PARCIAL | Existe ayuda básica; faltan instrucciones completas y límites del modelo. |
| Input | PARCIAL | Ratón/tacto para cámara y teclado para navegación general; faltan alternativas de teclado para algunas acciones de juego. |
| Audio | PENDIENTE, no bloqueante | No existe audio; si se incorpora deberá haber controles persistentes de mute/volumen. |
| Responsive / safe areas | PASS en viewports probados; cobertura física parcial | Smoke en escritorio y 390×844; no equivale a certificar todos los dispositivos físicos. |
| Accesibilidad | PARCIAL | Diálogos y CSS reduced-motion presentes; giro automático y cobertura de foco/teclado/contraste aún incompletos. |
| Errores / diagnóstico | PARCIAL | Hay errores de persistencia visibles; falta recuperación probada ante WebGL no disponible o pérdida de contexto. |
| Build / publicación | PARCIAL | Build Vite pasa; no hay lockfile para `npm ci` y Pages del merge SHA no está verificado. |
| QA | PASS para el alcance probado | Los workflows ejecutaron tests, build, smoke y artefacto real; los sistemas incompletos no quedan aprobados por ello. |

## Brechas restantes prioritarias

- **P0 — Dependencias reproducibles:** falta `package-lock.json` y una instalación limpia con `npm ci`.
- **P0 — Fuente única de verdad:** separar preferencias, sesión y dominio; evitar que la UI cambie campos del dominio fuera de operaciones validadas.
- **P1 — Experiencia de observación:** faltan población/tamaño inicial configurable, selección/ficha de isópodo, reproducción/ciclo vital y descubrimientos.
- **P1 — Persistencia completa:** faltan autosave, slots, renombrado/borrado, migraciones y exportación/importación segura.
- **P1 — Voxel:** la textura actual se genera en Canvas y se muestra como `THREE.Sprite`; no es un atlas/spritesheet de isópodos versionado con procedencia registrada.
- **P1 — WebGL:** falta fallback/recuperación visible para contexto no disponible o perdido.
- **P2 — Accesibilidad y pulido:** la cámara automática debe respetar `prefers-reduced-motion`; ampliar teclado y pruebas en dispositivos físicos.
- **P2 — Recursos:** verificar todos los tipos comprados, su representación y su persistencia round-trip.

## Correcciones integradas en PR #14

- Geometría compartida del hábitat y límites de movimiento/compra para recipientes rectangular y cilíndrico.
- Paredes y bordes de ambos recipientes, con materiales transparentes ajustados.
- Cámara adaptada a forma/aspecto y niebla relacionada con distancia para evitar que el hábitat desaparezca en móvil.
- Validación del guardado antes de habilitar «Continuar partida».
- Tests unitarios y smoke de navegador para guardado corrupto, formas, paredes y encuadre móvil.
- Corrección de una referencia rota en la skill de orquestación y política explícita de una sola rama larga por juego.

## Puertas de calidad

| Puerta | Estado | Evidencia / cierre requerido |
|---|---|---|
| CODE_GATE | PASS para el alcance validado | Unit tests y build pasan en run 40979999742; framework checks pasan en 40979999450. Falta resolver lockfile/instalación reproducible. |
| GAMEPLAY_GATE | PASS para el alcance del smoke | Menú, setup, modo visual, pausa, recursos, guardado/recarga y controles móviles pasan. No certifica las funciones marcadas PENDIENTE/PARCIAL. |
| DESIGN_GATE | PASS para la corrección visual probada | Capturas reales del artefacto 12944302939 inspeccionadas; el smoke no registró errores de consola/red ni overflow horizontal. La cobertura de dispositivos físicos sigue parcial. |
| INTEGRATION_GATE | PENDIENTE SOLO PARA DEPLOYMENT | PR #14 está fusionada y la rama activa continúa el trabajo desde ese merge. Falta comprobar que Pages publica el SHA integrado. |

## Política de ramas aplicada

- `main`: rama compartida de integración.
- `feat/isopod-render-spike`: única rama activa de trabajo para este juego.
- `ci/terrario-pr-checks`, `fix/framework-validation`, `fix/isopod-polish` y `fix/isopod-polish-validated`: ramas históricas obviadas; no se integraron ni se borraron.
- Los cambios de implementación, pruebas y documentación se hacen en la misma rama activa; tras integrar una PR, se sincroniza con `main`.

No declarar el MVP completo hasta cerrar los sistemas aplicables del baseline o registrar excepciones explícitas y aprobadas.
