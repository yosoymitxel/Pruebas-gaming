// Verificador de registros: node tools/check-registry.mjs
// Todo lo que crece se declara en src/data/; esto avisa cuando algo quedó a medias (un dibujo que
// no existe, un coste con un recurso inventado, una habilidad sin definir…). Sale con 1 si encuentra algo.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { RESOURCES } from '../src/data/resources.js';
import { BUILDINGS, EXPANSIONS } from '../src/data/buildings.js';
import { ABERRATIONS, ROLES } from '../src/data/aberrations.js';
import { ABILITIES, ITEMS } from '../src/data/abilities.js';
import { CLASSES } from '../src/data/isopods.js';
import { CARDS } from '../src/data/cards.js';
import { BIOMES, WEATHERS, NODE_TYPES, ISLAND_KINDS, VESSELS, VESSEL_BY_KIND } from '../src/data/world.js';
import { PALETTES } from '../src/data/palettes.js';
import { SPECIES } from '../src/data/species.js';
import { ACHIEVEMENTS, ACHIEVEMENT_GROUPS } from '../src/data/achievements.js';

import { PROC_SPRITES } from '../src/view/sprites.js';
import { ICONS } from '../src/ui/icons.js';
import { SFX_NAMES } from '../src/ui/sfx.js';
import { LAYERS, START_LAYERS, HUMIDITY, CLIMATES } from '../src/data/substrate.js';

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
  for (const [id, s] of Object.entries(SPECIES)) {
    if (!CLIMATES[s.humidity]) fail(`especie ${id}: clima ${s.humidity} desconocido`);
    if (!['domo', 'plano', 'fino', 'pato'].includes(s.body)) fail(`especie ${id}: cuerpo ${s.body} sin dibujo`);
    if (s.colors?.length !== 3) fail(`especie ${id}: faltan colores`);
  }
  for (const [id, b] of Object.entries(BIOMES)) {
    for (const r of b.loot) if (!RESOURCES[r]) fail(`bioma ${id}: botín "${r}" no es un recurso`);
    for (const k of ['boss', 'elite']) if (!ABERRATIONS[b[k]]) fail(`bioma ${id}: ${k} "${b[k]}" no existe`);
  }
  for (const [id, n] of Object.entries(NODE_TYPES)) if (!ICONS[n.icon]) fail(`nodo ${id}: icono "${n.icon}" no existe`);
  for (const k of Object.keys(ISLAND_KINDS)) {
    if (!ICONS[k]) fail(`isla ${k}: sin icono`);
    for (const v of VESSEL_BY_KIND[k] ?? []) if (!VESSELS[v]) fail(`isla ${k}: recipiente "${v}" no existe`);
  }
  for (const [id, l] of Object.entries(LAYERS)) {
    if (!l.name || !l.desc) fail(`capa ${id}: falta nombre o descripción`);
    l.costs.forEach((c, i) => costs(`capa ${id} nivel ${i + 1}`, c));
    if (!(id in START_LAYERS)) fail(`capa ${id}: sin nivel inicial`);
  }
  for (const id of Object.keys(HUMIDITY.pieces)) if (!BUILDINGS[id]) fail(`humedad: pieza "${id}" no existe`);
  for (const id of Object.keys(HUMIDITY.weather)) if (!WEATHERS[id]) fail(`humedad: clima "${id}" no existe`);
  for (const id of ['seco', 'ideal', 'humedo', 'moho']) if (!CLIMATES[id]) fail(`clima interior "${id}" sin definir`);
  for (const [id, c] of Object.entries(CARDS)) if (!c.desc || !c.mods) fail(`carta ${id}: falta descripción o efecto`);

  // Nombres sueltos en el código (como sfx-check de KureiChaosChess): todo sonido e icono pedido existe.
  const src = new URL('../src/', import.meta.url).pathname;
  const walk = (d) => readdirSync(d).flatMap((f) => (statSync(d + f).isDirectory() ? walk(`${d}${f}/`) : f.endsWith('.js') ? [d + f] : []));
  for (const file of walk(src)) {
    const text = readFileSync(file, 'utf8'), rel = file.slice(src.length);
    for (const [, n] of text.matchAll(/(?:sfx|playSfx)\('([a-z]+)'/g)) if (!SFX_NAMES.includes(n)) fail(`${rel}: sonido "${n}" no existe`);
    for (const [, n] of text.matchAll(/name="([a-zA-Z]+)"/g)) if (!ICONS[n]) fail(`${rel}: icono "${n}" no existe`);
  }

  // Logros: cada uno con grupo e icono válidos y otorgado en algún sitio (como en KureiChaosChess).
  const session = readFileSync(new URL('../src/ui/session.js', import.meta.url), 'utf8');
  for (const a of ACHIEVEMENTS) {
    if (!ACHIEVEMENT_GROUPS.includes(a.group)) fail(`logro ${a.id}: grupo ${a.group} desconocido`);
    if (!ICONS[a.icon]) fail(`logro ${a.id}: icono ${a.icon} no existe`);
    if (!session.includes(`achieve('${a.id}'`)) fail(`logro ${a.id}: nadie lo otorga`);
  }
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
