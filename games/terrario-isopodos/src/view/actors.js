// Personajes como recortes de papel de pie sobre el diorama: un plano inclinado hacia la cámara con su
// sombra en el suelo. sync() recibe la lista del fotograma y crea, mueve o retira lo necesario.
import * as THREE from 'three';
import { spriteTexture } from './sprites.js';
import { PALETTES } from '../data/palettes.js';

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
      if (!it || it.sprite !== a.sprite) {
        if (it) this.group.remove(it.root);
        it = this.make(a);
        this.items.set(a.id, it);
      }
      const aspect = it.mat.map.userData.aspect ?? 1;
      const h = a.height, w = (a.width ?? h * aspect);
      const sq = a.squash ?? 1; // aplastar conserva el volumen: más bajo, más ancho
      it.card.scale.set(w * (a.flip ? -1 : 1) / Math.sqrt(sq), h * sq, 1);
      it.card.position.y = a.lift ?? 0;
      it.shadow.scale.set(Math.min(w, h * 1.2) * 0.8, 1, Math.min(w, h) * 0.35);
      it.root.position.set(a.x, a.y ?? 0, a.z);
      it.root.rotation.y = yaw;
      it.mat.opacity = a.alpha ?? 1;
      it.mat.color.setScalar(1 - (a.flash ?? 0) * 0.6);
      it.shadow.visible = (a.lift ?? 0) < 1.5;
    }
    for (const [id, it] of this.items) if (!seen.has(id)) { this.group.remove(it.root); this.items.delete(id); }
  }

  make(a) {
    const root = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ map: spriteTexture(a.sprite), transparent: true, alphaTest: 0.08, side: THREE.DoubleSide });
    const card = new THREE.Mesh(plane, mat);
    card.rotation.x = LEAN;
    card.castShadow = true;
    const shadow = new THREE.Mesh(disc, shadowMat);
    shadow.position.y = 0.02;
    root.add(shadow, card);
    this.group.add(root);
    return { root, card, shadow, mat, sprite: a.sprite };
  }
}
