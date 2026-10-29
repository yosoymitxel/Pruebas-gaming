# Informe de calidad — Terrario MVP

- Rama: `feat/isopod-render-spike`
- Alcance: spike de render y controles iniciales.
- Skills locales leídas en esta tarea: `game-project-orchestrator`, `game-project-skeleton`.
- Referencia aplicada como guía visual: Dioramas. No es una skill local instalada.
- Skills externas solo catalogadas: no se afirma que estén instaladas, leídas o ejecutadas.

## Puertas de calidad

| Puerta | Estado actual | Evidencia / motivo |
|---|---|---|
| CODE_GATE | BLOCKED hasta CI | La prueba de estado se ejecutó localmente contra el contenido actual: 5/5 pasan. Build de Vite y dependencias aún deben verificarse en CI. |
| GAMEPLAY_GATE | BLOCKED hasta navegador | Se añadió prueba Playwright para cambiar modo/forma, avanzar reloj, comprobar ID/cantidad y detectar errores. No se declara aprobada hasta ver el resultado real del workflow. |
| DESIGN_GATE | BLOCKED hasta revisión visual | CI genera capturas reales desktop 1440×1000 y móvil 390×844 como artefacto. Deben inspeccionarse y corresponder al SHA exacto. |
| INTEGRATION_GATE | BLOCKED | No hay evidencia confirmada de ejecución de producción/hosting; la simulación ecológica y persistencia no están implementadas. |

## Desviaciones frente a la especificación

- Voxel actual usa geometría cúbica 3D; falta el sistema especificado de sprites voxelizados con atlas/spritesheets.
- No hay necesidades ecológicas, locomoción autónoma, alimentación, refugios con comportamiento, reproducción ni mortalidad.
- No hay persistencia local versionada, menú de inicio/configuración completo, ajustes ni catálogo i18n.
- El isópodo es provisional y estático. Este prototipo de render no equivale al MVP ecológico.
- Falta `package-lock.json`; CI usa `npm install` y no puede garantizar aún instalaciones reproducibles con `npm ci`.

## Siguiente secuencia

1. Confirmar ejecución real del workflow y resolver fallos.
2. Generar/versionar lockfile y cambiar CI a `npm ci`.
3. Revisar las capturas Playwright y registrar errores reales de consola/red.
4. Completar estado/simulación determinista sin renderer.
5. Implementar guardado local versionado y variables ecológicas mínimas.
6. Reemplazar Voxel cúbico por sprites voxelizados/atlas.
7. Repetir todas las puertas. No aprobar mientras una puerta aplicable siga BLOCKED.
