// Progreso fuera de la partida (como KureiChaosChess): logros y lo visto para la Galería (aberraciones
// encontradas y vencidas, especies criadas). Se guarda aparte: borrar una partida no lo borra.
import { ACHIEVEMENTS } from '../data/achievements.js';

const KEY = 'terrario.meta.v1';
const blank = () => ({ got: [], seen: {}, beaten: {}, species: {}, count: {} });

export function loadMeta(storage = globalThis.localStorage) {
  try { return { ...blank(), ...JSON.parse(storage.getItem(KEY) ?? '{}') }; } catch { return blank(); }
}
export function saveMeta(meta, storage = globalThis.localStorage) { try { storage.setItem(KEY, JSON.stringify(meta)); } catch {} }

// Otorga un logro si existe y no estaba. Devuelve el logro nuevo o null.
export function award(meta, id) {
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (!a || meta.got.includes(id)) return null;
  meta.got.push(id);
  return a;
}

// Cuenta un hito repetible y otorga su logro al llegar a `need`.
export function tally(meta, id, need) {
  meta.count[id] = (meta.count[id] ?? 0) + 1;
  return meta.count[id] >= need ? award(meta, id) : null;
}
