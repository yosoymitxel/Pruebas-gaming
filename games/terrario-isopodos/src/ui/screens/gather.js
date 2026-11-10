import { html } from '../lib.js';
import { t } from '../../i18n/index.js';
import { BIOMES, WEATHERS } from '../../data/world.js';
import { gatherLoot, GATHER_TIME } from '../../game/gather.js';
import { Resources, Bar, Stick, CamControls, FxLayer } from './common.js';

export function Gather({ s }) {
  const g = s.gather;
  return html`<main class="screen gather">
    <${Stick} />
    <${FxLayer} s=${s} />
    <${CamControls} s=${s} />
    <header class="hud-top">
      <div class="title-block"><span class="kicker">${WEATHERS[g.island.weather].name}</span><h2>${BIOMES[g.island.biome].name}</h2></div>
      <div class="timer"><span>${Math.ceil(g.time)} s</span><${Bar} value=${g.time} max=${GATHER_TIME} kind="time" label=${t('gather.time', 'Tiempo')} /></div>
      <${Resources} have=${gatherLoot(g)} compact />
    </header>
    <p class="hint floating">${g.lost && !g.lost.taken ? t('gather.lost', 'Hay un isópodo perdido en la isla: ve a buscarlo.') : t('gather.hint', 'Muévete con la palanca o WASD y recoge todo lo que puedas.')}</p>
    ${g.done && html`<section class="drawer center">
      <h3>${t('gather.done', 'Fin de la recolección')}</h3>
      ${g.rescued && html`<p>${t('gather.rescued', 'Un isópodo perdido vuelve contigo.')}</p>`}
      <button class="btn primary" onClick=${() => s.endGather()}>${t('ui.continue', 'Continuar')}</button>
    </section>`}
  </main>`;
}
