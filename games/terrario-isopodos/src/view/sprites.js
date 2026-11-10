// Sprites a tinta: los dibujos escaneados (assets/sprites) y los que se dibujan en código con el mismo
// trazo (isópodos, larvas, iconos de recursos). Cada función dibuja en un lienzo de w × h mirando a la
// derecha; el resto del juego los pide por clave y los recibe como textura cacheada.
import * as THREE from 'three';
import { PALETTES, SHELL_COLORS } from '../data/palettes.js';

const INK = PALETTES.cozy.ink;

function stipple(ctx, x, y, w, h, density, clip) {
  ctx.save();
  if (clip) { clip(); ctx.clip(); }
  ctx.fillStyle = INK;
  for (let k = 0; k < w * h * density; k++) {
    const px = x + Math.random() * w, py = y + Math.random() * h;
    ctx.fillRect(px, py, 1.6, 1.6);
  }
  ctx.restore();
}

function isopod(ctx, w, h, shell = 'pizarra') {
  const cx = w * 0.5, base = h * 0.82, rx = w * 0.38, ry = h * 0.52;
  ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.lineCap = 'round';
  for (let k = 0; k < 6; k++) { // patitas
    const x = cx - rx * 0.7 + k * rx * 0.28;
    ctx.beginPath(); ctx.moveTo(x, base - 4); ctx.lineTo(x + 6, base + 10); ctx.stroke();
  }
  const dome = () => { ctx.beginPath(); ctx.ellipse(cx, base, rx, ry, 0, Math.PI, 0); ctx.closePath(); };
  dome(); ctx.fillStyle = SHELL_COLORS[shell]; ctx.fill();
  stipple(ctx, cx - rx, base - ry, rx * 2, ry * 0.9, 0.01, dome);
  stipple(ctx, cx - rx, base - ry * 0.35, rx * 2, ry * 0.35, 0.05, dome);
  ctx.lineWidth = 3;
  for (let k = 1; k < 7; k++) { // segmentos
    const a = Math.PI + (k / 7) * Math.PI;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * rx * 0.25, base); ctx.lineTo(cx + Math.cos(a) * rx, base + Math.sin(a) * ry); ctx.stroke();
  }
  ctx.lineWidth = 5; dome(); ctx.stroke();
  const hx = cx + rx * 0.92, hy = base - ry * 0.18; // cabeza y antenas
  ctx.beginPath(); ctx.ellipse(hx, hy, rx * 0.2, ry * 0.26, 0, 0, Math.PI * 2);
  ctx.fillStyle = SHELL_COLORS[shell]; ctx.fill(); ctx.lineWidth = 4; ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(hx + 4, hy - 10); ctx.quadraticCurveTo(hx + 26, hy - 40, hx + 40, hy - 30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(hx + 8, hy - 4); ctx.quadraticCurveTo(hx + 34, hy - 18, hx + 44, hy - 4); ctx.stroke();
  ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(hx + 6, hy - 2, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PALETTES.cozy.paper; ctx.beginPath(); ctx.arc(hx + 8, hy - 5, 2.6, 0, Math.PI * 2); ctx.fill();
}

function larva(ctx, w, h) {
  ctx.strokeStyle = INK; ctx.lineWidth = 4;
  const segs = 5;
  for (let k = segs - 1; k >= 0; k--) {
    const x = w * 0.22 + k * w * 0.13, y = h * 0.62 - Math.sin(k * 0.9) * 8, r = h * (0.18 + k * 0.025);
    const blob = () => { ctx.beginPath(); ctx.ellipse(x, y, r * 1.1, r, 0, 0, Math.PI * 2); };
    blob(); ctx.fillStyle = PALETTES.terror.shade; ctx.fill();
    stipple(ctx, x - r * 1.1, y - r, r * 2.2, r * 2, 0.06, blob);
    blob(); ctx.stroke();
  }
  const mx = w * 0.82, my = h * 0.5; // boca con dientes
  ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(mx, my, 12, 16, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PALETTES.cozy.paper;
  for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(mx - 6, my - 12 + k * 7); ctx.lineTo(mx + 2, my - 9 + k * 7); ctx.lineTo(mx - 6, my - 6 + k * 7); ctx.fill(); }
}

const RES = {
  hojarasca: (ctx, w, h) => {
    ctx.beginPath(); ctx.moveTo(w * 0.15, h * 0.85); ctx.quadraticCurveTo(w * 0.1, h * 0.2, w * 0.85, h * 0.15);
    ctx.quadraticCurveTo(w * 0.8, h * 0.8, w * 0.15, h * 0.85); ctx.fillStyle = PALETTES.cozy.amber; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w * 0.15, h * 0.85); ctx.lineTo(w * 0.7, h * 0.3); ctx.stroke();
  },
  musgo: (ctx, w, h) => {
    for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(w * (0.25 + k * 0.12), h * (0.6 - (k % 2) * 0.12), w * 0.17, 0, Math.PI * 2); ctx.fillStyle = PALETTES.cozy.moss; ctx.fill(); ctx.stroke(); }
  },
  esporas: (ctx, w, h) => {
    ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.45, w * 0.32, h * 0.2, 0, Math.PI, 0); ctx.fillStyle = PALETTES.cozy.rust; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.rect(w * 0.42, h * 0.45, w * 0.16, h * 0.35); ctx.fillStyle = PALETTES.cozy.paper; ctx.fill(); ctx.stroke();
  },
  cal: (ctx, w, h) => {
    ctx.beginPath(); ctx.moveTo(w * 0.2, h * 0.75); ctx.lineTo(w * 0.35, h * 0.3); ctx.lineTo(w * 0.7, h * 0.22); ctx.lineTo(w * 0.82, h * 0.7); ctx.closePath();
    ctx.fillStyle = PALETTES.cozy.paper; ctx.fill(); ctx.stroke();
  },
  ambar: (ctx, w, h) => {
    ctx.beginPath(); ctx.moveTo(w * 0.5, h * 0.12); ctx.quadraticCurveTo(w * 0.85, h * 0.6, w * 0.5, h * 0.85); ctx.quadraticCurveTo(w * 0.15, h * 0.6, w * 0.5, h * 0.12);
    ctx.fillStyle = PALETTES.cozy.amber; ctx.fill(); ctx.stroke();
  },
};

export const PROC_SPRITES = { larva: { w: 256, h: 160, draw: larva } };
const SIZES = { iso: [256, 160], res: [128, 128] };

const cache = new Map();
export const spriteURL = (file) => new URL(`../../assets/sprites/${file}`, import.meta.url).href;
const loader = new THREE.TextureLoader();

// Claves: 'iso:<caparazón>', 'res:<recurso>', 'proc:<id>' o un archivo de assets/sprites/.
export function spriteTexture(key) {
  if (cache.has(key)) return cache.get(key);
  let tex;
  const [kind, arg] = key.split(':');
  if (kind === 'iso' || kind === 'res' || kind === 'proc') {
    const [w, h] = kind === 'proc' ? [PROC_SPRITES[arg].w, PROC_SPRITES[arg].h] : SIZES[kind];
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.lineJoin = 'round';
    if (kind === 'iso') isopod(ctx, w, h, arg);
    else if (kind === 'res') RES[arg](ctx, w, h);
    else PROC_SPRITES[arg].draw(ctx, w, h);
    tex = new THREE.CanvasTexture(canvas);
    tex.userData.aspect = w / h;
  } else {
    tex = loader.load(spriteURL(key), (t) => { t.userData.aspect = t.image.width / t.image.height; });
    tex.userData.aspect = 1;
  }
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  cache.set(key, tex);
  return tex;
}

// Icono de recurso como imagen para la interfaz (mismo dibujo que en el mundo).
export function resourceIconURL(res) {
  const key = `icon:${res}`;
  if (!cache.has(key)) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.lineJoin = 'round';
    RES[res](ctx, 64, 64);
    cache.set(key, canvas.toDataURL());
  }
  return cache.get(key);
}
