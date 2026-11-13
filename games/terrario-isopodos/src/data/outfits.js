// Atuendos de los isópodos, como los de los seguidores de Cult of the Lamb (wiki: Follower Outfits): se
// desbloquean una vez pagando en el Armario y luego se ponen a quien quieras. Cada uno es un modelo de
// Polyfork (src/vendor/polyfork) encajado en la cabeza o a la espalda (src/view/outfits3d.js).
// `slot`: 'head' (sobre la cabeza) o 'back' (sobre el lomo); `size`: ancho relativo al cuerpo.
import { localize } from '../i18n/index.js';

export const OUTFITS = localize('outfits', {
  bellota: { name: 'Gorro de bellota', desc: 'El clásico: cúpula de bellota madura.', slot: 'head', model: 'acorn', opts: { colorway: 'ripe-oak' }, size: 0.42, cost: { hojarasca: 4 } },
  bellotaRoja: { name: 'Bellota roja', desc: 'Cúpula de roble rojo, más oscura.', slot: 'head', model: 'acorn', opts: { colorway: 'red-oak' }, size: 0.42, cost: { hojarasca: 6, cal: 2 } },
  seta: { name: 'Sombrero de seta', desc: 'Una seta que brilla de noche.', slot: 'head', model: 'bonnet', opts: { colorway: 'moonlit' }, size: 0.55, cost: { esporas: 4 } },
  setaMiel: { name: 'Seta de miel', desc: 'La misma seta en tono miel.', slot: 'head', model: 'bonnet', opts: { colorway: 'honey' }, size: 0.5, cost: { esporas: 5, ambar: 1 } },
  bejin: { name: 'Bejín', desc: 'Un pedo de lobo de adorno.', slot: 'head', model: 'puff', opts: { colorway: 'gemmed' }, size: 0.36, cost: { esporas: 3, musgo: 3 } },
  cuarzo: { name: 'Corona de cuarzo', desc: 'Una piedra rosa bien pulida.', slot: 'head', model: 'quartz', opts: { colorway: 'rose' }, size: 0.32, cost: { cal: 6, ambar: 2 } },
  hoja: { name: 'Capa de hoja', desc: 'Hoja de roble de otoño a la espalda.', slot: 'back', model: 'leaf', opts: { colorway: 'autumn' }, size: 0.75, cost: { hojarasca: 8 } },
  hojaInvierno: { name: 'Capa de escarcha', desc: 'Hoja de invierno, blanca y fría.', slot: 'back', model: 'leaf', opts: { colorway: 'winter' }, size: 0.75, cost: { hojarasca: 6, cal: 4 } },
  musgo: { name: 'Manto de musgo', desc: 'Un cojín de musgo vivo encima.', slot: 'back', model: 'moss', opts: { colorway: 'meadow-green' }, size: 0.45, cost: { musgo: 6 } },
  musgoFuego: { name: 'Musgo de fuego', desc: 'Musgo rojizo, para presumir.', slot: 'back', model: 'moss', opts: { colorway: 'fire-moss' }, size: 0.45, cost: { musgo: 6, ambar: 2 } },
  pina: { name: 'Mochila de piña', desc: 'Una piña pequeña cargada al lomo.', slot: 'back', model: 'cone', opts: { colorway: 'russet' }, size: 0.38, cost: { hojarasca: 5, musgo: 2 } },
  ramita: { name: 'Bastón de ramita', desc: 'Una ramita cruzada a la espalda.', slot: 'back', model: 'twig', opts: { colorway: 'peeling' }, size: 0.95, cost: { hojarasca: 3 } },
});
