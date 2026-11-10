// Mapa exterior: página de cuaderno con las islas del día. Elegir isla y, si se sale, quién va.
import { html, useState } from '../lib.js';
import { t } from '../../i18n/index.js';
import { ISLAND_KINDS, BIOMES, WEATHERS } from '../../data/world.js';
import { ABERRATIONS } from '../../data/aberrations.js';
import { CLASSES } from '../../data/isopods.js';
import { Bar } from './common.js';

const blob = (isl) => {
  const pts = Array.from({ length: 9 }, (_, k) => {
    const a = (k / 9) * Math.PI * 2, r = isl.r * (0.82 + ((isl.seed >> k) % 7) / 30);
    return `${(isl.x + Math.cos(a) * r * 1.25) * 100},${(isl.y + Math.sin(a) * r * 0.75) * 100}`;
  });
  return `M${pts.join('L')}Z`;
};

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
        <path class="under" d=${blob({ ...i, y: i.y + 0.025 })} />
        <path d=${blob(i)} />
        <text x=${i.x * 100} y=${(i.y + i.r * 0.75 + 0.06) * 100}>${i.kind === 'hogar' ? ISLAND_KINDS.hogar.name : BIOMES[i.biome].name}</text>
        <text class="glyph" x=${i.x * 100} y=${i.y * 100 + 1.5}>${i.kind === 'nido' ? '☠' : i.kind === 'hogar' ? '⌂' : '✿'}</text>
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
