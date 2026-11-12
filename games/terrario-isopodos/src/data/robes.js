// Mantos para la expedición, como los vellones de Cult of the Lamb (wiki: Fleeces): cada uno cambia las reglas
// con una ventaja y un precio. Se desbloquean con ámbar en el terrario y se eligen al preparar la salida.
// `mods` se suma a los de las cartas (runMods); `cost`: desbloqueo (el común viene puesto).
import { localize } from '../i18n/index.js';

export const ROBES = localize('robes', {
  comun: { name: 'Caparazón de siempre', desc: 'Sin ventajas ni precio.', icon: 'shield', cost: null, mods: {} },
  dorado: { name: 'Caparazón dorado', desc: '+10 % de daño por cada muerte; se pierde al recibir un golpe y recibes un 25 % más.', icon: 'jefe', cost: { ambar: 3 },
    mods: { killStack: 0.1, incomingMul: 1.25 } },
  cristal: { name: 'Caparazón de cristal', desc: 'Habilidades +60 % y −40 % de ATB; golpe básico −40 % y vida −30 %.', icon: 'tactical', cost: { ambar: 3, esporas: 3 },
    mods: { abilityMul: 1.6, atbCostMul: 0.6, damageMul: 0.6, hpMul: 0.7 } },
  destino: { name: 'Caparazón del destino', desc: 'Empiezas con 4 cartas; no aparecen más.', icon: 'carta', cost: { ambar: 4 },
    mods: {}, startCards: 4, noCards: true },
  tozudo: { name: 'Caparazón tozudo', desc: 'Cura un 8 % tras cada sala y +5 % de vida; no puedes rodar.', icon: 'refugio', cost: { ambar: 2, cal: 4 },
    mods: { winHeal: 0.08, hpMul: 1.05, noRoll: true } },
  berserker: { name: 'Caparazón berserker', desc: 'Daño básico ×2,5; la vida baja a la mitad.', icon: 'attack', cost: { ambar: 5 },
    mods: { damageMul: 2.5, hpMul: 0.5 } },
});
