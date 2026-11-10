import test from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/core/rng.js';
import { newGame, visit, tickClock, dayPhase, sleep } from '../src/game/game.js';
import { genFloor, doors } from '../src/game/floor.js';
import { build, tickHome, collect, expand, calm, beds, climate, humidity, upgradeLayer, homeEffects } from '../src/game/home.js';
import { blocked } from '../src/game/grid.js';
import { newGather, tickGather, gatherLoot } from '../src/game/gather.js';
import { genDungeon, nextNodes, LAYERS } from '../src/game/dungeon.js';
import { newRun, enterNode, enterRoom, combatSetup, finishCombat, pickCard, settleRun } from '../src/game/run.js';
import { createCombat, step } from '../src/game/combat.js';
import { autopilot } from '../src/game/autopilot.js';
import { save, load, serialize, deserialize } from '../src/game/save.js';
import { selfcheck } from '../tools/combat-selfcheck.mjs';

const memory = () => { const m = {}; return { getItem: (k) => m[k] ?? null, setItem: (k, v) => { m[k] = v; } }; };

test('el terrario arranca con colonia, piezas y zona abierta', () => {
  const g = newGame(42);
  assert.equal(g.home.isopods.length, 4);
  assert.ok(Object.keys(g.home.grid.pieces).length >= 2);
  assert.equal(g.home.grid.open.reduce((s, v) => s + v, 0), 100, 'empieza en 10 × 10');
});

test('construir cobra y ampliar abre celdas', () => {
  const { home } = newGame(1);
  const before = home.resources.musgo;
  assert.ok(build(home, 'charca', 7, 12));
  assert.equal(home.resources.musgo, before - 3);
  assert.equal(build(home, 'charca', 0, 0), null, 'zona cerrada');
  home.resources.ambar = 5; home.resources.musgo = 9; home.resources.cal = 9;
  assert.ok(expand(home));
  assert.equal(home.grid.open.reduce((s, v) => s + v, 0), 144);
});

test('las piezas producen y se recogen; la colonia come y nunca atraviesa piezas', () => {
  const { home } = newGame(7);
  const id = build(home, 'charca', 11, 12);
  const rng = mulberry32(3);
  for (let k = 0; k < 60 * 300; k++) {
    tickHome(home, 1 / 60, rng);
    for (const iso of home.isopods) assert.ok(!blocked(home.grid, Math.floor(iso.x), Math.floor(iso.y)), `isópodo en celda bloqueada ${iso.x},${iso.y}`);
  }
  assert.ok(home.stock[id].ready > 0);
  const musgo = home.resources.musgo;
  assert.ok(collect(home, id) > 0);
  assert.ok(home.resources.musgo > musgo);
  assert.ok(home.isopods.every((i) => i.hunger > 0.3), 'comieron');
  assert.ok(calm(home) > 0 && beds(home) >= 7);
});

test('recolección: recoger suma recursos con el bonus del clima', () => {
  const g = newGame(5);
  const isl = g.islands.find((i) => i.kind === 'recoleccion');
  const ga = newGather(isl);
  const n = [...ga.nodes].sort((a, b) => a.h - b.h)[0];
  for (let k = 0; k < 1200 && !n.taken; k++) { // directo hacia él, saltando cada medio segundo
    const d = Math.hypot(n.x - ga.player.x, n.y - ga.player.y) || 1;
    tickGather(ga, 1 / 60, { x: (n.x - ga.player.x) / d, y: (n.y - ga.player.y) / d }, k % 30 === 0);
  }
  assert.ok(n.taken || ga.nodes.some((x) => x.taken), 'llegó a algún recurso');
  assert.ok(Object.values(gatherLoot(ga)).reduce((s, v) => s + v, 0) >= 1);
  for (let k = 0; k < 60 * 50; k++) tickGather(ga, 1 / 60);
  assert.ok(ga.done);
});

test('mapa interior: capas conectadas, sin cruces, jefe al final', () => {
  for (let s = 0; s < 50; s++) {
    const d = genDungeon(s);
    assert.equal(d.nodes.filter((n) => n.layer === LAYERS - 1)[0].type, 'jefe');
    for (const n of d.nodes) if (n.layer < LAYERS - 1) assert.ok(d.edges.some((e) => e[0] === n.id), 'todo nodo tiene salida');
    for (const n of d.nodes) if (n.layer > 0) assert.ok(d.edges.some((e) => e[1] === n.id), 'todo nodo tiene entrada');
    for (const a of d.edges) for (const b of d.edges) {
      const [a0, a1, b0, b1] = [a[0], a[1], b[0], b[1]].map((i) => d.nodes[i]);
      if (a0.layer === b0.layer && a0 !== b0 && a1 !== b1) assert.ok((a0.x - b0.x) * (a1.x - b1.x) > 0, `cruce en semilla ${s}`);
    }
  }
});

test('expedición completa con el piloto: se gana o se pierde y el botín vuelve', () => {
  const g = newGame(11);
  const nest = g.islands.find((i) => i.kind === 'nido');
  const run = newRun(g.home, nest, g.home.isopods.slice(0, 3).map((i) => i.id));
  const rng = mulberry32(9);
  while (run.state !== 'won' && run.state !== 'lost') {
    if (run.state === 'card') { pickCard(run, run.offer[0]); continue; }
    if (run.state === 'combat') {
      const c = createCombat(combatSetup(run));
      while (!c.result) step(c, 1 / 60, autopilot(c, 0.9));
      finishCombat(run, c);
      continue;
    }
    if (run.state === 'floor') { // primero las laterales sin hacer, después adelante por el camino
      const ds = doors(run.floor), cur = run.floor.rooms[run.floor.at];
      const next = ds.find((r) => !r.done && !r.main) ?? ds.find((r) => !r.done) ?? ds.find((r) => r.main && r.x > cur.x) ?? ds.find((r) => r.main) ?? ds[0];
      assert.ok(enterRoom(run, next.id), 'hay puerta hacia delante');
      continue;
    }
    assert.ok(enterNode(run, nextNodes(run.dungeon)[0].id));
  }
  const res = Object.values(g.home.resources).reduce((s, v) => s + v, 0);
  const out = settleRun(g.home, run, rng);
  assert.ok(['won', 'lost'].includes(out.outcome));
  assert.ok(Object.values(g.home.resources).reduce((s, v) => s + v, 0) >= res);
  visit(g, nest.id);
});

test('guardado: ida y vuelta, y uno corrupto no pisa ni carga', () => {
  const g = newGame(3);
  const store = memory();
  assert.ok(save(g, store));
  const back = load(store);
  assert.equal(serialize(back), serialize(g));
  store.setItem('terrario.next.save.v1', '{"v":1,"home":{}}');
  assert.equal(load(store), null);
  assert.equal(deserialize('no json'), null);
});

test('combate: cada aberración es vencible y no es un paseo', () => {
  for (const r of selfcheck(20)) assert.ok(r.ok, `${r.id}: ${JSON.stringify(r)}`);
});

test('composición: la humedad sale de lo que hay dentro y cambia el clima y sus efectos', () => {
  const { home } = newGame(21);
  home.weather = 'claro';
  assert.equal(climate(home), 'seco', 'sin agua el terrario arranca seco');
  const dry = homeEffects(home);
  assert.ok(build(home, 'charca', 7, 12));
  assert.equal(climate(home), 'ideal');
  assert.ok(homeEffects(home).prodMul > dry.prodMul && homeEffects(home).hungerMul < dry.hungerMul);
  home.resources = { musgo: 20, hojarasca: 20, esporas: 20, cal: 20, ambar: 20 };
  build(home, 'charca', 9, 12); home.weather = 'lluvia';
  assert.equal(climate(home), 'moho', 'demasiada agua sin carbón');
  const calmMoho = calm(home);
  assert.ok(upgradeLayer(home, 'carbon') && upgradeLayer(home, 'carbon'));
  assert.equal(climate(home), 'humedo', 'el carbón contiene el moho');
  assert.ok(calm(home) > calmMoho);
  assert.ok(humidity(home) <= 1);
});

test('trampas: quedarse quieto, machacar, rodar sin parar o huir no ganan', async () => {
  const { exploits } = await import('../tools/exploits-selfcheck.mjs');
  for (const r of exploits(6)) assert.ok(r.ok, `${r.name} vs ${r.foe}: ${r.rate}`);
});

test('día y noche: el reloj avanza, de noche se produce menos, dormir lleva al amanecer de otro día', () => {
  const g = newGame(5);
  assert.equal(dayPhase(g), 'dia');
  tickClock(g, 0.7 * 300);
  assert.equal(dayPhase(g), 'noche');
  const islands = g.islands;
  sleep(g);
  assert.equal(g.day, 2);
  assert.equal(dayPhase(g), 'amanecer');
  assert.notDeepEqual(g.islands, islands);
  const nest = g.islands.find((i) => i.kind === 'nido');
  const before = g.clock;
  visit(g, nest.id);
  assert.ok(g.clock > before, 'un viaje gasta tiempo');
});

test('arenas: cada tipo deja libres las salidas, las raíces cortan el paso y las charcas queman a todos', async () => {
  const { layoutArena } = await import('../src/game/arena.js');
  const { ARENAS } = await import('../src/data/arenas.js');
  const { createCombat, step } = await import('../src/game/combat.js');
  for (const kind of Object.keys(ARENAS)) for (let seed = 1; seed < 30; seed++) {
    const a = layoutArena(kind, seed);
    assert.equal(a.pillars.length, ARENAS[kind].pillars, `${kind} con todas sus raíces`);
    for (const o of [...a.pillars, ...a.pools]) assert.ok(Math.hypot(o.x, o.y - 4) > o.r + 0.5, `${kind}: el equipo empieza libre`);
  }
  const party = [{ id: 1, cls: 'rodador', name: 'a', hp: 70, maxHp: 70 }];
  const c = createCombat({ party, enemies: ['larva'], seed: 3, arena: 'charcas' });
  const pool = c.arena.pools[0], foe = c.actors.find((x) => x.side === 'enemy');
  Object.assign(foe, { x: pool.x, y: pool.y, state: 'stagger' });
  const hp = foe.hp;
  for (let k = 0; k < 40; k++) { foe.x = pool.x; foe.y = pool.y; step(c, 1 / 60); }
  assert.ok(foe.hp < hp, 'la charca daña a la aberración');
  const r = createCombat({ party, enemies: ['larva'], seed: 3, arena: 'raices' }), p = r.arena.pillars[0], me = r.actors[0];
  Object.assign(me, { x: p.x, y: p.y + 0.01 });
  step(r, 1 / 60);
  assert.ok(Math.hypot(me.x - p.x, me.y - p.y) >= p.r + me.r - 1e-6, 'la raíz empuja fuera');
});

test('pisos: camino principal hasta la sala final, laterales colgadas y todo alcanzable', () => {
  for (let seed = 1; seed < 60; seed++) for (const type of ['combate', 'elite', 'jefe']) {
    const f = genFloor(type, seed), finals = f.rooms.filter((r) => r.final);
    assert.equal(finals.length, 1);
    assert.ok(f.rooms.some((r) => !r.main), `semilla ${seed}: al menos una lateral`) ;
    const seen = new Set([0]), todo = [0];
    while (todo.length) for (const id of f.rooms[todo.pop()].links) if (!seen.has(id)) { seen.add(id); todo.push(id); }
    assert.equal(seen.size, f.rooms.length, 'todo el piso conectado');
  }
});

test('mejorar piezas y agrandar partidas viejas', async () => {
  const { upgradePiece, fitGrid, lvl } = await import('../src/game/home.js');
  const { createGrid, openRect, place } = await import('../src/game/grid.js');
  const { home } = newGame(4);
  const id = Object.values(home.grid.pieces).find((p) => p.type === 'refugio').id;
  Object.assign(home.resources, { hojarasca: 20, musgo: 20, ambar: 5 });
  const b = beds(home);
  assert.ok(upgradePiece(home, id));
  assert.equal(lvl(home.grid.pieces[id]), 2);
  assert.ok(beds(home) > b, 'el refugio mejorado da más camas');
  const old = createGrid(14, 14); openRect(old, 3, 3, 8, 8); place(old, 'charca', 4, 4);
  const h2 = { ...home, grid: old, stock: {}, isopods: [] };
  fitGrid(h2);
  assert.equal(h2.grid.w, 20);
  assert.equal(Object.values(h2.grid.pieces)[0].x, 7, 'la pieza vieja queda centrada en la rejilla nueva');
});

test('recolección con relieve: cada forma deja recursos alcanzables, el salto sube un escalón y caer devuelve', async () => {
  const { GATHER_SHAPES } = await import('../src/data/world.js');
  const seen = new Set();
  for (let seed = 1; seed < 40; seed++) {
    const ga = newGather({ seed, biome: 'hojarasca', weather: 'claro', kind: 'recoleccion' });
    seen.add(ga.shape);
    assert.ok(ga.nodes.length >= 6, `${ga.shape} ${seed}: recursos suficientes (${ga.nodes.length})`);
    assert.ok(new Set(ga.levels.filter((h) => h !== null)).size >= 2 || ga.shape === 'islotes', `${ga.shape}: tiene relieve`);
  }
  assert.equal(seen.size, Object.keys(GATHER_SHAPES).length, 'salen todas las formas');
  const ga = newGather({ seed: 3, biome: 'hojarasca', weather: 'claro', kind: 'recoleccion' });
  ga.player.x = -5; ga.player.y = -5; ga.player.air = true; ga.player.z = -1;
  const t0 = ga.time;
  for (let k = 0; k < 60; k++) tickGather(ga, 1 / 60);
  assert.ok(ga.falls >= 1 && ga.time < t0 - 2, 'caer cuesta tiempo');
  assert.ok(ga.player.x > 0, 'y devuelve a tierra');
});
