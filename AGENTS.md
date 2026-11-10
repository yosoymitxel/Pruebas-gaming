# Agentes

1. Lee `README.md`, `framework/README.md` y el `AGENTS.md` del juego en el que trabajes.
2. Juego nuevo: `node scripts/new-game.mjs <id> "Nombre"`; nunca desde cero.
3. Cada juego vive en `games/<id>/` y no importa código de otro juego. Lo que sirva a todos va a
   `games/_plantilla/` (y se documenta en `framework/README.md`).
4. Antes de crear algo, busca si ya existe en el juego, en la plantilla o en `docs/CATALOGO.md`.
5. Lo mínimo que resuelve (ponytail), sin relleno (antislop). Borra lo que deje de servir, también en los .md:
   un documento viejo se limpia antes de escribir en él.
6. Un cambio está hecho cuando pasa `framework/QUALITY-GATES.md` con pruebas reales; no se inventan resultados.
7. Una sola rama de trabajo por juego; integrar en `main` con PR.
