// Cartas (sistema visual de KureiChaosChess): carta de verdad con marco del color de su tipo, gema y borde
// según rareza, nombre en placa, dibujo en ventana y texto abajo. Se reparten boca abajo y se dan vuelta;
// tocar una la adelanta y «Quedármela» confirma. En teléfono, abanico superpuesto sin scroll.
import { html, useState, useRef } from '../lib.js';
import { t } from '../../i18n/index.js';
import { CARDS, CARD_KINDS, RARITIES } from '../../data/cards.js';
import { Icon } from '../icons.js';
import { playSfx } from '../sfx.js';

export function CardFace({ id, mini = false }) {
  const c = CARDS[id];
  return html`<div class=${`face kind-${c.kind} ${c.rarity}`}>
    <span class=${`gem ${c.rarity}`} title=${RARITIES[c.rarity].name}></span>
    <div class="plate">${c.name}</div>
    <div class="art"><${Icon} name=${c.icon} size=${mini ? 30 : 64} /></div>
    <div class="type">${CARD_KINDS[c.kind].name} · ${RARITIES[c.rarity].name}</div>
    ${!mini && html`<p class="desc">${c.desc}</p>`}
  </div>`;
}

function Card({ id, chosen, onPick, style, i }) {
  const ref = useRef(null);
  const tilt = (e) => { // se inclina hacia el puntero, como una carta en la mano
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - 0.5) * 18}deg`);
    ref.current.style.setProperty('--rx', `${(0.5 - (e.clientY - r.top) / r.height) * 14}deg`);
  };
  const flat = () => { ref.current.style.setProperty('--rx', '0deg'); ref.current.style.setProperty('--ry', '0deg'); };
  return html`<div ref=${ref} class=${`card${chosen ? ' chosen' : ''}`} style=${{ ...style, '--deal': `${0.15 + i * 0.12}s` }} role="button" tabindex="0"
    aria-pressed=${chosen} aria-label=${`${CARDS[id].name}: ${CARDS[id].desc}`}
    onPointerMove=${tilt} onPointerLeave=${flat} onClick=${() => onPick(id)} onKeyDown=${(e) => (e.key === 'Enter' || e.key === ' ') && onPick(id)}>
    <${CardFace} id=${id} /><div class="back"></div>
  </div>`;
}

export function CardPick({ title, cards, onConfirm }) {
  const [chosen, setChosen] = useState(null);
  const sel = cards.indexOf(chosen);
  return html`<section class="overlay pick" aria-label=${title}>
    <div class="pick-body">
      <h2>${title}</h2>
      <div class=${`card-row${chosen ? ' has-sel' : ''}`}>
        ${cards.map((id, i) => {
          const k = sel < 0 ? i - (cards.length - 1) / 2 : i - sel; // distancia a la elegida (o al centro)
          return html`<${Card} key=${id} id=${id} i=${i} chosen=${chosen === id} onPick=${(x) => { if (x !== chosen) playSfx('click'); setChosen(x); }}
            style=${{ '--k': k, zIndex: 10 - Math.round(Math.abs(k) * 2) }} />`;
        })}
      </div>
      <button class="btn primary" disabled=${!chosen} onClick=${() => chosen && onConfirm(chosen)}>${t('card.keep', 'Quedármela')}</button>
    </div>
  </section>`;
}
