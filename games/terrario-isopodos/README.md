# Terrario de isópodos

Terror acogedor: cuidas una colonia de isópodos en su terrario (una isla flotante bajo cristal), sales al
archipiélago a recoger recursos y bajas a nidos a combatir aberraciones dibujadas a tinta.

- **Juego nuevo:** `next/` (MVP). Plan y decisiones en [docs/PLAN.md](docs/PLAN.md); dirección visual en
  [DESIGN.md](DESIGN.md).
- **Juego viejo:** `src/` + `index.html`. Sigue publicado hasta que el nuevo lo sustituya; no se toca ni se copia.

## Jugar

```sh
npm install
npx vite            # http://localhost:5173/next/
```

Teclado: WASD mover · J atacar · K/espacio rodar · L/Tab pausa táctica · 1–3 cambiar de isópodo.
Táctil: palanca en la mitad izquierda, botones a la derecha.

## Estructura de `next/`

| Carpeta | Qué va |
|---|---|
| `src/data/` | Registros: recursos, piezas, aberraciones, clases, habilidades, cartas, biomas, nodos, paletas. Lo nuevo se declara aquí. |
| `src/game/` | Lógica pura probada en Node: rejilla, terrario, islas, recolección, nido, expedición, combate, guardado. |
| `src/core/` | Física 2D y PRNG portados de KureiChaosChess. |
| `src/view/` | Three.js: escenario, pase de tinta, islas, piezas, personajes. Solo dibuja. |
| `src/ui/` | Preact + htm: sesión (bucle y flujo), entrada, pantallas. Textos por `t()`. |
| `assets/sprites/` | Dibujos recortados (generados con `tools/ink-sprite.py` desde `art/aberraciones/`). |

## Comprobar

```sh
npm test                                   # incluye next/tests
node next/tools/check-registry.mjs         # registros completos
node next/tools/combat-selfcheck.mjs       # cada aberración vencible y no trivial
npx vite --port 5199 & node next/tools/smoke.mjs [--mobile]   # recorrido entero con capturas
```
