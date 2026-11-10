import { html, render, useState, useEffect } from './lib.js';
import { t } from '../i18n/index.js';
import { PALETTES } from '../data/palettes.js';
import { Stage } from '../view/stage.js';
import { Session } from './session.js';
import { bindKeyboard } from './input.js';
import { Menu } from './screens/menu.js';
import { Home } from './screens/home.js';
import { Islands } from './screens/islands.js';
import { Gather } from './screens/gather.js';
import { Dungeon } from './screens/dungeon.js';
import { Combat } from './screens/combat.js';
import { Settings } from './screens/settings.js';
import { unlockAudio, playSfx } from './sfx.js';
import { Loot } from './screens/common.js';

const OUTCOME = {
  won: () => t('result.won', 'La guardiana cae. El nido queda en silencio.'),
  lost: () => t('result.lost', 'El equipo vuelve a rastras; se perdió la mitad del botín.'),
  retreat: () => t('result.retreat', 'Volvéis antes de tiempo, con lo que llevabais.'),
  done: () => t('result.gather', 'Vuelta al terrario con la cosecha.'),
};

function Result({ s }) {
  const r = s.result;
  return html`<main class="screen result"><section class="drawer center">
    <h3>${OUTCOME[r.outcome]()}</h3>
    <${Loot} loot=${r.loot} />
    ${r.rescued > 0 && html`<p>${t('result.rescued', 'Isópodos rescatados')}: <b>${r.rescued}</b></p>`}
    <button class="btn primary" onClick=${() => s.goHome()}>${t('islands.home', 'Volver al terrario')}</button>
  </section></main>`;
}

const SCREENS = { settings: Settings, menu: Menu, home: Home, islands: Islands, gather: Gather, dungeon: Dungeon, combat: Combat, result: Result };

function App({ s }) {
  const [, force] = useState(0);
  useEffect(() => s.on(() => force((n) => n + 1)), []);
  const Screen = SCREENS[s.mode];
  // Al cambiar de pantalla, una mancha de tinta barre la vista (se omite con movimiento reducido).
  return html`<${Screen} s=${s} />${!s.settings.reduceMotion && html`<div class="wipe" key=${s.mode} aria-hidden="true"></div>`}`;
}

export function start() {
  const root = document.documentElement.style;
  for (const [k, v] of Object.entries(PALETTES.cozy)) root.setProperty(`--${k}`, v);
  for (const [k, v] of Object.entries(PALETTES.terror)) root.setProperty(`--terror-${k}`, v);
  bindKeyboard();
  // Audio al primer gesto; y un clic suave en cada botón de la interfaz.
  addEventListener('pointerdown', unlockAudio, { once: true });
  addEventListener('keydown', unlockAudio, { once: true });
  document.getElementById('ui').addEventListener('click', (e) => { if (e.target.closest('button:not(.pad)')) playSfx('click'); });
  const stage = new Stage(document.getElementById('stage'));
  const session = new Session(stage);
  window.__terrario = session;
  render(html`<${App} s=${session} />`, document.getElementById('ui'));
}
