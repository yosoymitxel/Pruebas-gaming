// Piezas que se colocan en la rejilla del terrario. `size` en celdas; `solid` bloquea el paso;
// `cost` en recursos de RESOURCES. `produces`: deja `amount` del recurso listo para recoger cada
// `every` segundos de juego (hasta `cap`). `calm`: suma a la calma de la colonia. `beds`: plazas.
// `feeds`: los isópodos comen aquí (gasta hojarasca). `desc`: qué hace (la interfaz lo enseña al elegir).
// `upgrade[n]`: coste para pasar al nivel n + 2; cada nivel produce más rápido, guarda más y calma más.
// Piezas sacadas de terrarios de isópodos de verdad: corcho para esconderse, sepia para el calcio, esfagno
// que guarda humedad, colémbolos que se comen el moho, tronco podrido que da comida.
import { localize } from '../i18n/index.js';

export const BUILDINGS = localize('buildings', {
  refugio: { name: 'Refugio de corteza', desc: 'Camas para la colonia.', size: { w: 2, h: 2 }, solid: true, cost: { musgo: 2, hojarasca: 3 }, beds: 3,
    upgrade: [{ hojarasca: 4, musgo: 2 }, { hojarasca: 6, ambar: 1 }] },
  comedero: { name: 'Comedero', desc: 'Aquí comen.', size: { w: 1, h: 1 }, solid: true, cost: { hojarasca: 2 }, feeds: true },
  huerto: { name: 'Huerto de hongos', desc: 'Da esporas.', size: { w: 2, h: 2 }, solid: false, cost: { esporas: 2, musgo: 1 },
    produces: { res: 'esporas', amount: 1, every: 40, cap: 4 }, upgrade: [{ esporas: 3, musgo: 2 }, { esporas: 5, ambar: 1 }] },
  charca: { name: 'Charca', desc: 'Musgo y humedad.', size: { w: 2, h: 1 }, solid: true, cost: { musgo: 3 },
    produces: { res: 'musgo', amount: 1, every: 50, cap: 4 }, calm: 0.05, upgrade: [{ musgo: 4 }, { musgo: 6, ambar: 1 }] },
  altar: { name: 'Altar de musgo', desc: 'Mucha calma.', size: { w: 2, h: 2 }, solid: true, cost: { musgo: 4, ambar: 1 }, calm: 0.2,
    upgrade: [{ musgo: 6, ambar: 1 }, { musgo: 8, ambar: 2 }] },
  piedra: { name: 'Piedra plana', desc: 'Un poco de calma.', size: { w: 1, h: 1 }, solid: true, cost: { cal: 1 }, calm: 0.03 },
  corcho: { name: 'Corteza de corcho', desc: 'Camas y calma.', size: { w: 2, h: 1 }, solid: true, cost: { hojarasca: 2, musgo: 1 }, beds: 2, calm: 0.06,
    upgrade: [{ hojarasca: 3, musgo: 2 }, { hojarasca: 5, ambar: 1 }] },
  sepia: { name: 'Hueso de sepia', desc: 'Da cal.', size: { w: 1, h: 1 }, solid: true, cost: { hojarasca: 1, musgo: 1 },
    produces: { res: 'cal', amount: 1, every: 70, cap: 3 }, upgrade: [{ cal: 2, musgo: 2 }, { cal: 4, ambar: 1 }] },
  esfagno: { name: 'Musgo esfagno', desc: 'Humedad y musgo.', size: { w: 2, h: 2 }, solid: false, cost: { musgo: 3 },
    produces: { res: 'musgo', amount: 1, every: 80, cap: 3 }, upgrade: [{ musgo: 4, hojarasca: 2 }, { musgo: 6, ambar: 1 }] },
  colembolos: { name: 'Colonia de colémbolos', desc: 'Acaban con el moho.', size: { w: 1, h: 1 }, solid: false, cost: { esporas: 2, hojarasca: 1 }, calm: 0.03 },
  tronco: { name: 'Tronco podrido', desc: 'Hojarasca y una cama.', size: { w: 3, h: 1 }, solid: true, cost: { musgo: 2, cal: 1 }, beds: 1,
    produces: { res: 'hojarasca', amount: 1, every: 45, cap: 4 }, upgrade: [{ musgo: 3, cal: 2 }, { musgo: 5, ambar: 1 }] },
  seta: { name: 'Seta luminosa', desc: 'Luz de noche y calma.', size: { w: 1, h: 1 }, solid: true, cost: { esporas: 3, ambar: 1 }, calm: 0.08,
    upgrade: [{ esporas: 4, ambar: 1 }] },
});

// Ampliaciones del terrario: cada una abre un anillo alrededor (lado = celdas abiertas).
export const EXPANSIONS = [
  { side: 8, cost: {} },
  { side: 10, cost: { ambar: 1, musgo: 3 } },
  { side: 12, cost: { ambar: 2, cal: 4 } },
  { side: 14, cost: { ambar: 3, cal: 6, musgo: 4 } },
  { side: 16, cost: { ambar: 4, cal: 6, musgo: 6, hojarasca: 6 } },
  { side: 18, cost: { ambar: 5, cal: 8, musgo: 8, esporas: 4 } },
  { side: 20, cost: { ambar: 6, cal: 10, musgo: 10, esporas: 6 } },
];
export const GRID_SIDE = 20;
export const MAX_LEVEL = 3;
