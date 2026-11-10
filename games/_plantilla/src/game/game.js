// Lógica pura del ejemplo: mover al jugador por una arena redonda y recoger todo antes de que acabe el
// tiempo. Sin DOM ni Three: se prueba en Node (tests/) y la vista solo lee el estado.
import { COLLECTIBLES } from '../data/collectibles.js';
import { mulberry32 } from '../core/rng.js';

export const ARENA_R = 6, TIME = 30, SPEED = 4, PICK = 0.6;

export function newRound(seed = 1, count = 12) {
  const rng = mulberry32(seed);
  const kinds = Object.entries(COLLECTIBLES).flatMap(([id, c]) => Array(c.weight).fill(id));
  const items = Array.from({ length: count }, (_, id) => {
    const a = rng() * Math.PI * 2, d = 1.5 + rng() * (ARENA_R - 2);
    return { id, kind: kinds[Math.floor(rng() * kinds.length)], x: Math.cos(a) * d, y: Math.sin(a) * d, taken: false };
  });
  return { player: { x: 0, y: 0, vx: 0, vy: 0 }, items, time: TIME, score: 0, result: null };
}

// move: { x, y } en −1…1. Devuelve los objetos recogidos en este paso (para efectos).
export function tick(g, dt, move = {}) {
  if (g.result) return [];
  g.time = Math.max(0, g.time - dt);
  const p = g.player, len = Math.hypot(move.x ?? 0, move.y ?? 0), k = len > 1 ? 1 / len : 1;
  p.vx = (move.x ?? 0) * k * SPEED; p.vy = (move.y ?? 0) * k * SPEED;
  p.x += p.vx * dt; p.y += p.vy * dt;
  const d = Math.hypot(p.x, p.y), max = ARENA_R - 0.4;
  if (d > max) { p.x *= max / d; p.y *= max / d; }
  const got = g.items.filter((it) => !it.taken && Math.hypot(it.x - p.x, it.y - p.y) < PICK);
  for (const it of got) { it.taken = true; g.score += COLLECTIBLES[it.kind].value; }
  if (g.items.every((it) => it.taken)) g.result = 'win';
  else if (g.time <= 0) g.result = 'time';
  return got;
}
