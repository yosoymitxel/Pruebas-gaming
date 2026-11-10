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
  acaro: {
    name: 'Ácaro rojo', role: 'normal', sprite: 'proc:acaro', height: 0.9, radius: 0.28,
    hp: 32, stagger: 30, speed: 2.6,
    pattern: 'Rápido y en grupo: muerde poco pero seguido.',
    attacks: [{ kind: 'slash', windup: 0.4, recover: 0.35, damage: 5, range: 0.9, arc: 1.2, cooldown: 0.9 }],
  },
  cienpies: {
    name: 'Ciempiés', role: 'normal', sprite: 'proc:cienpies', height: 1.3, radius: 0.45,
    hp: 95, stagger: 70, speed: 1.9,
    pattern: 'Se encoge y embiste en línea; esquívalo de lado y castígalo clavado.',
    attacks: [
      { kind: 'charge', windup: 0.65, recover: 1, damage: 15, range: 5, cooldown: 2.6, pressure: true },
      { kind: 'slash', windup: 0.45, recover: 0.4, damage: 8, range: 1.2, arc: 1, cooldown: 1.3 },
    ],
  },
  arana: {
    name: 'Araña de saco', role: 'normal', sprite: 'proc:arana', height: 1.6, radius: 0.5,
    hp: 85, stagger: 65, speed: 1.7,
    pattern: 'Lanza su tela y atrapa: cambia de isópodo para pegarle mientras retiene.',
    attacks: [
      { kind: 'grab', windup: 0.8, recover: 0.8, damage: 6, range: 4, hold: 2, cooldown: 4.5, pressure: true },
      { kind: 'slash', windup: 0.5, recover: 0.5, damage: 9, range: 1.3, arc: 1.4, cooldown: 1.5 },
    ],
  },
  mosca: {
    name: 'Mosquito del hongo', role: 'normal', sprite: 'proc:mosca', height: 1.2, radius: 0.32,
    hp: 45, stagger: 40, speed: 2.3,
    pattern: 'Zumba en cono y vacía la carga ATB; ataca antes de que zumbe.',
    attacks: [
      { kind: 'scream', windup: 0.7, recover: 0.7, damage: 4, range: 3, arc: 1.4, drain: 0.6, cooldown: 3.2, pressure: true },
      { kind: 'slash', windup: 0.4, recover: 0.4, damage: 6, range: 1, arc: 1, cooldown: 1.2 },
    ],
  },
  moho: {
    name: 'Moho andante', role: 'normal', sprite: 'proc:moho', height: 1.3, radius: 0.6,
    hp: 120, stagger: 90, speed: 1.1,
    pattern: 'Lento; se hincha y golpea alrededor: sal del círculo.',
    attacks: [{ kind: 'stomp', windup: 0.9, recover: 1.1, damage: 13, range: 1.8, cooldown: 2.4, pressure: true }],
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
