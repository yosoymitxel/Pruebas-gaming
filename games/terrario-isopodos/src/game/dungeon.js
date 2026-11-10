// Mapa interior de un nido: capas de nodos unidas por caminos que no se cruzan; la última capa es la
// guardiana. Solo se avanza a nodos conectados con el actual.
import { BIOMES } from '../data/world.js';
import { mulberry32 } from '../core/rng.js';

export const LAYERS = 7;
const MIDDLE = ['combate', 'combate', 'combate', 'botin', 'refugio', 'carta', 'elite'];

export function genDungeon(seed) {
  const rng = mulberry32(seed);
  const nodes = [], edges = [];
  const layers = [];
  for (let l = 0; l < LAYERS; l++) {
    const n = l === LAYERS - 1 ? 1 : 2 + Math.floor(rng() * 2);
    const layer = [];
    for (let k = 0; k < n; k++) {
      const type = l === LAYERS - 1 ? 'jefe' : l === 0 ? 'combate' : l === LAYERS - 2 ? 'refugio' : MIDDLE[Math.floor(rng() * MIDDLE.length)];
      const node = { id: nodes.length, layer: l, x: (k + 1) / (n + 1) + (rng() - 0.5) * 0.08, type, done: false };
      nodes.push(node); layer.push(node);
    }
    layers.push(layer);
  }
  for (let l = 0; l < LAYERS - 1; l++) {
    const a = layers[l], b = layers[l + 1];
    const near = (x, list) => list.reduce((best, n) => (Math.abs(n.x - x) < Math.abs(best.x - x) ? n : best));
    const link = (from, to) => { if (!edges.some((e) => e[0] === from.id && e[1] === to.id)) edges.push([from.id, to.id]); };
    for (const n of a) link(n, near(n.x, b));
    for (const n of b) link(near(n.x, a), n);
  }
  return { nodes, edges, at: null };
}

export const nextNodes = (d) => (d.at === null
  ? d.nodes.filter((n) => n.layer === 0)
  : d.edges.filter((e) => e[0] === d.at).map((e) => d.nodes[e[1]]));

// Enemigos de una pelea: élite y guardiana, las del bioma; las peleas comunes mezclan la fauna del bioma
// (`foes` en BIOMES) para que cada sala sea distinta.
export function enemiesFor(node, biomeId, rng = Math.random) {
  const biome = BIOMES[biomeId];
  if (node.type === 'jefe') return [biome.boss];
  if (node.type === 'elite') return [biome.elite];
  const pool = biome.foes ?? ['larva'], n = 2 + (node.layer > 2 ? 1 : 0);
  return Array.from({ length: n }, () => pool[Math.floor(rng() * pool.length)]);
}

export const enemyHpMul = (node) => 1 + node.layer * 0.06;
