// Sesión de juego: dueña del estado, del bucle y de las transiciones entre pantallas. La interfaz llama
// a sus métodos y se suscribe con on(); las escenas 3D solo leen.
import { newGame, visit } from '../game/game.js';
import { tickHome, collect, build, expand, recruit } from '../game/home.js';
import { newGather, tickGather, gatherLoot } from '../game/gather.js';
import { newRun, enterNode, combatSetup, finishCombat, pickCard, retreat as runRetreat, settleRun } from '../game/run.js';
import { createCombat, step, useAbility, useItem, switchMain, allies } from '../game/combat.js';
import { BUILDINGS } from '../data/buildings.js';
import { footprint } from '../game/grid.js';
import { save, load } from '../game/save.js';
import { mulberry32 } from '../core/rng.js';
import { HomeView, GatherView, CombatView } from '../view/scenes.js';
import { ArchipelagoView } from '../view/archipelago.js';
import { read } from './input.js';
import { t } from '../i18n/index.js';
import { Group } from 'three';

// Pausa táctica: «pausa» detiene el tiempo (como por turnos); «lento» lo deja al 10 %.
const TACTICAL_SPEED = { pausa: 0, lento: 0.1 };

export class Session {
  constructor(stage) {
    this.stage = stage;
    this.listeners = new Set();
    this.mode = 'menu';
    this.saved = load();
    this.rng = mulberry32(Date.now() % 1e9);
    this.settings = loadSettings();
    stage.setFilter(this.settings.filter ?? 'tinta');
    this.time = 0;
    this.hitstop = 0;
    this.fx = [];
    this.last = performance.now();
    requestAnimationFrame((t) => this.frame(t));
  }

  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit() { for (const fn of this.listeners) fn(); }

  setMode(mode, view, mood = 0) {
    this.mode = mode;
    this.view = view;
    this.stage.setMood(mood);
    this.stage.setScene(view ? view.group : new Group(), view?.camera);
    this.emit();
  }

  newGame() { this.game = newGame(); this.persist(); this.goHome(); }
  continueGame() { this.game = this.saved; this.goHome(); }
  persist() { if (this.game) save(this.game); }

  goHome() {
    this.build = null;
    this.game.home.weather = this.game.islands.find((i) => i.kind === 'hogar')?.weather ?? 'claro';
    this.setMode('home', new HomeView(this.stage, this.game.home), 0);
  }
  goArchipelago() { this.setMode('islands', new ArchipelagoView(this.stage, this.game), 0.1); }
  goMenu() { this.persist(); this.saved = load(); this.setMode('menu', null, 0); }

  // ——— Terrario ———
  startBuild(type) { this.build = { type, rot: 0, i: null, j: null, ok: false }; this.view.setBuildMode(true); this.emit(); }
  cancelBuild() { this.build = null; this.view.setBuildMode(false); this.emit(); }
  rotateBuild() { if (this.build) { this.build.rot = (this.build.rot + 1) % 4; this.hoverBuild(this.build.i, this.build.j); } }
  hoverBuild(i, j) {
    if (!this.build || i === null) return;
    const f = footprint(this.build.type, this.build.rot);
    Object.assign(this.build, { i: i - Math.floor((f.w - 1) / 2), j: j - Math.floor((f.h - 1) / 2) });
    this.build.ok = this.view.setGhost(this.build);
    this.emit();
  }
  confirmBuild() {
    const b = this.build;
    if (!b || b.i === null) return false;
    if (!build(this.game.home, b.type, b.i, b.j, b.rot)) return false;
    this.persist();
    this.hoverBuild(b.i + Math.floor((footprint(b.type, b.rot).w - 1) / 2), b.j + Math.floor((footprint(b.type, b.rot).h - 1) / 2));
    return true;
  }
  tapHome(cell) {
    const home = this.game.home;
    const piece = Object.values(home.grid.pieces).find((p) => {
      const f = footprint(p.type, p.rot);
      return home.stock[p.id]?.ready && cell.x >= p.x - 0.5 && cell.x <= p.x + f.w + 0.5 && cell.y >= p.y - 0.8 && cell.y <= p.y + f.h + 0.5;
    });
    if (!piece) return null;
    const n = collect(home, piece.id);
    const f = footprint(piece.type, piece.rot);
    this.view.burst('pickup', piece.x + f.w / 2, piece.y + f.h / 2);
    this.persist(); this.emit();
    return { res: BUILDINGS[piece.type].produces.res, n };
  }
  expandHome() { const ok = expand(this.game.home); if (ok) this.persist(); this.emit(); return ok; }

  // ——— Recolección ———
  startGather(island, isoId) {
    const iso = this.game.home.isopods.find((x) => x.id === isoId);
    this.gather = newGather(island);
    this.gather.shell = iso.shell;
    this.setMode('gather', new GatherView(this.stage, this.gather), WEATHER_MOOD[island.weather]);
  }
  endGather() {
    const g = this.gather, loot = gatherLoot(g);
    for (const [r, n] of Object.entries(loot)) this.game.home.resources[r] = (this.game.home.resources[r] ?? 0) + n;
    if (g.rescued) recruit(this.game.home, this.rng);
    visit(this.game, g.island.id);
    this.result = { kind: 'gather', loot, rescued: g.rescued ? 1 : 0, outcome: 'done' };
    this.persist();
    this.setMode('result', null, 0);
  }

  // ——— Expedición ———
  startRun(island, partyIds) {
    this.run = newRun(this.game.home, island, partyIds);
    visit(this.game, island.id);
    this.persist();
    this.setMode('dungeon', null, 0.75);
  }
  enter(nodeId) {
    if (!enterNode(this.run, nodeId)) return;
    if (this.run.state === 'combat') {
      this.combat = createCombat(combatSetup(this.run));
      this.tactical = false;
      this.setMode('combat', new CombatView(this.stage, this.combat, this.run.encounter.seed, this.run.island.weather, this.run.island.vessel === 'diorama' ? 'diorama' : 'frasco'), 1);
    } else this.emit();
  }
  chooseCard(id) { pickCard(this.run, id); this.emit(); }
  retreat() { runRetreat(this.run); this.settle(); }
  settle() {
    const out = settleRun(this.game.home, this.run, this.rng);
    this.result = { kind: 'run', ...out };
    this.run = null;
    this.persist();
    this.setMode('result', null, 0);
  }
  endCombat() {
    finishCombat(this.run, this.combat);
    this.combat = null;
    if (this.run.state === 'won' || this.run.state === 'lost') this.settle();
    else this.setMode('dungeon', null, 0.75);
  }
  setTactical(on) { this.tactical = on; this.emit(); }
  ability(actorId, abilityId) { const ok = useAbility(this.combat, actorId, abilityId); if (ok) this.setTactical(false); return ok; }
  item(id) { const ok = useItem(this.combat, id); if (ok) this.setTactical(false); return ok; }
  switchTo(id) { switchMain(this.combat, id); this.emit(); }

  setSetting(k, v) {
    this.settings[k] = v;
    if (k === 'filter') this.stage.setFilter(v);
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings)); } catch {}
    this.emit();
  }

  // ——— Bucle ———
  frame(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;
    const input = read();
    if (input.turn) this.stage.rotate(input.turn * dt * 1.6);
    input.move = toWorld(input.move, this.stage.yaw);
    if (this.mode === 'home') { tickHome(this.game.home, dt, this.rng); this.saveTimer = (this.saveTimer ?? 0) + dt; if (this.saveTimer > 15) { this.saveTimer = 0; this.persist(); } }
    else if (this.mode === 'gather' && !this.gather.done) { tickGather(this.gather, dt, input.move); if (this.gather.done) this.emit(); }
    else if (this.mode === 'combat') this.tickCombat(dt, input);
    this.view?.update(this.time, dt);
    this.stage.render(this.time);
    this.hudTimer = (this.hudTimer ?? 0) + dt;
    if (this.hudTimer > 0.08 && (this.mode === 'combat' || this.mode === 'gather' || this.mode === 'home' || this.mode === 'islands')) { this.hudTimer = 0; this.emit(); }
    requestAnimationFrame((t) => this.frame(t));
  }

  tickCombat(dt, input) {
    const c = this.combat;
    if (c.result) return;
    if (input.tactical) this.setTactical(!this.tactical);
    for (const [k, n] of [['p1', 0], ['p2', 1], ['p3', 2]]) if (input[k]) { const a = allies(c)[n]; if (a) switchMain(c, a.id); }
    if (this.hitstop > 0) { this.hitstop -= dt; return; }
    const from = c.events.length;
    step(c, dt * (this.tactical ? TACTICAL_SPEED[this.settings.tactical ?? 'pausa'] : 1), this.tactical ? {} : input);
    for (const ev of c.events.slice(from)) {
      if (ev.type === 'hit') {
        this.view.hit(ev.id);
        const a = c.actors.find((x) => x.id === ev.id);
        this.view.burst(a.side === 'ally' ? 'hurt' : ev.amount >= 20 ? 'heavy' : 'hit', ev.id);
        this.fx.push({ id: Math.random(), x: a.x, z: a.y, text: ev.amount, kind: a.side, at: this.time, big: ev.staggered });
        if (!this.settings.reduceMotion) {
          if (a.side === 'enemy') this.hitstop = 0.05;
          if (a.side === 'ally' && ev.heavy) this.stage.shake(0.35);
        }
      } else if (ev.type === 'stagger') { this.view.burst('spark', ev.id); if (!this.settings.reduceMotion) this.stage.shake(0.25); this.fx.push({ id: Math.random(), ...pos(c, ev.id), text: t('combat.staggerFx', '¡Aturdida!'), kind: 'note', at: this.time }); }
      else if (ev.type === 'death') this.view.burst('death', ev.id);
      else if (ev.type === 'ability' || ev.type === 'item') this.view.burst(['rocio', 'gota'].includes(ev.ability ?? ev.item) ? 'heal' : 'spark', ev.id);
      else if (ev.type === 'dodge') this.fx.push({ id: Math.random(), ...pos(c, ev.id), text: t('combat.dodgeFx', 'Esquiva'), kind: 'note', at: this.time });
    }
    this.fx = this.fx.filter((f) => this.time - f.at < 0.9);
    if (c.result) this.emit();
  }
}

// La palanca es relativa a la cámara: «arriba» siempre se aleja de ella, gire como gire.
const toWorld = ({ x, y }, yaw) => ({ x: x * Math.cos(yaw) + y * Math.sin(yaw), y: -x * Math.sin(yaw) + y * Math.cos(yaw) });
const pos = (c, id) => { const a = c.actors.find((x) => x.id === id); return { x: a.x, z: a.y }; };
const WEATHER_MOOD = { claro: 0, niebla: 0.45, lluvia: 0.3 };
const SETTINGS_KEY = 'terrario.settings.v1';
function loadSettings() {
  const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  try { return { reduceMotion: reduce, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') }; } catch { return { reduceMotion: reduce }; }
}
