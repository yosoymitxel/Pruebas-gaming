// Guardado local versionado: se valida antes de escribir y al leer; uno inválido nunca pisa uno bueno.
const KEY = '__ID__.save.v1';
export const VERSION = 1;

const valid = (s) => s?.v === VERSION && typeof s.best === 'number';

export function load(storage = globalThis.localStorage) {
  try { const s = JSON.parse(storage.getItem(KEY)); return valid(s) ? s : null; } catch { return null; }
}

export function save(data, storage = globalThis.localStorage) {
  const s = { ...data, v: VERSION };
  if (!valid(s)) return false;
  try { storage.setItem(KEY, JSON.stringify(s)); return true; } catch { return false; }
}
