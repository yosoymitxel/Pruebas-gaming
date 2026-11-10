import { html, useState } from '../lib.js';
import { t } from '../../i18n/index.js';
import { BUILDINGS } from '../../data/buildings.js';
import { CLASSES } from '../../data/isopods.js';
import { RESOURCES } from '../../data/resources.js';
import { calm, beds, canAfford, nextExpansion, climate, humidity, lvl, upgradeCost } from '../../game/home.js';
import { MAX_LEVEL } from '../../data/buildings.js';
import { Resources, Cost, Bar, ResIcon, CamControls, FxLayer, DayClock } from './common.js';
import { Icon } from '../icons.js';
import { Composition } from './composition.js';
import { CLIMATES } from '../../data/substrate.js';
import { WEATHERS, DAY_PHASES } from '../../data/world.js';
import { speciesOf } from '../../data/species.js';
import { portraitURL } from '../../view/sprites.js';

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
    if (got?.res) say(`+${got.n} ${RESOURCES[got.res].name}`);
  };
  const exp = nextExpansion(home);
  const sel = s.selPiece ? home.grid.pieces[s.selPiece] : null;

  return html`<main class="screen home">
    <div class="world-input" onPointerDown=${onDown} onPointerMove=${onMove} onPointerUp=${onUp} onWheel=${(e) => s.stage.zoom(e.deltaY > 0 ? 1.08 : 0.93)}></div>
    <${CamControls} s=${s} />
    <${FxLayer} s=${s} />
    <header class="hud-top">
      <div class="title-block row"><${DayClock} day=${s.game.day} clock=${s.game.clock} label=${`${t('ui.day', 'Día')} ${s.game.day} · ${DAY_PHASES[s.phase].name} · ${WEATHERS[s.game.home.weather]?.name ?? ''}`}
          onSleep=${s.phase === 'atardecer' || s.phase === 'noche' ? () => s.sleep() : null} />
        <div><span class="kicker">${DAY_PHASES[s.phase].name}${s.phase === 'atardecer' || s.phase === 'noche' ? ` · ${t('home.sleepHint2', 'toca el reloj: dormir')}` : ''}</span><h2>${t('home.title', 'Tu terrario')}</h2></div></div>
      <button class="climate-chip" onClick=${() => toggle('comp')}>${CLIMATES[climate(home)].name} · ${Math.round(humidity(home) * 100)} %</button>
      <div class="calm"><span>${t('home.calm', 'Calma')}</span><${Bar} value=${calm(home)} max=${1} kind="calm" label=${t('home.calm', 'Calma')} /></div>
      <${Resources} have=${home.resources} />
    </header>

    ${toast && html`<p class="toast" role="status">${toast}</p>`}

    ${s.build && html`<div class="build-bar">
      <span>${BUILDINGS[s.build.type].name} — ${t('home.tapToPlace', 'toca una celda para colocar')}</span>
      <button class="btn" onClick=${() => s.rotateBuild()}>${t('home.rotate', 'Girar')}</button>
      <button class="btn ghost" onClick=${() => s.cancelBuild()}>${t('ui.done', 'Listo')}</button>
    </div>`}

    ${sel && !s.build && html`<section class="drawer piece-card" aria-label=${BUILDINGS[sel.type].name}>
      <div class="pc-head"><h3>${BUILDINGS[sel.type].name}</h3><span class="lvl">${t('home.level', 'nivel')} ${lvl(sel)}/${MAX_LEVEL}</span>
        <button class="btn ghost icon" onClick=${() => { s.selPiece = null; s.emit(); }} aria-label=${t('ui.close', 'Cerrar')}><${Icon} name="back" /></button></div>
      <p>${BUILDINGS[sel.type].desc}</p>
      <div class="actions">
        ${upgradeCost(sel) && lvl(sel) < MAX_LEVEL ? html`<button class="btn primary" disabled=${!canAfford(home, upgradeCost(sel))} onClick=${() => s.upgradePiece(sel.id)}>
          <${Icon} name="expand" size="18" />${t('home.upgrade', 'Mejorar')} <${Cost} cost=${upgradeCost(sel)} have=${home.resources} /></button>` : html`<small class="muted">${t('home.maxed', 'No se puede mejorar más.')}</small>`}
        <button class="btn ghost" onClick=${() => s.storePiece(sel.id) || say(t('home.cantStore', 'Hace falta al menos un comedero.'))}>${t('home.store', 'Guardar')} · ${t('home.refund', 'devuelve la mitad')}</button>
      </div>
    </section>`}

    ${panel === 'build' && !s.build && html`<section class="drawer build-list" aria-label=${t('home.build', 'Construir')}>
      ${Object.entries(BUILDINGS).map(([id, b], k) => html`<button class="card-btn" style=${{ '--i': k }} disabled=${!canAfford(home, b.cost)} onClick=${() => { setPanel(null); s.startBuild(id); }}>
        <b>${b.name}</b><span class="desc">${b.desc}</span><small>${b.size.w}×${b.size.h}${b.produces ? ` · ${t('home.makes', 'da')} ${RESOURCES[b.produces.res].name}` : ''}${b.calm ? ` · +${t('home.calm', 'calma')}` : ''}${b.beds ? ` · +${b.beds} ${t('home.beds', 'camas')}` : ''}</small>
        <${Cost} cost=${b.cost} have=${home.resources} />
      </button>`)}
      ${exp && html`<button class="card-btn" disabled=${!canAfford(home, exp.cost)} onClick=${() => s.expandHome() && say(t('home.expanded', 'El terrario crece.'))}>
        <b>${t('home.expand', 'Ampliar terrario')}</b><small>${exp.side}×${exp.side}</small><${Cost} cost=${exp.cost} have=${home.resources} />
      </button>`}
    </section>`}

    ${panel === 'comp' && html`<${Composition} s=${s} say=${say} />`}

    ${panel === 'colony' && html`<section class="drawer colony" aria-label=${t('home.colony', 'Colonia')}>
      <p class="muted">${home.isopods.length} / ${beds(home)} ${t('home.beds', 'camas')}</p>
      ${home.isopods.map((iso) => { const sp = speciesOf(iso.shell); return html`<div class="iso-row" title=${sp.desc}>
        <img src=${portraitURL(`iso:${iso.shell}`)} alt="" />
        <span><b>${iso.name}</b><small>${sp.name} · <i>${sp.latin}</i></small>
        <small>${CLASSES[iso.cls].name}${sp.rolls ? ` · ${t('species.rolls', 'se hace bolita')}` : ` · ${t('species.runs', 'corre')}`} · ${t('species.likes', 'le gusta')} ${CLIMATES[sp.humidity].name.toLowerCase()}
          ${iso.baby > 0 ? html` · <b class="tag">${t('home.baby', 'cría')}</b>` : iso.molting > 0 ? html` · <b class="tag">${t('home.moltingTag', 'mudando')}</b>` : ''}</small></span>
        <${Bar} value=${iso.hunger} max=${1} kind="food" label=${t('home.food', 'Saciedad')} />
      </div>`; })}
      <p class="muted">${t('home.colonyHint', 'Toca un isópodo: los que pueden se hacen bolita. Las mudas del suelo son calcio.')}</p>
      ${home.resources.hojarasca <= 0 && html`<p class="warn"><${ResIcon} res="hojarasca" /> ${t('home.noFood', 'Sin hojarasca el comedero queda vacío.')}</p>`}
    </section>`}

    <nav class="hud-bottom">
      <button class=${`btn${panel === 'build' ? ' active' : ''}`} onClick=${() => toggle('build')}><${Icon} name="build" /> <span>${t('home.build', 'Construir')}</span></button>
      <button class=${`btn${panel === 'comp' ? ' active' : ''}`} onClick=${() => toggle('comp')}><${Icon} name="layers" /> <span>${t('home.terrarium', 'Terrario')}</span></button>
      <button class=${`btn${panel === 'colony' ? ' active' : ''}`} onClick=${() => toggle('colony')}><${Icon} name="colony" /> <span>${t('home.colony', 'Colonia')}</span></button>
      <button class="btn primary" aria-label=${t('home.out', 'Archipiélago')} onClick=${() => s.goArchipelago()}><${Icon} name="out" /> <span class="long">${t('home.out', 'Archipiélago')}</span><span class="short">${t('home.outShort', 'Islas')}</span></button>
      <button class="btn ghost icon" onClick=${() => s.pause()} aria-label=${t('pause.open', 'Pausa (Esc)')}><${Icon} name="menu" /></button>
    </nav>
  </main>`;
}
