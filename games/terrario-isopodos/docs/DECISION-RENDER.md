# Decisión de render: diorama web + voxel

**Fecha:** 2026-10-29. **Estado:** spike implementado en código; build y prueba de navegador aún pendientes.

## Referencias consultadas
- [Dioramas](https://github.com/blendi-remade/dioramas): framework web cinematográfico sobre Three.js. El código tiene licencia MIT; su inventario declara los modelos e imágenes de sus carpetas públicas bajo CC BY 4.0.
- [Diorama para O3DE](https://github.com/nickschuetz/o3de-diorama): gem de O3DE para sprites y tilemaps en espacio 3D. No se integra como dependencia porque el prototipo es web y usa Three.js.
- [Three.js](https://threejs.org/): render 3D web.

## Cómo se aplican
Se toma de Dioramas el enfoque de escena central, iluminación, composición, materiales y revisión visual; no se importa su framework de landing pages, efectos de scroll, postprocesado ni generación remota de assets. El prototipo no copia assets externos.

Diorama representa al isópodo con geometría orgánica 3D. Voxel lo representa con cubos individuales dentro de la misma escena 3D: no es una imagen plana. Ambos usan los mismos IDs, posiciones y reloj de estado. Se puede alternar forma rectangular/cilíndrica, pausar, avanzar un minuto, acelerar y controlar la cámara con ratón o tacto.

## Límites
No hay aún IA ecológica, locomoción, reproducción, guardado ni calibración biológica. Humedad y temperatura son valores demostrativos. No declarar el spike aprobado hasta ejecutar instalación, tests, build y prueba visual en escritorio/móvil con evidencia real.
