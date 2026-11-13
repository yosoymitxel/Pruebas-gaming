// Las tres escenas del mundo: terrario, isla de recolección y arena. Solo dibujan el estado que les
// pasan; las reglas viven en src/game.
import * as THREE from 'three';
import { islandFromGrid, arena, arenaFeatures } from './island.js';
import { sway } from './flora.js';
import { climate } from '../game/home.js';
import { spriteTexture, resourceIconURL } from './sprites.js';
import { Markers } from './markers.js';
import { RESOURCES } from '../data/resources.js';
import { speciesOf } from '../data/species.js';
import { tank, jar, jarShine, globe, floatingRock, substrateDisc, CHARCOAL } from './vessel.js';
import { mulberry32 } from '../core/rng.js';
import { propMesh, ghostMesh } from './props.js';
import { ActorLayer } from './actors.js';
import { Vfx, Weather } from './vfx.js';
import { pickupMesh, animatePickup } from './pickups.js';
import { iconURL } from '../ui/icons.js';
import { DEFAULT_YAW } from './stage.js';
import { BUILDINGS } from '../data/buildings.js';
import { ABERRATIONS } from '../data/aberrations.js';
import { PALETTES, BADGES } from '../data/palettes.js';
import { ARENA_R, weaponOf } from '../game/combat.js';
import { footprint, canPlace } from '../game/grid.js';

const bob = (t, seed) => Math.abs(Math.sin(t * 9 + seed)) * 0.06;

class GridScene {
  constructor(stage, grid, seed, { rim = 0, relief = 0.3, vessel = 'tanque', weather = 'claro', levels = null } = {}) {
    this.levels = levels;
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

  burst(kind, x, y) { const w = this.toWorld(x, y); this.vfx.burst(kind, w.x, w.y + 0.3, w.z); this.stage.pixfx.spawn(kind, w.x, w.y + 0.3, w.z); }

  tick(dt) {
    this.vfx.update(dt);
    if (!this.still) sway.value += dt;
    if (this.fx !== false) this.weather?.update(dt);
    if (this.fireflies?.mesh.visible) this.fireflies.update(dt);
  }

  // Noche: luciérnagas sobre el diorama. `fx` false (ajuste «efectos extra») oculta el clima.
  setNight(on) { if (this.fireflies) this.fireflies.mesh.visible = on && this.fx !== false; }
  setFx(on) { this.fx = on; if (this.weather) this.weather.mesh.visible = on; }

  rebuild() {
    if (this.island) this.group.remove(this.island.group);
    this.island = islandFromGrid(this.grid, { seed: this.seed, rim: this.rim, relief: this.relief, levels: this.levels });
    this.shine = dress(this.island.group, this.vessel, this.island, this.grid, this.seed);
    this.group.add(this.island.group);
    this.openCount = this.grid.open.reduce((s, v) => s + v, 0);
    if (this.weather) this.group.remove(this.weather.mesh);
    this.weather = new Weather(this.island.group, this.weatherKind, this.island.span * 0.85, 2.2);
    this.fireflies = new Weather(this.island.group, 'claro', this.island.span * 0.8, 1.4);
    this.fireflies.mesh.material.size = 0.16;
    this.fireflies.mesh.visible = false;
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
      const m = propMesh(p.type, p.rot, p.level ?? 1);
      const f = footprint(p.type, p.rot), w = this.toWorld(p.x + f.w / 2, p.y + f.h / 2);
      m.position.set(w.x, this.floorOf(p.x, p.y, f), w.z);
      m.userData.key = key(p);
      // Lo recién puesto (o mejorado) entra con un rebote; lo que ya estaba al abrir la escena, no.
      m.userData.base = m.scale.x;
      if (this.propsReady) { m.userData.pop = 0; m.scale.setScalar(0.01); }
      this.group.add(m);
      this.props.set(String(p.id), m);
    }
    this.propsReady = true;
  }

  // Rebote de entrada (easeOutBack) de las piezas nuevas.
  animateProps(dt) {
    for (const m of this.props?.values() ?? []) {
      if (m.userData.pop === undefined || m.userData.pop >= 1) continue;
      const t = (m.userData.pop = Math.min(1, m.userData.pop + dt / 0.45)), c = 2.2;
      m.scale.setScalar(m.userData.base * (1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2));
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

const key = (p) => `${p.type}:${p.x}:${p.y}:${p.rot}:${p.level ?? 1}`;

export class HomeView extends GridScene {
  constructor(stage, home) {
    super(stage, home.grid, 17, { rim: 1, relief: 0, weather: home.weather });
    this.home = home;
    this.care = new THREE.Group();
    this.group.add(this.care);
  }

  // El clima interior se ve en el diorama: grietas si está seco, gotas en el vidrio si está húmedo y manchas
  // de moho que crecen; en ideal, apenas rocío. Se rehace solo cuando cambia.
  showClimate() {
    const kind = climate(this.home);
    if (kind === this.climateKind && this.openCount === this.careOpen) return;
    this.climateKind = kind; this.careOpen = this.openCount;
    this.care.clear();
    const rng = mulberry32(31), g = this.grid, open = [];
    for (let j = 0; j < g.h; j++) for (let i = 0; i < g.w; i++) if (g.open[j * g.w + i]) open.push([i, j]);
    const decal = (sprite, n, size) => {
      const mat = new THREE.MeshBasicMaterial({ map: spriteTexture(sprite), transparent: true, depthWrite: false });
      for (let k = 0; k < n && open.length; k++) {
        const [i, j] = open[Math.floor(rng() * open.length)], w = this.toWorld(i + rng(), j + rng());
        const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2), mat);
        m.position.set(w.x, w.y + 0.03 + k * 0.001, w.z); m.rotation.y = rng() * 6;
        this.care.add(m);
      }
    };
    if (kind === 'seco') decal('proc:crack', 9, 1.6);
    if (kind === 'moho') decal('proc:mold', 10, 1.5);
    if (kind === 'humedo') decal('proc:mold', 2, 0.9);
    // condensación: gotas pegadas al vidrio delantero y a un lado
    const drops = { seco: 0, ideal: 14, humedo: 70, moho: 110 }[kind], half = Math.sqrt(this.openCount) / 2 + 1, pts = [];
    for (let k = 0; k < drops; k++) {
      const side = rng() < 0.6, a = (rng() * 2 - 1) * half, y = 0.1 + rng() * 1.6;
      pts.push(side ? a : half + 0.02, y, side ? half + 0.02 : a);
    }
    if (pts.length) {
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
      this.care.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, transparent: true, opacity: 0.75, depthWrite: false })));
    }
  }

  // En vertical el diorama puede sobresalir por los lados (más grande y legible en el teléfono).
  get camera() { const side = Math.sqrt(this.openCount), tall = this.stage.camera.aspect < 1; return { target: [0, 0.5], distance: (side + 2) * 1.6 + 6, fit: (side + 2) * (tall ? 1.0 : 1.45) }; }

  setBuildMode(on) { this.island.gridLines.visible = on; if (!on) this.setGhost(null); }
  dispose() { this.markers?.dispose(); this.markers = null; }

  setGhost(g) { // g: { type, i, j, rot } o null
    if (this.ghost) this.group.remove(this.ghost);
    this.ghost = null;
    if (!g) return null;
    const ok = canPlace(this.grid, g.type, g.i, g.j, g.rot, g.moving);
    const f = footprint(g.type, g.rot), w = this.toWorld(g.i + f.w / 2, g.j + f.h / 2);
    this.ghost = ghostMesh(g.type, g.rot, ok);
    this.ghost.position.set(w.x, this.floorOf(g.i, g.j, f) + 0.02, w.z);
    this.group.add(this.ghost);
    return ok;
  }

  // Manchas de moho: discos blanquecinos pegados al suelo donde brotó.
  syncMold() {
    this.moldMeshes ??= new Map();
    const want = new Set((this.home.mold ?? []).map((m) => m.id));
    for (const [id, mesh] of this.moldMeshes) if (!want.has(id)) { this.group.remove(mesh); this.moldMeshes.delete(id); }
    for (const m of this.home.mold ?? []) {
      if (this.moldMeshes.has(m.id)) continue;
      const w = this.toWorld(m.x, m.y), mesh = new THREE.Mesh(new THREE.CircleGeometry(0.32 + Math.random() * 0.15, 9).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xd9dcc4, transparent: true, opacity: 0.85 }));
      mesh.position.set(w.x, w.y + 0.03, w.z); this.group.add(mesh); this.moldMeshes.set(m.id, mesh);
    }
  }

  update(time, dt) {
    this.tick(dt);
    if (this.grid.open.reduce((s, v) => s + v, 0) !== this.openCount) { this.rebuild(); this.stage.frame(this.camera.target, this.camera.distance, this.camera.fit); }
    this.syncProps();
    this.animateProps(dt);
    // Obras: la pieza crece desde el suelo según avanza, temblando un poco mientras le dan.
    for (const p of Object.values(this.grid.pieces)) {
      const m = this.props?.get(String(p.id)); if (!m) continue;
      if (p.site) { const k = Math.min(1, p.site.t / p.site.need), b = m.userData.base ?? 1; m.scale.set(b * (0.7 + 0.3 * k), b * (0.12 + 0.88 * k), b * (0.7 + 0.3 * k)); m.rotation.z = Math.sin(time * 18) * 0.015; m.userData.wasSite = true; }
      else if (m.userData.wasSite) { m.userData.wasSite = false; m.rotation.z = 0; m.userData.pop = 0; m.scale.setScalar(0.01); }
    }
    if ((this.careT = (this.careT ?? 1) + dt) > 1) { this.careT = 0; this.showClimate(); }
    const list = this.home.isopods.map((iso) => {
      const bed = iso.rest > 0 && this.grid.pieces[iso.bed];
      if (bed) { // durmiendo dentro del refugio: metido en el centro (la pieza lo tapa), respirando hondo
        const f = footprint(bed.type, bed.rot), w = this.toWorld(bed.x + f.w / 2, bed.y + f.h / 2);
        return { id: `i${iso.id}`, sprite: `iso:${iso.shell}`, ...w, x: w.x + ((iso.id % 3) - 1) * 0.3, height: (iso.baby > 0 ? 0.42 : 0.8) * 0.9, squash: 0.85 + Math.sin(time * 1.3 + iso.id) * 0.05 };
      }
      const w = this.toWorld(iso.x, iso.y), moving = Math.hypot(iso.vx, iso.vy) > 0.05;
      const size = iso.baby > 0 ? 0.42 : 0.8;
      if (iso.rest > 0) return { id: `i${iso.id}`, sprite: `iso:${iso.shell}`, ...w, height: size, squash: 0.8 + Math.sin(time * 1.3 + iso.id) * 0.05 }; // ovillo en el suelo
      if (iso.order === 'reunir' && this.home.sermon) { const c = this.toWorld(this.home.sermon.x, this.home.sermon.y), hop = Math.abs(Math.sin(time * 5 + iso.id)) * 0.12; // en la reunión: botan mirando al centro
        return { id: `i${iso.id}`, sprite: `iso:${iso.shell}`, ...w, height: size, lift: moving ? bob(time, iso.id) : hop, face: Math.atan2(c.z - w.z, c.x - w.x), squash: 1 + hop * 0.6 }; }
      const site = iso.order === 'construir' && this.grid.pieces[iso.siteId];
      if (site && !moving) { const f = footprint(site.type, site.rot), c = this.toWorld(site.x + f.w / 2, site.y + f.h / 2), k = Math.abs(Math.sin(time * 9 + iso.id)); // martillea: salta y cae contra la obra
        return { id: `i${iso.id}`, sprite: `iso:${iso.shell}`, ...w, height: size, lift: k * 0.1, face: Math.atan2(c.z - w.z, c.x - w.x), squash: 1.08 - k * 0.16 }; }
      if (iso.ball > 0) return { id: `i${iso.id}`, sprite: `ball:${iso.shell}`, ...w, height: size * 0.62, squash: 1 + Math.sin(time * 9) * 0.04 };
      // Mimo: tres saltitos de alegría con estiramiento .
      if (iso.loved > 0) { const k = Math.abs(Math.sin((1.2 - iso.loved) * 8)); iso.loved -= dt; return { id: `i${iso.id}`, sprite: `iso:${iso.shell}`, ...w, height: size, lift: k * 0.35, squash: 1 + (k - 0.5) * 0.3 }; }
      return { id: `i${iso.id}`, sprite: `${iso.molting > 0 ? 'molt' : 'iso'}:${iso.shell}`, ...w, height: size, flip: iso.vx < 0, lift: moving ? bob(time, iso.id) : 0,
        squash: iso.molting > 0 ? 1 + Math.sin(time * 14) * 0.05 : 1 + Math.sin(time * 3 + iso.id) * 0.03 };
    });
    // Color elegido en la ficha: tiñe el caparazón (el modelo 3D) en vez de un banderín.
    this.home.isopods.forEach((iso, k) => { if (!list[k]) return; if (iso.badge != null) list[k].paint = BADGES[iso.badge]; if (iso.outfit) list[k].outfit = iso.outfit; });
    for (const l of this.home.leaves ?? []) { // la hoja cae meciéndose desde arriba y queda en el suelo
      l.t = Math.min(1, (l.t ?? 0) + dt / 2.2);
      const w = this.toWorld(l.x + Math.sin(l.t * 9) * 0.4 * (1 - l.t), l.y);
      if (l.t < 1) list.push({ id: l.id, sprite: 'res:hojarasca', ...w, height: 0.42, lift: (1 - l.t) * 3.2, spin: Math.sin(l.t * 7) * 0.6 * (1 - l.t) });
    }
    // Seleccionado: la cámara lo sigue y una flecha lo marca. Distintivo (banderín) y «zzz» del que duerme.
    for (const iso of this.home.isopods) {
      const w = this.toWorld(iso.x, iso.y), top = iso.baby > 0 ? 0.35 : 0.6;
      if (iso.id === this.selIso) { const k = this.stage.camDist * 0.2; this.stage.follow(w.x + Math.sin(this.stage.yaw) * k, w.z + Math.cos(this.stage.yaw) * k, dt, 5); // queda por encima de la ficha
        list.push({ id: `s${iso.id}`, sprite: 'proc:sel', ...w, height: 0.55, lift: top + Math.abs(Math.sin(time * 4)) * 0.12 }); }
      const bed = iso.rest > 0 && this.grid.pieces[iso.bed];
      if (iso.rest > 0 && !bed) { const u = (time * 0.4 + iso.id * 0.33) % 1; list.push({ id: `z${iso.id}`, sprite: 'proc:zzz', ...w, height: 0.24 + u * 0.1, lift: 0.5 + u * 0.6, alpha: 1 - u }); }
      if (bed) { const f = footprint(bed.type, bed.rot), b = this.toWorld(bed.x + f.w / 2, bed.y + f.h / 2), u = (time * 0.4 + iso.id * 0.33) % 1; // «zzz» que sube del refugio y se apaga
        list.push({ id: `z${iso.id}`, sprite: 'proc:zzz', ...b, x: b.x + Math.sin(u * 6) * 0.15, height: 0.3 + u * 0.15, lift: 1.4 + u * 0.9, alpha: 1 - u }); }
    }
    // Marcadores (interfaz, no sprites): hambre sobre la cabeza, recurso listo sobre la pieza, comedero vacío.
    const marks = [];
    // Hojas caídas y mudas en el suelo: ficha pequeña sin piquito, que se toca para recoger.
    // Mudas: quedan en el suelo hasta que se las comen (sin ficha: no ensucian la interfaz). Moho: manchas en el suelo.
    for (const m of this.home.molts ?? []) { const w = this.toWorld(m.x, m.y); list.push({ id: `m${m.id}`, sprite: 'proc:muda', ...w, height: 0.3, alpha: Math.max(0.3, 1 - (m.t ?? 0) / 40), flat: true }); }
    this.syncMold();
    for (const p of Object.values(this.grid.pieces)) if (p.site) { const f = footprint(p.type, p.rot), w = this.toWorld(p.x + f.w / 2, p.y + f.h / 2);
      marks.push({ id: `site${p.id}`, kind: 'site', icon: iconURL('build'), x: w.x, y: w.y + 1.4, z: w.z, piece: p.id, progress: Math.min(1, p.site.t / p.site.need) }); }
    // La cámara va al templo mientras su ficha está abierta o hay ceremonia.
    const fp = this.focusPiece != null && this.grid.pieces[this.focusPiece];
    if (fp && this.selIso == null) { const w = this.toWorld(fp.x + 1, fp.y + 1), k = this.stage.camDist * 0.2; this.stage.follow(w.x + Math.sin(this.stage.yaw) * k, w.z + Math.cos(this.stage.yaw) * k, dt, 4); }
    if (fp && !this.home.sermon && this.selPieceNow !== fp.id) this.focusPiece = null;
    // Sermón o ritual en curso: círculo de luz violeta que gira y se cierra en el centro del corro.
    if (this.home.sermon) {
      if (!this.halo) { this.halo = new THREE.Mesh(new THREE.RingGeometry(0.75, 1, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xb48cff, transparent: true, depthWrite: false })); this.group.add(this.halo); }
      const sm = this.home.sermon, w = this.toWorld(sm.x, sm.y), k = 1 - sm.t / (sm.total ?? 7);
      this.halo.position.set(w.x, w.y + 0.05, w.z); this.halo.scale.setScalar(2.2 - k * 1.4); this.halo.rotation.y = time; this.halo.material.opacity = 0.5 + Math.sin(time * 6) * 0.25;
      if ((this.haloT = (this.haloT ?? 0) - dt) <= 0) { this.haloT = 0.6; this.vfx.burst('mimo', w.x, w.y + 0.3, w.z); }
    } else if (this.halo) { this.group.remove(this.halo); this.halo = null; }
    // Mercader de visita (cada tres días): espera en la esquina del terrario.
    if (this.merchant) {
      const g = this.grid, w = this.toWorld(g.w - 1.2, g.h - 1.2); // dentro, en la esquina de delante
      if (!this.stall) { this.stall = merchantStall(); this.group.add(this.stall); }
      this.stall.position.set(w.x, w.y, w.z); this.stall.rotation.y = this.stage.yaw + 0.6;
      this.stall.children[0].position.y = 0.32 + Math.sin(time * 2) * 0.02; // el caracol respira
      marks.push({ id: 'merchant', kind: 'merchant', icon: iconURL('snail'), x: w.x, y: w.y + 1.9, z: w.z });
    } else if (this.stall) { this.group.remove(this.stall); this.stall = null; }
    // Peticiones: globito sobre la cabeza con lo que quiere (como los seguidores de Cult of the Lamb).
    for (const iso of this.home.isopods) {
      if (!iso.wish || iso.rest > 0) continue;
      const w = this.toWorld(iso.x, iso.y), ic = { pieza: 'build', humedad: 'items', comer: 'eat', mimo: 'heart' }[iso.wish.kind];
      marks.push({ id: `w${iso.id}`, kind: 'wish', icon: iconURL(ic), x: w.x, y: w.y + 0.9, z: w.z, iso: iso.id });
    }
    for (const iso of this.home.isopods) {
      if (iso.hunger >= 0.35 || iso.rest > 0 || iso.wish || iso.id === this.selIso) continue;
      const w = this.toWorld(iso.x, iso.y);
      marks.push({ id: `b${iso.id}`, kind: 'hunger', icon: resourceIconURL('hojarasca'), x: w.x, y: w.y + 0.75, z: w.z, iso: iso.id });
    }
    const ready = new Set();
    for (const p of Object.values(this.grid.pieces)) {
      const s = this.home.stock[p.id];
      if (!s?.ready) continue;
      const f = footprint(p.type, p.rot), w = this.toWorld(p.x + f.w / 2, p.y + f.h / 2);
      marks.push({ id: `r${p.id}`, kind: 'ready', icon: resourceIconURL(BUILDINGS[p.type].produces.res), x: w.x, y: this.floorOf(p.x, p.y, f) + 0.9, z: w.z, piece: p.id, label: RESOURCES[BUILDINGS[p.type].produces.res].name });
      ready.add(p.id);
      // Anillo en el suelo bajo la pieza: marca qué tocar para recoger (como los aros de la recolección).
      let ring = (this.rings ??= new Map()).get(p.id);
      if (!ring) { ring = new THREE.Mesh(new THREE.RingGeometry(0.86, 1, 40), new THREE.MeshBasicMaterial({ color: PALETTES.cozy.amber, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
        ring.rotation.x = -Math.PI / 2; this.group.add(ring); this.rings.set(p.id, ring); }
      const k = Math.max(f.w, f.h) * 0.62 * (1 + Math.sin(time * 4 + p.id) * 0.06);
      ring.scale.set(k, k, 1); ring.position.set(w.x, this.floorOf(p.x, p.y, f) + 0.04, w.z); ring.material.opacity = 0.55 + Math.sin(time * 4 + p.id) * 0.25;
    }
    // Comedero vacío (sin hojarasca). La mejora ya no flota: se ofrece al tocar la pieza.
    if (!this.extra) for (const p of Object.values(this.grid.pieces)) {
      const f = footprint(p.type, p.rot), w = this.toWorld(p.x + f.w / 2, p.y + f.h / 2);
      if (BUILDINGS[p.type].feeds && !(this.home.resources.hojarasca > 0)) marks.push({ id: `h${p.id}`, kind: 'empty', icon: resourceIconURL('hojarasca'), x: w.x, y: this.floorOf(p.x, p.y, f) + 0.75, z: w.z, piece: p.id });
    }
    if (!this.extra) (this.markers ??= new Markers(this.stage, (m) => this.onMarker?.(m))).sync(marks);
    for (const [id, ring] of this.rings ?? []) if (!ready.has(id)) { this.group.remove(ring); ring.geometry.dispose(); this.rings.delete(id); }
    this.actors.sync([...list, ...(this.extra?.(time) ?? [])], this.stage.yaw);
  }
}

// Menú: el terrario del jugador (o uno de muestra) con la colonia viva y una aberración asomada al vidrio.
// La cámara se desplaza para dejar sitio a la columna del menú (a la derecha en horizontal, abajo en vertical).
export class MenuView extends HomeView {
  get camera() {
    const c = super.camera, side = Math.sqrt(this.openCount) + 2, wide = this.stage.camera.aspect > 1;
    // En horizontal la lista va a la izquierda: el diorama se corre a la derecha. En vertical, centrado entre logo y lista.
    const [dx, dz] = [Math.cos(DEFAULT_YAW), -Math.sin(DEFAULT_YAW)], k = wide ? -side * 0.42 : 0;
    return { ...c, target: [dx * k, dz * k + (wide ? 0 : -side * 0.08)], distance: c.distance * (wide ? 1.3 : 0.95) };
  }

  extra(time) {
    const side = Math.sqrt(this.openCount) / 2 + 1.6;
    return [{ id: 'lurker', sprite: 'el-bufon.webp', x: -side * 0.6 + Math.sin(time * 0.3) * 0.4, z: -side - 0.8, y: -0.4, height: 4.2 }];
  }
}

export class GatherView extends GridScene {
  // Huecos de dentro de la isla (no el mar de alrededor): pozo negro que se hunde y borde ámbar discontinuo a ras
  // del suelo vecino, para que no se confundan con las sombras. Lo de fuera se queda como fondo.
  holes(g) {
    const idx = (i, j) => j * g.w + i, out = new Uint8Array(g.w * g.h), q = [];
    for (let i = 0; i < g.w; i++) for (const j of [0, g.h - 1]) q.push([i, j]);
    for (let j = 0; j < g.h; j++) for (const i of [0, g.w - 1]) q.push([i, j]);
    while (q.length) { const [i, j] = q.pop(); if (i < 0 || j < 0 || i >= g.w || j >= g.h || out[idx(i, j)] || g.open[idx(i, j)]) continue; out[idx(i, j)] = 1; q.push([i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]); }
    const shaft = new THREE.MeshBasicMaterial({ color: 0x020101 }), wall = new THREE.MeshBasicMaterial({ color: 0x0d0907, side: THREE.BackSide });
    const rim = new THREE.MeshBasicMaterial({ color: 0xe0a03a, transparent: true, opacity: 0.85, depthWrite: false });
    for (let j = 0; j < g.h; j++) for (let i = 0; i < g.w; i++) {
      if (g.open[idx(i, j)] || out[idx(i, j)]) continue;
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([di, dj]) => g.open[idx(i + di, j + dj)]).map(([di, dj]) => this.island.heightAt(i + di, j + dj));
      const top = nb.length ? Math.min(...nb) : 0, x = i - g.w / 2 + 0.5, z = j - g.h / 2 + 0.5;
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.98, 3, 0.98), wall); box.position.set(x, top - 1.5, z); this.group.add(box);
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(0.98, 0.98).rotateX(-Math.PI / 2), shaft); floor.position.set(x, top - 2.9, z); this.group.add(floor);
      // borde de aviso solo en los lados que dan a suelo: tiras ámbar a ras del borde
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (!g.open[idx(i + di, j + dj)]) continue;
        const h = this.island.heightAt(i + di, j + dj), strip = new THREE.Mesh(new THREE.PlaneGeometry(di ? 0.07 : 0.96, di ? 0.96 : 0.07).rotateX(-Math.PI / 2), rim);
        strip.position.set(x + di * 0.47, h + 0.025, z + dj * 0.47); this.group.add(strip);
      }
    }
  }
  constructor(stage, gather) {
    super(stage, gather.grid, gather.island.seed, { relief: 0.6, vessel: gather.island.vessel ?? 'frasco', weather: gather.island.weather, levels: gather.levels });
    this.g = gather;
    this.holes(gather.grid);
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
    // Salto con peso (sin bolita ni fantasmas): agacharse 0,06 s antes de despegar no cabe en un salto con
    // respuesta inmediata, así que el peso va en el aire y al caer: estirado al subir, aplanado al bajar,
    // inclinado hacia donde avanza, y un aplastón con polvo al tocar suelo. La sombra se queda en el suelo.
    const air = p.air || p.falling > 0, shell = this.g.shell ?? 'vulgare';
    if (air && !this.wasAir && p.vz > 0) this.burst('jump', p.x, p.y);
    if (!air && this.wasAir) this.landT = 0.16;
    this.wasAir = air;
    this.landT = Math.max(0, (this.landT ?? 0) - dt);
    const ground = Math.min(p.z, pw.y), up = Math.max(0, p.z - ground), land = this.landT / 0.16;
    const stretch = p.falling > 0 ? 0.5 : air ? 1 + Math.max(-0.18, Math.min(0.22, p.vz * 0.035)) : 1 - 0.32 * land * land;
    const lean = air ? Math.max(-0.3, Math.min(0.3, Math.hypot(p.vx, p.vy) * 0.06 * Math.sign(p.vz || 1))) * (p.vx < 0 ? 1 : -1) : 0;
    const list = [{ id: 'player', sprite: `iso:${shell}`, outfit: this.g.outfit, paint: this.g.paint != null ? BADGES[this.g.paint] : null, x: pw.x, z: pw.z, y: ground + 0.05, height: 0.9,
      flip: p.vx < 0, lift: up + (!air && moving ? bob(time, 1) : 0), spin: lean,
      squash: stretch, shadowK: Math.max(0.3, 1 - up * 0.4) }];
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

const ROOM_ICON3D = { pelea: 'combate', botin: 'botin', carta: 'carta', reliquia: 'relic', rescate: 'rescue', tienda: 'shop', fuente: 'spring', arma: 'attack', maldito: 'eye' };

// Mercader: un caracol viajero con su fardo de ámbar, de visita en una esquina del terrario.
function merchantStall() {
  const g = new THREE.Group(), L = (c) => new THREE.MeshLambertMaterial({ color: c });
  const body = new THREE.Group();
  const foot = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 1.1, 4, 10).rotateZ(Math.PI / 2), L(0xb9a68a));
  foot.scale.set(1, 0.55, 0.8); foot.position.y = -0.18;
  const shell = new THREE.Mesh(new THREE.TorusKnotGeometry(0.34, 0.2, 48, 8, 1, 3), L(0x8a4e2a));
  shell.position.set(-0.1, 0.25, 0); shell.scale.setScalar(0.9);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), L(0xb9a68a)); head.position.set(0.62, 0.05, 0);
  for (const z of [-0.08, 0.08]) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.4, 5), L(0xb9a68a)); st.position.set(0.7, 0.3, z); st.rotation.z = -0.3; const eye = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), L(0x1d1a16)); eye.position.set(0.76, 0.5, z); body.add(st, eye); }
  const pack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.42), L(0x6b5a3a)); pack.position.set(-0.15, 0.72, 0); pack.rotation.y = 0.4;
  const amber = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), new THREE.MeshLambertMaterial({ color: 0xf2a93b, emissive: 0x7a3b00 })); amber.position.set(-0.15, 0.98, 0);
  body.add(foot, shell, head, pack, amber);
  body.position.y = 0.32; body.traverse((m) => { m.castShadow = true; });
  g.add(body);
  for (let k = 0; k < 3; k++) { const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), new THREE.MeshLambertMaterial({ color: 0xf2a93b, emissive: 0x5a2b00 })); gem.position.set(0.3 + k * 0.22, 0.1, 0.55); g.add(gem); }
  g.scale.setScalar(1.3);
  return g;
}

export class CombatView {
  constructor(stage, combat, seed, weather = 'niebla', vessel = 'frasco') {
    this.stage = stage;
    this.c = combat;
    this.group = new THREE.Group();
    this.group.add(arena(ARENA_R, seed));
    this.features = arenaFeatures(combat.arena, seed);
    this.group.add(this.features);
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
    // Anillo bajo el isópodo que controlas, con una flecha hacia donde mira: siempre sabes quién eres.
    this.marker = new THREE.Group();
    const mm = new THREE.MeshBasicMaterial({ color: PALETTES.cozy.amber, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide });
    this.marker.add(new THREE.Mesh(new THREE.RingGeometry(0.5, 0.62, 28).rotateX(-Math.PI / 2), mm));
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 3).rotateZ(-Math.PI / 2).rotateX(-Math.PI / 2), mm);
    tip.position.x = 0.95; this.marker.add(tip);
    // Cuña de mirada: hacia dónde saldrá el golpe.
    this.marker.add(new THREE.Mesh(new THREE.CircleGeometry(1.5, 16, -0.45, 0.9).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: PALETTES.cozy.amber, transparent: true, opacity: 0.18, depthWrite: false })));
    this.marker.position.y = 0.04;
    this.group.add(this.marker);
  }

  get camera() { return { target: [0, 0.6], distance: 13, fit: 7.5 }; } // cerca, como Cult of the Lamb: la arena sobresale

  // Destello blanco del golpe (game-feel-prompts, Hit Combos 3): silueta blanca entera 0,1 s y se apaga hasta 0,18 s.
  hit(id) { this.flash.set(id, this.now ?? 0); }

  // Aro rojo bajo cada aberración viva (en el nido el pase de tinta apaga el color y se confundían con el
  // suelo): late despacio y se apaga al morir.
  enemyRings() {
    this.rings ??= new Map();
    const live = new Set();
    for (const e of this.c.actors) {
      if (e.side !== 'enemy' || e.hp <= 0) continue;
      live.add(e.id);
      let m = this.rings.get(e.id);
      if (!m) {
        m = new THREE.Mesh(new THREE.RingGeometry(0.7, 1, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xd0402f, transparent: true, opacity: 0.95, depthWrite: false }));
        this.group.add(m); this.rings.set(e.id, m);
      }
      const r = (ABERRATIONS[e.kind].radius ?? 0.4) + 0.25;
      m.scale.setScalar(r * (1 + Math.sin(this.now * 3 + e.id) * 0.04)); m.position.set(e.x, 0.035, e.y);
    }
    for (const [id, m] of this.rings) if (!live.has(id)) { this.group.remove(m); this.rings.delete(id); }
  }

  // Tajo según el arma (game-feel: cada arma se reconoce por su trazo) y color según la variante.
  // pinza: arco medio; mandíbula: arco ancho y grueso; aguijón: estocada fina y larga; garras: tres zarpazos;
  // maza: onda circular que se abre.
  slash(a) {
    const w = this.c.mods.weapon ?? { type: 'pinza', variant: 'comun' }, reach = weaponOf(this.c).reach;
    const last = a.combo === (weaponOf(this.c).combo.length - 1), k = last ? 1.3 : 1;
    const color = { venenosa: 0x6fd04a, vampirica: 0xc0203a, despiadada: 0xfff4dc, divina: 0xf2c14e }[w.variant] ?? PALETTES.cozy.ink;
    const mat = () => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide });
    const mesh = new THREE.Group(), flat = (geo) => mesh.add(new THREE.Mesh(geo.rotateX(-Math.PI / 2), mat()));
    if (w.type === 'aguijon') flat(new THREE.PlaneGeometry(reach * 1.2 * k, 0.12).translate(reach * 0.6 * k + 0.3, 0, 0));
    else if (w.type === 'garras') for (const o of [-0.22, 0, 0.22]) flat(new THREE.RingGeometry(0.5 + o * 0.3, 0.58 + o * 0.3, 12, 1, -0.5, 1).translate(o * 0.8, o * 0.6, 0).scale(k * 1.3, k * 1.3, 1));
    else if (w.type === 'maza') flat(new THREE.RingGeometry(reach * 0.75, reach, 32));
    else if (w.type === 'mandibula') flat(new THREE.RingGeometry(0.5, reach * k, 20, 1, -1.5 * k, 3 * k));
    else flat(new THREE.RingGeometry(0.55, reach * 0.85 * k, 18, 1, -0.8 * k, 1.6 * k));
    mesh.position.set(a.x, 0.45, a.y);
    mesh.rotation.y = -a.facing;
    this.group.add(mesh);
    this.slashes.push({ mesh, t: 0, grow: w.type === 'maza' ? 2.5 : w.type === 'aguijon' ? 0.4 : 1.5 });
    if (w.type === 'maza') { this.vfx.burst('dust', a.x, 0.1, a.y); this.stage.shake?.(0.25); }
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
    if (!a) return;
    const h = a.side === 'enemy' ? ABERRATIONS[a.kind].height * 0.4 : 0.4;
    this.vfx.burst(kind, a.x, h, a.y);
    this.stage.pixfx.spawn(kind, a.x, kind === 'spark' ? h * 2 : h, a.y);
  }

  update(time, dt) {
    if (!this.still) sway.value += dt;
    for (const d of this.features.userData.pools ?? []) d.material.opacity = 0.45 + Math.sin(time * 3) * 0.12; // la charca late
    if (this.shine) this.shine.rotation.y = this.stage.yaw;
    const main = this.c.actors.find((a) => a.id === this.c.main);
    if (main) { this.marker.position.x = main.x; this.marker.position.z = main.y; this.marker.rotation.y = -main.facing; this.marker.scale.setScalar(1 + (this.charge ?? 0) * 0.9 + (this.charge >= 1 ? Math.sin(time * 30) * 0.05 : 0)); }
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
      for (const m of sl.mesh.children) m.material.opacity = Math.max(0, 0.9 - sl.t * 4.5);
      sl.mesh.scale.setScalar(1 + sl.t * sl.grow);
      if (sl.t > 0.2) { this.group.remove(sl.mesh); return false; }
      return true;
    });
    const list = [];
    for (const a of this.c.actors) {
      if (a.side === 'enemy' && a.hp <= 0) continue;
      const age = (this.now = time) - (this.flash.get(a.id) ?? -9), f = age < 0.1 ? 1 : age < 0.18 ? 1 - (age - 0.1) / 0.08 : 0;
      const breathe = 1 + Math.sin(time * 3 + a.id) * 0.025; // respiración en reposo
      if (a.side === 'ally') {
        const down = a.hp <= 0, moving = Math.hypot(a.vx, a.vy) > 0.1;
        const lunge = a.state === 'attack' ? (a.phase === 'recover' ? 0.28 : -0.08) : 0;
        const squash = a.state === 'attack' && a.phase === 'windup' ? 0.86 : a.state === 'roll' ? 0.7 : breathe * (1 - f * 0.18);
        const balled = a.state === 'roll'; // al rodar siempre se ve la bolita girando: se entiende el esquive
        list.push({ id: a.id, sprite: `${balled ? 'ball' : 'iso'}:${a.shell}`, x: a.x + Math.cos(a.facing) * lunge, z: a.y + Math.sin(a.facing) * lunge, height: balled ? 0.7 : 1.05, squash: balled ? 1 : squash, flip: Math.cos(a.facing) < 0, face: a.facing, outfit: balled ? null : a.outfit, paint: a.paint != null ? BADGES[a.paint] : null,
          spin: balled ? -time * 18 * (Math.cos(a.facing) < 0 ? -1 : 1) : 0,
          lift: moving && !down ? bob(time, a.id) : 0, alpha: down ? 0.35 : a.invuln > 0 ? 0.6 : 1, flash: f });
        if (a.state === 'roll' && (this.ghostT = (this.ghostT ?? 0) - dt) <= 0) { // estela del rodar
          this.ghostT = 0.04;
          this.ghosts.push({ id: `g${this.ghostN = (this.ghostN ?? 0) + 1}`, sprite: `ball:${a.shell}`, x: a.x, z: a.y, height: 0.7, flip: Math.cos(a.facing) < 0, t: 0 });
        }
      } else {
        const def = ABERRATIONS[a.kind], wind = a.state === 'windup';
        const sway = a.staggered > 0 ? Math.sin(time * 20) * 0.08 : wind ? Math.sin(time * 30) * 0.05 : 0;
        const squash = wind ? 0.9 + Math.sin(time * 30) * 0.02 : a.state === 'recover' ? 1.06 : breathe * (1 - f * 0.12);
        list.push({ id: a.id, sprite: def.sprite, x: a.x + sway, z: a.y, height: def.height, squash, flip: Math.cos(a.facing) < 0, face: a.facing, tint: [0.16, 0.02, 0.02],
          flash: Math.max(f, a.staggered > 0 ? 0.35 : 0) });
      }
    }
    this.ghosts = this.ghosts.filter((g) => (g.t += dt) < 0.25);
    for (const g of this.ghosts) list.push({ ...g, alpha: 0.45 * (1 - g.t / 0.25) });
    this.actors.sync(list, this.stage.yaw);
    this.telegraphs();
    this.enemyRings();
    this.seeThrough(dt);
    for (const g of this.exitMeshes ?? []) { g.userData.glow.material.opacity = 0.4 + Math.sin(time * 4) * 0.15; g.children.at(-1).position.y = 1.55 + Math.sin(time * 3) * 0.08; }
  }

  // Puertas de salida: arco de piedra en el borde con luz en el suelo y el icono de la sala que espera detrás.
  showExits(exits) {
    for (const e of exits) {
      const g = new THREE.Group(), stone = new THREE.MeshLambertMaterial({ color: PALETTES.terror.stone });
      const arch = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.16, 6, 14, Math.PI), stone);
      arch.position.y = 0.4; arch.castShadow = true;
      for (const sx of [-0.75, 0.75]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.45, 0.3), stone); leg.position.set(sx, 0.22, 0); g.add(leg); }
      const glow = new THREE.Mesh(new THREE.CircleGeometry(0.9, 24).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: e.final ? 0xff3b1f : PALETTES.cozy.amber, transparent: true, opacity: 0.55, depthWrite: false }));
      glow.position.y = 0.03;
      const icon = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.TextureLoader().load(iconURL(ROOM_ICON3D[e.type] ?? 'combate', '#efe6d2')), depthTest: false }));
      icon.scale.setScalar(0.6); icon.position.y = 1.55; icon.renderOrder = 10;
      g.add(arch, glow, icon);
      g.position.set(e.x, 0, e.y);
      g.rotation.y = -Math.atan2(e.y, e.x) + Math.PI / 2;
      g.userData.glow = glow;
      this.group.add(g);
      (this.exitMeshes ??= []).push(g);
    }
  }

  // Raíces que tapan a alguien (camera-systems: deoccluder): se vuelven translúcidas mientras haya un aliado
  // o enemigo detrás, vistas desde la cámara.
  seeThrough(dt) {
    const cam = this.stage.camera.position;
    for (const p of this.features.userData.pillars ?? []) {
      const dx = cam.x - p.x, dz = cam.z - p.y, d = Math.hypot(dx, dz) || 1, ux = dx / d, uz = dz / d;
      const hidden = this.c.actors.some((a) => {
        if (a.hp <= 0) return false;
        const rx = a.x - p.x, rz = a.y - p.y, along = rx * ux + rz * uz, side = Math.abs(rx * uz - rz * ux);
        return along < 0 && along > -p.h * 1.6 && side < p.r + (a.r ?? 0.4) + 0.2;
      });
      p.fade += ((hidden ? 0.28 : 1) - p.fade) * Math.min(1, dt * 10);
      for (const m of p.meshes) { m.material.opacity = p.fade; m.material.depthWrite = p.fade > 0.9; m.castShadow = p.fade > 0.9; }
    }
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
      const prog = 1 - e.timer / e.attack.windup, last = e.timer < 0.25;
      t.mesh.children[1].scale.setScalar(Math.max(0.01, prog));
      // Últimos 0,25 s: todo en blanco y el aviso salta (es el momento de rodar).
      t.mesh.children[1].material.color.set(last ? 0xfff4dc : 0xff3b1f);
      t.mesh.children[2].material.opacity = last ? 1 : 0.7;
      const warn = t.mesh.userData.warn; warn.position.set(0, ABERRATIONS[e.kind].height * 1.15 + 0.4 + (last ? Math.sin(this.now * 40) * 0.06 : 0), 0);
      warn.rotation.y = this.stage.yaw + e.aim; warn.material.color.set(last ? 0xfff4dc : 0xff3b1f); warn.scale.setScalar(last ? 1.35 : 1);
    }
    for (const [k, t] of this.tele) if (!live.has(k)) { this.group.remove(t.mesh); this.tele.delete(k); }
  }
}

function teleMesh(e) {
  const at = e.attack, reach = (at.range ?? 2) + e.r;
  const g = new THREE.Group();
  // Rojo vivo y borde marcado: el pase de tinta desatura y el óxido se perdía en el suelo.
  const outer = new THREE.MeshBasicMaterial({ color: 0xff3b1f, transparent: true, opacity: 0.3, depthWrite: false });
  const inner = new THREE.MeshBasicMaterial({ color: 0xff3b1f, transparent: true, opacity: 0.6, depthWrite: false });
  let geo;
  if (at.kind === 'charge' || at.kind === 'grab') geo = new THREE.PlaneGeometry(reach, e.r * 2).translate(reach / 2, 0, 0).rotateX(-Math.PI / 2);
  else if (at.kind === 'stomp') geo = new THREE.CircleGeometry(reach, 32).rotateX(-Math.PI / 2);
  else geo = new THREE.CircleGeometry(reach, 24, -at.arc / 2, at.arc).rotateX(-Math.PI / 2);
  const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xff3b1f, transparent: true, opacity: 0.7 }));
  edge.position.y = 0.01;
  g.add(new THREE.Mesh(geo, outer), new THREE.Mesh(geo, inner), edge);
  // «!» sobre la cabeza: rombo que mira a cámara.
  const warn = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42).rotateZ(Math.PI / 4), new THREE.MeshBasicMaterial({ color: 0xff3b1f, depthTest: false, transparent: true, side: THREE.DoubleSide }));
  warn.renderOrder = 10; g.add(warn); g.userData.warn = warn;
  g.rotation.y = -e.aim;
  return g;
}
