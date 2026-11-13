// Colonia del terrario: lista corta (retrato, nombre, qué hace, hambre) y ficha del seleccionado con sus
// órdenes (comer, dormir, tocar), nombre editable y distintivo. Seleccionar centra la cámara en él.
import { html, useState } from '../lib.js';
import { t } from '../../i18n/index.js';
import { CLASSES, STATUS, MAX_NAME } from '../../data/isopods.js';
import { BADGES } from '../../data/palettes.js';
import { speciesOf } from '../../data/species.js';
import { beds, workersOf, sleepersOf, lvl, isoStatus, isoStats, canLearn, canAfford, partyBonus, canBless, canSermon } from '../../game/home.js';
import { WISHES, LOYALTY } from '../../data/cult.js';
import { TRAITS } from '../../data/traits.js';
import { BUILDINGS } from '../../data/buildings.js';
import { SKILLS } from '../../data/skills.js';
import { ABILITIES } from '../../data/abilities.js';
import { CLIMATES } from '../../data/substrate.js';
import { portraitURL } from '../../view/sprites.js';
import { OUTFITS } from '../../data/outfits.js';
import { outfitThumb } from '../../view/outfits3d.js';
import { hasOutfit } from '../../game/economy.js';
import { Bar, ResIcon, Cost, CloseX } from './common.js';

const CLASS_ICON = { rodador: 'roll', guardian: 'shield', musgoso: 'plant' };
import { Icon } from '../icons.js';

const Status = ({ k }) => html`<span class=${`iso-status st-${k}${STATUS[k].warn ? ' warn' : ''}`}><${Icon} name=${STATUS[k].icon} size="14" />${STATUS[k].name}</span>`;
const Dot = ({ k }) => (k == null ? null : html`<i class="badge-dot" style=${{ background: BADGES[k] }} aria-hidden="true"></i>`);

export function ColonyList({ s, onClose }) {
  const home = s.game.home;
  return html`<${CloseX} onClose=${onClose} /><section class="drawer colony" aria-label=${t('home.colony', 'Colonia')}>
    <p class="colony-head"><${Icon} name="colony" size="18" />${home.isopods.length}/${beds(home)}
      ${home.resources.hojarasca <= 0 && html`<span class="warn"><${ResIcon} res="hojarasca" />${t('home.noFoodShort', 'Sin comida')}</span>`}
      <button class="btn small ghost" onClick=${() => { s.wantPanel = 'upgrades'; s.emit(); }}><${Icon} name="expand" size="16" />${t('upgrades.title', 'Mejoras')}</button>
      <button class="btn small" disabled=${!canSermon(home, s.game.day) || !!home.sermon} onClick=${() => s.sermon()}><${Icon} name="colony" size="16" />${t('colony.sermon', 'Reunir')}</button></p>
    ${home.isopods.map((iso) => html`<button class="iso-row" onClick=${() => s.selectIso(iso.id)}>
      <img src=${portraitURL(`iso:${iso.shell}`)} alt="" />
      <span class="who"><b><${Dot} k=${iso.badge} />${iso.name}${iso.lv ? html` <small class="lv">${iso.lv}</small>` : ''}${iso.wish ? html` <${Icon} name="heart" size="13" />` : ''}</b><${Status} k=${isoStatus(home, iso)} /></span>
      <${Bar} value=${iso.hunger} max=${1} kind="food" label=${t('home.food', 'Saciedad')} />
    </button>`)}
  </section>`;
}

const ABIL_DESC = { strike: (a) => `${t('abil.strike', 'Golpe')} ${a.power}`, burst: (a) => `${t('abil.burst', 'Área')} ${a.power}`,
  shield: (a) => `${t('abil.shield', 'Escudo')} ${a.power}`, heal: (a) => `${t('abil.heal', 'Cura')} ${a.power}`, taunt: () => t('abil.taunt', 'Atrae enemigos') };
const KIND_ICON = { strike: 'attack', burst: 'roll', shield: 'shield', heal: 'heal', taunt: 'eye' };

const WISH_ICON = { pieza: 'build', humedad: 'items', comer: 'eat', mimo: 'heart' };
const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
// Asignación: cada fila dice dónde (qué criadero, qué refugio) y al tocarla se elige la pieza concreta.
const PICK = {
  trabajar: { icon: 'recoleccion', label: () => t('assign.work', 'Trabaja en'), test: (b) => b.produces, cap: () => Infinity, who: workersOf, cur: (iso) => iso.job },
  dormir: { icon: 'refugio', label: () => t('assign.sleep', 'Duerme en'), test: (b) => b.beds, cap: (b, p) => b.beds * lvl(p), who: sleepersOf, cur: (iso) => iso.home },
  comer: { icon: 'eat', label: () => t('assign.eat', 'Comer en'), test: (b) => b.feeds, cap: () => Infinity, who: () => [], cur: () => null },
};
export function PiecePicker({ s, iso, what, onDone }) {
  const home = s.game.home, k = PICK[what];
  const list = Object.values(home.grid.pieces).filter((p) => !p.site && k.test(BUILDINGS[p.type]));
  if (!list.length) return html`<p class="note">${t('assign.none', 'No hay ninguna pieza para esto: constrúyela primero.')}</p>`;
  return html`<ul class="pick-list">${list.map((p) => { const b = BUILDINGS[p.type], n = k.who(home, p).length, cap = k.cap(b, p), mine = k.cur(iso) === p.id, full = !mine && n >= cap;
    return html`<li><button class=${`btn${mine ? ' active' : ''}`} disabled=${full} onClick=${() => { s.orderIso(iso.id, what, p.id); onDone(); }}>
      <${Icon} name=${k.icon} size="16" /><b>${b.name}</b>${b.produces ? html`<${ResIcon} res=${b.produces.res} />` : ''}<small>${cap === Infinity ? (n ? `${n} ${t('assign.there', 'ahí')}` : '') : `${n}/${cap}`}</small></button></li>`; })}
    ${what !== 'comer' && k.cur(iso) != null && html`<li><button class="btn ghost" onClick=${() => { s.unassign(iso.id, what); onDone(); }}>${t('assign.clear', 'Ninguno')}</button></li>`}</ul>`;
}
function Care({ s, iso, st, sp }) {
  const w = iso.wish, day = s.game.day, home = s.game.home;
  const [pick, setPick] = useState(null);
  const where = (id) => (id != null && home.grid.pieces[id] ? BUILDINGS[home.grid.pieces[id].type].name : null);
  // Cada petición con su acción directa (qué hacer y dónde).
  const act = w && { humedad: html`<button class="btn small primary" onClick=${() => s.orderIso(iso.id, 'humedad')}>${t('wish.goWet', 'Llevar a su humedad')}</button>`,
    comer: html`<button class="btn small primary" onClick=${() => setPick('comer')}>${t('wish.feed', 'Dar de comer')}</button>`,
    mimo: html`<button class="btn small primary" disabled=${!canBless(iso, day)} onClick=${() => s.bless(iso.id)}>${t('colony.bless', 'Mimo')}</button>`,
    pieza: html`<button class="btn small primary" onClick=${() => { s.selectIso(null); s.wantPanel = 'build'; s.emit(); }}>${t('wish.build', 'Construir')}</button>` }[w.kind];
  return html`
    ${w && html`<div class="wish-line"><${Icon} name=${WISH_ICON[w.kind]} size="16" /><span>${WISHES.kinds[w.kind].name}${w.piece ? html` <b>${BUILDINGS[w.piece].name}</b>` : ''}${w.kind === 'humedad' ? html`<small class="why">${t('wish.wetWhy', 'Busca un sitio')} ${CLIMATES[sp.humidity].name.toLowerCase()}</small>` : ''}</span><small>${mmss(w.t)}</small>${act}</div>`}
    <div class="assign">${['trabajar', 'dormir'].map((k) => html`<button class=${`assign-row${pick === k ? ' on' : ''}`} onClick=${() => setPick(pick === k ? null : k)}>
      <${Icon} name=${PICK[k].icon} size="18" /><span>${PICK[k].label()}</span><b>${where(PICK[k].cur(iso)) ?? t('assign.free', 'Sin asignar')}</b><span class="chev" aria-hidden="true">▾</span></button>`)}</div>
    ${pick && html`<${PiecePicker} s=${s} iso=${iso} what=${pick} onDone=${() => setPick(null)} />`}
    <div class="hub-actions">
      <button class="btn" disabled=${!canBless(iso, day)} onClick=${() => s.bless(iso.id)}><${Icon} name="heart" size="18" />${t('colony.bless', 'Mimo')}</button>
      <button class="btn" disabled=${st === 'muda'} onClick=${() => setPick('comer')}><${Icon} name="eat" size="18" />${t('colony.eat', 'Comer')}</button>
      <button class="btn" disabled=${st === 'muda'} onClick=${() => s.orderIso(iso.id, 'dormir')}><${Icon} name="refugio" size="18" />${t('colony.nap', 'Siesta')}</button>
      ${sp.rolls && html`<button class="btn" disabled=${st === 'muda'} onClick=${() => s.orderIso(iso.id, 'tocar')}><${Icon} name="roll" size="18" />${t('colony.poke', 'Bolita')}</button>`}
    </div>
    <p class="badges-t">${t('colony.paint', 'Color del caparazón')}</p>
    <div class="badges" role="group" aria-label=${t('colony.paint', 'Color del caparazón')}>
      <button class=${`badge none${iso.badge == null ? ' on' : ''}`} aria-pressed=${iso.badge == null} onClick=${() => s.badgeIso(iso.id, null)} aria-label=${t('colony.natural', 'Natural')}></button>
      ${BADGES.map((c, k) => html`<button class=${`badge${iso.badge === k ? ' on' : ''}`} style=${{ '--c': c }} aria-pressed=${iso.badge === k} onClick=${() => s.badgeIso(iso.id, k)}
        aria-label=${`${t('colony.badge', 'Distintivo')} ${k + 1}`}></button>`)}
    </div>`;
}

// Armario (como el sastre de Cult of the Lamb): lo comprado se puede poner a cualquiera; tocar lo puesto lo quita.
function Wardrobe({ s, iso }) {
  const home = s.game.home;
  return html`<ul class="wardrobe">${Object.entries(OUTFITS).map(([id, o]) => { const own = hasOutfit(s.game, id), on = iso.outfit === id, ok = canAfford(home, o.cost);
    return html`<li><button class=${`outfit${on ? ' on' : ''}${own ? '' : ' locked'}`} aria-pressed=${on} title=${o.desc}
        onClick=${() => (own ? s.wearOutfit(iso.id, id) : ok && s.buyOutfit(id) && s.wearOutfit(iso.id, id))} disabled=${!own && !ok}>
      <img src=${outfitThumb(id)} alt="" /><b>${o.name}</b>${own ? (on ? html`<small class="ok">${t('outfit.on', 'Puesto')}</small>` : null) : html`<${Cost} cost=${o.cost} have=${home.resources} />`}</button></li>`; })}</ul>`;
}

// Ficha: especie, cifras reales (con lo aprendido) y sus habilidades de combate.
function Sheet({ s, iso, sp }) {
  const cls = CLASSES[iso.cls], x = isoStats(iso), hp = Math.round(cls.hp * sp.hp * partyBonus(s.game.home, iso).hpMul * x.hpMul);
  return html`<div class="sheet">
    <ul class="trait-list">${(iso.traits ?? []).map((id) => html`<li class=${TRAITS[id].good ? 'good' : 'bad'}><b>${TRAITS[id].name}</b> · ${TRAITS[id].desc}</li>`)}</ul>
    <p class="sp-line"><i>${sp.latin}</i> · ${sp.rolls ? t('species.rolls', 'se hace bolita') : t('species.runs', 'corre')} · <${Icon} name="items" size="13" />${CLIMATES[sp.humidity].name}</p>
    <dl class="stats3">
      <div><dt><${Icon} name="shield" size="16" />${t('party.hp', 'Vida')}</dt><dd>${hp}</dd></div>
      <div><dt><${Icon} name="attack" size="16" />${t('party.dmg', 'Daño')}</dt><dd>${cls.damage + x.damageAdd}</dd></div>
      <div><dt><${Icon} name="jump" size="16" />${t('party.speed', 'Velocidad')}</dt><dd>${(cls.speed * sp.speed * x.speedMul).toFixed(1)}</dd></div>
    </dl>
    <ul class="abil">${x.abilities.map((id) => { const a = ABILITIES[id]; return html`<li class=${`k-${a.kind}`}>
      <${Icon} name=${KIND_ICON[a.kind]} size="18" /><b>${a.name}</b><small>${ABIL_DESC[a.kind](a)}</small><span class="atb-cost" aria-label=${`${a.atb} ATB`}>${Array.from({ length: a.atb }, () => html`<i></i>`)}</span></li>`; })}</ul>
  </div>`;
}

// Árbol de mudas (como la rejilla de Final Fantasy X, en pequeño): fila de arriba suelta, la de abajo pide la de encima.
function Tree({ s, iso }) {
  const home = s.game.home, has = (id) => (iso.skills ?? []).includes(id);
  const cells = Object.entries(SKILLS);
  return html`<div class="tree">
    <svg class="tree-links" viewBox="0 0 300 150" preserveAspectRatio="none" aria-hidden="true">
      ${cells.filter(([, k]) => k.needs).map(([id, k]) => html`<path class=${has(id) ? 'on' : has(k.needs) ? 'open' : ''} d=${`M${50 + k.col * 100} 46 C${45 + k.col * 100} 76 ${55 + k.col * 100} 80 ${50 + k.col * 100} 104`} />`)}
    </svg>
    ${cells.map(([id, k]) => { const got = has(id), open = canLearn(home, iso, id), afford = canAfford(home, k.cost);
      const ab = k.ability?.[iso.cls];
      return html`<button class=${`skill${got ? ' got' : open ? ' open' : ' locked'}`} style=${{ gridColumn: k.col + 1, gridRow: k.row + 1 }}
          disabled=${got || !open || !afford} onClick=${() => s.learnSkill(iso.id, id)} aria-label=${`${k.name}: ${k.desc}`}>
        <span class="gem"><${Icon} name=${ab ? KIND_ICON[ABILITIES[ab].kind] : k.hpMul ? 'shield' : k.speedMul ? 'jump' : 'attack'} size="18" /></span>
        <b>${ab ? ABILITIES[ab].name : k.name}</b><small>${k.desc}</small>
        ${got ? html`<small class="ok">✓</small>` : open ? html`<${Cost} cost=${k.cost} have=${home.resources} />` : html`<small class="lock">${t('skills.needs', 'pide')} ${SKILLS[k.needs].name}</small>`}
      </button>`; })}
  </div>`;
}

export function IsoHub({ s, onClose }) {
  const home = s.game.home, iso = home.isopods.find((i) => i.id === s.selIso);
  const [edit, setEdit] = useState(false);
  const [tab, setTab] = useState('care');
  if (!iso) return null;
  const sp = speciesOf(iso.shell), st = isoStatus(home, iso);
  const save = (e) => { e.preventDefault(); s.renameIso(iso.id, e.currentTarget.querySelector("input").value); setEdit(false); };
  const TABS = [['care', t('colony.tabCare', 'Cuidar'), 'care'], ['sheet', t('colony.tabSheet', 'Ficha'), 'layers'], ['tree', t('colony.tabTree', 'Mudas'), 'expand'], ['outfit', t('colony.tabOutfit', 'Atuendo'), 'hat']];
  return html`<${CloseX} onClose=${onClose} /><section class="drawer iso-hub" aria-label=${iso.name}>
    <div class="hub-head">
      <img src=${portraitURL(`iso:${iso.shell}`)} alt="" />
      <div class="hub-id">
        ${edit ? html`<form onSubmit=${save}><input maxlength=${MAX_NAME} value=${iso.name} aria-label=${t('colony.name', 'Nombre')} autofocus onBlur=${(e) => e.currentTarget.form.requestSubmit()} /></form>`
          : html`<button class="name-btn" onClick=${() => setEdit(true)} aria-label=${t('colony.rename', 'Cambiar nombre')}><b>${iso.name}</b><${Icon} name="build" size="14" /></button>`}
        <small class="cls-line"><${Icon} name=${CLASS_ICON[iso.cls]} size="14" />${CLASSES[iso.cls].name} · ${sp.name}</small>
        <${Status} k=${st} />
        <span class="traits">${(iso.traits ?? []).map((id) => html`<span class=${`trait ${TRAITS[id].good ? 'good' : 'bad'}`} title=${TRAITS[id].desc}>${TRAITS[id].name}</span>`)}</span>
      </div>

    </div>
    <${Bar} value=${iso.hunger} max=${1} kind="food" label=${t('home.food', 'Saciedad')} />
    <div class="loyal"><${Icon} name="heart" size="14" /><b>${t('loyal.level', 'Nivel')} ${iso.lv ?? 0}</b><${Bar} value=${iso.loyal ?? 0} max=${LOYALTY.max} kind="calm" label=${t('loyal.name', 'Lealtad')} /></div>
    <div class="tabs" role="tablist">${TABS.map(([k, label, icon]) => html`<button role="tab" aria-selected=${tab === k} class=${`tab${tab === k ? ' on' : ''}`} onClick=${() => setTab(k)}>
      <${Icon} name=${icon} size="16" />${label}${k === 'tree' && Object.keys(SKILLS).some((id) => canLearn(home, iso, id) && canAfford(home, SKILLS[id].cost)) ? html`<i class="dot" aria-hidden="true"></i>` : ''}</button>`)}</div>
    ${tab === 'care' ? html`<${Care} s=${s} iso=${iso} st=${st} sp=${sp} />` : tab === 'sheet' ? html`<${Sheet} s=${s} iso=${iso} sp=${sp} />` : tab === 'outfit' ? html`<${Wardrobe} s=${s} iso=${iso} />` : html`<${Tree} s=${s} iso=${iso} />`}
  </section>`;
}
