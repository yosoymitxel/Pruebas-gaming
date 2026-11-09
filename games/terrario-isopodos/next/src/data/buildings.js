// Piezas que se colocan en la rejilla del terrario. `size` en celdas; `solid` bloquea el paso;
// `cost` en recursos de RESOURCES.
import { localize } from '../i18n/index.js';

export const BUILDINGS = localize('buildings', {
  refugio: { name: 'Refugio de corteza', size: { w: 2, h: 2 }, solid: true, cost: { musgo: 2, hojarasca: 3 } },
  comedero: { name: 'Comedero', size: { w: 1, h: 1 }, solid: true, cost: { hojarasca: 2 } },
  huerto: { name: 'Huerto de hongos', size: { w: 3, h: 2 }, solid: false, cost: { esporas: 3, musgo: 1 } },
  charca: { name: 'Charca', size: { w: 2, h: 1 }, solid: true, cost: { musgo: 3 } },
  altar: { name: 'Altar de musgo', size: { w: 2, h: 2 }, solid: true, cost: { musgo: 4, ambar: 1 } },
  piedra: { name: 'Piedra plana', size: { w: 1, h: 1 }, solid: true, cost: {} },
});
