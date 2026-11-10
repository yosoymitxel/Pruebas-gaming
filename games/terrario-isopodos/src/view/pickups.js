// Recogibles en 3D: cada recurso tiene su forma (hoja, mata de musgo, seta, cristal de cal, gema de ámbar)
// sobre un anillo que late, para que se lean a distancia y no sean manchas.
import * as THREE from 'three';
import { PALETTES } from '../data/palettes.js';

const P = PALETTES.cozy;
const lambert = (hex, extra) => new THREE.MeshLambertMaterial({ color: hex, ...extra });
const add = (g, geo, mat, x = 0, y = 0, z = 0, s = [1, 1, 1], r = [0, 0, 0]) => {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z); m.scale.set(...s); m.rotation.set(...r);
  m.castShadow = true;
  g.add(m);
  return m;
};

const SHAPES = {
  hojarasca: (g) => {
    add(g, new THREE.SphereGeometry(0.3, 10, 6), lambert(P.amber), 0, 0.3, 0, [1, 0.16, 0.55], [0.3, 0.6, 0.2]);
    add(g, new THREE.SphereGeometry(0.24, 10, 6), lambert(P.rust), 0.12, 0.22, 0.1, [1, 0.16, 0.5], [-0.2, 2.2, 0.1]);
  },
  musgo: (g) => {
    for (const [x, z, r] of [[0, 0, 0.2], [0.18, 0.08, 0.15], [-0.15, 0.1, 0.14], [0.05, -0.16, 0.13]]) add(g, new THREE.SphereGeometry(r, 8, 6), lambert(P.moss), x, r * 0.9, z);
  },
  esporas: (g) => {
    add(g, new THREE.CylinderGeometry(0.06, 0.08, 0.35, 6), lambert(P.paper), 0, 0.18, 0);
    add(g, new THREE.SphereGeometry(0.24, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), lambert(P.rust), 0, 0.33, 0);
    add(g, new THREE.CylinderGeometry(0.04, 0.05, 0.2, 6), lambert(P.paper), 0.18, 0.1, 0.08);
    add(g, new THREE.SphereGeometry(0.12, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), lambert(P.rust), 0.18, 0.19, 0.08);
  },
  cal: (g) => {
    for (const [x, z, h, a] of [[0, 0, 0.5, 0], [0.14, 0.06, 0.32, 0.4], [-0.12, 0.08, 0.36, -0.35]]) add(g, new THREE.OctahedronGeometry(0.14), lambert(P.paper, { emissive: P.paper, emissiveIntensity: 0.2 }), x, h / 2, z, [0.8, h * 3, 0.8], [0, 0, a]);
  },
  ambar: (g) => {
    add(g, new THREE.DodecahedronGeometry(0.2), lambert(P.amber, { emissive: P.amber, emissiveIntensity: 0.35 }), 0, 0.28, 0, [1, 1.3, 1]);
  },
};

export function pickupMesh(res) {
  const g = new THREE.Group();
  const model = new THREE.Group();
  SHAPES[res](model);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.34, 0.42, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: P.amber, transparent: true, opacity: 0.8, depthWrite: false }));
  ring.position.y = 0.03;
  g.add(ring, model);
  g.userData = { model, ring };
  return g;
}

// Animación: gira, flota y el anillo late.
export function animatePickup(g, time, seed) {
  const { model, ring } = g.userData;
  model.rotation.y = time * 1.2 + seed;
  model.position.y = 0.06 + Math.sin(time * 2.4 + seed) * 0.06;
  const k = 1 + Math.sin(time * 4 + seed) * 0.12;
  ring.scale.set(k, 1, k);
}

export const PICKUP_KINDS = Object.keys(SHAPES);
