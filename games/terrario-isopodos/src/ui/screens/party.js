// Preparar la salida: arriba los huecos (principal y apoyos), abajo la colonia como cartas con retrato,
// clase, vida y daño reales (la saciedad los cambia) y habilidades. Tocar una carta la pone en el primer
// hueco libre o la quita. «Equipo recomendado» elige clases distintas y bien alimentadas.
import { html } from '../lib.js';
import { t } from '../../i18n/index.js';
import { CLASSES } from '../../data/isopods.js';
import { speciesOf } from '../../data/species.js';
import { adults } from '../../game/home.js';
import { ABILITIES } from '../../data/abilities.js';
import { partyBonus, isoStats } from '../../game/home.js';
import { portraitURL, isoPortrait } from '../../view/sprites.js';
import { Bar, Cost } from './common.js';
import { ROBES } from '../../data/robes.js';
import { Icon } from '../icons.js';

const CLASS_ICON = { rodador: 'roll', guardian: 'shield', musgoso: 'plant' };

export function recommended(isopods, need) {
  const ranked = [...isopods].sort((a, b) => b.hunger - a.hunger);
  const out = [];
  for (const cls of ['rodador', 'guardian', 'musgoso']) { const iso = ranked.find((i) => i.cls === cls && !out.includes(i.id)); if (iso) out.push(iso.id); }
  for (const iso of ranked) if (!out.includes(iso.id)) out.push(iso.id);
  return out.slice(0, need);
}

function Card({ s, iso, slot, onPick }) {
  const cls = CLASSES[iso.cls], x = isoStats(iso), hp = Math.round(cls.hp * speciesOf(iso.shell).hp * partyBonus(s.game.home, iso).hpMul * x.hpMul);
  return html`<button class=${`iso-card${slot >= 0 ? ' on' : ''}`} aria-pressed=${slot >= 0} onClick=${onPick}
    title=${`${speciesOf(iso.shell).name} · ${x.abilities.map((a) => ABILITIES[a].name).join(' · ')}`}>
    ${slot >= 0 && html`<i class="slot-tag">${slot === 0 ? '★' : slot + 1}</i>`}
    <img src=${isoPortrait(iso)} alt="" />
    <b>${iso.name}</b>
    <span class="cls"><${Icon} name=${CLASS_ICON[iso.cls]} size="15" />${cls.name}</span>
    <span class="stats"><span aria-label=${t('party.hp', 'Vida')}><${Icon} name="shield" size="13" />${hp}</span><span aria-label=${t('party.dmg', 'Daño')}><${Icon} name="attack" size="13" />${cls.damage + x.damageAdd}</span></span>
    <${Bar} value=${iso.hunger} max=${1} kind="food" label=${t('home.food', 'Saciedad')} />
  </button>`;
}

export function PartyPicker({ s, need, party, setParty }) {
  const isopods = adults(s.game.home);
  const pick = (id) => setParty(party.includes(id) ? party.filter((x) => x !== id) : party.length < need ? [...party, id] : party);
  const labels = need === 3 ? [t('party.lead', 'Principal'), t('party.support', 'Apoyo'), t('party.support', 'Apoyo')] : [t('party.explorer', 'Explorador')];
  return html`<div class="party">
    <div class="slots">${labels.map((label, k) => {
      const iso = isopods.find((i) => i.id === party[k]);
      return html`<button class=${`slot${iso ? ' full' : ''}`} onClick=${() => iso && pick(iso.id)} aria-label=${iso ? `${label}: ${iso.name}` : label}>
        <span class="slot-label">${k === 0 && need === 3 ? '★ ' : ''}${label}</span>
        ${iso ? html`<img src=${isoPortrait(iso)} alt="" /><b>${iso.name}</b>` : html`<span class="slot-empty">${t('party.empty', 'Toca un isópodo')}</span>`}
      </button>`;
    })}</div>
    <div class="roster-head"><span>${t('party.colony', 'Colonia')} (${isopods.length})</span>
      <button class="btn ghost small" onClick=${() => setParty(recommended(isopods, need))}>${t('party.auto', 'Auto')}</button></div>
    <div class="roster">${isopods.map((iso) => html`<${Card} s=${s} iso=${iso} slot=${party.indexOf(iso.id)} onPick=${() => pick(iso.id)} />`)}</div>
  </div>`;
}

// Manto para el nido (los vellones de Cult of the Lamb): fila de iconos; debajo, una línea con el elegido.
// Tocar uno bloqueado lo compra (si alcanza).
export function RobePicker({ s }) {
  const g = s.game, own = new Set(['comun', ...(g.robes ?? [])]), cur = own.has(g.robe) ? g.robe : 'comun', r = ROBES[cur];
  return html`<div class="robes">
    <div class="robe-row" role="radiogroup" aria-label=${t('robe.title', 'Manto')}>${Object.entries(ROBES).map(([id, x]) => html`<button role="radio" aria-checked=${cur === id}
      class=${`robe${cur === id ? ' on' : ''}${own.has(id) ? '' : ' locked'}`} aria-label=${x.name} title=${`${x.name}: ${x.desc}`} onClick=${() => (own.has(id) ? s.setRobe(id) : s.buyRobe(id))}>
      <${Icon} name=${x.icon} size="20" />${!own.has(id) && html`<i class="lock" aria-hidden="true"></i>`}</button>`)}</div>
    <p class="robe-line"><b>${r.name}</b> · ${r.desc}</p>
  </div>`;
}
