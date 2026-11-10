// Islas flotantes: losetas de la rejilla encima y un cono de roca irregular debajo. Las celdas cerradas
// (zona por ampliar) quedan más bajas y oscuras. Mundo: x = columna − w/2, z = fila − h/2.
import * as THREE from 'three';
import { PALETTES } from '../data/palettes.js';
import { mulberry32 } from '../core/rng.js';

const mat = (hex) => new THREE.MeshLambertMaterial({ color: hex });

function underside(radius, depth, rng) {
  const geo = new THREE.ConeGeometry(radius, depth, 11, 3, true);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y < depth / 2 - 0.01) { pos.setX(i, pos.getX(i) * (0.8 + rng() * 0.4)); pos.setZ(i, pos.getZ(i) * (0.8 + rng() * 0.4)); }
  }
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: PALETTES.cozy.soil, side: THREE.DoubleSide }));
  m.rotation.x = Math.PI;
  m.position.y = -0.5 - depth / 2;
  return m;
}

function tufts(group, spots, rng) {
  const geo = new THREE.ConeGeometry(0.06, 0.28, 4);
  const inst = new THREE.InstancedMesh(geo, mat(PALETTES.cozy.moss), spots.length);
  const m = new THREE.Matrix4();
  spots.forEach(([x, z], i) => { m.makeRotationZ((rng() - 0.5) * 0.6); m.setPosition(x, 0.12, z); inst.setMatrixAt(i, m); });
  group.add(inst);
}

// Isla a partir de una rejilla. Devuelve { group, gridLines } (las líneas se muestran al construir).
// `rim`: anillo de celdas cerradas que se ve alrededor de lo abierto (lo que se puede ampliar).
export function islandFromGrid(grid, { seed = 1, rim = 0 } = {}) {
  const rng = mulberry32(seed);
  const group = new THREE.Group();
  const ox = grid.w / 2, oz = grid.h / 2;
  const isOpen = (i, j) => i >= 0 && j >= 0 && i < grid.w && j < grid.h && grid.open[j * grid.w + i];
  const nearOpen = (i, j) => { for (let b = -rim; b <= rim; b++) for (let a = -rim; a <= rim; a++) if (isOpen(i + a, j + b)) return true; return false; };
  const cells = [];
  for (let j = 0; j < grid.h; j++) for (let i = 0; i < grid.w; i++) {
    const open = isOpen(i, j);
    if (open || (rim && nearOpen(i, j))) cells.push({ i, j, open });
  }
  let span = 0;
  for (const { i, j } of cells) span = Math.max(span, Math.abs(i + 0.5 - ox), Math.abs(j + 0.5 - oz));
  const tiles = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.5, 1), mat(0xffffff), cells.length);
  const m = new THREE.Matrix4(), col = new THREE.Color();
  const soil = new THREE.Color(PALETTES.cozy.soil), moss = new THREE.Color(PALETTES.cozy.moss), shade = new THREE.Color(PALETTES.cozy.shade);
  const spots = [];
  cells.forEach(({ i, j, open }, k) => {
    const h = open ? (rng() - 0.5) * 0.012 : -0.3;
    m.makeTranslation(i + 0.5 - ox, h - 0.25, j + 0.5 - oz);
    tiles.setMatrixAt(k, m);
    tiles.setColorAt(k, open ? col.copy(shade).lerp(soil, 0.35 + rng() * 0.2) : col.copy(moss).lerp(shade, 0.45));
    if (!open && rng() < 0.5) spots.push([i + rng() - ox, j + rng() - oz]);
    else if (open && rng() < 0.12) spots.push([i + rng() - ox, j + rng() - oz]);
  });
  tiles.receiveShadow = true;
  group.add(tiles);
  tufts(group, spots, rng);
  group.add(underside(span * 1.25, span * 1.1, rng));

  const pts = [];
  for (const { i, j, open } of cells) {
    if (!open) continue;
    const x = i - ox, z = j - oz, y = 0.02;
    pts.push(x, y, z, x + 1, y, z, x, y, z, x, y, z + 1);
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  const gridLines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color: PALETTES.cozy.ink, transparent: true, opacity: 0.35 }));
  gridLines.visible = false;
  group.add(gridLines);
  return { group, gridLines };
}

// Arena circular de combate (radio en celdas) con rocas en el borde.
export function arena(radius, seed = 1) {
  const rng = mulberry32(seed);
  const group = new THREE.Group();
  const top = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.97, 0.5, 48), mat(PALETTES.terror.shade));
  top.position.y = -0.25;
  top.receiveShadow = true;
  group.add(top, underside(radius * 0.98, radius * 0.8, rng));
  const rock = new THREE.DodecahedronGeometry(0.5, 0);
  for (let k = 0; k < 14; k++) {
    const a = (k / 14) * Math.PI * 2 + rng() * 0.3, s = 0.5 + rng() * 0.8;
    const r = new THREE.Mesh(rock, mat(PALETTES.terror.stone));
    r.position.set(Math.cos(a) * (radius + 0.2), 0.1, Math.sin(a) * (radius + 0.2));
    r.scale.set(s, s * 0.8, s);
    r.rotation.set(rng() * 3, rng() * 3, 0);
    r.castShadow = true;
    group.add(r);
  }
  const spots = Array.from({ length: 40 }, () => { const a = rng() * Math.PI * 2, d = Math.sqrt(rng()) * radius * 0.95; return [Math.cos(a) * d, Math.sin(a) * d]; });
  tufts(group, spots, rng);
  return group;
}

// Paredes de vidrio alrededor de lo abierto: el terrario es una isla bajo cristal.
export function glass(grid, height = 1.3) {
  let x0 = grid.w, z0 = grid.h, x1 = 0, z1 = 0;
  for (let j = 0; j < grid.h; j++) for (let i = 0; i < grid.w; i++) {
    if (grid.open[j * grid.w + i]) { x0 = Math.min(x0, i); z0 = Math.min(z0, j); x1 = Math.max(x1, i + 1); z1 = Math.max(z1, j + 1); }
  }
  const ox = grid.w / 2, oz = grid.h / 2, w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2 - ox, cz = (z0 + z1) / 2 - oz;
  const group = new THREE.Group();
  const box = new THREE.BoxGeometry(w, height, d).translate(cx, height / 2, cz);
  group.add(new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: PALETTES.cozy.water, transparent: true, opacity: 0.08, depthWrite: false, side: THREE.BackSide })));
  group.add(new THREE.LineSegments(new THREE.EdgesGeometry(box), new THREE.LineBasicMaterial({ color: PALETTES.cozy.ink, transparent: true, opacity: 0.55 })));
  return group;
}
