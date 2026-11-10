// Logros (como en KureiChaosChess): hitos armados con lo que el juego ya hace. Los otorga game/meta.js cuando
// pasa el evento del mismo nombre; los grupos ordenan la pantalla de Galería.
import { localize } from '../i18n/index.js';

export const ACHIEVEMENT_GROUPS = ['Terrario', 'Colonia', 'Expedición', 'Exploración'];

export const ACHIEVEMENTS = localize('achievements', [
  { id: 'build', group: 'Terrario', name: 'Primera pieza', desc: 'Coloca una pieza en el terrario.', icon: 'build' },
  { id: 'upgrade', group: 'Terrario', name: 'Bien cuidado', desc: 'Mejora una pieza.', icon: 'expand' },
  { id: 'maxed', group: 'Terrario', name: 'Obra maestra', desc: 'Lleva una pieza al nivel máximo.', icon: 'elite' },
  { id: 'mist', group: 'Terrario', name: 'Rocío', desc: 'Rocía el terrario.', icon: 'items' },
  { id: 'expand', group: 'Terrario', name: 'Más sitio', desc: 'Amplía el terrario.', icon: 'expand' },
  { id: 'ball', group: 'Colonia', name: 'Bolita', desc: 'Toca un isópodo que se haga bolita.', icon: 'roll' },
  { id: 'molt', group: 'Colonia', name: 'Muda', desc: 'Recoge una muda: calcio para la colonia.', icon: 'shield' },
  { id: 'baby', group: 'Colonia', name: 'Manca', desc: 'Nace una cría en el terrario.', icon: 'colony' },
  { id: 'species5', group: 'Colonia', name: 'Coleccionista', desc: 'Ten cinco especies distintas en la colonia.', icon: 'colony' },
  { id: 'sleep', group: 'Colonia', name: 'Buenas noches', desc: 'Duerme hasta el alba.', icon: 'refugio' },
  { id: 'elite', group: 'Expedición', name: 'Élite caída', desc: 'Vence a una élite.', icon: 'elite' },
  { id: 'boss', group: 'Expedición', name: 'Nido en silencio', desc: 'Vence a una guardiana.', icon: 'jefe' },
  { id: 'side', group: 'Expedición', name: 'Por los pasillos', desc: 'Entra en tres salas laterales.', icon: 'carta' },
  { id: 'combo10', group: 'Expedición', name: 'Racha', desc: 'Encadena diez golpes seguidos.', icon: 'attack' },
  { id: 'relic', group: 'Expedición', name: 'Reliquia', desc: 'Encuentra una reliquia.', icon: 'items' },
  { id: 'top', group: 'Exploración', name: 'En la cima', desc: 'Recoge ámbar en lo más alto de una isla.', icon: 'jump' },
  { id: 'nofall', group: 'Exploración', name: 'Pie firme', desc: 'Termina una recolección sin caer.', icon: 'recoleccion' },
  { id: 'rescue', group: 'Exploración', name: 'Rescate', desc: 'Rescata a un isópodo perdido.', icon: 'leaf' },
]);
