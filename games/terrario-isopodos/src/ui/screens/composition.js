// Panel «Terrario»: corte del recipiente con sus capas y el clima interior que producen, con qué lo causa y
// qué efecto tiene. Mejorar una capa se hace aquí.
import { html } from '../lib.js';
import { t } from '../../i18n/index.js';
import { LAYERS, HUMIDITY, CLIMATES, LID_NAMES } from '../../data/substrate.js';
import { BUILDINGS } from '../../data/buildings.js';
import { WEATHERS } from '../../data/world.js';
import { layer, humidity, humidityTarget, gradient, humidityParts, climate, homeEffects, calm, nextLayerCost, canAfford } from '../../game/home.js';
import { Cost, Bar } from './common.js';
import { Icon } from '../icons.js';

const ORDER = ['hojarasca', 'tierra', 'carbon', 'grava']; // de arriba abajo, como se ve en el vidrio
const pct = (v) => `${Math.round(v * 100)} %`;
const css = (v) => `${Math.round(v * 100)}%`;
const signed = (v) => `${v >= 0 ? '+' : '−'}${Math.round(Math.abs(v) * 100)} %`;

export function Composition({ s, say }) {
  const home = s.game.home, clim = climate(home), eff = homeEffects(home), h = humidity(home), fix = CLIMATES[clim].fix;
  const label = (src) => (src === 'base' ? t('comp.base', 'Base') : src === 'weather' ? WEATHERS[home.weather].name : src === 'rocio' ? t('comp.mist', 'Rociado') : src === 'tapa' ? t('comp.lid', 'Tapa') : BUILDINGS[src].name);
  const upgrade = (id) => { if (s.upgradeLayer(id)) say(`${LAYERS[id].name} ↑`); };
  const tone = (v, good) => (Math.abs(v - 1) < 0.01 ? '' : (v > 1) === good ? 'up' : 'down');
  return html`<section class=${`drawer composition clim-${clim}`} aria-label=${t('comp.title', 'Composición del terrario')}>
    <header class="comp-head">
      <div><h3 class="clim-title">${CLIMATES[clim].name}</h3><p class="clim-desc">${CLIMATES[clim].desc}</p></div>
      <p class="hum-big" aria-label=${t('comp.humidity', 'Humedad')}><${Icon} name="items" size="18" />${pct(h)}</p>
    </header>
    <div class="humidity">
      <span class="hum-bar"><i style=${{ width: css(Math.min(1, h)) }}></i>
        <em style=${{ left: css(HUMIDITY.dry), width: css(HUMIDITY.wet - HUMIDITY.dry) }} title=${t('comp.ideal', 'ideal')}></em></span>
      <ul class="hum-parts">${humidityParts(home).filter((p) => p.amount).map((p) => html`<li class=${p.amount > 0 ? 'up' : 'down'}>${label(p.source)} ${signed(p.amount)}</li>`)}</ul>
    </div>
    <div class="lid-row" role="radiogroup" aria-label=${t('comp.lid', 'Tapa')}><${Icon} name="lid" size="18" />
      ${LID_NAMES.map((n, k) => html`<button class=${`btn small${(home.lid ?? 1) === k ? ' active' : ''}${fix?.lid === k ? ' fix-target' : ''}`} role="radio" aria-checked=${(home.lid ?? 1) === k} onClick=${() => s.lid(k)}>${t(`lid.${k}`, n)}</button>`)}
      <span class="trend">${pct(h)} → ${pct(humidityTarget(home))}</span></div>
    <p class=${`grad ${gradient(home).ok ? 'up' : 'down'}`}>${gradient(home).ok ? t('comp.gradOk', 'Hay rincón húmedo y rincón seco') : t('comp.gradNo', 'Todo igual de húmedo: aparta el agua a un lado')}</p>
    ${fix && html`<p class="fix"><${Icon} name="expand" size="16" />${fix.lid != null ? html`${t('comp.fixLid', 'Tapa')} <b>${LID_NAMES[fix.lid]}</b> ` : ''}${fix.layer ? html`${t('comp.fixLayer', 'Sube')} <b>${LAYERS[fix.layer].name}</b>` : ''}
      ${fix.pieces ? html`${t('comp.fixAdd', 'Pon')} <b>${fix.pieces.map((id) => BUILDINGS[id].name).join(' / ')}</b>` : ''}
      ${fix.less ? html` · ${t('comp.fixLess', 'menos')} <b>${BUILDINGS[fix.less].name}</b>` : ''}</p>`}
    <dl class="stats3 comp-fx">
      <div class=${tone(eff.prodMul, true)}><dt>${t('comp.prod', 'Producción')}</dt><dd>×${eff.prodMul.toFixed(2)}</dd></div>
      <div class=${tone(eff.hungerMul, false)}><dt>${t('comp.hunger', 'Hambre')}</dt><dd>×${eff.hungerMul.toFixed(2)}</dd></div>
      <div><dt>${t('home.calm', 'Calma')}</dt><dd>${Math.round(calm(home) * 100)}</dd><${Bar} value=${calm(home)} max=${1} kind="calm" label=${t('home.calm', 'Calma')} /></div>
    </dl>
    <ul class="layers strata" aria-label=${t('comp.cross', 'Corte del terrario')}>${ORDER.map((id, k) => {
      const cost = nextLayerCost(home, id), lv = layer(home, id), max = LAYERS[id].costs.length;
      return html`<li class=${fix?.layer === id ? 'fix-target' : ''}>
        <span class=${`band band-${id}`} style=${{ '--lv': lv }}>${k === 0 && html`<svg class="sprouts" viewBox="0 0 40 14" aria-hidden="true"><path d="M8 14q-1-7-5-10 M8 14q2-8 6-11 M28 14q0-6 3-9 M32 14q-1-5-4-7" /></svg>`}</span>
        <div class="ly"><b>${LAYERS[id].name}</b><span class="pips">${Array.from({ length: max }, (_, i) => html`<i class=${i < lv ? 'on' : ''}></i>`)}</span><p>${LAYERS[id].desc}</p></div>
        ${cost ? html`<button class="btn small" disabled=${!canAfford(home, cost)} onClick=${() => upgrade(id)} aria-label=${`${t('comp.up', 'Mejorar')} ${LAYERS[id].name}`}><${Icon} name="expand" size="14" /><${Cost} cost=${cost} have=${home.resources} /></button>`
          : html`<small class="maxed-s">${t('comp.max', 'al máximo')}</small>`}
      </li>`;
    })}</ul>
  </section>`;
}
