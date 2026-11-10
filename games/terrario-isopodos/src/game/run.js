// Expedición a un nido: un isópodo principal + dos de apoyo recorren el mapa interior. La vida se
// arrastra entre salas; el botín y los rescatados vuelven al terrario al terminar (si se pierde,
// solo la mitad del botín y ningún rescatado).
import { ARENAS, BOSS_ARENAS } from '../data/arenas.js';
import { CLASSES } from '../data/isopods.js';
import { CARDS } from '../data/cards.js';
import { BIOMES } from '../data/world.js';
import { genDungeon, nextNodes, enemiesFor, enemyHpMul } from './dungeon.js';
import { partyBonus, recruit, isoStats } from './home.js';
import { mulberry32, pickFrom } from '../core/rng.js';
import { genFloor } from './floor.js';
import { speciesOf } from '../data/species.js';

export function newRun(home, island, partyIds) {
  const rng = mulberry32(island.seed + 7);
  const party = partyIds.map((id) => {
    const iso = home.isopods.find((x) => x.id === id);
    const st = isoStats(iso), maxHp = Math.round(CLASSES[iso.cls].hp * speciesOf(iso.shell).hp * partyBonus(home, iso).hpMul * st.hpMul);
    return { id, name: iso.name, cls: iso.cls, shell: iso.shell, hp: maxHp, maxHp, damageAdd: st.damageAdd, speedMul: st.speedMul, abilities: st.abilities };
  });
  return {
    island, dungeon: genDungeon(island.seed), party, items: { gota: 2, hongo: 1 }, cards: [],
    loot: {}, rescued: 0, state: 'map', offer: null, node: null, seed: Math.floor(rng() * 1e9),
    atbMul: partyBonus(home, home.isopods.find((x) => x.id === partyIds[0])).atbMul,
  };
}

export function runMods(run) {
  const mods = { atbMul: run.atbMul };
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
  if (room.type === 'pelea') {
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
  } else if (room.type === 'reliquia') { // una carta rara sin elegir: el premio escondido
    const pool = Object.keys(CARDS).filter((id) => !run.cards.includes(id) && CARDS[id].rarity === 'rara');
    const id = pool[Math.floor(rng() * pool.length)];
    if (id) { run.offer = [id]; run.state = 'card'; pickCard(run, id); }
    run.last = { type: 'reliquia', card: id ?? null };
  }
  return true;
}

function offerCards(run, rng) {
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
    enemyHpMul: run.encounter.enemyHpMul, items: run.items, mods: runMods(run), seed: run.encounter.seed, arena: run.encounter.arena,
  };
}

export function finishCombat(run, combat) {
  for (const a of combat.actors.filter((x) => x.side === 'ally')) {
    const p = run.party.find((x) => x.id === a.ref);
    p.hp = a.hp;
  }
  run.items = { ...combat.items };
  if (combat.result === 'lose') { run.state = 'lost'; return; }
  const heal = runMods(run).winHeal ?? 0;
  for (const p of run.party) p.hp = Math.min(p.maxHp, Math.max(1, p.hp) + Math.ceil(p.maxHp * heal));
  const final = !run.room || run.room.final;
  if (run.room) run.room.done = true;
  addLoot(run, mulberry32(run.encounter.seed), final && run.node.type !== 'combate' ? 4 : 1);
  if (final && run.node.type === 'elite') run.loot.ambar = (run.loot.ambar ?? 0) + 1;
  run.encounter = null; run.room = null;
  if (!final) { run.state = 'floor'; return; }
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
  for (const [r, n] of Object.entries(loot)) home.resources[r] = (home.resources[r] ?? 0) + n;
  const rescued = lost ? 0 : run.rescued;
  for (let k = 0; k < rescued; k++) recruit(home, rng);
  home.fear = Math.min(0.4, home.fear + (lost ? 0.3 : run.state === 'won' ? 0 : 0.1));
  return { outcome: run.state, loot, rescued };
}
