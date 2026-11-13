// El terrario: rejilla con piezas, capas de sustrato y clima interior; colonia que pasea, come y descansa,
// y recursos que producen las piezas y se recogen a mano. Lógica pura; el tiempo avanza con tickHome.
import { BUILDINGS, EXPANSIONS, GRID_SIDE, MAX_LEVEL } from '../data/buildings.js';
import { CLASSES, NAMES, MAX_NAME } from '../data/isopods.js';
import { BADGES } from '../data/palettes.js';
import { SKILLS } from '../data/skills.js';
import { SPECIES, BEHAVIOR, speciesOf } from '../data/species.js';
import { createGrid, openRect, place, canPlace, blocked, collideGrid, remove } from './grid.js';
import { bump } from '../core/physics.js';
import { mulberry32 } from '../core/rng.js';
import { TRAITS, rollTraits, traitMul, traitSum } from '../data/traits.js';
import { FAITH, LOYALTY, WISHES, SERMON, SITE, JOBS, RITUALS, HARVEST } from '../data/cult.js';
import { LAYERS, START_LAYERS, HUMIDITY, CLIMATES, ZEN, MOLD, MOLT_EATEN, MOLT_CAL } from '../data/substrate.js';

const BREED_FOOD = 3;
const HUNGER_DRAIN = 1 / 900; // de lleno a vacío en 15 min de juego
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
    traits: rollTraits(rng),
  };
}

export function newHome(rng) {
  const grid = createGrid(GRID_SIDE, GRID_SIDE);
  const home = { grid, expansion: -1, resources: { ...START_RES }, isopods: [], nextIsopod: 1, stock: {}, fear: 0, layers: { ...START_LAYERS }, weather: 'claro' };
  expand(home, true); expand(home, true); // se empieza con 10 × 10
  const c = GRID_SIDE / 2;
  place(grid, 'refugio', c - 3, c - 3);
  place(grid, 'comedero', c + 1, c - 2);
  // Un terrario que funciona desde el primer minuto: agua a un lado (humedad y gradiente) y un tronco que da comida.
  place(grid, 'charca', c + 2, c + 2);
  place(grid, 'tronco', c - 4, c + 2);
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
  const join = traitSum(iso, 'faithJoin');
  if (join) addFaith(home, join > 0 ? 'obediente' : 'esceptico');
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

// `site`: se coloca como obra y la colonia la levanta (como en Cult of the Lamb); sin `site`, aparece hecha.
export function build(home, type, x, y, rot = 0, site = false) {
  if (!canPlace(home.grid, type, x, y, rot) || !canAfford(home, BUILDINGS[type].cost)) return null;
  pay(home, BUILDINGS[type].cost);
  const id = place(home.grid, type, x, y, rot);
  const f = BUILDINGS[type].size;
  if (site) home.grid.pieces[home.grid.nextId - 1].site = { t: 0, need: SITE.perCell * f.w * f.h };
  else addFaith(home, BUILDINGS[type].calm ? 'deco' : 'pieza');
  return id;
}
// Una pieza en obra no funciona todavía (ni cama, ni comida, ni humedad, ni producción, ni calma).
export const live = (p) => !p.site;
const livePieces = (home) => Object.values(home.grid.pieces).filter(live);
// Obras: avanzan solas despacio y mucho más rápido con isópodos trabajando al lado.
function tickSites(home, dt) {
  for (const p of Object.values(home.grid.pieces)) {
    if (!p.site) continue;
    const f = BUILDINGS[p.type].size, cx = p.x + f.w / 2, cy = p.y + f.h / 2;
    const n = home.isopods.filter((i) => i.order === 'construir' && i.siteId === p.id && Math.hypot(i.x - cx, i.y - cy) < Math.max(f.w, f.h) / 2 + 1.2).reduce((sum, i) => sum + traitMul(i, 'workMul'), 0);
    if ((p.site.t += dt * (SITE.alone + SITE.perWorker * n)) < p.site.need) continue;
    delete p.site;
    addFaith(home, BUILDINGS[p.type].calm ? 'deco' : 'pieza'); (home.builtNow ??= []).push(p.id);
    for (const i of home.isopods) if (i.siteId === p.id) { i.order = null; i.siteId = null; i.tx = null; i.wait = 0.8; }
  }
}
// Trabajo (como asignar un seguidor al aserradero): se queda junto a una pieza que produce y la acelera.
export function workers(home, p) {
  const f = BUILDINGS[p.type].size, cx = p.x + f.w / 2, cy = p.y + f.h / 2;
  return home.isopods.filter((i) => i.job === p.id && !(i.rest > 0) && Math.hypot(i.x - cx, i.y - cy) < Math.max(f.w, f.h) / 2 + 1.5).reduce((sum, i) => sum + traitMul(i, 'workMul'), 0);
}

// ——— La colonia como un culto (src/data/cult.js) ———
// Fe: cada evento suma o resta su cifra (y queda en faithLog para que la interfaz lo enseñe al momento).
export function addFaith(home, key) {
  const ev = FAITH.events[key]; if (!ev) return;
  home.faith ??= FAITH.start;
  home.faith = Math.max(FAITH.min, Math.min(FAITH.max, (home.faith ?? FAITH.start) + ev.delta));
  (home.faithLog ??= []).push({ key, delta: ev.delta });
  if (home.faithLog.length > 20) home.faithLog.shift();
}
// Lealtad: al llenar la barra sube de nivel, deja su recompensa y algo de fe.
export function gainLoyalty(home, iso, n) {
  iso.loyal = (iso.loyal ?? 0) + n * traitMul(iso, 'loyalMul');
  while (iso.loyal >= LOYALTY.max) {
    iso.loyal -= LOYALTY.max; iso.lv = (iso.lv ?? 0) + 1;
    for (const [r, k] of Object.entries(LOYALTY.reward)) home.resources[r] = (home.resources[r] ?? 0) + k;
    addFaith(home, 'nivel'); (home.levelUps ??= []).push(iso.id);
  }
}
// Mimo (el «bendecir» de CotL): uno por isópodo y por día.
export function bless(home, iso, day) {
  if (iso.blessDay === day) return false;
  iso.blessDay = day; iso.ball = 0; iso.wait = 1.2;
  gainLoyalty(home, iso, LOYALTY.mimo); addFaith(home, 'mimo');
  if (traitSum(iso, 'blessFaith')) addFaith(home, 'devoto');
  if (iso.wish?.kind === 'mimo') fulfil(home, iso);
  return true;
}
export const canBless = (iso, day) => iso.blessDay !== day;
// Reunión diaria (el sermón): la colonia se junta en círculo alrededor del altar (o del refugio).
export function sermon(home, day, loyMul = 1) {
  if (day != null && home.sermonDay === day) return false;
  const spot = temple(home);
  if (!spot || home.sermon) return false;
  const f = spot ? BUILDINGS[spot.type].size : { w: 0, h: 0 }, c = home.grid.w / 2;
  if (day != null) home.sermonDay = day;
  home.sermon = { t: SERMON.time, total: SERMON.time, x: spot ? spot.x + f.w / 2 : c, y: spot ? spot.y + f.h + 1 : c, mul: loyMul };
  const who = adults(home);
  who.forEach((iso, k) => { const a = (k / who.length) * Math.PI * 2; Object.assign(iso, { order: 'reunir', rest: 0, ball: 0, wait: 0, stuck: 0, tx: home.sermon.x + Math.cos(a) * SERMON.ring, ty: home.sermon.y + Math.sin(a) * SERMON.ring }); });
  return true;
}
export const canSermon = (home, day) => home.sermonDay !== day;
// Templo = el altar: punto de encuentro de la colonia (sermón y rituales). Sin altar no hay templo.
export const temple = (home) => Object.values(home.grid.pieces).find((p) => p.type === 'altar' && !p.site) ?? null;
export const ritualReady = (home, id, day) => (home.rituals?.[id] ?? -99) + RITUALS[id].every <= day;
export function ritual(home, id, day) {
  const r = RITUALS[id], spot = temple(home);
  if (!r || !spot || home.sermon || !ritualReady(home, id, day) || !pay(home, r.cost)) return false;
  (home.rituals ??= {})[id] = day;
  // la colonia se junta en el altar como en la reunión, y el efecto llega al terminar
  sermon(home, null, 0); home.sermon.ritual = id;
  return true;
}
function ritualEffect(home, id) {
  const all = home.isopods;
  if (id === 'festin') for (const i of all) { i.hunger = 1; i.ate = 1.5; }
  else if (id === 'lluvia') home.moist = Math.min(1, humidity(home) + 0.25);
  else if (id === 'cosecha') home.harvestT = HARVEST.time;
  else if (id === 'vigilia') { home.fear = 0; addFaith(home, 'vigilia'); }
  else if (id === 'vinculo') for (const i of all) gainLoyalty(home, i, 45);
  addFaith(home, 'ritual');
}
function fulfil(home, iso) {
  iso.wish = null; addFaith(home, 'peticion'); gainLoyalty(home, iso, LOYALTY.peticion);
}
function tickCult(home, dt, rng, phase) {
  home.faith ??= FAITH.start; // se apaga sola hacia 0
  if (home.faith) home.faith -= Math.sign(home.faith) * Math.min(Math.abs(home.faith), FAITH.decay * dt);
  // reunión en curso
  if (home.sermon && (home.sermon.t -= dt) <= 0) {
    for (const iso of home.isopods) if (iso.order === 'reunir') { iso.order = null; iso.tx = null; if (home.sermon.mul) gainLoyalty(home, iso, LOYALTY.reunion * home.sermon.mul); }
    if (home.sermon.ritual) { ritualEffect(home, home.sermon.ritual); home.ritualDone = home.sermon.ritual; } else { addFaith(home, 'reunion'); home.sermonDone = true; }
    home.sermon = null;
  }
  // anochecer y amanecer
  const night = !!phase.night;
  if (night && !home.wasNight && home.isopods.length > beds(home)) addFaith(home, 'camas');
  if (!night && home.wasNight) { if (home.isopods.some((i) => i.hunger < 0.35)) addFaith(home, 'hambre'); for (const i of home.isopods) { if (i.nightSleep) { i.rest = 0; i.nightSleep = false; i.bed = null; } if (i.night) { i.night = false; i.goBed = null; if (i.order === 'dormir') i.order = null; } } }
  home.wasNight = night;
  // peticiones
  for (const iso of home.isopods) {
    const w = iso.wish; if (!w) continue;
    if ((w.t -= dt) <= 0) { iso.wish = null; addFaith(home, 'fallo'); continue; }
    if ((w.kind === 'pieza' && livePieces(home).some((p) => p.type === w.piece)) || (w.kind === 'humedad' && comfy(home, iso))) fulfil(home, iso);
  }
  if ((home.wishT = (home.wishT ?? 0) + dt) < WISHES.every) return;
  home.wishT = 0;
  if (home.isopods.filter((i) => i.wish).length >= (home.isopods.length >= 6 ? WISHES.max : 1)) return;
  const free = adults(home).filter((i) => !i.wish), iso = free[Math.floor(rng() * free.length)];
  if (!iso) return;
  const missing = WISHES.kinds.pieza.pieces.filter((t) => !Object.values(home.grid.pieces).some((p) => p.type === t));
  const opts = [...(missing.length ? ['pieza'] : []), ...(comfy(home, iso) ? [] : ['humedad']), 'comer', 'mimo'];
  const kind = opts[Math.floor(rng() * opts.length)];
  iso.wish = { kind, t: WISHES.time, piece: kind === 'pieza' ? missing[Math.floor(rng() * missing.length)] : undefined };
}

export const lvl = (p) => p.level ?? 1;
export const beds = (home) => 4 + Object.values(home.grid.pieces).filter(live).reduce((s, p) => s + (BUILDINGS[p.type].beds ?? 0) * lvl(p), 0);

// Mejorar una pieza: nivel 2 y 3 (ver `upgrade` en BUILDINGS).
export const upgradeCost = (p) => BUILDINGS[p.type].upgrade?.[lvl(p) - 1] ?? null;
export function upgradePiece(home, id) {
  const p = home.grid.pieces[id], cost = p && upgradeCost(p);
  if (!cost || lvl(p) >= MAX_LEVEL || !pay(home, cost)) return false;
  p.level = lvl(p) + 1;
  return true;
}

// Quitar una pieza devuelve la mitad de lo que costó.
export function storePiece(home, id) {
  const p = home.grid.pieces[id];
  if (!p || BUILDINGS[p.type].feeds && Object.values(home.grid.pieces).filter((q) => BUILDINGS[q.type].feeds).length === 1) return false;
  for (const [r, n] of Object.entries(BUILDINGS[p.type].cost)) home.resources[r] = (home.resources[r] ?? 0) + Math.floor(n / 2);
  remove(home.grid, id);
  delete home.stock[id];
  return true;
}

// Partidas guardadas con una rejilla más chica: se agranda centrando lo que había.
export function fitGrid(home) {
  const g = home.grid;
  if (g.w >= GRID_SIDE) return;
  const o = (GRID_SIDE - g.w) / 2, n = createGrid(GRID_SIDE, GRID_SIDE);
  for (let j = 0; j < g.h; j++) for (let i = 0; i < g.w; i++) if (g.open[j * g.w + i]) openRect(n, i + o, j + o, 1, 1);
  for (const p of Object.values(g.pieces)) { place(n, p.type, p.x + o, p.y + o, p.rot); const q = n.pieces[n.nextId - 1]; q.level = p.level; home.stock[q.id] = home.stock[p.id]; }
  for (const iso of home.isopods) { iso.x += o; iso.y += o; iso.tx = null; }
  home.grid = n;
}

export const layer = (home, id) => home.layers?.[id] ?? START_LAYERS[id];

// Humedad 0–1 a partir de lo que hay dentro: piezas húmedas, clima de fuera y grava (que deja subir el techo).
// De dónde sale: [{ source: 'base' | 'weather' | <pieza>, amount }], para explicarlo en la interfaz.
export function humidityParts(home) {
  const parts = [{ source: 'base', amount: HUMIDITY.base }, { source: 'weather', amount: HUMIDITY.weather[home.weather] ?? 0 }];
  if (home.mist > 0) parts.push({ source: 'rocio', amount: HUMIDITY.mist * Math.min(1, home.mist / ZEN.mistTime) });
  for (const p of livePieces(home)) if (HUMIDITY.pieces[p.type]) parts.push({ source: p.type, amount: HUMIDITY.pieces[p.type] });
  parts.push({ source: 'tapa', amount: HUMIDITY.lid[home.lid ?? 1] });
  return parts;
}

// Humedad a la que tiende el sustrato con lo que hay ahora (fuentes, clima y tapa).
export function humidityTarget(home) {
  const raw = humidityParts(home).reduce((s, p) => s + p.amount, 0);
  return Math.max(0, Math.min(HUMIDITY.flood + layer(home, 'grava') * HUMIDITY.perGrava, raw));
}
// Humedad real del sustrato: se mueve despacio hacia el objetivo (tickHome). Partidas viejas: arranca en el objetivo.
export const humidity = (home) => home.moist ?? humidityTarget(home);

// Humedad en una celda: la general más lo que mojan (o secan) las piezas cercanas. Así se arma el gradiente.
export function localHumidity(home, x, y) {
  let h = humidity(home);
  for (const p of livePieces(home)) {
    const L = HUMIDITY.local[p.type];
    if (!L) continue;
    const f = BUILDINGS[p.type].size, d = Math.hypot(x - (p.x + f.w / 2), y - (p.y + f.h / 2));
    if (d < L[1]) h += L[0] * (1 - d / L[1]);
  }
  return Math.max(0, Math.min(1, h));
}
const inBand = (h, band) => h >= HUMIDITY.bands[band][0] && h <= HUMIDITY.bands[band][1];
// ¿Tiene el terrario un rincón para cada gusto? Busca en la rejilla la celda más seca y la más húmeda.
export function gradient(home) {
  const g = home.grid; let lo = 1, hi = 0;
  for (let j = 0; j < g.h; j++) for (let i = 0; i < g.w; i++) if (g.open[j * g.w + i]) { const h = localHumidity(home, i + 0.5, j + 0.5); lo = Math.min(lo, h); hi = Math.max(hi, h); }
  return { lo, hi, ok: hi - lo >= 0.18 };
}
// Un isópodo está a gusto si está en una celda de la humedad que prefiere su especie.
export const comfy = (home, iso) => inBand(localHumidity(home, iso.x, iso.y), speciesOf(iso.shell).humidity);

// Multiplicadores que el terrario aplica ahora mismo (para la interfaz y tickHome).
export function homeEffects(home) {
  const clim = CLIMATES[climate(home)];
  return { prodMul: clim.prodMul * (1 + (layer(home, 'tierra') - 1) * 0.1) * (home.harvestT > 0 ? HARVEST.mul : 1), hungerMul: clim.hungerMul * (1 - layer(home, 'hojarasca') * 0.15) };
}

// Clima interior: seco, ideal, muy húmedo (el carbón lo contiene) o moho. Ver CLIMATES.
export function climate(home) {
  const h = humidity(home);
  if (h < HUMIDITY.dry) return 'seco';
  if (h <= HUMIDITY.wet) return 'ideal';
  return (home.mold?.length ?? 0) >= 3 ? 'moho' : 'humedo';
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
  const deco = livePieces(home).reduce((s, p) => s + (BUILDINGS[p.type].calm ?? 0) * lvl(p), 0);
  const crowd = Math.max(0, home.isopods.length - beds(home)) * 0.08;
  const litter = layer(home, 'hojarasca') * 0.05;
  const grad = gradient(home).ok ? 0.08 : 0, mold = (home.mold?.length ?? 0) * MOLD.calm;
  const happy = home.isopods.length ? home.isopods.filter((i) => comfy(home, i)).length / home.isopods.length : 1;
  return Math.max(0, Math.min(1, 0.4 + deco + litter + grad + happy * 0.1 + (home.faith ?? 0) / 250 + CLIMATES[climate(home)].calm - crowd - mold - home.fear));
}

// Lo que el estado del terrario aporta a la expedición.
export function partyBonus(home, iso) {
  return { hpMul: (0.75 + 0.25 * iso.hunger) * (1 + (iso.lv ?? 0) * LOYALTY.hpPerLevel), atbMul: 0.8 + 0.4 * calm(home) };
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
  if (home.mist > 0) home.mist = Math.max(0, home.mist - dt);
  if (home.mistCd > 0) home.mistCd = Math.max(0, home.mistCd - dt);
  if (home.harvestT > 0) home.harvestT -= dt;
  home.moist = humidity(home) + Math.max(-HUMIDITY.drift * dt, Math.min(HUMIDITY.drift * dt, humidityTarget(home) - humidity(home)));
  growMold(home, dt, rng);
  tickCult(home, dt, rng, phase);
  for (const iso of home.isopods) iso.traits ??= rollTraits(mulberry32(iso.id * 977 + 13)); // partidas viejas
  for (const m of home.molts ?? []) m.t = (m.t ?? 0) + dt;
  const eaten = (home.molts ?? []).filter((m) => m.t >= MOLT_EATEN);
  if (eaten.length) { home.molts = home.molts.filter((m) => m.t < MOLT_EATEN); home.calBits = (home.calBits ?? 0) + eaten.length * MOLT_CAL; const n = Math.floor(home.calBits); home.calBits -= n; home.resources.cal = (home.resources.cal ?? 0) + n; }
  home.leaves = [];
  home.fear = Math.min(1, Math.max(0, home.fear - dt / 600 + phase.fear * dt));
  const { hungerMul } = homeEffects(home), prodMul = homeEffects(home).prodMul * phase.prodMul;
  tickSites(home, dt);
  for (const p of livePieces(home)) {
    const prod = BUILDINGS[p.type].produces;
    if (!prod) continue;
    const boost = 1 + JOBS.boost * Math.min(JOBS.max, workers(home, p));
    const s = (home.stock[p.id] ??= { ready: 0, t: 0 });
    if (s.ready < prod.cap + (lvl(p) - 1) * 2 && (s.t += dt * prodMul * boost * (1 + (lvl(p) - 1) * 0.35)) >= prod.every) { s.t = 0; s.ready = Math.min(prod.cap + (lvl(p) - 1) * 2, s.ready + prod.amount); }
    if (s.ready && boost > 1) { home.resources[prod.res] = (home.resources[prod.res] ?? 0) + s.ready; (home.autoGot ??= []).push({ id: p.id, res: prod.res, n: s.ready }); s.ready = 0; } // el trabajador lo lleva al almacén
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
  if (!mom || calm(home) < 0.55 || home.isopods.length >= beds(home) || (home.resources.hojarasca ?? 0) < BREED_FOOD) return; // criar pide cama libre y comida de sobra
  const s = speciesOf(mom.shell), cl = climate(home);
  if (cl === 'moho' || rng() > 0.5 * s.breed * (comfy(home, mom) ? 1.4 : 0.6)) return;
  recruit(home, rng, undefined, mom.shell);
  home.resources.hojarasca -= BREED_FOOD;
  const baby = home.isopods[home.isopods.length - 1];
  Object.assign(baby, { baby: BEHAVIOR.growTime, x: mom.x, y: mom.y + 0.3 });
  addFaith(home, 'miembro');
}

// Como el jardín zen de KureiChaosChess: gestos de cuidado. Rociar sube la humedad un rato (con espera) y
// de la rama caen hojas que se recogen a mano como hojarasca.
export function mist(home) {
  if (home.mistCd > 0) return false;
  home.mist = ZEN.mistTime; home.mistCd = ZEN.mistCooldown;
  return true;
}
// Moho: con el sustrato muy húmedo brota en las celdas más mojadas (antes junto a comida pudriéndose);
// cada colonia de colémbolos se come una mancha cada tanto. El carbón frena que brote.
function growMold(home, dt, rng) {
  home.mold ??= [];
  const springs = Object.values(home.grid.pieces).filter((p) => p.type === 'colembolos').length;
  if (springs && home.mold.length && (home.moldEat = (home.moldEat ?? 0) + dt * springs) >= MOLD.eat) { home.moldEat = 0; home.mold.shift(); }
  if ((home.moldT = (home.moldT ?? 0) + dt) < MOLD.every * (1 + layer(home, 'carbon'))) return;
  home.moldT = 0;
  if (home.mold.length >= MOLD.max) return;
  const g = home.grid;
  for (let k = 0; k < 20; k++) {
    const i = Math.floor(rng() * g.w), j = Math.floor(rng() * g.h);
    if (!g.open[j * g.w + i] || g.cells[j * g.w + i] !== null) continue;
    if (localHumidity(home, i + 0.5, j + 0.5) < MOLD.at) continue;
    home.mold.push({ id: `mo${Math.floor(home.clockT)}${k}`, x: i + 0.5, y: j + 0.5 });
    return;
  }
}
export function setLid(home, level) { home.lid = Math.max(0, Math.min(2, level)); return home.lid; }
function dropLeaf(home, dt, rng) {
  if ((home.leafT = (home.leafT ?? 0) + dt) < ZEN.leafEvery) return;
  home.leafT = 0;
  home.leaves ??= [];
  if (home.leaves.length >= ZEN.leafMax) return;
  const g = home.grid;
  for (let k = 0; k < 30; k++) {
    const i = Math.floor(rng() * g.w), j = Math.floor(rng() * g.h);
    if (g.open[j * g.w + i] && g.cells[j * g.w + i] === null) { home.leaves.push({ id: `l${Math.floor(home.clockT)}`, x: i + 0.5, y: j + 0.5, t: 0 }); return; }
  }
}
export function takeLeaf(home, id) {
  const i = (home.leaves ?? []).findIndex((l) => l.id === id);
  if (i < 0) return false;
  home.leaves.splice(i, 1);
  home.resources.hojarasca = (home.resources.hojarasca ?? 0) + 1;
  return true;
}

// Tocar un isópodo: los que pueden se hacen bolita; los demás salen corriendo.
export function poke(home, iso, from) {
  if (iso.molting > 0) return 'molting';
  if (iso.rest > 0) { iso.rest = 0; iso.nightSleep = false; iso.bed = null; addFaith(home, 'despertar'); return 'woke'; }
  if (speciesOf(iso.shell).rolls) { iso.ball = BEHAVIOR.ballTime; iso.tx = null; return 'ball'; }
  const dx = iso.x - from.x, dy = iso.y - from.y, d = Math.hypot(dx, dy) || 1;
  iso.tx = iso.x + (dx / d) * 3; iso.ty = iso.y + (dy / d) * 3; iso.stuck = 0; iso.dash = 1.2 * traitMul(iso, 'fearMul');
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
  // Durmiendo en un refugio: quieto, gasta menos y calma a la colonia.
  if (iso.rest > 0) { if ((iso.rest -= dt) <= 0) iso.bed = null; iso.vx = iso.vy = 0; iso.hunger = Math.max(0, iso.hunger - HUNGER_DRAIN * hungerMul * traitMul(iso, 'hungerMul') * dt * 0.3); home.fear = Math.max(0, home.fear - dt * 0.002); return; }
  iso.hunger = Math.max(0, iso.hunger - HUNGER_DRAIN * hungerMul * traitMul(iso, 'hungerMul') * dt);
  if (iso.order === 'reunir') { // de pie en el círculo de la reunión, mirando al centro
    if (Math.hypot(iso.tx - iso.x, iso.ty - iso.y) < 0.25 || (iso.stuck = (iso.stuck ?? 0) + dt) > 10) { iso.vx = iso.vy = 0; return; }
    stepTo(home, iso, iso.tx, iso.ty, WALK * 1.4, dt); return;
  }
  // Obras: los que están libres se acercan a levantarla (dos por obra como mucho) y se quedan dándole.
  if (!phase.night && !iso.order && !(iso.baby > 0) && iso.hunger >= 0.35) {
    const site = Object.values(home.grid.pieces).find((p) => p.site && home.isopods.filter((o) => o.siteId === p.id).length < SITE.maxWorkers);
    if (site) { const f = BUILDINGS[site.type].size; Object.assign(iso, { order: 'construir', siteId: site.id, tx: site.x + rng() * f.w, ty: site.y + f.h + 0.4, stuck: 0 }); }
  }
  if (iso.order === 'construir') {
    if (!home.grid.pieces[iso.siteId]?.site || phase.night) { iso.order = null; iso.siteId = null; iso.tx = null; }
    else { if (Math.hypot(iso.tx - iso.x, iso.ty - iso.y) < 0.3) { iso.vx = iso.vy = 0; return; }
      stepTo(home, iso, iso.tx, iso.ty, WALK * 1.2, dt); return; }
  }
  // Trabajo asignado: de día vuelve a su pieza y se queda ahí (sale a comer y a dormir como todos).
  const job = iso.job != null && home.grid.pieces[iso.job];
  if (iso.job != null && !job) iso.job = null;
  if (job && !phase.night && !iso.order && iso.hunger >= 0.5) {
    const f = BUILDINGS[job.type].size, cx = job.x + f.w / 2, cy = job.y + f.h + 0.4;
    if (Math.hypot(iso.x - cx, iso.y - cy) < 0.6) { iso.vx = iso.vy = 0; return; }
    iso.tx = cx + (rng() - 0.5) * 0.4; iso.ty = cy; iso.stuck = 0;
  }
  const hungry = iso.hunger < 0.5 || iso.order === 'comer';
  // De noche se van a dormir solos: a una cama libre o, si no hay, se hacen un ovillo donde estén.
  if (phase.night && !iso.order && !(iso.baby > 0) && iso.hunger >= 0.35) {
    const own = iso.home != null && home.grid.pieces[iso.home];
    if (iso.home != null && !own) iso.home = null;
    const bed = own || nearest(home, iso, (b, p) => b.beds && home.isopods.filter((o) => o.bed === p.id || o.goBed === p.id || o.home === p.id).length < b.beds * lvl(p));
    if (bed) { iso.order = 'dormir'; iso.goBed = bed.id; iso.night = true; }
    else { iso.rest = 1e9; iso.nightSleep = true; iso.vx = iso.vy = 0; return; }
  }
  const feeder = hungry && home.resources.hojarasca > 0 && ((iso.order === 'comer' && iso.feedAt != null && home.grid.pieces[iso.feedAt]) || nearest(home, iso, (b) => b.feeds));
  if (feeder) {
    const fx = feeder.x + 0.5, fy = feeder.y + 0.5;
    if (Math.hypot(iso.x - fx, iso.y - fy) < 1.6) { iso.hunger = 1; home.resources.hojarasca--; iso.tx = null; iso.wait = 1.5; iso.ate = 1.5; iso.order = null; gainLoyalty(home, iso, LOYALTY.comer); if (iso.wish?.kind === 'comer') fulfil(home, iso); else addFaith(home, 'comer'); }
    else { iso.tx = fx; iso.ty = fy; }
  } else if (iso.order === 'comer') iso.order = null; // sin comida o sin comedero: la orden no se puede cumplir
  const bed = !feeder && iso.order === 'dormir' && ((iso.goBed != null && home.grid.pieces[iso.goBed]) || nearest(home, iso, (b) => b.beds));
  if (bed) {
    const f = BUILDINGS[bed.type].size, bx = bed.x + f.w / 2, by = bed.y + f.h + 0.3;
    if (Math.hypot(iso.x - bx, iso.y - by) < 0.9 || (iso.stuck ?? 0) > 5) { iso.rest = iso.night ? 1e9 : BEHAVIOR.restTime; iso.nightSleep = !!iso.night; iso.night = false; iso.goBed = null; iso.bed = bed.id; iso.order = null; iso.tx = null; return; }
    iso.tx = bx; iso.ty = by;
  } else if (iso.order === 'dormir' && !feeder) iso.order = null;
  if (iso.ate > 0) iso.ate -= dt;
  if (iso.wait > 0) { iso.wait -= dt; iso.vx = iso.vy = 0; return; }
  if (iso.tx === null) {
    let tx = Math.floor(rng() * home.grid.w) + 0.5, ty = Math.floor(rng() * home.grid.h) + 0.5;
    const cover = Object.values(home.grid.pieces);
    if (!phase.night && cover.length && rng() < 0.7) { const p = cover[Math.floor(rng() * cover.length)]; tx = p.x - 0.5 + rng() * 3; ty = p.y + 2.2 + rng() * 0.6; }
    // Buscan su humedad: si no están a gusto, prueban otro sitio hasta dar con uno de su banda.
    if (!comfy(home, iso)) for (let k = 0; k < 6 && !inBand(localHumidity(home, tx, ty), speciesOf(iso.shell).humidity); k++) { tx = Math.floor(rng() * home.grid.w) + 0.5; ty = Math.floor(rng() * home.grid.h) + 0.5; }
    if (!blocked(home.grid, Math.floor(tx), Math.floor(ty)) && Math.hypot(tx - iso.x, ty - iso.y) < (comfy(home, iso) ? 5 : 12)) { iso.tx = tx; iso.ty = ty; iso.stuck = 0; }
    return;
  }
  const d = Math.hypot(iso.tx - iso.x, iso.ty - iso.y);
  iso.stuck = (iso.stuck ?? 0) + dt;
  if (d < 0.2 || iso.stuck > 10) { if (iso.order === 'humedad') iso.order = null; iso.tx = null; iso.wait = 1 + rng() * 3; iso.vx = iso.vy = 0; return; }
  const v = WALK * speciesOf(iso.shell).speed * (phase.night ? 1.25 : 0.85) * (iso.dash > 0 ? 2.6 : 1) * (iso.baby > 0 ? 0.6 : 1);
  if (iso.dash > 0) iso.dash -= dt;
  stepTo(home, iso, iso.tx, iso.ty, v, dt);
}

// Camino por la rejilla (BFS en 4 direcciones) hasta la celda del objetivo o una vecina: así rodean las piezas
// en vez de quedarse empujando contra ellas. Se recalcula solo al cambiar de celda o de objetivo.
function waypoint(home, iso, tx, ty) {
  const g = home.grid, fi = Math.floor(iso.x), fj = Math.floor(iso.y), gi = Math.floor(tx), gj = Math.floor(ty);
  if (Math.abs(fi - gi) <= 1 && Math.abs(fj - gj) <= 1) return [tx, ty];
  const key = `${fi},${fj}>${gi},${gj}`;
  if (iso._wp?.key === key) return iso._wp.at;
  const free = (i, j) => i >= 0 && j >= 0 && i < g.w && j < g.h && g.open[j * g.w + i] && g.cells[j * g.w + i] === null;
  const prev = new Map([[fj * g.w + fi, -1]]), q = [fj * g.w + fi];
  let end = -1;
  for (let h = 0; h < q.length && end < 0; h++) {
    const c = q[h], i = c % g.w, j = Math.floor(c / g.w);
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di, nj = j + dj, n = nj * g.w + ni;
      if (prev.has(n) || !free(ni, nj)) continue;
      prev.set(n, c); q.push(n);
      if (Math.abs(ni - gi) <= 1 && Math.abs(nj - gj) <= 1) { end = n; break; }
    }
  }
  let at = [tx, ty];
  if (end >= 0) { let c = end; while (prev.get(c) !== fj * g.w + fi && prev.get(c) !== -1) c = prev.get(c); at = [(c % g.w) + 0.5, Math.floor(c / g.w) + 0.5]; }
  iso._wp = { key, at };
  return at;
}
// Da un paso hacia (tx, ty) siguiendo el camino. Devuelve la distancia que queda al objetivo final.
function stepTo(home, iso, tx, ty, v, dt) {
  const d = Math.hypot(tx - iso.x, ty - iso.y);
  const [wx, wy] = waypoint(home, iso, tx, ty), dx = wx - iso.x, dy = wy - iso.y, w = Math.hypot(dx, dy) || 1;
  iso.vx = (dx / w) * v; iso.vy = (dy / w) * v; iso.x += iso.vx * dt; iso.y += iso.vy * dt;
  return d;
}

// Pieza más cercana que cumple `test(building)`.
function nearest(home, iso, test) {
  let best = null, bd = Infinity;
  for (const p of Object.values(home.grid.pieces)) { if (p.site || !test(BUILDINGS[p.type], p)) continue; const d = Math.hypot(p.x - iso.x, p.y - iso.y); if (d < bd) { bd = d; best = p; } }
  return best;
}

// Qué hace ahora (clave de STATUS en data/isopods.js).
export function isoStatus(home, iso) {
  if (iso.ball > 0) return 'bolita';
  if (iso.molting > 0) return 'muda';
  if (iso.rest > 0) return 'duerme';
  if (iso.order === 'reunir') return 'reunion';
  if (iso.order === 'construir') return 'construye';
  if (iso.job != null && !(iso.hunger < 0.5)) return 'trabaja';
  if (iso.ate > 0) return 'come';
  if (iso.order === 'dormir') return 'dormir';
  if (iso.order === 'humedad') return 'humedad';
  if (iso.order === 'comer' || (iso.hunger < 0.5 && home.resources.hojarasca > 0 && nearest(home, iso, (b) => b.feeds))) return 'comer';
  if (iso.hunger < 0.35) return 'hambre';
  if (iso.baby > 0) return 'cria';
  return 'explora';
}

// Órdenes del jugador: 'comer' (al comedero aunque no tenga hambre) o 'dormir' (al refugio más cercano).
// Devuelve false si no se puede (no hay comedero, comida o refugio).
// `pieceId`: la pieza concreta (trabajar en ese criadero, dormir en ese refugio, comer en ese comedero). Asignar
// es bilateral: la ficha del isópodo elige pieza y la ficha de la pieza elige isópodos; las dos llaman aquí.
// 'trabajar' con pieceId null deja el trabajo; 'dormir' guarda la cama como suya (iso.home) para cada noche.
// 'humedad': va al punto más cercano con su humedad ideal.
export function orderIso(home, iso, what, pieceId) {
  if (iso.molting > 0) return false;
  const piece = pieceId != null ? home.grid.pieces[pieceId] : null, def = piece && BUILDINGS[piece.type];
  if (pieceId != null && (!piece || piece.site)) return false;
  if (what === 'trabajar') {
    if (pieceId === null || (pieceId === undefined && iso.job != null)) { iso.job = null; return true; }
    const p = piece ?? nearest(home, iso, (b) => b.produces);
    if (!p || !BUILDINGS[p.type].produces) return false;
    iso.job = p.id; iso.tx = null; return true;
  }
  if (what === 'comer' && !(home.resources.hojarasca > 0 && (def ? def.feeds : nearest(home, iso, (b) => b.feeds)))) return false;
  if (what === 'dormir') {
    if (def) { if (!def.beds || (sleepersOf(home, piece).filter((o) => o !== iso).length >= def.beds * lvl(piece))) return false; iso.home = piece.id; }
    else if (!nearest(home, iso, (b) => b.beds)) return false;
  }
  if (what === 'humedad') { const spot = comfySpot(home, iso); if (!spot) return false; Object.assign(iso, { order: 'humedad', rest: 0, ball: 0, wait: 0, stuck: 0, tx: spot.x, ty: spot.y }); return true; }
  iso.order = what; iso.rest = 0; iso.ball = 0; iso.wait = 0; iso.tx = null; iso.stuck = 0;
  if (what === 'dormir') iso.goBed = piece?.id ?? iso.home ?? null;
  if (what === 'comer') iso.feedAt = piece?.id ?? null;
  return true;
}
// Quién trabaja en / duerme en una pieza (para su ficha).
export const workersOf = (home, p) => home.isopods.filter((i) => i.job === p.id);
export const sleepersOf = (home, p) => home.isopods.filter((i) => i.home === p.id);
// Punto más cercano del suelo con la humedad que pide su especie (o null si no hay ninguno).
export function comfySpot(home, iso) {
  const band = speciesOf(iso.shell).humidity, g = home.grid;
  let best = null, bd = Infinity;
  for (let y = 0.5; y < g.h; y += 1) for (let x = 0.5; x < g.w; x += 1) {
    if (blocked(g, Math.floor(x), Math.floor(y)) || !inBand(localHumidity(home, x, y), band)) continue;
    const d = Math.hypot(x - iso.x, y - iso.y);
    if (d < bd) { bd = d; best = { x, y }; }
  }
  return best;
}

export function renameIso(home, iso, name) {
  const n = String(name ?? '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
  if (!n) return false;
  iso.name = n;
  return true;
}

export function badgeIso(home, iso, k) { iso.badge = k === null || k === iso.badge ? null : Math.max(0, Math.min(BADGES.length - 1, k)); }

// Árbol de mudas: lo que suma lo aprendido y qué habilidades tiene en combate.
export function isoStats(iso) {
  const out = { hpMul: 1, damageAdd: 0, speedMul: 1, abilities: [...CLASSES[iso.cls].abilities] };
  for (const id of iso.skills ?? []) {
    const k = SKILLS[id]; if (!k) continue;
    out.hpMul += k.hpMul ?? 0; out.damageAdd += k.damageAdd ?? 0; out.speedMul += k.speedMul ?? 0;
    if (k.ability?.[iso.cls]) out.abilities.push(k.ability[iso.cls]);
  }
  return out;
}

export const canLearn = (home, iso, id) => !!SKILLS[id] && !(iso.skills ?? []).includes(id) && (!SKILLS[id].needs || (iso.skills ?? []).includes(SKILLS[id].needs)) && !(iso.baby > 0);

export function learnSkill(home, iso, id) {
  if (!canLearn(home, iso, id) || !canAfford(home, SKILLS[id].cost)) return false;
  pay(home, SKILLS[id].cost);
  (iso.skills ??= []).push(id);
  return true;
}
