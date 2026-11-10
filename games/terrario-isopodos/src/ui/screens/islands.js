// Mapa exterior: página de cuaderno con los terrarios flotantes del día. Elegir uno y, si se sale, quién va.
import { html, useState } from '../lib.js';
import { t } from '../../i18n/index.js';
import { ISLAND_KINDS, BIOMES, WEATHERS } from '../../data/world.js';
import { ABERRATIONS } from '../../data/aberrations.js';
import { CLASSES } from '../../data/isopods.js';
import { Bar } from './common.js';
import { IconAt } from '../icons.js';

// Cada isla es un terrario flotante dibujado a tinta: tanque (hogar), frasco (recolección), globo (nido).
function Vessel({ isl }) {
  const x = isl.x * 100, y = isl.y * 100, r = isl.r * 100;
  const shadow = html`<ellipse class="shadow" cx=${x} cy=${y + r * 1.25} rx=${r * 0.8} ry=${r * 0.14} />`;
  if (isl.kind === 'hogar') {
    const w = r * 1.7, h = r * 1.2;
    return html`${shadow}<rect class="soil" x=${x - w / 2} y=${y + h * 0.1} width=${w} height=${h * 0.4} />
      <path class="moss" d=${`M${x - w / 2},${y + h * 0.1} q${w / 4},${-h * 0.12} ${w / 2},0 t${w / 2},0 v${h * 0.08} h${-w} z`} />
      <rect class="glass" x=${x - w / 2} y=${y - h / 2} width=${w} height=${h} />
      <rect class="base" x=${x - w / 2 - 1} y=${y + h / 2} width=${w + 2} height="1.6" />`;
  }
  if (isl.kind === 'recoleccion') {
    const w = r * 1.2, h = r * 1.5;
    return html`${shadow}<rect class="soil" x=${x - w / 2} y=${y + h * 0.05} width=${w} height=${h * 0.45} rx="1.5" />
      <path class="moss" d=${`M${x - w / 2},${y + h * 0.05} q${w / 2},${-h * 0.16} ${w},0 v${h * 0.06} h${-w} z`} />
      <rect class="glass" x=${x - w / 2} y=${y - h / 2} width=${w} height=${h} rx="2.5" />
      <ellipse class="lip" cx=${x} cy=${y - h / 2} rx=${w / 2} ry="1.2" />`;
  }
  return html`${shadow}<path class="soil dark" d=${`M${x - r * 0.95},${y + r * 0.3} A${r},${r} 0 0 0 ${x + r * 0.95},${y + r * 0.3} Z`} />
    <circle class="glass" cx=${x} cy=${y} r=${r} />
    <rect class="base" x=${x - r * 0.55} y=${y + r * 0.95} width=${r * 1.1} height="1.6" />`;
}

export function Islands({ s }) {
  const [sel, setSel] = useState(null);
  const [party, setParty] = useState([]);
  const isl = s.game.islands.find((i) => i.id === sel);
  const done = (i) => s.game.visited.includes(i.id);
  const need = isl?.kind === 'nido' ? 3 : 1;
  const pick = (id) => setParty(party.includes(id) ? party.filter((x) => x !== id) : party.length < need ? [...party, id] : party);
  const go = () => (isl.kind === 'hogar' ? s.goHome() : isl.kind === 'nido' ? s.startRun(isl, party) : s.startGather(isl, party[0]));

  return html`<main class="screen islands">
    <header class="hud-top"><div class="title-block"><span class="kicker">${t('ui.day', 'Día')} ${s.game.day}</span><h2>${t('islands.title', 'El archipiélago')}</h2></div></header>
    <svg class="sea" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" role="list">
      ${s.game.islands.map((i) => html`<g role="listitem" class=${`isle isle-${i.kind}${sel === i.id ? ' sel' : ''}${done(i) ? ' done' : ''}`}
          tabindex=${done(i) ? -1 : 0} onClick=${() => !done(i) && (setSel(i.id), setParty([]))}
          onKeyDown=${(e) => e.key === 'Enter' && !done(i) && (setSel(i.id), setParty([]))} aria-label=${ISLAND_KINDS[i.kind].name}>
        <${Vessel} isl=${i} />
        <text x=${i.x * 100} y=${(i.y + i.r * 1.25 + 0.05) * 100}>${i.kind === 'hogar' ? ISLAND_KINDS.hogar.name : BIOMES[i.biome].name}</text>
        <${IconAt} name=${i.kind} x=${i.x * 100} y=${i.y * 100 - i.r * 15 - 1.5} size="4.5" />
      </g>`)}
    </svg>

    ${isl && html`<section class="drawer island-info">
      <h3>${ISLAND_KINDS[isl.kind].name}${isl.kind !== 'hogar' ? ` · ${BIOMES[isl.biome].name}` : ''}</h3>
      <p>${ISLAND_KINDS[isl.kind].desc}</p>
      ${isl.kind !== 'hogar' && html`<p class="muted">${t('islands.weather', 'Clima')}: ${WEATHERS[isl.weather].name}${WEATHERS[isl.weather].yield > 1 ? ` · ${t('islands.more', 'más recursos')}` : ''}</p>`}
      ${isl.kind === 'nido' && html`<p class="muted">${t('islands.guard', 'Guardiana')}: ${ABERRATIONS[BIOMES[isl.biome].boss].name}</p>`}
      ${isl.kind !== 'hogar' && html`<p class="hint">${need === 3 ? t('islands.pick3', 'Elige 3: el primero es el principal, los otros dos lo apoyan.') : t('islands.pick1', 'Elige quién va.')}</p>
        <div class="party-pick">${s.game.home.isopods.map((iso) => {
          const k = party.indexOf(iso.id);
          return html`<button class=${`iso-chip${k >= 0 ? ' on' : ''}`} aria-pressed=${k >= 0} onClick=${() => pick(iso.id)}>
            ${k >= 0 && html`<i>${k === 0 ? '★' : k + 1}</i>`}<b>${iso.name}</b><small>${CLASSES[iso.cls].name}</small>
            <${Bar} value=${iso.hunger} max=${1} kind="food" label=${t('home.food', 'Saciedad')} />
          </button>`;
        })}</div>`}
      <div class="actions">
        <button class="btn ghost" onClick=${() => setSel(null)}>${t('ui.back', 'Volver')}</button>
        <button class="btn primary" disabled=${isl.kind !== 'hogar' && party.length !== need} onClick=${go}>${isl.kind === 'hogar' ? t('islands.home', 'Volver al terrario') : t('islands.go', 'Partir')}</button>
      </div>
    </section>`}
  </main>`;
}
