// Vistas internas (como entrar en un edificio de Cult of the Lamb): el refugio por dentro, con sus camas de musgo
// y quien duerme ahí, y la cámara del altar donde la colonia se reúne en corro. Cueva abierta hacia la cámara,
// luz cálida o violeta, modelos de Polyfork y los isópodos con su atuendo y color (ActorLayer).
import * as THREE from 'three';
import * as Moss from '../vendor/polyfork/moss-cushion-2eabef.mjs';
import * as Leaf from '../vendor/polyfork/fallen-oak-leaf-5b15fe.mjs';
import * as Bonnet from '../vendor/polyfork/glowing-bonnet-mushroom-13f518.mjs';
import * as Quartz from '../vendor/polyfork/quartz-pebble-path-stone-23c014.mjs';
import * as Acorn from '../vendor/polyfork/acorn-cup-0ed13c.mjs';
import * as Twig from '../vendor/polyfork/fallen-twig-4c64de.mjs';
import { ActorLayer } from './actors.js';
import { Vfx } from './vfx.js';
import { BADGES } from '../data/palettes.js';
import { BUILDINGS } from '../data/buildings.js';
import { lvl, sleepersOf } from '../game/home.js';

const R = 3.6; // radio de la cueva
const L = (c, extra) => new THREE.MeshLambertMaterial({ color: c, flatShading: true, ...extra });

function kit(mod, opts, size) {
  const m = mod.createAsset(opts), box = new THREE.Box3().setFromObject(m), s = box.getSize(new THREE.Vector3());
  m.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
  m.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; o.material = [].concat(o.material).map((mt) => new THREE.MeshLambertMaterial({ vertexColors: mt.vertexColors, color: mt.color, emissive: mt.emissive ?? 0, emissiveIntensity: mt.emissiveIntensity ?? 1, flatShading: true, side: THREE.DoubleSide })); if (o.material.length === 1) o.material = o.material[0]; } });
  const g = new THREE.Group(); g.add(m); g.scale.setScalar(size / Math.max(s.x, s.z, 0.001));
  return g;
}

// Cueva: suelo de tierra y bóveda irregular abierta por delante (hacia `yaw`, donde está la cámara).
function cave(yaw, wall, floor) {
  const g = new THREE.Group();
  const ground = new THREE.Mesh(new THREE.CircleGeometry(R, 40).rotateX(-Math.PI / 2), L(floor)); ground.receiveShadow = true; g.add(ground);
  const geo = new THREE.SphereGeometry(R, 28, 14, 0, Math.PI * 1.25, 0, Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const k = 1 + Math.sin(p.getX(i) * 2.1 + p.getY(i) * 3.3) * 0.06; p.setXYZ(i, p.getX(i) * k, p.getY(i) * 0.8, p.getZ(i) * k); }
  geo.computeVertexNormals();
  const dome = new THREE.Mesh(geo, L(wall, { side: THREE.DoubleSide })); dome.receiveShadow = true;
  // el hueco (phi de 1,25π a 2π) tiene que mirar hacia la cámara, que está en la dirección (sin yaw, cos yaw)
  const gap = Math.PI * 1.625; dome.rotation.y = yaw - Math.atan2(-Math.cos(gap), Math.sin(gap));
  g.add(dome);
  // raíces que cuelgan del techo
  const root = new THREE.ConeGeometry(0.08, 1, 5).translate(0, -0.5, 0);
  for (let k = 0; k < 14; k++) { const a = yaw + Math.PI + (k / 14 - 0.5) * Math.PI * 1.1, d = R * (0.55 + (k % 3) * 0.12), r = new THREE.Mesh(root, L(0x4a3424)); r.position.set(Math.sin(a) * d, R * 0.8 * Math.cos(Math.asin(Math.min(0.99, d / R))) , Math.cos(a) * d); r.scale.y = 0.6 + (k % 4) * 0.35; g.add(r); }
  return g;
}

export class InteriorView {
  constructor(stage, home, kind, pieceId) {
    this.stage = stage; this.home = home; this.kind = kind; this.pieceId = pieceId;
    this.group = new THREE.Group();
    const yaw = stage.yaw;
    this.yaw = yaw;
    const altar = kind === 'altar';
    this.group.add(cave(yaw, altar ? 0x3b2f3f : 0x5a3f2a, altar ? 0x463a3c : 0x6b4d33));
    this.light = new THREE.PointLight(altar ? 0xb48cff : 0xffc27a, altar ? 26 : 20, 12, 1.4);
    this.light.position.set(0, 2.6, 0); this.group.add(this.light, new THREE.HemisphereLight(altar ? 0xd9c8ff : 0xffe2b8, 0x2a1f18, 1.4));
    this.actors = new ActorLayer(this.group);
    this.vfx = new Vfx(this.group);
    if (altar) this.buildAltar(); else this.buildBeds();
  }

  get camera() { return { target: [0, 0.4], distance: 9, fit: 7.4 }; }

  // Camas de musgo en semicírculo al fondo, con una hoja de manta y una bellota de cuenco.
  buildBeds() {
    const p = this.home.grid.pieces[this.pieceId], n = p ? Math.max(1, (BUILDINGS[p.type].beds ?? 1) * lvl(p)) : 3;
    this.beds = [];
    for (let k = 0; k < n; k++) {
      const a = this.yaw + Math.PI + ((k + 0.5) / n - 0.5) * Math.PI * 0.95, d = R * 0.58, x = Math.sin(a) * d, z = Math.cos(a) * d;
      const bed = kit(Moss, { colorway: k % 3 === 2 ? 'dry-bronze' : 'meadow-green' }, 1.2); bed.position.set(x, 0, z); this.group.add(bed);
      this.beds.push({ x, z, a });
    }
    const leaf = kit(Leaf, { colorway: 'autumn' }, 1.6); leaf.position.set(Math.sin(this.yaw) * 1.1, 0.02, Math.cos(this.yaw) * 1.1); leaf.rotation.y = 0.7; this.group.add(leaf);
    const cup = kit(Acorn, { colorway: 'ripe-oak' }, 0.6); cup.position.set(Math.sin(this.yaw + 1.2) * 1.9, 0, Math.cos(this.yaw + 1.2) * 1.9); this.group.add(cup);
    const twig = kit(Twig, { colorway: 'hazel' }, 1.8); twig.position.set(Math.sin(this.yaw - 1.1) * 2, 0, Math.cos(this.yaw - 1.1) * 2); twig.rotation.y = 1.2; this.group.add(twig);
  }

  // Altar en el centro (cuarzo sobre un pedestal) rodeado de setas que brillan como velas.
  buildAltar() {
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.95, 0.5, 8), L(0x6e6372)); ped.position.y = 0.25; ped.castShadow = true; this.group.add(ped);
    this.gem = kit(Quartz, { colorway: 'rose' }, 0.8); this.gem.position.y = 0.5; this.group.add(this.gem);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2, m = kit(Bonnet, { colorway: k % 2 ? 'moonlit' : 'honey' }, 0.45); m.position.set(Math.cos(a) * 1.15, 0, Math.sin(a) * 1.15); this.group.add(m); }
    this.halo = new THREE.Mesh(new THREE.RingGeometry(1.8, 1.95, 56).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xb48cff, transparent: true, depthWrite: false }));
    this.halo.position.y = 0.03; this.group.add(this.halo);
  }

  update(time, dt) {
    this.vfx.update(dt);
    this.light.intensity = (this.kind === 'altar' ? 24 : 18) + Math.sin(time * 7) * 1.5 + Math.sin(time * 13) * 0.8; // llama que tiembla
    const list = [], isos = this.home.isopods;
    const look = (iso) => ({ outfit: iso.outfit ?? null, paint: iso.badge != null ? BADGES[iso.badge] : null });
    if (this.kind === 'altar') {
      const sm = this.home.sermon, k = sm ? 1 - sm.t / (sm.total ?? 7) : 1;
      isos.forEach((iso, i) => {
        const a = (i / isos.length) * Math.PI * 2 + 0.3, d = 2.3, hop = sm ? Math.abs(Math.sin(time * 5 + i)) * 0.18 : 0;
        list.push({ id: `a${iso.id}`, sprite: `iso:${iso.shell}`, x: Math.cos(a) * d, z: Math.sin(a) * d, height: iso.baby > 0 ? 0.6 : 1.05, lift: hop, squash: 1 + hop * 0.5, face: a + Math.PI, ...look(iso) });
      });
      this.gem.rotation.y = time * (sm ? 2.5 : 0.5); this.gem.position.y = 0.5 + Math.sin(time * 2) * 0.06;
      this.halo.scale.setScalar(sm ? 1.1 - k * 0.4 : 1); this.halo.material.opacity = sm ? 0.5 + Math.sin(time * 6) * 0.3 : 0.25;
      if (sm && (this.sparkT = (this.sparkT ?? 0) - dt) <= 0) { this.sparkT = 0.35; this.vfx.burst('mimo', 0, 1.1, 0); }
    } else {
      const p = this.home.grid.pieces[this.pieceId], mine = p ? isos.filter((i) => i.bed === p.id || i.home === p.id || sleepersOf(this.home, p).includes(i)) : [];
      mine.slice(0, this.beds.length).forEach((iso, i) => {
        const b = this.beds[i], asleep = iso.rest > 0;
        list.push({ id: `b${iso.id}`, sprite: `${asleep ? 'ball' : 'iso'}:${iso.shell}`, x: b.x, z: b.z, y: 0.35, height: asleep ? 0.8 : 1.15, squash: asleep ? 1 + Math.sin(time * 1.3 + i) * 0.05 : 1, face: b.a + Math.PI, ...(asleep ? {} : look(iso)) });
        if (asleep) { const u = (time * 0.4 + i * 0.33) % 1; list.push({ id: `z${iso.id}`, sprite: 'proc:zzz', x: b.x, z: b.z, height: 0.3 + u * 0.12, lift: 0.9 + u * 0.8, alpha: 1 - u }); }
      });
    }
    this.actors.sync(list, this.stage.yaw);
  }

  dispose() {}
}
