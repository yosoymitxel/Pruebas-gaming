// Panel «Terrario»: corte del recipiente con sus capas y el clima interior que producen, con qué lo causa y
// qué efecto tiene. Mejorar una capa se hace aquí.
import { html } from '../lib.js';
import { t } from '../../i18n/index.js';
import { LAYERS, HUMIDITY, CLIMATES } from '../../data/substrate.js';
import { BUILDINGS } from '../../data/buildings.js';
import { WEATHERS } from '../../data/world.js';
import { layer, humidity, humidityParts, climate, homeEffects, calm, nextLayerCost, canAfford } from '../../game/home.js';
import { Cost, Bar } from './common.js';
import { Icon } from '../icons.js';

const ORDER = ['hojarasca', 'tierra', 'carbon', 'grava']; // de arriba abajo, como se ve en el vidrio
const BAND = { grava: [4, 4], carbon: [2, 3], tierra: [5, 4], hojarasca: [1, 3] }; // alto base, alto por nivel
const pct = (v) => `${Math.round(v * 100)} %`;
const css = (v) => `${Math.round(v * 100)}%`;
const signed = (v) => `${v >= 0 ? '+' : '−'}${Math.round(Math.abs(v) * 100)} %`;

function CrossSection({ home }) {
  let y = 70;
  const bands = [...ORDER].reverse().map((id) => {
    const h = BAND[id][0] + layer(home, id) * BAND[id][1];
    y -= h;
    return html`<rect class=${`band band-${id}`} x="6" y=${y} width="58" height=${h} />`;
  });
  return html`<svg class="cross" viewBox="0 0 70 72" role="img" aria-label=${t('comp.cross', 'Corte del terrario')}>
    <path class="plant" d=${`M18 ${y} q-2 -10 -6 -14 M18 ${y} q3 -12 8 -15 M44 ${y} q0 -8 4 -12 M50 ${y} q-1 -6 -4 -9`} />
    ${bands}
    <rect class="vessel" x="6" y="6" width="58" height="64" />
  </svg>`;
}

export function Composition({ s, say }) {
  const home = s.game.home, clim = climate(home), eff = homeEffects(home), h = humidity(home), fix = CLIMATES[clim].fix;
  const label = (src) => (src === 'base' ? t('comp.base', 'Base') : src === 'weather' ? `${t('comp.weather', 'Clima')} (${WEATHERS[home.weather].name})` : src === 'rocio' ? t('comp.mist', 'Rociado') : BUILDINGS[src].name);
  const upgrade = (id) => { if (s.upgradeLayer(id)) say(`${LAYERS[id].name} ↑`); };
  return html`<section class="drawer composition" aria-label=${t('comp.title', 'Composición del terrario')}>
    <div class="comp-side">
      <${CrossSection} home=${home} />
      <div class="comp-stats">
        <h3 class=${`clim-title clim-${clim}`}>${CLIMATES[clim].name}</h3>
        <p class="clim-desc">${CLIMATES[clim].desc}</p>
        ${fix && html`<p class=${`fix clim-${clim}`}><${Icon} name="expand" size="16" />${fix.layer ? html`${t('comp.fixLayer', 'Sube')} <b>${LAYERS[fix.layer].name}</b>` : ''}
          ${fix.pieces ? html`${t('comp.fixAdd', 'Pon')} <b>${fix.pieces.map((id) => BUILDINGS[id].name).join(' / ')}</b>` : ''}
          ${fix.less ? html` · ${t('comp.fixLess', 'menos')} <b>${BUILDINGS[fix.less].name}</b>` : ''}</p>`}
        <div class="humidity">
          <span>${t('comp.humidity', 'Humedad')} <b>${pct(h)}</b></span>
          <span class=${`hum-bar clim-${clim}`}><i style=${{ width: css(Math.min(1, h)) }}></i>
            <em style=${{ left: css(HUMIDITY.dry), width: css(HUMIDITY.wet - HUMIDITY.dry) }} title=${t('comp.ideal', 'ideal')}></em></span>
          <small>${humidityParts(home).filter((p) => p.amount).map((p) => `${label(p.source)} ${signed(p.amount)}`).join(' · ')}</small>
        </div>
        <ul class="effects">
          <li>${t('comp.prod', 'Producción')} <b>×${eff.prodMul.toFixed(2)}</b></li>
          <li>${t('comp.hunger', 'Hambre')} <b>×${eff.hungerMul.toFixed(2)}</b></li>
          <li>${t('home.calm', 'Calma')} <${Bar} value=${calm(home)} max=${1} kind="calm" label=${t('home.calm', 'Calma')} /></li>
        </ul>
      </div>
    </div>
    <ul class="layers">${ORDER.map((id) => {
      const cost = nextLayerCost(home, id);
      return html`<li class=${fix?.layer === id ? 'fix-target' : ''}>
        <span class=${`swatch band-${id}`}></span>
        <div><b>${LAYERS[id].name}</b> <small class="lv">${layer(home, id)}/${LAYERS[id].costs.length}</small><p>${LAYERS[id].desc}</p></div>
        ${cost ? html`<button class="btn" disabled=${!canAfford(home, cost)} onClick=${() => upgrade(id)}><${Icon} name="expand" size="16" /><${Cost} cost=${cost} have=${home.resources} /></button>`
          : html`<small class="muted">${t('comp.max', 'al máximo')}</small>`}
      </li>`;
    })}</ul>
  </section>`;
}
