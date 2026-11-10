# Agentes — Terrario de isópodos

- Contenido nuevo = una entrada en `src/data/` (+ su arte) y `check-registry` en verde.
- `game/` decide reglas; `view/` y `ui/` solo leen. Colisiones en el plano del suelo, no en Three.js.
- Colores solo desde `palettes.js`; textos por `t()`.
- Lo mínimo que resuelve; sin código ni comentarios de relleno; borrar lo que deja de servir.
- Documentación corta y al día: si un .md no aporta o quedó viejo, se limpia antes de escribir en él.
- Antes de dar algo por hecho: `npm test` y `npm run smoke` (PC y móvil).
