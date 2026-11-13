// Efectos de píxel (pixelfx, en src/vendor/pixelfx) por tipo de golpe o evento. `h`: alto en el mundo;
// `lift`: altura sobre el punto; `life`: corte para los que se repiten (status). La rampa de tinta y óxido
// pone los golpes en la paleta del juego (regla de pixel-studio: color por rampas, no sueltos).
import { PALETTES } from './palettes.js';

const C = PALETTES.cozy;
const INKFIRE = [C.ink, '#5a1d16', C.rust, '#e0603a', C.amber, '#f7d98a', C.paper];

export const PIXEL_VFX = {
  hit: { fx: 'impacts/hit-spark', h: 1.2, lift: 0.1, palette: INKFIRE },
  heavy: { fx: 'impacts/crit-hit', h: 2.2, lift: 0, palette: INKFIRE },
  hurt: { fx: 'impacts/blunt-hit', h: 1.4, lift: 0 },
  death: { fx: 'spawn/poof', h: 2, lift: -0.3 },
  spark: { fx: 'status/confused', h: 1, lift: 0.9, life: 1.6 },
  // holy/heal pinta su muñeco de prueba (un caballero) encima: aquí se usa un estallido sin personaje.
  heal: { fx: 'pickups/collect-burst', h: 1.4, lift: -0.1, palette: ['#0d2416', '#1b4a2a', '#2f7a43', '#4fa35e', '#7fcf7a', '#b9eea4', '#e6ffd8', '#ffffff'] },
  mimo: { fx: 'pickups/collect-burst', h: 1.3, lift: 0 },
  pickup: { fx: 'pickups/collect-burst', h: 1.5, lift: -0.2 },
  build: { fx: 'impacts/heavy-landing', h: 1.1, lift: -0.2 },
  dust: { fx: 'impacts/heavy-landing', h: 0.8, lift: -0.25 }, // al caer de un salto
  jump: { fx: 'spawn/poof', h: 0.7, lift: -0.3 }, // al despegar
  boss: { fx: 'shadow/hex-sigil', h: 3.2, lift: -0.2 },
};
