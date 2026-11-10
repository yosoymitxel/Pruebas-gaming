// Menú principal (patrón KureiChaosChess): el terrario vivo de fondo y una columna con la marca, la acción
// principal (continuar o empezar) y una fila secundaria (cómo se juega, ajustes, pantalla completa).
import { html, useState } from '../lib.js';
import { t } from '../../i18n/index.js';
import { Icon } from '../icons.js';

const canFullscreen = typeof document !== 'undefined' && !!document.documentElement.requestFullscreen;

function HowTo({ onClose }) {
  return html`<section class="drawer center howto" role="dialog" aria-label=${t('menu.howto', 'Cómo se juega')}>
    <h3>${t('menu.howto', 'Cómo se juega')}</h3>
    <ol>
      <li>${t('howto.1', 'Cuida el terrario: construye, mantén la humedad ideal y recoge lo que producen las piezas.')}</li>
      <li>${t('howto.2', 'Sal al archipiélago: los frascos y dioramas dan recursos; los nidos esconden aberraciones.')}</li>
      <li>${t('howto.3', 'En el nido vas con un isópodo principal y dos de apoyo. Ataca, rueda para esquivar y abre la pausa táctica para usar habilidades.')}</li>
      <li>${t('howto.4', 'Presiona a la aberración tras sus ataques fuertes para aturdirla y hacerle más daño.')}</li>
    </ol>
    <p class="muted">${t('howto.keys', 'Teclado: WASD mover · J atacar · K rodar · L táctica · 1–3 cambiar · Q/E girar cámara.')}</p>
    <button class="btn primary" onClick=${onClose}>${t('ui.ok', 'Entendido')}</button>
  </section>`;
}

export function Menu({ s }) {
  const [confirm, setConfirm] = useState(false);
  const [howto, setHowto] = useState(false);
  const start = () => (s.saved && !confirm ? setConfirm(true) : s.newGame());
  const full = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {});
  return html`<main class="screen menu">
    <div class="menu-col">
      <div class="logo">
        <p class="kicker">${t('menu.kicker', 'Un diorama de terror acogedor')}</p>
        <h1>${t('menu.title', 'Terrario de isópodos')}</h1>
        <p class="lead">${t('menu.lead', 'Cuida tu colonia bajo el cristal, viaja entre terrarios flotantes y enfréntate a las aberraciones que los rondan.')}</p>
      </div>
      <nav class="menu-actions">
        ${s.saved && html`<button class="btn primary wide" onClick=${() => s.continueGame()}><${Icon} name="hogar" /> ${t('menu.continue', 'Continuar')} · ${t('ui.day', 'día')} ${s.saved.day}</button>`}
        <button class=${`btn wide${s.saved ? '' : ' primary'}${confirm ? ' danger' : ''}`} onClick=${start}><${Icon} name="colony" />
          ${confirm ? t('menu.confirmNew', 'Se pierde la partida actual. ¿Seguro?') : t('menu.new', 'Nueva partida')}</button>
        <div class="menu-row">
          <button class="btn ghost" onClick=${() => setHowto(true)}><${Icon} name="carta" /> ${t('menu.howto', 'Cómo se juega')}</button>
          <button class="btn ghost" onClick=${() => s.openSettings()}><${Icon} name="gear" /> ${t('menu.settings', 'Ajustes')}</button>
          ${canFullscreen && html`<button class="btn ghost icon" onClick=${full} aria-label=${t('menu.fullscreen', 'Pantalla completa')}><${Icon} name="expand" /></button>`}
        </div>
      </nav>
    </div>
    ${howto && html`<${HowTo} onClose=${() => setHowto(false)} />`}
  </main>`;
}
