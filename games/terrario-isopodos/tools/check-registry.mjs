// Verificador de registros: node tools/check-registry.mjs
// Todo lo que crece se declara en src/data/; esto avisa cuando algo quedó a medias (un dibujo que
// no existe, un coste con un recurso inventado, una habilidad sin definir…). Sale con 1 si encuentra algo.
import { existsSync } from 'node:fs';
import { RESOURCES } from '../src/data/resources.js';
import { BUILDINGS, EXPANSIONS } from '../src/data/buildings.js';
import { ABERRATIONS, ROLES } from '../src/data/aberrations.js';
import { ABILITIES, ITEMS } from '../src/data/abilities.js';
import { CLASSES, SHELLS } from '../src/data/isopods.js';
import { CARDS } from '../src/data/cards.js';
import { BIOMES, WEATHERS, NODE_TYPES, ISLAND_KINDS } from '../src/data/world.js';
import { PALETTES, SHELL_COLORS } from '../src/data/palettes.js';
import { PROC_SPRITES } from '../src/view/sprites.js';
import { ICONS } from '../src/ui/icons.js';

const ATTACK_KINDS = ['slash', 'charge', 'scream', 'stomp', 'grab', 'summon'];
const ABILITY_KINDS = ['strike', 'burst', 'heal', 'shield', 'taunt'];

export function checkRegistry() {
  const errors = [];
  const fail = (m) => errors.push(m);
  const named = (kind, reg) => { for (const [id, x] of Object.entries(reg)) if (!x.name) fail(`${kind} ${id}: sin nombre`); };
  const costs = (where, cost) => { for (const r of Object.keys(cost ?? {})) if (!RESOURCES[r]) fail(`${where}: "${r}" no es un recurso`); };

  named('recurso', RESOURCES); named('pieza', BUILDINGS); named('aberración', ABERRATIONS); named('habilidad', ABILITIES);
  named('objeto', ITEMS); named('clase', CLASSES); named('carta', CARDS); named('bioma', BIOMES); named('clima', WEATHERS);
  named('nodo', NODE_TYPES); named('isla', ISLAND_KINDS);

  for (const [id, b] of Object.entries(BUILDINGS)) {
    if (!(b.size?.w >= 1 && b.size?.h >= 1)) fail(`pieza ${id}: tamaño inválido`);
    if (typeof b.solid !== 'boolean') fail(`pieza ${id}: falta solid`);
    costs(`pieza ${id}`, b.cost);
    if (b.produces && !RESOURCES[b.produces.res]) fail(`pieza ${id}: produce "${b.produces.res}", que no es un recurso`);
  }
  EXPANSIONS.forEach((e, i) => costs(`ampliación ${i}`, e.cost));

  const sprites = new URL('../assets/sprites/', import.meta.url);
  for (const [id, a] of Object.entries(ABERRATIONS)) {
    if (!ROLES.includes(a.role)) fail(`aberración ${id}: rol "${a.role}" desconocido`);
    if (a.sprite.startsWith('proc:') ? !PROC_SPRITES[a.sprite.slice(5)] : !existsSync(new URL(a.sprite, sprites))) fail(`aberración ${id}: no hay sprite ${a.sprite}`);
    for (const k of ['hp', 'stagger', 'speed', 'radius', 'height']) if (!(a[k] > 0)) fail(`aberración ${id}: ${k} inválido`);
    for (const at of a.attacks ?? []) {
      if (!ATTACK_KINDS.includes(at.kind)) fail(`aberración ${id}: ataque "${at.kind}" desconocido`);
      if (at.kind !== 'summon' && !(at.windup >= 0.4)) fail(`aberración ${id}: ${at.kind} sin anticipación legible (≥ 0,4 s)`);
      if (at.kind === 'summon' && !ABERRATIONS[at.spawn]) fail(`aberración ${id}: invoca "${at.spawn}", que no existe`);
    }
  }
  for (const [id, ab] of Object.entries({ ...ABILITIES, ...ITEMS })) if (!ABILITY_KINDS.includes(ab.kind)) fail(`habilidad/objeto ${id}: tipo "${ab.kind}" desconocido`);
  for (const [id, c] of Object.entries(CLASSES)) for (const ab of c.abilities) if (!ABILITIES[ab]) fail(`clase ${id}: habilidad "${ab}" no existe`);
  for (const s of SHELLS) if (!SHELL_COLORS[s]) fail(`caparazón ${s}: sin color`);
  for (const [id, b] of Object.entries(BIOMES)) {
    for (const r of b.loot) if (!RESOURCES[r]) fail(`bioma ${id}: botín "${r}" no es un recurso`);
    for (const k of ['boss', 'elite']) if (!ABERRATIONS[b[k]]) fail(`bioma ${id}: ${k} "${b[k]}" no existe`);
  }
  for (const [id, n] of Object.entries(NODE_TYPES)) if (!ICONS[n.icon]) fail(`nodo ${id}: icono "${n.icon}" no existe`);
  for (const k of Object.keys(ISLAND_KINDS)) if (!ICONS[k]) fail(`isla ${k}: sin icono`);
  for (const [id, c] of Object.entries(CARDS)) if (!c.desc || !c.mods) fail(`carta ${id}: falta descripción o efecto`);

  const keys = Object.keys(PALETTES.cozy).sort().join();
  for (const [id, p] of Object.entries(PALETTES)) {
    if (Object.keys(p).sort().join() !== keys) fail(`paleta ${id}: no tiene los mismos tokens que cozy`);
    for (const [k, v] of Object.entries(p)) if (!/^#[0-9a-f]{6}$/i.test(v)) fail(`paleta ${id}.${k}: color inválido`);
  }
  return errors;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const errors = checkRegistry();
  for (const e of errors) console.error(`✗ ${e}`);
  console.log(errors.length ? `${errors.length} problema(s)` : 'Registros OK');
  process.exit(errors.length ? 1 : 0);
}
