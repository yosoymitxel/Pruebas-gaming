// Física 2D en el plano del suelo, portada de KureiChaosChess (src/game/physics.js): círculos, bandas y subpasos fijos.
// Cuerpos { x, y, vx, vy }; unidades de suelo (1 por celda de la rejilla). Sin DOM.
export const DT = 1 / 240; // subpaso fijo: ningún choque se salta a tope de velocidad

// Reparte un dt real (recortado a 1/20 s) en subpasos fijos mientras `go()` siga siendo cierto.
export function substeps(dt, fn, go = () => true) {
  dt = Math.min(dt, 1 / 20);
  for (let t = 0; t < dt - 1e-9 && go(); t += DT) fn(Math.min(DT, dt - t));
}

// Choque de un cuerpo móvil `b` contra uno que no cede (masa infinita) en (ox, oy) con velocidad
// (ovx, ovy). `min`: suma de radios; `ny0`: normal si están justo encima. Saca a `b` y, si se
// acercaban, lo rebota con elasticidad `e`. Devuelve la fuerza del golpe (0 si solo se tocaban).
export function collide(b, ox, oy, min, e, ovx = 0, ovy = 0, ny0 = -1) {
  const dx = b.x - ox, dy = b.y - oy, d = Math.hypot(dx, dy);
  if (d >= min) return 0;
  const nx = d ? dx / d : 0, ny = d ? dy / d : ny0;
  b.x = ox + nx * min;
  b.y = oy + ny * min;
  const rel = (b.vx - ovx) * nx + (b.vy - ovy) * ny;
  if (rel >= 0) return 0;
  b.vx -= (1 + e) * rel * nx;
  b.vy -= (1 + e) * rel * ny;
  return -rel || 1e-9;
}

// Bandas de la mesa [0, w] × [0, h] para un cuerpo de radio r. `open(b)` deja pasar por arriba y
// abajo (bocas de portería). `hit(speed)` avisa de cada rebote.
export function walls(b, r, w, h, e, hit, open) {
  if (b.x < r) { b.x = r; if (b.vx < 0) { hit?.(-b.vx); b.vx = -b.vx * e; } }
  if (b.x > w - r) { b.x = w - r; if (b.vx > 0) { hit?.(b.vx); b.vx = -b.vx * e; } }
  if (open?.(b)) return;
  if (b.y < r) { b.y = r; if (b.vy < 0) { hit?.(-b.vy); b.vy = -b.vy * e; } }
  if (b.y > h - r) { b.y = h - r; if (b.vy > 0) { hit?.(b.vy); b.vy = -b.vy * e; } }
}

// Rozamiento de rodadura: frena `decel` (u/s²) y avanza. Devuelve la velocidad que le queda.
export function slide(b, decel, dt) {
  const sp = Math.hypot(b.vx, b.vy);
  if (!sp) return 0;
  const ns = Math.max(0, sp - decel * dt);
  b.vx *= ns / sp; b.vy *= ns / sp;
  b.x += b.vx * dt; b.y += b.vy * dt;
  return ns;
}

// Choque entre dos cuerpos móviles (masas `ma`, `mb`), como bolas de billar. Devuelve la fuerza del golpe.
export function bump(a, b, min, e, ma = 1, mb = 1) {
  const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
  if (d >= min) return 0;
  const nx = d ? dx / d : 1, ny = d ? dy / d : 0, ia = 1 / ma, ib = 1 / mb, push = (min - d) / (ia + ib);
  a.x -= nx * push * ia; a.y -= ny * push * ia;
  b.x += nx * push * ib; b.y += ny * push * ib;
  const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (rel >= 0) return 0;
  const j = -(1 + e) * rel / (ia + ib);
  a.vx -= j * nx * ia; a.vy -= j * ny * ia;
  b.vx += j * nx * ib; b.vy += j * ny * ib;
  return -rel;
}

// Banda circular de radio R centrada en (cx, cy) para un cuerpo de radio r. Devuelve la fuerza del rebote.
export function rim(b, r, cx, cy, R, e) {
  const dx = b.x - cx, dy = b.y - cy, d = Math.hypot(dx, dy), max = R - r;
  if (d <= max || !d) return 0;
  const nx = dx / d, ny = dy / d;
  b.x = cx + nx * max; b.y = cy + ny * max;
  const out = b.vx * nx + b.vy * ny;
  if (out <= 0) return 0;
  b.vx -= (1 + e) * out * nx; b.vy -= (1 + e) * out * ny;
  return out;
}

// Círculo de radio r contra una caja fija [x0, x1] × [y0, y1] (celda ocupada, muro). Saca al cuerpo por
// el lado más cercano y anula la velocidad que lo metía. Devuelve true si había contacto.
export function box(b, r, x0, y0, x1, y1) {
  const cx = Math.max(x0, Math.min(b.x, x1)), cy = Math.max(y0, Math.min(b.y, y1));
  let dx = b.x - cx, dy = b.y - cy, d = Math.hypot(dx, dy);
  if (d >= r) return false;
  if (!d) { // centro dentro de la caja: salir por la cara más cercana
    const exits = [[b.x - x0, -1, 0], [x1 - b.x, 1, 0], [b.y - y0, 0, -1], [y1 - b.y, 0, 1]];
    const [depth, nx, ny] = exits.reduce((a, e) => (e[0] < a[0] ? e : a));
    b.x += nx * (depth + r); b.y += ny * (depth + r);
    dx = nx; dy = ny; d = 1;
  } else {
    b.x = cx + (dx / d) * r; b.y = cy + (dy / d) * r;
  }
  const nx = dx / d, ny = dy / d, into = b.vx * nx + b.vy * ny;
  if (into < 0) { b.vx -= into * nx; b.vy -= into * ny; }
  return true;
}
