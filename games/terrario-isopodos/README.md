# Terrario de isópodos

Sandbox ecológico de navegador centrado inicialmente en *Armadillidium vulgare*.

## Estado actual

**Vertical jugable inicial implementada en código; validación de CI y navegador pendiente.** Incluye escena Three.js con recipientes rectangular/cilíndrico, representación orgánica Diorama y un sprite pixelado Voxel dentro de la escena 3D, cámara orbital/táctil, encuadre adaptable al viewport, niebla ajustada a la distancia de cámara, simulación determinista mínima, controles ambientales y guardado local versionado. Tests Node, build y smoke de Playwright pasan en el SHA de la revisión; el smoke comprueba guardados corruptos, cámara, paredes de ambos recipientes, persistencia y móvil. No es todavía el MVP completo de la especificación.

## Arranque

Desde esta carpeta:

```sh
npm install
npm test
npm run dev
```

Verificación de producción: `npm run build`. Aún falta generar y versionar el lockfile para habilitar `npm ci`. La automatización CI ejecuta tests, build y smoke test Playwright, con capturas desktop/móvil como artefactos.

## Documentación

- [Especificación técnica y criterios de aceptación](docs/ESPECIFICACION-TERRARIO-ISOPODOS.md)
- [Decisión de render y referencias Dioramas](docs/DECISION-RENDER.md)
- [Gates y estado del spike](docs/SPIKE-RENDER.md)
- [Informe de calidad y bloqueos](docs/QUALITY-REPORT.md)

## Límites

- Código, assets, pruebas y documentación exclusivos del juego viven en esta carpeta.
- No modificar ni duplicar skills compartidas.
- El cambio de renderer no debe reiniciar ni duplicar el estado.
- Humedad y temperatura son datos ilustrativos, no un modelo biológico validado.
- No declarar PASS sin ejecutar tests, build y prueba visual real en escritorio y móvil.
