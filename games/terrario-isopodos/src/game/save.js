// Guardado local versionado. Un guardado inválido nunca pisa uno válido: se valida antes de escribir y
// al leer; si falla, se devuelve null y el menú ofrece partida nueva sin borrar nada.
const KEY = 'terrario.next.save.v1';
export const VERSION = 1;

export function serialize(game) {
  const { grid } = game.home;
  return JSON.stringify({ ...game, v: VERSION, home: { ...game.home, grid: { ...grid, open: Array.from(grid.open) } } });
}

export function deserialize(text) {
  try {
    const g = JSON.parse(text);
    if (g?.v !== VERSION || !g.home?.grid || !Array.isArray(g.home.isopods) || typeof g.seed !== 'number') return null;
    const { grid } = g.home;
    if (grid.open.length !== grid.w * grid.h || grid.cells.length !== grid.w * grid.h) return null;
    grid.open = Uint8Array.from(grid.open);
    return g;
  } catch { return null; }
}

export function save(game, storage = globalThis.localStorage) {
  const text = serialize(game);
  if (!deserialize(text)) return false;
  try { storage.setItem(KEY, text); return true; } catch { return false; }
}

export function load(storage = globalThis.localStorage) {
  try { return deserialize(storage.getItem(KEY)); } catch { return null; }
}
