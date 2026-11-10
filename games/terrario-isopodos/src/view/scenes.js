// Las tres escenas del mundo: terrario, isla de recolección y arena. Solo dibujan el estado que les
// pasan; las reglas viven en src/game.
import * as THREE from 'three';
import { islandFromGrid, arena, glass } from './island.js';
import { propMesh, ghostMesh } from './props.js';
import { ActorLayer } from './actors.js';
import { BUILDINGS } from '../data/buildings.js';
import { ABERRATIONS } from '../data/aberrations.js';
import { PALETTES } from '../data/palettes.js';
import { ARENA_R } from '../game/combat.js';
import { footprint, canPlace } from '../game/grid.js';

const bob = (t, seed) => Math.abs(Math.sin(t * 9 + seed)) * 0.06;

class GridScene {
  constructor(stage, grid, seed, rim = 0) {
    this.stage = stage;
    this.grid = grid;
    this.rim = rim;
    this.group = new THREE.Group();
    this.seed = seed;
    this.rebuild();
    this.actors = new ActorLayer(this.group);
  }

  rebuild() {
    if (this.island) this.group.remove(this.island.group);
    this.island = islandFromGrid(this.grid, { seed: this.seed, rim: this.rim });
    if (this.rim) this.island.group.add(glass(this.grid));
    this.group.add(this.island.group);
    this.openCount = this.grid.open.reduce((s, v) => s + v, 0);
  }

  toWorld(x, y) { return { x: x - this.grid.w / 2, z: y - this.grid.h / 2 }; }

  cellAt(ev) {
    const p = this.stage.pick(ev);
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
      m.position.set(w.x, 0, w.z);
      m.userData.key = key(p);
      this.group.add(m);
      this.props.set(String(p.id), m);
    }
  }
}
const key = (p) => `${p.type}:${p.x}:${p.y}:${p.rot}`;

export class HomeView extends GridScene {
  constructor(stage, home) {
    super(stage, home.grid, 17, 1);
    this.home = home;
  }

  get camera() { const side = Math.sqrt(this.openCount); return { target: [0, 0.5], distance: side * 1.45 + 5, fit: side + 1.5 }; }

  setBuildMode(on) { this.island.gridLines.visible = on; if (!on) this.setGhost(null); }

  setGhost(g) { // g: { type, i, j, rot } o null
    if (this.ghost) this.group.remove(this.ghost);
    this.ghost = null;
    if (!g) return null;
    const ok = canPlace(this.grid, g.type, g.i, g.j, g.rot);
    const f = footprint(g.type, g.rot), w = this.toWorld(g.i + f.w / 2, g.j + f.h / 2);
    this.ghost = ghostMesh(g.type, g.rot, ok);
    this.ghost.position.set(w.x, 0.02, w.z);
    this.group.add(this.ghost);
    return ok;
  }

  update(time) {
    if (this.grid.open.reduce((s, v) => s + v, 0) !== this.openCount) { this.rebuild(); this.stage.frame(this.camera.target, this.camera.distance, this.camera.fit); }
    this.syncProps();
    const list = this.home.isopods.map((iso) => {
      const w = this.toWorld(iso.x, iso.y), moving = Math.hypot(iso.vx, iso.vy) > 0.05;
      return { id: `i${iso.id}`, sprite: `iso:${iso.shell}`, ...w, height: 0.8, flip: iso.vx < 0, lift: moving ? bob(time, iso.id) : 0 };
    });
    for (const p of Object.values(this.grid.pieces)) {
      const s = this.home.stock[p.id];
      if (!s?.ready) continue;
      const f = footprint(p.type, p.rot), w = this.toWorld(p.x + f.w / 2, p.y + f.h / 2);
      list.push({ id: `r${p.id}`, sprite: `res:${BUILDINGS[p.type].produces.res}`, ...w, height: 0.6, lift: 1.1 + Math.sin(time * 3 + p.id) * 0.08 });
    }
    this.actors.sync(list, time);
  }
}

export class GatherView extends GridScene {
  constructor(stage, gather) {
    super(stage, gather.grid, gather.island.seed);
    this.g = gather;
    this.syncProps();
  }

  get camera() { return { target: [0, 0.4], distance: 20, fit: 12.5 }; }

  update(time) {
    const p = this.g.player, moving = Math.hypot(p.vx, p.vy) > 0.05;
    const list = [{ id: 'player', sprite: `iso:${this.g.shell ?? 'naranja'}`, ...this.toWorld(p.x, p.y), height: 0.9, flip: p.vx < 0, lift: moving ? bob(time, 1) : 0 }];
    for (const n of this.g.nodes) if (!n.taken) list.push({ id: `n${n.id}`, sprite: `res:${n.res}`, ...this.toWorld(n.x, n.y), height: 0.55, lift: 0.15 + Math.sin(time * 2.5 + n.id) * 0.06 });
    const l = this.g.lost;
    if (l && !l.taken) list.push({ id: 'lost', sprite: 'iso:leche', ...this.toWorld(l.x, l.y), height: 0.6, flash: 0.5 + Math.sin(time * 4) * 0.3 });
    this.actors.sync(list, time);
  }
}

export class CombatView {
  constructor(stage, combat, seed) {
    this.stage = stage;
    this.c = combat;
    this.group = new THREE.Group();
    this.group.add(arena(ARENA_R, seed));
    this.actors = new ActorLayer(this.group);
    this.tele = new Map();
    this.flash = new Map();
  }

  get camera() { return { target: [0, 0.6], distance: 18, fit: ARENA_R * 2 + 0.5 }; }

  hit(id) { this.flash.set(id, 1); }

  update(time, dt) {
    const list = [];
    for (const a of this.c.actors) {
      if (a.side === 'enemy' && a.hp <= 0) continue;
      const f = Math.max(0, (this.flash.get(a.id) ?? 0) - dt * 5);
      this.flash.set(a.id, f);
      if (a.side === 'ally') {
        const down = a.hp <= 0, moving = Math.hypot(a.vx, a.vy) > 0.1;
        list.push({ id: a.id, sprite: `iso:${a.shell}`, x: a.x, z: a.y, height: a.state === 'roll' ? 0.7 : 1.05, flip: Math.cos(a.facing) < 0,
          lift: moving && !down ? bob(time, a.id) : 0, alpha: down ? 0.35 : a.invuln > 0 ? 0.6 : 1, flash: f });
      } else {
        const def = ABERRATIONS[a.kind], wind = a.state === 'windup';
        const sway = a.staggered > 0 ? Math.sin(time * 20) * 0.08 : wind ? Math.sin(time * 30) * 0.05 : 0;
        list.push({ id: a.id, sprite: def.sprite, x: a.x + sway, z: a.y, height: def.height * (wind ? 0.94 : 1), flip: Math.cos(a.facing) < 0,
          flash: Math.max(f, a.staggered > 0 ? 0.35 : 0) });
      }
    }
    this.actors.sync(list, time);
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
