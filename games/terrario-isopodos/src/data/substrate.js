// Composición del terrario: capas de un terrario real, de abajo arriba, y el clima interior que producen.
// `costs[n]` = lo que cuesta subir del nivel n al n+1 (la longitud marca el máximo).
import { localize } from '../i18n/index.js';

export const LAYERS = localize('layers', {
  grava: { name: 'Grava de drenaje', desc: 'Más humedad sin encharcar.',
    costs: [{ cal: 2 }, { cal: 3, ambar: 1 }] },
  carbon: { name: 'Carbón vegetal', desc: 'El moho brota más lento.',
    costs: [{ esporas: 2, cal: 1 }, { esporas: 3, ambar: 1 }] },
  tierra: { name: 'Tierra', desc: 'Las piezas producen más.',
    costs: [{ musgo: 2, hojarasca: 2 }, { musgo: 3, hojarasca: 3 }, { musgo: 4, ambar: 1 }] },
  hojarasca: { name: 'Capa de hojarasca', desc: 'Menos hambre, más calma.',
    costs: [{ hojarasca: 4 }, { hojarasca: 6, musgo: 2 }] },
});

export const START_LAYERS = { grava: 1, carbon: 0, tierra: 1, hojarasca: 0 };

// Humedad: lo que aporta cada fuente (sumado a la base) y los umbrales que deciden el estado.
export const HUMIDITY = {
  base: 0.4,
  weather: { claro: -0.05, niebla: 0.05, lluvia: 0.15 },
  pieces: { charca: 0.18, huerto: 0.05, esfagno: 0.12, corcho: 0.02, tronco: 0.03 },
  mist: 0.15, // rociar (dura ZEN.mistTime y se va apagando)
  perGrava: 0.05, // la grava deja subir el techo sin encharcar
  dry: 0.45, wet: 0.8, flood: 0.9,
  // El sustrato no cambia de golpe: la humedad real va hacia la que piden las fuentes a este ritmo (por s).
  drift: 0.006,
  // Tapa: cerrada guarda el agua, con rejilla ventila algo, abierta seca rápido (la palanca para quitar humedad).
  lid: [0.08, -0.04, -0.2],
  // Gradiente: cuánto moja cada pieza a su alrededor (radio en celdas). Un buen terrario tiene un lado húmedo y uno seco.
  local: { charca: [0.28, 3], esfagno: [0.2, 2.5], huerto: [0.06, 2], tronco: [0.06, 2], corcho: [0.04, 1.5], piedra: [-0.08, 1.5], sepia: [-0.04, 1] },
  bands: { seco: [0, 0.5], ideal: [0.45, 0.8], humedo: [0.7, 1] },
};
export const LID_NAMES = ['Cerrada', 'Rejilla', 'Abierta'];

// Efecto de cada estado en el terrario. prodMul: producción; hungerMul: hambre; calm: calma.
// `fix`: cómo se arregla (capa a subir, piezas que añadir o pieza de la que hay demasiadas); el panel lo señala.
export const CLIMATES = localize('climates', {
  seco: { name: 'Seco', desc: 'Más hambre e inquietud.', fix: { lid: 0, pieces: ['charca', 'esfagno'] }, prodMul: 0.9, hungerMul: 1.5, calm: -0.15 },
  ideal: { name: 'Ideal', desc: 'Producción y calma al alza.', prodMul: 1.2, hungerMul: 1, calm: 0.1 },
  humedo: { name: 'Muy húmedo', desc: 'Al borde del moho.', fix: { lid: 2 }, prodMul: 1, hungerMul: 1, calm: 0 },
  moho: { name: 'Moho', desc: 'Baja producción y calma.', fix: { lid: 2, pieces: ['colembolos'] }, prodMul: 0.75, hungerMul: 1.1, calm: -0.2 },
});

// Gestos de cuidado (como el jardín zen de KureiChaosChess), en segundos de juego.
// Hojas que caen solas al terrario: una cada `leafEvery` s y nunca más de `leafMax` a la vez.
export const ZEN = { mistTime: 120, mistCooldown: 40, leafEvery: 150, leafMax: 2 };
// Moho: manchas que salen en celdas muy húmedas (más si hay comida pudriéndose); los colémbolos se las comen.
export const MOLD = { every: 30, max: 6, at: 0.78, calm: 0.04, eat: 25 };
// Mudas: quedan en el suelo y los isópodos se las comen (recuperan calcio): se convierten solas en cal.
export const MOLT_EATEN = 30;
// Casi todo el calcio de la muda lo recupera el propio isópodo: solo una parte queda como cal para ti.
export const MOLT_CAL = 0.34;
