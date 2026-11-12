// Rasgos de cada isópodo, como los de los seguidores de Cult of the Lamb (wiki: Follower traits): nacen con
// uno o dos, buenos o malos, y cambian cómo trabajan, comen, ganan lealtad o aguantan en la expedición.
// `good`: ventaja; `odds`: peso al sortear. Efectos (los lee src/game/home.js y run.js):
// loyalMul (lealtad ganada), workMul (obras y trabajo), hungerMul, hpMul (expedición), faithJoin (fe al llegar),
// blessFaith (fe extra por mimo), fearMul.
import { localize } from '../i18n/index.js';

export const TRAITS = localize('traits', {
  obediente: { name: 'Obediente', desc: 'Al llegar, +10 de fe.', good: true, faithJoin: 10 },
  trabajador: { name: 'Trabajador', desc: 'Construye y trabaja un 15 % más rápido.', good: true, workMul: 1.15 },
  credulo: { name: 'Crédulo', desc: '+15 % de lealtad de todo.', good: true, loyalMul: 1.15 },
  robusto: { name: 'Robusto', desc: '+10 % de vida en la expedición.', good: true, hpMul: 1.1 },
  devoto: { name: 'Devoto', desc: 'Cada mimo da +3 de fe más.', good: true, blessFaith: 3 },
  frugal: { name: 'Frugal', desc: 'Pasa hambre un 20 % más lento.', good: true, hungerMul: 0.8 },
  esceptico: { name: 'Escéptico', desc: 'Al llegar, −10 de fe.', good: false, faithJoin: -10 },
  perezoso: { name: 'Perezoso', desc: 'Construye y trabaja un 10 % más lento.', good: false, workMul: 0.9 },
  cinico: { name: 'Cínico', desc: '−15 % de lealtad de todo.', good: false, loyalMul: 0.85 },
  gloton: { name: 'Glotón', desc: 'Pasa hambre un 25 % más rápido.', good: false, hungerMul: 1.25 },
  fragil: { name: 'Frágil', desc: '−10 % de vida en la expedición.', good: false, hpMul: 0.9 },
  miedoso: { name: 'Miedoso', desc: 'Los sustos le duran el doble.', good: false, fearMul: 2 },
});

// Uno seguro y, la mitad de las veces, un segundo distinto. Sin opuestos (trabajador y perezoso a la vez).
const OPPOSITE = { trabajador: 'perezoso', credulo: 'cinico', robusto: 'fragil', frugal: 'gloton', obediente: 'esceptico' };
export function rollTraits(rng) {
  const ids = Object.keys(TRAITS), a = ids[Math.floor(rng() * ids.length)], out = [a];
  if (rng() < 0.5) {
    const bad = (x) => x === a || OPPOSITE[a] === x || OPPOSITE[x] === a;
    const rest = ids.filter((x) => !bad(x));
    out.push(rest[Math.floor(rng() * rest.length)]);
  }
  return out;
}
// Producto de un efecto multiplicador de los rasgos de un isópodo (1 si no tiene).
export const traitMul = (iso, k) => (iso?.traits ?? []).reduce((m, id) => m * (TRAITS[id]?.[k] ?? 1), 1);
export const traitSum = (iso, k) => (iso?.traits ?? []).reduce((m, id) => m + (TRAITS[id]?.[k] ?? 0), 0);
