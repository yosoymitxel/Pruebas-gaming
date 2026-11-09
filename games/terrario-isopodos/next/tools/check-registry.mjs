// Verificador de registros: node next/tools/check-registry.mjs
// Todo lo que crece se declara en next/src/data/; esto avisa cuando algo quedó a medias (un dibujo que
// no existe, un coste con un recurso inventado, un rol desconocido). Sale con código 1 si encuentra algo.
import { existsSync } from 'node:fs';
import { RESOURCES } from '../src/data/resources.js';
import { BUILDINGS } from '../src/data/buildings.js';
import { ABERRATIONS, ROLES } from '../src/data/aberrations.js';
import { PALETTES } from '../src/data/palettes.js';

export function checkRegistry() {
  const errors = [];
  const gameDir = new URL('../../', import.meta.url);

  for (const [id, r] of Object.entries(RESOURCES)) if (!r.name || !r.desc) errors.push(`recurso ${id}: falta nombre o descripción`);

  for (const [id, b] of Object.entries(BUILDINGS)) {
    if (!b.name) errors.push(`pieza ${id}: sin nombre`);
    if (!(b.size?.w >= 1 && b.size?.h >= 1)) errors.push(`pieza ${id}: tamaño inválido`);
    if (typeof b.solid !== 'boolean') errors.push(`pieza ${id}: falta solid`);
    for (const res of Object.keys(b.cost ?? {})) if (!RESOURCES[res]) errors.push(`pieza ${id}: cuesta "${res}", que no es un recurso`);
  }

  for (const [id, a] of Object.entries(ABERRATIONS)) {
    if (!a.name || !a.pattern) errors.push(`aberración ${id}: falta nombre o patrón`);
    if (!ROLES.includes(a.role)) errors.push(`aberración ${id}: rol "${a.role}" desconocido`);
    if (!existsSync(new URL(a.art, gameDir))) errors.push(`aberración ${id}: no existe ${a.art}`);
  }

  const keys = Object.keys(PALETTES.cozy).sort().join();
  for (const [id, p] of Object.entries(PALETTES)) {
    if (Object.keys(p).sort().join() !== keys) errors.push(`paleta ${id}: no tiene los mismos tokens que cozy`);
    for (const [k, v] of Object.entries(p)) if (!/^#[0-9a-f]{6}$/i.test(v)) errors.push(`paleta ${id}.${k}: color inválido`);
  }
  return errors;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const errors = checkRegistry();
  for (const e of errors) console.error(`✗ ${e}`);
  console.log(errors.length ? `${errors.length} problema(s)` : 'Registros OK');
  process.exit(errors.length ? 1 : 0);
}
