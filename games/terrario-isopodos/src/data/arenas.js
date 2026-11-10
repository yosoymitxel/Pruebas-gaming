// Arenas del nido: cambian cómo se pelea. `pillars`: raíces que cortan el paso (sirven para cubrirse);
// `pools`: charcas de esporas que queman a quien las pisa, aberraciones incluidas (atráelas); `pit`: pozo en
// el centro que obliga a pelear en anillo. La disposición sale de la semilla del encuentro (game/arena.js).
import { localize } from '../i18n/index.js';

export const ARENAS = localize('arenas', {
  claro: { name: 'Claro', hint: 'Campo abierto: rueda y castiga.', pillars: 0, pools: 0, pit: 0 },
  raices: { name: 'Raíces', hint: 'Cúbrete tras las raíces cuando cargue.', pillars: 4, pools: 0, pit: 0 },
  charcas: { name: 'Charcas de esporas', hint: 'Las charcas queman a todos: atrae a las aberraciones.', pillars: 0, pools: 3, pit: 0 },
  hondonada: { name: 'Hondonada', hint: 'Un pozo en medio: se pelea en anillo.', pillars: 0, pools: 0, pit: 1.7 },
  marana: { name: 'Maraña', hint: 'Raíces y charcas: muévete con cabeza.', pillars: 2, pools: 2, pit: 0 },
});
export const POOL = { r: 1.05, dps: 7, tick: 0.5 };
export const PILLAR_R = [0.45, 0.7];
// La guardiana pelea en claro u hondonada: su sello necesita sitio.
export const BOSS_ARENAS = ['claro', 'hondonada'];
