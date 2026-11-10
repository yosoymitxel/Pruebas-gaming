import test from 'node:test';
import assert from 'node:assert/strict';
import { newRound, tick, TIME } from '../src/game/game.js';
import { load, save } from '../src/game/save.js';
import { checkRegistry } from '../tools/check-registry.mjs';

const memory = () => { const m = {}; return { getItem: (k) => m[k] ?? null, setItem: (k, v) => { m[k] = v; } }; };

test('registros completos', () => assert.deepEqual(checkRegistry(), []));

test('recoger todo gana; esperar pierde por tiempo', () => {
  const g = newRound(3);
  for (const it of g.items) { g.player.x = it.x; g.player.y = it.y; tick(g, 0.01); }
  assert.equal(g.result, 'win');
  assert.ok(g.score >= g.items.length);
  const h = newRound(3);
  for (let k = 0; k < (TIME + 1) * 60; k++) tick(h, 1 / 60);
  assert.equal(h.result, 'time');
});

test('el jugador no sale de la arena', () => {
  const g = newRound(1);
  for (let k = 0; k < 600; k++) tick(g, 1 / 60, { x: 1, y: 0 });
  assert.ok(Math.hypot(g.player.x, g.player.y) < 6);
});

test('guardado: ida y vuelta; uno corrupto se ignora', () => {
  const st = memory();
  assert.ok(save({ best: 7 }, st));
  assert.equal(load(st).best, 7);
  st.setItem('__ID__.save.v1', '{"v":1}');
  assert.equal(load(st), null);
});
