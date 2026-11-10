// Aberraciones (dibujos a tinta del dueño, ~19 previstas). Añadir una = una entrada aquí + su dibujo.
// `role`: normal | elite | jefe. `sprite`: archivo en assets/sprites/ o `proc:<id>` (dibujado en
// código). `height`: alto del dibujo en celdas. `attacks`: lo interpreta src/game/combat.js según `kind`:
//   slash  golpe en cono delante (range, arc en radianes)
//   charge embestida en línea recta (range = distancia recorrida)
//   scream cono que además vacía ATB (drain)
//   stomp  golpe en círculo alrededor
//   grab   atrapa al objetivo en línea y le hace daño mientras lo retiene (hold s)
//   summon invoca `spawn` (hasta `max` a la vez)
// windup = anticipación visible (s), recover = tiempo vulnerable después (presionada si `pressure`).
import { localize } from '../i18n/index.js';

export const ROLES = ['normal', 'elite', 'jefe'];

export const ABERRATIONS = localize('aberrations', {
  larva: {
    name: 'Larva de tinta', role: 'normal', sprite: 'proc:larva', height: 1.25, radius: 0.35,
    hp: 60, stagger: 50, speed: 1.6,
    pattern: 'Se arrastra hasta ti y muerde.',
    attacks: [{ kind: 'slash', windup: 0.55, recover: 0.5, damage: 9, range: 1.1, arc: 1.2, cooldown: 1.4 }],
  },
  bufon: {
    name: 'El Bufón', role: 'elite', sprite: 'el-bufon.webp', height: 3.2, radius: 0.7,
    hp: 600, stagger: 220, speed: 2.1,
    pattern: 'Se agacha y embiste en línea recta; tras fallar queda clavado y presionado.',
    attacks: [
      { kind: 'charge', windup: 0.8, recover: 1.4, damage: 27, range: 7, cooldown: 3.5, pressure: true },
      { kind: 'slash', windup: 0.5, recover: 0.6, damage: 16, range: 2, arc: 1.6, cooldown: 1.6 },
    ],
  },
  segador: {
    name: 'El Segador', role: 'elite', sprite: 'el-segador.webp', height: 2.8, radius: 0.8,
    hp: 650, stagger: 240, speed: 1.4,
    pattern: 'Siega en arco amplio e invoca larvas; tras la siega amplia queda presionado.',
    attacks: [
      { kind: 'slash', windup: 0.9, recover: 1.2, damage: 24, range: 2.8, arc: 2.6, cooldown: 2.6, pressure: true },
      { kind: 'summon', windup: 1.0, recover: 0.6, spawn: 'larva', count: 2, max: 3, cooldown: 9 },
    ],
  },
  gemela: {
    name: 'La Gemela', role: 'jefe', sprite: 'la-gemela.webp', height: 4.2, radius: 0.9,
    hp: 1400, stagger: 380, speed: 1.6,
    pattern: 'Zarpazos con la cabeza viva; la cabeza colgante grita y vacía tu ATB.',
    attacks: [
      { kind: 'slash', windup: 0.6, recover: 0.7, damage: 21, range: 2.4, arc: 1.8, cooldown: 1.8 },
      { kind: 'scream', windup: 1.1, recover: 1.5, damage: 12, range: 5, arc: 1.2, drain: 1, cooldown: 7, pressure: true },
      { kind: 'charge', windup: 0.9, recover: 1.0, damage: 30, range: 6, cooldown: 6 },
    ],
  },
  comensal: {
    name: 'El Comensal', role: 'jefe', sprite: 'el-comensal.webp', height: 4, radius: 1.1,
    hp: 1600, stagger: 420, speed: 1.1,
    pattern: 'Atrapa con un tentáculo, pisotea alrededor e invoca larvas; tras pisotear queda presionado.',
    attacks: [
      { kind: 'grab', windup: 0.9, recover: 0.8, damage: 8, range: 5, hold: 1.6, cooldown: 6 },
      { kind: 'stomp', windup: 1.0, recover: 1.4, damage: 26, range: 2.6, cooldown: 3.2, pressure: true },
      { kind: 'summon', windup: 1.0, recover: 0.6, spawn: 'larva', count: 2, max: 3, cooldown: 12 },
    ],
  },
});
