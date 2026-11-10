# Agentes — Terrario de isópodos

- Trabajar en `next/`. `src/` es el juego viejo: no se edita ni se copia.
- Contenido nuevo = una entrada en `next/src/data/` (+ su arte) y `check-registry` en verde.
- `game/` decide reglas; `view/` y `ui/` solo leen. Colisiones en el plano del suelo, no en Three.js.
- Colores solo desde `palettes.js`; textos por `t()`.
- Lo mínimo que resuelve; sin código ni comentarios de relleno; borrar lo que deja de servir.
- Documentación corta y al día: si un .md no aporta o quedó viejo, se limpia antes de escribir en él.
- Antes de dar algo por hecho: `npm test` y `smoke.mjs` en PC y `--mobile`.
