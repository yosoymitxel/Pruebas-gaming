# Juegos

Cada carpeta es un juego autónomo; `catalog.json` decide qué publica la portada ([https://yosoymitxel.github.io/Pruebas-gaming/](https://yosoymitxel.github.io/Pruebas-gaming/)).

| Juego | Jugar | Código |
|---|---|---|
| Terrario de isópodos | [Jugar](https://yosoymitxel.github.io/Pruebas-gaming/games/terrario-isopodos/) | [terrario-isopodos/](terrario-isopodos/README.md) |

- Nuevo juego: `node scripts/new-game.mjs <id> "Nombre"` (copia `_plantilla/`, lo añade al catálogo y a esta tabla).
- `_plantilla/` no se publica: es la base que se copia.
- Rutas relativas en todo (`base: "./"` en Vite) para que funcione bajo la subruta de GitHub Pages.
