// Rejilla del terrario. Cada celda está cerrada (zona sin ampliar), libre o ocupada por una pieza.
// Las piezas ocupan su huella (w × h celdas, girada en pasos de 90°). Lógica pura: sin DOM ni Three.
import { BUILDINGS } from '../data/buildings.js';
import { box } from '../core/physics.js';

export function createGrid(w, h) {
  return { w, h, open: new Uint8Array(w * h), cells: new Array(w * h).fill(null), pieces: {}, nextId: 1 };
}

// Abre (amplía) el rectángulo [x, x + w) × [y, y + h).
export function openRect(grid, x, y, w, h) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (inside(grid, i, j)) grid.open[j * grid.w + i] = 1;
}

const inside = (grid, x, y) => x >= 0 && y >= 0 && x < grid.w && y < grid.h;

export function footprint(type, rot = 0) {
  const { w, h } = BUILDINGS[type].size;
  return rot % 2 ? { w: h, h: w } : { w, h };
}

function* cellsOf(x, y, { w, h }) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) yield [i, j];
}

export function canPlace(grid, type, x, y, rot = 0, ignoreId = null) {
  for (const [i, j] of cellsOf(x, y, footprint(type, rot))) {
    if (!inside(grid, i, j) || !grid.open[j * grid.w + i]) return false;
    const at = grid.cells[j * grid.w + i];
    if (at !== null && at !== ignoreId) return false;
  }
  return true;
}

// Devuelve el id de la pieza colocada, o null si no cabe.
export function place(grid, type, x, y, rot = 0) {
  if (!canPlace(grid, type, x, y, rot)) return null;
  const id = grid.nextId++;
  grid.pieces[id] = { id, type, x, y, rot };
  for (const [i, j] of cellsOf(x, y, footprint(type, rot))) grid.cells[j * grid.w + i] = id;
  return id;
}

export function remove(grid, id) {
  const p = grid.pieces[id];
  if (!p) return false;
  for (const [i, j] of cellsOf(p.x, p.y, footprint(p.type, p.rot))) grid.cells[j * grid.w + i] = null;
  delete grid.pieces[id];
  return true;
}

// Mover o girar: se valida ignorando la propia pieza, así puede solaparse consigo misma.
export function move(grid, id, x, y, rot) {
  const p = grid.pieces[id];
  if (!p || !canPlace(grid, p.type, x, y, rot, id)) return false;
  remove(grid, id);
  grid.pieces[id] = { ...p, x, y, rot };
  for (const [i, j] of cellsOf(x, y, footprint(p.type, rot))) grid.cells[j * grid.w + i] = id;
  return true;
}

// Una celda bloquea el paso si está cerrada o tiene una pieza sólida.
export function blocked(grid, i, j) {
  if (!inside(grid, i, j) || !grid.open[j * grid.w + i]) return true;
  const id = grid.cells[j * grid.w + i];
  return id !== null && BUILDINGS[grid.pieces[id].type].solid;
}

// Saca a un cuerpo circular de radio r (< 1 celda) de las celdas que bloquean a su alrededor.
export function collideGrid(grid, b, r) {
  const ci = Math.floor(b.x), cj = Math.floor(b.y);
  for (let j = cj - 1; j <= cj + 1; j++) {
    for (let i = ci - 1; i <= ci + 1; i++) if (blocked(grid, i, j)) box(b, r, i, j, i + 1, j + 1);
  }
}
