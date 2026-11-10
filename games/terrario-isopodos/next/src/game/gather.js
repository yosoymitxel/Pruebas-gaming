// Minijuego de recolección en una isla: mover al isópodo, recoger recursos y quizá rescatar a un
// isópodo perdido antes de que acabe el tiempo. La isla tiene forma irregular y rocas que bloquean.
import { BIOMES, WEATHERS } from '../data/world.js';
import { createGrid, openRect, place, blocked, collideGrid } from './grid.js';
import { mulberry32, pickFrom } from '../core/rng.js';

export const GATHER_TIME = 40;
const SIDE = 13, SPEED = 3.4, PICK = 0.7;

export function newGather(island) {
  const rng = mulberry32(island.seed);
  const grid = createGrid(SIDE, SIDE);
  const c = SIDE / 2;
  for (let j = 0; j < SIDE; j++) {
    for (let i = 0; i < SIDE; i++) {
      const ang = Math.atan2(j + 0.5 - c, i + 0.5 - c);
      const edge = 5.2 + Math.sin(ang * 3 + rng() * 0.6) * 0.8;
      if (Math.hypot(i + 0.5 - c, j + 0.5 - c) < edge) openRect(grid, i, j, 1, 1);
    }
  }
  const free = () => {
    for (let k = 0; k < 200; k++) {
      const i = Math.floor(rng() * SIDE), j = Math.floor(rng() * SIDE);
      if (!blocked(grid, i, j) && Math.hypot(i + 0.5 - c, j + 0.5 - c) > 1.5) return { x: i + 0.5, y: j + 0.5 };
    }
    return null;
  };
  for (let k = 0; k < 6; k++) { const p = free(); if (p) place(grid, 'piedra', Math.floor(p.x), Math.floor(p.y)); }
  const biome = BIOMES[island.biome];
  const nodes = [];
  for (let k = 0; k < 14; k++) { const p = free(); if (p) nodes.push({ id: k, ...p, res: pickFrom(rng, biome.loot), taken: false }); }
  const lost = rng() < 0.6 ? { ...free(), taken: false } : null;
  return {
    island, grid, nodes, lost, time: GATHER_TIME, done: false,
    player: { x: c, y: c, vx: 0, vy: 0 }, got: {}, rescued: false, yield: WEATHERS[island.weather].yield,
  };
}

export function tickGather(g, dt, move = {}) {
  if (g.done) return;
  g.time = Math.max(0, g.time - dt);
  const p = g.player, mx = move.x ?? 0, my = move.y ?? 0, len = Math.hypot(mx, my);
  p.vx = len ? (mx / Math.max(1, len)) * SPEED : 0;
  p.vy = len ? (my / Math.max(1, len)) * SPEED : 0;
  p.x += p.vx * dt; p.y += p.vy * dt;
  collideGrid(g.grid, p, 0.3);
  for (const n of g.nodes) {
    if (!n.taken && Math.hypot(n.x - p.x, n.y - p.y) < PICK) {
      n.taken = true;
      g.got[n.res] = (g.got[n.res] ?? 0) + 1;
    }
  }
  if (g.lost && !g.lost.taken && Math.hypot(g.lost.x - p.x, g.lost.y - p.y) < PICK) { g.lost.taken = true; g.rescued = true; }
  if (g.time <= 0 || g.nodes.every((n) => n.taken)) g.done = true;
}

// Recursos finales con el bonus del clima (redondeo hacia arriba: recoger siempre cuenta).
export const gatherLoot = (g) => Object.fromEntries(Object.entries(g.got).map(([r, n]) => [r, Math.ceil(n * g.yield)]));
