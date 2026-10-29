# Instrucciones para agentes de programación

Este repositorio es un repertorio de skills y guías para videojuegos, no un juego final.

## Antes de actuar
- Lee README.md, docs/SELECCION-DE-HERRAMIENTAS.md, docs/ESTANDARES.md y el manifiesto pertinente.
- Selecciona skills por disparadores de tarea; no actives todas indiscriminadamente.
- Inspecciona primero el repositorio de destino del juego y sus convenciones existentes.
- No afirmes que una skill está instalada si no existen sus archivos.
- No ejecutes scripts externos sin inspeccionar su contenido y procedencia.

## Cambios y validación
- Mantén cambios pequeños y reversibles.
- No reemplaces mecánicas, assets ni arquitectura existentes sin necesidad demostrada.
- Para UI/animación, comprueba el resultado en el juego ejecutado y en viewports reales.
- Para lógica, añade o ejecuta pruebas deterministas.
- Documenta comandos ejecutados, resultados, fallos y trabajo pendiente.
- No marques PASS sin evidencia reproducible.

## Actualización de fuentes
- No sobrescribas adaptaciones locales sin revisar el diff.
- Conserva origen, versión/commit y licencia.
- Cuando dos skills se solapen, documenta la precedencia en el catálogo.
