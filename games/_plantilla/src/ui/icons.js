// Iconos a tinta (24×24, trazo redondeado). Fuente única de iconografía: se piden por nombre.
import { html } from './lib.js';

export const ICONS = {
  play: 'M7 4l13 8-13 8z',
  pause: 'M8 5v14 M16 5v14',
  back: 'M15 5l-7 7 7 7',
  turnLeft: 'M5 12a7 7 0 1 0 2.5-5.4 M4 4v5h5',
  turnRight: 'M19 12a7 7 0 1 1-2.5-5.4 M20 4v5h-5',
};

export const Icon = ({ name, size = 22 }) => html`<svg class="icon" width=${size} height=${size} viewBox="0 0 24 24" fill="none"
  stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d=${ICONS[name]} /></svg>`;
