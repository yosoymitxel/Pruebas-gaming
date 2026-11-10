// Piezas del terrario en 3D sencillo (el pase de tinta las dibuja). Cada malla mide su huella en
// celdas y tiene el origen en el centro de la huella, a ras de suelo.
import * as THREE from 'three';
import { PALETTES } from '../data/palettes.js';

const P = PALETTES.cozy;
const mats = new Map();
const mat = (hex) => mats.get(hex) ?? mats.set(hex, new THREE.MeshLambertMaterial({ color: hex })).get(hex);
const mesh = (geo, hex, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat(hex)); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };

function mushroom(g, x, z, s) {
  g.add(mesh(new THREE.CylinderGeometry(0.06 * s, 0.08 * s, 0.35 * s, 6), P.paper, x, 0.17 * s, z));
  g.add(mesh(new THREE.SphereGeometry(0.2 * s, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), P.rust, x, 0.33 * s, z));
}

const BUILD = {
  refugio: (g) => {
    const bark = mesh(new THREE.CylinderGeometry(0.85, 0.85, 1.8, 10, 1, true, 0, Math.PI), P.bark, 0, 0, 0);
    bark.rotation.z = Math.PI / 2; bark.material.side = THREE.DoubleSide;
    g.add(bark);
    g.add(mesh(new THREE.SphereGeometry(0.35, 6, 4), P.moss, 0.4, 0.75, -0.2));
  },
  comedero: (g) => {
    g.add(mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.18, 10), P.stone, 0, 0.09, 0));
    g.add(mesh(new THREE.ConeGeometry(0.28, 0.12, 5), P.amber, 0, 0.24, 0));
  },
  huerto: (g) => {
    g.add(mesh(new THREE.BoxGeometry(1.8, 0.1, 1.8), P.soil, 0, 0.05, 0));
    [[-0.5, -0.4, 1.2], [0.4, -0.5, 1], [0.1, 0.4, 1.4], [-0.5, 0.5, 0.9], [0.6, 0.3, 0.8]].forEach(([x, z, s]) => mushroom(g, x, z, s));
  },
  charca: (g) => {
    g.add(mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.08, 16), P.water, 0, 0.04, 0));
    g.children[0].scale.z = 0.5;
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2;
      g.add(mesh(new THREE.DodecahedronGeometry(0.16, 0), P.stone, Math.cos(a) * 0.9, 0.08, Math.sin(a) * 0.45));
    }
  },
  altar: (g) => {
    g.add(mesh(new THREE.BoxGeometry(1.4, 0.3, 1.2), P.stone, 0, 0.15, 0));
    g.add(mesh(new THREE.BoxGeometry(0.9, 0.5, 0.7), P.stone, 0, 0.55, 0));
    g.add(mesh(new THREE.SphereGeometry(0.45, 7, 5), P.moss, 0, 0.95, 0));
  },
  piedra: (g) => {
    const s = mesh(new THREE.DodecahedronGeometry(0.42, 0), P.stone, 0, 0.18, 0);
    s.scale.y = 0.55;
    g.add(s);
  },
};

export function propMesh(type, rot = 0) {
  const g = new THREE.Group();
  BUILD[type](g);
  g.rotation.y = -rot * Math.PI / 2;
  return g;
}

// Fantasma para colocar: mismo modelo, translúcido y teñido según si cabe.
export function ghostMesh(type, rot, ok) {
  const g = propMesh(type, rot);
  const m = new THREE.MeshBasicMaterial({ color: ok ? P.moss : P.rust, transparent: true, opacity: 0.55 });
  g.traverse((o) => { if (o.isMesh) o.material = m; });
  return g;
}
