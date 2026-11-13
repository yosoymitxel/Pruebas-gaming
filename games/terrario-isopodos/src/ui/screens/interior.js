// Pantalla de las vistas internas: título, quién está, la ceremonia en curso y salir.
import { html } from '../lib.js';
import { t } from '../../i18n/index.js';
import { BUILDINGS } from '../../data/buildings.js';
import { RITUALS } from '../../data/cult.js';
import { Icon } from '../icons.js';
import { CloseX, CamControls } from './common.js';
import { Assigned } from './home.js';

export function Interior({ s }) {
  const home = s.game.home, it = s.interior, p = it && home.grid.pieces[it.pieceId];
  if (!it || !p) return null;
  const sm = home.sermon, altar = it.kind === 'altar';
  return html`<main class="screen interior">
    <${CamControls} s=${s} />
    <header class="inside-head"><span class="kicker">${t('inside.kicker', 'Dentro de')}</span><h2>${altar ? t('inside.altar', 'Cámara del altar') : BUILDINGS[p.type].name}</h2></header>
    ${altar && sm && html`<p class="ceremony" role="status"><${Icon} name=${sm.ritual ? RITUALS[sm.ritual].icon : 'colony'} size="18" /><b>${sm.ritual ? RITUALS[sm.ritual].name : t('temple.sermon', 'Sermón')}</b><i style=${{ '--p': 1 - sm.t / (sm.total ?? 7) }}></i></p>`}
    ${!altar && html`<${CloseX} onClose=${() => s.exitInterior()} /><section class="drawer inside-panel">
      <${Assigned} s=${s} p=${p} />
      <button class="btn ghost" onClick=${() => { s.exitInterior(); s.selPiece = p.id; s.emit(); }}><${Icon} name="build" size="18" />${t('inside.piece', 'Mejorar o mover')}</button>
    </section>`}
    ${altar && !sm && html`<button class="btn primary inside-exit" onClick=${() => s.exitInterior()}><${Icon} name="back" size="18" />${t('inside.exit', 'Salir')}</button>`}
  </main>`;
}
