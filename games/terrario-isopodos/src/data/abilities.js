// Habilidades (gastan segmentos de ATB) y objetos (no gastan ATB, se agotan). Los interpreta
// src/game/combat.js según `kind`:
//   strike  golpe al enemigo más cercano en `range` (power, staggerMul)
//   heal    cura a todo el equipo (power)
//   shield  escudo que absorbe daño al equipo (power) durante `time`
//   taunt   los enemigos atacan a quien la usa durante `time`
//   burst   daño en círculo alrededor del usuario (range)
import { localize } from '../i18n/index.js';

export const ABILITIES = localize('abilities', {
  embestida: { name: 'Embestida', atb: 1, kind: 'strike', power: 24, staggerMul: 3, range: 2.2 },
  rodada: { name: 'Rodada en bola', atb: 2, kind: 'burst', power: 34, staggerMul: 1.5, range: 2.4 },
  caparazon: { name: 'Caparazón', atb: 1, kind: 'shield', power: 30, time: 8 },
  provocar: { name: 'Provocar', atb: 1, kind: 'taunt', time: 6 },
  rocio: { name: 'Rocío', atb: 1, kind: 'heal', power: 26 },
  esporas: { name: 'Nube de esporas', atb: 2, kind: 'burst', power: 22, staggerMul: 4, range: 3 },
});

export const ITEMS = localize('items', {
  gota: { name: 'Gota de rocío', kind: 'heal', power: 40 },
  hongo: { name: 'Hongo picante', kind: 'strike', power: 45, staggerMul: 2, range: 6 },
});
