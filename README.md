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

## Juegos

- [Terrario de isópodos](games/terrario-isopodos/README.md): terror acogedor alrededor de un terrario.

## Publicación

GitHub Pages construye cada juego y publica el sitio desde `main`: https://yosoymitxel.github.io/Pruebas-gaming/
