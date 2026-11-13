// Paisaje de terrario en terrazas: cada celda es una columna de tierra con su altura (ruido suave por
// semilla) sobre las capas de drenaje, con decoración en lo cerrado. Va dentro de un recipiente (vessel.js).
// Solo visual: reglas y colisiones siguen en el plano (src/game). Mundo: x = columna − w/2, z = fila − h/2.
import * as THREE from 'three';
import { PALETTES, SEMANTIC } from '../data/palettes.js';
import { mulberry32 } from '../core/rng.js';
import { substrateCells, substrateDisc, CHARCOAL } from './vessel.js';
import { flora, FLORA } from './flora.js';

const STEP = 0.15, BASE = CHARCOAL[1];
const P = PALETTES.cozy;
const lambert = (hex, extra) => new THREE.MeshLambertMaterial({ color: hex, ...extra });

// Ruido de valor suave: retícula aleatoria cada `cell` celdas, interpolada.
function noise2(seed, cell) {
  const lat = new Map();
  const at = (x, y) => { const k = `${x},${y}`; if (!lat.has(k)) lat.set(k, mulberry32(seed + x * 7919 + y * 104729)()); return lat.get(k); };
  return (x, y) => {
    const fx = x / cell, fy = y / cell, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
    const s = (t) => t * t * (3 - 2 * t);
    const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * s(tx), b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * s(tx);
    return a + (b - a) * s(ty);
  };
}
const terrace = (h) => Math.round(h / STEP) * STEP;

// Columna con la cara de arriba clara y los laterales en estratos (más oscuros hacia abajo).
function columnGeometry() {
  const geo = new THREE.BoxGeometry(1, 1, 1, 1, 3, 1).translate(0, -0.5, 0);
  const pos = geo.attributes.position, nor = geo.attributes.normal, col = [];
  for (let i = 0; i < pos.count; i++) {
    const v = nor.getY(i) > 0.5 ? 1 : 0.62 + 0.25 * (pos.getY(i) + 1);
    col.push(v, v * 0.97, v * 0.93);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return geo;
}

// Decoración: rocas, helechos y matas sobre la cima de cada punto [x, y, z, escala].
function decor(group, rocks, ferns, tufts) {
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const add = (geo, mat, list, shape) => {
    if (!list.length) return;
    const inst = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach(([x, y, z, k, r], i) => { shape(k, r); m.compose(p.set(x, y, z), q.setFromEuler(e), s); inst.setMatrixAt(i, m); });
    inst.castShadow = inst.receiveShadow = true;
    group.add(inst);
  };
  add(new THREE.DodecahedronGeometry(0.32, 0), lambert(P.stone), rocks, (k, r) => { e.set(r * 3, r * 5, 0); s.set(k, k * 0.7, k); });
  add(new THREE.ConeGeometry(0.18, 0.7, 6).translate(0, 0.35, 0), lambert(new THREE.Color(P.moss).lerp(new THREE.Color(P.shade), 0.3)), ferns, (k, r) => { e.set((r - 0.5) * 0.7, r * 6, (r - 0.5) * 0.7); s.set(k, k, k); });
  add(new THREE.ConeGeometry(0.06, 0.3, 4).translate(0, 0.15, 0), lambert(P.moss), tufts, (k, r) => { e.set(0, 0, (r - 0.5) * 0.6); s.set(k, k, k); });
}

// Isla a partir de una rejilla. `rim`: anillo de celdas cerradas visibles alrededor (lo ampliable), alzado
// como colinas con decoración. Devuelve { group, gridLines, heightAt(x, y) } en coordenadas de rejilla.
export function islandFromGrid(grid, { seed = 1, rim = 0, relief = 0.3, levels = null, levelH = 0.5 } = {}) {
  const rng = mulberry32(seed), n = noise2(seed, 3.5), worn = noise2(seed + 11, 2.2);
  const group = new THREE.Group();
  const ox = grid.w / 2, oz = grid.h / 2;
  const isOpen = (i, j) => i >= 0 && j >= 0 && i < grid.w && j < grid.h && grid.open[j * grid.w + i];
  const nearOpen = (i, j) => { for (let b = -rim; b <= rim; b++) for (let a = -rim; a <= rim; a++) if (isOpen(i + a, j + b)) return true; return false; };
  const heights = new Float32Array(grid.w * grid.h).fill(NaN);
  const cells = [];
  for (let j = 0; j < grid.h; j++) for (let i = 0; i < grid.w; i++) {
    const open = isOpen(i, j);
    if (!open && !(rim && nearOpen(i, j))) continue;
    // `levels`: alturas fijas por celda (recolección con escalones); si no, ruido suave.
    const h = levels && open ? 0.05 + levels[j * grid.w + i] * levelH : terrace(open ? n(i, j) * relief : 0.45 + n(i, j) * 0.9);
    heights[j * grid.w + i] = h;
    cells.push({ i, j, open, h });
  }
  const heightAt = (x, y) => { const v = heights[Math.floor(y) * grid.w + Math.floor(x)]; return Number.isNaN(v) || v === undefined ? 0 : v; };

  let span = 0;
  for (const { i, j } of cells) span = Math.max(span, Math.hypot(i + 0.5 - ox, j + 0.5 - oz) + 0.71);
  const cols = new THREE.InstancedMesh(columnGeometry(), lambert(0xffffff, { vertexColors: true }), cells.length);
  const m = new THREE.Matrix4(), col = new THREE.Color();
  const grass = new THREE.Color(P.grass), moss = new THREE.Color(P.moss), path = new THREE.Color(P.path);
  const rocks = [], ferns = [], plants = [];
  const pick = () => FLORA[Math.floor(rng() * FLORA.length)];
  cells.forEach(({ i, j, open, h }, k) => {
    m.makeScale(1, h - BASE, 1).setPosition(i + 0.5 - ox, h, j + 0.5 - oz);
    cols.setMatrixAt(k, m);
    // Suelo verde claro con manchas de tierra pisada en lo abierto (el camino pintado de la base de CotL).
    const trodden = open && relief > 0 && worn(i, j) > 0.7;
    cols.setColorAt(k, trodden ? col.copy(path).lerp(grass, rng() * 0.12) : open ? col.copy(grass).lerp(moss, rng() * 0.25) : col.copy(moss).lerp(grass, rng() * 0.2));
    const spot = () => [i + 0.15 + rng() * 0.7 - ox, h, j + 0.15 + rng() * 0.7 - oz];
    if (!open) {
      for (let p = 0; p < 3; p++) plants.push([...spot(), 0.55 + rng() * 0.75, pick(), rng() * 3]);
      const r = rng();
      if (r < 0.12) rocks.push([...spot(), 0.7 + rng() * 0.9, rng()]);
      else if (r < 0.24) ferns.push([...spot(), 0.9 + rng() * 0.8, rng()]);
    } else if (!trodden && rng() < (relief > 0 ? 0.3 : 0.14)) plants.push([...spot(), 0.35 + rng() * 0.3, rng() < 0.5 ? 'trebol' : 'flor', rng() * 3]);
  });
  cols.castShadow = cols.receiveShadow = true;
  group.add(cols, flora(plants));
  decor(group, rocks, ferns, []);
  if (relief === 0) group.add(pathDecal(grid, worn, rng));
  group.add(substrateCells(cells.map(({ i, j }) => [i + 0.5 - ox, j + 0.5 - oz])));

  const pts = [];
  for (const { i, j, open, h } of cells) {
    if (!open) continue;
    const x = i - ox, z = j - oz, y = h + 0.02;
    pts.push(x, y, z, x + 1, y, z, x + 1, y, z, x + 1, y, z + 1, x + 1, y, z + 1, x, y, z + 1, x, y, z + 1, x, y, z);
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const gridLines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: P.ink, transparent: true, opacity: 0.3 }));
  gridLines.visible = false;
  group.add(gridLines);
  return { group, gridLines, heightAt, span, cells };
}

// Suelo llano (el terrario): la tierra pisada se pinta encima como una mancha orgánica, no por celdas.
function pathDecal(grid, worn, rng) {
  const R = 24, cv = document.createElement('canvas');
  cv.width = grid.w * R; cv.height = grid.h * R;
  const c = cv.getContext('2d');
  c.fillStyle = P.path;
  for (let j = 0; j < grid.h; j++) for (let i = 0; i < grid.w; i++) {
    if (!grid.open[j * grid.w + i] || worn(i, j) < 0.64) continue;
    for (let k = 0; k < 4; k++) { c.beginPath(); c.arc((i + rng()) * R, (j + rng()) * R, R * (0.4 + (worn(i, j) - 0.64) * 2.5 + rng() * 0.25), 0, Math.PI * 2); c.fill(); }
  }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(grid.w, grid.h).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.position.y = 0.012; m.receiveShadow = true;
  return m;
}

// Arena de combate: suelo llano (las reglas son planas) rodeado de un anillo de columnas en terrazas,
// rocas y helechos, sobre las capas de drenaje.
export function arena(radius, seed = 1) {
  const rng = mulberry32(seed), n = noise2(seed, 2.5);
  const group = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(radius + 2.1, radius + 2.1, -BASE, 48).translate(0, BASE / 2, 0), lambert(new THREE.Color(PALETTES.terror.grass).lerp(new THREE.Color(PALETTES.terror.path), 0.35).lerp(new THREE.Color(PALETTES.terror.stone), 0.35)));
  floor.receiveShadow = true;
  group.add(floor);
  const ring = [];
  for (let a = 0; a < 64; a++) {
    for (let r = 0; r < 2; r++) {
      const ang = (a / 64) * Math.PI * 2, d = radius + 0.7 + r * 0.9;
      ring.push({ x: Math.cos(ang) * d, z: Math.sin(ang) * d, h: terrace(0.05 + n(a * 0.6, r * 3) * 0.7 + r * 0.3) });
    }
  }
  const cols = new THREE.InstancedMesh(columnGeometry(), lambert(PALETTES.terror.soil, { vertexColors: true }), ring.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  const rocks = [], ferns = [];
  ring.forEach(({ x, z, h }, k) => {
    q.setFromAxisAngle(up, -Math.atan2(z, x));
    m.compose(new THREE.Vector3(x, h, z), q, new THREE.Vector3(0.95, h - BASE, 0.5));
    cols.setMatrixAt(k, m);
    if (rng() < 0.35) (rng() < 0.5 ? rocks : ferns).push([x, h, z, 0.7 + rng(), rng()]);
  });
  cols.castShadow = cols.receiveShadow = true;
  group.add(cols);
  const plants = Array.from({ length: 90 }, (_, k) => { const a = rng() * Math.PI * 2, d = k < 60 ? radius + 0.4 + rng() * 1.6 : Math.sqrt(rng()) * radius * 0.95; return [Math.cos(a) * d, k < 60 ? 0.3 : 0, Math.sin(a) * d, k < 60 ? 0.6 + rng() * 0.8 : 0.3 + rng() * 0.2, k < 60 ? FLORA[k % 4] : 'trebol', rng() * 3]; });
  group.add(flora(plants));
  decor(group, rocks, ferns, []);
  group.add(substrateDisc(radius + 2.1));
  // Marco de nido: raíces oscuras altas detrás del anillo y antorchas con su charco de luz cálida.
  const root = new THREE.ConeGeometry(0.22, 1, 5).translate(0, 0.5, 0);
  const roots = new THREE.InstancedMesh(root, lambert(PALETTES.terror.bark), 36);
  for (let k = 0; k < 36; k++) {
    const a = (k / 36) * Math.PI * 2 + rng() * 0.15, d = radius + 1.2 + rng() * 0.8, h = 1.2 + rng() * 2.2;
    m.compose(new THREE.Vector3(Math.cos(a) * d, 0, Math.sin(a) * d), new THREE.Quaternion().setFromEuler(new THREE.Euler((rng() - 0.5) * 0.5, 0, (rng() - 0.5) * 0.5)), new THREE.Vector3(1 + rng(), h, 1 + rng()));
    roots.setMatrixAt(k, m);
  }
  roots.castShadow = true;
  group.add(roots);
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + 0.5, x = Math.cos(a) * (radius + 0.6), z = Math.sin(a) * (radius + 0.6);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.3, 6), lambert(PALETTES.terror.bark));
    post.position.set(x, 0.65, z);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.4, 6), new THREE.MeshBasicMaterial({ color: PALETTES.cozy.amber }));
    flame.position.set(x, 1.45, z);
    const light = new THREE.PointLight(PALETTES.cozy.amber, 9, 6, 1.6);
    light.position.set(x, 1.7, z);
    group.add(post, flame, light);
  }
  return group;
}

// Lo que trae cada arena (game/arena.js): raíces que cortan el paso, charcas de esporas que brillan y un pozo
// oscuro con borde de piedras. En el mundo, y del plano: x = x, z = y.
export function arenaFeatures({ pillars, pools, pit }, seed = 1) {
  const g = new THREE.Group(), rng = mulberry32(seed + 5), T = PALETTES.terror;
  const plants = [];
  for (const p of pillars) {
    const h = 1.6 + rng() * 1.2;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(p.r * 0.75, p.r, h, 7), lambert(T.bark));
    trunk.position.set(p.x, h / 2, p.y); trunk.castShadow = trunk.receiveShadow = true;
    const cap = new THREE.Mesh(new THREE.ConeGeometry(p.r * 1.25, 0.6, 7), lambert(T.moss));
    cap.position.set(p.x, h + 0.2, p.y); cap.castShadow = true;
    g.add(trunk, cap);
    for (const m of [trunk, cap]) m.material.transparent = true;
    (g.userData.pillars ??= []).push({ x: p.x, y: p.y, r: p.r, h, meshes: [trunk, cap], fade: 1 });
    for (let k = 0; k < 4; k++) { const a = rng() * Math.PI * 2; plants.push([p.x + Math.cos(a) * (p.r + 0.15), 0, p.y + Math.sin(a) * (p.r + 0.15), 0.4 + rng() * 0.3, FLORA[k % FLORA.length], rng() * 3]); }
  }
  const glow = new THREE.MeshBasicMaterial({ color: SEMANTIC.peligro, transparent: true, opacity: 0.55, depthWrite: false }); // peligro = violeta
  for (const p of pools) {
    const disc = new THREE.Mesh(new THREE.CircleGeometry(p.r, 24).rotateX(-Math.PI / 2), glow);
    disc.position.set(p.x, 0.03, p.y);
    const rim = new THREE.Mesh(new THREE.RingGeometry(p.r * 0.96, p.r * 1.08, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: P.ink, transparent: true, opacity: 0.6 }));
    rim.position.set(p.x, 0.035, p.y);
    g.add(disc, rim);
    g.userData.pools = [...(g.userData.pools ?? []), disc];
  }
  if (pit) {
    const hole = new THREE.Mesh(new THREE.CircleGeometry(pit, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: T.ink }));
    hole.position.y = 0.025; g.add(hole);
    const n = Math.round(pit * 12), geo = new THREE.DodecahedronGeometry(0.16, 0);
    for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, st = new THREE.Mesh(geo, lambert(T.stone)); st.position.set(Math.cos(a) * (pit + 0.1), 0.06, Math.sin(a) * (pit + 0.1)); st.castShadow = true; g.add(st); }
  }
  if (plants.length) g.add(flora(plants));
  return g;
}
