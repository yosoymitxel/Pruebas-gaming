// Las tres escenas del mundo: terrario, isla de recolección y arena. Solo dibujan el estado que les
// pasan; las reglas viven en src/game.
import * as THREE from 'three';
import { islandFromGrid, arena } from './island.js';
import { tank, jar, jarShine, globe, floatingRock, substrateDisc, CHARCOAL } from './vessel.js';
import { mulberry32 } from '../core/rng.js';
import { propMesh, ghostMesh } from './props.js';
import { ActorLayer } from './actors.js';
import { Vfx, Weather } from './vfx.js';
import { pickupMesh, animatePickup } from './pickups.js';
import { DEFAULT_YAW } from './stage.js';
import { BUILDINGS } from '../data/buildings.js';
import { ABERRATIONS } from '../data/aberrations.js';
import { PALETTES } from '../data/palettes.js';
import { ARENA_R } from '../game/combat.js';
import { footprint, canPlace } from '../game/grid.js';

const bob = (t, seed) => Math.abs(Math.sin(t * 9 + seed)) * 0.06;

class GridScene {
  constructor(stage, grid, seed, { rim = 0, relief = 0.3, vessel = 'tanque', weather = 'claro' } = {}) {
    this.stage = stage;
    this.weatherKind = weather;
    this.vessel = vessel;
    this.grid = grid;
    this.rim = rim;
    this.relief = relief;
    this.group = new THREE.Group();
    this.seed = seed;
    this.rebuild();
    this.actors = new ActorLayer(this.group);
    this.vfx = new Vfx(this.group);
  }

  burst(kind, x, y) { const w = this.toWorld(x, y); this.vfx.burst(kind, w.x, w.y + 0.3, w.z); }

  tick(dt) {
    this.vfx.update(dt);
    this.weather?.update(dt);
  }

  rebuild() {
    if (this.island) this.group.remove(this.island.group);
    this.island = islandFromGrid(this.grid, { seed: this.seed, rim: this.rim, relief: this.relief });
    this.shine = dress(this.island.group, this.vessel, this.island, this.grid, this.seed);
    this.group.add(this.island.group);
    this.openCount = this.grid.open.reduce((s, v) => s + v, 0);
    if (this.weather) this.group.remove(this.weather.mesh);
    this.weather = new Weather(this.island.group, this.weatherKind, this.island.span * 0.85, 2.2);
  }

  toWorld(x, y) { return { x: x - this.grid.w / 2, z: y - this.grid.h / 2, y: this.island.heightAt(x, y) }; }

  // Altura donde apoya una pieza: la cima más alta de su huella.
  floorOf(x, y, f) {
    let h = 0;
    for (let j = y; j < y + f.h; j++) for (let i = x; i < x + f.w; i++) h = Math.max(h, this.island.heightAt(i, j));
    return h;
  }

  cellAt(ev) {
    const first = this.stage.pick(ev);
    const p = first && this.stage.pick(ev, this.island.heightAt(first.x + this.grid.w / 2, first.z + this.grid.h / 2));
    return p && { i: Math.floor(p.x + this.grid.w / 2), j: Math.floor(p.z + this.grid.h / 2), x: p.x + this.grid.w / 2, y: p.z + this.grid.h / 2 };
  }

  syncProps() {
    this.props ??= new Map();
    const pieces = this.grid.pieces;
    for (const [id, m] of this.props) if (!pieces[id] || m.userData.key !== key(pieces[id])) { this.group.remove(m); this.props.delete(id); }
    for (const p of Object.values(pieces)) {
      if (this.props.has(String(p.id))) continue;
      const m = propMesh(p.type, p.rot);
      const f = footprint(p.type, p.rot), w = this.toWorld(p.x + f.w / 2, p.y + f.h / 2);
      m.position.set(w.x, this.floorOf(p.x, p.y, f), w.z);
      m.userData.key = key(p);
      this.group.add(m);
      this.props.set(String(p.id), m);
    }
  }
}
// Viste el paisaje con su recipiente (ver VESSELS en src/data/world.js). Devuelve los reflejos que
// deben girar con la cámara, si los hay.
export function dress(group, kind, island, grid, seed) {
  const r = island.span + 0.3;
  if (kind === 'tanque') {
    const xs = island.cells.map((c) => c.i), zs = island.cells.map((c) => c.j), ox = grid.w / 2, oz = grid.h / 2;
    group.add(tank(Math.min(...xs) - ox, Math.min(...zs) - oz, Math.max(...xs) + 1 - ox, Math.max(...zs) + 1 - oz, 2.2));
    return null;
  }
  if (kind === 'diorama') { group.add(floatingRock(r * 0.95, r * 1.1, mulberry32(seed))); return null; }
  const ground = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.3, 64), new THREE.MeshLambertMaterial({ color: PALETTES.cozy.soil }));
  ground.position.y = CHARCOAL[1] + 0.15;
  ground.receiveShadow = true;
  group.add(substrateDisc(r), ground);
  if (kind === 'globo') { group.add(globe(r + 0.4)); return null; }
  group.add(jar(r, 2.4));
  const shine = jarShine(r, 2.4);
  group.add(shine);
  return shine;
}

function stainTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  for (let k = 0; k < 9; k++) {
    const a = Math.random() * Math.PI * 2, d = k ? 20 + Math.random() * 34 : 0, r = k ? 4 + Math.random() * 9 : 30;
    g.beginPath(); g.arc(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, r, 0, Math.PI * 2); g.fill();
  }
  return new THREE.CanvasTexture(c);
}

const key = (p) => `${p.type}:${p.x}:${p.y}:${p.rot}`;

export class HomeView extends GridScene {
  constructor(stage, home) {
    super(stage, home.grid, 17, { rim: 1, relief: 0, weather: home.weather });
    this.home = home;
  }

  get camera() { const side = Math.sqrt(this.openCount); return { target: [0, 0.5], distance: (side + 2) * 1.6 + 6, fit: (side + 2) * 1.45 }; }

  setBuildMode(on) { this.island.gridLines.visible = on; if (!on) this.setGhost(null); }

  setGhost(g) { // g: { type, i, j, rot } o null
    if (this.ghost) this.group.remove(this.ghost);
    this.ghost = null;
    if (!g) return null;
    const ok = canPlace(this.grid, g.type, g.i, g.j, g.rot);
    const f = footprint(g.type, g.rot), w = this.toWorld(g.i + f.w / 2, g.j + f.h / 2);
    this.ghost = ghostMesh(g.type, g.rot, ok);
    this.ghost.position.set(w.x, this.floorOf(g.i, g.j, f) + 0.02, w.z);
    this.group.add(this.ghost);
    return ok;
  }

  update(time, dt) {
    this.tick(dt);
    if (this.grid.open.reduce((s, v) => s + v, 0) !== this.openCount) { this.rebuild(); this.stage.frame(this.camera.target, this.camera.distance, this.camera.fit); }
    this.syncProps();
    const list = this.home.isopods.map((iso) => {
      const w = this.toWorld(iso.x, iso.y), moving = Math.hypot(iso.vx, iso.vy) > 0.05;
      return { id: `i${iso.id}`, sprite: `iso:${iso.shell}`, ...w, height: 0.8, flip: iso.vx < 0, lift: moving ? bob(time, iso.id) : 0, squash: 1 + Math.sin(time * 3 + iso.id) * 0.03 };
    });
    // Bocadillos de necesidad sobre la cabeza (como los seguidores de Cult of the Lamb): hambre.
    for (const iso of this.home.isopods) {
      if (iso.hunger >= 0.35) continue;
      const w = this.toWorld(iso.x, iso.y);
      list.push({ id: `b${iso.id}`, sprite: 'res:hojarasca', ...w, height: 0.42, lift: 0.95 + Math.sin(time * 4 + iso.id) * 0.06 });
    }
    for (const p of Object.values(this.grid.pieces)) {
      const s = this.home.stock[p.id];
      if (!s?.ready) continue;
      const f = footprint(p.type, p.rot), w = this.toWorld(p.x + f.w / 2, p.y + f.h / 2);
      list.push({ id: `r${p.id}`, sprite: `res:${BUILDINGS[p.type].produces.res}`, ...w, y: this.floorOf(p.x, p.y, f), height: 0.6, lift: 1.1 + Math.sin(time * 3 + p.id) * 0.08 });
    }
    this.actors.sync([...list, ...(this.extra?.(time) ?? [])], this.stage.yaw);
  }
}

// Menú: el terrario del jugador (o uno de muestra) con la colonia viva y una aberración asomada al vidrio.
// La cámara se desplaza para dejar sitio a la columna del menú (a la derecha en horizontal, abajo en vertical).
export class MenuView extends HomeView {
  get camera() {
    const c = super.camera, side = Math.sqrt(this.openCount) + 2, wide = this.stage.camera.aspect > 1;
    const [dx, dz] = wide ? [Math.cos(DEFAULT_YAW), -Math.sin(DEFAULT_YAW)] : [Math.sin(DEFAULT_YAW), Math.cos(DEFAULT_YAW)];
    const k = wide ? side * 0.55 : side * 0.45;
    return { ...c, target: [dx * k, dz * k], distance: c.distance * (wide ? 1.12 : 0.8) };
  }

  extra(time) {
    const side = Math.sqrt(this.openCount) / 2 + 1.6;
    return [{ id: 'lurker', sprite: 'el-bufon.webp', x: -side * 0.6 + Math.sin(time * 0.3) * 0.4, z: -side - 0.8, y: -0.4, height: 4.2 }];
  }
}

export class GatherView extends GridScene {
  constructor(stage, gather) {
    super(stage, gather.grid, gather.island.seed, { relief: 0.6, vessel: gather.island.vessel ?? 'frasco', weather: gather.island.weather });
    this.g = gather;
    this.syncProps();
    this.pickups = gather.nodes.map((n) => {
      const m = pickupMesh(n.res), w = this.toWorld(n.x, n.y);
      m.position.set(w.x, w.y, w.z);
      this.group.add(m);
      return m;
    });
  }

  // Cerca y siguiendo al explorador: la isla puede salirse de la pantalla.
  get camera() { const p = this.toWorld(this.g.player.x, this.g.player.y); return { target: [p.x, p.z], distance: 13, fit: 9 }; }

  update(time, dt) {
    this.tick(dt);
    if (this.shine) this.shine.rotation.y = this.stage.yaw;
    const p = this.g.player, moving = Math.hypot(p.vx, p.vy) > 0.05, pw = this.toWorld(p.x, p.y);
    this.stage.follow(pw.x, pw.z, dt);
    this.g.nodes.forEach((n, k) => {
      const m = this.pickups[k];
      if (n.taken && m.visible) { m.visible = false; this.burst('pickup', n.x, n.y); this.onPick?.(n); }
      if (m.visible) animatePickup(m, time, k);
    });
    const list = [{ id: 'player', sprite: `iso:${this.g.shell ?? 'naranja'}`, ...pw, height: 0.9, flip: p.vx < 0, lift: moving ? bob(time, 1) : 0 }];
    const l = this.g.lost;
    if (l?.taken && !l.shown) { l.shown = true; this.burst('heal', l.x, l.y); this.onPick?.({ lost: true, x: l.x, y: l.y }); }
    if (l && !l.taken) {
      const w = this.toWorld(l.x, l.y);
      list.push({ id: 'lost', sprite: 'iso:leche', ...w, height: 0.75, lift: Math.abs(Math.sin(time * 5)) * 0.1 });
      list.push({ id: 'lost-alert', sprite: 'proc:alert', ...w, height: 0.55, lift: 1 + Math.sin(time * 3) * 0.1 });
    }
    this.actors.sync(list, this.stage.yaw);
  }
}

export class CombatView {
  constructor(stage, combat, seed, weather = 'niebla', vessel = 'frasco') {
    this.stage = stage;
    this.c = combat;
    this.group = new THREE.Group();
    this.group.add(arena(ARENA_R, seed));
    if (vessel === 'diorama') this.group.add(floatingRock(ARENA_R + 2, ARENA_R * 1.1, mulberry32(seed)));
    else { this.group.add(jar(ARENA_R + 2.3, 1.8)); this.shine = jarShine(ARENA_R + 2.3, 1.8); this.group.add(this.shine); }
    this.actors = new ActorLayer(this.group);
    this.vfx = new Vfx(this.group);
    this.weather = new Weather(this.group, weather, ARENA_R + 1.5, 3);
    this.tele = new Map();
    this.rolling = new Set();
    this.swung = new Set();
    this.slashes = [];
    this.ghosts = [];
    this.stains = [];
    this.flash = new Map();
  }

  get camera() { return { target: [0, 0.6], distance: 15, fit: 10 }; }

  hit(id) { this.flash.set(id, 1); }

  // Tajo: arco de tinta delante del isópodo que golpea (el combo 3 lo hace más grande).
  slash(a) {
    const big = a.combo === 2, arc = big ? 2.4 : 1.6;
    const geo = new THREE.RingGeometry(0.55, big ? 1.35 : 1.05, 18, 1, -arc / 2, arc).rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: PALETTES.cozy.ink, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }));
    mesh.position.set(a.x, 0.45, a.y);
    mesh.rotation.y = -a.facing;
    this.group.add(mesh);
    this.slashes.push({ mesh, t: 0 });
  }

  // Mancha de tinta que queda en el suelo (muertes y golpes fuertes), como la sangre que se queda en Cult of the Lamb.
  stain(x, z, size) {
    const tex = (this.stainTex ??= stainTexture());
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex, color: PALETTES.terror.ink, transparent: true, opacity: 0.75, depthWrite: false }));
    m.position.set(x, 0.015 + this.stains.length * 0.0005, z);
    m.rotation.y = Math.random() * 6;
    this.group.add(m);
    this.stains.push(m);
    if (this.stains.length > 40) this.group.remove(this.stains.shift());
  }

  burst(kind, id) {
    const a = this.c.actors.find((x) => x.id === id);
    if (a && (kind === 'death' || kind === 'heavy')) this.stain(a.x, a.y, kind === 'death' ? 1.6 + (a.r ?? 0.4) * 2 : 0.8);
    if (a) this.vfx.burst(kind, a.x, a.side === 'enemy' ? ABERRATIONS[a.kind].height * 0.4 : 0.4, a.y);
  }

  update(time, dt) {
    if (this.shine) this.shine.rotation.y = this.stage.yaw;
    const main = this.c.actors.find((a) => a.id === this.c.main);
    if (main) this.stage.follow(main.x * 0.55, main.y * 0.55 + 0.6, dt, 3);
    this.vfx.update(dt);
    this.weather.update(dt);
    for (const a of this.c.actors) {
      if (a.state === 'roll' && !this.rolling.has(a.id)) { this.rolling.add(a.id); this.vfx.burst('dust', a.x, 0.1, a.y); }
      else if (a.state !== 'roll') this.rolling.delete(a.id);
      const swing = a.side === 'ally' && a.state === 'attack' && a.phase === 'recover';
      if (swing && !this.swung.has(a.id)) { this.swung.add(a.id); this.slash(a); }
      else if (!swing) this.swung.delete(a.id);
    }
    this.slashes = this.slashes.filter((sl) => {
      sl.t += dt;
      sl.mesh.material.opacity = Math.max(0, 0.85 - sl.t * 4.5);
      sl.mesh.scale.setScalar(1 + sl.t * 1.5);
      if (sl.t > 0.2) { this.group.remove(sl.mesh); return false; }
      return true;
    });
    const list = [];
    for (const a of this.c.actors) {
      if (a.side === 'enemy' && a.hp <= 0) continue;
      const f = Math.max(0, (this.flash.get(a.id) ?? 0) - dt * 5);
      this.flash.set(a.id, f);
      const breathe = 1 + Math.sin(time * 3 + a.id) * 0.025; // respiración en reposo
      if (a.side === 'ally') {
        const down = a.hp <= 0, moving = Math.hypot(a.vx, a.vy) > 0.1;
        const lunge = a.state === 'attack' ? (a.phase === 'recover' ? 0.28 : -0.08) : 0;
        const squash = a.state === 'attack' && a.phase === 'windup' ? 0.86 : a.state === 'roll' ? 0.7 : breathe * (1 - f * 0.18);
        list.push({ id: a.id, sprite: `iso:${a.shell}`, x: a.x + Math.cos(a.facing) * lunge, z: a.y + Math.sin(a.facing) * lunge, height: 1.05, squash, flip: Math.cos(a.facing) < 0,
          lift: moving && !down ? bob(time, a.id) : 0, alpha: down ? 0.35 : a.invuln > 0 ? 0.6 : 1, flash: f });
        if (a.state === 'roll' && (this.ghostT = (this.ghostT ?? 0) - dt) <= 0) { // estela del rodar
          this.ghostT = 0.04;
          this.ghosts.push({ id: `g${this.ghostN = (this.ghostN ?? 0) + 1}`, sprite: `iso:${a.shell}`, x: a.x, z: a.y, height: 1.05, squash: 0.7, flip: Math.cos(a.facing) < 0, t: 0 });
        }
      } else {
        const def = ABERRATIONS[a.kind], wind = a.state === 'windup';
        const sway = a.staggered > 0 ? Math.sin(time * 20) * 0.08 : wind ? Math.sin(time * 30) * 0.05 : 0;
        const squash = wind ? 0.9 + Math.sin(time * 30) * 0.02 : a.state === 'recover' ? 1.06 : breathe * (1 - f * 0.12);
        list.push({ id: a.id, sprite: def.sprite, x: a.x + sway, z: a.y, height: def.height, squash, flip: Math.cos(a.facing) < 0,
          flash: Math.max(f, a.staggered > 0 ? 0.35 : 0) });
      }
    }
    this.ghosts = this.ghosts.filter((g) => (g.t += dt) < 0.25);
    for (const g of this.ghosts) list.push({ ...g, alpha: 0.45 * (1 - g.t / 0.25) });
    this.actors.sync(list, this.stage.yaw);
    this.telegraphs();
  }

  telegraphs() {
    const live = new Set();
    for (const e of this.c.actors) {
      if (e.side !== 'enemy' || e.hp <= 0 || e.state !== 'windup' || !e.attack || e.attack.kind === 'summon') continue;
      const k = `${e.id}`;
      live.add(k);
      let t = this.tele.get(k);
      if (!t || t.attack !== e.attack) {
        if (t) this.group.remove(t.mesh);
        t = { attack: e.attack, mesh: teleMesh(e) };
        this.tele.set(k, t);
        this.group.add(t.mesh);
      }
      t.mesh.position.set(e.x, 0.03, e.y);
      const prog = 1 - e.timer / e.attack.windup;
      t.mesh.children[1].scale.setScalar(Math.max(0.01, prog));
    }
    for (const [k, t] of this.tele) if (!live.has(k)) { this.group.remove(t.mesh); this.tele.delete(k); }
  }
}

function teleMesh(e) {
  const at = e.attack, reach = (at.range ?? 2) + e.r;
  const g = new THREE.Group();
  const outer = new THREE.MeshBasicMaterial({ color: PALETTES.terror.rust, transparent: true, opacity: 0.22, depthWrite: false });
  const inner = new THREE.MeshBasicMaterial({ color: PALETTES.terror.rust, transparent: true, opacity: 0.45, depthWrite: false });
  let geo;
  if (at.kind === 'charge' || at.kind === 'grab') geo = new THREE.PlaneGeometry(reach, e.r * 2).translate(reach / 2, 0, 0).rotateX(-Math.PI / 2);
  else if (at.kind === 'stomp') geo = new THREE.CircleGeometry(reach, 32).rotateX(-Math.PI / 2);
  else geo = new THREE.CircleGeometry(reach, 24, -at.arc / 2, at.arc).rotateX(-Math.PI / 2);
  g.add(new THREE.Mesh(geo, outer), new THREE.Mesh(geo, inner));
  g.rotation.y = -e.aim;
  return g;
}
