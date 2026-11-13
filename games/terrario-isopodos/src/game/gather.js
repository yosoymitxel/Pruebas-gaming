// Recolección: explorar una isla con relieve. Cada celda tiene un nivel de altura (o es un hueco al vacío);
// se camina en llano y se baja sin problema, pero subir un escalón o cruzar un hueco pide saltar. Lo mejor
// está en lo alto o al otro lado de un hueco. Caer al vacío devuelve al último sitio seguro y cuesta tiempo.
// La forma de la isla sale de GATHER_SHAPES (meseta, escalinata, islotes, anillo, cresta).
import { BIOMES, WEATHERS, GATHER_SHAPES } from '../data/world.js';
import { createGrid, openRect, place, blocked } from './grid.js';
import { mulberry32, pickFrom } from '../core/rng.js';
import { box } from '../core/physics.js';

export const GATHER_TIME = 45;
export const LEVEL_H = 0.5; // alto de un escalón en el mundo
const SIDE = 15, SPEED = 3.6, ACCEL = 28, AIR_ACCEL = 14, PICK = 0.7, FALL_COST = 4;
// Salto de plataformas: subida rápida, caída más pesada, altura según cuánto se mantiene el botón,
// margen tras salir del borde (coyote) y pulsación recordada justo antes de tocar suelo (buffer).
const JUMP = { v: 6.2, g: 20, fallMul: 1.7, cut: 0.45, coyote: 0.1, buffer: 0.13 };
const CHAIN = { window: 2, bonus: 0.4 }; // recoger seguido: cada eslabón desde el 2.º suma tiempo

// Nivel de altura de cada celda según la forma: null = hueco.
function terrain(shape, rng) {
  const c = SIDE / 2, lv = new Array(SIDE * SIDE).fill(null), seedA = rng() * 6.28;
  for (let j = 0; j < SIDE; j++) for (let i = 0; i < SIDE; i++) {
    const x = i + 0.5 - c, y = j + 0.5 - c, d = Math.hypot(x, y), a = Math.atan2(y, x);
    const rim = 6.4 + Math.sin(a * 3 + seedA) * 0.7;
    if (d > rim) continue;
    let h = 0;
    if (shape === 'meseta') h = d < 2.2 ? 3 : d < 3.6 ? 2 : d < 5 ? 1 : 0;
    else if (shape === 'escalinata') h = Math.max(0, Math.min(4, Math.floor((x + 6) / 2.6)));
    else if (shape === 'islotes') {
      const blobs = [[-3.2, -2.4, 2.6, 0], [2.8, -2.8, 2.5, 1], [3.2, 2.8, 2.5, 2], [-2.8, 3.2, 2.5, 1], [0, 0, 1.6, 2]];
      const b = blobs.find(([bx, by, r]) => Math.hypot(x - bx, y - by) < r);
      if (!b) continue;
      h = b[3];
    } else if (shape === 'anillo') { if (d < 2.3) continue; h = d < 3.4 ? 2 : d < 4.8 ? 1 : 0; }
    else if (shape === 'cresta') { const ridge = Math.abs(y - Math.sin(x * 0.7 + seedA) * 2.2); h = ridge < 1.2 ? 3 : ridge < 2.4 ? 1 : 0; }
    if (shape !== 'islotes' && rng() < 0.05 && d > 2) continue; // algún hueco suelto para saltar
    lv[j * SIDE + i] = h;
  }
  return lv;
}

export function newGather(island) {
  const rng = mulberry32(island.seed);
  const shapes = Object.keys(GATHER_SHAPES), shape = shapes[island.seed % shapes.length];
  const levels = terrain(shape, rng);
  const grid = createGrid(SIDE, SIDE);
  levels.forEach((h, k) => { if (h !== null) openRect(grid, k % SIDE, Math.floor(k / SIDE), 1, 1); });
  const cells = levels.map((h, k) => ({ h, i: k % SIDE, j: Math.floor(k / SIDE) })).filter((c) => c.h !== null);
  const start = cells.filter((c) => c.h === 0).sort((a, b) => Math.hypot(a.i - 7, a.j - 11) - Math.hypot(b.i - 7, b.j - 11))[0] ?? cells[0];
  let reach = reachable(levels, grid, start);
  const free = (minH = 0) => {
    for (let k = 0; k < 200; k++) {
      const c = cells[Math.floor(rng() * cells.length)];
      if (!reach.has(c.j * SIDE + c.i)) continue;
      if (c.h >= minH && !blocked(grid, c.i, c.j) && Math.hypot(c.i - start.i, c.j - start.j) > 1.5) return { x: c.i + 0.5, y: c.j + 0.5, h: c.h };
    }
    return null;
  };
  for (let k = 0; k < 4; k++) { const p = free(); if (p) place(grid, 'piedra', Math.floor(p.x), Math.floor(p.y)); }
  reach = reachable(levels, grid, start); // las piedras pueden cortar algún paso
  const biome = BIOMES[island.biome], top = Math.max(...cells.filter((c) => reach.has(c.j * SIDE + c.i)).map((c) => c.h));
  const nodes = [];
  // Recursos repartidos por alturas; en lo más alto, ámbar (el premio por trepar).
  for (let k = 0; k < 14; k++) { const p = free(k < 5 ? Math.min(top, 2) : 0); if (p) nodes.push({ id: k, ...p, res: pickFrom(rng, biome.loot), taken: false }); }
  for (let k = 0; k < 2; k++) { const p = free(top); if (p) nodes.push({ id: 100 + k, ...p, res: 'ambar', taken: false }); }
  // Diseño validado: solo se deja lo que se puede alcanzar andando y saltando desde el inicio.
  const ok = (p) => p && reach.has(Math.floor(p.y) * SIDE + Math.floor(p.x));
  const kept = nodes.filter(ok);
  nodes.length = 0; nodes.push(...kept);
  const lostAt = free(1), lost = rng() < 0.6 && ok(lostAt) ? { ...lostAt, taken: false } : null;
  const p0 = { x: start.i + 0.5, y: start.j + 0.5 };
  return {
    island, shape, grid, levels, side: SIDE, nodes, lost, time: GATHER_TIME, done: false, falls: 0,
    player: { ...p0, z: start.h * LEVEL_H, vz: 0, vx: 0, vy: 0, air: false, safe: { ...p0, z: start.h * LEVEL_H }, falling: 0, coyote: 0, buf: 0, cut: false },
    chain: { n: 0, t: 0 },
    got: {}, rescued: false, yield: WEATHERS[island.weather].yield,
  };
}

// Celdas alcanzables: a una vecina si sube como mucho un escalón; saltando, por encima de un hueco de una celda.
export function reachable(levels, grid, start) {
  const at = (i, j) => (i < 0 || j < 0 || i >= SIDE || j >= SIDE || grid.cells[j * SIDE + i] !== null ? null : levels[j * SIDE + i]);
  const seen = new Set([start.j * SIDE + start.i]), todo = [[start.i, start.j]];
  while (todo.length) {
    const [i, j] = todo.pop(), h = levels[j * SIDE + i];
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      for (const step of [1, 2]) {
        const ni = i + di * step, nj = j + dj * step, nh = at(ni, nj);
        if (step === 2 && at(i + di, j + dj) !== null) continue; // el salto largo es solo sobre un hueco
        if (nh === null || nh > h + 1 || seen.has(nj * SIDE + ni)) continue;
        seen.add(nj * SIDE + ni); todo.push([ni, nj]);
      }
    }
  }
  return seen;
}

export const levelAt = (g, x, y) => {
  const i = Math.floor(x), j = Math.floor(y);
  return i < 0 || j < 0 || i >= g.side || j >= g.side ? null : g.levels[j * g.side + i];
};

// move: {x, y}; jump: pulsado este fotograma; held: botón aún mantenido (corta el salto al soltar).
export function tickGather(g, dt, move = {}, jump = false, held = true) {
  if (g.done) return;
  g.time = Math.max(0, g.time - dt);
  const p = g.player;
  g.chain.t = Math.max(0, g.chain.t - dt);
  if (!g.chain.t) g.chain.n = 0;
  if (p.falling > 0) { // cayendo al vacío: vuelve al último sitio seguro
    p.falling -= dt; p.z -= dt * 8;
    if (p.falling <= 0) Object.assign(p, { x: p.safe.x, y: p.safe.y, z: p.safe.z, vz: 0, vx: 0, vy: 0, air: false });
    return;
  }
  const mx = move.x ?? 0, my = move.y ?? 0, len = Math.hypot(mx, my), k = len ? SPEED / Math.max(1, len) : 0;
  const acc = (p.air ? AIR_ACCEL : ACCEL) * dt, toward = (v, goal) => v + Math.max(-acc, Math.min(acc, goal - v));
  p.vx = toward(p.vx, mx * k); p.vy = toward(p.vy, my * k);
  p.coyote = p.air ? Math.max(0, p.coyote - dt) : JUMP.coyote;
  p.buf = jump ? JUMP.buffer : Math.max(0, p.buf - dt);
  if (p.buf > 0 && p.coyote > 0) { p.vz = JUMP.v; p.air = true; p.coyote = p.buf = 0; p.cut = false; g.jumped = (g.jumped ?? 0) + 1; }
  if (p.air && !held && !p.cut && p.vz > 0) { p.vz *= JUMP.cut; p.cut = true; }
  // Cada eje por separado: una pared (escalón alto) frena ese eje y deja deslizar por el otro.
  for (const axis of ['x', 'y']) {
    const nx = axis === 'x' ? p.x + p.vx * dt : p.x, ny = axis === 'y' ? p.y + p.vy * dt : p.y;
    const lv = levelAt(g, nx, ny);
    if (lv !== null && lv * LEVEL_H > p.z + 0.12) { if (axis === 'x') p.vx = 0; else p.vy = 0; continue; }
    p.x = nx; p.y = ny;
  }
  // piedras
  const ci = Math.floor(p.x), cj = Math.floor(p.y);
  for (let j = cj - 1; j <= cj + 1; j++) for (let i = ci - 1; i <= ci + 1; i++) if (g.grid.cells[j * g.side + i] !== null && g.grid.cells[j * g.side + i] !== undefined) box(p, 0.3, i, j, i + 1, j + 1);
  // vertical
  const ground = levelAt(g, p.x, p.y);
  if (p.air || ground === null || ground * LEVEL_H < p.z - 0.01) {
    p.air = true;
    p.vz -= JUMP.g * (p.vz < 0 ? JUMP.fallMul : 1) * dt; p.z += p.vz * dt;
    if (ground !== null && p.z <= ground * LEVEL_H) { p.z = ground * LEVEL_H; p.vz = 0; p.air = false; }
    else if (ground === null && p.z < -0.6) { p.falling = 0.5; g.falls++; g.time = Math.max(0, g.time - FALL_COST); g.chain.n = 0; g.chain.t = 0; }
  }
  if (!p.air && ground !== null) p.safe = { x: Math.floor(p.x) + 0.5, y: Math.floor(p.y) + 0.5, z: p.z };
  for (const n of g.nodes) {
    if (!n.taken && Math.hypot(n.x - p.x, n.y - p.y) < PICK && Math.abs(n.h * LEVEL_H - p.z) < 0.6) {
      n.taken = true;
      g.got[n.res] = (g.got[n.res] ?? 0) + 1;
      g.chain.n++; g.chain.t = CHAIN.window;
      if (g.chain.n > 1) { g.time += CHAIN.bonus; g.chained = (g.chained ?? 0) + 1; }
    }
  }
  if (g.lost && !g.lost.taken && Math.hypot(g.lost.x - p.x, g.lost.y - p.y) < PICK && Math.abs(g.lost.h * LEVEL_H - p.z) < 0.6) { g.lost.taken = true; g.rescued = true; }
  if (g.time <= 0 || g.nodes.every((n) => n.taken)) g.done = true;
}

// Recursos finales con el bonus del clima (redondeo hacia arriba: recoger siempre cuenta).
export const gatherLoot = (g) => Object.fromEntries(Object.entries(g.got).map(([r, n]) => [r, Math.ceil(n * g.yield)]));
