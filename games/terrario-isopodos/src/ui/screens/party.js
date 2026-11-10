// Preparar la salida: arriba los huecos (principal y apoyos), abajo la colonia como cartas con retrato,
// clase, vida y daño reales (la saciedad los cambia) y habilidades. Tocar una carta la pone en el primer
// hueco libre o la quita. «Equipo recomendado» elige clases distintas y bien alimentadas.
import { html } from '../lib.js';
import { t } from '../../i18n/index.js';
import { CLASSES } from '../../data/isopods.js';
import { speciesOf } from '../../data/species.js';
import { adults } from '../../game/home.js';
import { ABILITIES } from '../../data/abilities.js';
import { partyBonus } from '../../game/home.js';
import { portraitURL } from '../../view/sprites.js';
import { Bar } from './common.js';
import { Icon } from '../icons.js';

const CLASS_ICON = { rodador: 'roll', guardian: 'shield', musgoso: 'leaf' };

export function recommended(isopods, need) {
  const ranked = [...isopods].sort((a, b) => b.hunger - a.hunger);
  const out = [];
  for (const cls of ['rodador', 'guardian', 'musgoso']) { const iso = ranked.find((i) => i.cls === cls && !out.includes(i.id)); if (iso) out.push(iso.id); }
  for (const iso of ranked) if (!out.includes(iso.id)) out.push(iso.id);
  return out.slice(0, need);
}

function Card({ s, iso, slot, onPick }) {
  const cls = CLASSES[iso.cls], hp = Math.round(cls.hp * speciesOf(iso.shell).hp * partyBonus(s.game.home, iso).hpMul);
  return html`<button class=${`iso-card${slot >= 0 ? ' on' : ''}`} aria-pressed=${slot >= 0} onClick=${onPick}>
    ${slot >= 0 && html`<i class="slot-tag">${slot === 0 ? '★' : slot + 1}</i>`}
    <img src=${portraitURL(`iso:${iso.shell}`)} alt="" />
    <b>${iso.name}</b>
    <small class="sp">${speciesOf(iso.shell).name} · ${speciesOf(iso.shell).rolls ? t('species.ballDodge', 'esquiva en bolita') : t('species.dashDodge', 'esquiva corriendo')}</small>
    <span class="cls"><${Icon} name=${CLASS_ICON[iso.cls]} size="16" />${cls.name}</span>
    <dl><dt>${t('party.hp', 'Vida')}</dt><dd>${hp}</dd><dt>${t('party.dmg', 'Daño')}</dt><dd>${cls.damage}</dd></dl>
    <small>${cls.abilities.map((a) => ABILITIES[a].name).join(' · ')}</small>
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
        ${iso ? html`<img src=${portraitURL(`iso:${iso.shell}`)} alt="" /><b>${iso.name}</b>` : html`<span class="slot-empty">${t('party.empty', 'Toca un isópodo')}</span>`}
      </button>`;
    })}</div>
    <div class="roster-head"><span>${t('party.colony', 'Colonia')} (${isopods.length})</span>
      <button class="btn ghost small" onClick=${() => setParty(recommended(isopods, need))}>${t('party.auto', 'Equipo recomendado')}</button></div>
    <div class="roster">${isopods.map((iso) => html`<${Card} s=${s} iso=${iso} slot=${party.indexOf(iso.id)} onPick=${() => pick(iso.id)} />`)}</div>
  </div>`;
}
