// Piso de un nivel de pelea (como las mazmorras de Cult of the Lamb): un camino principal de salas que
// acaba en el encuentro del nivel (élite, guardiana o la pelea fuerte) y salas laterales colgando del camino,
// casi siempre peleas y a veces botín, una carta o una reliquia. El mapa de niveles elige el piso; dentro,
// las puertas eligen la sala. Coordenadas de rejilla para el minimapa: el camino va hacia la derecha.
import { mulberry32 } from '../core/rng.js';

export const ROOM_TYPES = ['pelea', 'botin', 'carta', 'reliquia'];
const SIDE_ODDS = [['pelea', 0.55], ['botin', 0.2], ['carta', 0.13], ['reliquia', 0.12]];
const MAIN = { combate: 2, elite: 3, jefe: 2 };

export function genFloor(nodeType, seed) {
  const rng = mulberry32(seed * 13 + 5), n = MAIN[nodeType] ?? 2, rooms = [];
  const add = (r) => { const room = { id: rooms.length, links: [], done: false, ...r }; rooms.push(room); return room; };
  const link = (a, b) => { a.links.push(b.id); b.links.push(a.id); };
  let prev = null;
  for (let k = 0; k < n; k++) {
    const r = add({ type: 'pelea', x: k, y: 0, main: true, final: k === n - 1 });
    if (prev) link(prev, r);
    prev = r;
  }
  // Laterales: de 1 a 3, arriba o abajo de una sala del camino que no sea la final (a veces encadenadas).
  const sides = 1 + Math.floor(rng() * 3), used = new Set(rooms.map((r) => `${r.x},${r.y}`));
  for (let k = 0, made = 0; made < sides && k < 40; k++) {
    const from = rooms[Math.floor(rng() * rooms.length)];
    if (from.final) continue;
    const y = from.y + (rng() < 0.5 ? -1 : 1);
    if (used.has(`${from.x},${y}`)) continue;
    made++;
    used.add(`${from.x},${y}`);
    let roll = rng(), type = 'pelea';
    for (const [t, p] of SIDE_ODDS) { if (roll < p) { type = t; break; } roll -= p; }
    link(from, add({ type, x: from.x, y, main: false, final: false }));
  }
  return { rooms, at: 0 };
}

// Salas a las que se puede ir desde la actual (por sus puertas).
export const doors = (floor) => floor.rooms[floor.at].links.map((id) => floor.rooms[id]);
