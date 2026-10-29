# Registro local y actualización de skills

## Objetivo

Este repositorio debe ser la **fuente versionada de referencia** de las skills que el framework puede usar. Una skill ya incorporada y validada no debería exigir reinstalarse en cada tarea ni en cada conversación: se lee desde el checkout local del repositorio.

## Fuente de verdad

- .agents/skills/: copia de proyecto para agentes compatibles con el formato Agent Skills.
- .claude/skills/: copia de proyecto para Claude Code.
- skills/: skills propias, adaptaciones y documentación curada; no duplicar aquí una skill externa si ya está en las rutas anteriores.
- skills/INDEX.md: índice regenerable de skills locales detectadas.
- sources/manifest.tsv: registro de fuentes upstream y su estado.
- docs/CATALOGO.md: propósito y prioridad de las fuentes.

Una entrada en el catálogo **no significa** que la skill esté descargada. Solo se considera disponible cuando existe su archivo local SKILL.md, pasó la validación estructural y se revisaron procedencia/licencia.

## Flujo de incorporación

1. Revisar la fuente upstream, estructura, dependencias, instrucciones y licencia.
2. Instalar/copiar solo skills identificadas; no asumir que un repositorio entero es un conjunto de skills.
3. Conservar avisos de licencia y atribución junto con el contenido cuando corresponda.
4. Ejecutar bash scripts/validate-skills.sh.
5. Regenerar el índice con bash scripts/index-skills.sh.
6. Actualizar sources/manifest.tsv con estado real, método y notas de revisión.
7. Revisar el diff y confirmar que no se añadieron secretos, binarios innecesarios, dependencias ejecutables inesperadas ni contenido incompatible con la licencia.
8. Commit de las skills, licencias, índice y manifest para que queden disponibles en futuros checkouts.

## Actualizar sin reinstalar cada vez

Cuando se quiera refrescar el repertorio, ejecutar en un entorno con Git y Node.js compatibles:

    bash scripts/install-skills.sh
    bash scripts/validate-skills.sh
    bash scripts/index-skills.sh
    git diff -- .agents/skills .claude/skills skills/INDEX.md sources/manifest.tsv

La actualización upstream debe ser deliberada y revisada. No actualizar automáticamente a ciegas en cada ejecución del juego: una actualización puede cambiar instrucciones, introducir dependencias o alterar licencias. Para mantenerlas al día, se puede programar un chequeo periódico que abra un PR con cambios revisables; no debe desplegar ni integrar cambios automáticamente.

## Regla para agentes y chats nuevos

Al abrir un trabajo desde este repositorio:

1. Leer AGENTS.md.
2. Leer skills/INDEX.md para localizar skills disponibles.
3. Leer el SKILL.md completo de las skills aplicables antes de planificar/implementar.
4. Si el archivo existe en el checkout, no afirmar que falta o que debe reinstalarse.
5. Si no hay checkout o acceso al repositorio, decirlo con precisión y pedir acceso/enlace o un entorno con el repo; no fingir que el contenido ya fue leído.
6. Si una skill está solo catalogada como fuente externa y no tiene copia local, marcarla como NO DISPONIBLE LOCALMENTE, no como instalada.
7. En cada informe, distinguir entre disponible localmente, leída en esta tarea y ejecutada/aplicada. Son estados diferentes.

## Límite importante

Versionar skills en GitHub las hace persistentes y reutilizables para cualquier sesión que tenga acceso al repositorio. No obliga por sí solo a cualquier chat nuevo de ChatGPT a abrir este repositorio automáticamente. AGENTS.md sirve a los agentes que respetan las instrucciones del checkout; en una conversación nueva sin acceso al repo, habrá que proporcionar el enlace o abrir el proyecto en un entorno que lo tenga disponible.
