// Aberraciones (dibujos a tinta del dueño, ~19 previstas). Añadir una = una entrada aquí + su dibujo en
// art/aberraciones/. `role`: normal | elite | jefe (provisional). `art` relativo a la carpeta del juego.
import { localize } from '../i18n/index.js';

export const ROLES = ['normal', 'elite', 'jefe'];

export const ABERRATIONS = localize('aberrations', {
  gemela: { name: 'La Gemela', role: 'jefe', art: 'art/aberraciones/la-gemela.webp',
    pattern: 'Dos cabezas con vida propia: zarpazos y un grito que baja la calma.' },
  comensal: { name: 'El Comensal', role: 'jefe', art: 'art/aberraciones/el-comensal.webp',
    pattern: 'La boca solo es débil abierta; los tentáculos atrapan a un isópodo.' },
  bufon: { name: 'El Bufón', role: 'elite', art: 'art/aberraciones/el-bufon.webp',
    pattern: 'Se agacha y embiste en línea recta; queda clavado tras fallar.' },
  segador: { name: 'El Segador', role: 'elite', art: 'art/aberraciones/el-segador.webp',
    pattern: 'Invoca larvas y siega en arco; sus ojos se apagan uno a uno.' },
});
