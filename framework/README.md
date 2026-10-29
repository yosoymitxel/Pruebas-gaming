# Game Quality Framework

Este directorio define el contrato operativo del framework. No es una lista pasiva de skills: fija fases, filtros obligatorios, criterios de salida y evidencias exigidas.

## Principio de funcionamiento
Las skills aportan procedimientos especializados; el framework controla el orden, las decisiones y las puertas de calidad. Una skill no puede saltarse una puerta ni declarar aprobado su propio trabajo sin evidencia.

## Pipeline obligatorio

INTAKE → INSPECT → PLAN → IMPLEMENT → CODE_GATE → GAMEPLAY_GATE → DESIGN_GATE → INTEGRATION_GATE → REPORT

Las puertas se aplican según el alcance, pero **Código, Gaming y Diseño siempre tienen un filtro de calidad**. Si una dimensión no cambia, se registra como NOT_APPLICABLE con motivo; nunca se omite silenciosamente.

1. Intake: convertir la petición en requisitos y criterios de aceptación comprobables.
2. Inspect: revisar repo, arquitectura, instrucciones, assets, dependencias, estado Git y pruebas actuales.
3. Plan: elegir skills según la matriz de tareas; explicar qué aporta cada una y definir pruebas antes de tocar código.
4. Implement: ejecutar cambios pequeños y conservar mecánicas y assets existentes salvo necesidad justificada.
5. Code gate: lint/tests/build relevantes, errores, seguridad de dependencias y revisión del diff.
6. Gameplay gate: comprobar flujo real, reglas, controles, estados, reinicio, victoria/derrota y errores de consola que correspondan.
7. Design gate: comprobar jerarquía, consistencia, legibilidad, estados, accesibilidad y responsive; capturas reales para cambios visuales.
8. Integration gate: verificar que la solución funciona en conjunto y que no rompe sistemas existentes.
9. Report: registrar pruebas ejecutadas, evidencia, resultado por puerta y riesgos pendientes.

## Estados permitidos
- PASS: criterio satisfecho con evidencia.
- FAIL: hay un fallo reproducible; no se aprueba la entrega.
- BLOCKED: no se pudo comprobar por falta de entorno, credenciales o herramienta.
- NOT_APPLICABLE: no corresponde al alcance y hay una justificación escrita.

Un build exitoso no equivale a juego funcional. Una captura no demuestra que la interacción funcione. Una revisión de código no demuestra que el resultado visual sea correcto.

## Contratos por dimensión
- [Orquestación](ORCHESTRATION.md)
- [Puertas de calidad](QUALITY-GATES.md)
- [Perfiles de tarea](TASK-PROFILES.md)
- [Formato de informe](REPORT-TEMPLATE.md)

## Extensibilidad
Los perfiles declaran skills sugeridas y pruebas mínimas. Las skills externas se leen completas cuando se activan. Si dos skills se contradicen, prevalece este contrato del framework, luego los requisitos del proyecto y después la recomendación más específica y verificable.
