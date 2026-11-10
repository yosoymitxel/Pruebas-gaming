// Estado completo de la partida (lo que se guarda): terrario, día y archipiélago del día.
// Las expediciones y la recolección viven en memoria hasta terminar.
import { newHome } from './home.js';
import { genArchipelago } from './world.js';
import { mulberry32 } from '../core/rng.js';

export function newGame(seed = Math.floor(Math.random() * 1e9)) {
  return { seed, day: 1, home: newHome(mulberry32(seed)), islands: genArchipelago(seed, 1), visited: [] };
}

// Cada viaje fuera (recolección o nido) consume la isla; al volver sin islas útiles empieza otro día.
export function visit(game, islandId) {
  if (!game.visited.includes(islandId)) game.visited.push(islandId);
  const left = game.islands.filter((i) => i.kind !== 'hogar' && !game.visited.includes(i.id));
  if (!left.length) nextDay(game);
}

export function nextDay(game) {
  game.day++;
  game.islands = genArchipelago(game.seed, game.day);
  game.visited = [];
}
