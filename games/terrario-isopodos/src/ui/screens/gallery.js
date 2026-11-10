// Galería (como la de KureiChaosChess): bestiario de aberraciones (sombra hasta verlas, cuántas vencidas y cómo
// pelean), isópodos criados por especie y logros por grupo.
import { html, useState } from '../lib.js';
import { t } from '../../i18n/index.js';
import { ABERRATIONS } from '../../data/aberrations.js';
import { SPECIES } from '../../data/species.js';
import { ACHIEVEMENTS, ACHIEVEMENT_GROUPS } from '../../data/achievements.js';
import { portraitURL } from '../../view/sprites.js';
import { Icon } from '../icons.js';

const TABS = { bestiario: () => t('gallery.foes', 'Bestiario'), isopodos: () => t('gallery.species', 'Isópodos'), logros: () => t('gallery.achievements', 'Logros') };

export function Gallery({ s }) {
  const [tab, setTab] = useState('bestiario');
  const m = s.meta;
  return html`<main class="screen settings gallery">
    <header class="topbar">
      <button class="btn ghost icon" onClick=${() => s.closeGallery()} aria-label=${t('ui.back', 'Volver')}><${Icon} name="back" /></button>
      <h2>${t('gallery.title', 'Galería')}</h2>
    </header>
    <div class="segmented tabs" role="tablist">${Object.entries(TABS).map(([id, name]) => html`<button role="tab" aria-selected=${tab === id} class=${tab === id ? 'on' : ''} onClick=${() => setTab(id)}>${name()}</button>`)}</div>
    <div class="set-body gal-grid">
      ${tab === 'bestiario' && Object.entries(ABERRATIONS).map(([id, a]) => { const seen = m.seen[id]; return html`<article class=${`panel gal-card${seen ? '' : ' unseen'}`}>
        <img src=${portraitURL(a.sprite)} alt="" />
        <h3>${seen ? a.name : '???'}</h3>
        <small class="tag">${t(`role.${a.role}`, { normal: 'Común', elite: 'Élite', jefe: 'Guardiana' }[a.role])}</small>
        <p>${seen ? a.pattern : t('gallery.unseen', 'Aún no la has visto en un nido.')}</p>
        ${seen && html`<small class="muted">${t('gallery.beaten', 'Vencidas')}: ${m.beaten[id] ?? 0}</small>`}
      </article>`; })}
      ${tab === 'isopodos' && Object.entries(SPECIES).map(([id, sp]) => { const had = m.species[id]; return html`<article class=${`panel gal-card${had ? '' : ' unseen'}`}>
        <img src=${portraitURL(`iso:${id}`)} alt="" />
        <h3>${had ? sp.name : '???'}</h3><small><i>${sp.latin}</i></small>
        <p>${had ? sp.desc : t('gallery.noSpecies', 'Todavía no vive ninguna en tu terrario.')}</p>
        ${had && html`<small class="tag">${sp.rolls ? t('species.rolls', 'se hace bolita') : t('species.runs', 'corre')}</small>`}
      </article>`; })}
      ${tab === 'logros' && ACHIEVEMENT_GROUPS.map((g) => { const list = ACHIEVEMENTS.filter((a) => a.group === g); return html`<section class="panel set-card ach-group">
        <h2>${g} <small class="muted">${list.filter((a) => m.got.includes(a.id)).length}/${list.length}</small></h2>
        ${list.map((a) => html`<div class=${`ach${m.got.includes(a.id) ? ' got' : ''}`}><span class="ach-ico"><${Icon} name=${a.icon} size="20" /></span><span><b>${a.name}</b><small>${a.desc}</small></span></div>`)}
      </section>`; })}
    </div>
  </main>`;
}

// Cartel de logro: entra por arriba, se queda un momento y se va (CSS).
export const AchievementToast = ({ s }) => s.toastAch && s.time - s.toastAch.at < 3.2 && html`<div class="ach-toast" role="status" key=${s.toastAch.id}>
  <span class="ach-ico"><${Icon} name=${s.toastAch.icon} size="22" /></span><span><small>${t('gallery.unlocked', 'Logro')}</small><b>${s.toastAch.name}</b></span></div>`;
