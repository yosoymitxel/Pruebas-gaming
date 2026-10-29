# Instrucciones para agentes — Terrario de isópodos

Estas reglas aplican únicamente a `games/terrario-isopodos/`.

- Mantén aquí el código, assets, pruebas y documentación específica del juego.
- La documentación común permanece en la raíz y `framework/`; no registres aquí decisiones transversales.
- Consume las skills compartidas existentes sin editarlas ni moverlas para resolver tareas del juego.
- No introduzcas cambios fuera de esta carpeta salvo que una necesidad transversal esté justificada.
- Consulta primero `docs/ESPECIFICACION-TERRARIO-ISOPODOS.md`.
- Un único estado de dominio gobierna Diorama y Voxel; cambiar renderer no reinicia ni duplica la simulación.
- No declares una función terminada sin pruebas reproducibles.
- Las capturas deben proceder del juego ejecutado e identificar el commit probado.
- Registra procedencia/licencia de cada asset. Criterios no probados son pendientes, no PASS.
