# Instrucciones obligatorias para agentes

Este repositorio mantiene el framework reutilizable de calidad para videojuegos y el repertorio versionado de skills.

## Antes de trabajar
1. Lee AGENTS.md, README.md, framework/README.md, framework/ORCHESTRATION.md, framework/QUALITY-GATES.md y framework/TASK-PROFILES.md.
2. Lee skills/INDEX.md y docs/REGISTRO-SKILLS.md para localizar el contenido ya versionado.
3. Si se inicia un juego o se evalúa un prototipo, lee framework/BASELINE-VIDEOJUEGO.md y framework/CONFLICTOS-Y-FUENTE-DE-VERDAD.md; crea la tabla de verdad y decide explícitamente cada sistema transversal.
4. Si no sabes qué capacidad o skill usar, sigue docs/DESCUBRIMIENTO-SKILLS.md; Vercel Skills es una herramienta de descubrimiento/gestión, no una única skill universal.
5. Clasifica la tarea y lee de principio a fin los SKILL.md relevantes que existan en el checkout. **No pidas reinstalar una skill que ya está en el repositorio.**
6. Distingue siempre: disponible localmente, leída en esta tarea y aplicada/ejecutada. No declares uno de estos estados basándote en otro.
7. Si el checkout no contiene una skill, consulta sources/manifest.tsv y docs/CATALOGO.md. No afirmes que está instalada si solo hay una URL catalogada.
8. Define criterios de aceptación y pruebas antes de implementar.
9. Inspecciona el proyecto destino y reutiliza su arquitectura, mecánicas, assets, SVG, spritesheets, atlas y animaciones existentes.
10. Antes de crear un recurso visual desde cero, consulta docs/CATALOGO-REFERENCIAS.md y justifica la decisión si no hay un recurso reutilizable. Para capturas o pruebas visuales, sigue docs/EVIDENCIA-VISUAL.md y vincula la evidencia al SHA exacto.
11. Ejecuta y registra CODE_GATE, GAMEPLAY_GATE y DESIGN_GATE. Marca NOT_APPLICABLE con motivo o BLOCKED si no se puede probar.
12. No declares una tarea terminada si una puerta aplicable está en FAIL o BLOCKED.
13. No inventes pruebas, capturas, resultados o instalaciones.
14. Revisa licencias, procedencia y scripts antes de ejecutar o redistribuir contenido de terceros.
15. No crees la carpeta juegos/ durante la fase actual; primero se valida el framework.

## Actualizar skills
Cuando se incorpore o actualice una skill, revisa procedencia/licencia, ejecuta bash scripts/validate-skills.sh y bash scripts/index-skills.sh, actualiza el manifest con el estado real y revisa el diff. No actualices fuentes upstream a ciegas ni integres automáticamente contenido no revisado.

Mantén cambios pequeños, reversibles y verificables. Build verde no significa juego funcional. Un mockup no prueba la implementación real.

## Política de ramas por juego

- `main` es la rama compartida de integración. Para cada juego se reutiliza **una sola rama de trabajo de larga vida**; antes de crear o cambiar de rama, inspecciona las ramas existentes y continúa en la ya asociada al juego.
- No abrir ramas paralelas `fix/*`, `polish/*`, `validation/*` o `ci/*` para el mismo juego solo para dividir tareas. Las correcciones de código, pruebas y documentación van a su rama activa.
- Las ramas antiguas no se fusionan por el mero hecho de existir. Comparar contra `main`, revisar sus diferencias reales y recuperar solo cambios únicos que sigan siendo correctos y útiles. No mezclar snapshots antiguos que reviertan comportamiento o UI actuales.
- Las ramas inactivas se consideran obsoletas y se ignoran en el flujo normal; no borrarlas ni integrarlas de forma masiva sin petición explícita.
- Mantener pocos commits revisables. Cuando varias correcciones forman una unidad validada, consolidarlas en un único commit lógico antes de abrir/actualizar la PR. Nunca reescribir un ref sin comprobar el HEAD esperado.
- Tras integrar la PR, sincronizar la única rama de ese juego con el commit integrado de `main`; antes de reportar terminado, confirmar que la rama, el SHA, los checks y el deployment corresponden a los cambios finales.
