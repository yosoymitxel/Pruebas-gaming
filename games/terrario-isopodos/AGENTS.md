# Instrucciones para agentes — Terrario de isópodos

## Alcance y ubicación

Este archivo aplica únicamente a `games/terrario-isopodos/`.

- Mantén aquí el código, los assets, las pruebas y toda la documentación específica del juego.
- La documentación compartida del framework permanece en la raíz y en `framework/`; no la uses para registrar decisiones exclusivas del terrario.
- Las skills compartidas existentes se consumen como herramientas; no las edites ni muevas para resolver tareas del juego.
- No introduzcas archivos fuera de esta carpeta salvo que una necesidad transversal del framework esté justificada y documentada.

## Reglas técnicas

- Consulta primero `docs/ESPECIFICACION-TERRARIO-ISOPODOS.md`.
- Un único estado de dominio gobierna ambos modos visuales. Cambiar Diorama/Voxel no puede reiniciar ni duplicar la simulación.
- Mantén simulación, renderers, UI y persistencia desacoplados.
- No afirmes que una función está terminada sin pruebas reproducibles.
- Las capturas de QA deben proceder del juego ejecutado y señalar el commit probado; no usar mockups como evidencia.
- Documenta procedencia y licencia de cada asset incorporado.
- Si un criterio no se probó, marcarlo como bloqueado o pendiente, nunca como PASS.
