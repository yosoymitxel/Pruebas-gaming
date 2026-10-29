# Terrario de isópodos

Sandbox ecológico de navegador centrado inicialmente en *Armadillidium vulgare*.

## Estado actual

**Spike inicial implementado en código; ejecución y validación visual pendientes.** Incluye escena Three.js, recipientes rectangular/cilíndrico, representación Diorama y Voxel, cámara orbital con tacto, reloj/pausa/aceleración y pruebas unitarias del estado.

## Arranque

Desde esta carpeta:

```sh
npm install
npm test
npm run dev
```

Verificación de producción: `npm run build`. No se incluye todavía un lockfile; tras la primera instalación validada se debe generar y versionar para habilitar `npm ci`.

## Documentación

- [Especificación técnica y criterios de aceptación](docs/ESPECIFICACION-TERRARIO-ISOPODOS.md)
- [Decisión de render y referencias Dioramas](docs/DECISION-RENDER.md)
- [Gates y estado del spike](docs/SPIKE-RENDER.md)

## Límites

- Código, assets, pruebas y documentación exclusivos del juego viven en esta carpeta.
- No modificar ni duplicar skills compartidas.
- El cambio de renderer no debe reiniciar ni duplicar el estado.
- Humedad y temperatura son datos ilustrativos, no un modelo biológico validado.
- No declarar PASS sin ejecutar tests, build y prueba visual real en escritorio y móvil.
