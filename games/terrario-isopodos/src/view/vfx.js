// Efectos a tinta (manchas, polvo, chispas, esporas) y clima (lluvia, niebla, motas). Un solo sistema de
// partículas por escena con presets; todo es visual y no toca el estado del juego.
import * as THREE from 'three';
import { PALETTES } from '../data/palettes.js';

const MAX = 600;
const P = PALETTES.cozy;

// Mancha de tinta irregular como textura de punto.
function blotTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.beginPath();
  for (let k = 0; k <= 12; k++) {
    const a = (k / 12) * Math.PI * 2, r = 22 + Math.random() * 9;
    g.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r);
  }
  g.fill();
  return new THREE.CanvasTexture(c);
}

// count, speed, up (impulso vertical), color, size, life (s), gravity, spread (radio inicial)
export const PRESETS = {
  hit: { count: 10, speed: 3.2, up: 2.5, color: P.ink, size: 0.10, life: 0.45, gravity: 9 },
  heavy: { count: 22, speed: 4.5, up: 3.5, color: P.ink, size: 0.16, life: 0.6, gravity: 9 },
  hurt: { count: 10, speed: 2.6, up: 2, color: P.rust, size: 0.10, life: 0.5, gravity: 9 },
  death: { count: 48, speed: 3, up: 4, color: P.ink, size: 0.22, life: 1.1, gravity: 6 },
  dust: { count: 6, speed: 1, up: 0.6, color: P.shade, size: 0.14, life: 0.5, gravity: 1 },
  spark: { count: 14, speed: 2.2, up: 2.8, color: P.amber, size: 0.08, life: 0.7, gravity: 4 },
  heal: { count: 16, speed: 0.5, up: 1.6, color: P.moss, size: 0.10, life: 1, gravity: -0.6, spread: 0.5 },
  jump: { count: 8, speed: 1.4, up: 0.8, color: P.shade, size: 0.09, life: 0.4, gravity: 2 },
  pickup: { count: 10, speed: 1.6, up: 2.4, color: P.amber, size: 0.08, life: 0.6, gravity: 5 },
};

export class Vfx {
  constructor(parent) {
    this.geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(MAX * 3);
    this.col = new Float32Array(MAX * 3);
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.points = new THREE.Points(this.geo, new THREE.PointsMaterial({ size: 0.2, map: blotTexture(), vertexColors: true, transparent: true, alphaTest: 0.4, depthWrite: false }));
    this.points.frustumCulled = false;
    parent.add(this.points);
    this.parts = [];
  }

  burst(kind, x, y, z) {
    const p = PRESETS[kind];
    if (!p) return;
    const color = new THREE.Color(p.color);
    for (let k = 0; k < p.count && this.parts.length < MAX; k++) {
      const a = Math.random() * Math.PI * 2, sp = p.speed * (0.4 + Math.random() * 0.6), sr = (p.spread ?? 0.1) * Math.random();
      this.parts.push({ x: x + Math.cos(a) * sr, y, z: z + Math.sin(a) * sr, vx: Math.cos(a) * sp, vy: p.up * (0.5 + Math.random() * 0.5), vz: Math.sin(a) * sp,
        life: p.life * (0.6 + Math.random() * 0.4), g: p.gravity, color });
    }
    this.points.material.size = p.size;
  }

  update(dt) {
    let n = 0;
    this.parts = this.parts.filter((q) => (q.life -= dt) > 0);
    for (const q of this.parts) {
      q.vy -= q.g * dt; q.x += q.vx * dt; q.y = Math.max(0.02, q.y + q.vy * dt); q.z += q.vz * dt;
      if (q.y <= 0.02) { q.vx *= 0.8; q.vz *= 0.8; }
      this.pos.set([q.x, q.y, q.z], n * 3);
      this.col.set([q.color.r, q.color.g, q.color.b], n * 3);
      n++;
    }
    this.geo.setDrawRange(0, n);
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
  }
}

// Clima dentro del recipiente: lluvia (trazos que caen), motas (polvo o esporas a la deriva).
// `radius` = mitad del ancho del escenario; `top` = altura desde la que cae.
export class Weather {
  constructor(parent, kind, radius, top = 4) {
    this.kind = kind;
    this.r = radius; this.top = top;
    const count = kind === 'lluvia' ? 260 : kind === 'niebla' ? 40 : 50;
    this.drops = Array.from({ length: count }, () => this.spawn(true));
    const geo = new THREE.BufferGeometry();
    this.buf = new Float32Array(count * 6);
    geo.setAttribute('position', new THREE.BufferAttribute(this.buf, 3));
    this.mesh = kind === 'lluvia'
      ? new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: P.ink, transparent: true, opacity: 0.45 }))
      : new THREE.Points(geo, new THREE.PointsMaterial({ color: kind === 'niebla' ? P.paper : P.amber, map: kind === 'niebla' ? blotTexture() : null, size: kind === 'niebla' ? 0.6 : 0.05, transparent: true, opacity: kind === 'niebla' ? 0.18 : 0.7, depthWrite: false }));
    this.mesh.frustumCulled = false;
    parent.add(this.mesh);
  }

  spawn(anywhere) {
    const a = Math.random() * Math.PI * 2, d = Math.sqrt(Math.random()) * this.r;
    return { x: Math.cos(a) * d, z: Math.sin(a) * d, y: anywhere ? Math.random() * this.top : this.top, t: Math.random() * 10 };
  }

  update(dt) {
    this.drops.forEach((p, k) => {
      if (this.kind === 'lluvia') { p.y -= dt * 9; if (p.y < 0) Object.assign(p, this.spawn(false)); }
      else { p.t += dt; p.x += Math.sin(p.t * 0.7) * dt * 0.3; p.y = 0.4 + (Math.sin(p.t * 0.5 + k) + 1) * (this.kind === 'niebla' ? 0.4 : 1.2); }
      const len = this.kind === 'lluvia' ? 0.35 : 0;
      this.buf.set([p.x, p.y, p.z, p.x + 0.04, p.y + len, p.z], k * 6);
    });
    this.mesh.geometry.attributes.position.needsUpdate = true;
  }
}
