import test from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../src/core/rng.js';
import { newGame, visit } from '../src/game/game.js';
import { build, tickHome, collect, expand, calm, beds, climate, humidity, upgradeLayer, homeEffects } from '../src/game/home.js';
import { blocked } from '../src/game/grid.js';
import { newGather, tickGather, gatherLoot } from '../src/game/gather.js';
import { genDungeon, nextNodes, LAYERS } from '../src/game/dungeon.js';
import { newRun, enterNode, combatSetup, finishCombat, pickCard, settleRun } from '../src/game/run.js';
import { createCombat, step } from '../src/game/combat.js';
import { autopilot } from '../src/game/autopilot.js';
import { save, load, serialize, deserialize } from '../src/game/save.js';
import { selfcheck } from '../tools/combat-selfcheck.mjs';

const memory = () => { const m = {}; return { getItem: (k) => m[k] ?? null, setItem: (k, v) => { m[k] = v; } }; };

test('el terrario arranca con colonia, piezas y zona abierta', () => {
  const g = newGame(42);
  assert.equal(g.home.isopods.length, 4);
  assert.ok(Object.keys(g.home.grid.pieces).length >= 2);
  assert.equal(g.home.grid.open.reduce((s, v) => s + v, 0), 64);
});

test('construir cobra y ampliar abre celdas', () => {
  const { home } = newGame(1);
  const before = home.resources.musgo;
  assert.ok(build(home, 'charca', 4, 9));
  assert.equal(home.resources.musgo, before - 3);
  assert.equal(build(home, 'charca', 0, 0), null, 'zona cerrada');
  home.resources.ambar = 5; home.resources.musgo = 9;
  assert.ok(expand(home));
  assert.equal(home.grid.open.reduce((s, v) => s + v, 0), 100);
});

test('las piezas producen y se recogen; la colonia come y nunca atraviesa piezas', () => {
  const { home } = newGame(7);
  const id = build(home, 'charca', 8, 9);
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
  const n = ga.nodes[0];
  for (let k = 0; k < 600 && !n.taken; k++) {
    const d = Math.hypot(n.x - ga.player.x, n.y - ga.player.y) || 1;
    tickGather(ga, 1 / 60, { x: (n.x - ga.player.x) / d, y: (n.y - ga.player.y) / d });
  }
  assert.ok(n.taken || ga.nodes.some((x) => x.taken), 'llegó a algún recurso');
  assert.ok(Object.values(gatherLoot(ga)).reduce((s, v) => s + v, 0) >= 1);
  for (let k = 0; k < 60 * 41; k++) tickGather(ga, 1 / 60);
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
  assert.ok(build(home, 'charca', 4, 9));
  assert.equal(climate(home), 'ideal');
  assert.ok(homeEffects(home).prodMul > dry.prodMul && homeEffects(home).hungerMul < dry.hungerMul);
  home.resources = { musgo: 20, hojarasca: 20, esporas: 20, cal: 20, ambar: 20 };
  build(home, 'charca', 6, 9); home.weather = 'lluvia';
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
