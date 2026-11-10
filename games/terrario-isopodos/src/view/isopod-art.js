// Isópodos dibujados en código, por especie (src/data/species.js): perfil de tres cuartos mirando a la derecha,
// siete placas del pereion con su filo claro, el pleon que se estrecha atrás, cabeza con antenas segmentadas y
// ojos, patas, y en los Porcellio las dos colitas. Variantes: bolita (conglobación) y muda (la mitad de atrás
// recién mudada, pálida: los isópodos mudan en dos mitades). Todo con el trazo de tinta del juego.
import { SPECIES } from '../data/species.js';
import { PALETTES } from '../data/palettes.js';
import { mulberry32 } from '../core/rng.js';

const INK = PALETTES.cozy.ink, PAPER = PALETTES.cozy.paper;
const SHAPE = { domo: [0.7, 0.5], plano: [0.8, 0.36], fino: [0.7, 0.3], pato: [0.68, 0.46] };
const sp = (id) => SPECIES[id] ?? SPECIES.vulgare;

// Relleno del dibujo del caparazón dentro del contorno ya recortado. `k`: índice de placa (0 = cola).
function pattern(c, s, rng, x0, y0, x1, y1, k) {
  const [, p] = s.colors, w = x1 - x0, h = y1 - y0;
  c.fillStyle = p;
  if (s.pattern === 'rayas') { if (k % 2) c.fillRect(x0, y0, w, h); }
  else if (s.pattern === 'bandas') { c.globalAlpha = 0.5; c.fillRect(x0, y0, w * 0.25, h); c.globalAlpha = 1; }
  else if (s.pattern === 'manchas') { for (let n = 0; n < 2; n++) if (rng() < 0.7) { c.beginPath(); c.ellipse(x0 + rng() * w, y0 + h * (0.2 + rng() * 0.6), w * (0.3 + rng() * 0.4), h * 0.14, rng(), 0, 7); c.fill(); } }
  else if (s.pattern === 'motas') { for (let n = 0; n < 5; n++) { c.fillStyle = n % 2 ? p : s.colors[2]; c.beginPath(); c.arc(x0 + rng() * w, y0 + rng() * h, 2 + rng() * 3, 0, 7); c.fill(); } }
  else if (s.pattern === 'polvo') { c.globalAlpha = 0.55; for (let n = 0; n < 26; n++) c.fillRect(x0 + rng() * w, y0 + rng() * h, 2, 2); c.globalAlpha = 1; }
  else if (s.pattern === 'lava') { const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, s.colors[1]); g.addColorStop(0.55, 'transparent'); c.fillStyle = g; c.fillRect(x0, y0, w, h); }
}

// Contorno del cuerpo: semielipse (domo/pato) o elipse aplastada con faldón (plano/fino).
function bodyPath(c, cx, base, rx, ry, flat) {
  c.beginPath();
  if (!flat) { c.ellipse(cx, base, rx, ry, 0, Math.PI, 0); c.closePath(); return; }
  c.moveTo(cx - rx, base);
  c.bezierCurveTo(cx - rx * 0.95, base - ry * 1.2, cx + rx * 0.7, base - ry * 1.25, cx + rx, base - ry * 0.2);
  c.lineTo(cx + rx, base); c.closePath();
}

export function drawIsopod(c, w, h, id, { molt = false } = {}) {
  const s = sp(id), rng = mulberry32(id.length * 977), [lk, hk] = SHAPE[s.body];
  const cx = w * 0.46, base = h * 0.8, rx = w * lk / 2, ry = h * hk, flat = s.body === 'plano' || s.body === 'fino';
  c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = INK;
  // patas (siete pares, se ven las de un lado) y colitas de los Porcellio
  c.lineWidth = 4;
  for (let k = 0; k < 7; k++) { const x = cx - rx * 0.75 + k * rx * 0.25; c.beginPath(); c.moveTo(x, base - 3); c.lineTo(x + 5, base + 9); c.lineTo(x + 9, base + 11); c.stroke(); }
  if (!s.rolls) for (const dy of [-5, 4]) { c.beginPath(); c.moveTo(cx - rx + 6, base - 6 + dy); c.lineTo(cx - rx - 22, base - 2 + dy * 2.2); c.lineWidth = 5; c.stroke(); }
  // cuerpo: color base, placas y dibujo dentro del contorno
  c.save();
  bodyPath(c, cx, base, rx, ry, flat); c.fillStyle = s.colors[0]; c.fill(); c.clip();
  const plates = 7, pleon = 4, x0 = cx - rx, span = rx * 2;
  const edges = []; // borde delantero de cada placa (de la cola a la cabeza)
  for (let k = 0; k <= pleon + plates; k++) edges.push(x0 + span * (k < pleon ? k * 0.035 : 0.14 + ((k - pleon) / plates) * 0.82));
  for (let k = 0; k < edges.length - 1; k++) pattern(c, s, rng, edges[k], base - ry * 1.3, edges[k + 1], base, k);
  if (molt) { c.fillStyle = PAPER; c.globalAlpha = 0.72; c.fillRect(x0, base - ry * 1.3, span * 0.5, ry * 1.3); c.globalAlpha = 1; }
  // sombra bajo el borde y luz arriba: volumen sin degradados blandos
  c.fillStyle = INK; c.globalAlpha = 0.18; c.fillRect(x0, base - ry * 0.28, span, ry * 0.28); c.globalAlpha = 1;
  c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 3;
  c.beginPath(); c.ellipse(cx + rx * 0.05, base - ry * 0.05, rx * 0.8, ry * 0.85, 0, Math.PI * 1.15, Math.PI * 1.55); c.stroke();
  c.strokeStyle = INK; c.lineWidth = 2.6;
  for (const x of edges.slice(1, -1)) { c.beginPath(); c.moveTo(x, base); c.quadraticCurveTo(x - 6, base - ry * 0.7, x + 2, base - ry * 1.3); c.stroke(); }
  c.restore();
  c.strokeStyle = INK; c.lineWidth = 5; bodyPath(c, cx, base, rx, ry, flat); c.stroke();
  // faldón dentado de los planos (epímeros)
  if (flat) { c.lineWidth = 3; for (const x of edges.slice(pleon, -1)) { c.beginPath(); c.moveTo(x, base); c.lineTo(x + 4, base + 5); c.stroke(); } }
  // cabeza, ojos y antenas segmentadas
  const hx = cx + rx * 0.98, hy = base - ry * (flat ? 0.3 : 0.22), hr = ry * (s.body === 'pato' ? 0.42 : 0.3);
  c.beginPath(); c.ellipse(hx, hy, hr * 1.1, hr, 0, 0, 7); c.fillStyle = s.colors[0]; c.fill(); c.lineWidth = 4; c.stroke();
  if (s.body === 'pato') { c.beginPath(); c.ellipse(hx + hr * 1.05, hy + hr * 0.35, hr * 0.6, hr * 0.28, 0.15, 0, 7); c.fillStyle = s.colors[1]; c.fill(); c.lineWidth = 3; c.stroke(); }
  c.fillStyle = INK; c.beginPath(); c.arc(hx + hr * 0.25, hy - hr * 0.15, hr * 0.32, 0, 7); c.fill();
  c.fillStyle = PAPER; c.beginPath(); c.arc(hx + hr * 0.33, hy - hr * 0.28, hr * 0.11, 0, 7); c.fill();
  c.lineWidth = 3;
  for (const [ax, ay, len] of [[0.6, -0.8, 1], [0.9, -0.4, 0.8]]) {
    let px = hx + hr * ax, py = hy + hr * ay;
    for (let seg = 0; seg < 4; seg++) {
      const nx = px + 9 * len, ny = py - (6 - seg * 3) * len;
      c.beginPath(); c.moveTo(px, py); c.lineTo(nx, ny); c.stroke();
      c.beginPath(); c.arc(nx, ny, 1.8, 0, 7); c.fillStyle = INK; c.fill();
      px = nx; py = ny;
    }
  }
}

// Bolita: la misma especie enrollada, con las placas como bandas curvas.
export function drawBall(c, w, h, id) {
  const s = sp(id), rng = mulberry32(id.length * 131), r = Math.min(w, h) * 0.4, cx = w / 2, cy = h * 0.55;
  c.save();
  c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fillStyle = s.colors[0]; c.fill(); c.clip();
  for (let k = 0; k < 9; k++) pattern(c, s, rng, cx - r + (k * 2 * r) / 9, cy - r, cx - r + ((k + 1) * 2 * r) / 9, cy + r, k);
  c.strokeStyle = INK; c.lineWidth = 2.6;
  for (let k = 1; k < 9; k++) { const x = cx - r + (k * 2 * r) / 9; c.beginPath(); c.moveTo(x, cy - r); c.quadraticCurveTo(x + (x - cx) * 0.4, cy, x, cy + r); c.stroke(); }
  c.fillStyle = INK; c.globalAlpha = 0.2; c.beginPath(); c.arc(cx + r * 0.2, cy + r * 0.25, r, 0, 7); c.fill(); c.globalAlpha = 1;
  c.strokeStyle = 'rgba(255,255,255,0.6)'; c.lineWidth = 4; c.beginPath(); c.arc(cx, cy, r * 0.75, Math.PI * 1.1, Math.PI * 1.5); c.stroke();
  c.restore();
  c.strokeStyle = INK; c.lineWidth = 5; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.stroke();
}

// Muda abandonada en el suelo: la mitad de un caparazón vacío, clara y quebradiza (se recoge como cal).
export function drawMolt(c, w, h) {
  const cx = w / 2, base = h * 0.75, rx = w * 0.32, ry = h * 0.32;
  c.beginPath(); c.ellipse(cx, base, rx, ry, 0, Math.PI, 0); c.closePath();
  c.fillStyle = '#efe9da'; c.fill(); c.strokeStyle = INK; c.lineWidth = 4; c.setLineDash([10, 5]); c.stroke(); c.setLineDash([]);
  c.lineWidth = 2;
  for (let k = 1; k < 6; k++) { const x = cx - rx + (k * 2 * rx) / 6; c.beginPath(); c.moveTo(x, base); c.lineTo(x + 3, base - ry * 0.9); c.stroke(); }
}
