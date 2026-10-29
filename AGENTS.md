# Instrucciones obligatorias para agentes

Este repositorio mantiene el framework reutilizable de calidad para videojuegos y el repertorio versionado de skills.

## Antes de trabajar
1. Lee AGENTS.md, README.md, framework/README.md, framework/ORCHESTRATION.md, framework/QUALITY-GATES.md y framework/TASK-PROFILES.md.
2. Lee skills/INDEX.md y docs/REGISTRO-SKILLS.md para localizar el contenido ya versionado.
3. Clasifica la tarea y lee de principio a fin los SKILL.md relevantes que existan en el checkout. **No pidas reinstalar una skill que ya está en el repositorio.**
4. Distingue siempre: disponible localmente, leída en esta tarea y aplicada/ejecutada. No declares uno de estos estados basándote en otro.
5. Si el checkout no contiene una skill, consulta sources/manifest.tsv y docs/CATALOGO.md. No afirmes que está instalada si solo hay una URL catalogada.
6. Define criterios de aceptación y pruebas antes de implementar.
7. Inspecciona el proyecto destino y reutiliza su arquitectura, mecánicas, assets y animaciones existentes.
8. Ejecuta y registra CODE_GATE, GAMEPLAY_GATE y DESIGN_GATE. Marca NOT_APPLICABLE con motivo o BLOCKED si no se puede probar.
9. No declares una tarea terminada si una puerta aplicable está en FAIL o BLOCKED.
10. No inventes pruebas, capturas, resultados o instalaciones.
11. Revisa licencias, procedencia y scripts antes de ejecutar o redistribuir contenido de terceros.
12. No crees la carpeta juegos/ durante la fase actual; primero se valida el framework.

## Actualizar skills
Cuando se incorpore o actualice una skill, revisa procedencia/licencia, ejecuta bash scripts/validate-skills.sh y bash scripts/index-skills.sh, actualiza el manifest con el estado real y revisa el diff. No actualices fuentes upstream a ciegas ni integres automáticamente contenido no revisado.

Mantén cambios pequeños, reversibles y verificables. Build verde no significa juego funcional. Un mockup no prueba la implementación real.
