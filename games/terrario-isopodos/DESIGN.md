# Dirección visual — cuaderno maldito

**El terrario es la referencia; todo gira en torno a él.** El hogar es un tanque con las capas de un terrario
real a la vista (grava, carbón, tierra, hojarasca). Fuera, las islas parecen dioramas: a veces frascos o globos
de cristal, a veces dioramas flotantes sin vidrio. El archipiélago muestra todos en miniatura.

El juego tiene que parecer dibujado en el cuaderno del dueño: tinta negra, punteado y garabato.

- **Escena:** diorama 3D dentro del recipiente: suelo en terrazas, colinas y vegetación junto al vidrio, capas
  de drenaje visibles, sombras proyectadas y niebla que aclara lo lejano. Cámara inclinada que gira (Q/E, arrastre)
  y acerca. El pase de tinta (`src/view/ink.js`) pone contorno, punteado en las sombras y aguada sobre papel.
- **Dos tonos:** cozy en el terrario y las islas (papel cálido, color tenue); terror en el nido (color retirado,
  viñeta, puntos que tiemblan).
- **Personajes:** recortes de papel de pie sobre el diorama. Isópodos dibujados en código con el mismo trazo;
  aberraciones = los dibujos escaneados, rectos y sin papel.
- **Filtros:** tinta (por defecto), CRT y papel viejo, en el menú.
- **Interfaz:** papel, borde de tinta y sombra dura; títulos a mano (Caveat), datos en sans. Botones táctiles
  ≥ 48 px, foco visible, movimiento reducido respetado.
- **Combate legible:** cada ataque enemigo se anuncia en el suelo (≥ 0,4 s) y se llena mientras carga.
