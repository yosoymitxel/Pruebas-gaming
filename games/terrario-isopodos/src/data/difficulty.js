// Dificultades del combate: multiplican la vida y el daño de las aberraciones. `normal` es el balance
// que comprueba combat-selfcheck; las otras dos escalan alrededor.
import { localize } from '../i18n/index.js';

export const DIFFICULTIES = localize('difficulties', {
  facil: { name: 'Fácil', hp: 0.75, dmg: 0.65 },
  normal: { name: 'Normal', hp: 1, dmg: 1 },
  dificil: { name: 'Difícil', hp: 1.3, dmg: 1.35 },
});
