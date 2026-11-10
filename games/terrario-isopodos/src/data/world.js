// Archipiélago: tipos de isla, climas y nodos del mapa de expedición.
import { localize } from '../i18n/index.js';

// Islas del mapa exterior. `kind`: hogar (terrario), recoleccion (minijuego), nido (expedición).
export const ISLAND_KINDS = localize('islandKinds', {
  hogar: { name: 'Terrario', desc: 'Tu colonia. Construye, alimenta y prepara al equipo.' },
  recoleccion: { name: 'Isla de recolección', desc: 'Recoge recursos antes de que se acabe el tiempo.' },
  nido: { name: 'Nido de aberraciones', desc: 'Expedición por capas hasta su guardiana.' },
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

// `icon`: nombre en src/ui/icons.js.
export const NODE_TYPES = localize('nodeTypes', {
  combate: { name: 'Combate', icon: 'combate' },
  elite: { name: 'Élite', icon: 'elite' },
  botin: { name: 'Botín', icon: 'botin' },
  refugio: { name: 'Refugio', icon: 'refugio' },
  carta: { name: 'Carta', icon: 'carta' },
  jefe: { name: 'Guardiana', icon: 'jefe' },
});
