# Informe de calidad — Terrario MVP

- Rama: `feat/isopod-render-spike`
- Alcance: vertical jugable inicial de simulación sandbox.
- Skills locales leídas: `game-project-orchestrator`, `game-project-skeleton`.
- Referencia visual aplicada: Dioramas, como guía de composición; no se declara instalada como skill.
- Skills externas catalogadas no se consideran ejecutadas.

## Resultado de CI y gates

**Ejecución confirmada:** [Terrario MVP checks](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/40927433681), SHA `64d55dc693a9bd4d551dffd838bbdac1b8871045`, conclusión **success**.

| Puerta | Estado | Evidencia |
|---|---|---|
| CODE_GATE | PASS en el SHA indicado | `npm install`, `npm test` y `npm run build` terminaron correctamente en GitHub Actions. |
| GAMEPLAY_GATE | PASS limitado al smoke test | Playwright cambió ambos modos, probó ambos recipientes, avanzó el reloj, confirmó la cantidad de entidades y terminó sin errores de consola/red. No sustituye la validación de toda la ecología. |
| DESIGN_GATE | PARTIAL | Capturas reales generadas para 1440×1000 y 390×844; no se detectó overflow horizontal móvil. El artefacto existe, pero requiere inspección humana de composición, legibilidad y fidelidad visual. |
| INTEGRATION_GATE | PARTIAL/BLOCKED | Build de producción pasa; falta probar hosting final y completar el alcance de la especificación. |

Artefacto de capturas (retención de 14 días): [descargar evidencia visual](https://github.com/yosoymitxel/Pruebas-gaming/actions/runs/40927433681/artifacts/12920753011).

## Funciones implementadas en esta vertical

- Diorama orgánico provisional y modo cúbico 3D.
- Recipiente rectangular/cilíndrico.
- Cámara orbital táctil, zoom, reinicio y rotación automática.
- Reloj acumulativo, pausa, avance manual y aceleración con límite de pasos por frame.
- Simulación determinista mínima por pasos: energía/hidratación/estrés, exploración, búsqueda de comida/refugio, consumo de hojarasca y límites según la forma del recipiente.
- Controles de humedad/temperatura y acciones para añadir recursos.
- Guardado local versionado con validación antes de restaurar.
- Tests unitarios de estado, simulación y persistencia.
- CI con tests, build y smoke test Playwright; capturas reales desktop/móvil como artefactos.

## Desviaciones abiertas respecto a la especificación

- El modo Voxel usa geometría cúbica 3D; falta sprites voxelizados desde atlas/spritesheets.
- No hay ciclo vital completo, muda, reproducción, nacimientos, mortalidad balanceada ni sistema de descubrimientos.
- No hay flujo completo BOOT → MAIN_MENU → TERRARIUM_SETUP → PLAYING ↔ PAUSED, ni gestión de varios guardados, renombrado, borrado con confirmación, configuración global e i18n.
- El guardado usa un único slot y no implementa migraciones entre versiones.
- Los parámetros biológicos son heurísticos de juego, no valores científicamente validados.
- Falta `package-lock.json` versionado; CI usa `npm install`, no `npm ci`.

## Próximos hitos

1. Versionar lockfile reproducible y cambiar CI a `npm ci`.
2. Inspeccionar las capturas de escritorio y móvil, no solo generarlas.
3. Implementar sprites voxelizados/atlas, ciclo vital y guardados múltiples/migrables.
4. Completar flujo de pantallas y localización.
5. Probar persistencia tras recarga real y casos de almacenamiento lleno/corrupto.
6. Repetir todas las puertas para el SHA final; no declarar MVP final mientras las desviaciones esenciales sigan abiertas.
