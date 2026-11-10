// Disposición de una arena a partir de su tipo y una semilla: obstáculos en la banda media, lejos de donde
// empiezan el equipo (abajo) y las aberraciones (arriba). Solo datos: la física la aplica combat.js.
import { ARENAS, POOL, PILLAR_R } from '../data/arenas.js';
import { mulberry32 } from '../core/rng.js';

export function layoutArena(kind = 'claro', seed = 1) {
  const def = ARENAS[kind] ?? ARENAS.claro, rng = mulberry32(seed * 7 + 3);
  const spots = [];
  const place = (r) => {
    for (let k = 0; k < 60; k++) {
      const a = rng() * Math.PI * 2, d = (def.pit ? def.pit + 1.2 : 1.6) + rng() * 2.4, x = Math.cos(a) * d, y = Math.sin(a) * d * 0.8;
      if (Math.abs(y - 4) < 1.6 || Math.abs(y + 3) < 1.4 && Math.abs(x) < 3.5) continue; // salidas libres
      if (spots.every((s) => Math.hypot(s.x - x, s.y - y) > s.r + r + 0.9)) { const s = { x, y, r }; spots.push(s); return s; }
    }
    return null;
  };
  const pillars = Array.from({ length: def.pillars }, () => place(PILLAR_R[0] + rng() * (PILLAR_R[1] - PILLAR_R[0]))).filter(Boolean);
  const pools = Array.from({ length: def.pools }, () => place(POOL.r)).filter(Boolean);
  return { kind, pillars, pools, pit: def.pit };
}
