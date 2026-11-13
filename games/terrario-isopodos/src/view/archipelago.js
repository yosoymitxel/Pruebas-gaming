// Archipiélago: los terrarios y dioramas del día en miniatura, flotando y meciéndose. Se eligen tocándolos.
import * as THREE from 'three';
import { islandFromGrid } from './island.js';
import { dress } from './scenes.js';
import { createGrid, openRect } from '../game/grid.js';

const SCALE = 0.7, SPREAD = [30, 24];

// Forma de cada isla (procedural-gen: island shaping): contorno radial con armónicos y, según la semilla, una
// media luna, un anillo con laguna, dos lóbulos, una cruz o una tira larga. Así no salen siempre círculos.
const SHAPES = ['blob', 'luna', 'anillo', 'lobulos', 'cruz', 'tira', 'estrella'];
function miniGrid(seed) {
  const N = 10, c = N / 2, g = createGrid(N, N), shape = SHAPES[seed % SHAPES.length], k = 2 + (seed % 3), ph = seed * 0.7;
  const inside = (x, y) => {
    const d = Math.hypot(x, y), a = Math.atan2(y, x), edge = 3.9 + Math.sin(a * k + ph) * 0.5 + Math.sin(a * (k + 2) - ph) * 0.25;
    if (shape === 'luna') return d < 4.3 && Math.hypot(x - 2.2, y - 0.6) > 2.6;
    if (shape === 'anillo') return d < edge && d > 1.6;
    if (shape === 'lobulos') return Math.hypot(x + 1.9, y + 1) < 2.4 || Math.hypot(x - 1.9, y - 1) < 2.6;
    if (shape === 'cruz') return (Math.abs(x) < 1.4 || Math.abs(y) < 1.4) && d < 4.6;
    if (shape === 'tira') return Math.abs(y + Math.sin(x * 0.8 + ph) * 0.8) < 1.6 && Math.abs(x) < 4.8;
    if (shape === 'estrella') return d < 2.5 + Math.max(0, Math.cos(a * 5 + ph)) * 2.3;
    return d < edge;
  };
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (inside(i + 0.5 - c, j + 0.5 - c)) openRect(g, i, j, 1, 1);
  return g;
}

export class ArchipelagoView {
  constructor(stage, game) {
    this.stage = stage;
    this.group = new THREE.Group();
    this.models = [];
    // En vertical el mapa se reparte a lo alto (girado) para que las islas no queden diminutas.
    this.tall = stage.camera.aspect < 1;
    const [sx, sz] = this.tall ? [SPREAD[1] * 0.85, SPREAD[0] * 1.9] : SPREAD;
    this.fitW = sx + 8;
    for (const isl of game.islands) {
      const home = isl.kind === 'hogar';
      const grid = home ? game.home.grid : miniGrid(isl.seed % 7);
      const island = islandFromGrid(grid, { seed: isl.seed, rim: home ? 1 : 0, relief: home ? 0.3 : 0.6 });
      dress(island.group, isl.vessel ?? (home ? 'tanque' : 'frasco'), island, grid, isl.seed);
      const root = new THREE.Group();
      root.add(island.group);
      root.scale.setScalar(home ? SCALE * 0.75 : SCALE);
      const [u, v] = this.tall ? [isl.y - 0.45, 0.5 - isl.x] : [isl.x - 0.5, isl.y - 0.45];
      root.position.set(u * sx, 0, v * sz);
      root.userData.island = isl.id;
      this.group.add(root);
      this.models.push({ root, isl, phase: (isl.seed % 100) / 15 });
    }
    this.layout(sx, sz);
    this.ray = new THREE.Raycaster();
    // «Estás aquí»: aro que late bajo el terrario.
    const h = this.models.find((m) => m.isl.kind === 'hogar');
    if (h) { this.here = new THREE.Mesh(new THREE.RingGeometry(1, 1.25, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xf2c14e, transparent: true, opacity: 0.8, depthWrite: false })); this.here.position.y = 0.2; this.here.renderOrder = 5; h.root.add(this.here); }
  }

  // Reparto sin solapes: el terrario fijo (en vertical, centro-derecha) y las demás se separan entre sí según su
  // tamaño real y se quedan dentro del encuadre.
  layout(sx, sz) {
    this.group.updateMatrixWorld(true);
    const box = new THREE.Box3(), rad = (m) => { box.setFromObject(m.root); return Math.max(box.max.x - box.min.x, box.max.z - box.min.z) / 2; };
    const items = this.models.map((m) => ({ m, r: rad(m) + 1.8, fixed: m.isl.kind === 'hogar' }));
    const home = items.find((o) => o.fixed);
    if (home && this.tall) home.m.root.position.set(sx * 0.3, 0, sz * 0.04);
    const limX = sx / 2 - 1, limZ = sz / 2;
    for (let it = 0; it < 80; it++) {
      for (const a of items) for (const b of items) {
        if (a === b) continue;
        const pa = a.m.root.position, pb = b.m.root.position, dx = pb.x - pa.x, dz = pb.z - pa.z, d = Math.hypot(dx, dz) || 0.01, need = a.r + b.r - d;
        if (need <= 0) continue;
        const ux = dx / d, uz = dz / d, wa = a.fixed ? 0 : b.fixed ? 1 : 0.5, wb = 1 - wa;
        pa.x -= ux * need * wa; pa.z -= uz * need * wa; pb.x += ux * need * wb; pb.z += uz * need * wb;
      }
      for (const o of items) { if (o.fixed) continue; const p = o.m.root.position, r = o.r * 0.8; p.x = Math.max(-limX + r, Math.min(limX - r, p.x)); p.z = Math.max(-limZ + r, Math.min(limZ - r, p.z)); }
    }
  }

  get camera() { return { target: [0, 0], distance: 36, fit: this.fitW }; }

  // Primeros fotogramas: mete en pantalla (con sitio para el rótulo) las islas que la cámara deja en el borde.
  fitScreen() {
    const W = this.stage.container.clientWidth, H = this.stage.container.clientHeight, mx = 85, my = 90;
    if (!W) return;
    // En vertical: terrario abajo a la derecha y el resto en zigzag a lo alto (se aprovecha el alto, no se apiñan).
    if (this.tall) {
      const rest = this.models.filter((m) => m.isl.kind !== 'hogar').sort((a, b) => a.isl.seed - b.isl.seed), n = rest.length;
      const home = this.models.find((m) => m.isl.kind === 'hogar');
      if (home) this.moveTo(home, W * 0.66, H * 0.76);
      rest.forEach((m, k) => { const jit = ((m.isl.seed % 7) - 3) * 4; this.moveTo(m, W * (k % 2 ? 0.68 : 0.32) + jit, H * (0.2 + (n > 1 ? (k / (n - 1)) * 0.36 : 0)) + jit); });
      return;
    }
    for (let pass = 0; pass < 8; pass++) this.fitPass(W, H, mx, my, true);
    this.fitPass(W, H, mx, my, false); // lo último es meterlas en pantalla
  }
  // Lleva una isla al punto de pantalla (tx, ty) con Newton sobre la proyección (suelo y = 0).
  moveTo(m, tx, ty) {
    const p = m.root.position;
    for (let k = 0; k < 30; k++) {
      const s0 = this.stage.project(p.x, 0, p.z), sx = this.stage.project(p.x + 1, 0, p.z), sz = this.stage.project(p.x, 0, p.z + 1);
      const ex = tx - s0.x, ey = ty - s0.y;
      if (Math.abs(ex) + Math.abs(ey) < 1) break;
      const a = sx.x - s0.x, b = sz.x - s0.x, c = sx.y - s0.y, d = sz.y - s0.y, det = a * d - b * c || 1;
      p.x += (d * ex - b * ey) / det; p.z += (-c * ex + a * ey) / det;
    }
  }
  fitPass(W, H, mx, my, sep) {
    for (const m of this.models) {
      if (m.isl.kind === 'hogar') continue;
      const p = m.root.position;
      for (let k = 0; k < 40; k++) {
        const s0 = this.stage.project(p.x, 0, p.z), sx = this.stage.project(p.x + 1, 0, p.z), sz = this.stage.project(p.x, 0, p.z + 1);
        const ex = s0.x < mx ? mx - s0.x : s0.x > W - mx ? W - mx - s0.x : 0, ey = s0.y < my + 40 ? my + 40 - s0.y : s0.y > H - my ? H - my - s0.y : 0;
        if (!ex && !ey) break;
        // paso en mundo que mueve el punto en pantalla (inversa de la jacobiana 2×2)
        const a = sx.x - s0.x, b = sz.x - s0.x, c = sx.y - s0.y, d = sz.y - s0.y, det = a * d - b * c || 1;
        p.x += ((d * ex - b * ey) / det) * 0.5; p.z += ((-c * ex + a * ey) / det) * 0.5;
      }
    }
    // y que no se pisen en pantalla (rombo + rótulo ≈ 130 px)
    for (let it = 0; sep && it < 6; it++) {
      let moved = false;
      for (const a of this.models) for (const b of this.models) {
        if (a === b || b.isl.kind === 'hogar') continue;
        const pa = this.stage.project(a.root.position.x, 0, a.root.position.z), pb = this.stage.project(b.root.position.x, 0, b.root.position.z);
        const dx = (pb.x - pa.x) / 1.6, dy = pb.y - pa.y, d = Math.hypot(dx, dy) || 1;
        if (d > 125) continue;
        const wa = a.root.position, wb = b.root.position, vx = wb.x - wa.x, vz = wb.z - wa.z, n = Math.hypot(vx, vz) || 1;
        wb.x += (vx / n) * 0.6; wb.z += (vz / n) * 0.6; moved = true;
      }
      if (!moved) break;
    }
  }

  update(time) {
    if ((this.fitted = (this.fitted ?? 0) + 1) === 3 || this.fitted === 4) this.fitScreen();
    if (this.here) { const k = 1 + (Math.sin(time * 3) + 1) * 0.06; this.here.scale.setScalar(k * 7); this.here.material.opacity = 0.5 + Math.sin(time * 3) * 0.3; }
    for (const m of this.models) {
      m.root.position.y = Math.sin(time * 0.8 + m.phase) * 0.35;
      m.root.rotation.y = Math.sin(time * 0.2 + m.phase) * 0.15;
    }
  }

  // Isla bajo el puntero (id) o null.
  pick(ev) {
    const r = this.stage.renderer.domElement.getBoundingClientRect();
    this.ray.setFromCamera(new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1), this.stage.camera);
    const hit = this.ray.intersectObjects(this.models.map((m) => m.root), true)[0];
    let o = hit?.object;
    while (o && !o.userData.island) o = o.parent;
    return o?.userData.island ?? null;
  }

  // Dónde poner el rótulo de cada isla (px de pantalla): el rombo encima de su propia isla.
  labelAt(id) {
    const m = this.models.find((x) => x.isl.id === id);
    return this.stage.project(m.root.position.x, m.root.position.y + 1.6, m.root.position.z);
  }
}
