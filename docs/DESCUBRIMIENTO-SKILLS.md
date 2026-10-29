# Descubrimiento de skills cuando no se sabe cómo resolver una tarea

## Aclaración sobre Vercel Skills

https://github.com/vercel-labs/skills es principalmente el CLI/gestor del ecosistema de Agent Skills, no una única skill que resuelva problemas. Sus comandos pueden buscar skills por palabras clave, listar lo que hay en un repositorio, instalar una skill concreta y comprobar actualizaciones. Documentación upstream: https://github.com/vercel-labs/skills/blob/main/README.md y https://github.com/vercel-labs/skills/blob/main/docs/commands.md

Ejemplos de uso desde un checkout con Node.js 22.20+ y acceso de red:

    npx skills find "game save system"
    npx skills find "game UI menu pause"
    npx skills add gamedev-skills/awesome-gamedev-agent-skills --list
    npx skills list
    npx skills check

Confirmar la sintaxis y opciones con la versión actual del CLI antes de automatizar. La búsqueda puede requerir red; el contenido ya versionado localmente no requiere reinstalación para leerse.

## Protocolo de descubrimiento

1. Buscar primero en skills/INDEX.md y .agents/skills/ / .claude/skills/.
2. Leer las skills locales relevantes, no solo sus nombres.
3. Si falta una capacidad, formular la necesidad técnica concreta y buscar por varios términos relacionados.
4. Revisar resultados de fuentes reconocidas, especialmente el catálogo de GameDev Agent Skills; inspeccionar el SKILL.md, los casos de uso, los límites y la compatibilidad con el motor.
5. Comparar candidatos: alcance, mantenimiento, licencia, formato, dependencias, riesgos y solapamiento con las skills existentes.
6. Seleccionar la combinación mínima de skills. Una skill general puede enrutar a una específica; no instalar ni ejecutar todo un repositorio por defecto.
7. Si la skill es útil y compatible, incorporarla con procedencia/licencia y validarla; si no, registrar la búsqueda y el motivo de descarte.
8. No afirmar que se descubrió, leyó, instaló o aplicó una skill si ese paso no ocurrió.

## Caso del esqueleto de videojuegos

La colección Awesome GameDev Agent Skills ya incluye skills separadas como game-ui-ux y save-systems. La primera aborda HUD, menús, pausa, flujo de pantallas, responsive y navegación por teclado/mando; la segunda cubre serialización, slots, autoguardado, versionado y migraciones. Son componentes útiles, no un esqueleto universal completo. Combínalas con input-systems, localización y la skill concreta del motor cuando la tarea lo requiera, además de framework/BASELINE-VIDEOJUEGO.md.

La búsqueda debe descubrir mejores alternativas cuando existan; la tabla base del framework sigue siendo el contrato de aceptación para que no se omitan sistemas transversales.
