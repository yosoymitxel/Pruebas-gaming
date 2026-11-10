// Ajustes (patrón KureiChaosChess): secciones en tarjetas con interruptores y selectores segmentados, más
// copia de seguridad de la partida. Todo se guarda al momento.
import { html, useState } from '../lib.js';
import { t } from '../../i18n/index.js';
import { LANGS, LANG } from '../../i18n/index.js';
import { FILTERS } from '../../view/ink.js';
import { serialize, deserialize, save } from '../../game/save.js';
import { Icon } from '../icons.js';
import { DIFFICULTIES } from '../../data/difficulty.js';
import { FullscreenToggle } from './pause.js';

export const Toggle = ({ on, onChange, label, hint }) => html`<label class="toggle">
  <span><b>${label}</b>${hint && html`<small>${hint}</small>`}</span>
  <input type="checkbox" role="switch" checked=${on} onChange=${(e) => onChange(e.target.checked)} />
</label>`;

export const Segmented = ({ value, options, onChange, label }) => html`<div class="segmented" role="group" aria-label=${label}>
  ${options.map(([id, name]) => html`<button class=${value === id ? 'on' : ''} aria-pressed=${value === id} onClick=${() => onChange(id)}>${name}</button>`)}
</div>`;

function Backup({ s }) {
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const copy = async () => {
    if (!s.game && !s.saved) return setMsg(t('backup.none', 'Todavía no hay partida que copiar.'));
    const text = btoa(unescape(encodeURIComponent(serialize(s.game ?? s.saved))));
    try { await navigator.clipboard.writeText(text); setMsg(t('backup.copied', 'Código copiado: guárdalo en una nota.')); } catch { setCode(text); setMsg(t('backup.shown', 'Cópialo del recuadro.')); }
  };
  const restore = () => {
    let game = null;
    try { game = deserialize(decodeURIComponent(escape(atob(code.trim())))); } catch { game = null; }
    if (!game) return setMsg(t('backup.bad', 'Ese código no es una partida válida. No se cambió nada.'));
    save(game);
    s.saved = game;
    s.game = null;
    setMsg(t('backup.ok', 'Partida restaurada: vuelve al menú y pulsa Continuar.'));
  };
  return html`<section class="panel set-card">
    <h2>${t('settings.backup', 'Copia de seguridad')}</h2>
    <div class="actions"><button class="btn" onClick=${copy}>${t('backup.copy', 'Copiar código de partida')}</button></div>
    <textarea rows="3" placeholder=${t('backup.paste', 'Pega aquí un código para restaurar')} value=${code} onInput=${(e) => setCode(e.target.value)}></textarea>
    <div class="actions"><button class="btn" disabled=${!code.trim()} onClick=${restore}>${t('backup.restore', 'Restaurar')}</button></div>
    ${msg && html`<p class="muted" role="status">${msg}</p>`}
  </section>`;
}

export function Settings({ s }) {
  const st = s.settings, set = (k) => (v) => s.setSetting(k, v);
  return html`<main class="screen settings">
    <header class="topbar">
      <button class="btn ghost icon" onClick=${() => s.closeSettings()} aria-label=${t('ui.back', 'Volver')}><${Icon} name="back" /></button>
      <h2>${t('settings.title', 'Ajustes')}</h2>
    </header>
    <div class="set-body">
      <section class="panel set-card">
        <h2>${t('settings.sound', 'Sonido')}</h2>
        <${Toggle} on=${st.sound !== false} onChange=${set('sound')} label=${t('settings.sfx', 'Efectos de sonido')} hint=${t('settings.sfxHint', 'Golpes, recogidas, interfaz y avisos')} />
        <${Toggle} on=${st.music !== false} onChange=${set('music')} label=${t('settings.music', 'Música')} hint=${t('settings.musicHint', 'Un ambiente por hora: día, noche y nido')} />
        <${Segmented} label=${t('settings.volume', 'Volumen')} value=${st.volume ?? 'normal'} onChange=${set('volume')}
          options=${[['suave', t('settings.volSoft', 'Suave')], ['normal', t('settings.volNormal', 'Normal')], ['fuerte', t('settings.volLoud', 'Fuerte')]]} />
      </section>
      <section class="panel set-card">
        <h2>${t('settings.screen', 'Pantalla')}</h2>
        <${Segmented} label=${t('settings.filter', 'Filtro')} value=${st.filter ?? 'tinta'} onChange=${set('filter')}
          options=${FILTERS.map((f) => [f, { tinta: t('settings.filterInk', 'Tinta'), crt: 'CRT', papel: t('settings.filterPaper', 'Papel viejo') }[f]])} />
        <${Toggle} on=${st.fx !== false} onChange=${set('fx')} label=${t('settings.fx', 'Efectos extra (clima, luciérnagas…)')} hint=${t('settings.fxHint', 'Lluvia, niebla y motas sobre el diorama')} />
        <${FullscreenToggle} />
        <${Toggle} on=${st.shake !== false} onChange=${set('shake')} label=${t('settings.shake', 'Temblor de cámara')} hint=${t('settings.shakeHint', 'Golpes fuertes y aturdimientos sacuden la escena')} />
        <${Toggle} on=${!!st.reduceMotion} onChange=${set('reduceMotion')} label=${t('settings.motion', 'Movimiento reducido')} hint=${t('settings.motionHint', 'Sin pausas de impacto ni animaciones de interfaz')} />
      </section>
      <section class="panel set-card">
        <h2>${t('settings.combat', 'Combate')}</h2>
        <${Segmented} label=${t('settings.difficulty', 'Dificultad')} value=${st.difficulty ?? 'normal'} onChange=${set('difficulty')}
          options=${Object.entries(DIFFICULTIES).map(([id, d]) => [id, d.name])} />
        <p class="muted">${t('settings.difficultyHint', 'Cambia la vida y el daño de las aberraciones desde el próximo combate.')}</p>
        <${Segmented} label=${t('settings.tactical', 'Pausa táctica')} value=${st.tactical ?? 'pausa'} onChange=${set('tactical')}
          options=${[['pausa', t('settings.tacticalStop', 'Detiene el tiempo')], ['lento', t('settings.tacticalSlow', 'Cámara lenta')]]} />
        <p class="muted">${t('settings.tacticalHint', 'Detenerlo se juega como por turnos; la cámara lenta deja la acción corriendo al 10 %.')}</p>
      </section>
      <section class="panel set-card">
        <h2>${t('settings.language', 'Idioma')}</h2>
        <${Segmented} label=${t('settings.language', 'Idioma')} value=${LANG} onChange=${() => {}} options=${Object.entries(LANGS)} />
      </section>
      <${Backup} s=${s} />
    </div>
  </main>`;
}
