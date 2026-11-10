// Sesión de juego: dueña del estado, del bucle y de las transiciones entre pantallas. La interfaz llama
// a sus métodos y se suscribe con on(); las escenas 3D solo leen.
import { newGame, visit, tickClock, dayPhase, sleep } from '../game/game.js';
import { DAY_PHASES } from '../data/world.js';
import { DIFFICULTIES } from '../data/difficulty.js';
import { tickHome, collect, build, expand, recruit, upgradeLayer, poke, takeMolt } from '../game/home.js';
import { newGather, tickGather, gatherLoot } from '../game/gather.js';
import { newRun, enterNode, enterRoom, combatSetup, finishCombat, pickCard, retreat as runRetreat, settleRun } from '../game/run.js';
import { createCombat, step, useAbility, useItem, switchMain, allies } from '../game/combat.js';
import { BUILDINGS } from '../data/buildings.js';
import { RESOURCES } from '../data/resources.js';
import { footprint } from '../game/grid.js';
import { save, load } from '../game/save.js';
import { mulberry32 } from '../core/rng.js';
import { HomeView, GatherView, CombatView, MenuView } from '../view/scenes.js';
import { newHome } from '../game/home.js';
import { playSfx, setSound, setMusic, playMusic } from './sfx.js';
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
    setSound(this.settings.sound !== false, this.settings.volume ?? 'normal');
    setMusic(this.settings.music !== false);
    this.paused = false;
    this.time = 0;
    this.hitstop = 0;
    this.fx = [];
    this.last = performance.now();
    this.goMenu();
    requestAnimationFrame((t) => this.frame(t));
  }

  sfx(name, pitch) { playSfx(name, pitch); }
  floatText(text, x, z, kind = 'note', y) { this.fx.push({ id: Math.random(), text, x, z, y, kind, at: this.time }); }
  // Temblor solo si los ajustes lo permiten.
  shake(amount) { if (this.settings.shake !== false && !this.settings.reduceMotion) this.stage.shake(amount); }

  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit() { for (const fn of this.listeners) fn(); }

  // weather: clima del fondo (por defecto, el del terrario hoy).
  setMode(mode, view, mood = 0, weather) {
    this.mode = mode;
    this.view = view;
    this.stage.setMood(mood);
    this.stage.setSky(weather ?? this.game?.home.weather ?? 'claro', mode === 'islands' ? 'mar' : mood >= 0.6 ? 'terror' : 'cozy');
    this.stage.setScene(view ? view.group : new Group(), view?.camera);
    view?.setFx?.(this.settings.fx !== false);
    if (view) view.still = !!this.settings.reduceMotion;
    this.paused = false;
    this.syncMusic();
    this.emit();
  }

  // Hora que se ve: la de la partida (o la del guardado en el menú); en el nido, luz neutra.
  get clock() { return this.mode === 'dungeon' || this.mode === 'combat' ? null : (this.game ?? this.saved)?.clock ?? 0.3; }
  get phase() { return this.clock === null ? null : dayPhase({ clock: this.clock }); }
  syncMusic() { playMusic(this.mode === 'dungeon' || this.mode === 'combat' ? 'nido' : this.phase === 'noche' ? 'noche' : 'dia'); }

  // Pausa (como en KureiChaosChess): congela el bucle de juego y abre el panel; el render sigue.
  pause() { if (this.mode === 'menu' || this.mode === 'settings' || this.mode === 'result') return; this.paused = true; this.sfx('open'); this.emit(); }
  resume() { this.paused = false; this.sfx('close'); this.emit(); }
  // Volver al terrario desde cualquier pantalla de juego: en el nido equivale a retirarse con el botín.
  leaveToHome() {
    this.paused = false;
    if (this.run) { if (this.combat) finishCombat(this.run, this.combat); this.combat = null; this.retreat(); }
    else if (this.mode === 'gather') this.endGather();
    else this.goHome();
  }
  sleep() { sleep(this.game); this.persist(); this.sfx('heal'); this.syncMusic(); this.emit(); }

  newGame() { this.game = newGame(); this.persist(); this.goHome(); }
  continueGame() { this.game = this.saved; this.goHome(); }
  persist() { if (this.game) save(this.game); }

  goHome() {
    this.build = null;
    this.game.home.weather = this.game.islands.find((i) => i.kind === 'hogar')?.weather ?? 'claro';
    this.setMode('home', new HomeView(this.stage, this.game.home), 0);
  }
  goArchipelago() { this.setMode('islands', new ArchipelagoView(this.stage, this.game), 0.1); }
  goMenu() {
    this.persist();
    this.saved = load();
    this.menuHome = this.saved?.home ?? newHome(mulberry32(7));
    this.setMode('menu', new MenuView(this.stage, this.menuHome), 0, this.menuHome.weather ?? 'claro');
  }
  openSettings() { this.back = { mode: this.mode }; this.setMode('settings', this.view, 0); this.stage.setScene(this.view?.group ?? new Group(), this.view?.camera); }
  closeSettings() { if (this.back?.mode === 'menu') this.goMenu(); else this.setMode(this.back?.mode ?? 'menu', this.view, 0); }

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
    if (!build(this.game.home, b.type, b.i, b.j, b.rot)) { this.sfx('hurt', 1.6); return false; }
    this.sfx('build');
    { const f = footprint(b.type, b.rot); this.view.burst('build', b.i + f.w / 2, b.j + f.h / 2); }
    this.persist();
    this.hoverBuild(b.i + Math.floor((footprint(b.type, b.rot).w - 1) / 2), b.j + Math.floor((footprint(b.type, b.rot).h - 1) / 2));
    return true;
  }
  tapHome(cell) {
    const home = this.game.home;
    // Primero lo vivo: una muda para recoger o un isópodo al que tocar (bolita o huida).
    const molt = (home.molts ?? []).find((m) => Math.hypot(m.x - cell.x, m.y - cell.y) < 0.7);
    if (molt && takeMolt(home, molt.id)) {
      const w = this.view.toWorld(molt.x, molt.y);
      this.sfx('pickup'); this.view.burst('pickup', molt.x, molt.y);
      this.floatText(`+1 ${RESOURCES.cal.name}`, w.x, w.z, 'gain');
      this.persist(); this.emit();
      return { res: 'cal', n: 1 };
    }
    const iso = home.isopods.find((i) => Math.hypot(i.x - cell.x, i.y - cell.y) < 0.6);
    if (iso) {
      const what = poke(home, iso, cell), w = this.view.toWorld(iso.x, iso.y);
      this.sfx(what === 'ball' ? 'roll' : 'click');
      this.floatText(what === 'ball' ? t('home.ball', '¡Bolita!') : what === 'molting' ? t('home.molting', 'Mudando…') : t('home.run', '¡Corre!'), w.x, w.z, 'note', 1.2);
      this.emit();
      return { poked: iso.id };
    }
    const piece = Object.values(home.grid.pieces).find((p) => {
      const f = footprint(p.type, p.rot);
      return home.stock[p.id]?.ready && cell.x >= p.x - 0.5 && cell.x <= p.x + f.w + 0.5 && cell.y >= p.y - 0.8 && cell.y <= p.y + f.h + 0.5;
    });
    if (!piece) return null;
    const n = collect(home, piece.id);
    const f = footprint(piece.type, piece.rot);
    this.view.burst('pickup', piece.x + f.w / 2, piece.y + f.h / 2);
    this.sfx('pickup');
    const w = this.view.toWorld(piece.x + f.w / 2, piece.y + f.h / 2);
    this.floatText(`+${n} ${RESOURCES[BUILDINGS[piece.type].produces.res].name}`, w.x, w.z, 'gain');
    this.persist(); this.emit();
    return { res: BUILDINGS[piece.type].produces.res, n };
  }
  upgradeLayer(id) { const ok = upgradeLayer(this.game.home, id); if (ok) this.persist(); this.emit(); return ok; }
  expandHome() { const ok = expand(this.game.home); if (ok) this.persist(); this.emit(); return ok; }

  // ——— Recolección ———
  startGather(island, isoId) {
    const iso = this.game.home.isopods.find((x) => x.id === isoId);
    this.gather = newGather(island);
    this.gather.shell = iso.shell;
    const view = new GatherView(this.stage, this.gather);
    view.onPick = (n) => {
      const w = view.toWorld(n.x, n.y);
      this.sfx(n.lost ? 'heal' : 'pickup', 0.9 + Math.random() * 0.25);
      this.floatText(n.lost ? t('gather.found', '¡Encontrado!') : `+1 ${RESOURCES[n.res].name}`, w.x, w.z, 'gain', 1);
    };
    this.setMode('gather', view, WEATHER_MOOD[island.weather], island.weather);
  }
  endGather() {
    const g = this.gather, loot = gatherLoot(g);
    for (const [r, n] of Object.entries(loot)) this.game.home.resources[r] = (this.game.home.resources[r] ?? 0) + n;
    if (g.rescued) recruit(this.game.home, this.rng);
    visit(this.game, g.island.id);
    this.result = { kind: 'gather', loot, rescued: g.rescued ? 1 : 0, outcome: 'done' };
    this.persist();
    this.sfx('win');
    this.setMode('result', null, 0);
  }

  // ——— Expedición ———
  startRun(island, partyIds) {
    this.run = newRun(this.game.home, island, partyIds);
    visit(this.game, island.id);
    this.persist();
    this.setMode('dungeon', null, 0.75, this.run.island.weather);
  }
  enter(nodeId) {
    if (!enterNode(this.run, nodeId)) return;
    this.afterRoom();
  }
  // Puerta del piso: otra sala (pelea, botín, carta o reliquia).
  enterRoom(id) {
    if (!enterRoom(this.run, id)) return;
    this.sfx('open');
    this.afterRoom();
  }
  afterRoom() {
    if (this.run.state === 'combat') {
      const setup = combatSetup(this.run), diff = DIFFICULTIES[this.settings.difficulty ?? 'normal'];
      this.combo = null; this.cleared = null; this.hurtAt = null; this.slowmo = 0;
      this.combat = createCombat({ ...setup, enemyHpMul: (setup.enemyHpMul ?? 1) * diff.hp, mods: { ...setup.mods, enemyDamageMul: diff.dmg } });
      this.tactical = false;
      const bossRoom = this.run.node.type === 'jefe' && this.run.room?.final;
      this.sfx(bossRoom ? 'boss' : 'open');
      const bossFoe = bossRoom && this.combat.actors.find((a) => a.side === 'enemy');
      this.setMode('combat', new CombatView(this.stage, this.combat, this.run.encounter.seed, this.run.island.weather, this.run.island.vessel === 'diorama' ? 'diorama' : 'frasco'), 1, this.run.island.weather);
      if (bossFoe) this.stage.pixfx.spawn('boss', bossFoe.x, 0.05, bossFoe.y);
    } else this.emit();
  }
  chooseCard(id) { pickCard(this.run, id); this.sfx('heal'); this.emit(); }
  retreat() { runRetreat(this.run); this.settle(); }
  settle() {
    const out = settleRun(this.game.home, this.run, this.rng);
    this.sfx(out.outcome === 'lost' ? 'lose' : 'win');
    this.result = { kind: 'run', ...out };
    this.run = null;
    this.persist();
    this.setMode('result', null, 0);
  }
  endCombat() {
    finishCombat(this.run, this.combat);
    this.combat = null;
    if (this.run.state === 'won' || this.run.state === 'lost') this.settle();
    else this.setMode('dungeon', null, 0.75, this.run.island.weather);
  }
  setTactical(on) { if (on !== this.tactical) this.sfx(on ? 'open' : 'close'); this.tactical = on; this.emit(); }
  ability(actorId, abilityId) { const ok = useAbility(this.combat, actorId, abilityId); if (ok) this.setTactical(false); return ok; }
  item(id) { const ok = useItem(this.combat, id); if (ok) this.setTactical(false); return ok; }
  switchTo(id) { switchMain(this.combat, id); this.emit(); }

  setSetting(k, v) {
    this.settings[k] = v;
    if (k === 'filter') this.stage.setFilter(v);
    if (k === 'music') setMusic(v !== false);
    if (k === 'fx') this.view?.setFx?.(v !== false);
    if (k === 'sound' || k === 'volume') { setSound(this.settings.sound !== false, this.settings.volume ?? 'normal'); this.sfx('click'); }
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings)); } catch {}
    this.emit();
  }

  // ——— Bucle ———
  frame(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;
    const input = read();
    if (input.pause) { if (this.paused) this.resume(); else this.pause(); }
    if (this.paused) { this.stage.render(this.time, 0); requestAnimationFrame((t) => this.frame(t)); return; }
    if (this.game && (this.mode === 'home' || this.mode === 'islands' || this.mode === 'gather')) {
      const before = this.phase, day = this.game.day;
      tickClock(this.game, dt);
      if (this.phase !== before) this.syncMusic();
      if (this.game.day !== day && this.mode === 'islands') this.goArchipelago(); // amaneció: islas nuevas
    }
    this.stage.setTime(this.clock);
    this.view?.setNight?.(this.phase === 'noche');
    if (input.turn) this.stage.rotate(input.turn * dt * 1.6);
    input.move = toWorld(input.move, this.stage.yaw);
    if (this.mode === 'menu') tickHome(this.menuHome, dt, this.rng);
    else if (this.mode === 'home') { tickHome(this.game.home, dt, this.rng, DAY_PHASES[this.phase]); this.saveTimer = (this.saveTimer ?? 0) + dt; if (this.saveTimer > 15) { this.saveTimer = 0; this.persist(); } }
    else if (this.mode === 'gather' && !this.gather.done) { tickGather(this.gather, dt, input.move); if (this.gather.done) this.emit(); }
    else if (this.mode === 'combat') this.tickCombat(dt, input);
    this.view?.update(this.time, dt);
    if (this.fx.length) this.fx = this.fx.filter((f) => this.time - f.at < 0.9);
    this.stage.render(this.time, dt);
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
    // Cámara lenta al matar (más larga con la última): el golpe final se saborea, como en Cult of the Lamb.
    if (this.slowmo > 0) { this.slowmo -= dt; dt *= 0.3; }
    const from = c.events.length;
    step(c, dt * (this.tactical ? TACTICAL_SPEED[this.settings.tactical ?? 'pausa'] : 1), this.tactical ? {} : input);
    for (const ev of c.events.slice(from)) {
      if (ev.type === 'hit') {
        this.view.hit(ev.id);
        const a = c.actors.find((x) => x.id === ev.id);
        this.view.burst(a.side === 'ally' ? 'hurt' : ev.amount >= 20 ? 'heavy' : 'hit', ev.id);
        this.sfx(a.side === 'ally' ? 'hurt' : ev.amount >= 20 ? 'heavy' : 'hit', 0.9 + Math.random() * 0.2);
        this.fx.push({ id: Math.random(), x: a.x, z: a.y, text: ev.amount, kind: a.side, at: this.time, big: ev.staggered });
        if (a.side === 'enemy') this.combo = { n: this.combo && this.time - this.combo.at < 1.4 ? this.combo.n + 1 : 1, at: this.time };
        else this.hurtAt = this.time;
        if (!this.settings.reduceMotion) {
          if (a.side === 'enemy') { this.hitstop = ev.staggered ? 0.09 : 0.05; this.shake(ev.amount >= 20 ? 0.3 : 0.08); }
          if (a.side === 'ally' && ev.heavy) this.shake(0.35);
        }
      } else if (ev.type === 'stagger') { this.view.burst('spark', ev.id); this.sfx('stagger'); this.shake(0.25); this.fx.push({ id: Math.random(), ...pos(c, ev.id), text: t('combat.staggerFx', '¡Aturdida!'), kind: 'note', at: this.time }); }
      else if (ev.type === 'death') {
        this.view.burst('death', ev.id); this.sfx('death');
        const foe = c.actors.find((x) => x.id === ev.id);
        if (foe?.side === 'enemy') {
          const last = !c.actors.some((x) => x.side === 'enemy' && x.hp > 0);
          if (!this.settings.reduceMotion) { this.slowmo = last ? 0.7 : 0.22; this.shake(last ? 0.5 : 0.3); }
          if (last) { this.cleared = this.time; this.sfx('win'); for (let k = 0; k < 3; k++) this.stage.pixfx.spawn('pickup', foe.x + (k - 1) * 0.8, 0, foe.y + (k % 2) * 0.5); }
        }
      }
      else if (ev.type === 'telegraph') this.sfx('telegraph');
      else if (ev.type === 'ability' || ev.type === 'item') { const heal = ['rocio', 'gota'].includes(ev.ability ?? ev.item); this.view.burst(heal ? 'heal' : 'spark', ev.id); this.sfx(heal ? 'heal' : 'swing'); }
      else if (ev.type === 'dodge') this.fx.push({ id: Math.random(), ...pos(c, ev.id), text: t('combat.dodgeFx', 'Esquiva'), kind: 'note', at: this.time });
    }
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
