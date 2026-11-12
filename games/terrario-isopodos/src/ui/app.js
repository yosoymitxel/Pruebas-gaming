import { html, render, useState, useEffect } from './lib.js';
import { t } from '../i18n/index.js';
import { ABERRATIONS } from '../data/aberrations.js';
import { PALETTES, SEMANTIC } from '../data/palettes.js';
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
import { Pause } from './screens/pause.js';
import { Gallery, AchievementToast } from './screens/gallery.js';

const OUTCOME = {
  won: () => t('result.won', 'La guardiana cae. El nido queda en silencio.'),
  lost: () => t('result.lost', 'El equipo vuelve a rastras; se perdió la mitad del botín.'),
  retreat: () => t('result.retreat', 'Volvéis antes de tiempo, con lo que llevabais.'),
  done: () => t('result.gather', 'Vuelta al terrario con la cosecha.'),
};

function Result({ s }) {
  const r = s.result;
  return html`<main class=${`screen result out-${r.outcome}`}><section class="drawer center reward">
    <i class="rays" aria-hidden="true"></i>
    <h3>${OUTCOME[r.outcome]()}</h3>
    <${Loot} loot=${r.loot} big />
    ${r.rescued > 0 && html`<p>${t('result.rescued', 'Isópodos rescatados')}: <b>${r.rescued}</b></p>`}
    ${r.kind === 'run' && html`<p class="run-sum">${t('result.depth', 'Capa')} <b>${r.depth}/7</b>${r.heat ? html` · ${t('result.heat', 'Plaga')} <b>${r.heat}</b>` : ''}</p>`}
    ${r.cause && html`<p class="run-sum">${t('result.cause', 'Os venció')}: <b>${[...new Set(r.cause)].map((k) => ABERRATIONS[k]?.name ?? k).join(' y ')}</b></p>`}
    ${r.lostLoot && Object.keys(r.lostLoot).length > 0 && html`<p class="run-sum">${t('result.lost', 'Perdido al caer')}:</p><${Loot} loot=${r.lostLoot} />`}
    ${r.heatUp && html`<p class="run-sum heat-up">${t('result.heatUp', 'El nido despierta: Plaga')} <b>${r.heatUp}</b> · ${t('result.heatDesc', 'aberraciones más duras')}</p>`}
    <button class="btn primary" onClick=${() => s.goHome()}>${t('islands.home', 'Volver al terrario')}</button>
  </section></main>`;
}

const SCREENS = { gallery: Gallery, settings: Settings, menu: Menu, home: Home, islands: Islands, gather: Gather, dungeon: Dungeon, combat: Combat, result: Result };

function App({ s }) {
  const [, force] = useState(0);
  useEffect(() => s.on(() => force((n) => n + 1)), []);
  const Screen = SCREENS[s.mode];
  // Al cambiar de pantalla, una mancha de tinta barre la vista (se omite con movimiento reducido).
  return html`<${Screen} s=${s} /><${AchievementToast} s=${s} />${s.paused && html`<${Pause} s=${s} />`}${!s.settings.reduceMotion && html`<div class="wipe" key=${s.mode} aria-hidden="true"></div>`}${s.dayWipe && s.time - s.dayWipe.at < 1.5 && html`<div class="day-wipe" key=${s.dayWipe.at} aria-hidden="true"><span><small>${t('ui.day', 'Día')}</small><b>${s.dayWipe.day}</b></span></div>`}`;
}

export function start() {
  const root = document.documentElement.style;
  for (const [k, v] of Object.entries(PALETTES.cozy)) root.setProperty(`--${k}`, v);
  for (const [k, v] of Object.entries(PALETTES.terror)) root.setProperty(`--terror-${k}`, v);
  for (const [k, v] of Object.entries(SEMANTIC)) root.setProperty(`--sem-${k}`, v);
  bindKeyboard();
  // Audio al primer gesto; y un clic suave en cada botón de la interfaz.
  addEventListener('pointerdown', unlockAudio, { once: true });
  addEventListener('keydown', unlockAudio, { once: true });
  document.getElementById('ui').addEventListener('click', (e) => { if (e.target.closest('button:not(.pad)')) playSfx('click'); });
  const ui = document.getElementById('ui');
  ui.textContent = '';
  try {
    const session = new Session(new Stage(document.getElementById('stage')));
    window.__terrario = session;
    render(html`<${App} s=${session} />`, ui);
  } catch (err) {
    window.__terrario = { failed: err };
    render(html`<${BootError} err=${err} />`, ui);
  }
}

// Sin WebGL (o con el contexto bloqueado tras un fallo de la GPU) no hay escena: se explica y se ofrece recargar.
function BootError({ err }) {
  const gl = /WebGL/i.test(String(err?.message));
  return html`<main class="screen result"><section class="drawer center">
    <h3>${gl ? t('boot.gl', 'Tu navegador no deja dibujar en 3D ahora mismo') : t('boot.fail', 'El juego no pudo arrancar')}</h3>
    <p>${gl ? t('boot.glHint', 'Cierra otras pestañas o reinicia el navegador y vuelve a intentarlo.') : String(err?.message ?? err)}</p>
    <button class="btn primary" onClick=${() => location.reload()}>${t('boot.retry', 'Recargar')}</button>
  </section></main>`;
}
