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
