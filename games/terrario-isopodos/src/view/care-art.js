// Señales del terrario que se leen sin texto: manchas de moho, grietas de sequedad, gotas de condensación y
// los globos que flotan sobre las piezas (mejorable, comedero vacío).
import { PALETTES } from '../data/palettes.js';

const INK = PALETTES.cozy.ink, PAPER = PALETTES.cozy.paper, AMBER = PALETTES.cozy.amber, RUST = PALETTES.cozy.rust;

// Moho: pelusa blanca verdosa de bordes deshilachados.
function mold(c, w, h) {
  for (let k = 0; k < 40; k++) {
    const a = (k / 40) * Math.PI * 2, r = w * (0.28 + ((k * 37) % 11) / 60);
    c.beginPath(); c.arc(w / 2 + Math.cos(a) * r * 0.7, h / 2 + Math.sin(a) * r * 0.7, w * 0.12, 0, 7);
    c.fillStyle = k % 3 ? 'rgba(232,240,220,0.85)' : 'rgba(190,210,170,0.9)'; c.fill();
  }
  c.strokeStyle = 'rgba(120,140,100,0.7)'; c.lineWidth = 2;
  for (let k = 0; k < 18; k++) { const a = k * 0.35; c.beginPath(); c.moveTo(w / 2, h / 2); c.lineTo(w / 2 + Math.cos(a) * w * 0.48, h / 2 + Math.sin(a) * h * 0.48); c.stroke(); }
}

// Sequedad: grietas oscuras que se ramifican sobre la tierra.
function crack(c, w, h) {
  c.strokeStyle = 'rgba(40,25,15,0.75)'; c.lineCap = 'round';
  const branch = (x, y, a, len, wd) => {
    if (len < 6) return;
    const nx = x + Math.cos(a) * len, ny = y + Math.sin(a) * len;
    c.lineWidth = wd; c.beginPath(); c.moveTo(x, y); c.lineTo(nx, ny); c.stroke();
    branch(nx, ny, a + 0.5, len * 0.6, wd * 0.7); branch(nx, ny, a - 0.6, len * 0.55, wd * 0.7);
  };
  for (const a of [0.3, 2.2, 4.1]) branch(w / 2, h / 2, a, w * 0.22, 5);
}

// Globo con icono: flecha de mejora (ámbar) o comedero vacío.
// Globo con icono, en la misma ficha que los recursos listos: disco de papel con filo fino de color y un
// piquito hacia la pieza. Flecha de mejora (ámbar) o comedero vacío (óxido).
function bubble(c, w, h, draw, rim) {
  c.fillStyle = PAPER; c.strokeStyle = rim; c.lineWidth = 5; c.lineJoin = 'round';
  c.beginPath(); c.arc(w / 2, h * 0.42, w * 0.4, 0, 7); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(w * 0.42, h * 0.8); c.lineTo(w / 2, h * 0.95); c.lineTo(w * 0.58, h * 0.8); c.fillStyle = rim; c.fill();
  draw();
}
function up(c, w, h) {
  bubble(c, w, h, () => {
    c.strokeStyle = AMBER; c.lineWidth = 9; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(w / 2, h * 0.6); c.lineTo(w / 2, h * 0.26); c.moveTo(w * 0.35, h * 0.4); c.lineTo(w / 2, h * 0.25); c.lineTo(w * 0.65, h * 0.4); c.stroke();
  }, AMBER);
}
function hungry(c, w, h) {
  bubble(c, w, h, () => {
    c.strokeStyle = INK; c.lineWidth = 4.5;
    c.beginPath(); c.ellipse(w / 2, h * 0.45, w * 0.22, h * 0.09, 0, 0, Math.PI); c.closePath(); c.stroke(); // cuenco vacío
    c.strokeStyle = RUST; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(w * 0.3, h * 0.22); c.lineTo(w * 0.7, h * 0.62); c.stroke();
  }, RUST);
}

export const CARE_SPRITES = {
  mold: { w: 128, h: 128, draw: mold },
  crack: { w: 128, h: 128, draw: crack },
  up: { w: 96, h: 112, draw: up },
  hungry: { w: 96, h: 112, draw: hungry },
};
