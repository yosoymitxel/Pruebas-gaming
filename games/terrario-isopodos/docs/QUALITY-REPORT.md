# Informe de calidad — Terrario de isópodos

- Rama de trabajo: `feat/isopod-render-spike`
- Estado: **revisión correctiva en curso; no aprobado como MVP final**.
- Alcance de esta revisión: flujo de inicio, estado de colonia, coherencia del hábitat, renderers, persistencia y pruebas de navegador.

## Correcciones en el código actual

- El menú de inicio y la configuración inicial son estados reales; el smoke test debe recorrerlos antes de esperar el canvas del juego.
- Un terrario nuevo reinicia el estado de dominio en vez de reutilizar accidentalmente la colonia anterior.
- La forma del recipiente se elige al crear el terrario; no se cambia durante la sesión. Esto sigue la especificación normativa.
- La colonia inicial contiene cinco entidades con IDs estables.
- El modo Voxel usa un sprite pixelado con filtrado nearest, en lugar de reutilizar el modelo orgánico con cajas 3D.
- El entorno incorpora grupos de musgo, capas de sustrato más legibles y un ajuste de iluminación; el isópodo orgánico se escala para reducir su aspecto desproporcionado.
- La temperatura afecta al estrés mediante parámetros lúdicos centralizados y documentados como heurísticos, no como biología validada.
- Al entrar desde una pantalla oculta, el renderer recalcula explícitamente el tamaño del canvas.
- El guardado conserva el nombre del terrario además del estado de dominio.

## Baseline del esqueleto (game-project-skeleton)

| Sistema | Estado | Criterio / motivo |
|---|---|---|
| Menú, nueva partida y continuar | PENDIENTE | Menú y setup existen; continuar debe pasar Playwright tras guardar y recargar. |
| Flujo de pantallas | PENDIENTE | Menú → setup → juego → pausa → menú; verificar transiciones sin estados ocultos. |
| Estado autoritativo y HUD | INCLUIR | El modelo de estado gobierna reloj, colonia y condiciones; comprobar coherencia en navegador. |
| Pausa y reanudación | PENDIENTE | Verificar que el tiempo se detiene y reanuda sin salto. |
| Ajustes persistentes | PENDIENTE | Giro automático y calidad guardados; falta probar restauración real. |
| Localización | NO APLICA por ahora | MVP inicial solo en español; documentar antes de ampliar idiomas. |
| Temas | NO APLICA por ahora | No hay catálogo de temas; no fingir que existe. |
| Guardado/carga versionados | PENDIENTE | Esquema v1 y validación existen; prueba de navegador falló en el botón Continuar. |
| Exportar/importar | PENDIENTE | No implementado; criterio: exportación versionada y rechazo de datos inválidos sin mutar partida. |
| Fin/victoria/derrota | NO APLICA | Sandbox ecológico sin condición terminal definida. |
| Audio | NO APLICA por ahora | No hay audio en el MVP actual. |
| Responsive/accesibilidad | PENDIENTE | Capturas actuales y prueba de overflow móvil requeridas. |
| Build y QA | PENDIENTE | Tests y build pasaron en el SHA anterior; smoke de navegador falló y debe repetirse tras corregir. |

## Orquestación aplicada (game-project-orchestrator)

- Tipo: simulación sandbox 3D para navegador; tareas: estado/dominio, flujo de pantallas, renderizado y QA de integración.
- Reutilización: estado y simulación existentes; dos renderers sobre el mismo estado; persistencia local existente. No se introduce motor ni dependencia de runtime nueva.
- Orden: contrato de estado y guardado → menú/setup/pausa → renderers → smoke de navegador y capturas. Riesgo prioritario: estado real del juego y UI divergen durante pause/resume/save-load.
- Validación exigida: tests de dominio, build de producción, Playwright real, consola/red limpia, escritorio 1440×1000 y móvil 390×844. Los artefactos deben salir de la revisión exacta.

## Puertas de calidad

| Puerta | Estado | Evidencia / condición |
|---|---|---|
| CODE_GATE | PENDIENTE de ejecución en el SHA actual | Los tests unitarios pasaron en el primer commit correctivo; el build detectó un error de sintaxis en el renderer, corregido en el commit siguiente. No afirmar PASS hasta ejecutar el build sobre el HEAD actual. |
| GAMEPLAY_GATE | PENDIENTE | El smoke test anterior expiraba esperando el canvas mientras el menú de inicio seguía visible. Se actualizó para recorrer menú, configuración, ambos recipientes, cambio de renderer, reloj, colonia y guardado/recarga. Falta ejecutar la versión actual. |
| DESIGN_GATE | PENDIENTE | Las capturas anteriores corresponden a un SHA anterior y muestran una escena demasiado vacía y un isópodo desproporcionado. No sirven como evidencia de la revisión actual. Hace falta inspeccionar capturas nuevas de escritorio y móvil. |
| INTEGRATION_GATE | BLOCKED hasta validar y publicar el SHA aprobado | El workflow de Pages construye y publica desde `main`; una rama de trabajo no actualiza por sí sola la URL pública. |

## Pendientes antes de aprobar

1. Ejecutar tests, build y smoke test Playwright en el HEAD actual.
2. Inspeccionar las capturas actuales y corregir cualquier defecto visual/responsive que muestren.
3. Validar interacción táctil, pausa/reanudación, persistencia tras recarga y ausencia de errores de consola/red.
4. Completar el alcance MVP pendiente: ciclo vital, IA ecológica más completa, guardados múltiples/migrables, ajustes/localización y ficha/descubrimientos según la especificación.
5. Verificar que el deployment público corresponde al SHA aprobado antes de usarlo como evidencia.

**No declarar el MVP terminado mientras alguna puerta aplicable permanezca en FAIL o BLOCKED.**
