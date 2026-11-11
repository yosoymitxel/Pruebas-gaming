// Personajes como recortes de papel de pie sobre el diorama: un plano inclinado hacia la cámara con su
// sombra en el suelo. sync() recibe la lista del fotograma y crea, mueve o retira lo necesario.
import * as THREE from 'three';
import { spriteTexture } from './sprites.js';
import { PALETTES } from '../data/palettes.js';
import { TILT } from './stage.js';
import { liveModel } from './models3d.js';

const LEAN = -0.45;
const plane = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
const disc = new THREE.CircleGeometry(0.5, 20).rotateX(-Math.PI / 2);
const shadowMat = new THREE.MeshBasicMaterial({ color: PALETTES.cozy.ink, transparent: true, opacity: 0.18, depthWrite: false });

export class ActorLayer {
  constructor(parent) {
    this.group = new THREE.Group();
    parent.add(this.group);
    this.items = new Map();
  }

  // a: { id, sprite, x, z, y (suelo), height, flip, flash (0–1), alpha, lift, width?, squash (1 = normal) }. `yaw`: giro de cámara,
  // para que los recortes la miren siempre de frente.
  sync(list, yaw = 0) {
    const seen = new Set();
    for (const a of list) {
      seen.add(a.id);
      let it = this.items.get(a.id);
      const want3d = (a.alpha ?? 1) >= 1 && !a.flat;
      if (!it || it.sprite !== a.sprite || it.is3d !== want3d) {
        if (it) this.drop(it);
        it = (want3d && this.make3d(a)) || this.make(a);
        this.items.set(a.id, it);
      }
      if (it.is3d) { this.pose(it, a, yaw); continue; }
      const aspect = it.mat.map.userData.aspect ?? 1;
      const h = a.height, w = (a.width ?? h * aspect);
      const sq = a.squash ?? 1; // aplastar conserva el volumen: más bajo, más ancho
      it.card.scale.set(w * (a.flip ? -1 : 1) / Math.sqrt(sq), h * sq, 1);
      // El recorte se adelanta hacia la cámara por su rayo de visión: en pantalla no se mueve, pero deja de
      // atravesar la pared o el escalón que tiene detrás.
      const pull = w * 0.45;
      it.card.position.set(0, (a.lift ?? 0) + pull * Math.cos(TILT), pull * Math.sin(TILT));
      it.card.rotation.z = a.spin ?? 0; // bolita que rueda
      const sk = a.shadowK ?? 1;
      it.shadow.scale.set(Math.min(w, h * 1.2) * 0.8 * sk, 1, Math.min(w, h) * 0.35 * sk);
      it.root.position.set(a.x, a.y ?? 0, a.z);
      it.root.rotation.y = yaw;
      it.mat.opacity = a.alpha ?? 1;
      it.flash.value = a.flash ?? 0; // destello blanco al recibir un golpe (como en Cult of the Lamb)
      it.shadow.visible = (a.shadowK ?? 1) > 0 && ((a.shadowK ?? null) !== null || (a.lift ?? 0) < 1.5);
    }
    for (const [id, it] of this.items) if (!seen.has(id)) { this.drop(it); this.items.delete(id); }
  }

  drop(it) {
    this.group.remove(it.root);
    if (it.is3d) it.model.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); [].concat(o.material).forEach((m) => m.dispose()); } });
  }

  // Bicho en 3D (models3d.js): se gira hacia donde camina, mueve las patas en trípode alterno según la
  // velocidad, balancea antenas y respira quieto. Mismo contrato que el recorte (alto, aplastar, saltar, rodar).
  make3d(a) {
    const model = liveModel(a.sprite);
    if (!model) return null;
    const root = new THREE.Group(), body = new THREE.Group();
    const box = new THREE.Box3().setFromObject(model), size = box.getSize(new THREE.Vector3());
    model.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
    body.add(model);
    const legs = [], ants = [], mats = [];
    model.traverse((o) => {
      const m = /^(Left|Right)Leg(\d+)Hip$/.exec(o.name);
      if (m) legs.push({ b: o, rest: o.rotation.clone(), k: +m[2], side: m[1] === 'Left' ? 1 : -1 });
      else if (/Antenna$/.test(o.name) || /^(Left|Right)(Palp|Mandible)/.test(o.name)) ants.push({ b: o, rest: o.rotation.clone(), k: ants.length });
      if (o.isMesh) { o.castShadow = true; o.material = [].concat(o.material).map((mt) => { const c = new THREE.MeshLambertMaterial({ color: mt.color, map: mt.map, vertexColors: mt.vertexColors, flatShading: true, side: mt.side, transparent: mt.transparent, opacity: mt.opacity }); mt.dispose(); mats.push(c); return c; }); if (o.material.length === 1) o.material = o.material[0]; }
    });
    const shadow = new THREE.Mesh(disc, shadowMat);
    shadow.position.y = 0.02;
    root.add(shadow, body);
    this.group.add(root);
    return { is3d: true, root, body, model, shadow, legs, ants, mats, base: Math.max(size.x, size.z), tall: size.y, sprite: a.sprite,
      heading: a.flip ? -Math.PI / 2 : Math.PI / 2, px: a.x, pz: a.z, gait: 0, speed: 0, t: performance.now() / 1000 };
  }

  pose(it, a, yaw) {
    const now = performance.now() / 1000, dt = Math.min(0.1, now - it.t); it.t = now;
    const dx = a.x - it.px, dz = a.z - it.pz, v = dt > 0 ? Math.hypot(dx, dz) / dt : 0;
    it.px = a.x; it.pz = a.z;
    it.speed += (Math.min(v, 6) - it.speed) * Math.min(1, dt * 10);
    if (a.face != null) { const goal = Math.atan2(Math.cos(a.face), Math.sin(a.face)); let d = goal - it.heading; d = Math.atan2(Math.sin(d), Math.cos(d)); it.heading += d * Math.min(1, dt * 14); }
    else if (v > 0.15 && !a.spin) { const goal = Math.atan2(dx, dz); let d = goal - it.heading; d = Math.atan2(Math.sin(d), Math.cos(d)); it.heading += d * Math.min(1, dt * 12); }
    // tamaño: el largo del bicho = el ancho que tendría su recorte
    const aspect = spriteTexture(a.sprite).userData.aspect ?? 1.6, len = a.width ?? a.height * aspect * 0.8, k = len / it.base;
    const sq = a.squash ?? 1;
    it.body.scale.set(k / Math.sqrt(sq), k * sq, k / Math.sqrt(sq));
    it.body.rotation.set(0, it.heading, 0);
    // rodar: gira sobre su centro (el modelo se baja media altura dentro del cuerpo)
    const y0 = (it.y0 ??= it.model.position.y), half = a.spin ? it.tall / 2 : 0;
    it.model.position.y = y0 - half;
    if (a.spin) it.body.rotation.x = a.spin;
    it.body.position.y = (a.lift ?? 0) + half * k * sq;
    it.gait += dt * (2 + it.speed * 9);
    const walk = Math.min(1, it.speed / 1.5);
    for (const l of it.legs) { const ph = it.gait + l.k * 1.2 + (l.side > 0 ? 0 : Math.PI); l.b.rotation.y = l.rest.y + Math.sin(ph) * 0.45 * walk; l.b.rotation.z = l.rest.z + Math.max(0, Math.cos(ph)) * 0.25 * walk; }
    for (const n of it.ants) n.b.rotation.x = n.rest.x + Math.sin(now * 3 + n.k) * 0.12;
    if (walk < 0.2) it.body.scale.y *= 1 + Math.sin(now * 2.2 + it.base) * 0.02; // respira quieto
    const fl = a.flash ?? 0;
    for (const m of it.mats) if (m.emissive) { m.emissive.setScalar(fl); m.emissiveIntensity = 1; }
    const sk = a.shadowK ?? 1;
    it.shadow.scale.set(len * 0.75 * sk, 1, len * 0.45 * sk);
    it.shadow.visible = sk > 0 && (a.lift ?? 0) < 1.5;
    it.root.position.set(a.x, a.y ?? 0, a.z);
  }

  make(a) {
    const root = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ map: spriteTexture(a.sprite), transparent: true, alphaTest: 0.08, side: THREE.DoubleSide });
    const flash = { value: 0 };
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uFlash = flash;
      sh.fragmentShader = 'uniform float uFlash;\n' + sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0), uFlash);');
    };
    const card = new THREE.Mesh(plane, mat);
    card.rotation.x = LEAN;
    card.castShadow = true;
    const shadow = new THREE.Mesh(disc, shadowMat);
    shadow.position.y = 0.02;
    root.add(shadow, card);
    this.group.add(root);
    return { root, card, shadow, mat, flash, sprite: a.sprite };
  }
}
