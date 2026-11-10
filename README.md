# Pruebas-gaming — marco para hacer juegos web

Un sitio con juegos web (Vite + Three.js + Preact) y el marco para crear juegos nuevos rápido y con la misma
calidad: una plantilla que ya funciona, un generador, reglas cortas y comprobaciones automáticas.

## Crear un juego (3 pasos)

```sh
node scripts/new-game.mjs mi-juego "Mi juego"     # copia games/_plantilla y lo añade al catálogo
cd games/mi-juego && npm install && npm test      # la plantilla ya pasa sus pruebas
npx vite                                          # ya se juega: menú, partida, pausa, filtros, guardado
```

Luego se sustituye la partida de ejemplo por la mecánica real siguiendo [framework/README.md](framework/README.md).

## Qué hay

| Ruta | Para qué |
|---|---|
| `framework/README.md` | El método: estructura de un juego, sistemas base, cómo añadir contenido, cómo probar. |
| `framework/QUALITY-GATES.md` | Las cuatro puertas que un cambio pasa antes de darse por hecho. |
| `docs/CATALOGO.md` | Skills, librerías y referencias, ordenadas por necesidad. |
| `games/_plantilla/` | Juego mínimo completo: la base de cada juego nuevo. |
| `games/<id>/` | Cada juego, autónomo (código, arte, pruebas y docs propios). |
| `games/catalog.json` | Lo que publica la portada (`index.html`). |
| `scripts/` | Generador de juegos y mantenimiento de skills. |
| `.agents/skills/` | Skills locales del marco (orquestador y esqueleto). |

## Enlaces directos

| | Jugar | Código |
|---|---|---|
| Portada | [https://yosoymitxel.github.io/Pruebas-gaming/](https://yosoymitxel.github.io/Pruebas-gaming/) | [index.html](index.html) |
| Terrario de isópodos | [Jugar](https://yosoymitxel.github.io/Pruebas-gaming/games/terrario-isopodos/) | [games/terrario-isopodos](games/terrario-isopodos/README.md) |
| Plantilla | se prueba en local (`npx vite`) | [games/_plantilla](games/_plantilla/README.md) |

Otros: [Actions](https://github.com/yosoymitxel/Pruebas-gaming/actions) · [Pull requests](https://github.com/yosoymitxel/Pruebas-gaming/pulls) ·
[Método](framework/README.md) · [Puertas de calidad](framework/QUALITY-GATES.md) · [Catálogo de referencias](docs/CATALOGO.md)

Todos los juegos con su enlace: [games/README.md](games/README.md). GitHub Pages construye cada juego del catálogo y publica el sitio desde `main`.
