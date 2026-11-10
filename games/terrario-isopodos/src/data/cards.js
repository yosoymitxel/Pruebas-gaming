// Cartas de expedición: se eligen en los nodos «carta» y duran hasta volver al terrario.
// `mods` suma (o multiplica, si termina en Mul) estadísticas de combate del equipo. `kind` pinta el marco
// (como las cartas de KureiChaosChess), `rarity` la gema y el borde, `icon` el dibujo (src/ui/icons.js).
import { localize } from '../i18n/index.js';

export const CARDS = localize('cards', {
  quitina: { name: 'Quitina dura', kind: 'defensa', rarity: 'rara', icon: 'shield', desc: '+20 % de vida máxima.', mods: { hpMul: 1.2 } },
  mandibula: { name: 'Mandíbula afilada', kind: 'ataque', rarity: 'comun', icon: 'attack', desc: '+25 % de daño básico.', mods: { damageMul: 1.25 } },
  prisa: { name: 'Prisa húmeda', kind: 'ritmo', rarity: 'comun', icon: 'tactical', desc: 'El ATB se llena un 30 % más rápido.', mods: { atbMul: 1.3 } },
  presion: { name: 'Ojo de presión', kind: 'ataque', rarity: 'rara', icon: 'jefe', desc: 'Aturdes un 40 % más rápido.', mods: { staggerMul: 1.4 } },
  rocio: { name: 'Bolsillo de rocío', kind: 'objeto', rarity: 'comun', icon: 'items', desc: 'Una gota de rocío más.', mods: { gota: 1 } },
  muda: { name: 'Muda rápida', kind: 'defensa', rarity: 'rara', icon: 'leaf', desc: 'Cada victoria cura un 15 % al equipo.', mods: { winHeal: 0.15 } },
});

export const CARD_KINDS = localize('cardKinds', { ataque: { name: 'Ataque' }, defensa: { name: 'Defensa' }, ritmo: { name: 'Ritmo' }, objeto: { name: 'Objeto' } });
export const RARITIES = localize('rarities', { comun: { name: 'común' }, rara: { name: 'rara' } });
