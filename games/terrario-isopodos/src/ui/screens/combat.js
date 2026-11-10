// HUD de combate: equipo con vida y ATB (toca un retrato para controlarlo), barras de las aberraciones,
// botones de acción y pausa táctica (el tiempo va al 10 % mientras eliges habilidad u objeto).
import { html } from '../lib.js';
import { t } from '../../i18n/index.js';
import { ABERRATIONS } from '../../data/aberrations.js';
import { ABILITIES, ITEMS } from '../../data/abilities.js';
import { CLASSES } from '../../data/isopods.js';
import { ATB_MAX, allies, enemies } from '../../game/combat.js';
import { press } from '../input.js';
import { Bar, Stick } from './common.js';

const Atb = ({ value }) => html`<span class="atb" role="meter" aria-label="ATB" aria-valuenow=${value.toFixed(1)} aria-valuemax=${ATB_MAX}>
  ${Array.from({ length: ATB_MAX }, (_, k) => html`<i class=${value >= k + 1 ? 'full' : ''}><b style=${{ width: `${Math.max(0, Math.min(1, value - k)) * 100}%` }}></b></i>`)}
</span>`;

export function Combat({ s }) {
  const c = s.combat;
  const team = allies(c), foes = enemies(c);
  const boss = foes.find((e) => ABERRATIONS[e.kind].role !== 'normal');
  const shown = boss ? [boss] : foes;
  const hold = (action) => (e) => { e.preventDefault(); press(action); };

  return html`<main class=${`screen combat${s.tactical ? ' tactical' : ''}`}>
    <${Stick} />
    <header class="foes">${shown.map((e) => html`<div class="foe">
      <b>${ABERRATIONS[e.kind].name}</b>
      ${e.staggered > 0 ? html`<em class="tag stag">${t('combat.staggered', 'Aturdida')}</em>` : e.pressured > 0 ? html`<em class="tag press">${t('combat.pressured', 'Presionada')}</em>` : null}
      <${Bar} value=${e.hp} max=${e.maxHp} kind="foe" label=${t('ui.hp', 'Vida')} />
      <${Bar} value=${e.staggered > 0 ? e.staggerMax : e.stagger} max=${e.staggerMax} kind="stagger" label=${t('combat.stagger', 'Aturdimiento')} />
    </div>`)}${!boss && foes.length > 1 ? html`<small class="muted">×${foes.length}</small>` : null}</header>

    <div class="fx-layer" aria-hidden="true">${s.fx.map((f) => {
      const p = s.stage.project(f.x, 1.6 + (s.time - f.at) * 1.4, f.z);
      return html`<span key=${f.id} class=${`fx fx-${f.kind}${f.big ? ' big' : ''}`} style=${{ left: `${p.x}px`, top: `${p.y}px`, opacity: 1 - (s.time - f.at) / 0.9 }}>${f.text}</span>`;
    })}</div>

    <section class="team">${team.map((a, k) => html`<button class=${`member${a.id === c.main ? ' main' : ''}${a.hp <= 0 ? ' down' : ''}`}
        onClick=${() => s.switchTo(a.id)} aria-pressed=${a.id === c.main} aria-label=${`${a.name}, ${CLASSES[a.cls].name}`}>
      <span class="who"><kbd>${k + 1}</kbd> ${a.name}${a.held > 0 ? ' · ⛓' : ''}</span>
      <${Bar} value=${a.hp} max=${a.maxHp} label=${t('ui.hp', 'Vida')} />
      <${Atb} value=${a.atb} />
    </button>`)}</section>

    <section class="actions-pad">
      <button class="pad roll" onPointerDown=${hold('roll')} aria-label=${t('combat.roll', 'Rodar (K)')}>${t('combat.rollShort', 'Rodar')}</button>
      <button class="pad attack" onPointerDown=${hold('attack')} aria-label=${t('combat.attack', 'Atacar (J)')}>${t('combat.attackShort', 'Atacar')}</button>
      <button class="pad tactic" onClick=${() => s.setTactical(!s.tactical)} aria-label=${t('combat.tactical', 'Pausa táctica (L)')}>${t('combat.tacticalShort', 'Táctica')}</button>
    </section>

    ${s.tactical && html`<section class="tactic-menu" aria-label=${t('combat.tactical', 'Pausa táctica')}>
      ${team.filter((a) => a.hp > 0).map((a) => html`<div class="tm-member">
        <b>${a.name}</b>
        ${CLASSES[a.cls].abilities.map((id) => html`<button class="btn" disabled=${a.atb < ABILITIES[id].atb || a.held > 0} onClick=${() => s.ability(a.id, id)}>
          ${ABILITIES[id].name} <small>${'◆'.repeat(ABILITIES[id].atb)}</small></button>`)}
      </div>`)}
      <div class="tm-member"><b>${t('combat.items', 'Objetos')}</b>
        ${Object.entries(c.items).map(([id, n]) => html`<button class="btn" disabled=${!n} onClick=${() => s.item(id)}>${ITEMS[id].name} <small>×${n}</small></button>`)}
      </div>
      <button class="btn ghost" onClick=${() => s.setTactical(false)}>${t('ui.back', 'Volver')}</button>
    </section>`}

    ${c.result && html`<section class="drawer center">
      <h3>${c.result === 'win' ? t('combat.win', 'Las aberraciones se deshacen en tinta.') : t('combat.lose', 'El equipo cae. Hay que volver.')}</h3>
      <button class="btn primary" onClick=${() => s.endCombat()}>${t('ui.continue', 'Continuar')}</button>
    </section>`}
  </main>`;
}
