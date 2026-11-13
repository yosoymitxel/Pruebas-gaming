// Economía entre expediciones, como Cult of the Lamb: un mercader que visita la colonia cada tres días
// (Ratau y los comerciantes de los caminos) y mejoras permanentes que se pagan con ámbar (la Inspiración
// divina y los sermones que mejoran armas, curas y cartas). Todo con su coste en recursos del terrario.
import { localize } from '../i18n/index.js';

export const MERCHANT = { every: 3, first: 2, offers: 4 };
// Cambios posibles (se sortean cuatro por visita con la semilla del día). `species`: vende un isópodo.
export const TRADES = [
  { give: { hojarasca: 6 }, get: { ambar: 1 } },
  { give: { musgo: 6 }, get: { ambar: 1 } },
  { give: { cal: 5 }, get: { ambar: 1 } },
  { give: { esporas: 4 }, get: { ambar: 1 } },
  { give: { ambar: 1 }, get: { hojarasca: 5 } },
  { give: { ambar: 1 }, get: { musgo: 5 } },
  { give: { ambar: 1 }, get: { cal: 4 } },
  { give: { ambar: 1 }, get: { esporas: 3 } },
  { give: { ambar: 2 }, get: { isopodo: 1 } },
];

export const UPGRADES = localize('upgrades', {
  rocio: { name: 'Odre de rocío', stage: 1, desc: 'Empiezas cada expedición con una gota de rocío más.', icon: 'items', cost: { ambar: 2, musgo: 4 } },
  armero: { name: 'Ojo de armero', stage: 2, desc: 'Al entrar al nido eliges entre tres armas.', icon: 'attack', cost: { ambar: 3 } },
  quitina: { name: 'Quitina templada', stage: 1, desc: '+10 % de vida en la expedición.', icon: 'shield', cost: { ambar: 3, cal: 5 } },
  tasador: { name: 'Tasador', stage: 2, desc: 'El mercader trae una oferta más.', icon: 'hogar', cost: { ambar: 2, hojarasca: 6 } },
  coro: { name: 'Coro de la colonia', stage: 3, desc: 'La reunión diaria da el doble de lealtad.', icon: 'colony', cost: { ambar: 2, esporas: 3 } },
});
