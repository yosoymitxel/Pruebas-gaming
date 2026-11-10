// Ejemplo de registro: lo que crece en el juego se declara aquí y solo aquí. Añadir un tipo = una entrada.
// `value`: puntos; `weight`: cuántas aparecen en proporción; `color`: clave de PALETTE.
import { localize } from '../i18n/index.js';

export const COLLECTIBLES = localize('collectibles', {
  semilla: { name: 'Semilla', value: 1, weight: 6, color: 'good' },
  ambar: { name: 'Ámbar', value: 3, weight: 2, color: 'accent' },
});
