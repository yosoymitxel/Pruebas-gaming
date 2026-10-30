# Informe de calidad — Terrario de isópodos

**Rama activa del juego:** `feat/isopod-render-spike`  
**Base de integración:** `main` en `6590ff5ffc7f892962d17f389015cde0ba6eacd2`.  
**Estado de la revisión:** smoke visual PASS; consolidación y merge pendientes. **MVP completo NO APROBADO.**

La matriz normativa del esqueleto, los sistemas ausentes y sus criterios está en [PLAN-RECUPERACION-MVP.md](PLAN-RECUPERACION-MVP.md).

## Evidencia actual

- **Tests de dominio:** PASS, incluidos guardados corruptos/versiones futuras y límites rectangular/cilíndrico.
- **Build de producción:** PASS.
- **Smoke de navegador:** PASS en [run 40979376927](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/40979376927).
- **Framework checks:** PASS en [run 40979376925](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/40979376925).
- **Artefacto visual:** [evidencia Playwright de la revisión](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/40979376927/artifacts/12944127529), capturada con Chromium 156.0.8078.4 a 1440×1000 y 390×844. Se inspeccionaron las capturas de menú, setup, Diorama/Voxel, bandeja móvil y recipiente rectangular móvil.
- El smoke comprueba foco del menú, IDs duplicados, selección accesible del setup, ajustes/ayuda, foco y Escape de diálogos, cambio real de renderer, zoom táctil, guardado/recarga, paredes de ambas formas, fit mínimo de cámara y rango de niebla. No hubo errores de consola/red ni overflow horizontal.

## Correcciones verificadas

- Guardado inválido: «Continuar partida» solo se habilita si el parser acepta el guardado completo.
- Geometría: `src/habitat.js` es la fuente compartida de dimensiones y límites; simulación y colocación de compras usan los límites interiores.
- Recipientes: los dos tienen paredes y borde. El panel inferior queda bajo el sustrato; las paredes rectangulares tienen opacidad menor para evitar velar el interior.
- Cámara: fit según forma/aspecto; rango de niebla ajustado a la distancia para que el terrario rectangular en móvil no desaparezca contra el fondo.
- Render: se eliminó la transmisión física del material de vidrio, causa probable del timeout previo de la captura Diorama; el smoke completo ya termina correctamente.

## Brechas del esqueleto que siguen abiertas

- Fuente única de verdad: la UI aún muta campos del dominio directamente y quedan preferencias repartidas entre sesión/estado/localStorage.
- Catálogo de idioma y fallback: textos españoles dispersos por HTML/JS.
- Guardado completo: un slot local versionado y validado, pero sin migraciones probadas, backup último bueno, autoguardado separado ni varios slots.
- Import/export versionado no implementado.
- Población/tamaño inicial configurable ausente.
- Selección/ficha de isópodo, reproducción/ciclo vital y descubrimientos ausentes.
- Voxel usa una textura pixelada de Canvas en `THREE.Sprite`, no un atlas/spritesheet de isópodos versionado con procedencia.
- Sin manejo recuperable demostrado para pérdida/no disponibilidad de WebGL.
- La cámara automática no consulta aún `prefers-reduced-motion`.
- No existe `package-lock.json` ni instalación estricta `npm ci`.
- Audio pendiente y no bloqueante según el alcance actual.

## Puertas de calidad

| Puerta | Estado | Evidencia / cierre requerido |
|---|---|---|
| CODE_GATE | PASS para la revisión probada | Tests Node y build pasan. Lockfile/instalación reproducible permanece como brecha P0 independiente. |
| GAMEPLAY_GATE | PASS para el alcance de smoke | Menú, setup, pausa, modo, recursos, guardado/recarga y controles móviles pasan. El esqueleto completo aún no está implementado. |
| DESIGN_GATE | PASS para la corrección visual probada | Capturas recientes de escritorio y móvil revisadas; ambos modos/formas en smoke, rectángulo móvil legible, sin overflow ni errores de consola. |
| INTEGRATION_GATE | PENDIENTE | Falta consolidar en un commit, repetir CI sobre el SHA único, merge de PR #14 y confirmar workflows post-merge/deployment de Pages. |

## Criterio de cierre de esta tarea

- [x] Tests Node y build de producción.
- [x] Smoke de Playwright sin timeout ni errores de consola/red.
- [x] Capturas reales de escritorio/móvil, modos Diorama/Voxel y ambas formas.
- [x] Inspección visual de la captura rectangular móvil después del arreglo de niebla.
- [ ] Consolidar cambios en un solo commit en la única rama activa del juego.
- [ ] Repetir checks en el SHA final consolidado.
- [ ] Merge de PR #14, workflows posteriores y deployment de Pages del SHA integrado.

No declarar el MVP completo hasta recuperar y probar los sistemas pendientes del baseline transversal.
