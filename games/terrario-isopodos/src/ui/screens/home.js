import { html, useState } from '../lib.js';
import { t } from '../../i18n/index.js';
import { BUILDINGS } from '../../data/buildings.js';
import { RESOURCES } from '../../data/resources.js';
import { calm, canAfford, nextExpansion, climate, humidity, lvl, upgradeCost } from '../../game/home.js';
import { MAX_LEVEL } from '../../data/buildings.js';
import { Resources, Cost, Bar, ResIcon, CamControls, FxLayer, DayClock } from './common.js';
import { Icon } from '../icons.js';
import { Composition } from './composition.js';
import { ColonyList, IsoHub } from './colony.js';
import { pieceThumb } from '../../view/thumbs.js';
import { CLIMATES, HUMIDITY } from '../../data/substrate.js';
import { WEATHERS, DAY_PHASES } from '../../data/world.js';

const drag = { x: 0, y: 0, moved: false, down: false };
const half = (cost) => Object.fromEntries(Object.entries(cost).map(([r, n]) => [r, Math.floor(n / 2)]).filter(([, n]) => n > 0));
// Lo que gana una pieza al subir de nivel (game/home.js: producción +35 % por nivel, camas por nivel).
const gainOf = (b) => (b.produces ? `+35 % ${RESOURCES[b.produces.res].name.toLowerCase()}` : b.beds ? `+${b.beds} ${t('home.beds', 'camas')}` : b.calm ? `+${t('home.calm', 'calma')}` : '');

// Medidor de humedad: franjas seco · ideal · húmedo · moho con una aguja; se entiende sin leer.
const ZONES = [['seco', HUMIDITY.dry], ['ideal', HUMIDITY.wet], ['humedo', HUMIDITY.flood], ['moho', 1]];
const CLIMATE_ICON = { seco: 'refugio', ideal: 'leaf', humedo: 'items', moho: 'nido' };
function HumidityGauge({ home, onClick }) {
  const h = humidity(home), kind = climate(home);
  let from = 0;
  return html`<button class=${`gauge gauge-${kind}`} onClick=${onClick} aria-label=${`${CLIMATES[kind].name} · ${Math.round(h * 100)} %`} title=${CLIMATES[kind].desc}>
    <${Icon} name=${CLIMATE_ICON[kind]} size="18" />
    <span class="track">${ZONES.map(([z, to]) => { const el = html`<i class=${`z-${z}`} style=${{ left: `${from * 100}%`, width: `${(to - from) * 100}%` }}></i>`; from = to; return el; })}
      <b class="needle" style=${{ left: `${Math.min(1, h) * 100}%` }}></b></span>
  </button>`;
}

export function Home({ s }) {
  const home = s.game.home;
  const [panel, setPanel] = useState(null);
  const [toast, setToast] = useState(null);
  const say = (msg) => { setToast(msg); clearTimeout(say.t); say.t = setTimeout(() => setToast(null), 1600); };
  const toggle = (p) => { if (s.build) s.cancelBuild(); if (s.selIso != null) s.selectIso(null); setPanel(panel === p ? null : p); };

  // Arrastrar gira la cámara; tocar sin arrastrar coloca o recoge.
  const onDown = (e) => { Object.assign(drag, { x: e.clientX, y: e.clientY, moved: false, down: true }); e.currentTarget.setPointerCapture(e.pointerId); };
  const onMove = (e) => {
    if (drag.down && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) drag.moved = true;
    if (drag.down && drag.moved) {
      if (s.freeCam) { // desplazar: el arrastre mueve el punto que mira la cámara, según hacia dónde mira
        const k = s.stage.camDist * 0.0022, dx = (e.clientX - drag.x) * k, dy = (e.clientY - drag.y) * k, y = s.stage.yaw, tg = s.stage.target;
        s.stage.frame([tg.x - Math.cos(y) * dx - Math.sin(y) * dy, tg.z + Math.sin(y) * dx - Math.cos(y) * dy], s.stage.distance, s.stage.fit);
      } else s.stage.rotate((e.clientX - drag.x) * -0.008);
      drag.x = e.clientX; drag.y = e.clientY; return;
    }
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
        <div class="calm"><h2>${t('home.title', 'Tu terrario')}</h2><${Bar} value=${calm(home)} max=${1} kind="calm" label=${t('home.calm', 'Calma')} /></div></div>
      <${HumidityGauge} home=${home} onClick=${() => toggle('comp')} />
      <${Resources} have=${home.resources} />
    </header>

    ${toast && html`<p class="toast" role="status">${toast}</p>`}

    ${s.build && html`<div class="build-bar">
      <span>${s.build.moving != null ? html`<${Icon} name="move" size="16" /> ` : ''}${BUILDINGS[s.build.type].name}</span>
      <button class="btn" onClick=${() => s.rotateBuild()}>${t('home.rotate', 'Girar')}</button>
      <button class="btn ghost" onClick=${() => s.cancelBuild()}>${t('ui.done', 'Listo')}</button>
    </div>`}

    ${sel && !s.build && html`<section class="drawer piece-card" aria-label=${BUILDINGS[sel.type].name}>
      <div class="pc-head"><h3>${BUILDINGS[sel.type].name}</h3>
        <span class="pips" aria-label=${`${t('home.level', 'nivel')} ${lvl(sel)}/${MAX_LEVEL}`}>${Array.from({ length: MAX_LEVEL }, (_, k) => html`<i class=${k < lvl(sel) ? 'on' : ''}></i>`)}</span>
        <button class="btn ghost icon" onClick=${() => { s.selPiece = null; s.emit(); }} aria-label=${t('ui.close', 'Cerrar')}><${Icon} name="back" /></button></div>
      <p class="pc-desc">${BUILDINGS[sel.type].desc}</p>
      ${upgradeCost(sel) && lvl(sel) < MAX_LEVEL ? html`<button class="btn primary upgrade" disabled=${!canAfford(home, upgradeCost(sel))} onClick=${() => s.upgradePiece(sel.id)}>
          <span class="up-l"><${Icon} name="expand" size="18" />${t('home.upgrade', 'Mejorar')} <small>${gainOf(BUILDINGS[sel.type])}</small></span><${Cost} cost=${upgradeCost(sel)} have=${home.resources} /></button>`
        : html`<p class="maxed"><${Icon} name="botin" size="16" />${t('home.maxedShort', 'Nivel máximo')}</p>`}
      <div class="pc-tools">
        <button class="btn" onClick=${() => s.startMove(sel.id)}><${Icon} name="move" size="18" />${t('home.move', 'Mover')}</button>
        <button class="btn ghost" onClick=${() => s.storePiece(sel.id) || say(t('home.cantStore', 'Hace falta al menos un comedero.'))}><${Icon} name="out" size="18" />${t('home.store', 'Guardar')} <${Cost} cost=${half(BUILDINGS[sel.type].cost)} have=${home.resources} /></button>
      </div>
    </section>`}

    ${panel === 'build' && !s.build && html`<section class="drawer build-list" aria-label=${t('home.build', 'Construir')}>
      ${Object.entries(BUILDINGS).map(([id, b], k) => html`<button class="card-btn" style=${{ '--i': k }} disabled=${!canAfford(home, b.cost)} onClick=${() => { setPanel(null); s.startBuild(id); }}>
        <img class="thumb" src=${pieceThumb(s.stage.renderer, id)} alt="" /><b>${b.name}</b><span class="desc">${b.desc}</span><span class="tags"><span>${b.size.w}×${b.size.h}</span>${b.produces && html`<span title=${RESOURCES[b.produces.res].name}>+<${ResIcon} res=${b.produces.res} /></span>`}
          ${b.beds && html`<span title=${t('home.beds', 'camas')}><${Icon} name="colony" size="14" />+${b.beds}</span>`}${b.calm && html`<span class="calm-tag" title=${t('home.calm', 'calma')}><${Icon} name="leaf" size="14" />+</span>`}</span>
        <${Cost} cost=${b.cost} have=${home.resources} />
      </button>`)}
      ${exp && html`<button class="card-btn" disabled=${!canAfford(home, exp.cost)} onClick=${() => s.expandHome() && say(t('home.expanded', 'El terrario crece.'))}>
        <b>${t('home.expand', 'Ampliar terrario')}</b><small>${exp.side}×${exp.side}</small><${Cost} cost=${exp.cost} have=${home.resources} />
      </button>`}
    </section>`}

    ${panel === 'comp' && html`<${Composition} s=${s} say=${say} />`}

    ${s.selIso != null ? html`<${IsoHub} s=${s} />` : panel === 'colony' && html`<${ColonyList} s=${s} />`}

    <nav class="hud-bottom">
      <button class=${`btn${panel === 'build' ? ' active' : ''}`} onClick=${() => toggle('build')}><${Icon} name="build" /> <span>${t('home.build', 'Construir')}</span></button>
      <button class=${`btn${panel === 'comp' ? ' active' : ''}`} onClick=${() => toggle('comp')}><${Icon} name="layers" /> <span>${t('home.terrarium', 'Terrario')}</span></button>
      <button class="btn" disabled=${home.mistCd > 0} onClick=${() => s.mist()} aria-label=${t('home.mist', 'Rociar')}><${Icon} name="items" /> <span>${home.mistCd > 0 ? `${Math.ceil(home.mistCd)} s` : t('home.mist', 'Rociar')}</span></button>
      <button class=${`btn${panel === 'colony' ? ' active' : ''}`} onClick=${() => toggle('colony')}><${Icon} name="colony" /> <span>${t('home.colony', 'Colonia')}</span></button>
      <button class="btn primary" aria-label=${t('home.out', 'Archipiélago')} onClick=${() => s.goArchipelago()}><${Icon} name="out" /> <span class="long">${t('home.out', 'Archipiélago')}</span><span class="short">${t('home.outShort', 'Islas')}</span></button>
      <button class="btn ghost icon" onClick=${() => s.pause()} aria-label=${t('pause.open', 'Pausa (Esc)')}><${Icon} name="menu" /></button>
    </nav>
  </main>`;
}
