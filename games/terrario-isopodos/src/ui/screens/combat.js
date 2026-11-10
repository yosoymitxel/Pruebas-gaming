// HUD de combate (estructura de Cult of the Lamb: la acción manda, la interfaz se aparta): vida pegada a cada
// aberración, barra de la guardiana arriba, equipo en fichas chicas abajo, combo y cartel de sala despejada.
// La pausa táctica detiene el tiempo mientras eliges habilidad u objeto.
import { html } from '../lib.js';
import { t } from '../../i18n/index.js';
import { ABERRATIONS } from '../../data/aberrations.js';
import { ARENAS } from '../../data/arenas.js';
import { ABILITIES, ITEMS } from '../../data/abilities.js';
import { CLASSES } from '../../data/isopods.js';
import { ATB_MAX, allies, enemies } from '../../game/combat.js';
import { press } from '../input.js';
import { Bar, Stick, CamControls, FxLayer, PauseButton, RoomMap } from './common.js';
import { portraitURL } from '../../view/sprites.js';
import { LAYERS } from '../../game/dungeon.js';
import { Icon } from '../icons.js';

const Atb = ({ value }) => html`<span class="atb" role="meter" aria-label="ATB" aria-valuenow=${value.toFixed(1)} aria-valuemax=${ATB_MAX}>
  ${Array.from({ length: ATB_MAX }, (_, k) => html`<i class=${value >= k + 1 ? 'full' : ''}><b style=${{ width: `${Math.max(0, Math.min(1, value - k)) * 100}%` }}></b></i>`)}
</span>`;

export function Combat({ s }) {
  const c = s.combat;
  const team = allies(c), foes = enemies(c);
  const boss = foes.find((e) => ABERRATIONS[e.kind].role !== 'normal');
  const shown = boss ? [boss] : foes;
  const hold = (action) => (e) => { e.preventDefault(); press(action); };

  const me = team.find((a) => a.id === c.main);
  const low = me && me.hp > 0 && me.hp / me.maxHp < 0.3;
  return html`<main class=${`screen combat${s.tactical ? ' tactical' : ''}${low ? ' low-hp' : ''}`}>
    <${Stick} />
    <${CamControls} s=${s} />
    <${PauseButton} s=${s} />
    ${s.run && html`<${RoomMap} dungeon=${s.run.dungeon} layers=${LAYERS} />`}
    ${boss ? html`<header class="boss-bar">
      <b>${ABERRATIONS[boss.kind].name}</b>${boss.staggered > 0 ? html`<em class="tag stag">${t('combat.staggered', 'Aturdida')}</em>` : boss.pressured > 0 ? html`<em class="tag press">${t('combat.pressured', 'Presionada')}</em>` : null}
      <${Bar} value=${boss.hp} max=${boss.maxHp} kind="foe" label=${t('ui.hp', 'Vida')} />
      <${Bar} value=${boss.staggered > 0 ? boss.staggerMax : boss.stagger} max=${boss.staggerMax} kind="stagger" label=${t('combat.stagger', 'Aturdimiento')} />
    </header>` : null}
    <div class="foe-tags" aria-hidden="true">${foes.filter((e) => e !== boss && e.hp > 0).map((e) => {
      const p = s.stage.project(e.x, ABERRATIONS[e.kind].height * 0.62 + 0.25, e.y); // el recorte se inclina hacia atrás: su cima queda más baja
      return html`<div class=${`foe-tag${e.staggered > 0 ? ' stag' : ''}`} style=${{ left: `${p.x}px`, top: `${p.y}px` }}>
        <i class="hp" style=${{ width: `${(e.hp / e.maxHp) * 100}%` }}></i><i class="st" style=${{ width: `${((e.staggered > 0 ? e.staggerMax : e.stagger) / e.staggerMax) * 100}%` }}></i></div>`;
    })}</div>
    ${s.combo?.n >= 2 && s.time - s.combo.at < 1.4 && html`<div class="combo" key=${s.combo.n} aria-hidden="true"><b>×${s.combo.n}</b><small>${t('combat.combo', 'golpes')}</small></div>`}
    ${!boss && c.t < 2.2 && html`<div class="arena-name" aria-live="polite"><b>${ARENAS[c.arena.kind].name}</b><small>${ARENAS[c.arena.kind].hint}</small></div>`}
    ${s.cleared && html`<div class="cleared" aria-live="polite"><b>${t('combat.cleared', 'Sala despejada')}</b></div>`}
    ${s.hurtAt && s.time - s.hurtAt < 0.3 && html`<div class="hurt-flash" aria-hidden="true"></div>`}

    <${FxLayer} s=${s} />
    ${boss && c.t < 2.4 && html`<div class="boss-card" aria-live="polite"><img src=${portraitURL(ABERRATIONS[boss.kind].sprite)} alt="" /><div><small>${t(`role.${ABERRATIONS[boss.kind].role}`, ABERRATIONS[boss.kind].role === 'jefe' ? 'Guardiana' : 'Élite')}</small><b>${ABERRATIONS[boss.kind].name}</b></div></div>`}

    <section class="team">${team.map((a, k) => html`<button class=${`member${a.id === c.main ? ' main' : ''}${a.hp <= 0 ? ' down' : ''}`}
        onClick=${() => s.switchTo(a.id)} aria-pressed=${a.id === c.main} aria-label=${`${a.name}, ${CLASSES[a.cls].name}`}>
      <img src=${portraitURL(`iso:${a.shell}`)} alt="" />
      <span class="who"><kbd>${k + 1}</kbd>${a.id === c.main ? ` ${a.name}` : ''}${a.held > 0 ? ' ⛓' : ''}</span>
      <${Bar} value=${a.hp} max=${a.maxHp} label=${t('ui.hp', 'Vida')} />
      <${Atb} value=${a.atb} />
    </button>`)}</section>

    <section class="actions-pad">
      <button class="pad roll" onPointerDown=${hold('roll')} aria-label=${t('combat.roll', 'Rodar (K)')}><${Icon} name="roll" size="26" /></button>
      <button class="pad attack" onPointerDown=${hold('attack')} aria-label=${t('combat.attack', 'Atacar (J)')}><${Icon} name="attack" size="34" /></button>
      <button class="pad tactic" onClick=${() => s.setTactical(!s.tactical)} aria-label=${t('combat.tactical', 'Pausa táctica (L)')}><${Icon} name="tactical" size="28" /></button>
    </section>

    ${s.tactical && !c.result && html`<section class="tactic-menu" aria-label=${t('combat.tactical', 'Pausa táctica')}>
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

    ${c.result && (!s.cleared || s.time - s.cleared > 1.4) && html`<section class="drawer center">
      <h3>${c.result === 'win' ? t('combat.win', 'Las aberraciones se deshacen en tinta.') : t('combat.lose', 'El equipo cae. Hay que volver.')}</h3>
      <button class="btn primary" onClick=${() => s.endCombat()}>${t('ui.continue', 'Continuar')}</button>
    </section>`}
  </main>`;
}
