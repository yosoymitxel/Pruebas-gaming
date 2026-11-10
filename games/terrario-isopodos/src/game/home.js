// El terrario: rejilla con piezas, capas de sustrato y clima interior; colonia que pasea, come y descansa,
// y recursos que producen las piezas y se recogen a mano. Lógica pura; el tiempo avanza con tickHome.
import { BUILDINGS, EXPANSIONS, GRID_SIDE } from '../data/buildings.js';
import { CLASSES, NAMES } from '../data/isopods.js';
import { SPECIES, BEHAVIOR, speciesOf } from '../data/species.js';
import { createGrid, openRect, place, canPlace, blocked, collideGrid } from './grid.js';
import { bump } from '../core/physics.js';
import { LAYERS, START_LAYERS, HUMIDITY, CLIMATES } from '../data/substrate.js';

const HUNGER_DRAIN = 1 / 480; // de lleno a vacío en 8 min de juego
const WALK = 1.1;
const START_RES = { hojarasca: 8, musgo: 5, esporas: 2, cal: 1, ambar: 1 };

// `shell` guarda la especie (SPECIES); las partidas viejas con colores caen en la cochinilla común.
function newIsopod(rng, id, cls, taken = [], species) {
  const classes = Object.keys(CLASSES);
  const names = NAMES.filter((n) => !taken.includes(n));
  const name = names.length ? names[Math.floor(rng() * names.length)] : `${NAMES[id % NAMES.length]} ${id}`;
  return {
    id, name, cls: cls ?? classes[Math.floor(rng() * classes.length)],
    shell: species ?? Object.keys(SPECIES)[Math.floor(rng() * Object.keys(SPECIES).length)], hunger: 1, x: 0, y: 0, vx: 0, vy: 0, tx: null, ty: null, wait: 0,
    ball: 0, molting: 0, moltT: BEHAVIOR.moltEvery[0] + rng() * (BEHAVIOR.moltEvery[1] - BEHAVIOR.moltEvery[0]), baby: 0,
  };
}

export function newHome(rng) {
  const grid = createGrid(GRID_SIDE, GRID_SIDE);
  const home = { grid, expansion: -1, resources: { ...START_RES }, isopods: [], nextIsopod: 1, stock: {}, fear: 0, layers: { ...START_LAYERS }, weather: 'claro' };
  expand(home, true);
  const c = GRID_SIDE / 2;
  place(grid, 'refugio', c - 3, c - 3);
  place(grid, 'comedero', c + 1, c - 2);
  ['rodador', 'guardian', 'musgoso', null].forEach((cls) => recruit(home, rng, cls ?? undefined));
  return home;
}

export const recruit = (home, rng, cls, species) => addIsopod(home, newIsopod(rng, home.nextIsopod++, cls, home.isopods.map((i) => i.name), species), rng);
// Adultos: los que pueden salir de expedición (las crías se quedan hasta crecer).
export const adults = (home) => home.isopods.filter((i) => !(i.baby > 0));

function addIsopod(home, iso, rng) {
  const c = GRID_SIDE / 2;
  for (let k = 0; k < 40; k++) {
    const x = c - 2 + rng() * 4, y = c - 2 + rng() * 4;
    if (!blocked(home.grid, Math.floor(x), Math.floor(y))) { Object.assign(iso, { x, y }); break; }
  }
  home.isopods.push(iso);
}

export const nextExpansion = (home) => EXPANSIONS[home.expansion + 1] ?? null;

export function expand(home, free = false) {
  const next = nextExpansion(home);
  if (!next || (!free && !pay(home, next.cost))) return false;
  home.expansion++;
  const o = (GRID_SIDE - next.side) / 2;
  openRect(home.grid, o, o, next.side, next.side);
  return true;
}

export const canAfford = (home, cost) => Object.entries(cost).every(([r, n]) => (home.resources[r] ?? 0) >= n);

export function pay(home, cost) {
  if (!canAfford(home, cost)) return false;
  for (const [r, n] of Object.entries(cost)) home.resources[r] -= n;
  return true;
}

export function build(home, type, x, y, rot = 0) {
  if (!canPlace(home.grid, type, x, y, rot) || !canAfford(home, BUILDINGS[type].cost)) return null;
  pay(home, BUILDINGS[type].cost);
  return place(home.grid, type, x, y, rot);
}

export const beds = (home) => 4 + Object.values(home.grid.pieces).reduce((s, p) => s + (BUILDINGS[p.type].beds ?? 0), 0);

export const layer = (home, id) => home.layers?.[id] ?? START_LAYERS[id];

// Humedad 0–1 a partir de lo que hay dentro: piezas húmedas, clima de fuera y grava (que deja subir el techo).
// De dónde sale: [{ source: 'base' | 'weather' | <pieza>, amount }], para explicarlo en la interfaz.
export function humidityParts(home) {
  const parts = [{ source: 'base', amount: HUMIDITY.base }, { source: 'weather', amount: HUMIDITY.weather[home.weather] ?? 0 }];
  for (const p of Object.values(home.grid.pieces)) if (HUMIDITY.pieces[p.type]) parts.push({ source: p.type, amount: HUMIDITY.pieces[p.type] });
  return parts;
}

export function humidity(home) {
  const raw = humidityParts(home).reduce((s, p) => s + p.amount, 0);
  return Math.max(0, Math.min(HUMIDITY.flood + layer(home, 'grava') * HUMIDITY.perGrava, raw));
}

// Multiplicadores que el terrario aplica ahora mismo (para la interfaz y tickHome).
export function homeEffects(home) {
  const clim = CLIMATES[climate(home)];
  return { prodMul: clim.prodMul * (1 + (layer(home, 'tierra') - 1) * 0.1), hungerMul: clim.hungerMul * (1 - layer(home, 'hojarasca') * 0.15) };
}

// Clima interior: seco, ideal, muy húmedo (el carbón lo contiene) o moho. Ver CLIMATES.
export function climate(home) {
  const h = humidity(home);
  if (h < HUMIDITY.dry) return 'seco';
  if (h <= HUMIDITY.wet) return 'ideal';
  return h - HUMIDITY.wet <= layer(home, 'carbon') * 0.06 ? 'humedo' : 'moho';
}

export const nextLayerCost = (home, id) => LAYERS[id].costs[layer(home, id)] ?? null;

export function upgradeLayer(home, id) {
  const cost = nextLayerCost(home, id);
  if (!cost || !pay(home, cost)) return false;
  home.layers = { ...START_LAYERS, ...home.layers, [id]: layer(home, id) + 1 };
  return true;
}

// Calma 0–1: decoración, hojarasca y clima suben; hacinamiento, mal clima y miedo de la última expedición bajan.
export function calm(home) {
  const deco = Object.values(home.grid.pieces).reduce((s, p) => s + (BUILDINGS[p.type].calm ?? 0), 0);
  const crowd = Math.max(0, home.isopods.length - beds(home)) * 0.08;
  const litter = layer(home, 'hojarasca') * 0.05;
  return Math.max(0, Math.min(1, 0.45 + deco + litter + CLIMATES[climate(home)].calm - crowd - home.fear));
}

// Lo que el estado del terrario aporta a la expedición.
export function partyBonus(home, iso) {
  return { hpMul: 0.75 + 0.25 * iso.hunger, atbMul: 0.8 + 0.4 * calm(home) };
}

export function collect(home, pieceId) {
  const p = home.grid.pieces[pieceId], s = home.stock[pieceId];
  if (!p || !s?.ready) return 0;
  const { res } = BUILDINGS[p.type].produces;
  const n = s.ready;
  home.resources[res] = (home.resources[res] ?? 0) + n;
  s.ready = 0;
  return n;
}

// `phase`: efectos de la hora (DAY_PHASES): de noche se produce menos y sube el miedo.
export function tickHome(home, dt, rng, phase = { prodMul: 1, fear: 0 }) {
  home.clockT = (home.clockT ?? 0) + dt;
  home.fear = Math.min(1, Math.max(0, home.fear - dt / 600 + phase.fear * dt));
  const { hungerMul } = homeEffects(home), prodMul = homeEffects(home).prodMul * phase.prodMul;
  for (const p of Object.values(home.grid.pieces)) {
    const prod = BUILDINGS[p.type].produces;
    if (!prod) continue;
    const s = (home.stock[p.id] ??= { ready: 0, t: 0 });
    if (s.ready >= prod.cap) continue;
    if ((s.t += dt * prodMul) >= prod.every) { s.t = 0; s.ready = Math.min(prod.cap, s.ready + prod.amount); }
  }
  for (const iso of home.isopods) { if (!lifecycle(home, iso, dt, rng)) walk(home, iso, dt, rng, hungerMul, phase); }
  breed(home, dt, rng);
  for (let i = 0; i < home.isopods.length; i++) {
    for (let j = i + 1; j < home.isopods.length; j++) bump(home.isopods[i], home.isopods[j], 0.6, 0);
  }
  for (const iso of home.isopods) collideGrid(home.grid, iso, 0.28);
}

// Bolita, muda y crecimiento. Devuelve true si el isópodo no camina este fotograma.
function lifecycle(home, iso, dt, rng) {
  if (iso.baby > 0) iso.baby = Math.max(0, iso.baby - dt);
  if (iso.ball > 0) { iso.ball -= dt; iso.vx = iso.vy = 0; return true; }
  if (iso.molting > 0) {
    iso.vx = iso.vy = 0;
    if ((iso.molting -= dt) <= 0) (home.molts ??= []).push({ id: `${iso.id}-${Math.floor(home.clockT ?? 0)}`, x: iso.x - 0.4, y: iso.y + 0.2 });
    return true;
  }
  if (!(iso.baby > 0) && (iso.moltT = (iso.moltT ?? BEHAVIOR.moltEvery[0]) - dt) <= 0) {
    iso.molting = BEHAVIOR.moltTime;
    iso.moltT = BEHAVIOR.moltEvery[0] + rng() * (BEHAVIOR.moltEvery[1] - BEHAVIOR.moltEvery[0]);
    return true;
  }
  return false;
}

// Crías (mancas): con la colonia tranquila y su clima a gusto, cada tanto nace una de un adulto al azar.
function breed(home, dt, rng) {
  if ((home.breedT = (home.breedT ?? 0) + dt) < BEHAVIOR.breedEvery) return;
  home.breedT = 0;
  const parents = adults(home), mom = parents[Math.floor(rng() * parents.length)];
  if (!mom || calm(home) < 0.55 || home.isopods.length >= beds(home) + 2) return;
  const s = speciesOf(mom.shell), cl = climate(home);
  if (cl === 'moho' || rng() > 0.5 * s.breed * (cl === s.humidity ? 1.4 : 1)) return;
  recruit(home, rng, undefined, mom.shell);
  const baby = home.isopods[home.isopods.length - 1];
  Object.assign(baby, { baby: BEHAVIOR.growTime, x: mom.x, y: mom.y + 0.3 });
}

// Tocar un isópodo: los que pueden se hacen bolita; los demás salen corriendo.
export function poke(home, iso, from) {
  if (iso.molting > 0) return 'molting';
  if (speciesOf(iso.shell).rolls) { iso.ball = BEHAVIOR.ballTime; iso.tx = null; return 'ball'; }
  const dx = iso.x - from.x, dy = iso.y - from.y, d = Math.hypot(dx, dy) || 1;
  iso.tx = iso.x + (dx / d) * 3; iso.ty = iso.y + (dy / d) * 3; iso.stuck = 0; iso.dash = 1.2;
  return 'run';
}

// Recoger una muda: el caparazón viejo es calcio (cal) que vuelve al terrario.
export function takeMolt(home, id) {
  const i = (home.molts ?? []).findIndex((m) => m.id === id);
  if (i < 0) return false;
  home.molts.splice(i, 1);
  home.resources.cal = (home.resources.cal ?? 0) + 1;
  return true;
}

// Paseo: de día buscan contacto y sombra (tigmotaxis y luz: se arriman a piezas y bordes); de noche, que es
// cuando están activos, exploran todo el terrario más rápido.
function walk(home, iso, dt, rng, hungerMul, phase) {
  iso.hunger = Math.max(0, iso.hunger - HUNGER_DRAIN * hungerMul * dt);
  const feeder = iso.hunger < 0.5 && home.resources.hojarasca > 0 && Object.values(home.grid.pieces).find((p) => BUILDINGS[p.type].feeds);
  if (feeder) {
    const fx = feeder.x + 0.5, fy = feeder.y + 0.5;
    if (Math.hypot(iso.x - fx, iso.y - fy) < 1.1) { iso.hunger = 1; home.resources.hojarasca--; iso.tx = null; iso.wait = 1.5; }
    else { iso.tx = fx; iso.ty = fy; }
  }
  if (iso.wait > 0) { iso.wait -= dt; iso.vx = iso.vy = 0; return; }
  if (iso.tx === null) {
    let tx = Math.floor(rng() * home.grid.w) + 0.5, ty = Math.floor(rng() * home.grid.h) + 0.5;
    const cover = Object.values(home.grid.pieces);
    if (!phase.night && cover.length && rng() < 0.7) { const p = cover[Math.floor(rng() * cover.length)]; tx = p.x - 0.5 + rng() * 3; ty = p.y + 2.2 + rng() * 0.6; }
    if (!blocked(home.grid, Math.floor(tx), Math.floor(ty)) && Math.hypot(tx - iso.x, ty - iso.y) < 5) { iso.tx = tx; iso.ty = ty; iso.stuck = 0; }
    return;
  }
  const dx = iso.tx - iso.x, dy = iso.ty - iso.y, d = Math.hypot(dx, dy);
  iso.stuck = (iso.stuck ?? 0) + dt;
  if (d < 0.2 || iso.stuck > 6) { iso.tx = null; iso.wait = 1 + rng() * 3; iso.vx = iso.vy = 0; return; }
  const v = WALK * speciesOf(iso.shell).speed * (phase.night ? 1.25 : 0.85) * (iso.dash > 0 ? 2.6 : 1) * (iso.baby > 0 ? 0.6 : 1);
  if (iso.dash > 0) iso.dash -= dt;
  iso.vx = (dx / d) * v; iso.vy = (dy / d) * v;
  iso.x += iso.vx * dt; iso.y += iso.vy * dt;
}
