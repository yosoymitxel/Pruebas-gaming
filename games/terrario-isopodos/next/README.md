# Terrario de isópodos — reingeniería

Código nuevo, escrito desde cero según [la propuesta](../docs/PROPUESTA-TERROR-COZY.md). El juego viejo (`../src/`)
sigue publicado sin cambios hasta que esto lo reemplace; no se copia nada de él.

## Estructura (patrón KureiChaosChess)

- `src/data/` registros: lo que crece se declara aquí y solo aquí (recursos, piezas, aberraciones, paletas).
- `src/game/` lógica pura, probada en Node: rejilla (`grid.js`).
- `src/core/` utilidades portadas de KureiChaosChess: física 2D (`physics.js`), PRNG con semilla (`rng.js`).
- `src/i18n/` `t()` y `localize()`: todo texto para el jugador pasa por aquí.
- `src/view/`, `src/ui/` (fase 1): dibujan y leen estado; nunca deciden reglas, daño ni colisiones.

## Reglas

- Añadir contenido = una entrada en `src/data/` (+ su arte). `check-registry` falla si queda a medias.
- Colores solo desde `src/data/palettes.js`.
- Colisiones en el plano del suelo (`grid.js` + `physics.js`); el render 3D no colisiona.
- Mínimo que resuelve (ponytail), sin comentarios de relleno (antislop), archivos < 400 líneas.

## Comandos (desde `games/terrario-isopodos/`)

- `node next/tools/check-registry.mjs`
- `npm test` (incluye `next/tests/`)
