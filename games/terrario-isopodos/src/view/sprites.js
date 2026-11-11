// Sprites a tinta: los dibujos escaneados (assets/sprites) y los que se dibujan en código con el mismo
// trazo (isópodos, larvas, iconos de recursos). Cada función dibuja en un lienzo de w × h mirando a la
// derecha; el resto del juego los pide por clave y los recibe como textura cacheada.
import * as THREE from 'three';
import { PALETTES, BADGES } from '../data/palettes.js';
import { drawIsopod, drawBall, drawMolt } from './isopod-art.js';
import { FOE_SPRITES } from './foes-art.js';
import { drawIsopod3D, drawBall3D, drawFoe3D } from './models3d.js';
import { CARE_SPRITES } from './care-art.js';

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

const RES_COLOR = { hojarasca: PALETTES.cozy.amber, musgo: PALETTES.cozy.moss, esporas: PALETTES.cozy.rust, cal: PALETTES.cozy.stone, ambar: PALETTES.cozy.amber };
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

// Bocadillo de aviso (isópodo perdido, algo para recoger).
function alert(ctx, w, h) {
  ctx.fillStyle = PALETTES.cozy.paper; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(w / 2, h * 0.42, w * 0.36, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(w * 0.42, h * 0.72); ctx.lineTo(w / 2, h * 0.95); ctx.lineTo(w * 0.58, h * 0.72); ctx.fill(); ctx.stroke();
  ctx.fillStyle = INK; ctx.font = `bold ${h * 0.5}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('!', w / 2, h * 0.44);
}

// Flecha sobre el isópodo seleccionado y «zzz» del que duerme.
function sel(ctx, w, h) {
  ctx.fillStyle = PALETTES.cozy.amber; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(w * 0.15, h * 0.2); ctx.lineTo(w * 0.85, h * 0.2); ctx.lineTo(w / 2, h * 0.85); ctx.closePath(); ctx.fill(); ctx.stroke();
}
function zzz(ctx, w, h) {
  ctx.fillStyle = PALETTES.cozy.paper; ctx.lineWidth = 7; ctx.font = `bold ${h * 0.42}px serif`; ctx.textAlign = 'center';
  [[0.3, 0.85, 1], [0.55, 0.55, 0.8], [0.78, 0.3, 0.6]].forEach(([x, y, k]) => { ctx.font = `bold ${h * 0.42 * k}px serif`; ctx.strokeText('z', w * x, h * y); ctx.fillText('z', w * x, h * y); });
}
// Banderín del distintivo (color de BADGES).
function badge(ctx, w, h, k) {
  ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(w * 0.22, h * 0.95); ctx.lineTo(w * 0.22, h * 0.06); ctx.stroke();
  ctx.fillStyle = BADGES[k] ?? BADGES[0]; ctx.beginPath(); ctx.moveTo(w * 0.24, h * 0.08); ctx.lineTo(w * 0.9, h * 0.26); ctx.lineTo(w * 0.24, h * 0.46); ctx.closePath(); ctx.fill(); ctx.stroke();
}

// Modelos 3D (models3d.js) fotografiados; el dibujo a mano queda de respaldo si no hay WebGL.
const safe = (fn3d, fn2d) => (c, w, h, a) => { try { fn3d(c, w, h, a); } catch { fn2d(c, w, h, a); } };
const ISO = { iso: safe(drawIsopod3D, drawIsopod), molt: safe((c, w, h, a) => drawIsopod3D(c, w, h, a, { molt: true }), (c, w, h, a) => drawIsopod(c, w, h, a, { molt: true })), ball: safe(drawBall3D, drawBall) };
const FOES3D = Object.fromEntries(Object.entries(FOE_SPRITES).map(([k, f]) => [k, { ...f, draw: safe(drawFoe3D(k), f.draw) }]));
export const PROC_SPRITES = { larva: { w: 256, h: 160, draw: larva }, alert: { w: 96, h: 112, draw: alert }, muda: { w: 128, h: 80, draw: drawMolt },
  sel: { w: 64, h: 64, draw: sel }, zzz: { w: 96, h: 96, draw: zzz }, ...FOES3D, ...CARE_SPRITES };
const SIZES = { iso: [256, 160], molt: [256, 160], ball: [160, 160], res: [128, 128], badge: [64, 96] };

const cache = new Map();
export const spriteURL = (file) => new URL(`../../assets/sprites/${file}`, import.meta.url).href;
const loader = new THREE.TextureLoader();

// Claves: 'iso|ball|molt:<especie>', 'res:<recurso>', 'proc:<id>' o un archivo de assets/sprites/.
export function spriteTexture(key) {
  if (cache.has(key)) return cache.get(key);
  let tex;
  const [kind, arg] = key.split(':');
  if (ISO[kind] || kind === 'res' || kind === 'proc' || kind === 'badge') {
    const [w, h] = kind === 'proc' ? [PROC_SPRITES[arg].w, PROC_SPRITES[arg].h] : SIZES[kind];
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.lineJoin = 'round';
    if (ISO[kind]) ISO[kind](ctx, w, h, arg);
    else if (kind === 'res') { // ficha: disco de papel con filo fino del color del recurso y el dibujo grande dentro
      const col = RES_COLOR[arg] ?? PALETTES.cozy.amber;
      ctx.beginPath(); ctx.arc(w / 2, h / 2, w * 0.42, 0, 7); ctx.fillStyle = PALETTES.cozy.paper; ctx.fill(); ctx.lineWidth = 5; ctx.strokeStyle = col; ctx.stroke();
      ctx.save(); ctx.translate(w * 0.15, h * 0.15); ctx.scale(0.7, 0.7); ctx.strokeStyle = INK; ctx.lineWidth = 4.5; RES[arg](ctx, w, h); ctx.restore();
    }
    else if (kind === 'badge') badge(ctx, w, h, +arg);
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

// Imagen (URL) del mismo dibujo para la interfaz: retratos de isópodos, aberraciones y larvas.
export function portraitURL(key) {
  const [kind, arg] = key.split(':');
  if (!ISO[kind] && kind !== 'proc') return spriteURL(key);
  const ck = `portrait:${key}`;
  if (!cache.has(ck)) {
    const [w, h] = kind === 'proc' ? [PROC_SPRITES[arg].w, PROC_SPRITES[arg].h] : SIZES[kind];
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.lineJoin = 'round';
    if (ISO[kind]) ISO[kind](ctx, w, h, arg); else PROC_SPRITES[arg].draw(ctx, w, h);
    cache.set(ck, canvas.toDataURL());
  }
  return cache.get(ck);
}
