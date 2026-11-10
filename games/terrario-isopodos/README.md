# Terrario de isópodos

Terror acogedor alrededor de un terrario: cuidas una colonia de isópodos en su tanque, viajas entre terrarios
flotantes a recoger recursos y bajas a nidos a combatir aberraciones dibujadas a tinta.

**Jugar:** [https://yosoymitxel.github.io/Pruebas-gaming/games/terrario-isopodos/](https://yosoymitxel.github.io/Pruebas-gaming/games/terrario-isopodos/) · [Portada](https://yosoymitxel.github.io/Pruebas-gaming/)

Plan y decisiones en [docs/PLAN.md](docs/PLAN.md); dirección visual en [DESIGN.md](DESIGN.md).

## Jugar

```sh
npm install
npx vite            # http://localhost:5173/
```

Teclado: WASD mover · J atacar · K/espacio rodar · L/Tab pausa táctica · 1–3 cambiar de isópodo · Q/E girar cámara.
Táctil: palanca en la mitad izquierda, botones a la derecha; en el terrario, arrastrar gira y la rueda acerca.

## Estructura

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
npm test          # lógica, registros y combate vencible
npm run check     # registros completos + tasa de victoria por aberración
npx vite --port 5199 & npm run smoke   # recorrido entero en PC y 360×800, capturas en artifacts/visual
```
