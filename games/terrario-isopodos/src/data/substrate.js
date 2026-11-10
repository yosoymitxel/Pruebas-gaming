// Composición del terrario: capas de un terrario real, de abajo arriba, y el clima interior que producen.
// `costs[n]` = lo que cuesta subir del nivel n al n+1 (la longitud marca el máximo).
import { localize } from '../i18n/index.js';

export const LAYERS = localize('layers', {
  grava: { name: 'Grava de drenaje', desc: 'Evita que el agua se estanque: con más grava, más humedad sin encharcar.',
    costs: [{ cal: 2 }, { cal: 3, ambar: 1 }] },
  carbon: { name: 'Carbón vegetal', desc: 'Filtra y frena el moho cuando el terrario está muy húmedo.',
    costs: [{ esporas: 2, cal: 1 }, { esporas: 3, ambar: 1 }] },
  tierra: { name: 'Tierra', desc: 'Sustrato vivo: las piezas producen más rápido.',
    costs: [{ musgo: 2, hojarasca: 2 }, { musgo: 3, hojarasca: 3 }, { musgo: 4, ambar: 1 }] },
  hojarasca: { name: 'Capa de hojarasca', desc: 'Comida y escondite en el suelo: la colonia pasa menos hambre y está más tranquila.',
    costs: [{ hojarasca: 4 }, { hojarasca: 6, musgo: 2 }] },
});

export const START_LAYERS = { grava: 1, carbon: 0, tierra: 1, hojarasca: 0 };

// Humedad: lo que aporta cada fuente (sumado a la base) y los umbrales que deciden el estado.
export const HUMIDITY = {
  base: 0.4,
  weather: { claro: -0.05, niebla: 0.05, lluvia: 0.15 },
  pieces: { charca: 0.18, huerto: 0.05 },
  perGrava: 0.05, // la grava deja subir el techo sin encharcar
  dry: 0.45, wet: 0.8, flood: 0.9,
};

// Efecto de cada estado en el terrario. prodMul: producción; hungerMul: hambre; calm: calma.
export const CLIMATES = localize('climates', {
  seco: { name: 'Seco', desc: 'Les cuesta mudar: pasan más hambre y están inquietos.', prodMul: 0.9, hungerMul: 1.5, calm: -0.15 },
  ideal: { name: 'Ideal', desc: 'Mudan sanos: producción y calma al alza.', prodMul: 1.2, hungerMul: 1, calm: 0.1 },
  humedo: { name: 'Muy húmedo', desc: 'Al borde del moho; el carbón lo mantiene a raya.', prodMul: 1, hungerMul: 1, calm: 0 },
  moho: { name: 'Moho', desc: 'Sin carbón suficiente, el moho baja la producción y la calma.', prodMul: 0.75, hungerMul: 1.1, calm: -0.2 },
});
