import { html } from '../lib.js';
import { t } from '../../i18n/index.js';
import { BIOMES, WEATHERS, GATHER_SHAPES } from '../../data/world.js';
import { press, hold } from '../input.js';
import { Icon } from '../icons.js';
import { gatherLoot, GATHER_TIME } from '../../game/gather.js';
import { Resources, Bar, Stick, CamControls, FxLayer, PauseButton } from './common.js';

export function Gather({ s }) {
  const g = s.gather;
  return html`<main class="screen gather">
    <${Stick} />
    <${FxLayer} s=${s} />
    ${s.hurtAt && s.time - s.hurtAt < 0.45 && html`<div class="hurt-flash fall" aria-hidden="true"></div>`}
    <${CamControls} s=${s} />
    <header class="hud-top">
      <div class="title-block"><span class="kicker">${GATHER_SHAPES[g.shape].name} · ${WEATHERS[g.island.weather].name}</span><h2>${BIOMES[g.island.biome].name}</h2></div>
      <div class="timer"><span>${Math.ceil(g.time)} s</span><${Bar} value=${g.time} max=${GATHER_TIME} kind="time" label=${t('gather.time', 'Tiempo')} /></div>
      <${Resources} have=${gatherLoot(g)} compact />
      <${PauseButton} s=${s} />
    </header>
    <p class=${`hint floating${g.lost && !g.lost.taken ? ' keep' : ''}`}>${g.lost && !g.lost.taken ? t('gather.lost', 'Hay un isópodo perdido en la isla: ve a buscarlo.') : `${GATHER_SHAPES[g.shape].hint} ${t('gather.jumpHint', 'Salta con espacio o el botón.')}`}</p>
    <section class="actions-pad gather-pad"><button class="pad attack" onPointerDown=${(e) => { e.preventDefault(); press('roll'); hold('roll', true); }} onPointerUp=${() => hold('roll', false)} onPointerCancel=${() => hold('roll', false)} onPointerLeave=${() => hold('roll', false)} aria-label=${t('gather.jump', 'Saltar (espacio)')}><${Icon} name="jump" size="32" /></button></section>
    ${g.done && html`<section class="drawer center">
      <h3>${t('gather.done', 'Fin de la recolección')}</h3>
      ${g.rescued && html`<p>${t('gather.rescued', 'Un isópodo perdido vuelve contigo.')}</p>`}
      <button class="btn primary" onClick=${() => s.endGather()}>${t('ui.continue', 'Continuar')}</button>
    </section>`}
  </main>`;
}
