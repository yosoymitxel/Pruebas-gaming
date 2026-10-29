# Instrucciones obligatorias para agentes

Este repositorio mantiene el framework reutilizable de calidad para videojuegos. Antes de trabajar en él o usarlo desde otro juego:

1. Lee `framework/README.md`, `framework/ORCHESTRATION.md`, `framework/QUALITY-GATES.md` y `framework/TASK-PROFILES.md`.
2. Clasifica la tarea y lee los SKILL.md relevantes de principio a fin.
3. Define criterios de aceptación y pruebas antes de implementar.
4. Inspecciona el proyecto destino y reutiliza su arquitectura, mecánicas, assets y animaciones existentes.
5. Ejecuta y registra CODE_GATE, GAMEPLAY_GATE y DESIGN_GATE. Marca NOT_APPLICABLE con motivo o BLOCKED si no se puede probar.
6. No declares una tarea terminada si una puerta aplicable está en FAIL o BLOCKED.
7. No inventes pruebas, capturas, resultados o instalaciones.
8. Revisa licencias, procedencia y scripts antes de ejecutar o redistribuir contenido de terceros.
9. No crees la carpeta juegos/ durante la fase actual; primero se valida el framework.

Mantén cambios pequeños, reversibles y verificables. Build verde no significa juego funcional. Un mockup no prueba la implementación real.
