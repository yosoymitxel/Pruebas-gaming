# Terrario de isópodos

Sandbox ecológico de navegador centrado inicialmente en *Armadillidium vulgare*.

## Estado actual

**Vertical jugable inicial implementada; CI y smoke de navegador aprobados para el alcance probado. El MVP completo sigue NO APROBADO.**

La revisión de integración de PR #14 ejecutó y aprobó los tests unitarios, el build de producción y el smoke real de Playwright. El workflow de Terrario fue [40979999742](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/40979999742); los checks del framework fueron [40979999450](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/40979999450). El manifiesto Playwright registra el commit sintético de integración `10b3d2af6c1a4b00c5a5a5e5c340d1cc0aee7e75`, Chromium 156.0.8078.4 y viewports 1440×1000 / 390×844. Sus capturas están en el [artefacto 12944302939](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/40979999742/artifacts/12944302939).

PR #14 quedó integrada mediante squash en `main` con el commit `7bf5ff65521b4581126367c0190226f2115a0e9e`. Las correcciones documentales posteriores se trabajaron en la misma rama activa `feat/isopod-render-spike`; no se creó una rama adicional. **No se da por verificado todavía el deployment de GitHub Pages correspondiente al commit integrado.**

Incluye escena Three.js, recipientes rectangular/cilíndrico con paredes, representaciones Diorama y Voxel dentro de la misma escena, cámara orbital/táctil, ajuste de encuadre y niebla al viewport, simulación determinista mínima, controles ambientales y guardado local versionado. El smoke cubre menú, ajustes/ayuda, cambio de renderer, pausa, controles táctiles, guardado/recarga, paredes de ambas formas y viewport móvil.

Las brechas del esqueleto transversal están registradas en [PLAN-RECUPERACION-MVP.md](docs/PLAN-RECUPERACION-MVP.md). Entre ellas: fuente única de verdad aún parcial, autoguardado, exportación/importación, catálogo i18n, reproducción/fichas/descubrimientos, recuperación WebGL y atlas real de sprites Voxel. La ausencia de lockfile también impide una instalación estricta con `npm ci`.

## Arranque

Desde esta carpeta:

```sh
npm install
npm test
npm run dev
```

Verificación de producción: `npm run build`. Aún falta generar y versionar el lockfile para habilitar `npm ci`. La automatización CI ejecuta tests, build y smoke test Playwright, con capturas desktop/móvil como artefactos.

## Documentación

- [Expediciones por turnos: diseño, economía, máquina de estados y aceptación](docs/EXPEDICIONES-POR-TURNOS.md)

- [Especificación técnica y criterios de aceptación](docs/ESPECIFICACION-TERRARIO-ISOPODOS.md)
- [Decisión de render y referencias Dioramas](docs/DECISION-RENDER.md)
- [Gates y estado del spike](docs/SPIKE-RENDER.md)
- [Informe de calidad y bloqueos](docs/QUALITY-REPORT.md)
- [Matriz de cumplimiento del esqueleto y plan de recuperación](docs/PLAN-RECUPERACION-MVP.md)

## Límites

- Código, assets, pruebas y documentación exclusivos del juego viven en esta carpeta.
- No modificar ni duplicar skills compartidas.
- El cambio de renderer no debe reiniciar ni duplicar el estado.
- Humedad y temperatura son datos ilustrativos, no un modelo biológico validado.
- No declarar el MVP completo mientras los criterios aplicables del esqueleto sigan pendientes.
