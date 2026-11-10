// Isópodos: clases de combate y nombres. Cada isópodo de la colonia tiene una clase y un color.
// `abilities` son ids de ABILITIES; los usa el jugador desde la pausa táctica.
import { localize } from '../i18n/index.js';

export const CLASSES = localize('classes', {
  rodador: { name: 'Rodador', hp: 70, damage: 7, speed: 3.4, abilities: ['embestida', 'rodada'] },
  guardian: { name: 'Guardián', hp: 95, damage: 5, speed: 3, abilities: ['caparazon', 'provocar'] },
  musgoso: { name: 'Musgoso', hp: 60, damage: 5, speed: 3.1, abilities: ['rocio', 'esporas'] },
});

// Colores de caparazón: claves de PALETTES.shells.
export const SHELLS = ['pizarra', 'naranja', 'leche', 'musgo', 'ciruela'];

export const NAMES = ['Bolita', 'Cal', 'Turrón', 'Pimienta', 'Ovillo', 'Guijarro', 'Miga', 'Tiza', 'Corcho',
  'Lenteja', 'Botón', 'Nuez', 'Hollín', 'Avena', 'Grafito', 'Canica'];
