import { html, useState } from '../lib.js';
import { t } from '../../i18n/index.js';
import { BUILDINGS } from '../../data/buildings.js';
import { CLASSES } from '../../data/isopods.js';
import { RESOURCES } from '../../data/resources.js';
import { calm, beds, canAfford, nextExpansion } from '../../game/home.js';
import { Resources, Cost, Bar, ResIcon, CamControls } from './common.js';

const drag = { x: 0, moved: false, down: false };

export function Home({ s }) {
  const home = s.game.home;
  const [panel, setPanel] = useState(null);
  const [toast, setToast] = useState(null);
  const say = (msg) => { setToast(msg); clearTimeout(say.t); say.t = setTimeout(() => setToast(null), 1600); };
  const toggle = (p) => { if (s.build) s.cancelBuild(); setPanel(panel === p ? null : p); };

  // Arrastrar gira la cámara; tocar sin arrastrar coloca o recoge.
  const onDown = (e) => { Object.assign(drag, { x: e.clientX, moved: false, down: true }); e.currentTarget.setPointerCapture(e.pointerId); };
  const onMove = (e) => {
    if (drag.down && Math.abs(e.clientX - drag.x) > 8) drag.moved = true;
    if (drag.down && drag.moved) { s.stage.rotate((e.clientX - drag.x) * -0.008); drag.x = e.clientX; return; }
    if (s.build) { const c = s.view.cellAt(e); if (c) s.hoverBuild(c.i, c.j); }
  };
  const onUp = (e) => { const tap = drag.down && !drag.moved; drag.down = false; if (tap) onTap(e); };
  const onTap = (e) => {
    const c = s.view.cellAt(e);
    if (!c) return;
    if (s.build) { s.hoverBuild(c.i, c.j); if (!s.confirmBuild()) say(t('home.cantPlace', 'No cabe ahí o faltan recursos.')); return; }
    const got = s.tapHome(c);
    if (got) say(`+${got.n} ${RESOURCES[got.res].name}`);
  };
  const exp = nextExpansion(home);

  return html`<main class="screen home">
    <div class="world-input" onPointerDown=${onDown} onPointerMove=${onMove} onPointerUp=${onUp} onWheel=${(e) => s.stage.zoom(e.deltaY > 0 ? 1.08 : 0.93)}></div>
    <${CamControls} s=${s} />
    <header class="hud-top">
      <div class="title-block"><span class="kicker">${t('ui.day', 'Día')} ${s.game.day}</span><h2>${t('home.title', 'Tu terrario')}</h2></div>
      <div class="calm"><span>${t('home.calm', 'Calma')}</span><${Bar} value=${calm(home)} max=${1} kind="calm" label=${t('home.calm', 'Calma')} /></div>
      <${Resources} have=${home.resources} />
    </header>

    ${toast && html`<p class="toast" role="status">${toast}</p>`}

    ${s.build && html`<div class="build-bar">
      <span>${BUILDINGS[s.build.type].name} — ${t('home.tapToPlace', 'toca una celda para colocar')}</span>
      <button class="btn" onClick=${() => s.rotateBuild()}>${t('home.rotate', 'Girar')}</button>
      <button class="btn ghost" onClick=${() => s.cancelBuild()}>${t('ui.done', 'Listo')}</button>
    </div>`}

    ${panel === 'build' && !s.build && html`<section class="drawer" aria-label=${t('home.build', 'Construir')}>
      ${Object.entries(BUILDINGS).map(([id, b]) => html`<button class="card-btn" disabled=${!canAfford(home, b.cost)} onClick=${() => { setPanel(null); s.startBuild(id); }}>
        <b>${b.name}</b><small>${b.size.w}×${b.size.h}${b.produces ? ` · ${t('home.makes', 'da')} ${RESOURCES[b.produces.res].name}` : ''}${b.calm ? ` · +${t('home.calm', 'calma')}` : ''}${b.beds ? ` · +${b.beds} ${t('home.beds', 'camas')}` : ''}</small>
        <${Cost} cost=${b.cost} have=${home.resources} />
      </button>`)}
      ${exp && html`<button class="card-btn" disabled=${!canAfford(home, exp.cost)} onClick=${() => s.expandHome() && say(t('home.expanded', 'El terrario crece.'))}>
        <b>${t('home.expand', 'Ampliar terrario')}</b><small>${exp.side}×${exp.side}</small><${Cost} cost=${exp.cost} have=${home.resources} />
      </button>`}
    </section>`}

    ${panel === 'colony' && html`<section class="drawer colony" aria-label=${t('home.colony', 'Colonia')}>
      <p class="muted">${home.isopods.length} / ${beds(home)} ${t('home.beds', 'camas')}</p>
      ${home.isopods.map((iso) => html`<div class="iso-row">
        <b>${iso.name}</b><small>${CLASSES[iso.cls].name}</small>
        <${Bar} value=${iso.hunger} max=${1} kind="food" label=${t('home.food', 'Saciedad')} />
      </div>`)}
      ${home.resources.hojarasca <= 0 && html`<p class="warn"><${ResIcon} res="hojarasca" /> ${t('home.noFood', 'Sin hojarasca el comedero queda vacío.')}</p>`}
    </section>`}

    <nav class="hud-bottom">
      <button class=${`btn${panel === 'build' ? ' active' : ''}`} onClick=${() => toggle('build')}>${t('home.build', 'Construir')}</button>
      <button class=${`btn${panel === 'colony' ? ' active' : ''}`} onClick=${() => toggle('colony')}>${t('home.colony', 'Colonia')}</button>
      <button class="btn primary" onClick=${() => s.goArchipelago()}>${t('home.out', 'Salir al archipiélago')}</button>
      <button class="btn ghost icon" onClick=${() => s.goMenu()} aria-label=${t('ui.menu', 'Menú')}>☰</button>
    </nav>
  </main>`;
}
