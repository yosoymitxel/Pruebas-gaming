import { html, render, useState, useEffect } from './lib.js';
import { t } from '../i18n/index.js';
import { PALETTE } from '../data/palettes.js';
import { FILTERS } from '../view/ink.js';
import { Stage } from '../view/stage.js';
import { Session } from './session.js';
import { bindKeyboard } from './input.js';
import { Icon } from './icons.js';

function Menu({ s }) {
  return html`<main class="screen menu">
    <h1>${t('menu.title', '__NOMBRE__')}</h1>
    <p>${t('menu.best', 'Mejor puntuación')}: <b>${s.saved.best}</b></p>
    <div class="actions">
      <button class="btn primary" onClick=${() => s.start()}><${Icon} name="play" /> ${t('menu.play', 'Jugar')}</button>
      <button class="btn" onClick=${() => s.setSetting('filter', FILTERS[(FILTERS.indexOf(s.settings.filter ?? 'tinta') + 1) % FILTERS.length])}>
        ${t('menu.filter', 'Filtro')}: ${s.settings.filter ?? 'tinta'}</button>
    </div>
  </main>`;
}

function Play({ s }) {
  const g = s.game;
  return html`<main class="screen play">
    <header class="hud"><b>${g.score}</b><span>${Math.ceil(g.time)} s</span>
      <button class="btn icon" onClick=${() => s.togglePause()} aria-label=${t('ui.pause', 'Pausa')}><${Icon} name="pause" /></button></header>
    <p class="hint">${t('play.hint', 'WASD o flechas para moverte · Q/E giran la cámara · recoge todo')}</p>
    ${(s.paused || g.result) && html`<section class="panel">
      <h2>${g.result === 'win' ? t('play.win', '¡Todo recogido!') : g.result === 'time' ? t('play.time', 'Se acabó el tiempo') : t('ui.paused', 'Pausa')}</h2>
      <div class="actions">
        ${!g.result && html`<button class="btn primary" onClick=${() => s.togglePause()}>${t('ui.resume', 'Seguir')}</button>`}
        ${g.result && html`<button class="btn primary" onClick=${() => s.start()}>${t('ui.again', 'Otra vez')}</button>`}
        <button class="btn" onClick=${() => s.menu()}><${Icon} name="back" /> ${t('ui.menu', 'Menú')}</button>
      </div>
    </section>`}
  </main>`;
}

const SCREENS = { menu: Menu, play: Play };

function App({ s }) {
  const [, force] = useState(0);
  useEffect(() => s.on(() => force((n) => n + 1)), []);
  const Screen = SCREENS[s.mode];
  return html`<${Screen} s=${s} />`;
}

export function start() {
  for (const [k, v] of Object.entries(PALETTE)) document.documentElement.style.setProperty(`--${k}`, v);
  bindKeyboard();
  const session = new Session(new Stage(document.getElementById('stage')));
  window.__game = session;
  render(html`<${App} s=${session} />`, document.getElementById('ui'));
}
