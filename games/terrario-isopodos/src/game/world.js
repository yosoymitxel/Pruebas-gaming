// Mapa exterior: archipiélago de islas flotantes, regenerado cada día (menos el terrario).
import { BIOMES, WEATHERS, VESSEL_BY_KIND } from '../data/world.js';
import { mulberry32, pickFrom } from '../core/rng.js';

export function genArchipelago(seed, day) {
  const rng = mulberry32(seed * 977 + day);
  const islands = [{ id: 'hogar', kind: 'hogar', x: 0.5, y: 0.78, r: 0.13, biome: 'hojarasca', weather: pickFrom(rng, Object.keys(WEATHERS)), vessel: 'tanque', seed: seed }];
  const kinds = ['recoleccion', 'recoleccion', 'nido', rng() < 0.5 ? 'nido' : 'recoleccion'];
  kinds.forEach((kind, i) => {
    for (let tries = 0; tries < 200; tries++) { // separación con sitio para el rótulo de debajo
      const isl = {
        id: `${kind}-${i}`, kind, x: 0.15 + rng() * 0.7, y: 0.1 + rng() * 0.5, r: 0.07 + rng() * 0.04,
        biome: pickFrom(rng, Object.keys(BIOMES)), weather: pickFrom(rng, Object.keys(WEATHERS)),
        vessel: pickFrom(rng, VESSEL_BY_KIND[kind]), seed: Math.floor(rng() * 1e9),
      };
      if (islands.every((o) => Math.hypot(o.x - isl.x, (o.y - isl.y) * 1.4) > o.r + isl.r + 0.14)) { islands.push(isl); break; }
    }
  });
  return islands;
}
