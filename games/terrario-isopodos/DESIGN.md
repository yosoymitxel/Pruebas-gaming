# Dirección visual — cuaderno maldito

**El terrario es la referencia; todo gira en torno a él.** El hogar es un tanque con las capas de un terrario
real a la vista (grava, carbón, tierra, hojarasca). Fuera, las islas parecen dioramas: a veces frascos o globos
de cristal, a veces dioramas flotantes sin vidrio. El archipiélago muestra todos en miniatura.

El juego tiene que parecer dibujado en el cuaderno del dueño: tinta negra, punteado y garabato.

- **Escena:** diorama 3D dentro del recipiente: suelo en terrazas, colinas y vegetación junto al vidrio, capas
  de drenaje visibles, sombras proyectadas y niebla que aclara lo lejano. Cámara inclinada que gira (Q/E, arrastre)
  y acerca. El pase de tinta (`src/view/ink.js`) pone contorno, punteado en las sombras y aguada sobre papel.
- **Dos tonos:** cozy en el terrario y las islas (color vivo: verde claro, camino de tierra rojiza, acentos rojos);
  terror en el nido (color retirado, más punteado, viñeta cerrada).
- **Personajes:** recortes de papel de pie sobre el diorama. Isópodos dibujados en código con el mismo trazo;
  aberraciones = los dibujos escaneados, rectos y sin papel.
- **Fondo:** oscuridad alrededor del diorama (noche con grano y textura del clima); mar con olas en el
  archipiélago; venas de tinta en los nidos. La interfaz sigue en papel.
- **Referencia Cult of the Lamb (estructura, no arte):** tilt-shift arriba y abajo (maqueta), personajes de papel
  que respiran y se aplastan al golpear, estela al rodar, manchas que quedan en el suelo, nidos enmarcados por
  raíces oscuras y antorchas, bocadillos de necesidad sobre la colonia, vegetación de recorte densa en los bordes
  (`view/flora.js`), camino pintado, rombos en los mapas (nido sobre fondo oscuro con runas rojas; islas con cartel
  de título en cinta) y reloj de día.
- **Filtros:** tinta (por defecto), CRT y papel viejo, en el menú.
- **Interfaz:** papel, borde de tinta y sombra dura; títulos a mano (Caveat), datos en sans. Botones táctiles
  ≥ 48 px, foco visible, movimiento reducido respetado.
- **Combate legible:** cada ataque enemigo se anuncia en el suelo (≥ 0,4 s) y se llena mientras carga.
