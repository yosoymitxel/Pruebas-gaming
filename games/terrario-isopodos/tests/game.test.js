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
  assert.ok(build(home, 'charca', 7, 5));
  assert.equal(home.resources.musgo, before - 3);
  assert.equal(build(home, 'charca', 0, 0), null, 'zona cerrada');
  home.resources.ambar = 5; home.resources.musgo = 9; home.resources.cal = 9;
  assert.ok(expand(home));
  assert.equal(home.grid.open.reduce((s, v) => s + v, 0), 144);
});

test('las piezas producen y se recogen; la colonia come y nunca atraviesa piezas', () => {
  const { home } = newGame(7);
  const id = build(home, 'charca', 11, 5);
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

test('expedición completa con el piloto: se gana o se pierde y el botín vuelve', async () => {
  const R0 = await import('../src/game/run.js');
  const g = newGame(11);
  const nest = g.islands.find((i) => i.kind === 'nido');
  const run = newRun(g.home, nest, g.home.isopods.slice(0, 3).map((i) => i.id));
  const rng = mulberry32(9);
  while (run.state !== 'won' && run.state !== 'lost') {
    if (run.state === 'weapon') { R0.pickWeapon(run, 0); continue; }
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

test('composición: la humedad se mueve despacio hacia lo que hay dentro; la tapa la saca; el moho brota y los colémbolos lo limpian', async () => {
  const { humidityTarget, setLid, gradient, storePiece } = await import('../src/game/home.js');
  const { home } = newGame(21);
  for (const p of Object.values(home.grid.pieces)) if (p.type === 'charca') storePiece(home, p.id); // se arranca sin agua
  home.weather = 'claro'; home.moist = humidityTarget(home);
  assert.equal(climate(home), 'seco', 'sin agua el terrario arranca seco');
  const dry = homeEffects(home);
  assert.ok(build(home, 'charca', 7, 5));
  assert.ok(humidityTarget(home) > humidity(home), 'el agua sube el objetivo, no la humedad de golpe');
  const rng = mulberry32(3);
  for (let k = 0; k < 60 * 120; k++) tickHome(home, 1 / 60, rng);
  assert.equal(climate(home), 'ideal');
  assert.ok(homeEffects(home).prodMul > dry.prodMul);
  assert.ok(gradient(home).ok, 'la charca moja su lado: hay rincón húmedo y rincón seco');
  home.resources = { musgo: 20, hojarasca: 20, esporas: 20, cal: 20, ambar: 20 };
  build(home, 'charca', 9, 5); home.weather = 'lluvia'; setLid(home, 0);
  for (let k = 0; k < 60 * 400; k++) tickHome(home, 1 / 60, rng);
  assert.ok(home.mold.length >= 3 && climate(home) === 'moho', 'cerrado y empapado brota moho');
  const calmMoho = calm(home);
  setLid(home, 2);
  const t0 = humidityTarget(home);
  assert.ok(t0 < humidityTarget({ ...home, lid: 0 }), 'abrir la tapa baja la humedad objetivo');
  assert.ok(build(home, 'colembolos', 7, 7) || build(home, 'colembolos', 12, 7));
  for (let k = 0; k < 60 * 400; k++) tickHome(home, 1 / 60, rng);
  assert.ok(home.mold.length < 3 && calm(home) > calmMoho, 'ventilado y con colémbolos el moho se va');
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
  void 0;
  const seen = new Set();
  for (let seed = 1; seed < 40; seed++) {
    const ga = newGather({ seed, biome: 'hojarasca', weather: 'claro', kind: 'recoleccion' });
    seen.add(ga.shape);
    assert.ok(ga.nodes.length >= 6, `${ga.shape} ${seed}: recursos suficientes (${ga.nodes.length})`);
    assert.ok(new Set(ga.levels.filter((h) => h !== null)).size >= 2 || ga.shape === 'islotes', `${ga.shape}: tiene relieve`);
  }
  assert.deepEqual([...seen], ['sendero'], 'la recolección es siempre un sendero hacia delante');
  const ga = newGather({ seed: 3, biome: 'hojarasca', weather: 'claro', kind: 'recoleccion' });
  ga.player.x = -5; ga.player.y = -5; ga.player.air = true; ga.player.z = -1;
  const t0 = ga.time;
  for (let k = 0; k < 60; k++) tickGather(ga, 1 / 60);
  assert.ok(ga.falls >= 1 && ga.time < t0 - 2, 'caer cuesta tiempo');
  assert.ok(ga.player.x > 0, 'y devuelve a tierra');
});

test('cuidados del terrario: rociar sube la humedad poco a poco y se seca; no caen hojas al azar; las mudas se comen solas', async () => {
  const { mist, humidity: hum, humidityTarget } = await import('../src/game/home.js');
  const { home } = newGame(8);
  home.moist = humidityTarget(home);
  const h0 = hum(home);
  assert.ok(mist(home));
  assert.ok(humidityTarget(home) > h0, 'rociar sube la humedad objetivo');
  assert.ok(!mist(home), 'con espera entre rociadas');
  const rng = mulberry32(2);
  for (let k = 0; k < 60 * 20; k++) tickHome(home, 1 / 60, rng);
  assert.ok(hum(home) > h0, 'el sustrato se moja');
  for (let k = 0; k < 60 * 300; k++) tickHome(home, 1 / 60, rng);
  assert.ok(Math.abs(hum(home) - h0) < 0.02, 'el rocío se seca');
  assert.equal(home.leaves.length, 0, 'sin hojas al azar');
  home.molts = [{ id: 'm', x: 2, y: 2 }]; const cal = home.resources.cal;
  for (let k = 0; k < 60 * 35; k++) tickHome(home, 1 / 60, rng);
  assert.ok(!home.molts.some((m) => m.id === 'm')); assert.ok(home.resources.cal >= cal, 'la muda se la comen');
});

test('culto (Cult of the Lamb): mimo diario, nivel de lealtad, reunión, peticiones y dormir de noche', async () => {
  const H = await import('../src/game/home.js');
  const { DAY_PHASES } = await import('../src/data/world.js');
  const { home } = newGame(31), rng = mulberry32(4), iso = home.isopods[0];
  assert.ok(H.bless(home, iso, 1) && !H.bless(home, iso, 1), 'un mimo por día');
  assert.ok(home.faith > 0 && iso.loyal === 25);
  const amber = home.resources.ambar;
  H.gainLoyalty(home, iso, 80);
  assert.equal(iso.lv, 1); assert.equal(home.resources.ambar, amber + 1, 'subir de nivel da ámbar');
  assert.ok(!H.sermon(home, 1), 'sin altar no hay templo');
  Object.assign(home.resources, { musgo: 20, ambar: 9, hojarasca: 20 });
  let spotOk = false;
  for (let y = 0; y < home.grid.h && !spotOk; y++) for (let x = 0; x < home.grid.w && !spotOk; x++) spotOk = H.build(home, 'altar', x, y) != null;
  assert.ok(spotOk && H.temple(home), 'altar = templo');
  assert.ok(H.sermon(home, 1) && !H.sermon(home, 1), 'una reunión por día');
  const before = home.isopods.map((i) => i.loyal ?? 0);
  for (let k = 0; k < 60 * 9; k++) H.tickHome(home, 1 / 60, rng, DAY_PHASES.dia);
  assert.ok(!home.sermon && home.isopods.every((i, k) => (i.loyal ?? 0) > before[k] || i.lv), 'la reunión da lealtad');
  home.isopods.forEach((i) => { i.hunger = 1; i.wish = null; });
  home.isopods.forEach((i) => { i.hunger = 0.2; });
  assert.ok(H.ritual(home, 'festin', 1) && !H.ritual(home, 'festin', 2), 'festín: uno cada dos días');
  for (let k = 0; k < 60 * 9; k++) H.tickHome(home, 1 / 60, rng, DAY_PHASES.dia);
  assert.ok(!home.sermon && home.isopods.every((i) => i.hunger > 0.9), 'el festín llena a todos');
  assert.ok(H.ritual(home, 'festin', 3), 'vuelve a estar listo');
  for (let k = 0; k < 60 * 9; k++) H.tickHome(home, 1 / 60, rng, DAY_PHASES.dia);
  home.isopods.forEach((i) => { i.hunger = 1; i.wish = null; });
  for (let k = 0; k < 60 * 20; k++) H.tickHome(home, 1 / 60, rng, DAY_PHASES.noche);
  assert.ok(home.isopods.filter((i) => !(i.baby > 0)).every((i) => i.rest > 0 || i.order === 'dormir'), 'de noche se van a dormir solos');
  for (let k = 0; k < 60; k++) H.tickHome(home, 1 / 60, rng, DAY_PHASES.dia);
  assert.ok(home.isopods.every((i) => !i.nightSleep), 'al amanecer despiertan');
  home.wishT = 1e9; H.tickHome(home, 1 / 60, rng, DAY_PHASES.dia);
  const wisher = home.isopods.find((i) => i.wish);
  assert.ok(wisher, 'cada tanto alguien pide algo');
  const f = home.faith; wisher.wish.t = 0.001;
  H.tickHome(home, 1 / 60, rng, DAY_PHASES.dia);
  assert.ok(home.faith < f, 'olvidar una petición baja la fe');
});

test('construir y trabajar (CotL): la obra la levantan los isópodos y no funciona hasta acabar; trabajar acelera la producción; salas de rescate, tienda y fuente', async () => {
  const H = await import('../src/game/home.js');
  const R = await import('../src/game/run.js');
  const { DAY_PHASES } = await import('../src/data/world.js');
  const { home } = newGame(41), rng = mulberry32(6);
  home.resources = { musgo: 20, hojarasca: 20, esporas: 20, cal: 20, ambar: 20 };
  home.isopods.forEach((i) => { i.hunger = 1; });
  const b0 = H.beds(home);
  assert.ok(H.build(home, 'corcho', 7, 5, 0, true));
  const p = Object.values(home.grid.pieces).find((q) => q.type === 'corcho');
  assert.ok(p.site && H.beds(home) === b0, 'en obra no da camas');
  let t = 0; while (p.site && t < 120) { H.tickHome(home, 1 / 30, rng, DAY_PHASES.dia); t += 1 / 30; }
  assert.ok(!p.site && H.beds(home) > b0, 'terminada da camas');
  assert.ok(t < 12 / 0.35, 'con ayudantes se termina antes que sola');
  // trabajar
  const a = H.build(home, 'sepia', 13, 6); const sep = Object.values(home.grid.pieces).find((q) => q.type === 'sepia');
  const iso = home.isopods[0]; iso.x = sep.x + 0.5; iso.y = sep.y + 1.4;
  assert.ok(H.orderIso(home, iso, 'trabajar') && iso.job === sep.id);
  assert.equal(H.workers(home, sep), 1);
  // mazmorra
  const run = { floor: { at: 0, rooms: [{ id: 0, type: 'tienda', links: [], offers: [{ get: 'gota', cost: { musgo: 2 } }] }] }, loot: { musgo: 3 }, items: { gota: 0 }, party: [{ hp: 5, maxHp: 10 }] };
  assert.ok(R.buy(run, 0) && run.items.gota === 1 && run.loot.musgo === 1 && !R.buy(run, 0), 'la tienda cobra en botín y vende una vez');
});

test('golpe fuerte: mantener y soltar pega en círculo a todos los cercanos, aturde más y tiene espera', async () => {
  const C = await import('../src/game/combat.js');
  const c = C.createCombat({ party: [{ id: 1, cls: 'rodador', name: 'a', hp: 60, maxHp: 60 }], enemies: ['larva', 'larva'], seed: 3 });
  const me = C.mainActor(c), [e1, e2] = C.enemies(c);
  Object.assign(e1, { x: me.x + 1.2, y: me.y }); Object.assign(e2, { x: me.x - 1.2, y: me.y });
  const h1 = e1.hp, h2 = e2.hp;
  C.step(c, 1 / 60, { heavy: true });
  for (let k = 0; k < 30; k++) C.step(c, 1 / 60, {});
  assert.ok(e1.hp < h1 && e2.hp < h2, 'pega a los dos lados');
  assert.ok(c.events.some((e) => e.type === 'heavy'));
  const n = c.events.filter((e) => e.type === 'heavyStart').length;
  C.step(c, 1 / 60, { heavy: true });
  assert.equal(c.events.filter((e) => e.type === 'heavyStart').length, n, 'con espera entre golpes fuertes');
});

test('roguelite: la misma isla da los mismos pisos aunque se juegue distinto; la plaga endurece; caer resume capa y causa', async () => {
  const R = await import('../src/game/run.js');
  const { nextNodes } = await import('../src/game/dungeon.js');
  const g = newGame(9), isl = g.islands.find((i) => i.kind === 'nido'), ids = g.home.isopods.slice(0, 3).map((i) => i.id);
  const hash = (heat, firstPick) => {
    const run = R.newRun(g.home, isl, ids, heat); R.pickWeapon(run, firstPick % 2); const opts = nextNodes(run.dungeon);
    R.enterNode(run, opts[firstPick % opts.length].id);
    return JSON.stringify({ map: run.dungeon.nodes.map((n) => [n.type, n.layer]), floor: run.floor?.rooms.map((r) => [r.type, r.x, r.y]) ?? null, foes: run.encounter?.enemies });
  };
  assert.equal(hash(0, 0), hash(0, 0), 'misma semilla, mismo piso');
  const a = R.newRun(g.home, isl, ids, 0), b = R.newRun(g.home, isl, ids, 3); R.pickWeapon(a, 0); R.pickWeapon(b, 0);
  assert.equal(JSON.stringify(a.dungeon), JSON.stringify(b.dungeon), 'la plaga no cambia el mapa');
  R.enterNode(a, nextNodes(a.dungeon)[0].id); R.enterNode(b, nextNodes(b.dungeon)[0].id);
  assert.ok(R.combatSetup(b).enemyHpMul > R.combatSetup(a).enemyHpMul && R.combatSetup(b).heatDmg > 1, 'con plaga las aberraciones aguantan y pegan más');
  a.state = 'lost'; a.cause = ['larva']; a.loot = { musgo: 4 };
  const out = R.settleRun(g.home, a, mulberry32(1));
  assert.ok(out.depth >= 1 && out.cause[0] === 'larva' && out.lostLoot.musgo === 2, 'el resumen dice hasta dónde, quién y qué se perdió');
});

test('rasgos (CotL): nacen con 1–2 sin opuestos y cambian lealtad, hambre y trabajo', async () => {
  const T = await import('../src/data/traits.js');
  const H = await import('../src/game/home.js');
  const rng = mulberry32(5);
  for (let k = 0; k < 200; k++) { const tr = T.rollTraits(rng); assert.ok(tr.length >= 1 && tr.length <= 2 && !(tr.includes('trabajador') && tr.includes('perezoso'))); }
  const { home } = newGame(3), a = home.isopods[0], b = home.isopods[1];
  a.traits = ['credulo']; b.traits = ['cinico']; a.loyal = b.loyal = 0;
  H.gainLoyalty(home, a, 20); H.gainLoyalty(home, b, 20);
  assert.ok(a.loyal > 20 && b.loyal < 20, 'crédulo gana más lealtad, cínico menos');
  assert.ok(T.traitMul({ traits: ['gloton'] }, 'hungerMul') > 1 && T.traitMul({ traits: ['trabajador'] }, 'workMul') > 1);
});

test('economía (CotL): el mercader viene cada tres días con ofertas fijas por día; las mejoras se pagan una vez y cambian la expedición', async () => {
  const E = await import('../src/game/economy.js');
  const R = await import('../src/game/run.js');
  const g = newGame(12);
  g.day = 1; assert.equal(E.merchant(g), null, 'el día 1 no hay mercader');
  g.day = 2; const m = E.merchant(g); assert.ok(m && m.offers.length === 4);
  assert.deepEqual(E.merchant(g).offers, m.offers, 'mismas ofertas en el mismo día');
  g.home.resources = { hojarasca: 30, musgo: 30, esporas: 30, cal: 30, ambar: 30 };
  assert.ok(E.trade(g, 0) && !E.trade(g, 0), 'cada oferta se cambia una vez');
  g.day = 3; assert.equal(E.merchant(g), null);
  assert.ok(E.buyUpgrade(g, 'armero') && !E.buyUpgrade(g, 'armero'));
  const isl = g.islands.find((i) => i.kind === 'nido'), ids = g.home.isopods.slice(0, 3).map((i) => i.id);
  assert.equal(R.newRun(g.home, isl, ids, 0, { upgrades: g.upgrades }).weaponOffer.length, 3, 'con el armero se elige entre tres');
  assert.equal(R.newRun(g.home, isl, ids, 0, { robe: 'destino' }).cards.length, 4, 'el manto del destino da cuatro cartas');
});

test('sendero: en 200 semillas se llega al final y todos los recursos son alcanzables', async () => {
  const { reachable } = await import('../src/game/gather.js');
  for (let seed = 1; seed <= 200; seed++) {
    const g = newGather({ seed, biome: 'hojarasca', weather: 'claro', kind: 'recoleccion' });
    const reach = reachable(g.levels, g.grid, { i: Math.floor(g.player.x), j: Math.floor(g.player.y) });
    const open = g.levels.map((h, k) => (h !== null ? k : -1)).filter((k) => k >= 0), end = Math.min(...open.map((k) => Math.floor(k / g.side)));
    assert.ok([...reach].some((k) => Math.floor(k / g.side) === end), `semilla ${seed}: se llega al final`);
    assert.ok(g.nodes.length >= 8 && g.nodes.every((n) => reach.has(Math.floor(n.y) * g.side + Math.floor(n.x))), `semilla ${seed}: recursos alcanzables`);
  }
});
