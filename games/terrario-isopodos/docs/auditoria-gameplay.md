# Auditoría de gameplay (simulada en Node)

Cómo se midió: 30 min de terrario sin tocar nada, 30 min con un jugador atento (recoge cada 20 s y pone un
trabajador en el tronco) y 20 expediciones completas con el piloto automático (`tools/run-selfcheck.mjs`,
ahora en `npm run check`).

| Problema encontrado | Causa | Arreglo |
|---|---|---|
| Se empezaba en clima seco, con hambre ×1,5 | Terrario inicial sin agua | Empieza con charca (humedad ideal y gradiente) y un tronco que da comida |
| Comida agotada a los 25 min | Ninguna pieza producía comida al empezar | Tronco inicial; con un trabajador la comida sobra (+47 en 30 min) |
| Cal sin límite (32 en 30 min) | Cada muda comida daba 1 cal | Solo un tercio de cada muda llega a cal (el resto lo recupera el isópodo) |
| La fe se hundía sola (−58) | Peticiones olvidadas −25 cada 5 min | −10, una petición a la vez mientras la colonia es chica |
| De 4 a 10 isópodos en 20 min y hambruna | Criar no costaba nada y dejaba pasar las camas | Criar pide cama libre y gasta 3 de hojarasca |
| Hambrientos con comida en el almacén (33 comidas de 60) | Todos empujándose alrededor de un comedero de 1 celda | Se come a 1,6 celdas del comedero |
| Constructores pegados al refugio para siempre | Andaban en línea recta contra las piezas | Camino por la rejilla (BFS) en todo el movimiento |
| Seguían yendo a la cama de día | La orden nocturna no se limpiaba al amanecer | Se limpia al amanecer |
| Producción parada si no tocás | Todo había que recogerlo a mano | Un trabajador asignado descarga solo al almacén |
| Expedición: 40–50 % de victorias, ~10 peleas, ~3 min de combate | — | En rango; se vigila en `npm run check` |
| Falta el golpe fuerte de Cult of the Lamb | — | Mantener atacar y soltar: golpe en círculo ×2,4 que aturde, 2,2 s de espera |
