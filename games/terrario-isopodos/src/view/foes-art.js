// Fauna del nido dibujada en código como una lámina de naturalista (mismo trazo que los isópodos): contorno
// fino de tinta, volumen con luz arriba a la izquierda, segmentos y patas articuladas, rayado en la sombra y
// ojos de bicho (cuentas negras con brillo), no de caricatura. Lo que de verdad amenaza a un terrario.
import { PALETTES } from '../data/palettes.js';

const INK = PALETTES.cozy.ink;
const LINE = 2.4;

// Elipse con volumen: degradado de luz, sombra baja, rayado y contorno.
function shell(c, x, y, rx, ry, [hi, mid, lo], rot = 0, hatch = true) {
  c.save();
  c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  const g = c.createRadialGradient(x - rx * 0.35, y - ry * 0.45, Math.min(rx, ry) * 0.1, x, y, Math.max(rx, ry) * 1.1);
  g.addColorStop(0, hi); g.addColorStop(0.55, mid); g.addColorStop(1, lo);
  c.fillStyle = g; c.fill(); c.clip();
  if (hatch) {
    c.strokeStyle = 'rgba(29,26,22,0.32)'; c.lineWidth = 1;
    for (let k = -6; k <= 6; k++) { const hx = x + k * rx * 0.16; c.beginPath(); c.moveTo(hx, y + ry * 0.2); c.lineTo(hx - ry * 0.5, y + ry * 1.1); c.stroke(); }
  }
  c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 2;
  c.beginPath(); c.ellipse(x - rx * 0.05, y - ry * 0.05, rx * 0.78, ry * 0.7, rot, Math.PI * 1.12, Math.PI * 1.5); c.stroke();
  c.restore();
  c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); c.lineWidth = LINE; c.strokeStyle = INK; c.stroke();
}

// Pata articulada que se afina: tramos con nudo en cada articulación.
function leg(c, pts, w0 = 4, col = '#3a2f28') {
  for (let i = 0; i < pts.length - 1; i++) {
    const wd = w0 * (1 - i / pts.length * 0.6);
    c.beginPath(); c.moveTo(...pts[i]); c.lineTo(...pts[i + 1]); c.lineCap = 'round';
    c.strokeStyle = INK; c.lineWidth = wd + 2; c.stroke();
    c.strokeStyle = col; c.lineWidth = wd; c.stroke();
    if (i < pts.length - 2) { c.beginPath(); c.arc(...pts[i + 1], wd * 0.55, 0, 7); c.fillStyle = INK; c.fill(); }
  }
}

// Ojo de artrópodo: cuenta negra brillante.
function bead(c, x, y, r) {
  c.beginPath(); c.arc(x, y, r, 0, 7); c.fillStyle = '#0d0c0b'; c.fill();
  c.beginPath(); c.arc(x - r * 0.35, y - r * 0.35, r * 0.32, 0, 7); c.fillStyle = 'rgba(255,255,255,0.85)'; c.fill();
}

function antenna(c, x, y, segs, dx, dy, w = 2.2) {
  let px = x, py = y;
  for (let k = 0; k < segs; k++) {
    const nx = px + dx * (1 - k * 0.04), ny = py + dy + k * 1.2;
    c.beginPath(); c.moveTo(px, py); c.lineTo(nx, ny); c.strokeStyle = INK; c.lineWidth = w; c.lineCap = 'round'; c.stroke();
    c.beginPath(); c.arc(nx, ny, w * 0.7, 0, 7); c.fillStyle = INK; c.fill();
    px = nx; py = ny;
  }
}

// Larva de tinta: gusano segmentado pálido con venas de tinta y cápsula cefálica oscura con mandíbulas.
function larva(c, w, h) {
  const n = 7, y0 = h * 0.62;
  for (let k = 0; k < n; k++) {
    const x = w * 0.12 + k * w * 0.1, y = y0 - Math.sin(k * 0.7) * 8, r = h * (0.13 + Math.sin((k / (n - 1)) * Math.PI) * 0.07);
    shell(c, x, y, r * 0.95, r, ['#e7e2d6', '#b9b2a2', '#6f6a60'], 0, false);
    c.save(); c.beginPath(); c.ellipse(x, y, r * 0.95, r, 0, 0, 7); c.clip();
    c.strokeStyle = 'rgba(29,26,22,0.55)'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(x - r * 0.6, y - r * 0.2); c.quadraticCurveTo(x, y + r * 0.3, x + r * 0.7, y - r * 0.1); c.stroke();
    c.restore();
    if (k % 2 === 0) { leg(c, [[x, y + r * 0.85], [x + 3, y + r + 8]], 2.4, '#8a8478'); }
  }
  const hx = w * 0.12 + n * w * 0.1, hy = y0 - 14;
  shell(c, hx, hy, h * 0.12, h * 0.11, ['#5a4a3a', '#2c241c', '#0d0c0b'], 0, false);
  c.fillStyle = '#c9b07a'; c.strokeStyle = INK; c.lineWidth = 1.6;
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(hx + 8, hy + s * 4); c.quadraticCurveTo(hx + 26, hy + s * 6, hx + 22, hy + s * 14); c.quadraticCurveTo(hx + 18, hy + s * 8, hx + 8, hy + s * 9); c.closePath(); c.fill(); c.stroke(); }
  bead(c, hx + 2, hy - 8, 2.6);
}

// Ácaro rojo de terciopelo: cuerpo blando y aterciopelado, ocho patas cortas articuladas, palpos delante.
function acaro(c, w, h) {
  const cx = w * 0.48, cy = h * 0.56;
  for (let k = 0; k < 4; k++) { // cuatro pares en abanico (los de atrás, más oscuros)
    const a = Math.PI * (0.18 + k * 0.21), dx = -Math.cos(a), x0 = cx + dx * 20;
    leg(c, [[x0, cy + 6], [x0 + dx * 30, cy + 22], [x0 + dx * 40, cy + 46]], 3.4, '#8a2416');
    leg(c, [[x0 + 4, cy - 6], [x0 + dx * 34 + 4, cy - 28], [x0 + dx * 52 + 4, cy - 20]], 2.6, '#5e140b');
  }
  shell(c, cx, cy, 44, 32, ['#ef6a4a', '#b8321f', '#5e140b']);
  c.fillStyle = 'rgba(255,190,170,0.55)';
  for (let k = 0; k < 70; k++) { const a = k * 2.399, r = Math.sqrt(k / 70); c.fillRect(cx + Math.cos(a) * r * 38, cy + Math.sin(a) * r * 26, 1.6, 1.6); }
  shell(c, cx + 46, cy - 6, 12, 10, ['#d2533a', '#8a2416', '#4a0f08'], 0, false);
  leg(c, [[cx + 54, cy - 2], [cx + 64, cy + 4], [cx + 68, cy + 12]], 2.6, '#8a2416');
  bead(c, cx + 40, cy - 14, 3); bead(c, cx + 48, cy - 15, 2.6);
}

// Ciempiés: tergitos brillantes de color ámbar oscuro, un par de patas largas por segmento, antenas largas
// y las forcípulas (pinzas de veneno) curvas delante.
function cienpies(c, w, h) {
  const n = 11, y0 = h * 0.56, seg = w * 0.068;
  const P = (k) => [w * 0.08 + k * seg, y0 + Math.sin(k * 0.75) * 9];
  for (let k = 0; k < n; k++) { const [x, y] = P(k); leg(c, [[x, y + 8], [x - 8, y + 26], [x - 18, y + 38]], 2.6, '#b07a3a'); leg(c, [[x + 2, y - 4], [x - 6, y - 22], [x - 16, y - 30]], 2, '#8a5a2a'); }
  for (let k = 0; k < n; k++) {
    const [x, y] = P(k);
    shell(c, x, y, seg * 0.72, 14, k % 2 ? ['#c98a4a', '#8a4e22', '#3a1e0c'] : ['#b87a3e', '#7a4420', '#331a0a']);
    c.beginPath(); c.moveTo(x - seg * 0.2, y - 12); c.lineTo(x - seg * 0.2, y + 12); c.strokeStyle = 'rgba(29,26,22,0.4)'; c.lineWidth = 1; c.stroke();
  }
  const [hx, hy] = P(n);
  antenna(c, hx + 6, hy - 10, 9, 6, -4.2); antenna(c, hx + 10, hy - 6, 9, 7, -2.6);
  shell(c, hx, hy - 2, 16, 13, ['#a65a2a', '#5e2e12', '#1e0c04']);
  c.fillStyle = '#2a140a'; c.strokeStyle = INK; c.lineWidth = 1.6;
  for (const s of [-1, 1]) { c.beginPath(); c.moveTo(hx + 10, hy + 2 + s * 3); c.quadraticCurveTo(hx + 30, hy + 6 + s * 8, hx + 24, hy + 14 + s * 6); c.lineTo(hx + 20, hy + 8 + s * 4); c.closePath(); c.fill(); c.stroke(); }
  bead(c, hx + 6, hy - 6, 2.4);
}

// Araña de saco: prosoma pardo, abdomen alargado y velloso, ocho patas con fémur, tibia y tarso oscuro,
// quelíceros negros y la fila de ojos.
function arana(c, w, h) {
  const cx = w * 0.42, cy = h * 0.5, px = cx + 58, py = cy - 2;
  // patas en abanico desde el prosoma: rodilla arriba y afuera, tarso apoyado; las del otro lado, detrás y más oscuras
  for (const back of [true, false]) for (const dx of [-1.25, -0.5, 0.45, 1.2]) {
    const k = back ? 0.8 : 1, ox = back ? 10 : 0, knee = [px + ox + dx * 42 * k, py - 46 * k + Math.abs(dx) * 8], tip = [px + ox + dx * 86 * k, py + 62];
    leg(c, [[px + ox + dx * 8, py + 6], knee, [(knee[0] + tip[0]) / 2 + dx * 6, py + 18], tip], back ? 3 : 4, back ? '#4e3d2c' : '#7a6046');
  }
  shell(c, cx, cy + 4, 62, 40, ['#e2cfa6', '#a88a5e', '#4e3b26']);
  c.strokeStyle = 'rgba(29,26,22,0.55)'; c.lineWidth = 1;
  for (let k = 0; k < 60; k++) { const a = (k / 60) * Math.PI * 2, r1 = 0.96 + (k % 3) * 0.02; c.beginPath(); c.moveTo(cx + Math.cos(a) * 62 * r1, cy + 4 + Math.sin(a) * 40 * r1); c.lineTo(cx + Math.cos(a) * 68, cy + 4 + Math.sin(a) * 45); c.stroke(); }
  c.strokeStyle = 'rgba(78,59,38,0.6)'; c.lineWidth = 2;
  for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(cx - 40 + k * 18, cy - 14); c.quadraticCurveTo(cx - 34 + k * 18, cy + 4, cx - 40 + k * 18, cy + 22); c.stroke(); }
  shell(c, px, py, 30, 24, ['#b48a58', '#7a5634', '#2e1e10']);
  c.fillStyle = '#120d09'; c.strokeStyle = INK; c.lineWidth = 1.5;
  for (const s of [-1, 1]) { c.beginPath(); c.ellipse(px + 30, py + 10 + s * 7, 9, 6, s * 0.3, 0, 7); c.fill(); c.stroke(); }
  for (const [x, y, r] of [[18, -12, 3.6], [24, -8, 3.2], [12, -14, 2.6], [26, -2, 2.6], [8, -10, 2.2], [20, -2, 2.2]]) bead(c, px + x, py + y, r);
}

// Mosquito del hongo (sciárido): tórax jorobado negro, abdomen segmentado, alas con venas, patas larguísimas
// y antenas de muchos artejos.
function mosca(c, w, h) {
  const cx = w * 0.46, cy = h * 0.46;
  c.save(); c.globalAlpha = 0.6;
  for (const [rot, dx] of [[-0.55, -6], [-0.25, 4]]) {
    c.beginPath(); c.ellipse(cx - 20 + dx, cy - 36, 52, 15, rot, 0, 7); c.fillStyle = '#dfe9ec'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
    c.lineWidth = 0.9; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(cx + 4 + dx, cy - 18); c.quadraticCurveTo(cx - 20 + dx, cy - 36 - k * 6, cx - 60 + dx + k * 10, cy - 54 + k * 6); c.stroke(); }
  }
  c.restore();
  for (let k = 0; k < 3; k++) leg(c, [[cx - 4 + k * 10, cy + 12], [cx - 20 + k * 16, cy + 48], [cx - 28 + k * 20, cy + 82], [cx - 36 + k * 24, cy + 96]], 1.8, '#3a3440');
  for (let k = 0; k < 6; k++) shell(c, cx - 22 - k * 11, cy + 6 + k * 3, 9, 8 - k * 0.6, ['#5a5262', '#2a2630', '#0d0c0b'], 0, false);
  shell(c, cx, cy, 20, 17, ['#6a6272', '#2e2934', '#0d0c0b']);
  shell(c, cx + 22, cy + 2, 10, 9, ['#4a4452', '#1e1a22', '#0d0c0b'], 0, false);
  antenna(c, cx + 26, cy - 4, 12, 3.4, -3, 1.4);
  bead(c, cx + 25, cy + 1, 4.2);
}

// Moho andante (plasmodio): masa amarilla que se arrastra con red de venas, cuerpos fructíferos en tallo y
// poros oscuros que parecen mirar.
function moho(c, w, h) {
  const cx = w * 0.5, cy = h * 0.66;
  const outline = () => { c.beginPath();
    for (let k = 0; k <= 32; k++) { const a = (k / 32) * Math.PI * 2, r = 1 + Math.sin(a * 5) * 0.08 + Math.sin(a * 3 + 1) * 0.06; c.lineTo(cx + Math.cos(a) * 92 * r, cy + Math.sin(a) * 34 * r); }
    c.closePath(); };
  outline();
  const g = c.createRadialGradient(cx - 30, cy - 20, 6, cx, cy, 100); g.addColorStop(0, '#f1e4a2'); g.addColorStop(0.6, '#c9b65e'); g.addColorStop(1, '#6e6226');
  c.fillStyle = g; c.fill(); c.save(); c.clip();
  c.strokeStyle = 'rgba(110,90,30,0.75)'; c.lineWidth = 1.4;
  for (let k = 0; k < 9; k++) { c.beginPath(); c.moveTo(cx, cy); const a = k * 0.7; c.quadraticCurveTo(cx + Math.cos(a) * 40, cy + Math.sin(a) * 30 - 10, cx + Math.cos(a + 0.3) * 90, cy + Math.sin(a + 0.3) * 40); c.stroke(); }
  c.restore();
  outline(); c.lineWidth = LINE; c.strokeStyle = INK; c.stroke();
  for (const [x, hgt, r] of [[-50, 46, 9], [-18, 64, 11], [16, 52, 8], [46, 40, 7]]) {
    c.beginPath(); c.moveTo(cx + x, cy - 20); c.quadraticCurveTo(cx + x - 4, cy - 20 - hgt * 0.5, cx + x + 2, cy - 20 - hgt); c.strokeStyle = INK; c.lineWidth = 2.6; c.stroke();
    shell(c, cx + x + 2, cy - 20 - hgt - r * 0.6, r, r * 1.2, ['#8a7a9a', '#4a3a5a', '#1a1222'], 0, false);
  }
  for (const [x, y, r] of [[-26, 4, 5], [10, 10, 6], [40, 0, 4]]) { c.beginPath(); c.arc(cx + x, cy + y, r + 2, 0, 7); c.fillStyle = '#5e5420'; c.fill(); bead(c, cx + x, cy + y, r); }
}

export const FOE_SPRITES = {
  larva: { w: 256, h: 160, draw: larva },
  acaro: { w: 180, h: 140, draw: acaro },
  cienpies: { w: 320, h: 160, draw: cienpies },
  arana: { w: 300, h: 220, draw: arana },
  mosca: { w: 220, h: 200, draw: mosca },
  moho: { w: 240, h: 190, draw: moho },
};
