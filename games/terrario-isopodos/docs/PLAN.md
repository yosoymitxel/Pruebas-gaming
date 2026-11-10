# Plan

Referencia de estructura: *Cult of the Lamb* (base acogedora + salidas peligrosas). Combate: ataque en tiempo real
y pausa táctica para habilidades y objetos, como *FF VII Remake*. Género y mecánicas, no nombres ni arte.
Referencia de calidad y organización del código: KureiChaosChess.

## Decidido

- El terrario es el núcleo: isla flotante bajo cristal, ampliable, con rejilla y colisiones reales.
- Mundo: archipiélago de islas pequeñas generadas por día, cada una con bioma y clima.
- Dos mapas: exterior (islas, minijuegos, recursos) e interior (nido por capas hasta la guardiana).
- Isópodos y recursos se recogen; los rescatados se suman a la colonia.
- Equipo: 1 principal + 2 de apoyo. Cartas durante la expedición.
- ~19 aberraciones (dibujos del dueño), recurrentes; rol de cada una por decidir. De momento, los dibujos tal
  cual; versión voxel, píxel o por recortes, más adelante.
- Nombre: «Terrario de isópodos».

## Hecho (MVP)

Terrario (rejilla, piezas, producción, hambre, calma, ampliación) · archipiélago con recolección · nido de 7 capas
· combate con ATB, rodar, presión y aturdimiento · 4 aberraciones + larva · cartas · guardado · pase de tinta ·
pruebas en Node y recorrido en navegador (PC y 360×800).

## Pendiente

1. Resto de aberraciones y su rol (una entrada en `data/aberrations.js` + dibujo cada una).
2. Animación de los dibujos por partes (hoy se mueven como una sola lámina).
3. Sonido y música; logros; bestiario/galería; exportar/importar partida (portar de KureiChaosChess).
4. Más minijuegos de isla; tres dificultades; balance con jugadores reales.
