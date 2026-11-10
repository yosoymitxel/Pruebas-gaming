// Islas flotantes en terrazas: cada celda es una columna de tierra con su altura (ruido suave por semilla),
// laterales más oscuros por estratos, decoración en lo cerrado y un cono de roca debajo. Solo visual: las
// reglas y colisiones siguen en el plano (src/game). Mundo: x = columna − w/2, z = fila − h/2.
import * as THREE from 'three';
import { PALETTES } from '../data/palettes.js';
import { mulberry32 } from '../core/rng.js';

const STEP = 0.15, BASE = -1.2;
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

function underside(radius, depth, rng) {
  const geo = new THREE.ConeGeometry(radius, depth, 13, 4, true);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) < depth / 2 - 0.01) { const k = 0.75 + rng() * 0.5; pos.setX(i, pos.getX(i) * k); pos.setZ(i, pos.getZ(i) * k); }
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, lambert(P.soil, { side: THREE.DoubleSide }));
  m.rotation.x = Math.PI;
  m.position.y = BASE - depth / 2 + 0.05;
  return m;
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
export function islandFromGrid(grid, { seed = 1, rim = 0, relief = 0.3 } = {}) {
  const rng = mulberry32(seed), n = noise2(seed, 3.5);
  const group = new THREE.Group();
  const ox = grid.w / 2, oz = grid.h / 2;
  const isOpen = (i, j) => i >= 0 && j >= 0 && i < grid.w && j < grid.h && grid.open[j * grid.w + i];
  const nearOpen = (i, j) => { for (let b = -rim; b <= rim; b++) for (let a = -rim; a <= rim; a++) if (isOpen(i + a, j + b)) return true; return false; };
  const heights = new Float32Array(grid.w * grid.h).fill(NaN);
  const cells = [];
  for (let j = 0; j < grid.h; j++) for (let i = 0; i < grid.w; i++) {
    const open = isOpen(i, j);
    if (!open && !(rim && nearOpen(i, j))) continue;
    const h = terrace(open ? n(i, j) * relief : 0.45 + n(i, j) * 0.9);
    heights[j * grid.w + i] = h;
    cells.push({ i, j, open, h });
  }
  const heightAt = (x, y) => { const v = heights[Math.floor(y) * grid.w + Math.floor(x)]; return Number.isNaN(v) || v === undefined ? 0 : v; };

  let span = 0;
  for (const { i, j } of cells) span = Math.max(span, Math.abs(i + 0.5 - ox), Math.abs(j + 0.5 - oz));
  const cols = new THREE.InstancedMesh(columnGeometry(), lambert(0xffffff, { vertexColors: true }), cells.length);
  const m = new THREE.Matrix4(), col = new THREE.Color();
  const soil = new THREE.Color(P.soil), moss = new THREE.Color(P.moss), shade = new THREE.Color(P.shade);
  const rocks = [], ferns = [], tufts = [];
  cells.forEach(({ i, j, open, h }, k) => {
    m.makeScale(1, h - BASE, 1).setPosition(i + 0.5 - ox, h, j + 0.5 - oz);
    cols.setMatrixAt(k, m);
    cols.setColorAt(k, open ? col.copy(shade).lerp(soil, 0.3 + rng() * 0.15).lerp(moss, h * 0.4) : col.copy(moss).lerp(shade, 0.3 + rng() * 0.2));
    const x = i + 0.2 + rng() * 0.6 - ox, z = j + 0.2 + rng() * 0.6 - oz, r = rng();
    if (!open) (r < 0.3 ? rocks : r < 0.75 ? ferns : tufts).push([x, h, z, 0.7 + rng() * 0.9, rng()]);
    else if (r < 0.15) tufts.push([x, h, z, 0.8 + rng() * 0.5, rng()]);
  });
  cols.castShadow = cols.receiveShadow = true;
  group.add(cols);
  decor(group, rocks, ferns, tufts);
  group.add(underside(span * 1.2, span * 1.15, rng));

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
  return { group, gridLines, heightAt };
}

// Arena de combate: suelo llano (las reglas son planas) rodeado de un anillo de columnas en terrazas,
// rocas y helechos, sobre su cono de roca.
export function arena(radius, seed = 1) {
  const rng = mulberry32(seed), n = noise2(seed, 2.5);
  const group = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.3, radius + 0.3, -BASE, 48).translate(0, BASE / 2, 0), lambert(new THREE.Color(PALETTES.terror.shade).lerp(new THREE.Color(PALETTES.terror.paper), 0.5)));
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
  const tufts = Array.from({ length: 50 }, () => { const a = rng() * Math.PI * 2, d = Math.sqrt(rng()) * radius * 0.95; return [Math.cos(a) * d, 0, Math.sin(a) * d, 0.8 + rng() * 0.5, rng()]; });
  decor(group, rocks, ferns, tufts);
  group.add(underside(radius + 2, radius * 1.1, rng));
  return group;
}

// Paredes de vidrio alrededor de lo abierto: el terrario es una isla bajo cristal.
export function glass(grid, height = 1.8) {
  let x0 = grid.w, z0 = grid.h, x1 = 0, z1 = 0;
  for (let j = 0; j < grid.h; j++) for (let i = 0; i < grid.w; i++) {
    if (grid.open[j * grid.w + i]) { x0 = Math.min(x0, i); z0 = Math.min(z0, j); x1 = Math.max(x1, i + 1); z1 = Math.max(z1, j + 1); }
  }
  const ox = grid.w / 2, oz = grid.h / 2, w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2 - ox, cz = (z0 + z1) / 2 - oz;
  const group = new THREE.Group();
  const box = new THREE.BoxGeometry(w, height, d).translate(cx, height / 2 - 0.1, cz);
  group.add(new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: P.water, transparent: true, opacity: 0.07, depthWrite: false, side: THREE.BackSide })));
  group.add(new THREE.LineSegments(new THREE.EdgesGeometry(box), new THREE.LineBasicMaterial({ color: P.ink, transparent: true, opacity: 0.5 })));
  return group;
}
