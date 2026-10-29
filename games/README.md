# Catálogo de juegos

El `index.html` de la raíz muestra el catálogo de `games/catalog.json`. GitHub Pages no ofrece una API de directorios estáticos fiable para que el navegador descubra automáticamente carpetas nuevas; por eso el manifiesto es la fuente explícita del catálogo.

## Al añadir un juego

1. Crea `games/<id>/index.html` como entrada autónoma del juego.
2. Usa rutas relativas para módulos, CSS, fuentes y recursos. En proyectos Vite configura `base: "./"` para que funcione bajo la subruta del repositorio.
3. Añade una entrada a `games/catalog.json` con `id`, `name`, `category`, `status`, `description`, `path` y `art`.
4. Verifica la ruta directa del juego y la navegación de vuelta al catálogo desde el hosting publicado.

Cada proyecto mantiene su código, pruebas y documentación dentro de su carpeta. El catálogo solo necesita el manifiesto para enlazarlo.
