// Sesión de juego: dueña del estado, del bucle y de las transiciones entre pantallas. La interfaz llama
// a sus métodos y se suscribe con on(); las escenas 3D solo leen.
import { newGame, visit, tickClock, dayPhase, sleep } from '../game/game.js';
import { DAY_PHASES } from '../data/world.js';
import { DIFFICULTIES } from '../data/difficulty.js';
import { loadMeta, saveMeta, award, tally } from '../game/meta.js';
import { ABERRATIONS } from '../data/aberrations.js';
import { FAITH } from '../data/cult.js';
import { temple, ritual, pay, tickHome, collect, build, expand, recruit, upgradeLayer, poke, takeMolt, takeLeaf, mist, setLid, bless, sermon, addFaith, fitGrid, upgradePiece, storePiece, orderIso, renameIso, badgeIso, learnSkill } from '../game/home.js';
import { newGather, tickGather, gatherLoot } from '../game/gather.js';
import { newRun, enterNode, enterRoom, combatSetup, finishCombat, pickCard, retreat as runRetreat, settleRun, buy, HEAT, pickWeapon, swapWeapon, acceptPact } from '../game/run.js';
import { createCombat, step, HEAVY, useAbility, useItem, switchMain, allies, roam, ARENA_R } from '../game/combat.js';
import { BUILDINGS } from '../data/buildings.js';
import { RESOURCES } from '../data/resources.js';
import { ROBES } from '../data/robes.js';
import { TIPS } from '../data/tips.js';
import { merchantToday, trade, buyUpgrade, hasUpgrade, buyOutfit, wearOutfit } from '../game/economy.js';
import { footprint, move } from '../game/grid.js';
import { save, load } from '../game/save.js';
import { mulberry32 } from '../core/rng.js';
import { HomeView, GatherView, CombatView, MenuView } from '../view/scenes.js';
import { newHome } from '../game/home.js';
import { playSfx, setSound, setMusic, playMusic } from './sfx.js';
import { ArchipelagoView } from '../view/archipelago.js';
import { read } from './input.js';
import { t } from '../i18n/index.js';
import { RITUALS } from '../data/cult.js';
import { InteriorView } from '../view/interior.js';
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
    this.meta = loadMeta();
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
  // Logros (como KureiChaosChess): se otorgan en caliente y asoman en un cartel.
  achieve(id, need) {
    const a = need ? tally(this.meta, id, need) : award(this.meta, id);
    saveMeta(this.meta);
    if (!a) return;
    this.toastAch = { ...a, at: this.time };
    this.sfx('win');
  }
  // Galería de especies, crías y coleccionista: se mira la colonia una vez por segundo.
  trackColony() {
    if ((this.colonyT = (this.colonyT ?? 0) + 1) % 60) return;
    const isos = this.game.home.isopods, kinds = new Set(isos.map((i) => i.shell));
    let fresh = false;
    for (const k of kinds) if (!this.meta.species[k]) { this.meta.species[k] = true; fresh = true; }
    if (fresh) saveMeta(this.meta);
    if (kinds.size >= 5) this.achieve('species5');
    if (isos.some((i) => i.baby > 0)) this.achieve('baby');
  }
  closeGallery() { if (this.back?.mode === 'menu') this.goMenu(); else this.setMode(this.back?.mode ?? 'menu', this.view, 0); }
  goGallery() { this.back = { mode: this.mode }; this.setMode('gallery', this.view, 0); this.stage.setScene(this.view?.group ?? new Group(), this.view?.camera); }
  floatText(text, x, z, kind = 'note', y) { this.fx.push({ id: Math.random(), text, x, z, y, kind, at: this.time }); }
  // Temblor solo si los ajustes lo permiten.
  shake(amount) { if (this.settings.shake !== false && !this.settings.reduceMotion) this.stage.shake(amount); }

  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit() { for (const fn of this.listeners) fn(); }

  // weather: clima del fondo (por defecto, el del terrario hoy).
  setMode(mode, view, mood = 0, weather) {
    if (this.view && this.view !== view) this.view.dispose?.();
    this.mode = mode;
    this.view = view;
    if (view) view.onMarker = (m) => { if (m.piece != null && this.game.home.grid.pieces[m.piece]) { if (m.kind === 'ready') this.collectPiece(this.game.home.grid.pieces[m.piece]); else this.selectPiece(m.piece); } else if (m.kind === 'merchant') { this.wantPanel = 'merchant'; this.sfx('open'); this.emit(); } else if (m.iso != null) this.selectIso(m.iso); else if (m.at) this.tapHome(m.at); };
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
  // Dormir: un barrido de tinta cruza la pantalla y el día cambia detrás de él (a mitad del barrido).
  sleep() {
    if (this.dayWipe && this.time - this.dayWipe.at < 1.4) return;
    this.dayWipe = { at: this.time, day: this.game.day + 1 }; this.sfx('close'); this.emit();
    setTimeout(() => { this.achieve('sleep'); sleep(this.game); this.persist(); this.sfx('heal'); this.syncMusic(); this.emit(); }, this.settings.reduceMotion ? 0 : 650);
  }

  newGame() { this.game = newGame(); this.persist(); this.goHome(); }
  continueGame() { this.game = this.saved; fitGrid(this.game.home); this.goHome(); }
  persist() { if (this.game) save(this.game); }

  goHome() {
    this.build = null; this.selIso = null;
    this.game.home.weather = this.game.islands.find((i) => i.kind === 'hogar')?.weather ?? 'claro';
    if (this.mode === 'islands' || this.mode === 'result') this.nexo('isla', t('nexo.home', 'Terrario'));
    this.setMode('home', new HomeView(this.stage, this.game.home), 0);
  }
  // Nexo: cortinilla entre secciones (isla: iris; nido: descenso; combate: golpe; sala: puerta).
  nexo(kind, title, sub) { this.nexus = this.settings.reduceMotion ? null : { kind, title, sub, at: this.time }; }
  goArchipelago() { this.nexo('isla', t('nexo.islands', 'Archipiélago'), t('nexo.islandsSub', 'Se levanta la tapa')); this.setMode('islands', new ArchipelagoView(this.stage, this.game), 0.1); }
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
  // Mover una pieza ya puesta: mismo fantasma que al construir, sin coste, validando sin contarse a sí misma.
  startMove(id) { const p = this.game.home.grid.pieces[id]; if (!p) return; this.selPiece = null; this.moveMode = false; this.build = { type: p.type, rot: p.rot, i: null, j: null, ok: false, moving: id }; this.view.setBuildMode(true); this.emit(); }
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
    if (b.moving != null) {
      if (!move(this.game.home.grid, b.moving, b.i, b.j, b.rot)) { this.sfx('hurt', 1.6); return false; }
      const f = footprint(b.type, b.rot); this.view.burst('build', b.i + f.w / 2, b.j + f.h / 2); this.sfx('build'); this.shake(0.06);
      this.persist(); this.cancelBuild(); return true;
    }
    if (!build(this.game.home, b.type, b.i, b.j, b.rot, true)) { this.sfx('hurt', 1.6); return false; }
    this.sfx('build');
    this.achieve('build');
    {
      const f = footprint(b.type, b.rot), bd = BUILDINGS[b.type], w = this.view.toWorld(b.i + f.w / 2, b.j + f.h / 2);
      this.view.burst('build', b.i + f.w / 2, b.j + f.h / 2); this.shake(0.1);
      const gain = bd.beds ? `+${bd.beds} ${t('home.beds', 'camas')}` : bd.calm ? `+${t('home.calm', 'calma')}` : bd.produces ? `${t('home.makes', 'da')} ${RESOURCES[bd.produces.res].name}` : bd.name;
      this.floatText(gain, w.x, w.z, 'gain', 1.2);
    }
    this.persist();
    this.hoverBuild(b.i + Math.floor((footprint(b.type, b.rot).w - 1) / 2), b.j + Math.floor((footprint(b.type, b.rot).h - 1) / 2));
    return true;
  }
  tapHome(cell) {
    const home = this.game.home;
    // Primero lo vivo: una muda para recoger o un isópodo al que tocar (bolita o huida).
    const leaf = (home.leaves ?? []).find((l) => Math.hypot(l.x - cell.x, l.y - cell.y) < 0.7);
    if (leaf && takeLeaf(home, leaf.id)) {
      const w = this.view.toWorld(leaf.x, leaf.y);
      this.sfx('pickup'); this.view.burst('pickup', leaf.x, leaf.y);
      this.floatText(`+1 ${RESOURCES.hojarasca.name}`, w.x, w.z, 'gain');
      this.persist(); this.emit();
      return { res: 'hojarasca', n: 1 };
    }
    const molt = (home.molts ?? []).find((m) => Math.hypot(m.x - cell.x, m.y - cell.y) < 0.7);
    if (molt && takeMolt(home, molt.id)) {
      this.achieve('molt');
      const w = this.view.toWorld(molt.x, molt.y);
      this.sfx('pickup'); this.view.burst('pickup', molt.x, molt.y);
      this.floatText(`+1 ${RESOURCES.cal.name}`, w.x, w.z, 'gain');
      this.persist(); this.emit();
      return { res: 'cal', n: 1 };
    }
    const iso = home.isopods.find((i) => Math.hypot(i.x - cell.x, i.y - cell.y) < 0.6);
    // Primer toque: lo selecciona (la cámara lo sigue y sale su ficha); tocarlo otra vez lo asusta.
    if (iso && this.selIso !== iso.id) { this.selectIso(iso.id); return { selected: iso.id }; }
    if (iso) {
      const what = poke(home, iso, cell), w = this.view.toWorld(iso.x, iso.y);
      this.sfx(what === 'ball' ? 'roll' : 'click');
      if (what === 'ball') this.achieve('ball');
      this.floatText(what === 'ball' ? t('home.ball', '¡Bolita!') : what === 'molting' ? t('home.molting', 'Mudando…') : t('home.run', '¡Corre!'), w.x, w.z, 'note', 1.2);
      this.emit();
      return { poked: iso.id };
    }
    if (this.selIso != null) { this.selectIso(null); return null; } // tocar el suelo suelta al seleccionado
    if (this.moveMode) { const at = home.grid.cells[Math.floor(cell.y) * home.grid.w + Math.floor(cell.x)]; if (at != null) this.startMove(at); return at != null ? { moving: at } : null; }
    const piece = Object.values(home.grid.pieces).find((p) => {
      const f = footprint(p.type, p.rot);
      return home.stock[p.id]?.ready && cell.x >= p.x - 0.5 && cell.x <= p.x + f.w + 0.5 && cell.y >= p.y - 0.8 && cell.y <= p.y + f.h + 0.5;
    });
    if (!piece) {
      // Tocar una pieza sin nada listo la selecciona: su ficha deja mejorarla o guardarla.
      const at = home.grid.cells[Math.floor(cell.y) * home.grid.w + Math.floor(cell.x)];
      if (at) this.sfx('click');
      this.selectPiece(at);
      return at ? { piece: at } : null;
    }
    return this.collectPiece(piece);
  }
  // Tapa: cerrada → rejilla → abierta → cerrada. La humedad se mueve despacio hacia lo que pide.
  lid(k) {
    const home = this.game.home, n = setLid(home, k ?? ((home.lid ?? 1) + 1) % 3);
    this.sfx(n === 2 ? 'open' : 'close'); this.persist(); this.emit();
  }
  mist() {
    const home = this.game.home;
    if (!mist(home)) { this.sfx('hurt', 1.6); return false; }
    this.sfx('heal', 1.3); this.achieve('mist');
    const c = home.grid.w / 2;
    for (let k = 0; k < 5; k++) this.view.burst('heal', c - 3 + Math.random() * 6, c - 3 + Math.random() * 6);
    this.floatText(t('home.misted', '+ humedad'), 0, 0, 'gain', 1.6);
    this.persist(); this.emit();
    return true;
  }
  collectPiece(piece) {
    const home = this.game.home;
    const n = collect(home, piece.id);
    const f = footprint(piece.type, piece.rot);
    this.view.burst('pickup', piece.x + f.w / 2, piece.y + f.h / 2);
    this.sfx('pickup');
    const w = this.view.toWorld(piece.x + f.w / 2, piece.y + f.h / 2);
    this.floatText(`+${n} ${RESOURCES[BUILDINGS[piece.type].produces.res].name}`, w.x, w.z, 'gain');
    this.persist(); this.emit();
    return { res: BUILDINGS[piece.type].produces.res, n };
  }
  selectIso(id) {
    this.selIso = id ?? null; this.selPiece = null;
    if (this.view) this.view.selIso = this.selIso;
    this.stage.zoomK = 1; if (id != null) this.stage.zoom(0.62);
    else this.stage.frame(this.view.camera.target, this.view.camera.distance, this.view.camera.fit);
    this.sfx('click'); this.emit();
  }
  // Consejos de primera vez (src/data/tips.js): uno cada vez, 5 s en pantalla; se guardan para no repetirlos.
  tips() {
    if (this.settings.tips === false || (this.tip && this.time - this.tip.at < 6)) return;
    const seen = (this.meta.tips ??= []);
    for (const [id, tp] of Object.entries(TIPS)) {
      if (seen.includes(id)) continue;
      let hit = false; try { hit = tp.when(this); } catch {}
      if (!hit) continue;
      seen.push(id); saveMeta(this.meta);
      this.tip = { id, at: this.time, icon: tp.icon, text: tp.text }; this.sfx('open', 1.4); this.emit();
      return;
    }
  }
  // Fe y lealtad a la vista: cada evento sale como número sobre la colonia (como el +5 de fe de Cult of the Lamb).
  cultFx() {
    const home = this.game.home, log = home.faithLog ?? [], c = this.view.toWorld(home.grid.w / 2, home.grid.h / 2);
    for (const e of log.splice(0)) {
      if (Math.abs(e.delta) < 2) continue;
      this.floatText(`${e.delta > 0 ? '+' : '−'}${Math.abs(e.delta)} ${FAITH.events[e.key].name}`, c.x, c.z, e.delta > 0 ? 'gain' : 'ally', 2.4);
      if (e.delta >= 10) this.sfx('heal', 1.1); else if (e.delta <= -10) this.sfx('hurt', 0.8);
    }
    for (const id of (home.levelUps ?? []).splice(0)) {
      const iso = home.isopods.find((i) => i.id === id); if (!iso) continue;
      const w = this.view.toWorld(iso.x, iso.y);
      this.view.burst('heal', iso.x, iso.y); this.sfx('win');
      this.floatText(`${iso.name} · ${t('loyal.level', 'nivel')} ${iso.lv} · +1 ${t('res.ambar', 'ámbar')}`, w.x, w.z, 'gain', 1.6);
    }
    for (const a of (home.autoGot ?? []).splice(0)) { const p = home.grid.pieces[a.id]; if (!p) continue; const w = this.view.toWorld(p.x + 1, p.y + 0.5); this.floatText(`+${a.n} ${RESOURCES[a.res]?.name ?? a.res}`, w.x, w.z, 'gain', 1.4); }
    for (const id of (home.builtNow ?? []).splice(0)) { const p = home.grid.pieces[id]; if (!p) continue; this.view.burst('pickup', p.x + 1, p.y + 1); this.sfx('build', 1.1); }
    if (home.sermonDone) { home.sermonDone = false; this.persist(); }
  }
  bless(id) {
    const home = this.game.home, iso = home.isopods.find((i) => i.id === id);
    if (!iso || !bless(home, iso, this.game.day)) { this.sfx('hurt', 1.6); return false; }
    iso.loved = 1.2; iso.wait = 1.3; this.view.burst('mimo', iso.x, iso.y); { const w = this.view.toWorld(iso.x, iso.y); this.floatText('♥', w.x, w.z, 'love', 1.4); } this.sfx('heal', 1.4); this.persist(); this.emit(); return true;
  }
  // Vistas internas: el refugio (al tocarlo) y la cámara del altar (al reunir). Se entra y se sale con la cortinilla.
  enterInterior(kind, pieceId) {
    const p = this.game.home.grid.pieces[pieceId];
    if (!p) return;
    this.selPiece = null; this.selIso = null;
    this.interior = { kind, pieceId, at: this.time };
    this.nexo('dentro', kind === 'altar' ? t('inside.altar', 'Cámara del altar') : BUILDINGS[p.type].name);
    this.sfx('open');
    this.setMode('interior', new InteriorView(this.stage, this.game.home, kind, pieceId), kind === 'altar' ? 0.35 : 0.15);
  }
  exitInterior() { this.interior = null; this.nexo('dentro', null); this.goHome(); }
  // Tocar una pieza: los refugios se abren por dentro; el resto enseña su ficha.
  selectPiece(id) {
    const p = id != null && this.game.home.grid.pieces[id];
    if (p && !p.site && BUILDINGS[p.type].beds && !this.build) return this.enterInterior('cama', id);
    this.selPiece = id ?? null; this.emit();
  }
  // Templo: abre la ficha del altar (sermón y rituales); sin altar, lleva a construirlo.
  openTemple() {
    const tp = temple(this.game.home);
    if (tp) { this.selIso = null; this.selPiece = tp.id; this.sfx('open'); this.view.focusPiece = tp.id; }
    else { this.wantPanel = 'build'; this.floatText(t('temple.need', 'Construye un Altar de musgo'), 0, 0, 'note', 1.5); }
    this.emit();
  }
  ritual(id) {
    if (!ritual(this.game.home, id, this.game.day)) { this.sfx('hurt', 1.6); return false; }
    this.selPiece = null;
    this.sfx('boss', 1.2); this.persist(); this.enterInterior('altar', temple(this.game.home).id); this.nexo('ritual', RITUALS[id].name, t('temple.gather', 'La colonia se reúne en el altar')); return true;
  }
  sermon() {
    const home = this.game.home;
    if (!sermon(home, this.game.day, hasUpgrade(this.game, 'coro') ? 2 : 1)) { this.sfx('hurt', 1.6); return false; }
    this.selPiece = null;
    this.selectIso(null); this.sfx('boss', 1.6); this.enterInterior('altar', temple(home).id); this.nexo('ritual', t('temple.sermon', 'Sermón'), t('temple.gather', 'La colonia se reúne en el altar')); return true;
  }
  // Quitar una asignación (trabajo o cama propia) desde cualquiera de las dos fichas.
  unassign(id, what) { const iso = this.game.home.isopods.find((i) => i.id === id); if (!iso) return; if (what === 'trabajar') iso.job = null; else iso.home = null; this.sfx('click'); this.persist(); this.emit(); }
  orderIso(id, what, pieceId) {
    const home = this.game.home, iso = home.isopods.find((i) => i.id === id);
    if (!iso) return false;
    const ok = what === 'tocar' ? !!poke(home, iso, { x: iso.x - 0.5, y: iso.y }) : orderIso(home, iso, what, pieceId);
    if (ok && pieceId != null) this.persist();
    const w = this.view.toWorld(iso.x, iso.y);
    if (ok) { this.sfx(what === 'tocar' ? 'roll' : 'click'); this.floatText({ comer: t('order.comer', '¡A comer!'), dormir: t('order.dormir', '¡A dormir!'), tocar: t('home.ball', '¡Bolita!'), trabajar: iso.job != null ? t('order.job', '¡A trabajar!') : t('order.unjob', 'Descansa'), humedad: t('order.wet', '¡A la humedad!') }[what], w.x, w.z, 'note', 1); }
    else this.sfx('hurt', 1.6);
    this.emit();
    return ok;
  }
  renameIso(id, name) { const iso = this.game.home.isopods.find((i) => i.id === id); const ok = iso && renameIso(this.game.home, iso, name); if (ok) this.persist(); this.emit(); return ok; }
  learnSkill(id, skill) {
    const home = this.game.home, iso = home.isopods.find((i) => i.id === id);
    if (!iso || !learnSkill(home, iso, skill)) { this.sfx('hurt', 1.6); return false; }
    const w = this.view.toWorld(iso.x, iso.y);
    this.sfx('heal'); this.view.burst('heal', iso.x, iso.y); this.shake(0.08);
    this.floatText(t('colony.molted', '¡Muda!'), w.x, w.z, 'gain', 1.2);
    this.persist(); this.emit(); return true;
  }
  badgeIso(id, k) { const iso = this.game.home.isopods.find((i) => i.id === id); if (iso) { badgeIso(this.game.home, iso, k); this.persist(); this.sfx('click'); } this.emit(); }
  upgradePiece(id) {
    const home = this.game.home, p = home.grid.pieces[id];
    if (!upgradePiece(home, id)) { this.sfx('hurt', 1.6); return false; }
    const f = footprint(p.type, p.rot), w = this.view.toWorld(p.x + f.w / 2, p.y + f.h / 2);
    this.sfx('heal'); this.view.burst('heal', p.x + f.w / 2, p.y + f.h / 2); this.shake(0.12);
    this.achieve('upgrade'); if (p.level >= 3) this.achieve('maxed');
    this.floatText(`${BUILDINGS[p.type].name} · ${t('home.level', 'nivel')} ${p.level}`, w.x, w.z, 'gain', 1.4);
    this.persist(); this.emit();
    return true;
  }
  storePiece(id) {
    const home = this.game.home, p = home.grid.pieces[id];
    if (!p) return false;
    const f = footprint(p.type, p.rot);
    if (!storePiece(home, id)) { this.sfx('hurt', 1.6); return false; }
    this.view.burst('build', p.x + f.w / 2, p.y + f.h / 2); this.sfx('close');
    this.selPiece = null; this.persist(); this.emit();
    return true;
  }
  upgradeLayer(id) { const ok = upgradeLayer(this.game.home, id); if (ok) this.persist(); this.emit(); return ok; }
  expandHome() { const ok = expand(this.game.home); if (ok) { this.persist(); this.achieve('expand'); this.sfx('build'); this.shake(0.2); } this.emit(); return ok; }

  // ——— Recolección ———
  startGather(island, isoId) {
    const iso = this.game.home.isopods.find((x) => x.id === isoId);
    this.gather = newGather(island);
    this.gather.shell = iso.shell; this.gather.outfit = iso.outfit ?? null; this.gather.paint = iso.badge ?? null;
    const view = new GatherView(this.stage, this.gather);
    view.onPick = (n) => {
      const w = view.toWorld(n.x, n.y);
      this.sfx(n.lost ? 'heal' : 'pickup', 0.9 + Math.random() * 0.25);
      if (n.lost) this.achieve('rescue'); else if (n.res === 'ambar' && n.h >= 2) this.achieve('top');
      this.floatText(n.lost ? t('gather.found', '¡Encontrado!') : `+1 ${RESOURCES[n.res].name}`, w.x, w.z, 'gain', 1);
    };
    this.setMode('gather', view, WEATHER_MOOD[island.weather], island.weather);
  }
  endGather() {
    const g = this.gather, loot = gatherLoot(g);
    if (!g.falls && Object.keys(g.got).length) this.achieve('nofall');
    for (const [r, n] of Object.entries(loot)) this.game.home.resources[r] = (this.game.home.resources[r] ?? 0) + n;
    if (g.rescued) recruit(this.game.home, this.rng);
    visit(this.game, g.island.id);
    this.result = { kind: 'gather', loot, rescued: g.rescued ? 1 : 0, outcome: 'done' };
    this.persist();
    this.sfx('win');
    this.setMode('result', null, 0);
  }

  // ——— Expedición ———
  // Mercader (cada tres días) y mejoras permanentes (src/game/economy.js).
  trade(k) { if (trade(this.game, k, this.rng)) { this.sfx('pickup'); this.persist(); this.emit(); } else this.sfx('hurt', 1.6); }
  buyOutfit(id) { if (buyOutfit(this.game, id)) { this.sfx('win'); this.persist(); this.emit(); return true; } this.sfx('hurt', 1.6); return false; }
  wearOutfit(isoId, id) { const iso = this.game.home.isopods.find((i) => i.id === isoId); if (iso && wearOutfit(this.game, iso, id)) { this.sfx('build', 1.2); if (iso.outfit) { iso.loved = 1.2; this.view?.burst?.('mimo', iso.x, iso.y); } this.persist(); this.emit(); } }
  buyUpgrade(id) { if (buyUpgrade(this.game, id)) { this.sfx('win'); this.persist(); this.emit(); } else this.sfx('hurt', 1.6); }
  setRobe(id) { this.game.robe = id; this.sfx('click'); this.persist(); this.emit(); }
  buyRobe(id) {
    const r = ROBES[id], home = this.game.home;
    if (!r?.cost || !pay(home, r.cost)) { this.sfx('hurt', 1.6); return false; }
    (this.game.robes ??= []).push(id); this.game.robe = id; this.sfx('win'); this.persist(); this.emit(); return true;
  }
  pickWeapon(k) { if (pickWeapon(this.run, k)) { this.sfx('build', 0.8); this.persist(); this.emit(); } }
  swapWeapon() { if (swapWeapon(this.run)) { this.sfx('build', 0.8); this.emit(); } }
  acceptPact() { if (acceptPact(this.run)) { this.sfx('boss', 1.4); this.shake(0.3); this.emit(); } }
  startRun(island, partyIds) {
    this.run = newRun(this.game.home, island, partyIds, this.game.heat ?? 0, { robe: this.game.robe, upgrades: this.game.upgrades ?? [] });
    visit(this.game, island.id);
    this.persist();
    this.nexo('nido', island.name, t('nexo.nest', 'Bajáis al nido'));
    this.setMode('dungeon', null, 0.75, this.run.island.weather);
  }
  enter(nodeId) {
    if (!enterNode(this.run, nodeId)) return;
    this.afterRoom();
  }
  buy(k) { if (buy(this.run, k)) { this.sfx('pickup'); this.emit(); } else this.sfx('hurt', 1.6); }
  // Puerta del piso: otra sala (pelea, botín, carta o reliquia).
  enterRoom(id) {
    if (!enterRoom(this.run, id)) return;
    const room = this.run.floor?.rooms[id];
    if (room && !room.main && room.visits !== true) { room.visits = true; this.achieve('side', 3); }
    if (this.run.last?.type === 'reliquia' && this.run.last.card) this.achieve('relic');
    this.sfx('open');
    if (this.run.state !== 'combat') this.nexo('sala', null);
    this.afterRoom();
  }
  afterRoom() {
    if (this.run.state === 'combat') {
      for (const k of this.run.encounter.enemies) this.meta.seen[k] = true;
      saveMeta(this.meta);
      const setup = combatSetup(this.run), diff = DIFFICULTIES[this.settings.difficulty ?? 'normal'];
      this.combo = null; this.cleared = null; this.exits = null; this.hurtAt = null; this.slowmo = 0;
      this.combat = createCombat({ ...setup, enemyHpMul: (setup.enemyHpMul ?? 1) * diff.hp, mods: { ...setup.mods, enemyDamageMul: diff.dmg * (setup.heatDmg ?? 1) } });
      this.tactical = false;
      const bossRoom = this.run.node.type === 'jefe' && this.run.room?.final;
      this.sfx(bossRoom ? 'boss' : 'open');
      this.nexo('combate', bossRoom ? t('nexo.boss', '¡Jefe!') : t('nexo.fight', '¡Pelea!'), t('nexo.foes', '{n} aberraciones').replace('{n}', this.combat.actors.filter((a) => a.side === 'enemy').length));
      const bossFoe = bossRoom && this.combat.actors.find((a) => a.side === 'enemy');
      this.setMode('combat', new CombatView(this.stage, this.combat, this.run.encounter.seed, this.run.island.weather, this.run.island.vessel === 'diorama' ? 'diorama' : 'frasco'), 1, this.run.island.weather);
      if (bossFoe) this.stage.pixfx.spawn('boss', bossFoe.x, 0.05, bossFoe.y);
    } else this.emit();
  }
  chooseCard(id) { pickCard(this.run, id); this.sfx('heal'); this.emit(); }
  retreat() { runRetreat(this.run); this.settle(); }
  settle() {
    const out = settleRun(this.game.home, this.run, this.rng);
    addFaith(this.game.home, out.outcome === 'lost' ? 'derrota' : 'expedicion');
    if (out.outcome === 'won') { this.game.heat = Math.min(HEAT.max, (this.game.heat ?? 0) + 1); out.heatUp = this.game.heat; }
    this.sfx(out.outcome === 'lost' ? 'lose' : 'win');
    this.result = { kind: 'run', ...out };
    this.run = null;
    this.persist();
    this.setMode('result', null, 0);
  }
  // door: sala siguiente elegida desde la victoria (como las puertas de Cult of the Lamb), sin pasar por el mapa.
  endCombat(door) {
    finishCombat(this.run, this.combat);
    this.combat = null;
    if (this.run.state === 'won' || this.run.state === 'lost') return this.settle();
    this.setMode('dungeon', null, 0.75, this.run.island.weather);
    if (door != null && this.run.state === 'floor') this.enterRoom(door);
  }
  // Salidas de la sala ganada (como las puertas de Cult of the Lamb): un arco en el borde de la arena por cada
  // sala vecina sin hacer, en su dirección del mapa. Se sale caminando hasta él.
  roamExits(dt, input) {
    const c = this.combat;
    if (c.result !== 'win' || !this.cleared || this.time - this.cleared < 1) return;
    if (!this.exits) {
      const f = this.run.floor, here = f?.rooms[f.at];
      this.exits = here && !here.final ? here.links.map((id) => f.rooms[id]).filter((r) => !r.done).map((r) => {
        const a = Math.atan2(r.y - here.y, r.x - here.x);
        return { id: r.id, type: r.type, final: !!r.final, x: Math.cos(a) * (ARENA_R - 0.6), y: Math.sin(a) * (ARENA_R - 0.6) };
      }) : [];
      this.view.showExits(this.exits);
      this.emit();
    }
    if (!this.exits.length) return;
    roam(c, dt, input.move);
    const a = c.actors.find((x) => x.id === c.main);
    const hit = a && this.exits.find((e) => Math.hypot(a.x - e.x, a.y - e.y) < 0.9);
    if (hit) { this.sfx('open'); this.endCombat(hit.id); }
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
    if (this.game && (this.mode === 'home' || this.mode === 'islands' || this.mode === 'gather' || this.mode === 'interior')) {
      const before = this.phase, day = this.game.day;
      tickClock(this.game, dt);
      if (this.phase !== before) this.syncMusic();
      if (this.game.day !== day && this.dayWipe?.day !== this.game.day) this.dayWipe = { at: this.time, day: this.game.day }; // amanecer sin dormir
      if (this.game.day !== day && this.mode === 'islands') this.goArchipelago(); // amaneció: islas nuevas
    }
    this.stage.setTime(this.clock);
    this.view?.setNight?.(this.phase === 'noche');
    if (input.turn) this.stage.rotate(input.turn * dt * 1.6);
    // Giro lento del diorama en el terrario (se quita en el panel de cámara): se para mientras tocás, con algo
    // seleccionado o construyendo, y vuelve a los 4 s.
    if (this.mode === 'home' && this.settings.autoSpin !== false && !this.settings.reduceMotion && this.selIso == null && !this.build && !this.paused && this.time - (this.touched ?? -9) > 4) this.stage.rotate(dt * 0.07);
    input.move = toWorld(input.move, this.stage.yaw);
    if (this.mode === 'menu') tickHome(this.menuHome, dt, this.rng);
    else if (this.mode === 'interior') { // la vida sigue fuera; al acabar la ceremonia se vuelve solo
      const home = this.game.home; tickHome(home, dt, this.rng, DAY_PHASES[this.phase]);
      if (this.interior?.kind === 'altar' && !home.sermon && this.time - this.interior.at > 2.5) this.exitInterior();
    }
    else if (this.mode === 'home') { this.view.selPieceNow = this.selPiece; this.trackColony(); tickHome(this.game.home, dt, this.rng, DAY_PHASES[this.phase]); this.cultFx(); this.view.merchant = merchantToday(this.game); this.saveTimer = (this.saveTimer ?? 0) + dt; if (this.saveTimer > 15) { this.saveTimer = 0; this.persist(); } }
    else if (this.mode === 'gather' && !this.gather.done) {
      const g = this.gather, falls = g.falls, air = g.player.air, chained = g.chained ?? 0;
      tickGather(g, dt, input.move, input.roll, input.held?.roll);
      if ((g.chained ?? 0) > chained) { this.sfx('pickup', 1 + g.chain.n * 0.08); this.floatText(`×${g.chain.n} +0,4 s`, g.player.x - g.side / 2, g.player.y - g.side / 2, 'gain', 1.2); }
      if (!air && g.player.air && g.player.vz > 0) this.sfx('roll', 1.3);
      if (air && !g.player.air) { this.sfx('build', 1.6); this.view.burst('dust', g.player.x, g.player.y); }
      if (g.falls > falls) { this.sfx('hurt'); this.shake(0.45); this.hurtAt = this.time; this.floatText(t('gather.fell', '¡Al vacío! −4 s'), g.player.x - g.side / 2, g.player.y - g.side / 2, 'fall', 1); }
      if (g.done) this.emit();
    }
    else if (this.mode === 'combat') this.tickCombat(dt, input);
    this.view?.update(this.time, dt);
    if (this.fx.length) this.fx = this.fx.filter((f) => this.time - f.at < 0.9);
    this.stage.render(this.time, dt);
    this.view?.markers?.place();
    if ((this.tipT = (this.tipT ?? 0) + dt) > 1) { this.tipT = 0; this.tips(); }
    this.hudTimer = (this.hudTimer ?? 0) + dt;
    if (this.toastAch && this.time - this.toastAch.at < 3.4) this.hudTimer += 0.1; // que el cartel se vaya a tiempo
    if (this.hudTimer > 0.08 && (this.toastAch || this.mode === 'combat' || this.mode === 'gather' || this.mode === 'home' || this.mode === 'islands' || this.mode === 'interior')) { this.hudTimer = 0; this.emit(); }
    requestAnimationFrame((t) => this.frame(t));
  }

  tickCombat(dt, input) {
    const c = this.combat;
    if (c.result) return this.roamExits(dt, input);
    if (input.tactical) this.setTactical(!this.tactical);
    for (const [k, n] of [['p1', 0], ['p2', 1], ['p3', 2]]) if (input[k]) { const a = allies(c)[n]; if (a) switchMain(c, a.id); }
    if (this.hitstop > 0) { this.hitstop -= dt; return; }
    // Cámara lenta al matar (más larga con la última): el golpe final se saborea, como en Cult of the Lamb.
    if (this.slowmo > 0) { this.slowmo -= dt; dt *= 0.3; }
    // Golpe fuerte: mantener atacar carga (anillo del botón) y soltar lo lanza.
    if (!this.tactical) {
      if (input.held?.attack) this.charge = (this.chargeT = (this.chargeT ?? 0) + dt) / HEAVY.charge;
      else { if ((this.chargeT ?? 0) >= HEAVY.charge) input.heavy = true; this.chargeT = 0; this.charge = 0; }
      if (this.view) this.view.charge = Math.min(1, this.charge);
    }
    const from = c.events.length;
    step(c, dt * (this.tactical ? TACTICAL_SPEED[this.settings.tactical ?? 'pausa'] : 1), this.tactical ? {} : input);
    for (const ev of c.events.slice(from)) {
      if (ev.type === 'heavy') { this.sfx('heavy'); this.shake(0.35); this.hitstop = Math.max(this.hitstop, 0.07); this.view.burst('heavy', ev.id); continue; }
      if (ev.type === 'heavyStart') { this.sfx('swing', 0.7); continue; }
      if (ev.type === 'hit') {
        this.view.hit(ev.id);
        const a = c.actors.find((x) => x.id === ev.id);
        this.view.burst(a.side === 'ally' ? 'hurt' : ev.amount >= 20 ? 'heavy' : 'hit', ev.id);
        this.sfx(a.side === 'ally' ? 'hurt' : ev.amount >= 20 ? 'heavy' : 'hit', 0.9 + Math.random() * 0.2);
        this.fx.push({ id: Math.random(), x: a.x, z: a.y, text: ev.amount, kind: a.side, at: this.time, big: ev.staggered });
        if (a.side === 'enemy') { this.combo = { n: this.combo && this.time - this.combo.at < 1.4 ? this.combo.n + 1 : 1, at: this.time }; if (this.combo.n >= 10) this.achieve('combo10'); }
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
          this.meta.beaten[foe.kind] = (this.meta.beaten[foe.kind] ?? 0) + 1; saveMeta(this.meta);
          const role = ABERRATIONS[foe.kind].role;
          if (role === 'elite') this.achieve('elite'); else if (role === 'jefe') this.achieve('boss');
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
