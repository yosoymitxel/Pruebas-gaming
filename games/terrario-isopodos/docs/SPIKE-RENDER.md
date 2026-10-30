# Spike técnico de render — Terrario de isópodos

**Estado — 30-10-2026:** vertical jugable con renderer Three.js y expediciones 3D integrada en `main` mediante PR #19 (`2f5dbe1c63f644f820d7897e022aabda0b7533c3`). CODE/GAMEPLAY/INTEGRATION pasan para el alcance probado. DESIGN queda parcial por densidad y composición todavía insuficientes. **El MVP completo sigue NO APROBADO.**

## Decisión técnica

Se mantiene Three.js como backend 3D. Diorama y Voxel presentan el mismo estado de dominio; no se duplican colonia, reloj, necesidades, recursos ni persistencia. El renderer del terrario también representa el mapa y las escenas de encuentro, conservando la instancia WebGL.

Se toma [Dioramas](https://github.com/blendi-remade/dioramas) como referencia de composición, iluminación, materiales, cámara y revisión visual iterativa. No se incorpora su framework de landing pages ni se integra `o3de-diorama`, que está ligado a O3DE.

## Sistemas implementados

- Recipientes rectangular, cilíndrico y esférico; cámara orbital, zoom y composición responsive.
- Diorama naturalista con estratos, hojarasca, helechos, rosetas, musgo, rocas, madera, raíces y setas.
- Voxel del isópodo con geometría volumétrica de bloques instanciados en Three.js; no es una imagen plana.
- Simulación lúdica determinista, necesidades/conductas, pausa y velocidades.
- Compras/colocación de recursos, clima, ajustes locales y guardado versionado.
- Expediciones por turnos con mapa de nodos y escenas de encuentro en dioramas 3D.
- Selección por raycast de hitboxes explícitas. El dressing visual no intercepta el picking.
- Un solo canvas WebGL que cambia de host entre terrario y expedición y vuelve sin reconstruir la instancia del renderer.
- `src/diorama-kit.js` expone composición de piezas y biomas a partir de los generadores naturales de `src/terrarium-art.js`.

## Kit de dioramas dentro del juego

La API se documenta en [DIORAMA-KIT.md](DIORAMA-KIT.md). Acepta forma, radio, semilla, override de paleta, posición, altura, escala y densidad. `addAsset` incorpora una pieza y `addBiome` compone un perfil. Los perfiles actuales cubren mapa, jardín de entrada, piedra musgosa, tronco podrido, fruta caída y compost.

El kit reutiliza los generadores que ya usa el terrario principal. No contiene una segunda implementación de helechos/musgo/rocas/troncos. Su alcance actual es este juego; no es aún una biblioteca común para otros proyectos del repositorio.

## Validación de PR #19

SHA probado antes del squash: `99e860ad05bb06553bd29c5360dea17ab1638edd`.

- [Terrario MVP checks 41089329251](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41089329251): tests, build, Playwright y subida de evidencia PASS.
- [Terrario game checks 41089338122](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41089338122): PASS.
- [Framework checks 41089338312](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41089338312): PASS.
- [Artefacto Playwright 12993906214](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41089329251/artifacts/12993906214): capturas escritorio/móvil, mapa, encuentros y liquidación. Chromium 156.0.8078.4, viewports 1440×1000, 390×844 y 360×640. Sin errores de consola ni overflow horizontal.
- [Pages build/deploy 41091166831](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/41091166831): build y deployment PASS sobre el merge SHA.

Métricas registradas para la escena principal: 96 draw calls, 118.601 triángulos, 88 geometrías y 5 texturas. No representan una medición universal de rendimiento móvil.

## Revisión visual y deuda

Las capturas del mapa confirman cinco nodos físicos, senderos legibles y encuadre vertical/horizontal. También muestran áreas extensas de suelo verde sin suficiente cobertura; algunos objetos temáticos y marcadores son pequeños frente al terreno. Los encuentros funcionan, pero parte del HUD ocupa el área superior de la escena en móvil.

Próxima iteración visual:
1. Aumentar el dressing orgánico en el mapa con capas y grupos irregulares; no usar dispersión uniforme.
2. Mejorar escala/volumen de los elementos temáticos y puntos de interés.
3. Mantener claras las rutas y las hitboxes; no permitir que la vegetación bloquee el picking.
4. Reequilibrar HUD/escena en móvil y escritorio.
5. Capturar y revisar los cambios nuevos en el SHA exacto antes de marcar DESIGN_GATE PASS.

## Bloqueos del MVP fuera de este spike

- No existe `package-lock.json` versionado; CI todavía utiliza `npm install`.
- Fuente única de verdad parcial entre dominio, preferencias, sesión y UI.
- Faltan autosave, slots, backup, export/import integral y recovery completo.
- Faltan ficha/selección del isópodo, reproducción/nacimientos y descubrimientos.
- Movimiento reducido, teclado, accesibilidad y dispositivos físicos necesitan cobertura.
- Se probó el aviso al arrancar sin WebGL; la recuperación tras pérdida de contexto necesita otra prueba.

Consultar [QUALITY-REPORT.md](QUALITY-REPORT.md) y [PLAN-RECUPERACION-MVP.md](PLAN-RECUPERACION-MVP.md) para el backlog vigente.
