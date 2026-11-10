// Física 2D en el plano del suelo, portada de KureiChaosChess (src/game/physics.js).
// Cuerpos { x, y, vx, vy }; unidades de suelo (1 por celda de la rejilla). Sin DOM.

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
