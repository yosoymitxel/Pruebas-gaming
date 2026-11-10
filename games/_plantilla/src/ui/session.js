// Sesión: dueña del estado, del bucle y de las pantallas. La interfaz llama a sus métodos y se suscribe
// con on(); la vista 3D solo lee.
import { Group } from 'three';
import { newRound, tick } from '../game/game.js';
import { load, save } from '../game/save.js';
import { RoundView } from '../view/scene.js';
import { read } from './input.js';

const SETTINGS_KEY = '__ID__.settings.v1';

export class Session {
  constructor(stage) {
    this.stage = stage;
    this.listeners = new Set();
    this.mode = 'menu';
    this.saved = load() ?? { best: 0 };
    try { this.settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}'); } catch { this.settings = {}; }
    stage.setFilter(this.settings.filter ?? 'tinta');
    this.time = 0;
    this.last = performance.now();
    requestAnimationFrame((t) => this.frame(t));
  }

  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit() { for (const fn of this.listeners) fn(); }

  setMode(mode, view) {
    this.mode = mode;
    this.view = view;
    this.stage.setScene(view ? view.group : new Group(), view?.camera);
    this.emit();
  }

  start() { this.game = newRound(Math.floor(Math.random() * 1e9)); this.paused = false; this.setMode('play', new RoundView(this.game)); }
  menu() { this.setMode('menu', null); }
  togglePause() { this.paused = !this.paused; this.emit(); }

  setSetting(k, v) {
    this.settings[k] = v;
    if (k === 'filter') this.stage.setFilter(v);
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings)); } catch {}
    this.emit();
  }

  frame(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;
    const input = read();
    if (input.turn) this.stage.rotate(input.turn * dt * 1.6);
    if (this.mode === 'play' && !this.paused && !this.game.result) {
      const yaw = this.stage.yaw, { x, y } = input.move; // la palanca es relativa a la cámara
      tick(this.game, dt, { x: x * Math.cos(yaw) + y * Math.sin(yaw), y: -x * Math.sin(yaw) + y * Math.cos(yaw) });
      if (this.game.result && this.game.score > this.saved.best) { this.saved.best = this.game.score; save(this.saved); }
      this.emit();
    }
    this.view?.update(this.time, dt);
    this.stage.render(this.time);
    requestAnimationFrame((t) => this.frame(t));
  }
}
