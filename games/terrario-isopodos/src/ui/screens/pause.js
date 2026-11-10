// Pausa (patrón KureiChaosChess): seguir, interruptores rápidos, filtro y salidas. Se abre con el botón de
// menú de cada pantalla o Esc/P; el juego queda congelado detrás.
import { html, useEffect, useState } from '../lib.js';
import { t } from '../../i18n/index.js';
import { FILTERS } from '../../view/ink.js';
import { Icon } from '../icons.js';
import { Toggle, Segmented } from './settings.js';
import { HowTo } from './menu.js';

const canFullscreen = typeof document !== 'undefined' && !!document.documentElement.requestFullscreen;
export const toggleFullscreen = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {});

export function FullscreenToggle() {
  const [on, setOn] = useState(!!document.fullscreenElement);
  useEffect(() => { const f = () => setOn(!!document.fullscreenElement); document.addEventListener('fullscreenchange', f); return () => document.removeEventListener('fullscreenchange', f); }, []);
  return canFullscreen && html`<${Toggle} on=${on} onChange=${toggleFullscreen} label=${t('menu.fullscreen', 'Pantalla completa')} />`;
}

export const filterName = (f) => ({ tinta: t('settings.filterInk', 'Tinta'), crt: 'CRT', papel: t('settings.filterPaper', 'Papel viejo') }[f]);

export function Pause({ s }) {
  const [howto, setHowto] = useState(false);
  const st = s.settings, set = (k) => (v) => s.setSetting(k, v);
  const away = s.mode !== 'home';
  return html`<div class="overlay" onClick=${(e) => e.target === e.currentTarget && s.resume()}>
    <section class="panel pause" role="dialog" aria-modal="true" aria-label=${t('pause.title', 'Pausa')}>
      <h1>${t('pause.title', 'Pausa')}</h1>
      <button class="btn primary wide" autofocus onClick=${() => s.resume()}>${t('pause.resume', 'Seguir jugando')}</button>
      <div class="pause-toggles">
        <${Toggle} on=${st.sound !== false} onChange=${set('sound')} label=${t('settings.sfx', 'Efectos de sonido')} />
        <${Toggle} on=${st.music !== false} onChange=${set('music')} label=${t('settings.music', 'Música')} />
        <${Toggle} on=${st.shake !== false} onChange=${set('shake')} label=${t('settings.shake', 'Temblor de cámara')} />
        <${Toggle} on=${st.fx !== false} onChange=${set('fx')} label=${t('settings.fx', 'Efectos extra (clima, luciérnagas…)')} />
      </div>
      <${Segmented} label=${t('settings.filter', 'Filtro')} value=${st.filter ?? 'tinta'} onChange=${set('filter')} options=${FILTERS.map((f) => [f, filterName(f)])} />
      <div class="pause-grid">
        <button class="btn" onClick=${() => setHowto(true)}><${Icon} name="carta" size="18" />${t('menu.howto', 'Cómo se juega')}</button>
        <button class="btn" onClick=${() => { s.paused = false; s.openSettings(); }}><${Icon} name="gear" size="18" />${t('menu.settings', 'Ajustes')}</button>
        ${away && html`<button class="btn" onClick=${() => s.leaveToHome()}><${Icon} name="hogar" size="18" />${s.run ? t('pause.retreat', 'Retirarse al terrario') : t('pause.home', 'Al terrario')}</button>`}
        <button class="btn" onClick=${() => { s.paused = false; s.run = null; s.combat = null; s.goMenu(); }}><${Icon} name="back" size="18" />${t('pause.menu', 'Menú principal')}</button>
        ${canFullscreen && html`<button class="btn wide" onClick=${toggleFullscreen}><${Icon} name="expand" size="18" />${t('menu.fullscreen', 'Pantalla completa')}</button>`}
      </div>
      ${s.run && html`<p class="muted">${t('pause.runNote', 'Ir al menú en mitad del nido descarta la expedición; retirarse conserva el botín.')}</p>`}
    </section>
    ${howto && html`<${HowTo} onClose=${() => setHowto(false)} />`}
  </div>`;
}
