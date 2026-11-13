// Mercader y mejoras (src/data/economy.js). Lógica pura sobre la partida (game).
import { MERCHANT, TRADES, UPGRADES } from '../data/economy.js';
import { mulberry32 } from '../core/rng.js';
import { canAfford, pay, recruit, unlocked } from './home.js';
import { OUTFITS } from '../data/outfits.js';

export const merchantToday = (game) => game.day >= MERCHANT.first && game.day % MERCHANT.every === MERCHANT.first % MERCHANT.every;

// Las ofertas del día (las mismas aunque se recargue la partida).
export function merchant(game) {
  if (!merchantToday(game)) return null;
  if (game.merchant?.day !== game.day) {
    const rng = mulberry32(game.seed * 31 + game.day * 7), pool = TRADES.map((_, k) => k), offers = [];
    const n = MERCHANT.offers + ((game.upgrades ?? []).includes('tasador') ? 1 : 0);
    while (offers.length < n && pool.length) offers.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
    game.merchant = { day: game.day, offers, sold: [] };
  }
  return game.merchant;
}

export function trade(game, k, rng = Math.random) {
  const m = merchant(game), i = m?.offers[k], o = TRADES[i];
  if (!o || m.sold.includes(k) || !canAfford(game.home, o.give)) return false;
  pay(game.home, o.give);
  for (const [r, n] of Object.entries(o.get)) { if (r === 'isopodo') for (let j = 0; j < n; j++) recruit(game.home, rng); else game.home.resources[r] = (game.home.resources[r] ?? 0) + n; }
  m.sold.push(k);
  return true;
}

export const hasUpgrade = (game, id) => (game.upgrades ?? []).includes(id);
// Armario (como el sastre de Cult of the Lamb): un atuendo se paga una vez y queda para toda la colonia.
export const hasOutfit = (game, id) => (game.wardrobe ?? []).includes(id);
export function buyOutfit(game, id) {
  const o = OUTFITS[id];
  if (!o || hasOutfit(game, id) || !pay(game.home, o.cost)) return false;
  (game.wardrobe ??= []).push(id);
  return true;
}
export function wearOutfit(game, iso, id) {
  if (id != null && !hasOutfit(game, id)) return false;
  iso.outfit = id === iso.outfit ? null : id;
  return true;
}
export function buyUpgrade(game, id) {
  const u = UPGRADES[id];
  if (!u || hasUpgrade(game, id) || !unlocked(game.home, u) || !pay(game.home, u.cost)) return false;
  (game.upgrades ??= []).push(id);
  return true;
}
