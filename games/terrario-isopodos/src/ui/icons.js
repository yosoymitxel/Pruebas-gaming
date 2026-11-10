// Iconos a tinta (24×24, trazo redondeado). Fuente única: interfaz, nodos del nido y archipiélago los
// piden por nombre; check-registry comprueba que los nombres usados en src/data existen aquí.
import { html } from './lib.js';

export const ICONS = {
  build: 'M14 3l7 7-3 3-7-7z M11 6L3 21 M7 14l3 3',
  colony: 'M3 16a9 7 0 0 1 18 0z M7 16v-4 M11 16V9.5 M15 16v-5 M21 14l2-2.5',
  out: 'M8 3h8 M9 3v3 M15 3v3 M6 9a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z M6 14c4-2 8 2 12 0',
  menu: 'M4 7h16 M4 12h16 M4 17h16',
  turnLeft: 'M5 12a7 7 0 1 0 2.5-5.4 M4 4v5h5',
  turnRight: 'M19 12a7 7 0 1 1-2.5-5.4 M20 4v5h-5',
  zoomIn: 'M12 5v14 M5 12h14',
  zoomOut: 'M5 12h14',
  attack: 'M5 19L19 5 M10 20L20 10 M4 14L14 4',
  roll: 'M12 4a8 8 0 1 1-7.5 5.2 M12 8.5a3.5 3.5 0 1 1-3.2 2',
  tactical: 'M7 3h10 M7 21h10 M8 3c0 5 8 5 8 9s-8 4-8 9 M16 3c0 5-8 5-8 9s8 4 8 9',
  back: 'M19 12H5 M11 6l-6 6 6 6',
  combate: 'M5 5l14 14 M19 5L5 19 M3 8l5-5 M16 21l5-5',
  elite: 'M6 10a6 6 0 1 1 12 0v4h-3v3H9v-3H6z M9.5 10.5h0 M14.5 10.5h0',
  botin: 'M6 4h12l3 5-9 11L3 9z M3 9h18 M9 4l3 5 3-5',
  refugio: 'M19 14.5A8 8 0 1 1 9.5 5a6 6 0 0 0 9.5 9.5z',
  carta: 'M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z M12 8l2.5 4-2.5 4-2.5-4z',
  jefe: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  hogar: 'M4 6h16v13H4z M4 13c4-2 6 1 8 0s4-2 8 0 M3 21h18',
  recoleccion: 'M12 21V11 M12 13C8 13 5 10 5 6c4 0 7 3 7 7z M12 11c0-4 3-7 7-7 0 4-3 7-7 7z',
  nido: 'M12 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16z M5 14c3 1 11 1 14 0 M9 21h6 M10 9h0 M14 9h0',
  items: 'M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z',
  shield: 'M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z M12 7v10',
  leaf: 'M5 19C5 9 11 5 20 4c-1 9-5 15-15 15z M5 19l9-9',
  gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z M12 2v3 M12 19v3 M2 12h3 M19 12h3 M4.9 4.9l2.1 2.1 M17 17l2.1 2.1 M4.9 19.1L7 17 M17 7l2.1-2.1',
  expand: 'M4 9V4h5 M20 9V4h-5 M4 15v5h5 M20 15v5h-5',
  layers: 'M4 5h16v15H4z M4 9c3-1 5 1 8 0s5-1 8 0 M4 13h16 M4 16.5h16',
};

// Corrección de centro óptico medida con icon-metrics (web-game-toolkit): centro dentro de ±0,03.
const SHIFT = { refugio: [2.4, -2.2], botin: [0, 2.5], hogar: [0, -2.2], elite: [0, 1.2], build: [0, 1.2], colony: [0, -1], recoleccion: [0, 2.2],
  turnLeft: [1.1, 0.9], turnRight: [-0.9, 0.9], back: [1.6, 0], roll: [-0.5, -0.8] };
const at = (name) => (SHIFT[name] ? `translate(${SHIFT[name][0]} ${SHIFT[name][1]})` : null);

export const Icon = ({ name, size = 22, label }) => html`<svg class="icon" width=${size} height=${size} viewBox="0 0 24 24"
  fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"
  role=${label ? 'img' : null} aria-label=${label} aria-hidden=${label ? null : 'true'}><path d=${ICONS[name]} transform=${at(name)} /></svg>`;

// Para dibujar dentro de otro SVG (nodos del mapa): centrado en (x, y), de lado `size`.
export const IconAt = ({ name, x, y, size }) => html`<path class="icon-path" d=${ICONS[name]}
  transform=${`translate(${x - size / 2} ${y - size / 2}) scale(${size / 24}) ${at(name) ?? ''}`} fill="none" stroke-width=${2.4} stroke-linecap="round" stroke-linejoin="round" />`;
