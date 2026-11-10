// Sonidos sintetizados (Web Audio, sin archivos), al estilo de las recetas de KureiChaosChess: cada efecto es
// una lista de notas {f: frecuencia, to: final, t: inicio, d: duración, type, g: volumen, noise}. Se activa
// con el primer toque (los navegadores no dejan sonar antes).
const RECIPES = {
  click: [{ f: 520, to: 460, d: 0.05, type: 'triangle', g: 0.25 }],
  open: [{ f: 330, to: 520, d: 0.12, type: 'triangle', g: 0.25 }],
  close: [{ f: 520, to: 330, d: 0.1, type: 'triangle', g: 0.2 }],
  swing: [{ noise: true, f: 1800, to: 600, d: 0.12, g: 0.25 }],
  hit: [{ noise: true, f: 900, to: 200, d: 0.1, g: 0.45 }, { f: 160, to: 80, d: 0.1, type: 'square', g: 0.2 }],
  heavy: [{ noise: true, f: 600, to: 90, d: 0.25, g: 0.6 }, { f: 110, to: 45, d: 0.3, type: 'sawtooth', g: 0.3 }],
  hurt: [{ f: 300, to: 120, d: 0.18, type: 'sawtooth', g: 0.3 }],
  roll: [{ noise: true, f: 400, to: 1200, d: 0.18, g: 0.2 }],
  stagger: [{ f: 880, d: 0.08, type: 'square', g: 0.2 }, { f: 660, t: 0.08, d: 0.08, type: 'square', g: 0.2 }, { f: 990, t: 0.16, d: 0.14, type: 'square', g: 0.2 }],
  death: [{ noise: true, f: 500, to: 60, d: 0.6, g: 0.5 }, { f: 220, to: 40, d: 0.6, type: 'sawtooth', g: 0.25 }],
  heal: [{ f: 523, d: 0.1, type: 'sine', g: 0.25 }, { f: 659, t: 0.08, d: 0.1, type: 'sine', g: 0.25 }, { f: 784, t: 0.16, d: 0.2, type: 'sine', g: 0.25 }],
  pickup: [{ f: 880, to: 1320, d: 0.09, type: 'triangle', g: 0.3 }, { f: 1320, t: 0.07, d: 0.08, type: 'triangle', g: 0.2 }],
  build: [{ noise: true, f: 300, to: 120, d: 0.12, g: 0.4 }, { f: 196, d: 0.12, type: 'triangle', g: 0.25 }],
  telegraph: [{ f: 140, to: 200, d: 0.35, type: 'sawtooth', g: 0.12 }],
  win: [{ f: 523, d: 0.12, type: 'triangle', g: 0.3 }, { f: 659, t: 0.12, d: 0.12, type: 'triangle', g: 0.3 }, { f: 784, t: 0.24, d: 0.12, type: 'triangle', g: 0.3 }, { f: 1046, t: 0.36, d: 0.3, type: 'triangle', g: 0.3 }],
  lose: [{ f: 392, d: 0.2, type: 'sawtooth', g: 0.2 }, { f: 311, t: 0.2, d: 0.2, type: 'sawtooth', g: 0.2 }, { f: 233, t: 0.4, d: 0.5, type: 'sawtooth', g: 0.2 }],
  boss: [{ f: 55, to: 50, d: 1.2, type: 'sawtooth', g: 0.35 }, { noise: true, f: 200, to: 80, d: 1, g: 0.25 }],
};
export const SFX_NAMES = Object.keys(RECIPES);
export const VOLUMES = { suave: 0.35, normal: 0.65, fuerte: 1 };

let ctx = null, master = null, enabled = true, volume = VOLUMES.normal, noiseBuf = null;

export function unlockAudio() {
  if (ctx || typeof AudioContext === 'undefined') return;
  ctx = new AudioContext();
  master = ctx.createGain();
  master.gain.value = volume;
  master.connect(ctx.destination);
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  if (music.mood) playMusic(music.mood, true);
}

export function setSound(on, level) {
  enabled = on;
  if (level) volume = VOLUMES[level] ?? volume;
  if (master) master.gain.value = volume;
}

export function playSfx(name, pitch = 1) {
  if (!enabled || !ctx || !RECIPES[name]) return;
  const now = ctx.currentTime;
  for (const n of RECIPES[name]) {
    const t0 = now + (n.t ?? 0), t1 = t0 + n.d;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(n.g, t0 + Math.min(0.015, n.d / 3));
    gain.gain.exponentialRampToValueAtTime(0.0001, t1);
    let src;
    if (n.noise) {
      src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(n.f * pitch, t0);
      if (n.to) filter.frequency.exponentialRampToValueAtTime(n.to * pitch, t1);
      src.connect(filter).connect(gain);
    } else {
      src = ctx.createOscillator();
      src.type = n.type ?? 'sine';
      src.frequency.setValueAtTime(n.f * pitch, t0);
      if (n.to) src.frequency.exponentialRampToValueAtTime(n.to * pitch, t1);
      src.connect(gain);
    }
    gain.connect(master);
    src.start(t0);
    src.stop(t1 + 0.02);
  }
}

// Música de ambiente sintetizada, terror acogedor: un dron grave que respira (filtro que abre y cierra), una caja
// de música frágil que suelta notas sueltas de una escala frigia con eco, y en el nido latido y campanas
// disonantes. Nada de acordes dulces: inquieta sin agobiar.
const D = 146.83, ratio = (st) => 2 ** (st / 12);
const MOODS = {
  dia: { drone: [D / 2, D / 2 * ratio(7)], cut: [300, 900], scale: [0, 1, 4, 5, 7, 8, 10, 12, 13], base: D * 2, gap: [1.4, 3.4], vol: 0.075 },
  noche: { drone: [D / 2 * ratio(-2), D / 2 * ratio(5)], cut: [220, 600], scale: [0, 1, 3, 6, 7, 8, 11, 12], base: D * 1.5, gap: [2.2, 5], vol: 0.07 },
  nido: { drone: [D / 4, D / 4 * ratio(1)], cut: [120, 380], scale: [0, 1, 6, 7, 13, 18], base: D * 3, gap: [3, 7], vol: 0.085, beat: 1.5 },
};
export const MUSIC_MOODS = Object.keys(MOODS);
let music = { on: true, mood: null, bus: null, voices: [], timer: null, step: 0 };

export function setMusic(on) { music.on = on; if (!on) stopMusic(); else if (music.mood) playMusic(music.mood, true); }

function stopMusic() {
  clearTimeout(music.timer); clearInterval(music.beat);
  if (!ctx || !music.bus) return;
  const bus = music.bus, voices = music.voices;
  bus.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.6);
  setTimeout(() => { voices.forEach((o) => o.stop()); bus.disconnect(); }, 2500);
  music.bus = null; music.voices = [];
}

// Nota de caja de música: fundamental + armónico agudo, ataque seco y caída larga.
function pluck(bus, f, t, vol) {
  for (const [mul, v, dec] of [[1, 1, 2.4], [2.76, 0.35, 0.9], [5.4, 0.12, 0.4]]) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f * mul; o.detune.value = (Math.random() - 0.5) * 14;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * v, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dec);
    o.connect(g).connect(bus); o.start(t); o.stop(t + dec + 0.05);
  }
}

export function playMusic(mood, force = false) {
  if (mood === music.mood && !force) return;
  music.mood = mood;
  const m = MOODS[mood];
  if (!ctx || !music.on || !m) return;
  stopMusic();
  const bus = ctx.createGain(), lp = ctx.createBiquadFilter(), lfo = ctx.createOscillator(), lfoAmt = ctx.createGain();
  lp.type = 'lowpass'; lp.frequency.value = (m.cut[0] + m.cut[1]) / 2; lp.Q.value = 4;
  lfo.frequency.value = 0.05; lfoAmt.gain.value = (m.cut[1] - m.cut[0]) / 2; lfo.connect(lfoAmt).connect(lp.frequency); lfo.start();
  bus.gain.value = 0.0001; bus.gain.setTargetAtTime(1, ctx.currentTime, 2);
  bus.connect(master);
  // dron
  const droneGain = ctx.createGain(); droneGain.gain.value = m.vol * 0.55; droneGain.connect(lp).connect(bus);
  music.voices = [lfo, ...m.drone.map((f, k) => { const o = ctx.createOscillator(); o.type = k ? 'triangle' : 'sawtooth'; o.frequency.value = f; o.detune.value = k ? 7 : -5; o.connect(droneGain); o.start(); return o; })];
  // eco para la caja de música
  const echo = ctx.createDelay(1.5), fb = ctx.createGain(), wet = ctx.createGain(), dry = ctx.createGain();
  echo.delayTime.value = mood === 'nido' ? 0.9 : 0.55; fb.gain.value = 0.42; wet.gain.value = 0.5; dry.gain.value = 1;
  echo.connect(fb).connect(echo); echo.connect(wet).connect(bus); dry.connect(bus);
  const box = ctx.createGain(); box.connect(dry); box.connect(echo);
  const next = () => {
    if (!ctx || !music.bus) return;
    const st = m.scale[Math.floor(Math.random() * m.scale.length)];
    pluck(box, m.base * ratio(st), ctx.currentTime + 0.02, m.vol);
    if (Math.random() < 0.25) pluck(box, m.base * ratio(st + (mood === 'nido' ? 1 : 7)), ctx.currentTime + 0.18, m.vol * 0.6); // a veces, una segunda nota que no resuelve
    music.timer = setTimeout(next, (m.gap[0] + Math.random() * (m.gap[1] - m.gap[0])) * 1000);
  };
  music.timer = setTimeout(next, 1200);
  // latido del nido
  if (m.beat) music.beat = setInterval(() => {
    if (!ctx || !music.bus) return;
    for (const dt of [0, 0.22]) { const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime + dt;
      o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.25);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(m.vol * 1.4 * (dt ? 0.6 : 1), t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g).connect(bus); o.start(t); o.stop(t + 0.35); }
  }, m.beat * 1000);
  music.bus = bus;
}
