# Terrario de isópodos — reingeniería (MVP)

Código nuevo, escrito desde cero según [la propuesta](../docs/PROPUESTA-TERROR-COZY.md). El juego viejo (`../src/`)
sigue publicado sin cambios hasta que esto lo reemplace; no se copia nada de él.

Ruta: `games/terrario-isopodos/next/` (en local, `npx vite` → http://localhost:5173/next/).

## Qué hay

- **Terrario** (isla bajo cristal): rejilla con huellas, colocar y girar piezas, colisiones de la colonia contra
  piezas sólidas y bordes, ampliación por anillos, producción que se recoge tocando la burbuja, hambre y calma.
- **Archipiélago** (mapa exterior): islas procedurales por día con bioma y clima. Recolección (minijuego de 40 s,
  con isópodo perdido que rescatar) y nidos.
- **Nido** (mapa interior): 7 capas sin cruces; combate, élite, botín, refugio, carta y guardiana.
- **Combate**: 1 principal + 2 de apoyo, ataque básico en combo, rodar (invulnerable), ATB en 2 segmentos,
  pausa táctica al 10 % de velocidad para habilidades y objetos, presión y aturdimiento, ataques telegrafiados.
- **Aberraciones**: los 4 dibujos del dueño tal cual (tinta recortada del papel con `tools/ink-sprite.py`).
- **Cartas** de expedición, botín y rescatados que vuelven al terrario; guardado local validado.
- **Look**: escena 3D sencilla + pase de tinta (contorno, punteado, aguada); cozy en casa, terror en el nido.

Controles: WASD/flechas mover · J atacar · K/espacio rodar · L/Tab pausa táctica · 1–3 cambiar de isópodo.
En táctil: palanca en la mitad izquierda y botones a la derecha.

## Estructura (patrón KureiChaosChess)

- `src/data/` registros: lo que crece se declara aquí y solo aquí (recursos, piezas, aberraciones, clases,
  habilidades, cartas, biomas, climas, nodos, paletas).
- `src/game/` lógica pura, probada en Node: rejilla, terrario, archipiélago, recolección, nido, expedición,
  combate, piloto automático, guardado.
- `src/core/` portado de KureiChaosChess: física 2D (`physics.js`), PRNG con semilla (`rng.js`).
- `src/view/` Three.js: escenario + pase de tinta, islas, piezas, recortes de personajes, escenas. Solo dibuja.
- `src/ui/` Preact + htm: sesión (bucle y flujo), entrada, pantallas. Todo texto por `t()`.

Reglas: añadir contenido = una entrada en `src/data/` (+ arte); colores solo desde `palettes.js`; colisiones en el
plano del suelo; nada visual decide reglas; archivos < 400 líneas.

## Comprobar (desde `games/terrario-isopodos/`)

- `npm test` — incluye `next/tests/` (rejilla, terrario, recolección, nido sin cruces, expedición completa,
  guardado y combate vencible).
- `node next/tools/check-registry.mjs` — registros completos.
- `node next/tools/combat-selfcheck.mjs` — tasa de victoria y duración por aberración con el piloto.
- `npx vite --port 5199` y `node next/tools/smoke.mjs [--mobile]` — recorrido entero en navegador con capturas.

## Pendiente (siguiente iteración)

- Las otras ~15 aberraciones (registro preparado: una entrada + dibujo cada una).
- Sonido y música (patrón `sfx.js` de KureiChaosChess), logros, galería/bestiario, exportar/importar.
- Más minijuegos de isla; tres dificultades; balance con jugadores reales (el selfcheck usa un piloto).
- Animación por recortes de los dibujos (hoy se mueven como una sola lámina).
- Sustituir el juego viejo cuando el dueño apruebe este.
