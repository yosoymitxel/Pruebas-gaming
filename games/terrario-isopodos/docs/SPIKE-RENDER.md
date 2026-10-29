# Spike técnico de render — Terrario de isópodos

**Estado:** spike de render implementado en código; no aprobado como MVP. La instalación, build y validación visual real deben completarse antes de cerrar las puertas de calidad.

## Decisión

Se aplica el enfoque de composición de [Dioramas](https://github.com/blendi-remade/dioramas): escena como foco visual, iluminación, materiales, cámara y revisión visual iterativa. No se incorpora el framework completo de landing pages ni su pipeline de assets remotos. La gem [Diorama de O3DE](https://github.com/nickschuetz/o3de-diorama) es específica de O3DE y no se integra como dependencia en esta aplicación web Three.js.

## Implementado en código

- Vite + Three.js con versiones directas fijadas en `package.json`.
- Recipiente rectangular y cilíndrico dentro de una escena 3D.
- Renderer Diorama con geometría orgánica provisional y renderer Voxel compuesto por cubos 3D.
- Estado de dominio independiente con ID estable; cambio de modo comprueba que el snapshot de dominio no cambie.
- Cámara orbital por arrastre, zoom de rueda y rotación automática opcional.
- Reloj acumulativo con pausa, avance manual y velocidades de 1× a 4×.
- Pruebas unitarias del estado en `tests/state.test.js`.
- Workflow CI para ejecutar tests y build en la rama del spike.

## Validación pendiente

- [ ] Revisar resultado del workflow `Terrario MVP checks`.
- [ ] Ejecutar tests y build en CI.
- [ ] Abrir el prototipo y confirmar ausencia de errores de consola y red.
- [ ] Verificar ambos recipientes y ambos renderers en escritorio y móvil.
- [ ] Alternar modos repetidamente y confirmar que estado e IDs permanecen estables.
- [ ] Confirmar controles táctiles, legibilidad, overflow y rendimiento en móvil.
- [ ] Guardar capturas reales y vincularlas al SHA probado.
- [ ] Generar y versionar `package-lock.json`; cambiar CI a `npm ci`.

## Límites

No hay IA ecológica, locomoción autónoma, reproducción, mortalidad, persistencia ni calibración biológica. Los valores ambientales son demostrativos. El modo Voxel actual es una aproximación 3D cúbica y **no cumple todavía** la decisión especificada de sprites voxelizados desde atlas/spritesheets.
