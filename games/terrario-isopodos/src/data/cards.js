// Cartas de expedición: se eligen en los nodos «carta» y duran hasta volver al terrario.
// `mods` suma (o multiplica, si termina en Mul) estadísticas de combate del equipo.
import { localize } from '../i18n/index.js';

export const CARDS = localize('cards', {
  quitina: { name: 'Quitina dura', desc: '+20 % de vida máxima.', mods: { hpMul: 1.2 } },
  mandibula: { name: 'Mandíbula afilada', desc: '+25 % de daño básico.', mods: { damageMul: 1.25 } },
  prisa: { name: 'Prisa húmeda', desc: 'El ATB se llena un 30 % más rápido.', mods: { atbMul: 1.3 } },
  presion: { name: 'Ojo de presión', desc: 'Aturdes un 40 % más rápido.', mods: { staggerMul: 1.4 } },
  rocio: { name: 'Bolsillo de rocío', desc: 'Una gota de rocío más.', mods: { gota: 1 } },
  muda: { name: 'Muda rápida', desc: 'Cada victoria cura un 15 % al equipo.', mods: { winHeal: 0.15 } },
});
