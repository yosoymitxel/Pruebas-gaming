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
  archipiélago; venas de tinta en los nidos.
- **Referencia Cult of the Lamb (estructura, no arte):** tilt-shift arriba y abajo (maqueta), personajes de papel
  que respiran y se aplastan al golpear, estela al rodar, manchas que quedan en el suelo, nidos enmarcados por
  raíces oscuras y antorchas, bocadillos de necesidad sobre la colonia, vegetación de recorte densa en los bordes
  (`view/flora.js`), camino pintado, rombos en los mapas (nido sobre fondo oscuro con runas rojas; islas con cartel
  de título en cinta) y reloj de día.
- **Día y noche:** el reloj del día gira la luz (alba cálida, día blanco, atardecer rojizo, noche azul con
  luciérnagas); de noche se produce menos y la colonia se inquieta; dormir pasa al alba con islas nuevas.
- **Filtros:** tinta (por defecto), CRT y papel viejo, en Ajustes y en la pausa.
- **Interfaz:** papel traslúcido con siluetas de recorte desiguales que respiran (nada de marco grueso con sombra dura); los botones flotan sueltos, sin caja; borde fino y sombra suave; acento óxido para lo principal y color fijo por significado (vida, hambre, calma, clima). Iconos antes que texto, una línea por dato; títulos a mano (Caveat), datos en sans. Botones táctiles ≥ 48 px, foco visible, movimiento reducido respetado.
- **Colonia:** cada isópodo muestra qué hace (explora, come, duerme, hambre…); se selecciona tocándolo (la cámara lo sigue) y su ficha da órdenes (comer, dormir, bolita), nombre y distintivo.
  ≥ 48 px, foco visible, movimiento reducido respetado.
- **Combate legible:** cada ataque enemigo se anuncia en el suelo (≥ 0,4 s) y se llena mientras carga. La
  interfaz se aparta: vida pegada a cada aberración, barra de la guardiana arriba, equipo en fichas chicas y un
  anillo bajo el isópodo que controlas. Cada golpe responde: destello blanco, número grande, efecto de píxel
  (pixelfx, `src/vendor/pixelfx`), combo, y cámara lenta con cartel al despejar la sala.
- **Isópodos:** especies reales (`src/data/species.js`): solo Armadillidium y Cubaris se hacen bolita; los Porcellio
  corren. En el terrario se hacen bolita al tocarlos, mudan en dos mitades y dejan la muda (calcio), crían si
  están tranquilos, de día buscan sombra y contacto y de noche exploran. En combate la especie cambia la esquiva.
- **Recolección:** islas con relieve de formas distintas (meseta, escalinata, islotes, anillo, cresta); saltar
  sube un escalón o cruza un hueco; caer al vacío devuelve atrás. Todo lo que se reparte es alcanzable (BFS).
- **Nido:** cada nivel de pelea es un piso de salas (camino principal + laterales de pelea, botín, carta o
  reliquia), con minimapa.
- **Arenas:** claro, raíces (cobertura), charcas de esporas (queman a todos), hondonada (pelea en anillo) y maraña;
  se anuncian al entrar con una pista (`src/data/arenas.js`).
- **Cartas:** el sistema de KureiChaosChess: marco por tipo, gema y borde por rareza, reparto boca abajo.
- **Efectos de píxel:** pixelfx en tiempo real y las reglas de pixel-studio (rampas de paleta, a los fps del
  efecto); se registran en `src/data/vfx.js`.
