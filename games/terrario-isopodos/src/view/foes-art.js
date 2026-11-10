// Fauna del nido dibujada en código, con el trazo del juego: contorno grueso de tinta, colores planos con una
// sombra abajo y un brillo arriba, y ojos grandes con su reflejo (lo tierno-inquietante de Cult of the Lamb).
// Son lo que de verdad amenaza a un terrario: ácaros, ciempiés, arañas, mosquitos del hongo y moho.
import { PALETTES } from '../data/palettes.js';

const INK = PALETTES.cozy.ink, PAPER = PALETTES.cozy.paper;

function blob(c, x, y, rx, ry, fill, rot = 0) {
  c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  c.fillStyle = fill; c.fill();
  c.save(); c.clip();
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(x + rx * 0.15, y + ry * 0.55, rx * 1.1, ry * 0.6, rot, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.ellipse(x - rx * 0.3, y - ry * 0.45, rx * 0.35, ry * 0.2, rot - 0.4, 0, 7); c.fill();
  c.restore();
  c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); c.lineWidth = 5; c.strokeStyle = INK; c.stroke();
}
function eye(c, x, y, r, iris = INK) {
  c.beginPath(); c.arc(x, y, r, 0, 7); c.fillStyle = PAPER; c.fill(); c.lineWidth = 3; c.stroke();
  c.beginPath(); c.arc(x + r * 0.15, y + r * 0.1, r * 0.55, 0, 7); c.fillStyle = iris; c.fill();
  c.beginPath(); c.arc(x - r * 0.1, y - r * 0.2, r * 0.18, 0, 7); c.fillStyle = PAPER; c.fill();
}
function leg(c, pts, w = 4) {
  c.beginPath(); c.moveTo(...pts[0]); for (const p of pts.slice(1)) c.lineTo(...p);
  c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = INK; c.stroke();
}

// Ácaro rojo: bolita roja con ocho patitas cortas y dos ojos saltones. Vienen en grupo.
function acaro(c, w, h) {
  const cx = w * 0.5, cy = h * 0.58;
  for (let k = 0; k < 4; k++) { const x = cx - 34 + k * 22; leg(c, [[x, cy + 10], [x - 10, cy + 30], [x - 14, cy + 40]]); leg(c, [[x + 4, cy + 10], [x + 14, cy + 32]]); }
  blob(c, cx, cy, 46, 34, '#c2412f');
  for (const [x, y] of [[-18, -6], [6, 8], [20, -10], [-4, -18]]) { c.beginPath(); c.arc(cx + x, cy + y, 3.5, 0, 7); c.fillStyle = '#7a1f16'; c.fill(); }
  eye(c, cx + 22, cy - 26, 9); eye(c, cx + 40, cy - 20, 8);
}

// Ciempiés: cuerpo largo de segmentos, muchas patas, antenas y las pinzas venenosas delante.
function cienpies(c, w, h) {
  const n = 9, y0 = h * 0.6;
  for (let k = n - 1; k >= 0; k--) {
    const x = w * 0.1 + k * (w * 0.08), y = y0 + Math.sin(k * 0.8) * 8;
    leg(c, [[x, y + 6], [x - 6, y + 26], [x - 12, y + 30]], 3); leg(c, [[x + 4, y + 6], [x + 10, y + 26]], 3);
    blob(c, x, y, 22, 17, k % 2 ? '#a0612e' : '#8a4e22');
  }
  const hx = w * 0.1 + n * w * 0.08, hy = y0 - 4;
  leg(c, [[hx + 6, hy - 10], [hx + 30, hy - 40], [hx + 46, hy - 44]], 3); leg(c, [[hx + 10, hy - 4], [hx + 40, hy - 24]], 3);
  blob(c, hx, hy, 24, 19, '#6e3a1a');
  leg(c, [[hx + 18, hy + 10], [hx + 30, hy + 16], [hx + 24, hy + 24]], 5);
  eye(c, hx + 8, hy - 6, 7, '#c2412f');
}

// Araña de saco: abdomen peludo violeta, cabeza con racimo de ojos y ocho patas largas articuladas.
function arana(c, w, h) {
  const cx = w * 0.45, cy = h * 0.5;
  for (let k = 0; k < 4; k++) {
    const a = -0.9 + k * 0.6;
    leg(c, [[cx + 30, cy + 6], [cx + 30 + Math.cos(a) * 60, cy - 40 + k * 22], [cx + 30 + Math.cos(a) * 90, cy + 70]], 5);
    leg(c, [[cx, cy + 6], [cx - Math.cos(a) * 50, cy - 36 + k * 22], [cx - Math.cos(a) * 80, cy + 70]], 5);
  }
  blob(c, cx - 20, cy, 54, 46, '#7a4aa8');
  c.strokeStyle = INK; c.lineWidth = 2.5;
  for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; c.beginPath(); c.moveTo(cx - 20 + Math.cos(a) * 52, cy + Math.sin(a) * 44); c.lineTo(cx - 20 + Math.cos(a) * 60, cy + Math.sin(a) * 52); c.stroke(); }
  blob(c, cx + 40, cy + 6, 30, 26, '#5d3484');
  eye(c, cx + 44, cy - 2, 9, '#c2412f'); eye(c, cx + 60, cy + 6, 7, '#c2412f'); eye(c, cx + 34, cy + 12, 5); eye(c, cx + 52, cy + 18, 5);
}

// Mosquito del hongo: cuerpo negro fino, alas de vidrio y patas colgando. Zumba y vacía la carga.
function mosca(c, w, h) {
  const cx = w * 0.5, cy = h * 0.42;
  c.globalAlpha = 0.55;
  for (const s of [-1, 1]) { c.beginPath(); c.ellipse(cx + s * 34, cy - 30, 40, 16, s * 0.5, 0, 7); c.fillStyle = '#cfe0e6'; c.fill(); c.lineWidth = 3; c.strokeStyle = INK; c.stroke(); }
  c.globalAlpha = 1;
  for (let k = 0; k < 3; k++) leg(c, [[cx - 10 + k * 10, cy + 12], [cx - 18 + k * 12, cy + 50], [cx - 22 + k * 14, cy + 72]], 3);
  blob(c, cx - 14, cy + 4, 34, 15, '#2a2630', 0.15);
  blob(c, cx + 22, cy - 4, 15, 14, '#3a3440');
  eye(c, cx + 28, cy - 8, 8, '#c2412f');
}

// Moho andante: masa blanda verdosa con esporas en la superficie; se arrastra y suelta nubes.
function moho(c, w, h) {
  const cx = w * 0.5, cy = h * 0.6;
  blob(c, cx, cy, 78, 48, '#8fa46a');
  for (const [x, y, r] of [[-40, -30, 18], [-6, -40, 22], [32, -32, 18], [54, -10, 14], [-58, -4, 14]]) blob(c, cx + x, cy + y, r, r * 0.85, '#b7c48a');
  c.fillStyle = PAPER;
  for (let k = 0; k < 14; k++) { c.beginPath(); c.arc(cx - 60 + ((k * 37) % 120), cy - 30 + ((k * 23) % 40), 2.5, 0, 7); c.fill(); }
  eye(c, cx - 14, cy + 4, 11); eye(c, cx + 16, cy + 6, 9);
  c.beginPath(); c.arc(cx + 2, cy + 24, 10, 0.2, Math.PI - 0.2); c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
}

export const FOE_SPRITES = {
  acaro: { w: 160, h: 130, draw: acaro },
  cienpies: { w: 300, h: 150, draw: cienpies },
  arana: { w: 260, h: 200, draw: arana },
  mosca: { w: 200, h: 200, draw: mosca },
  moho: { w: 240, h: 170, draw: moho },
};
