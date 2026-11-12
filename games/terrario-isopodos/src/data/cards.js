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
  furia: { name: 'Furia contenida', kind: 'ataque', rarity: 'comun', icon: 'attack', desc: 'El golpe fuerte se recarga un 40 % antes.', mods: { heavyCdMul: 0.6 } },
  eco: { name: 'Eco del golpe', kind: 'ataque', rarity: 'rara', icon: 'roll', desc: 'El golpe fuerte alcanza un 40 % más lejos.', mods: { heavyRadiusMul: 1.4 } },
  savia: { name: 'Savia amarga', kind: 'ataque', rarity: 'comun', icon: 'leaf', desc: 'Cada golpe tiene un 15 % de envenenar.', mods: { poisonChance: 0.15 } },
  sangria: { name: 'Sangría', kind: 'defensa', rarity: 'rara', icon: 'items', desc: 'Cada aberración que cae cura un 4 % al equipo.', mods: { vampKill: 0.04 } },
  filo: { name: 'Filo de quitina', kind: 'ataque', rarity: 'comun', icon: 'jefe', desc: '10 % de crítico (×2).', mods: { critChance: 0.1 } },
  remate: { name: 'Remate', kind: 'ataque', rarity: 'comun', icon: 'attack', desc: 'El último golpe del combo pega un 50 % más.', mods: { finisherMul: 1.5 } },
  muda: { name: 'Muda rápida', kind: 'defensa', rarity: 'rara', icon: 'leaf', desc: 'Cada victoria cura un 15 % al equipo.', mods: { winHeal: 0.15 } },
});

export const CARD_KINDS = localize('cardKinds', { ataque: { name: 'Ataque' }, defensa: { name: 'Defensa' }, ritmo: { name: 'Ritmo' }, objeto: { name: 'Objeto' } });
export const RARITIES = localize('rarities', { comun: { name: 'común' }, rara: { name: 'rara' } });
