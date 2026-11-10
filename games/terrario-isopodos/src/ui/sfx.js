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
