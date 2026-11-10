// Mapa exterior: los terrarios y dioramas flotantes del día. Elegir uno y, si se sale, quién va.
import { html, useState } from '../lib.js';
import { t } from '../../i18n/index.js';
import { ISLAND_KINDS, BIOMES, WEATHERS, VESSELS } from '../../data/world.js';
import { ABERRATIONS } from '../../data/aberrations.js';
import { CamControls, PauseButton } from './common.js';
import { PartyPicker } from './party.js';
import { portraitURL } from '../../view/sprites.js';
import { Icon } from '../icons.js';

// Rótulos sin solaparse en pantalla: de arriba abajo, cada uno baja lo justo si choca con uno ya puesto.
const LABEL_W = 130, LABEL_H = 66;
function spread(list) {
  const placed = [], out = {};
  for (const l of [...list].sort((a, b) => a.y - b.y)) {
    let y = l.y;
    for (const p of placed) if (Math.abs(p.x - l.x) < LABEL_W && Math.abs(p.y - y) < LABEL_H) y = p.y + LABEL_H * 0.6; // solo lo justo
    placed.push({ x: l.x, y });
    out[l.id] = { x: l.x, y };
  }
  return out;
}

export function Islands({ s }) {
  const [sel, setSel] = useState(null);
  const [party, setParty] = useState([]);
  const isl = s.game.islands.find((i) => i.id === sel);
  const done = (i) => s.game.visited.includes(i.id);
  const need = isl?.kind === 'nido' ? 3 : 1;
  const go = () => (isl.kind === 'hogar' ? s.goHome() : isl.kind === 'nido' ? s.startRun(isl, party) : s.startGather(isl, party[0]));

  const pos = spread(s.game.islands.map((i) => ({ id: i.id, ...s.view.labelAt(i.id) })));

  return html`<main class="screen islands">
    <header class="hud-top"><div class="title-block"><span class="kicker">${t('ui.day', 'Día')} ${s.game.day}</span><h2>${t('islands.title', 'El archipiélago')}</h2></div><${PauseButton} s=${s} /></header>
    <div class="world-input" onPointerDown=${(e) => { const id = s.view.pick(e); const i = s.game.islands.find((x) => x.id === id); if (i && !done(i)) { setSel(i.id); setParty([]); } }}></div>
    <${CamControls} s=${s} />
    <ul class="isle-labels">${s.game.islands.map((i) => {
      const p = pos[i.id];
      return html`<li class=${`isle-label isle-${i.kind}${sel === i.id ? ' sel' : ''}${done(i) ? ' done' : ''}`} style=${{ left: `${p.x}px`, top: `${p.y}px` }}>
        <button disabled=${done(i)} aria-pressed=${sel === i.id} onClick=${() => { setSel(i.id); setParty([]); }}>
          <span class="gem"><${Icon} name=${i.kind} size="18" /></span><span class="nm">${i.kind === 'hogar' ? ISLAND_KINDS.hogar.name : BIOMES[i.biome].name}</span>
        </button>
      </li>`;
    })}</ul>

    ${isl && html`<section class=${`drawer island-info${isl.kind !== 'hogar' ? ' expedition' : ''}`}>
      <div class="isl-head">
        <div>
          <h3><${Icon} name=${isl.kind} size="22" /> ${ISLAND_KINDS[isl.kind].name}${isl.kind !== 'hogar' ? ` · ${BIOMES[isl.biome].name}` : ''}</h3>
          <p>${ISLAND_KINDS[isl.kind].desc}</p>
          ${isl.kind !== 'hogar' && html`<p class="chips"><span class="chip">${VESSELS[isl.vessel ?? 'tanque'].name}</span><span class="chip">${WEATHERS[isl.weather].name}${WEATHERS[isl.weather].yield > 1 ? ` · ${t('islands.more', 'más recursos')}` : ''}</span></p>`}
        </div>
        ${isl.kind === 'nido' && html`<figure class="guard"><img src=${portraitURL(ABERRATIONS[BIOMES[isl.biome].boss].sprite)} alt="" /><figcaption>${t('islands.guard', 'Guardiana')}: ${ABERRATIONS[BIOMES[isl.biome].boss].name}</figcaption></figure>`}
      </div>
      ${isl.kind !== 'hogar' && html`<${PartyPicker} s=${s} need=${need} party=${party} setParty=${setParty} />`}
      <div class="actions">
        <button class="btn ghost" onClick=${() => setSel(null)}>${t('ui.back', 'Volver')}</button>
        <button class="btn primary" disabled=${isl.kind !== 'hogar' && party.length !== need} onClick=${go}>${isl.kind === 'hogar' ? t('islands.home', 'Volver al terrario') : t('islands.go', 'Partir')}</button>
      </div>
    </section>`}
  </main>`;
}
