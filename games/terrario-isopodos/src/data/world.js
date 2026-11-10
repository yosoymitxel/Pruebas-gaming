// Archipiélago: tipos de isla, climas y nodos del mapa de expedición.
import { localize } from '../i18n/index.js';

// Islas del mapa exterior. `kind`: hogar (terrario), recoleccion (minijuego), nido (expedición).
export const ISLAND_KINDS = localize('islandKinds', {
  hogar: { name: 'Terrario', desc: 'Tu colonia.' },
  recoleccion: { name: 'Isla de recolección', desc: 'Recoge antes de que acabe el tiempo.' },
  nido: { name: 'Nido de aberraciones', desc: 'Capas hasta la guardiana.' },
});

// Recipientes: el terrario es la referencia, pero fuera de casa también hay dioramas al aire.
export const VESSELS = localize('vessels', {
  tanque: { name: 'Tanque' },
  frasco: { name: 'Frasco' },
  globo: { name: 'Globo de cristal' },
  diorama: { name: 'Diorama flotante' },
});
// Qué recipientes puede tocarle a cada tipo de isla (al azar por semilla).
export const VESSEL_BY_KIND = { hogar: ['tanque'], recoleccion: ['frasco', 'diorama', 'diorama'], nido: ['globo', 'diorama'] };

// Biomas de isla: recursos que abundan y jefe que guarda el nido.
export const BIOMES = localize('biomes', {
  hojarasca: { name: 'Bosque de hojarasca', loot: ['hojarasca', 'hojarasca', 'musgo', 'cal'], boss: 'gemela', elite: 'bufon' },
  pantano: { name: 'Pantano de esporas', loot: ['esporas', 'musgo', 'musgo', 'ambar'], boss: 'comensal', elite: 'segador' },
  roca: { name: 'Roca de cal', loot: ['cal', 'cal', 'ambar', 'hojarasca'], boss: 'gemela', elite: 'segador' },
});

// `yield` multiplica lo que se recoge; `gloom` tiñe la escena hacia la paleta de terror (0–1).
export const WEATHERS = localize('weathers', {
  claro: { name: 'Claro', yield: 1, gloom: 0 },
  niebla: { name: 'Niebla', yield: 1.2, gloom: 0.45 },
  lluvia: { name: 'Lluvia', yield: 1.5, gloom: 0.3 },
});

// Formas de las islas de recolección (game/gather.js): cada una pide moverse distinto.
export const GATHER_SHAPES = localize('gatherShapes', {
  meseta: { name: 'Meseta', hint: 'Sube escalón a escalón: arriba está el ámbar.' },
  escalinata: { name: 'Escalinata', hint: 'Una escalera de terrazas de punta a punta.' },
  islotes: { name: 'Islotes', hint: 'Salta entre islotes; si caes, vuelves atrás.' },
  anillo: { name: 'Anillo', hint: 'Un pozo en medio: rodéalo por las terrazas.' },
  cresta: { name: 'Cresta', hint: 'Una cresta alta cruza la isla.' },
});

// Fases del día (reloj 0–1, 0 = amanecer). De noche las piezas producen la mitad, la colonia se inquieta
// y cada viaje cuesta tiempo (TRIP_COST); dormir salta al amanecer siguiente.
export const DAY_PHASES = localize('dayPhases', {
  amanecer: { name: 'Amanecer', until: 0.08, prodMul: 1, fear: 0 },
  dia: { name: 'Día', until: 0.6, prodMul: 1, fear: 0 },
  atardecer: { name: 'Atardecer', until: 0.72, prodMul: 1, fear: 0 },
  noche: { name: 'Noche', until: 1, prodMul: 0.5, fear: 0.002, night: true },
});
export const DAY_SECONDS = 300;
export const TRIP_COST = { recoleccion: 0.12, nido: 0.25 };

// `icon`: nombre en src/ui/icons.js.
export const NODE_TYPES = localize('nodeTypes', {
  combate: { desc: 'Larvas de tinta: dos o tres.', name: 'Combate', icon: 'combate' },
  elite: { desc: 'Una aberración fuerte.', name: 'Élite', icon: 'elite' },
  botin: { desc: 'Recursos y quizá un isópodo.', name: 'Botín', icon: 'botin' },
  refugio: { desc: 'Recupera media vida.', name: 'Refugio', icon: 'refugio' },
  carta: { desc: 'Una carta de tres.', name: 'Carta', icon: 'carta' },
  jefe: { desc: 'Si cae, el nido es tuyo.', name: 'Guardiana', icon: 'jefe' },
});
