import { html, useState } from '../lib.js';
import { t } from '../../i18n/index.js';
import { BUILDINGS } from '../../data/buildings.js';
import { RESOURCES } from '../../data/resources.js';
import { calm, canAfford, nextExpansion, climate, humidity, lvl, upgradeCost, workersOf, sleepersOf } from '../../game/home.js';
import { portraitURL } from '../../view/sprites.js';
import { MAX_LEVEL } from '../../data/buildings.js';
import { Resources, Cost, ResIcon, CamControls, FxLayer, DayClock, CloseX } from './common.js';
import { Icon } from '../icons.js';
import { Composition } from './composition.js';
import { merchant, hasUpgrade } from '../../game/economy.js';
import { TRADES, UPGRADES } from '../../data/economy.js';
import { ColonyList, IsoHub } from './colony.js';
import { pieceThumb } from '../../view/thumbs.js';
import { CLIMATES, ZEN } from '../../data/substrate.js';
import { WEATHERS, DAY_PHASES } from '../../data/world.js';

const drag = { x: 0, y: 0, moved: false, down: false, pts: new Map(), pinch: 0 };
const pinchDist = () => { const [a, b] = [...drag.pts.values()]; return Math.hypot(a[0] - b[0], a[1] - b[1]) || 1; };
const half = (cost) => Object.fromEntries(Object.entries(cost).map(([r, n]) => [r, Math.floor(n / 2)]).filter(([, n]) => n > 0));
// Lo que gana una pieza al subir de nivel (game/home.js: producción +35 % por nivel, camas por nivel).
const gainOf = (b) => (b.produces ? `+35 % ${RESOURCES[b.produces.res].name.toLowerCase()}` : b.beds ? `+${b.beds} ${t('home.beds', 'camas')}` : b.calm ? `+${t('home.calm', 'calma')}` : '');

// Medidor de humedad: franjas seco · ideal · húmedo · moho con una aguja; se entiende sin leer.
// Estado del terrario en una sola ficha: humedad (icono del clima con su color y cifra) y calma (icono y cifra).
// Sin barras: el color dice si está bien; tocarla abre el panel Terrario.
function StatusChip({ home, onClick }) {
  const h = humidity(home), kind = climate(home), c = Math.round(calm(home) * 100);
  return html`<button class=${`status-chip clim-${kind}${kind === 'moho' || kind === 'seco' ? ' alert' : ''}`} onClick=${onClick}
      aria-label=${`${CLIMATES[kind].name} · ${t('comp.humidity', 'Humedad')} ${Math.round(h * 100)} % · ${t('home.calm', 'Calma')} ${c}`} title=${CLIMATES[kind].desc}>
    <span class="hum"><${Icon} name="items" size="17" /><b>${Math.round(h * 100)}%</b></span>
    <span class=${`calm-v${c < 40 ? ' low' : ''}`}><${Icon} name="colony" size="18" /><b>${c}</b></span>
  </button>`;
}

// Mercader de visita: cambia recursos por ámbar y al revés, y a veces vende un isópodo.
function Merchant({ s, onClose }) {
  const m = merchant(s.game), home = s.game.home;
  if (!m) return html`<section class="drawer merchant"><${CloseX} onClose=${onClose} /><p>${t('merchant.gone', 'El mercader ya se fue. Vuelve cada tres días.')}</p></section>`;
  const label = (bag) => Object.entries(bag).map(([r, n]) => (r === 'isopodo'
    ? html`<span class="ware"><${Icon} name="colony" size="22" /><b>${n}</b><small>${t('merchant.iso', 'isópodo')}</small></span>`
    : html`<span class="ware"><${ResIcon} res=${r} /><b>${n}</b><small>${RESOURCES[r].name}</small></span>`));
  return html`<section class="drawer merchant" aria-label=${t('merchant.title', 'Mercader')}><${CloseX} onClose=${onClose} />
    <header class="mer-head"><span class="mer-face"><${Icon} name="snail" size="34" /></span><div><h3>${t('merchant.title', 'Caracol mercader')}</h3>
      <p>${t('merchant.line', '«Traigo ámbar de otras islas. Me voy mañana.»')}</p></div></header>
    <ul class="trades">${m.offers.map((i, k) => { const o = TRADES[i], sold = m.sold.includes(k), ok = canAfford(home, o.give); return html`<li class=${`trade${sold ? ' sold' : ''}`}>
      <div class="side"><small>${t('merchant.give', 'Das')}</small>${label(o.give)}</div><span class="arrow" aria-hidden="true">→</span>
      <div class="side"><small>${t('merchant.get', 'Recibes')}</small>${label(o.get)}</div>
      <button class="btn small${ok && !sold ? ' primary' : ''}" disabled=${sold || !ok} onClick=${() => s.trade(k)}>${sold ? t('merchant.sold', 'Hecho') : ok ? t('merchant.buy', 'Cambiar') : t('merchant.short', 'Te falta')}</button></li>`; })}</ul>
  </section>`;
}
// Lado pieza de la asignación: quién trabaja o duerme aquí, quitar a alguien o sumar a otro de la colonia.
function Assigned({ s, p }) {
  const home = s.game.home, b = BUILDINGS[p.type], [add, setAdd] = useState(null);
  const rows = [b.produces && ['trabajar', t('assign.workHere', 'Trabajan aquí'), workersOf(home, p), Infinity], b.beds && ['dormir', t('assign.sleepHere', 'Duermen aquí'), sleepersOf(home, p), b.beds * lvl(p)]].filter(Boolean);
  if (!rows.length || p.site) return null;
  return html`<div class="assigned">${rows.map(([what, label, who, cap]) => html`<div class="as-row">
    <small>${label}${cap !== Infinity ? ` · ${who.length}/${cap}` : ''}</small>
    <div class="as-chips">${who.map((i) => html`<button class="as-chip" onClick=${() => s.unassign(i.id, what)} aria-label=${`${t('assign.remove', 'Quitar')} ${i.name}`}>
      <img src=${portraitURL(`iso:${i.shell}`)} alt="" />${i.name}<span aria-hidden="true">×</span></button>`)}
      ${who.length < cap && html`<button class=${`as-chip add${add === what ? ' on' : ''}`} onClick=${() => setAdd(add === what ? null : what)}>+ ${t('assign.add', 'Asignar')}</button>`}</div>
    ${add === what && html`<ul class="pick-list">${home.isopods.filter((i) => !(i.baby > 0) && !who.includes(i)).map((i) => html`<li><button class="btn" onClick=${() => { s.orderIso(i.id, what, p.id); setAdd(null); }}>
      <img src=${portraitURL(`iso:${i.shell}`)} alt="" /><b>${i.name}</b><small>${(what === 'trabajar' ? i.job : i.home) != null ? t('assign.moves', 'se cambia') : ''}</small></button></li>`)}</ul>`}
  </div>`)}</div>`;
}
// Mejoras permanentes (la Inspiración de Cult of the Lamb) pagadas con ámbar.
function Upgrades({ s, onClose }) {
  const home = s.game.home;
  return html`<section class="drawer upgrades" aria-label=${t('upgrades.title', 'Mejoras')}><${CloseX} onClose=${onClose} />
    <h3><${Icon} name="expand" size="18" />${t('upgrades.title', 'Mejoras')}</h3>
    <ul class="trades">${Object.entries(UPGRADES).map(([id, u]) => { const own = hasUpgrade(s.game, id); return html`<li class=${own ? 'own' : ''}>
      <${Icon} name=${u.icon} size="18" /><span class="up-txt"><b>${u.name}</b><small>${u.desc}</small></span>
      ${own ? html`<small class="maxed-s">✓</small>` : html`<button class="btn small" disabled=${!canAfford(home, u.cost)} onClick=${() => s.buyUpgrade(id)}><${Cost} cost=${u.cost} have=${home.resources} /></button>`}</li>`; })}</ul>
  </section>`;
}

export function Home({ s }) {
  const home = s.game.home;
  const [panel, setPanel] = useState(null);
  const [toast, setToast] = useState(null);
  const say = (msg) => { setToast(msg); clearTimeout(say.t); say.t = setTimeout(() => setToast(null), 1600); };
  const toggle = (p) => { if (s.build) s.cancelBuild(); if (s.selIso != null) s.selectIso(null); setPanel(panel === p ? null : p); };
  if (s.wantPanel) { const p = s.wantPanel; s.wantPanel = null; if (s.selIso != null) s.selectIso(null); setTimeout(() => setPanel(p)); }

  // Arrastrar gira la cámara; tocar sin arrastrar coloca o recoge.
  // Dos dedos: pellizcar acerca o aleja (como una foto); mientras hay dos dedos no se gira ni se toca.
  const onDown = (e) => { s.touched = s.time; drag.pts.set(e.pointerId, [e.clientX, e.clientY]); if (drag.pts.size === 2) { drag.pinch = pinchDist(); drag.moved = true; }
    else Object.assign(drag, { x: e.clientX, y: e.clientY, moved: false, down: true }); e.currentTarget.setPointerCapture(e.pointerId); };
  const onMove = (e) => {
    if (drag.pts.has(e.pointerId)) drag.pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (drag.pts.size === 2 && drag.pinch) { const d = pinchDist(); s.stage.zoom(drag.pinch / d); drag.pinch = d; s.touched = s.time; return; }
    if (drag.down) s.touched = s.time;
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
  const onUp = (e) => { drag.pts.delete(e.pointerId); if (drag.pts.size < 2) drag.pinch = 0; if (drag.pts.size) return; const tap = drag.down && !drag.moved; drag.down = false; if (tap) onTap(e); };
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
    <div class="world-input" onPointerDown=${onDown} onPointerMove=${onMove} onPointerUp=${onUp} onPointerCancel=${onUp} onWheel=${(e) => s.stage.zoom(e.deltaY > 0 ? 1.08 : 0.93)}></div>
    <div class="markers"></div>
    <${CamControls} s=${s} />
    <${FxLayer} s=${s} />
    <header class="hud-top">
      <div class="title-block row"><${DayClock} day=${s.game.day} clock=${s.game.clock} label=${`${t('ui.day', 'Día')} ${s.game.day} · ${DAY_PHASES[s.phase].name} · ${WEATHERS[s.game.home.weather]?.name ?? ''}`}
          onSleep=${s.phase === 'atardecer' || s.phase === 'noche' ? () => s.sleep() : null} />
        <h2>${t('home.title', 'Tu terrario')}</h2></div>
      <${StatusChip} home=${home} onClick=${() => toggle('comp')} />
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
        <${CloseX} onClose=${() => { s.selPiece = null; s.emit(); }} /></div>
      <p class="pc-desc">${BUILDINGS[sel.type].desc}</p>
      ${upgradeCost(sel) && lvl(sel) < MAX_LEVEL ? html`<button class="btn primary upgrade" disabled=${!canAfford(home, upgradeCost(sel))} onClick=${() => s.upgradePiece(sel.id)}>
          <span class="up-l"><${Icon} name="expand" size="18" />${t('home.upgrade', 'Mejorar')} <small>${gainOf(BUILDINGS[sel.type])}</small></span><${Cost} cost=${upgradeCost(sel)} have=${home.resources} /></button>`
        : html`<p class="maxed"><${Icon} name="botin" size="16" />${t('home.maxedShort', 'Nivel máximo')}</p>`}
      <${Assigned} s=${s} p=${sel} />
      <div class="pc-tools">
        <button class="btn" onClick=${() => s.startMove(sel.id)}><${Icon} name="move" size="18" />${t('home.move', 'Mover')}</button>
        <button class="btn ghost" onClick=${() => s.storePiece(sel.id) || say(t('home.cantStore', 'Hace falta al menos un comedero.'))}><${Icon} name="out" size="18" />${t('home.store', 'Guardar')} <${Cost} cost=${half(BUILDINGS[sel.type].cost)} have=${home.resources} /></button>
      </div>
    </section>`}

    ${panel === 'build' && !s.build && html`<section class="drawer build-list" aria-label=${t('home.build', 'Construir')}><${CloseX} onClose=${() => setPanel(null)} />
      ${Object.entries(BUILDINGS).map(([id, b], k) => html`<button class="card-btn" style=${{ '--i': k }} disabled=${!canAfford(home, b.cost)} onClick=${() => { setPanel(null); s.startBuild(id); }}>
        <img class="thumb" src=${pieceThumb(s.stage.renderer, id)} alt="" /><b>${b.name}</b><span class="desc">${b.desc}</span><span class="tags"><span>${b.size.w}×${b.size.h}</span>${b.produces && html`<span title=${RESOURCES[b.produces.res].name}>+<${ResIcon} res=${b.produces.res} /></span>`}
          ${b.beds && html`<span title=${t('home.beds', 'camas')}><${Icon} name="colony" size="14" />+${b.beds}</span>`}${b.calm && html`<span class="calm-tag" title=${t('home.calm', 'calma')}><${Icon} name="leaf" size="14" />+</span>`}</span>
        <${Cost} cost=${b.cost} have=${home.resources} />
      </button>`)}
      ${exp && html`<button class="card-btn" disabled=${!canAfford(home, exp.cost)} onClick=${() => s.expandHome() && say(t('home.expanded', 'El terrario crece.'))}>
        <b>${t('home.expand', 'Ampliar terrario')}</b><small>${exp.side}×${exp.side}</small><${Cost} cost=${exp.cost} have=${home.resources} />
      </button>`}
    </section>`}

    ${panel === 'comp' && html`<${Composition} s=${s} say=${say} onClose=${() => setPanel(null)} />`}
    ${panel === 'merchant' && html`<${Merchant} s=${s} onClose=${() => setPanel(null)} />`}
    ${panel === 'upgrades' && html`<${Upgrades} s=${s} onClose=${() => setPanel(null)} />`}

    ${s.selIso != null ? html`<${IsoHub} s=${s} onClose=${() => s.selectIso(null)} />` : panel === 'colony' && html`<${ColonyList} s=${s} onClose=${() => setPanel(null)} />`}

    <nav class="hud-bottom">
      <button class=${`btn${panel === 'build' ? ' active' : ''}`} onClick=${() => toggle('build')}><${Icon} name="build" /> <span>${t('home.build', 'Construir')}</span></button>
      <button class=${`btn${panel === 'comp' ? ' active' : ''}`} onClick=${() => toggle('comp')}><${Icon} name="layers" /> <span>${t('home.terrarium', 'Terrario')}</span></button>
      <button class="btn mist" disabled=${home.mistCd > 0} onClick=${() => s.mist()} aria-label=${t('home.mist', 'Rociar')} style=${{ '--cd': home.mistCd > 0 ? home.mistCd / ZEN.mistCooldown : 0 }}><${Icon} name="items" /> <span>${t('home.mist', 'Rociar')}</span></button>
      <button class=${`btn${panel === 'colony' ? ' active' : ''}`} onClick=${() => toggle('colony')}><${Icon} name="colony" /> <span>${t('home.colony', 'Colonia')}</span></button>
      <button class="btn primary" aria-label=${t('home.out', 'Archipiélago')} onClick=${() => s.goArchipelago()}><${Icon} name="out" /> <span class="long">${t('home.out', 'Archipiélago')}</span><span class="short">${t('home.outShort', 'Islas')}</span></button>
      <button class="btn ghost icon" onClick=${() => s.pause()} aria-label=${t('pause.open', 'Pausa (Esc)')}><${Icon} name="menu" /></button>
    </nav>
  </main>`;
}
