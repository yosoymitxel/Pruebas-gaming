# Spike técnico de render — Terrario de isópodos

**Estado:** implementación inicial en la rama `feat/isopod-render-spike`; build y validación en navegador todavía pendientes.

## Decisión

Se aplica el enfoque de composición de [Dioramas](https://github.com/blendi-remade/dioramas): escena como foco visual, iluminación, materiales, cámara y revisión visual iterativa. No se incorpora el framework completo de landing pages ni su pipeline de assets remotos. La gem [Diorama de O3DE](https://github.com/nickschuetz/o3de-diorama) es específica de O3DE y no se integra en esta aplicación web Three.js.

## Implementado en código

- Vite + Three.js con versiones directas fijadas en `package.json`.
- Recipiente rectangular y cilíndrico dentro de una escena 3D.
- Renderer Diorama con geometría orgánica provisional y renderer Voxel compuesto por cubos 3D.
- Estado de dominio independiente con ID estable; cambio de modo verifica que el snapshot de dominio no cambie.
- Cámara orbital manual, zoom con rueda/pinch-equivalente de gesto, rotación automática opcional y reset.
- Reloj con pausa, avance de un minuto y velocidades de 1× a 4×.
- Pruebas unitarias del estado en `tests/state.test.js`.

## Validación pendiente

- [ ] Ejecutar `npm install`, `npm test` y `npm run build`.
- [ ] Abrir el prototipo y confirmar ausencia de errores en consola.
- [ ] Verificar ambos recipientes y ambos renderers en escritorio y móvil.
- [ ] Alternar modos repetidamente y confirmar que el estado y número de entidades permanecen estables.
- [ ] Confirmar controles táctiles, legibilidad y rendimiento en móvil.
- [ ] Guardar capturas reales y vincularlas al SHA probado.
- [ ] Generar y versionar `package-lock.json` tras instalación reproducible; hasta entonces no usar `npm ci`.

## Límites

No hay IA ecológica, locomoción autónoma, reproducción, mortalidad, persistencia ni calibración biológica. Los valores ambientales son demostrativos. El modelo del isópodo es provisional y no pretende representar anatomía científica con precisión.
