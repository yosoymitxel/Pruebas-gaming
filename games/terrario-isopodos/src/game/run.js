// Expedición a un nido: un isópodo principal + dos de apoyo recorren el mapa interior. La vida se
// arrastra entre salas; el botín y los rescatados vuelven al terrario al terminar (si se pierde,
// solo la mitad del botín y ningún rescatado).
import { ARENAS, BOSS_ARENAS } from '../data/arenas.js';
import { CLASSES } from '../data/isopods.js';
import { CARDS } from '../data/cards.js';
import { BIOMES } from '../data/world.js';
import { ROBES } from '../data/robes.js';
import { rollWeapon } from '../data/weapons.js';
import { traitMul } from '../data/traits.js';
import { genDungeon, nextNodes, enemiesFor, enemyHpMul } from './dungeon.js';
import { partyBonus, recruit, isoStats , addRes } from './home.js';
import { mulberry32, pickFrom } from '../core/rng.js';
import { genFloor } from './floor.js';
import { speciesOf } from '../data/species.js';

// `heat`: escalón de dificultad tras ganar una guardiana (como la Ascensión de Slay the Spire o el Calor de Hades).
export const HEAT = { hp: 0.12, dmg: 0.1, max: 10 };
// `opts`: { robe (ROBES), upgrades (UPGRADES compradas) }. Se empieza eligiendo arma (estado 'weapon').
export function newRun(home, island, partyIds, heat = 0, opts = {}) {
  const rng = mulberry32(island.seed + 7), robe = ROBES[opts.robe] ? opts.robe : 'comun', ups = opts.upgrades ?? [], hpRobe = ROBES[robe].mods.hpMul ?? 1;
  const party = partyIds.map((id) => {
    const iso = home.isopods.find((x) => x.id === id);
    const st = isoStats(iso), maxHp = Math.round(CLASSES[iso.cls].hp * speciesOf(iso.shell).hp * partyBonus(home, iso).hpMul * st.hpMul * hpRobe * (ups.includes('quitina') ? 1.1 : 1) * traitMul(iso, 'hpMul'));
    return { id, name: iso.name, cls: iso.cls, shell: iso.shell, outfit: iso.outfit ?? null, paint: iso.badge ?? null, hp: maxHp, maxHp, damageAdd: st.damageAdd, speedMul: st.speedMul, abilities: st.abilities };
  });
  const run = {
    island, dungeon: genDungeon(island.seed), party, items: { gota: 2 + (ups.includes('rocio') ? 1 : 0), hongo: 1 }, cards: [],
    loot: {}, rescued: 0, state: 'weapon', offer: null, node: null, seed: Math.floor(rng() * 1e9),
    atbMul: partyBonus(home, home.isopods.find((x) => x.id === partyIds[0])).atbMul, heat, depth: 0, robe, weapon: null,
  };
  // Al entrar se elige arma entre dos (tres con la mejora del armero), como el arma de la entrada en CotL.
  const w1 = rollWeapon(rng); run.weaponOffer = [w1, rollWeapon(rng, [w1.type])];
  if (ups.includes('armero')) run.weaponOffer.push(rollWeapon(rng, run.weaponOffer.map((w) => w.type)));
  for (let k = 0; k < (ROBES[robe].startCards ?? 0); k++) { const pool = Object.keys(CARDS).filter((id) => !run.cards.includes(id)); if (pool.length) run.cards.push(pool[Math.floor(rng() * pool.length)]); }
  return run;
}
export function pickWeapon(run, k) {
  const w = run.state === 'weapon' ? run.weaponOffer?.[k] : null;
  if (!w) return false;
  run.weapon = w; run.weaponOffer = null; run.state = 'map';
  return true;
}
// Sala de arma: se puede cambiar la del equipo por la que hay en el pedestal.
// Altar maldito: carta rara a cambio de un 25 % de la vida actual de cada uno (sin bajar de 1).
export function acceptPact(run) {
  const room = run.floor?.rooms[run.floor.at];
  if (room?.type !== 'maldito' || room.taken) return false;
  const pool = Object.keys(CARDS).filter((id) => !run.cards.includes(id) && CARDS[id].rarity === 'rara');
  room.taken = true;
  for (const p of run.party) p.hp = Math.max(1, Math.round(p.hp * 0.75));
  if (pool.length) run.cards.push(pool[Math.floor(Math.random() * pool.length)]);
  const m = CARDS[run.cards[run.cards.length - 1]]?.mods ?? {};
  if (m.gota) run.items.gota += m.gota;
  return true;
}
export function swapWeapon(run) {
  const room = run.floor?.rooms[run.floor.at];
  if (!room?.weapon || room.taken) return false;
  [run.weapon, room.weapon] = [room.weapon, run.weapon]; room.taken = true;
  return true;
}

export function runMods(run) {
  const mods = { atbMul: run.atbMul, weapon: run.weapon };
  for (const [k, v] of Object.entries(ROBES[run.robe ?? 'comun'].mods)) { if (k === 'hpMul') continue; if (typeof v === 'boolean') mods[k] = v; else if (k.endsWith('Mul')) mods[k] = (mods[k] ?? 1) * v; else mods[k] = (mods[k] ?? 0) + v; }
  for (const id of run.cards) {
    for (const [k, v] of Object.entries(CARDS[id].mods)) {
      if (k.endsWith('Mul')) mods[k] = (mods[k] ?? 1) * v; else mods[k] = (mods[k] ?? 0) + v;
    }
  }
  return mods;
}

// Entra en un nodo alcanzable. Devuelve false si no se puede.
export function enterNode(run, nodeId) {
  if (run.state !== 'map') return false;
  const node = nextNodes(run.dungeon).find((n) => n.id === nodeId);
  if (!node) return false;
  run.dungeon.at = node.id;
  node.done = true;
  run.depth = Math.max(run.depth ?? 0, node.layer + 1);
  run.last = null;
  run.node = node;
  const rng = mulberry32(run.seed + node.id * 31);
  if (node.type === 'combate' || node.type === 'elite' || node.type === 'jefe') {
    // Un nivel de pelea es un piso de salas (floor.js); se empieza en la primera.
    run.floor = genFloor(node.type, run.seed + node.id * 17);
    run.state = 'floor';
    enterRoom(run, 0);
  } else if (node.type === 'botin') {
    const before = { ...run.loot };
    addLoot(run, rng, 3);
    const found = Object.fromEntries(Object.entries(run.loot).map(([r, n]) => [r, n - (before[r] ?? 0)]).filter(([, n]) => n));
    const rescued = rng() < 0.5;
    if (rescued) run.rescued++;
    run.last = { type: 'botin', found, rescued };
  } else if (node.type === 'refugio') {
    for (const p of run.party) p.hp = Math.min(p.maxHp, p.hp + Math.ceil(p.maxHp * 0.5));
    run.last = { type: 'refugio' };
  } else if (node.type === 'carta') offerCards(run, rng);
  return true;
}

// Entra en una sala del piso: la de inicio o una unida a la actual por una puerta.
export function enterRoom(run, roomId) {
  const f = run.floor;
  if (run.state !== 'floor' || !f) return false;
  const room = f.rooms[roomId];
  if (!room || (roomId !== f.at && !f.rooms[f.at].links.includes(roomId))) return false;
  f.at = roomId;
  run.last = null;
  if (room.done) return true;
  const rng = mulberry32(run.seed + run.node.id * 31 + roomId * 7);
  if (room.type === 'pelea' || room.type === 'rescate') {
    const node = run.node, boss = room.final && node.type === 'jefe';
    const kinds = boss ? BOSS_ARENAS : node.layer === 0 && room.main ? ['claro', 'raices'] : Object.keys(ARENAS);
    const foes = room.final ? enemiesFor(node, run.island.biome) : enemiesFor({ type: 'combate', layer: node.layer + (room.main ? 0 : 1) }, run.island.biome, rng);
    run.encounter = { enemies: foes, enemyHpMul: enemyHpMul(node), seed: Math.floor(rng() * 1e9), arena: kinds[Math.floor(rng() * kinds.length)] };
    run.room = room;
    run.state = 'combat';
    return true;
  }
  room.done = true;
  if (room.type === 'botin') {
    const before = { ...run.loot };
    addLoot(run, rng, 3);
    if (rng() < 0.4) run.items.gota = (run.items.gota ?? 0) + 1;
    run.last = { type: 'botin', found: Object.fromEntries(Object.entries(run.loot).map(([r, n]) => [r, n - (before[r] ?? 0)]).filter(([, n]) => n)) };
  } else if (room.type === 'carta') {
    offerCards(run, rng);
  } else if (room.type === 'tienda') { // el mercader: cambia botín por objetos, una carta o curarse
    const res = BIOMES[run.island.biome].loot;
    room.offers = SHOP.map((o, k) => ({ ...o, cost: { [res[k % res.length]]: o.price } }));
    run.last = { type: 'tienda', room: room.id };
  } else if (room.type === 'maldito') { // altar maldito: un pacto opcional (carta rara a cambio de vida)
    run.last = { type: 'maldito', room: room.id };
  } else if (room.type === 'arma') { // pedestal con un arma: cambiarla es opcional
    room.weapon ??= rollWeapon(rng, [run.weapon?.type]);
    run.last = { type: 'arma', room: room.id };
  } else if (room.type === 'fuente') { // agua quieta: cura a todo el grupo una vez
    for (const p of run.party) p.hp = Math.min(p.maxHp, p.hp + Math.ceil(p.maxHp * 0.35));
    run.last = { type: 'fuente' };
  } else if (room.type === 'reliquia') { // una carta rara sin elegir: el premio escondido
    const pool = Object.keys(CARDS).filter((id) => !run.cards.includes(id) && CARDS[id].rarity === 'rara');
    const id = pool[Math.floor(rng() * pool.length)];
    if (id) { run.offer = [id]; run.state = 'card'; pickCard(run, id); }
    run.last = { type: 'reliquia', card: id ?? null };
  }
  return true;
}

const SHOP = [{ get: 'gota', price: 2 }, { get: 'hongo', price: 3 }, { get: 'cura', price: 2 }];
// Comprar en la tienda de la sala actual: paga con el botín de la expedición.
export function buy(run, k) {
  const room = run.floor?.rooms[run.floor.at], o = room?.offers?.[k];
  if (!o || o.sold || Object.entries(o.cost).some(([r, n]) => (run.loot[r] ?? 0) < n)) return false;
  for (const [r, n] of Object.entries(o.cost)) run.loot[r] -= n;
  if (o.get === 'cura') for (const p of run.party) p.hp = Math.min(p.maxHp, p.hp + Math.ceil(p.maxHp * 0.3));
  else run.items[o.get] = (run.items[o.get] ?? 0) + 1;
  o.sold = true;
  return true;
}

function offerCards(run, rng) {
  if (ROBES[run.robe ?? 'comun'].noCards) return;
  const pool = Object.keys(CARDS).filter((id) => !run.cards.includes(id));
  run.offer = Array.from({ length: Math.min(3, pool.length) }, () => pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  run.state = run.offer.length ? 'card' : run.state;
}

function addLoot(run, rng, n) {
  for (let k = 0; k < n; k++) {
    const r = pickFrom(rng, BIOMES[run.island.biome].loot);
    run.loot[r] = (run.loot[r] ?? 0) + 1;
  }
}

export function pickCard(run, cardId) {
  if (run.state !== 'card' || !run.offer.includes(cardId)) return false;
  run.cards.push(cardId);
  const m = CARDS[cardId].mods;
  if (m.gota) run.items.gota += m.gota;
  if (m.hpMul) for (const p of run.party) { const extra = Math.round(p.maxHp * (m.hpMul - 1)); p.maxHp += extra; p.hp += extra; }
  run.offer = null;
  run.state = run.floor ? 'floor' : 'map';
  return true;
}

// Partida de combate para este nodo: los caídos vuelven a la sala con 1 de vida.
export function combatSetup(run) {
  return {
    party: run.party.map((p) => ({ ...p, hp: Math.max(1, p.hp) })), enemies: run.encounter.enemies,
    enemyHpMul: run.encounter.enemyHpMul * (1 + HEAT.hp * (run.heat ?? 0)), heatDmg: 1 + HEAT.dmg * (run.heat ?? 0), items: run.items, mods: runMods(run), seed: run.encounter.seed, arena: run.encounter.arena,
  };
}

export function finishCombat(run, combat) {
  for (const a of combat.actors.filter((x) => x.side === 'ally')) {
    const p = run.party.find((x) => x.id === a.ref);
    p.hp = a.hp;
  }
  run.items = { ...combat.items };
  if (combat.result === 'lose') { run.state = 'lost'; run.cause = run.encounter?.enemies ?? null; return; }
  const heal = runMods(run).winHeal ?? 0;
  for (const p of run.party) p.hp = Math.min(p.maxHp, Math.max(1, p.hp) + Math.ceil(p.maxHp * heal));
  const final = !run.room || run.room.final, rescue = run.room?.type === 'rescate';
  if (run.room) run.room.done = true;
  if (rescue) run.rescued = (run.rescued ?? 0) + 1; // el isópodo cautivo se une al volver (si no se pierde)
  addLoot(run, mulberry32(run.encounter.seed), final && run.node.type !== 'combate' ? 4 : 1);
  if (final && run.node.type === 'elite') run.loot.ambar = (run.loot.ambar ?? 0) + 1;
  run.encounter = null; run.room = null;
  if (!final) { run.state = 'floor'; if (rescue) run.last = { type: 'rescate' }; return; }
  run.floor = null;
  run.state = run.node.type === 'jefe' ? 'won' : 'map';
}

export function retreat(run) {
  if (run.state === 'map' || run.state === 'floor') run.state = 'retreat';
}

// Aplica el resultado al terrario y devuelve el resumen para la pantalla final.
export function settleRun(home, run, rng) {
  const lost = run.state === 'lost';
  const loot = Object.fromEntries(Object.entries(run.loot).map(([r, n]) => [r, lost ? Math.floor(n / 2) : n]));
  for (const [r, n] of Object.entries(loot)) addRes(home, r, n);
  const rescued = lost ? 0 : run.rescued;
  for (let k = 0; k < rescued; k++) recruit(home, rng);
  home.fear = Math.min(0.4, home.fear + (lost ? 0.3 : run.state === 'won' ? 0 : 0.1));
  return { outcome: run.state, loot, rescued, depth: run.depth ?? 0, cause: run.cause ?? null, lostLoot: lost ? Object.fromEntries(Object.entries(run.loot).map(([r, n]) => [r, n - loot[r]]).filter(([, n]) => n)) : null, heat: run.heat ?? 0 };
}
