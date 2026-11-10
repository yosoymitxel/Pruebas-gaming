# Método

Cómo se hace un juego en este repo. La plantilla (`games/_plantilla/`) ya cumple todo esto; el terrario de
isópodos es el ejemplo grande.

## Estructura de un juego

```
games/<id>/
  index.html            entrada (Vite)
  src/data/             registros: lo que crece (enemigos, objetos, mapas, paleta, textos base)
  src/game/             lógica pura: reglas, combate, guardado. Se prueba en Node
  src/core/             utilidades sin juego: PRNG con semilla, física 2D
  src/view/             Three.js + pase de tinta: dibuja el estado, nunca decide
  src/ui/               Preact + htm: sesión (bucle y pantallas), entrada, iconos, estilos
  tools/                check-registry (registros completos), smoke (recorrido en navegador), selfchecks
  tests/                node --test
  README.md AGENTS.md DESIGN.md docs/PLAN.md
```

**Reglas que hacen fácil crecer**

- Contenido nuevo = una entrada en `src/data/`. `tools/check-registry.mjs` falla si queda a medias (arte que
  no existe, coste con un recurso inventado, icono sin dibujar). Amplíalo con cada registro.
- Una sola fuente de verdad: `game/` decide; `view/` y `ui/` leen. Ninguna animación decide un golpe o una victoria.
- Colores solo en `palettes.js` (la UI los recibe como tokens CSS); textos por `t()`; iconos en `ui/icons.js`.
- Archivos < 400 líneas; se parten por responsabilidad.

## Sistemas base (ya en la plantilla)

| Sistema | Dónde |
|---|---|
| Menú, pantallas, pausa | `ui/app.js`, `ui/session.js` |
| Bucle con `dt` acotado | `Session.frame` |
| Entrada: teclado, palanca táctil, cámara relativa | `ui/input.js` |
| Cámara de diorama que gira y acerca | `view/stage.js` |
| Estilo a tinta y filtros (tinta, CRT, papel viejo) | `view/ink.js` |
| Guardado validado y versionado | `game/save.js` |
| Ajustes persistentes | `Session.setSetting` |
| Idiomas | `i18n/index.js` (`t`, `localize`) |
| Iconografía | `ui/icons.js` |
| Movimiento reducido | CSS + ajuste |

Del terrario se pueden copiar cuando hagan falta: combate en tiempo real con ATB y pausa táctica
(`src/game/combat.js` + piloto automático y selfcheck), rejilla con colisiones (`grid.js`), mapas por capas
(`dungeon.js`), efectos de tinta y clima (`view/vfx.js`), recipientes y dioramas (`view/vessel.js`,
`view/island.js`), fondo vivo (`view/backdrop.js`).

## Flujo de trabajo

1. Escribe en `docs/PLAN.md` qué se decide y qué queda (corto; se reescribe, no se acumula).
2. Datos primero (`src/data/`), luego lógica con pruebas (`src/game/`, `tests/`), luego vista e interfaz.
3. Si hay combate o reto, un selfcheck que juegue solo y demuestre que es vencible y no trivial.
4. `npm test`, `npm run check`, `npm run smoke` (PC 1280×800 y móvil 360×800) y mirar las capturas.
5. Commit pequeño y claro; PR a `main`.

## Skills por tarea

| Tarea | Skill o referencia |
|---|---|
| Arrancar o auditar un juego | `.agents/skills/game-project-orchestrator`, `game-project-skeleton` |
| Código mínimo y limpio | ponytail, antislop |
| Interfaz y accesibilidad | impeccable, taste, web-design-guidelines, emil-design-eng |
| Sensación de juego, cámara, IA | awesome-gamedev-agent-skills (`game-feel`, `camera-systems`, `game-ai`) |
| Arte, VFX, iconos | `docs/CATALOGO.md` (pixelfx, svgsilh, claude-pxl, dioramas) |
