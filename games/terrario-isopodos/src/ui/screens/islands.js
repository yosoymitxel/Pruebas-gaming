// Mapa exterior: los terrarios y dioramas flotantes del día. Elegir uno y, si se sale, quién va.
import { html, useState } from '../lib.js';
import { t } from '../../i18n/index.js';
import { ISLAND_KINDS, BIOMES, WEATHERS, VESSELS } from '../../data/world.js';
import { ABERRATIONS } from '../../data/aberrations.js';
import { CLASSES } from '../../data/isopods.js';
import { Bar, CamControls } from './common.js';
import { Icon } from '../icons.js';

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
    <div class="world-input" onPointerDown=${(e) => { const id = s.view.pick(e); const i = s.game.islands.find((x) => x.id === id); if (i && !done(i)) { setSel(i.id); setParty([]); } }}></div>
    <${CamControls} s=${s} />
    <ul class="isle-labels">${s.game.islands.map((i) => {
      const p = s.view.labelAt(i.id);
      return html`<li class=${`isle-label isle-${i.kind}${sel === i.id ? ' sel' : ''}${done(i) ? ' done' : ''}`} style=${{ left: `${p.x}px`, top: `${p.y}px` }}>
        <button disabled=${done(i)} aria-pressed=${sel === i.id} onClick=${() => { setSel(i.id); setParty([]); }}>
          <${Icon} name=${i.kind} size="16" /> ${i.kind === 'hogar' ? ISLAND_KINDS.hogar.name : BIOMES[i.biome].name}
        </button>
      </li>`;
    })}</ul>

    ${isl && html`<section class="drawer island-info">
      <h3>${ISLAND_KINDS[isl.kind].name}${isl.kind !== 'hogar' ? ` · ${BIOMES[isl.biome].name}` : ''}</h3>
      <p class="muted">${VESSELS[isl.vessel ?? 'tanque'].name}</p>
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
