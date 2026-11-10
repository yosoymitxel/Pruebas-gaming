import { html, useState } from '../lib.js';
import { t } from '../../i18n/index.js';
import { spriteURL } from '../../view/sprites.js';

export function Menu({ s }) {
  const [confirm, setConfirm] = useState(false);
  const start = () => (s.saved && !confirm ? setConfirm(true) : s.newGame());
  return html`<main class="screen menu">
    <img class="menu-art" src=${spriteURL('el-bufon.webp')} alt="" aria-hidden="true" />
    <div class="menu-copy">
      <p class="kicker">${t('menu.kicker', 'Un diorama de terror acogedor')}</p>
      <h1>${t('menu.title', 'Terrario de isópodos')}</h1>
      <p class="lead">${t('menu.lead', 'Cuida tu colonia en su isla de cristal, sal al archipiélago y enfréntate a las aberraciones que lo habitan.')}</p>
      <div class="actions">
        ${s.saved && html`<button class="btn primary" onClick=${() => s.continueGame()}>${t('menu.continue', 'Continuar')} · ${t('ui.day', 'día')} ${s.saved.day}</button>`}
        <button class=${`btn${s.saved ? '' : ' primary'}`} onClick=${start}>${confirm ? t('menu.confirmNew', '¿Borrar la partida y empezar?') : t('menu.new', 'Nueva partida')}</button>
        <button class="btn ghost" onClick=${() => s.setSetting('reduceMotion', !s.settings.reduceMotion)} aria-pressed=${!!s.settings.reduceMotion}>
          ${t('menu.motion', 'Movimiento reducido')}: ${s.settings.reduceMotion ? t('ui.on', 'sí') : t('ui.off', 'no')}
        </button>
      </div>
    </div>
  </main>`;
}
