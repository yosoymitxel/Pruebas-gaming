// Isópodos dibujados en código, por especie (src/data/species.js), como una lámina de naturalista: placas
// redondas en dos tonos, cabeza bajo la primera placa, antenas y patas grises segmentadas. Variantes: bolita y
// muda (la mitad de atrás pálida: mudan en dos mitades). Todo con el trazo de tinta del juego.
import { SPECIES } from '../data/species.js';
import { PALETTES } from '../data/palettes.js';
import { mulberry32 } from '../core/rng.js';

const INK = PALETTES.cozy.ink, PAPER = PALETTES.cozy.paper;
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

// Tono: mezcla un color hex con blanco (t > 0) o negro (t < 0).
function tone(hex, t) {
  const n = parseInt(hex.slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(t > 0 ? v + (255 - v) * t : v * (1 + t)));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
const PROFILE = { domo: [0.36, 0.86], plano: [0.37, 0.52], fino: [0.36, 0.42], pato: [0.35, 0.8] }; // [semilargo / ancho, alto / semilargo]
const LEG = '#8a8f94';

// Perfil de tres cuartos mirando a la derecha (como una lámina de naturalista): cada placa es una banda redonda
// que monta sobre la de atrás, en dos tonos (bicolor), con su sombra de solape, un brillo y dos rayas de tinta.
// Delante la cabeza metida bajo la primera placa, con ojo y antenas segmentadas; debajo, siete pares de patas.
export function drawIsopod(c, w, h, id, { molt = false } = {}) {
  const s = sp(id), rng = mulberry32(id.length * 977), u = w / 256, [kx, ky] = PROFILE[s.body];
  const rx = w * kx, H = rx * ky, cx = w * (s.rolls ? 0.44 : 0.47), base = h * 0.8, flat = s.body === 'plano' || s.body === 'fino';
  const prof = (x) => H * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2)) ** (flat ? 0.7 : 0.55); // alto del lomo en x
  const [c0, c1] = s.colors, alt = s.pattern === 'liso' || s.pattern === 'lava' || s.pattern === 'polvo' ? tone(c0, -0.16) : c1;
  c.lineCap = 'round'; c.lineJoin = 'round';
  // patas: cónicas y grises, las del lado de cámara delante; las del otro lado asoman detrás
  const legs = (back) => { for (let k = 0; k < 7; k++) {
    const x = cx - rx * 0.62 + k * rx * 0.22 + (back ? 6 * u : 0), y = base - 2 * u, dx = (back ? 3 : 8) * u, dy = (back ? 10 : 14) * u;
    c.beginPath(); c.moveTo(x - 4 * u, y); c.lineTo(x + 4 * u, y); c.lineTo(x + dx + 1.5 * u, y + dy); c.lineTo(x + dx - 1.5 * u, y + dy); c.closePath();
    c.fillStyle = back ? tone(LEG, -0.35) : LEG; c.fill(); c.strokeStyle = INK; c.lineWidth = 2.2 * u; c.stroke();
    if (!back) { c.beginPath(); c.moveTo(x + dx * 0.45 - 3 * u, y + dy * 0.45); c.lineTo(x + dx * 0.45 + 3 * u, y + dy * 0.45); c.lineWidth = 1.4 * u; c.stroke(); }
  } };
  legs(true);
  // colitas (urópodos): largas en los Porcellio, un muñón en los que se enrollan
  const tailX = cx - rx;
  for (const dy of s.rolls ? [0] : [-4, 5]) {
    const len = (s.rolls ? 8 : 19) * u;
    c.beginPath(); c.moveTo(tailX + 8 * u, base - 8 * u + dy * u); c.lineTo(tailX - len, base - 4 * u + dy * 2 * u);
    c.strokeStyle = INK; c.lineWidth = 6 * u; c.stroke(); c.strokeStyle = LEG; c.lineWidth = 3 * u; c.stroke();
  }
  // placas: de la cola a la cabeza, cada una monta sobre la anterior
  const pleon = s.rolls ? 4 : 5, plates = 7, xs = [];
  for (let k = 0; k < pleon; k++) xs.push(cx - rx * (0.9 - k * 0.075));
  for (let k = 0; k < plates; k++) xs.push(cx - rx * 0.56 + (k / (plates - 1)) * rx * 1.36);
  xs.forEach((x, k) => {
    const isPleon = k < pleon, hh = Math.max(prof(x), H * 0.2) * (isPleon ? 0.85 : 1), bw = (isPleon ? 0.09 : 0.235) * rx + (k === xs.length - 1 ? 0.05 * rx : 0);
    const col = molt && x < cx ? PAPER : (k - pleon) % 2 ? alt : c0;
    c.save();
    c.beginPath(); c.rect(0, 0, w, base); c.clip();
    c.beginPath(); c.ellipse(x, base, bw, hh, 0, Math.PI, 0); c.closePath();
    c.fillStyle = col; c.fill();
    c.save(); c.clip();
    if (!isPleon && !molt) pattern(c, s, rng, x - bw, base - hh, x + bw, base, k - pleon);
    c.fillStyle = INK; c.globalAlpha = 0.22; c.beginPath(); c.ellipse(x - bw * 1.05, base, bw * 0.55, hh * 1.05, 0, 0, 7); c.fill(); // sombra del solape
    c.globalAlpha = 0.5; c.strokeStyle = '#fff'; c.lineWidth = 3 * u;
    c.beginPath(); c.ellipse(x + bw * 0.1, base, bw * 0.8, hh * 0.84, 0, Math.PI * 1.3, Math.PI * 1.6); c.stroke(); // brillo
    c.globalAlpha = 0.55; c.strokeStyle = INK; c.lineWidth = 1.3 * u;
    if (!isPleon) for (let n = 0; n < 2; n++) { const yy = base - hh * (0.35 + rng() * 0.35), xx = x + bw * (0.05 + n * 0.3); c.beginPath(); c.moveTo(xx, yy); c.quadraticCurveTo(xx - 2 * u, yy + 5 * u, xx - 1 * u, yy + 9 * u); c.stroke(); }
    c.restore();
    c.globalAlpha = 1; c.strokeStyle = INK; c.lineWidth = (isPleon ? 2.2 : 2.8) * u;
    c.beginPath(); c.ellipse(x, base, bw, hh, 0, Math.PI, 0); c.stroke();
    c.restore();
  });
  // cabeza: asoma por delante y debajo de la primera placa
  const hx = cx + rx * 0.96, hy = base - H * 0.2, hr = H * (s.body === 'pato' ? 0.34 : 0.26);
  c.lineWidth = 2.4 * u; c.strokeStyle = INK;
  for (const [ax, ay, len] of [[0.5, -0.6, 1], [0.8, 0.1, 0.9]]) { // antenas: cinco artejos que se afinan
    let px = hx + hr * ax, py = hy + hr * ay;
    for (let seg = 0; seg < 5; seg++) {
      const nx = px + (10 - seg) * len * u, ny = py + (ay < 0 ? -(5 - seg * 1.6) : 2 + seg * 1.2) * len * u, wdt = (5.5 - seg * 0.7) * u;
      c.beginPath(); c.moveTo(px, py); c.lineTo(nx, ny); c.strokeStyle = INK; c.lineWidth = wdt + 2.4 * u; c.stroke();
      c.strokeStyle = seg % 2 ? tone(LEG, 0.2) : LEG; c.lineWidth = wdt; c.stroke();
      px = nx; py = ny;
    }
  }
  c.beginPath(); c.ellipse(hx, hy, hr * 1.15, hr, -0.25, 0, 7); c.fillStyle = tone(c0, 0.12); c.fill(); c.strokeStyle = INK; c.lineWidth = 3 * u; c.stroke();
  if (s.body === 'pato') { c.beginPath(); c.ellipse(hx + hr * 1.05, hy + hr * 0.35, hr * 0.6, hr * 0.3, 0.15, 0, 7); c.fillStyle = c1; c.fill(); c.stroke(); }
  c.fillStyle = INK; c.beginPath(); c.ellipse(hx + hr * 0.3, hy - hr * 0.05, hr * 0.26, hr * 0.32, 0, 0, 7); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(hx + hr * 0.38, hy - hr * 0.18, hr * 0.09, 0, 7); c.fill();
  // faldón: línea de los epímeros sobre las patas, dentada en los planos
  c.beginPath(); c.moveTo(cx - rx * 0.95, base);
  for (let k = 0; k <= 14; k++) { const x = cx - rx * 0.95 + (k / 14) * rx * 1.85; c.lineTo(x, base + (flat && k % 2 ? 3 * u : 0)); }
  c.strokeStyle = INK; c.lineWidth = 3 * u; c.stroke();
  legs(false);
}

// Bolita: la misma especie enrollada, con las placas como bandas curvas.
export function drawBall(c, w, h, id) {
  const s = sp(id), rng = mulberry32(id.length * 131), r = Math.min(w, h) * 0.4, cx = w / 2, cy = h * 0.55;
  c.save();
  c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fillStyle = s.colors[0]; c.fill(); c.clip();
  const alt = s.pattern === 'liso' || s.pattern === 'lava' || s.pattern === 'polvo' ? tone(s.colors[0], -0.16) : s.colors[1];
  c.fillStyle = alt; for (let k = 1; k < 9; k += 2) { const x = cx - r + (k * 2 * r) / 9; c.beginPath(); c.moveTo(x, cy - r); c.quadraticCurveTo(x + (x - cx) * 0.4, cy, x, cy + r);
    const x2 = x + (2 * r) / 9; c.lineTo(x2, cy + r); c.quadraticCurveTo(x2 + (x2 - cx) * 0.4, cy, x2, cy - r); c.fill(); }
  if (s.pattern !== 'rayas') for (let k = 0; k < 9; k++) pattern(c, s, rng, cx - r + (k * 2 * r) / 9, cy - r, cx - r + ((k + 1) * 2 * r) / 9, cy + r, k);
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
