// Entrada unificada: teclado (WASD/flechas, J atacar, K/espacio rodar, L/Tab táctico, Esc/P pausa, 1–3 cambiar, Q/E girar) y
// palanca táctil. read() devuelve el estado del fotograma; los pulsados se consumen al leerlos.
const keys = new Set();
const pressed = new Set();
const stick = { x: 0, y: 0 };
const holding = new Set(); // botones táctiles mantenidos (salto variable)
const BIND = { KeyJ: 'attack', KeyK: 'roll', Space: 'roll', KeyL: 'tactical', Tab: 'tactical', Digit1: 'p1', Digit2: 'p2', Digit3: 'p3', Escape: 'pause', KeyP: 'pause' };

export function bindKeyboard(target = window) {
  target.addEventListener('keydown', (e) => {
    if (e.target.closest?.('input, textarea')) return;
    if (BIND[e.code] && !e.repeat) { pressed.add(BIND[e.code]); e.preventDefault(); }
    keys.add(e.code);
  });
  target.addEventListener('keyup', (e) => keys.delete(e.code));
  target.addEventListener('blur', () => keys.clear());
}

export const press = (action) => pressed.add(action);
export const hold = (action, on) => (on ? holding.add(action) : holding.delete(action));
export function setStick(x, y) { stick.x = x; stick.y = y; }

export function read() {
  let x = stick.x, y = stick.y;
  if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
  if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
  if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
  if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
  const out = { move: { x, y }, turn: (keys.has('KeyE') ? 1 : 0) - (keys.has('KeyQ') ? 1 : 0) };
  out.held = { roll: holding.has('roll') || keys.has('Space') || keys.has('KeyK'), attack: holding.has('attack') || keys.has('KeyJ') };
  for (const p of pressed) out[p] = true;
  pressed.clear();
  return out;
}
