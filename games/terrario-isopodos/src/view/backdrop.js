// Fondo vivo común a todas las escenas: rocas flotantes con musgo y nubes de papel que derivan lejos.
// La niebla del pase de tinta las aclara: dan escala y profundidad sin competir con el diorama.
import * as THREE from 'three';
import { PALETTES } from '../data/palettes.js';
import { mulberry32 } from '../core/rng.js';

const P = PALETTES.cozy;

function rock(rng) {
  const g = new THREE.Group();
  const r = 0.8 + rng() * 2.2;
  const top = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.9, 0.5, 9), new THREE.MeshLambertMaterial({ color: P.moss }));
  const cone = new THREE.Mesh(new THREE.ConeGeometry(r * 0.9, r * (1.2 + rng()), 9, 2), new THREE.MeshLambertMaterial({ color: P.soil }));
  cone.rotation.x = Math.PI;
  cone.position.y = -0.25 - r * 0.6;
  g.add(top, cone);
  for (let k = 0; k < 3; k++) {
    const t = new THREE.Mesh(new THREE.ConeGeometry(0.25, 1 + rng(), 5), new THREE.MeshLambertMaterial({ color: P.moss }));
    t.position.set((rng() - 0.5) * r, 0.6, (rng() - 0.5) * r);
    g.add(t);
  }
  return g;
}

function cloud(rng) {
  const g = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: P.paper, emissive: P.paper, emissiveIntensity: 0.12, flatShading: true });
  for (let k = 0; k < 4; k++) {
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(1 + rng() * 1.2, 0), mat);
    b.position.set(k * 1.4 - 2, rng() * 0.6, (rng() - 0.5));
    b.scale.y = 0.6;
    g.add(b);
  }
  return g;
}

export function createBackdrop(seed = 7) {
  const rng = mulberry32(seed);
  const group = new THREE.Group();
  const items = [];
  for (let k = 0; k < 16; k++) {
    const isRock = k < 9, a = (k / 16) * Math.PI * 2 + rng() * 0.4, d = 20 + rng() * 18;
    const o = isRock ? rock(rng) : cloud(rng);
    o.position.set(Math.cos(a) * d, isRock ? -14 + rng() * 9 : -4 + rng() * 6, Math.sin(a) * d);
    o.rotation.y = rng() * 6;
    group.add(o);
    items.push({ o, base: o.position.y, phase: rng() * 6, speed: 0.2 + rng() * 0.3 });
  }
  return {
    group,
    update(time) {
      group.rotation.y = time * 0.004;
      for (const it of items) it.o.position.y = it.base + Math.sin(time * it.speed + it.phase) * 0.6;
    },
  };
}
