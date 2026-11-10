// Estado completo de la partida (lo que se guarda): terrario, día y archipiélago del día.
// Las expediciones y la recolección viven en memoria hasta terminar.
import { newHome } from './home.js';
import { genArchipelago } from './world.js';
import { mulberry32 } from '../core/rng.js';
import { DAY_PHASES, DAY_SECONDS, TRIP_COST } from '../data/world.js';

export function newGame(seed = Math.floor(Math.random() * 1e9)) {
  return { seed, day: 1, clock: 0.1, home: newHome(mulberry32(seed)), islands: genArchipelago(seed, 1), visited: [] };
}

// Cada viaje fuera (recolección o nido) consume la isla y gasta parte del día.
export function visit(game, islandId) {
  if (!game.visited.includes(islandId)) game.visited.push(islandId);
  const isl = game.islands.find((i) => i.id === islandId);
  passTime(game, TRIP_COST[isl?.kind] ?? 0);
}

export const dayPhase = (game) => Object.keys(DAY_PHASES).find((k) => (game.clock ?? 0) < DAY_PHASES[k].until) ?? 'noche';

// El reloj avanza en segundos de juego (tick) o en fracciones de día (viajes). Al pasar de 1 empieza otro día.
export function passTime(game, days) {
  game.clock = (game.clock ?? 0.1) + days;
  while (game.clock >= 1) { game.clock -= 1; nextDay(game); }
}
export const tickClock = (game, dt) => passTime(game, dt / DAY_SECONDS);

// Dormir: salta al amanecer del día siguiente (la colonia descansa y se calma).
export function sleep(game) {
  passTime(game, 1 - game.clock + DAY_PHASES.amanecer.until / 2);
  game.home.fear = 0;
}

export function nextDay(game) {
  game.day++;
  game.islands = genArchipelago(game.seed, game.day);
  game.visited = [];
}
