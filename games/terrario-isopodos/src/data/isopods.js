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

// Qué está haciendo cada isópodo en el terrario (icono + palabra en la colonia y sobre su cabeza).
export const STATUS = localize('isoStatus', {
  explora: { name: 'Explora', icon: 'eye' },
  comer: { name: 'Va a comer', icon: 'eat' },
  come: { name: 'Come', icon: 'eat' },
  hambre: { name: 'Hambre', icon: 'eat', warn: true },
  dormir: { name: 'Va a dormir', icon: 'refugio' },
  humedad: { name: 'Busca humedad', icon: 'items' },
  duerme: { name: 'Duerme', icon: 'refugio' },
  reunion: { name: 'En la reunión', icon: 'colony' },
  construye: { name: 'Construye', icon: 'build' },
  trabaja: { name: 'Trabaja', icon: 'recoleccion' },
  bolita: { name: 'Bolita', icon: 'roll' },
  muda: { name: 'Muda', icon: 'shield' },
  cria: { name: 'Cría', icon: 'colony' },
});

// Distintivos que el jugador pone a su isópodo (banderín sobre la cabeza); índice en BADGES de palettes.js.
export const MAX_NAME = 14;
