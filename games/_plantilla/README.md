# __NOMBRE__

Una línea: de qué va el juego y qué lo hace distinto.

**Jugar:** [https://yosoymitxel.github.io/Pruebas-gaming/games/__ID__/](https://yosoymitxel.github.io/Pruebas-gaming/games/__ID__/) (tras integrar en `main`) · [Portada](https://yosoymitxel.github.io/Pruebas-gaming/)

Plan y decisiones en [docs/PLAN.md](docs/PLAN.md); dirección visual en [DESIGN.md](DESIGN.md).

## Jugar

```sh
npm install
npx vite            # http://localhost:5173/
```

## Estructura

| Carpeta | Qué va |
|---|---|
| `src/data/` | Registros: todo lo que crece (contenido, paleta). Lo nuevo se declara aquí. |
| `src/game/` | Lógica pura probada en Node. Decide reglas, daño, victoria. |
| `src/core/` | Utilidades sin juego: PRNG con semilla, física 2D. |
| `src/view/` | Three.js + pase de tinta. Solo dibuja el estado. |
| `src/ui/` | Preact + htm: sesión (bucle y pantallas), entrada, iconos. Textos por `t()`. |

## Comprobar

```sh
npm test          # lógica + registros
npm run check     # registros completos
npx vite --port 5199 & npm run smoke   # recorrido en PC y 360×800, capturas en artifacts/visual
```
