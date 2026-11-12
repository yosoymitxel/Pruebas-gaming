// Armas de expedición, como las de Cult of the Lamb (wiki: Weapons): cada salida empieza eligiendo una entre
// dos y en las salas de arma se puede cambiar. Cambian el combo básico de todo el equipo.
// `combo`: golpes seguidos (windup/recover en s, mul de daño); `reach`: alcance; `arc`: abertura del tajo.
// CotL: espada equilibrada 3 golpes; hacha lenta (×0,5 vel.) y fuerte; daga rápida (×2) 5 golpes;
// guanteletes 3 golpes con el último ×3; martillo un solo golpe ×4 muy lento.
import { localize } from '../i18n/index.js';

export const WEAPONS = localize('weapons', {
  pinza: { name: 'Pinza', desc: 'Equilibrada: tres golpes.', icon: 'attack', reach: 1.25, arc: 1.1,
    combo: [{ windup: 0.12, recover: 0.16, mul: 1 }, { windup: 0.12, recover: 0.16, mul: 1.1 }, { windup: 0.2, recover: 0.4, mul: 1.8 }] },
  mandibula: { name: 'Mandíbula', desc: 'Lenta y amplia: pega fuerte.', icon: 'jefe', reach: 1.6, arc: 1.6,
    combo: [{ windup: 0.24, recover: 0.3, mul: 2 }, { windup: 0.24, recover: 0.3, mul: 2 }, { windup: 0.34, recover: 0.55, mul: 2.8 }] },
  aguijon: { name: 'Aguijón', desc: 'Rapidísimo: cinco pinchazos cortos.', icon: 'tactical', reach: 0.95, arc: 0.8,
    combo: [0, 1, 2, 3].map(() => ({ windup: 0.06, recover: 0.08, mul: 0.42 })).concat([{ windup: 0.1, recover: 0.28, mul: 1 }]) },
  garras: { name: 'Garras', desc: 'Dos toques y un tercero que revienta.', icon: 'roll', reach: 1.1, arc: 1.2,
    combo: [{ windup: 0.1, recover: 0.14, mul: 0.8 }, { windup: 0.1, recover: 0.14, mul: 0.8 }, { windup: 0.22, recover: 0.42, mul: 3 }] },
  maza: { name: 'Maza de quitina', desc: 'Un mazazo enorme y muy lento.', icon: 'shield', reach: 1.5, arc: 2.2,
    combo: [{ windup: 0.4, recover: 0.55, mul: 4.8 }] },
});

// Variantes (CotL: Bane, Vampiric, Merciless, Godly). `odds`: probabilidad de que salga al sortear.
export const VARIANTS = localize('weaponVariants', {
  comun: { name: '', desc: '', odds: 0.55 },
  venenosa: { name: 'venenosa', desc: 'A veces envenena (daño cada segundo).', odds: 0.15, poison: { chance: 0.35, dps: 4, time: 3 } },
  vampirica: { name: 'vampírica', desc: 'Al matar, a veces cura al equipo.', odds: 0.13, vamp: { chance: 0.5, heal: 0.08 } },
  despiadada: { name: 'despiadada', desc: 'Cada 4 s el siguiente golpe es crítico ×3.', odds: 0.12, crit: { every: 4, mul: 3 } },
  divina: { name: 'divina', desc: '+50 % de daño.', odds: 0.05, damageMul: 1.5 },
});

export const weaponName = (w) => `${WEAPONS[w.type].name}${VARIANTS[w.variant].name ? ` ${VARIANTS[w.variant].name}` : ''}`;
// Sorteo de un arma (tipo y variante) con un rng; `except` evita repetir tipo en la misma oferta.
export function rollWeapon(rng, except = []) {
  const types = Object.keys(WEAPONS).filter((t) => !except.includes(t)), type = types[Math.floor(rng() * types.length)];
  let r = rng(), variant = 'comun';
  for (const [k, v] of Object.entries(VARIANTS)) { if (r < v.odds) { variant = k; break; } r -= v.odds; }
  return { type, variant };
}
