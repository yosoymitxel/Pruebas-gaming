// Colonia del terrario: lista corta (retrato, nombre, qué hace, hambre) y ficha del seleccionado con sus
// órdenes (comer, dormir, tocar), nombre editable y distintivo. Seleccionar centra la cámara en él.
import { html, useState } from '../lib.js';
import { t } from '../../i18n/index.js';
import { CLASSES, STATUS, MAX_NAME } from '../../data/isopods.js';
import { BADGES } from '../../data/palettes.js';
import { speciesOf } from '../../data/species.js';
import { beds, isoStatus } from '../../game/home.js';
import { portraitURL } from '../../view/sprites.js';
import { Bar, ResIcon } from './common.js';
import { Icon } from '../icons.js';

const Status = ({ k }) => html`<span class=${`iso-status st-${k}${STATUS[k].warn ? ' warn' : ''}`}><${Icon} name=${STATUS[k].icon} size="14" />${STATUS[k].name}</span>`;
const Dot = ({ k }) => (k == null ? null : html`<i class="badge-dot" style=${{ background: BADGES[k] }} aria-hidden="true"></i>`);

export function ColonyList({ s }) {
  const home = s.game.home;
  return html`<section class="drawer colony" aria-label=${t('home.colony', 'Colonia')}>
    <p class="colony-head"><${Icon} name="colony" size="18" />${home.isopods.length}/${beds(home)}
      ${home.resources.hojarasca <= 0 && html`<span class="warn"><${ResIcon} res="hojarasca" />${t('home.noFoodShort', 'Sin comida')}</span>`}</p>
    ${home.isopods.map((iso) => html`<button class="iso-row" onClick=${() => s.selectIso(iso.id)}>
      <img src=${portraitURL(`iso:${iso.shell}`)} alt="" />
      <span class="who"><b><${Dot} k=${iso.badge} />${iso.name}</b><${Status} k=${isoStatus(home, iso)} /></span>
      <${Bar} value=${iso.hunger} max=${1} kind="food" label=${t('home.food', 'Saciedad')} />
    </button>`)}
  </section>`;
}

export function IsoHub({ s }) {
  const home = s.game.home, iso = home.isopods.find((i) => i.id === s.selIso);
  const [edit, setEdit] = useState(false);
  if (!iso) return null;
  const sp = speciesOf(iso.shell), st = isoStatus(home, iso);
  const save = (e) => { e.preventDefault(); s.renameIso(iso.id, e.currentTarget.querySelector("input").value); setEdit(false); };
  return html`<section class="drawer iso-hub" aria-label=${iso.name}>
    <div class="hub-head">
      <img src=${portraitURL(`iso:${iso.shell}`)} alt="" />
      <div class="hub-id">
        ${edit ? html`<form onSubmit=${save}><input maxlength=${MAX_NAME} value=${iso.name} aria-label=${t('colony.name', 'Nombre')} autofocus onBlur=${(e) => e.currentTarget.form.requestSubmit()} /></form>`
          : html`<button class="name-btn" onClick=${() => setEdit(true)} aria-label=${t('colony.rename', 'Cambiar nombre')}><b>${iso.name}</b><${Icon} name="build" size="14" /></button>`}
        <small title=${sp.latin}>${sp.name} · ${CLASSES[iso.cls].name}</small>
        <${Status} k=${st} />
      </div>
      <button class="btn ghost icon" onClick=${() => s.selectIso(null)} aria-label=${t('ui.close', 'Cerrar')}><${Icon} name="back" /></button>
    </div>
    <${Bar} value=${iso.hunger} max=${1} kind="food" label=${t('home.food', 'Saciedad')} />
    <div class="hub-actions">
      <button class="btn" disabled=${st === 'muda'} onClick=${() => s.orderIso(iso.id, 'comer')}><${Icon} name="leaf" size="18" />${t('colony.eat', 'Comer')}</button>
      <button class="btn" disabled=${st === 'muda'} onClick=${() => s.orderIso(iso.id, 'dormir')}><${Icon} name="refugio" size="18" />${t('colony.sleep', 'Dormir')}</button>
      ${sp.rolls && html`<button class="btn" disabled=${st === 'muda'} onClick=${() => s.orderIso(iso.id, 'tocar')}><${Icon} name="roll" size="18" />${t('colony.poke', 'Bolita')}</button>`}
    </div>
    <div class="badges" role="group" aria-label=${t('colony.badge', 'Distintivo')}>
      ${BADGES.map((c, k) => html`<button class=${`badge${iso.badge === k ? ' on' : ''}`} style=${{ '--c': c }} aria-pressed=${iso.badge === k} onClick=${() => s.badgeIso(iso.id, k)}
        aria-label=${`${t('colony.badge', 'Distintivo')} ${k + 1}`}></button>`)}
    </div>
  </section>`;
}
