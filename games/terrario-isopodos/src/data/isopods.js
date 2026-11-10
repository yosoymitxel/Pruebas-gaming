// Isópodos: clases de combate (el papel en el equipo) y nombres. La especie (aspecto, bolita, clima) va en
// species.js.
// `abilities` son ids de ABILITIES; los usa el jugador desde la pausa táctica.
import { localize } from '../i18n/index.js';

export const CLASSES = localize('classes', {
  rodador: { name: 'Rodador', hp: 70, damage: 7, speed: 3.4, abilities: ['embestida', 'rodada'] },
  guardian: { name: 'Guardián', hp: 95, damage: 5, speed: 3, abilities: ['caparazon', 'provocar'] },
  musgoso: { name: 'Musgoso', hp: 60, damage: 5, speed: 3.1, abilities: ['rocio', 'esporas'] },
});


export const NAMES = ['Bolita', 'Cal', 'Turrón', 'Pimienta', 'Ovillo', 'Guijarro', 'Miga', 'Tiza', 'Corcho',
  'Lenteja', 'Botón', 'Nuez', 'Hollín', 'Avena', 'Grafito', 'Canica'];
