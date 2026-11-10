// Piezas de interfaz compartidas.
import { html, useRef } from '../lib.js';
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
export const CamControls = ({ s }) => html`<div class="cam-controls" role="group" aria-label=${t('ui.camera', 'Cámara')}>
  <button class="btn icon" onClick=${() => s.stage.rotate(-Math.PI / 4)} aria-label=${t('ui.turnLeft', 'Girar a la izquierda (Q)')}><${Icon} name="turnLeft" /></button>
  <button class="btn icon" onClick=${() => s.stage.rotate(Math.PI / 4)} aria-label=${t('ui.turnRight', 'Girar a la derecha (E)')}><${Icon} name="turnRight" /></button>
  <button class="btn icon" onClick=${() => s.stage.zoom(0.85)} aria-label=${t('ui.zoomIn', 'Acercar')}><${Icon} name="zoomIn" /></button>
  <button class="btn icon" onClick=${() => s.stage.zoom(1 / 0.85)} aria-label=${t('ui.zoomOut', 'Alejar')}><${Icon} name="zoomOut" /></button>
</div>`;
