# Juegos

Cada carpeta es un juego autónomo; `catalog.json` decide qué publica la portada.

- Nuevo juego: `node scripts/new-game.mjs <id> "Nombre"` (copia `_plantilla/` y lo añade al catálogo).
- `_plantilla/` no se publica: es la base que se copia.
- Rutas relativas en todo (`base: "./"` en Vite) para que funcione bajo la subruta de GitHub Pages.
