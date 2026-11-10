// Idiomas (patrón de KureiChaosChess). El español vive en el código: en los registros de src/data y
// como texto por defecto de t('clave', 'texto'). Otro idioma = src/i18n/<id>.js con las mismas claves
// y su entrada en LANGS; lo que falte se ve en español.
export const LANGS = { es: 'Español' };
const SETTINGS_KEY = '__ID__.settings.v1';

function saved() {
  if (typeof localStorage === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY))?.lang; } catch { return null; }
}
export const LANG = LANGS[saved()] ? saved() : 'es';
const dict = LANG === 'es' ? {} : (await import(`./${LANG}.js`)).default;

// {nombre} se rellena con `vars`.
export function t(key, es, vars) {
  const s = dict.ui?.[key] ?? es;
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m)) : s;
}

// Traduce en el sitio un registro { id: {...} } con dict[kind].
export function localize(kind, reg) {
  for (const [id, fields] of Object.entries(dict[kind] ?? {})) if (reg[id]) Object.assign(reg[id], fields);
  return reg;
}
