# Informe de calidad — Terrario MVP

- Rama: `feat/isopod-render-spike`
- Base técnica: Three.js + Vite
- Alcance evaluado: spike de render y controles iniciales
- Skills locales leídas: `game-project-orchestrator`, `game-project-skeleton`
- Referencia de composición aplicada: Dioramas (no es una skill local instalada)
- Skills externas solo catalogadas, no ejecutadas: Anti-Slop, Ponytail, Taste, Impeccable, GameDev skill catalog, Claude Code Game Studios, Emil Skills, Web Design Guidelines y otras del catálogo.

## Puertas de calidad

| Puerta | Estado actual | Evidencia / motivo |
|---|---|---|
| CODE_GATE | BLOCKED | Se corrigió la acumulación del reloj y se añadieron pruebas; falta ejecutar `npm install`, `npm test` y `npm run build` en runner. |
| GAMEPLAY_GATE | BLOCKED | Hay controles de cámara, forma, modo, pausa y avance manual en el código, pero no se ha probado el flujo real en navegador. No hay IA ecológica. |
| DESIGN_GATE | BLOCKED | La escena 3D está implementada, pero faltan capturas reales del SHA probado en escritorio y móvil. |
| INTEGRATION_GATE | BLOCKED | Aún no se ha comprobado ejecución de producción ni el comportamiento en hosting. |

## Desviaciones respecto a la especificación

- El modo Voxel usa geometría cúbica 3D, no sprites voxelizados desde atlas/spritesheets.
- La simulación ecológica aún no implementa necesidades, movimiento autónomo, alimento, refugios, reproducción ni mortalidad.
- No hay guardado/carga local versionado, configuración inicial, menú principal completo, ajustes ni catálogo de idioma.
- El isópodo provisional es una sola entidad estática; la escena no constituye todavía un MVP ecológico.
- No existe `package-lock.json` versionado en este estado; la instalación reproducible aún debe cerrarse.

## Próxima secuencia obligatoria

1. Ejecutar CI real y resolver cualquier fallo de test/build.
2. Obtener lockfile y cambiar CI a `npm ci`.
3. Verificar escena en navegador real con errores de consola/red registrados.
4. Capturar escritorio y móvil con SHA, viewport, fecha y pasos.
5. Completar contrato de estado y simulación determinista sin renderer.
6. Implementar persistencia versionada y controles ecológicos mínimos.
7. Sustituir la aproximación voxel cúbica por sprites voxelizados/atlas según especificación.
8. Volver a ejecutar todas las puertas y actualizar este informe; no aprobar mientras alguna puerta aplicable siga BLOCKED.
