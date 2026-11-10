import test from 'node:test';
import assert from 'node:assert/strict';
import { createGrid, openRect, canPlace, place, remove, move, footprint, blocked, collideGrid } from '../src/game/grid.js';
import { checkRegistry } from '../tools/check-registry.mjs';

const grid10 = () => { const g = createGrid(10, 10); openRect(g, 0, 0, 10, 10); return g; };

test('registros completos', () => {
  assert.deepEqual(checkRegistry(), []);
});

test('no se coloca en zona cerrada ni fuera', () => {
  const g = createGrid(10, 10);
  openRect(g, 0, 0, 5, 5);
  assert.equal(canPlace(g, 'refugio', 3, 3), true);
  assert.equal(canPlace(g, 'refugio', 4, 4), false);
  assert.equal(canPlace(g, 'comedero', -1, 0), false);
});

test('las huellas no se solapan y girar cambia la huella', () => {
  const g = grid10();
  assert.deepEqual(footprint('charca', 1), { w: 1, h: 2 });
  const a = place(g, 'charca', 0, 0);
  assert.ok(a);
  assert.equal(place(g, 'comedero', 1, 0), null);
  assert.ok(place(g, 'comedero', 2, 0));
  assert.ok(move(g, a, 0, 0, 1));
  assert.equal(g.cells[1 * 10 + 0], a);
  assert.equal(g.cells[0 * 10 + 1], null);
  assert.ok(remove(g, a));
  assert.ok(g.cells.every((c) => c === null || g.pieces[c]));
});

test('mover a un sitio ocupado no cambia nada', () => {
  const g = grid10();
  const a = place(g, 'refugio', 0, 0);
  place(g, 'refugio', 4, 0);
  const before = JSON.stringify(g.pieces);
  assert.equal(move(g, a, 3, 0, 0), false);
  assert.equal(JSON.stringify(g.pieces), before);
});

test('solo las piezas sólidas y las zonas cerradas bloquean', () => {
  const g = grid10();
  place(g, 'huerto', 0, 0);
  place(g, 'comedero', 5, 5);
  assert.equal(blocked(g, 1, 1), false);
  assert.equal(blocked(g, 5, 5), true);
  assert.equal(blocked(g, -1, 0), true);
});

test('un isópodo no atraviesa una pieza sólida aunque vaya rápido', () => {
  const g = grid10();
  place(g, 'refugio', 4, 4);
  const b = { x: 3.5, y: 4.9, vx: 20, vy: 0 };
  for (let k = 0; k < 120; k++) { b.x += b.vx / 240; collideGrid(g, b, 0.3); }
  assert.ok(b.x <= 4 - 0.3 + 1e-9, `quedó en x=${b.x}`);
  assert.equal(b.vx, 0);
});

test('el borde del terrario contiene', () => {
  const g = grid10();
  const b = { x: 0.5, y: 0.5, vx: -5, vy: -5 };
  for (let k = 0; k < 60; k++) { b.x += b.vx / 240; b.y += b.vy / 240; collideGrid(g, b, 0.3); }
  assert.ok(b.x >= 0.3 - 1e-9 && b.y >= 0.3 - 1e-9);
});
