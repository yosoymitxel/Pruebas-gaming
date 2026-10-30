# Spike técnico de render — Terrario de isópodos

**Estado:** vertical jugable inicial implementada; smoke visual actual PASS. El MVP completo sigue sin aprobarse mientras queden brechas del esqueleto transversal.

## Decisión técnica

Se aplica el enfoque de composición de [Dioramas](https://github.com/blendi-remade/dioramas): escena como foco visual, iluminación, materiales, cámara y revisión visual iterativa. No se incorpora el framework completo de landing pages ni un pipeline de assets remotos. [o3de-diorama](https://github.com/nickschuetz/o3de-diorama) es específico de O3DE y no se integra como dependencia de esta aplicación web Three.js.

## Implementado en código

- Vite + Three.js con dependencias directas fijadas en `package.json`.
- Recipientes rectangular y cilíndrico con base, paredes de vidrio y bordes superiores.
- Renderer Diorama con geometría orgánica provisional.
- Modo Voxel que genera una textura pixelada con Canvas 2D y la presenta como `THREE.Sprite` dentro de la escena 3D. No es un modelo de vóxeles volumétricos y no usa todavía un atlas/spritesheet de assets versionado.
- Estado de dominio independiente con IDs estables; cambio de modo no debe modificar el snapshot del dominio.
- Geometría y límites comunes en `src/habitat.js`; movimiento y colocación de compras se restringen a la superficie interior.
- Cámara con distancia mínima adaptada a la forma y al viewport, elevación inicial más útil para dioramas y rango de niebla escalado con la distancia.
- Panel de vidrio inferior bajo el sustrato; paredes rectangulares con opacidad reducida para que no oscurezcan el contenido.
- Cámara orbital por arrastre, zoom de rueda/gesto táctil, botones de zoom y rotación automática opcional.
- Reloj, pausa, avance manual, velocidades de 0.5× a 4×, necesidades y conductas biológicas simplificadas.
- Controles de humedad/temperatura, compra de recursos, monedas y guardado local versionado.
- `Continuar partida` valida el esquema antes de habilitarse para evitar tratar JSON corrupto como una partida restaurable.

## Resultado de validación conocido

- Pruebas unitarias: PASS en la revisión actual.
- Build de producción: PASS en la revisión actual.
- Playwright: PASS en [run 40979376927](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/40979376927), con tests de guardado corrupto, cambio de renderer, pausa, tienda, guardado/recarga y vista móvil.
- Evidencia visual inspeccionada: [artefacto Playwright exacto de la revisión](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/40979376927/artifacts/12944127529). El recipiente rectangular ahora es legible, no se recorta y no queda oculto por la niebla.
- La validación no convierte en completo el MVP; permanecen las brechas del esqueleto enumeradas abajo.

## Validación pendiente

- [x] Tests Node y build de producción de la revisión actual.
- [x] Smoke test completo sin timeout ni errores de consola/red.
- [x] Capturas reales nuevas de menú, setup y gameplay en Diorama y Voxel.
- [x] Ambos recipientes con fit de cámara validado en escritorio/móvil.
- [x] Alternancia de modo, pausa/reanudación, cámara y guardado/recarga en una sesión.
- [x] Inspección de capturas reales actuales; el rectángulo móvil ya no se vela por la niebla.
- [ ] Crear `package-lock.json` con Node/npm compatibles y cambiar CI a `npm ci`.

## Límites del prototipo

No hay aún reproducción, ficha/selección de individuo, sistema de descubrimientos ni calibración biológica. La mortalidad y el comportamiento son heurísticas lúdicas; humedad y temperatura no son un modelo científico validado. Véase [PLAN-RECUPERACION-MVP.md](PLAN-RECUPERACION-MVP.md) para la tabla completa del esqueleto y las prioridades.
