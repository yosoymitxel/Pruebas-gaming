// Piezas de interfaz compartidas.
import { html, useRef, useState } from '../lib.js';
import { RESOURCES } from '../../data/resources.js';
import { resourceIconURL } from '../../view/sprites.js';
import { setStick } from '../input.js';
import { t } from '../../i18n/index.js';
import { Icon } from '../icons.js';

export const ResIcon = ({ res }) => html`<img class="res-icon" src=${resourceIconURL(res)} alt="" aria-hidden="true" />`;

export function Resources({ have, compact }) {
  return html`<ul class=${`resources${compact ? ' compact' : ''}`} aria-label=${t('ui.resources', 'Recursos')}>
    ${Object.keys(RESOURCES).map((r) => html`<li title=${RESOURCES[r].name}><${ResIcon} res=${r} /><b>${have[r] ?? 0}</b><span class="sr">${RESOURCES[r].name}</span></li>`)}
  </ul>`;
}

export function Cost({ cost, have }) {
  const entries = Object.entries(cost);
  if (!entries.length) return html`<span class="cost">${t('ui.free', 'Gratis')}</span>`;
  return html`<span class="cost">${entries.map(([r, n]) => html`<span class=${(have[r] ?? 0) < n ? 'short' : ''}><${ResIcon} res=${r} />${n}</span>`)}</span>`;
}

export const Bar = ({ value, max, kind = 'hp', label }) => html`
  <span class=${`bar bar-${kind}`} role="meter" aria-label=${label} aria-valuenow=${Math.round(value)} aria-valuemin="0" aria-valuemax=${max}>
    <i style=${{ width: `${Math.max(0, Math.min(1, value / max)) * 100}%` }}></i>
  </span>`;

export function Loot({ loot }) {
  const entries = Object.entries(loot).filter(([, n]) => n > 0);
  if (!entries.length) return html`<p class="muted">${t('ui.noLoot', 'Nada que traer esta vez.')}</p>`;
  return html`<ul class="loot">${entries.map(([r, n]) => html`<li><${ResIcon} res=${r} /> ${RESOURCES[r].name} <b>×${n}</b></li>`)}</ul>`;
}

// Palanca táctil: aparece donde se apoya el dedo en la mitad izquierda.
export function Stick() {
  const ref = useRef(), knob = useRef(), origin = useRef(null);
  const move = (e) => {
    if (!origin.current || e.pointerId !== origin.current.id) return;
    const dx = e.clientX - origin.current.x, dy = e.clientY - origin.current.y, d = Math.hypot(dx, dy), max = 46;
    const k = d > max ? max / d : 1;
    knob.current.style.transform = `translate(${dx * k}px, ${dy * k}px)`;
    setStick((dx * k) / max, (dy * k) / max);
  };
  const end = (e) => {
    if (origin.current?.id !== e.pointerId) return;
    origin.current = null; setStick(0, 0);
    ref.current.classList.remove('on');
    knob.current.style.transform = '';
  };
  const start = (e) => {
    origin.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    const r = e.currentTarget.getBoundingClientRect();
    Object.assign(ref.current.style, { left: `${e.clientX - r.left}px`, top: `${e.clientY - r.top}px` });
    ref.current.classList.add('on');
  };
  return html`<div class="stick-zone" onPointerDown=${start} onPointerMove=${move} onPointerUp=${end} onPointerCancel=${end}>
    <div class="stick" ref=${ref}><i ref=${knob}></i></div>
  </div>`;
}

// Girar y acercar la cámara (también Q/E y la rueda).
// Cámara: plegada tras un botón para no tapar el juego; se abre cuando hace falta girar o acercar.
export function CamControls({ s }) {
  const [open, setOpen] = useState(false);
  return html`<div class=${`cam-controls${open ? ' open' : ''}`} role="group" aria-label=${t('ui.camera', 'Cámara')}>
    <button class="btn icon cam-toggle" aria-expanded=${open} onClick=${() => setOpen(!open)} aria-label=${t('ui.camera', 'Cámara')}><${Icon} name=${open ? 'back' : 'eye'} /></button>
    ${open && html`
    <button class="btn icon" onClick=${() => s.stage.rotate(-Math.PI / 4)} aria-label=${t('ui.turnLeft', 'Girar a la izquierda (Q)')}><${Icon} name="turnLeft" /></button>
    <button class="btn icon" onClick=${() => s.stage.rotate(Math.PI / 4)} aria-label=${t('ui.turnRight', 'Girar a la derecha (E)')}><${Icon} name="turnRight" /></button>
    <button class="btn icon" onClick=${() => s.stage.zoom(0.85)} aria-label=${t('ui.zoomIn', 'Acercar')}><${Icon} name="zoomIn" /></button>
    <button class="btn icon" onClick=${() => s.stage.zoom(1 / 0.85)} aria-label=${t('ui.zoomOut', 'Alejar')}><${Icon} name="zoomOut" /></button>`}
  </div>`;
}

// Textos flotantes del mundo (daño, «+1 musgo», avisos): suben y se desvanecen sobre su punto 3D.
export const FxLayer = ({ s }) => html`<div class="fx-layer" aria-hidden="true">${s.fx.map((f) => {
  const p = s.stage.project(f.x, (f.y ?? 1.6) + (s.time - f.at) * 1.4, f.z);
  return html`<span key=${f.id} class=${`fx fx-${f.kind}${f.big ? ' big' : ''}`} style=${{ left: `${p.x}px`, top: `${p.y}px`, opacity: 1 - (s.time - f.at) / 0.9 }}>${f.text}</span>`;
})}</div>`;

// Reloj del día (como el de Cult of the Lamb): esfera oscura con el tramo de noche en rojo, una aguja que da
// la vuelta con el reloj (0 = amanecer, arriba) y el número de día.
// Con `onSleep`, el reloj es el botón de dormir (una luna lo avisa).
export const DayClock = ({ day, clock = 0, label, onSleep }) => html`<${onSleep ? 'button' : 'div'} class=${`day-clock${onSleep ? ' can-sleep' : ''}`}
  role=${onSleep ? null : 'img'} aria-label=${onSleep ? `${label} · ${t('home.sleep', 'Dormir hasta el alba')}` : label} onClick=${onSleep}>
  <svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" />
    <path class="night" d=${`M20 20L${20 + 16 * Math.sin(0.72 * 6.283)} ${20 - 16 * Math.cos(0.72 * 6.283)}A16 16 0 0 1 20 4z`} />
    <line x1="20" y1="20" x2=${20 + 15 * Math.sin(clock * 6.283)} y2=${20 - 15 * Math.cos(clock * 6.283)} /></svg>
  <span><small>${t('ui.day', 'Día')}</small><b>${day}</b></span>${onSleep && html`<i class="moon" aria-hidden="true"><${Icon} name="refugio" size="14" /></i>`}</${onSleep ? 'button' : 'div'}>`;

// Botón de pausa de cada pantalla de juego (arriba a la derecha).
export const PauseButton = ({ s }) => html`<button class="btn icon pause-btn" onClick=${() => s.pause()} aria-label=${t('pause.open', 'Pausa (Esc)')}><${Icon} name="menu" /></button>`;

// Minimapa del piso en combate (como el de Cult of the Lamb): una casilla por sala con sus pasillos, la actual
// resaltada y la final marcada.
export const RoomMap = ({ floor }) => {
  if (!floor) return null;
  const xs = floor.rooms.map((r) => r.x), ys = floor.rooms.map((r) => r.y), x0 = Math.min(...xs), y0 = Math.min(...ys);
  const W = (Math.max(...xs) - x0 + 1) * 2, H = (Math.max(...ys) - y0 + 1) * 2, P = (r) => [(r.x - x0) * 2 + 1, (r.y - y0) * 2 + 1];
  return html`<svg class="room-map" viewBox=${`0 0 ${W} ${H}`} style=${{ width: `${W * 11}px` }} aria-hidden="true">
    ${floor.rooms.flatMap((a) => a.links.filter((id) => id > a.id).map((id) => { const [ax, ay] = P(a), [bx, by] = P(floor.rooms[id]); return html`<line x1=${ax} y1=${ay} x2=${bx} y2=${by} />`; }))}
    ${floor.rooms.map((r) => { const [x, y] = P(r); return html`<rect class=${`${r.done ? 'done' : ''}${r.id === floor.at ? ' here' : ''}${r.final ? ' final' : ''}${r.main ? '' : ' side'}`} x=${x - 0.6} y=${y - 0.45} width="1.2" height="0.9" />`; })}
  </svg>`;
};
