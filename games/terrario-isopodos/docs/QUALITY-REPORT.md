# Informe de calidad — Terrario MVP

- Rama: `feat/isopod-render-spike`
- Alcance: primera vertical jugable de simulación sandbox, todavía no MVP final de especificación.
- Skills locales leídas: `game-project-orchestrator`, `game-project-skeleton`.
- Referencia visual aplicada: Dioramas, solo como guía de composición; no se declara instalada como skill.
- Skills externas catalogadas no se consideran ejecutadas.

## Estado de puertas

| Puerta | Estado | Evidencia |
|---|---|---|
| CODE_GATE | BLOCKED | Las pruebas unitarias nuevas se añadieron, pero el entorno de trabajo no pudo resolver github.com para clonar/instalar dependencias. CI debe ejecutarlas. |
| GAMEPLAY_GATE | BLOCKED | Prueba Playwright incluida para modos, formas, reloj, identidad, errores y viewport; no hay ejecución de workflow confirmada aún. |
| DESIGN_GATE | BLOCKED | Se configuró captura desktop/móvil en CI. Falta inspeccionar artefactos reales vinculados al SHA. |
| INTEGRATION_GATE | BLOCKED | No se ha verificado build de producción ni hosting. |

## Funciones de esta vertical

- Diorama orgánico provisional y modo cúbico 3D.
- Recipiente rectangular/cilíndrico.
- Cámara orbital táctil, zoom, reinicio y rotación automática.
- Reloj acumulativo, pausa, avance manual y aceleración con límite de pasos por frame.
- Simulación determinista por pasos: energía/hidratación/estrés, exploración, búsqueda de comida/refugio, consumo de hojarasca y límites según la forma del recipiente.
- Controles de humedad y temperatura, añadir hojarasca/refugio.
- Guardado local versionado con validación antes de restaurar.
- Tests unitarios de estado, simulación y persistencia.
- Workflow de test/build y smoke test Playwright con capturas como artefactos.

## Desviaciones aún abiertas

- El modo Voxel usa geometría cúbica 3D; falta sprites voxelizados desde atlas/spritesheets como exige la especificación.
- No hay ciclo de vida completo, muda, reproducción, nacimientos, mortalidad balanceada ni sistema de descubrimientos.
- No hay flujo completo BOOT → MAIN_MENU → TERRARIUM_SETUP → PLAYING ↔ PAUSED, ni gestión de varios guardados, renombrado, borrado con confirmación, configuración global e i18n.
- El guardado local usa un único slot y no implementa migraciones entre versiones.
- Los parámetros biológicos son heurísticos de juego, no valores científicamente validados.
- No hay `package-lock.json`; CI aún usa `npm install` y no asegura instalaciones reproducibles con `npm ci`.

## Siguiente secuencia

1. Obtener resultados reales del workflow y corregir los fallos.
2. Crear lockfile reproducible y cambiar CI a `npm ci`.
3. Inspeccionar capturas Playwright reales.
4. Implementar sprites voxelizados/atlas, ciclo vital y guardados múltiples/migrables.
5. Completar flujo de pantallas y localización.
6. Repetir CODE, GAMEPLAY, DESIGN e INTEGRATION gates; no aprobar mientras haya bloqueos.
