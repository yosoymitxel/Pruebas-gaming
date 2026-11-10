// Mapa interior de la expedición: una página del cuaderno con las capas del nido (entrada abajo, guardiana
// arriba). Tocar un nodo alcanzable muestra qué hay y se entra con «Entrar»: informa y evita toques sin querer.
import { html, useState } from '../lib.js';
import { t } from '../../i18n/index.js';
import { NODE_TYPES, BIOMES } from '../../data/world.js';
import { CARDS } from '../../data/cards.js';
import { ITEMS } from '../../data/abilities.js';
import { CLASSES } from '../../data/isopods.js';
import { ABERRATIONS } from '../../data/aberrations.js';
import { nextNodes, enemiesFor, LAYERS } from '../../game/dungeon.js';
import { portraitURL } from '../../view/sprites.js';
import { Bar, Loot, ResIcon, PauseButton } from './common.js';
import { Icon, IconAt } from '../icons.js';

const X = (n) => 10 + n.x * 80, Y = (n) => 93 - (n.layer / (LAYERS - 1)) * 84;
// Rombo de lado `r` (como el selector de niveles de Cult of the Lamb) y runas rojas sueltas por la página.
const diamond = (x, y, r) => `${x},${y - r} ${x + r},${y} ${x},${y + r} ${x - r},${y}`;
const RUNES = ['ᚠ', 'ᚱ', 'ᛉ', 'ᚦ', 'ᛟ', 'ᚨ', 'ᛞ'];
const runes = (seed) => Array.from({ length: 9 }, (_, k) => { const h = Math.sin(seed * 9.1 + k * 78.2) * 43758.5; const f = h - Math.floor(h);
  return { x: k % 2 ? 4 + f * 14 : 82 + f * 14, y: 8 + ((k * 37 + f * 20) % 84), r: RUNES[k % RUNES.length], a: (f - 0.5) * 50 }; });

function Note({ last }) {
  if (!last) return null;
  return html`<section class="note" role="status">
    ${last.type === 'refugio' ? html`<p>${t('dungeon.rest', 'Descansáis en un hueco seco: el equipo recupera la mitad de la vida.')}</p>`
      : html`<p>${t('dungeon.found', 'Encontráis:')}</p><${Loot} loot=${last.found} />${last.rescued && html`<p><b>${t('dungeon.lostIso', 'Y un isópodo perdido que se une a la expedición.')}</b></p>`}`}
  </section>`;
}

function Preview({ node, biome, onEnter, onClose }) {
  const foes = ['combate', 'elite', 'jefe'].includes(node.type) ? [...new Set(enemiesFor(node, biome))] : [];
  return html`<section class="node-preview" aria-live="polite">
    <div class="np-head"><${Icon} name=${NODE_TYPES[node.type].icon} size="26" /><h3>${NODE_TYPES[node.type].name}</h3></div>
    <p>${NODE_TYPES[node.type].desc}</p>
    ${foes.length > 0 && html`<div class="np-foes">${foes.map((id) => html`<figure>
      <img src=${portraitURL(ABERRATIONS[id].sprite)} alt="" /><figcaption>${ABERRATIONS[id].name}</figcaption></figure>`)}</div>`}
    <div class="actions">
      <button class="btn ghost" onClick=${onClose}>${t('ui.back', 'Volver')}</button>
      <button class="btn primary" onClick=${onEnter}>${t('dungeon.enter', 'Entrar')}</button>
    </div>
  </section>`;
}

export function Dungeon({ s }) {
  const run = s.run, d = run.dungeon;
  const [sel, setSel] = useState(null);
  const reach = new Set(nextNodes(d).map((n) => n.id));
  const node = sel !== null && reach.has(sel) ? d.nodes[sel] : null;
  const pick = (n) => reach.has(n.id) && setSel(n.id);
  return html`<main class="screen dungeon">
    <header class="hud-top">
      <div class="title-block"><span class="kicker">${t('dungeon.kicker', 'Nido')} · ${t('dungeon.layer', 'capa')} ${(d.at === null ? 0 : d.nodes[d.at].layer + 1)}/${LAYERS}</span><h2>${BIOMES[run.island.biome].name}</h2></div>
      <${PauseButton} s=${s} />
    </header>
    <div class="party-mini">${run.party.map((p, k) => html`<div class=${k === 0 ? 'lead' : ''}>
      <img src=${portraitURL(`iso:${p.shell}`)} alt="" />
      <span><b>${k === 0 ? '★ ' : ''}${p.name}</b><small>${CLASSES[p.cls].name} · ${p.hp}/${p.maxHp}</small><${Bar} value=${p.hp} max=${p.maxHp} label=${t('ui.hp', 'Vida')} /></span>
    </div>`)}</div>

    <section class="map-page" aria-label=${t('dungeon.map', 'Mapa del nido')}>
      <svg class="route" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        ${d.edges.map(([a, b]) => html`<line class=${d.nodes[a].done && (d.nodes[b].done || reach.has(b)) ? 'walked' : ''} x1=${X(d.nodes[a])} y1=${Y(d.nodes[a])} x2=${X(d.nodes[b])} y2=${Y(d.nodes[b])} />`)}
        ${runes(run.island.seed ?? 1).map((r) => html`<text class="rune" x=${r.x} y=${r.y} transform=${`rotate(${r.a} ${r.x} ${r.y})`}>${r.r}</text>`)}
        ${d.nodes.map((n) => html`<g class=${`node node-${n.type}${reach.has(n.id) ? ' reach' : ''}${n.done ? ' done' : ''}${d.at === n.id ? ' here' : ''}${sel === n.id ? ' sel' : ''}`}
            tabindex=${reach.has(n.id) ? 0 : -1} role="button" aria-label=${NODE_TYPES[n.type].name} aria-disabled=${!reach.has(n.id)}
            onClick=${() => pick(n)} onKeyDown=${(e) => e.key === 'Enter' && pick(n)}>
          <polygon class="gem" points=${diamond(X(n), Y(n), n.type === 'jefe' ? 6.4 : 4.6)} />
          <polygon class="gem-in" points=${diamond(X(n), Y(n), n.type === 'jefe' ? 5.3 : 3.7)} />
          ${d.at === n.id && html`<path class="banner" d=${`M${X(n) - 2.4} ${Y(n) - 10.5}h4.8v5.2l-2.4 -1.4 -2.4 1.4z`} />`}
          <${IconAt} name=${NODE_TYPES[n.type].icon} x=${X(n)} y=${Y(n)} size=${n.type === 'jefe' ? 6.5 : 4.6} />
        </g>`)}
      </svg>
      <ul class="legend">${['combate', 'elite', 'botin', 'refugio', 'carta', 'jefe'].map((k) => html`<li><${Icon} name=${NODE_TYPES[k].icon} size="14" />${NODE_TYPES[k].name}</li>`)}</ul>
    </section>

    <${Note} last=${run.last} />
    ${node && html`<${Preview} node=${node} biome=${run.island.biome} onClose=${() => setSel(null)} onEnter=${() => { setSel(null); s.enter(node.id); }} />`}

    <footer class="run-bar">
      <span class="chips">${Object.entries(run.items).map(([id, n]) => html`<span class="chip"><${Icon} name="items" size="16" />${ITEMS[id].name} ×${n}</span>`)}</span>
      ${run.cards.length > 0 && html`<span class="chips">${run.cards.map((id) => html`<span class="chip card" title=${CARDS[id].desc}><${Icon} name="carta" size="16" />${CARDS[id].name}</span>`)}</span>`}
      <span class="chips">${Object.entries(run.loot).map(([r, n]) => html`<span class="chip"><${ResIcon} res=${r} />×${n}</span>`)}</span>
      <button class="btn ghost" onClick=${() => s.retreat()}>${t('dungeon.retreat', 'Retirarse con el botín')}</button>
    </footer>

    ${run.state === 'card' && html`<section class="drawer center cards" aria-label=${t('dungeon.pickCard', 'Elige una carta')}>
      <h3>${t('dungeon.pickCard', 'Elige una carta')}</h3>
      <div class="card-row">${run.offer.map((id) => html`<button class="game-card" onClick=${() => s.chooseCard(id)}><${Icon} name="carta" size="28" /><b>${CARDS[id].name}</b><span>${CARDS[id].desc}</span></button>`)}</div>
    </section>`}
  </main>`;
}
