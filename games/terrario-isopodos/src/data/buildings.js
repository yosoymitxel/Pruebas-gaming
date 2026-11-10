// Piezas que se colocan en la rejilla del terrario. `size` en celdas; `solid` bloquea el paso;
// `cost` en recursos de RESOURCES. `produces`: deja `amount` del recurso listo para recoger cada
// `every` segundos de juego (hasta `cap`). `calm`: suma a la calma de la colonia. `beds`: plazas.
// `feeds`: los isópodos comen aquí (gasta hojarasca).
import { localize } from '../i18n/index.js';

export const BUILDINGS = localize('buildings', {
  refugio: { name: 'Refugio de corteza', size: { w: 2, h: 2 }, solid: true, cost: { musgo: 2, hojarasca: 3 }, beds: 3 },
  comedero: { name: 'Comedero', size: { w: 1, h: 1 }, solid: true, cost: { hojarasca: 2 }, feeds: true },
  huerto: { name: 'Huerto de hongos', size: { w: 2, h: 2 }, solid: false, cost: { esporas: 2, musgo: 1 },
    produces: { res: 'esporas', amount: 1, every: 40, cap: 4 } },
  charca: { name: 'Charca', size: { w: 2, h: 1 }, solid: true, cost: { musgo: 3 },
    produces: { res: 'musgo', amount: 1, every: 50, cap: 4 }, calm: 0.05 },
  altar: { name: 'Altar de musgo', size: { w: 2, h: 2 }, solid: true, cost: { musgo: 4, ambar: 1 }, calm: 0.2 },
  piedra: { name: 'Piedra plana', size: { w: 1, h: 1 }, solid: true, cost: { cal: 1 }, calm: 0.03 },
});

// Ampliaciones del terrario: cada una abre un anillo alrededor (lado = celdas abiertas).
export const EXPANSIONS = [
  { side: 8, cost: {} },
  { side: 10, cost: { ambar: 1, musgo: 3 } },
  { side: 12, cost: { ambar: 2, cal: 4 } },
  { side: 14, cost: { ambar: 3, cal: 6, musgo: 4 } },
];
export const GRID_SIDE = 14;
