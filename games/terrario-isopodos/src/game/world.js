// Mapa exterior: archipiélago de islas flotantes, regenerado cada día (menos el terrario).
import { BIOMES, WEATHERS } from '../data/world.js';
import { mulberry32, pickFrom } from '../core/rng.js';

export function genArchipelago(seed, day) {
  const rng = mulberry32(seed * 977 + day);
  const islands = [{ id: 'hogar', kind: 'hogar', x: 0.5, y: 0.78, r: 0.13, biome: 'hojarasca', weather: pickFrom(rng, Object.keys(WEATHERS)), seed: seed }];
  const kinds = ['recoleccion', 'recoleccion', 'nido', rng() < 0.5 ? 'nido' : 'recoleccion'];
  kinds.forEach((kind, i) => {
    for (let tries = 0; tries < 60; tries++) {
      const isl = {
        id: `${kind}-${i}`, kind, x: 0.15 + rng() * 0.7, y: 0.1 + rng() * 0.5, r: 0.07 + rng() * 0.04,
        biome: pickFrom(rng, Object.keys(BIOMES)), weather: pickFrom(rng, Object.keys(WEATHERS)),
        seed: Math.floor(rng() * 1e9),
      };
      if (islands.every((o) => Math.hypot(o.x - isl.x, o.y - isl.y) > o.r + isl.r + 0.06)) { islands.push(isl); break; }
    }
  });
  return islands;
}
