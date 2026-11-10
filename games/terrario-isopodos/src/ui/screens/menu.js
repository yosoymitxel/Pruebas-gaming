import { html, useState } from '../lib.js';
import { t } from '../../i18n/index.js';
import { Icon } from '../icons.js';

const canFullscreen = typeof document !== 'undefined' && !!document.documentElement.requestFullscreen;
const toggleFullscreen = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {});

export function HowTo({ onClose }) {
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

// Menú principal (estructura de Cult of the Lamb y KureiChaosChess): el logo grande sobre la noche y una
// lista vertical de opciones del mismo ancho; el terrario vivo ocupa el resto de la pantalla.
export function Menu({ s }) {
  const [confirm, setConfirm] = useState(false);
  const [howto, setHowto] = useState(false);
  const start = () => (s.saved && !confirm ? setConfirm(true) : s.newGame());
  const item = (icon, label, onClick, cls = '', sub) => html`<li><button class=${`menu-item ${cls}`} onClick=${onClick}>
    <${Icon} name=${icon} size="22" /><span>${label}${sub && html`<small>${sub}</small>`}</span></button></li>`;
  return html`<main class="screen menu">
    <header class="logo">
      <p class="kicker">${t('menu.kicker', 'Un diorama de terror acogedor')}</p>
      <h1>${t('menu.title', 'Terrario de isópodos')}</h1>
      <p class="lead">${t('menu.lead', 'Cuida tu colonia bajo el cristal, viaja entre terrarios flotantes y enfréntate a las aberraciones que los rondan.')}</p>
    </header>
    <nav class="menu-list" aria-label=${t('menu.nav', 'Menú principal')}><ul>
      ${s.saved && item('hogar', t('menu.continue', 'Continuar'), () => s.continueGame(), 'primary', `${t('ui.day', 'Día')} ${s.saved.day} · ${s.saved.home.isopods.length} ${t('menu.isopods', 'isópodos')}`)}
      ${item('colony', confirm ? t('menu.confirmNew', '¿Seguro? Se pierde la partida actual') : t('menu.new', 'Nueva partida'), start, `${s.saved ? '' : 'primary'}${confirm ? ' danger' : ''}`)}
      ${item('carta', t('menu.howto', 'Cómo se juega'), () => setHowto(true))}
      ${item('gear', t('menu.settings', 'Ajustes'), () => s.openSettings())}
      ${item('jefe', t('menu.gallery', 'Galería'), () => s.goGallery(), '', `${s.meta.got.length} ${t('menu.achievements', 'logros')}`)}
      ${canFullscreen && item('expand', t('menu.fullscreen', 'Pantalla completa'), toggleFullscreen)}
    </ul></nav>
    <p class="menu-foot muted">${t('menu.foot', 'Esc o P: pausa · Q/E: girar la cámara')}</p>
    ${howto && html`<${HowTo} onClose=${() => setHowto(false)} />`}
  </main>`;
}
