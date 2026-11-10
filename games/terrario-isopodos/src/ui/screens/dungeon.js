// Mapa interior de la expedición: capas de abajo (entrada) arriba (guardiana).
import { html } from '../lib.js';
import { t } from '../../i18n/index.js';
import { NODE_TYPES, BIOMES } from '../../data/world.js';
import { CARDS } from '../../data/cards.js';
import { ITEMS } from '../../data/abilities.js';
import { CLASSES } from '../../data/isopods.js';
import { nextNodes, LAYERS } from '../../game/dungeon.js';
import { Bar, Loot } from './common.js';
import { IconAt } from '../icons.js';

function Note({ last }) {
  if (!last) return null;
  return html`<section class="note" role="status">
    ${last.type === 'refugio' ? html`<p>${t('dungeon.rest', 'Descansáis en un hueco seco: el equipo recupera la mitad de la vida.')}</p>`
      : html`<p>${t('dungeon.found', 'Encontráis:')}</p><${Loot} loot=${last.found} />${last.rescued && html`<p><b>${t('dungeon.lostIso', 'Y un isópodo perdido que se une a la expedición.')}</b></p>`}`}
  </section>`;
}

const X = (n) => 12 + n.x * 76, Y = (n) => 92 - (n.layer / (LAYERS - 1)) * 80;

export function Dungeon({ s }) {
  const run = s.run, d = run.dungeon;
  const reach = new Set(nextNodes(d).map((n) => n.id));
  return html`<main class="screen dungeon">
    <header class="hud-top">
      <div class="title-block"><span class="kicker">${t('dungeon.kicker', 'Nido')}</span><h2>${BIOMES[run.island.biome].name}</h2></div>
      <div class="party-mini">${run.party.map((p, k) => html`<div><b>${k === 0 ? '★ ' : ''}${p.name}</b><small>${CLASSES[p.cls].name}</small><${Bar} value=${p.hp} max=${p.maxHp} label=${t('ui.hp', 'Vida')} /></div>`)}</div>
    </header>
    <svg class="route" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
      ${d.edges.map(([a, b]) => html`<line class=${d.nodes[a].done && (d.nodes[b].done || reach.has(b)) ? 'walked' : ''} x1=${X(d.nodes[a])} y1=${Y(d.nodes[a])} x2=${X(d.nodes[b])} y2=${Y(d.nodes[b])} />`)}
      ${d.nodes.map((n) => html`<g class=${`node node-${n.type}${reach.has(n.id) ? ' reach' : ''}${n.done ? ' done' : ''}${d.at === n.id ? ' here' : ''}`}
          tabindex=${reach.has(n.id) ? 0 : -1} role="button" aria-label=${NODE_TYPES[n.type].name} aria-disabled=${!reach.has(n.id)}
          onClick=${() => reach.has(n.id) && s.enter(n.id)} onKeyDown=${(e) => e.key === 'Enter' && reach.has(n.id) && s.enter(n.id)}>
        <circle cx=${X(n)} cy=${Y(n)} r=${n.type === 'jefe' ? 5.5 : 3.6} />
        <${IconAt} name=${NODE_TYPES[n.type].icon} x=${X(n)} y=${Y(n)} size=${n.type === 'jefe' ? 6.5 : 4.4} />
      </g>`)}
    </svg>
    <${Note} last=${run.last} />
    <aside class="run-side">
      <p class="muted">${t('dungeon.items', 'Objetos')}: ${Object.entries(run.items).map(([id, n]) => `${ITEMS[id].name} ×${n}`).join(' · ')}</p>
      ${run.cards.length > 0 && html`<p class="muted">${t('dungeon.cards', 'Cartas')}: ${run.cards.map((id) => CARDS[id].name).join(' · ')}</p>`}
      <details><summary>${t('dungeon.loot', 'Botín')}</summary><${Loot} loot=${run.loot} /></details>
      <button class="btn ghost" onClick=${() => s.retreat()}>${t('dungeon.retreat', 'Retirarse con el botín')}</button>
    </aside>
    ${run.state === 'card' && html`<section class="drawer center cards" aria-label=${t('dungeon.pickCard', 'Elige una carta')}>
      <h3>${t('dungeon.pickCard', 'Elige una carta')}</h3>
      <div class="card-row">${run.offer.map((id) => html`<button class="game-card" onClick=${() => s.chooseCard(id)}><b>${CARDS[id].name}</b><span>${CARDS[id].desc}</span></button>`)}</div>
    </section>`}
  </main>`;
}
