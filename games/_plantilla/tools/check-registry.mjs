// Verificador de registros: node tools/check-registry.mjs. Avisa de lo que quedó a medias en src/data/.
// Amplíalo con cada registro nuevo: es lo que permite añadir contenido sin romper nada.
import { COLLECTIBLES } from '../src/data/collectibles.js';
import { PALETTE } from '../src/data/palettes.js';

export function checkRegistry() {
  const errors = [];
  for (const [id, c] of Object.entries(COLLECTIBLES)) {
    if (!c.name) errors.push(`coleccionable ${id}: sin nombre`);
    if (!(c.value > 0 && c.weight > 0)) errors.push(`coleccionable ${id}: valor o peso inválido`);
    if (!PALETTE[c.color]) errors.push(`coleccionable ${id}: color "${c.color}" no está en la paleta`);
  }
  for (const [k, v] of Object.entries(PALETTE)) if (!/^#[0-9a-f]{6}$/i.test(v)) errors.push(`paleta ${k}: color inválido`);
  return errors;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const errors = checkRegistry();
  for (const e of errors) console.error(`✗ ${e}`);
  console.log(errors.length ? `${errors.length} problema(s)` : 'Registros OK');
  process.exit(errors.length ? 1 : 0);
}
