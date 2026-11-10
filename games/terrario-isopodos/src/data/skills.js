// Árbol de mudas: cada isópodo crece mudando (y mudar pide calcio). Dos filas: la de arriba se compra suelta,
// cada nodo de abajo pide el de encima. `col` = columna (0–2), `row` = fila. Efectos: hpMul, damageAdd,
// speedMul, o `ability` (una tercera habilidad según la clase, ids de ABILITIES).
import { localize } from '../i18n/index.js';

export const SKILLS = localize('skills', {
  coraza: { name: 'Coraza gruesa', desc: '+15 % vida', col: 0, row: 0, cost: { cal: 2 }, hpMul: 0.15 },
  mandibula: { name: 'Mandíbula', desc: '+2 daño', col: 1, row: 0, cost: { cal: 2, esporas: 1 }, damageAdd: 2 },
  patas: { name: 'Patas largas', desc: '+10 % velocidad', col: 2, row: 0, cost: { hojarasca: 3, cal: 1 }, speedMul: 0.1 },
  vigor: { name: 'Muda de vigor', desc: '+20 % vida', col: 0, row: 1, needs: 'coraza', cost: { cal: 3, ambar: 1 }, hpMul: 0.2 },
  instinto: { name: 'Instinto', desc: 'Nueva habilidad', col: 1, row: 1, needs: 'mandibula', cost: { cal: 2, ambar: 2 },
    ability: { rodador: 'impacto', guardian: 'muralla', musgoso: 'brote' } },
  carrera: { name: 'Carrera', desc: '+15 % velocidad · +2 daño', col: 2, row: 1, needs: 'patas', cost: { musgo: 3, ambar: 1 }, speedMul: 0.15, damageAdd: 2 },
});
