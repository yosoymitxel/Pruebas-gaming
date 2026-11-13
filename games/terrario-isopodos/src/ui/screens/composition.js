// Panel «Terrario»: corte del recipiente con sus capas y el clima interior que producen, con qué lo causa y
// qué efecto tiene. Mejorar una capa se hace aquí.
import { html } from '../lib.js';
import { t } from '../../i18n/index.js';
import { LAYERS, HUMIDITY, CLIMATES, LID_NAMES } from '../../data/substrate.js';
import { BUILDINGS } from '../../data/buildings.js';
import { WEATHERS } from '../../data/world.js';
import { layer, humidity, humidityTarget, gradient, humidityParts, climate, homeEffects, calm, nextLayerCost, canAfford } from '../../game/home.js';
import { Cost, Bar, CloseX } from './common.js';
import { Icon } from '../icons.js';

const ORDER = ['hojarasca', 'tierra', 'carbon', 'grava']; // de arriba abajo, como se ve en el vidrio
const pct = (v) => `${Math.round(v * 100)} %`;
const css = (v) => `${Math.round(v * 100)}%`;
const signed = (v) => `${v >= 0 ? '+' : '−'}${Math.round(Math.abs(v) * 100)} %`;

// Qué hacer ahora, en una frase y con su color (verde bien, ámbar ojo, rojo actuar).
function advice(home, clim, h) {
  const lid = home.lid ?? 1;
  if (clim === 'ideal') return t('adv.ok', 'Bien así: no hace falta tocar nada.');
  if (clim === 'seco') return lid > 0 ? t('adv.closeLid', 'Muy seco: cierra la tapa y rocía.') : t('adv.addWater', 'Muy seco: rocía o pon una charca o musgo esfagno.');
  if (home.weather === 'lluvia' && lid > 0) return t('adv.rain', 'Llueve y entra agua: cierra la tapa hasta que pare.');
  if (lid < 2) return t('adv.openLid', 'Demasiada agua: abre la tapa para que se seque.');
  return t('adv.lessWater', 'Demasiada agua aun con la tapa abierta: quita una charca o un esfagno.');
}
export function Composition({ s, say, onClose }) {
  const home = s.game.home, clim = climate(home), eff = homeEffects(home), h = humidity(home), fix = CLIMATES[clim].fix;
  const label = (src) => (src === 'base' ? t('comp.base', 'Base') : src === 'weather' ? WEATHERS[home.weather].name : src === 'rocio' ? t('comp.mist', 'Rociado') : src === 'tapa' ? t('comp.lid', 'Tapa') : BUILDINGS[src].name);
  const upgrade = (id) => { if (s.upgradeLayer(id)) say(`${LAYERS[id].name} ↑`); };
  const tone = (v, good) => (Math.abs(v - 1) < 0.01 ? '' : (v > 1) === good ? 'up' : 'down');
  return html`<${CloseX} onClose=${onClose} /><section class=${`drawer composition clim-${clim}`} aria-label=${t('comp.title', 'Composición del terrario')}>
    <header class="comp-head">
      <div><h3 class="clim-title">${CLIMATES[clim].name}</h3><p class="clim-desc">${CLIMATES[clim].desc}</p></div>
      <p class="hum-big" aria-label=${t('comp.humidity', 'Humedad')}><${Icon} name="items" size="18" />${pct(h)}</p>
    </header>
    <p class=${`verdict v-${clim}`}>${advice(home, clim, h)}</p>
    <div class="humidity">
      <span class="hum-bar"><i style=${{ width: css(Math.min(1, h)) }}></i>
        <em style=${{ left: css(HUMIDITY.dry), width: css(HUMIDITY.wet - HUMIDITY.dry) }} title=${t('comp.ideal', 'ideal')}></em></span>
      <span class="hum-scale" aria-hidden="true"><b style=${{ width: css(HUMIDITY.dry) }}>${t('comp.dry', 'Seco')}</b><b style=${{ width: css(HUMIDITY.wet - HUMIDITY.dry) }}>${t('comp.ideal2', 'Ideal')}</b><b>${t('comp.wet', 'Húmedo · moho')}</b></span>
      <small class="hum-legend">${t('comp.parts', 'Lo que moja (azul) y lo que seca (marrón):')}</small>
      <ul class="hum-parts">${humidityParts(home).filter((p) => p.amount).map((p) => html`<li class=${p.amount > 0 ? 'up' : 'down'}>${label(p.source)} ${signed(p.amount)}</li>`)}</ul>
    </div>
    <div class="lid-row" role="radiogroup" aria-label=${t('comp.lid', 'Tapa')}><${Icon} name="lid" size="18" />
      ${LID_NAMES.map((n, k) => html`<button class=${`btn small${(home.lid ?? 1) === k ? ' active' : ''}`} role="radio" aria-checked=${(home.lid ?? 1) === k} onClick=${() => s.lid(k)}>${t(`lid.${k}`, n)}</button>`)}
      <span class="trend">${pct(h)} → ${pct(humidityTarget(home))}</span></div>
    <p class="side-help">${t('comp.soilHelp', 'El suelo se moja donde rocías y junto al agua, y se seca solo. Donde se mantiene húmedo crece musgo; donde se seca, se agrieta.')}</p>
    ${''}
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
