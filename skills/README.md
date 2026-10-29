# Skills propias y curadas

Esta carpeta contiene skills originales, adaptaciones mantenidas por el proyecto y el índice del repertorio.

Las skills externas instaladas se versionan en .agents/skills y/o .claude/skills para que permanezcan en Git y puedan ser leídas en futuros checkouts. No copies manualmente el mismo contenido aquí sin una razón clara: evita duplicados divergentes.

Consulta INDEX.md para localizar las skills locales. Regénéralo con bash scripts/index-skills.sh después de instalar, actualizar o eliminar skills.

Para cada skill propia, incluye:
- SKILL.md con name y description.
- Disparadores claros y casos de uso.
- Procedimiento y criterios de validación.
- Procedencia/licencia si deriva de una fuente externa.

La skill local inicial está en .agents/skills/game-project-orchestrator/SKILL.md. La presencia en el índice no certifica por sí sola la licencia ni que una skill haya sido leída o aplicada en la tarea actual.
