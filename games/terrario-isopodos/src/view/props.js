// Piezas del terrario en 3D sencillo (el pase de tinta las dibuja). Cada malla mide su huella en
// celdas y tiene el origen en el centro de la huella, a ras de suelo.
import * as THREE from 'three';
import { PALETTES } from '../data/palettes.js';
import { BUILDINGS, MAX_LEVEL } from '../data/buildings.js';
import * as Pot from '../vendor/polyfork/upturned-clay-flowerpot-de9221.mjs';
import * as Moss from '../vendor/polyfork/moss-cushion-2eabef.mjs';
import * as Pebble from '../vendor/polyfork/quartz-pebble-path-stone-23c014.mjs';
import * as Slate from '../vendor/polyfork/slate-flake-path-stone-514513.mjs';
import * as Bonnet from '../vendor/polyfork/glowing-bonnet-mushroom-13f518.mjs';
import * as Puff from '../vendor/polyfork/puffball-mushroom-3b1324.mjs';
import * as Twig from '../vendor/polyfork/fallen-twig-4c64de.mjs';
import * as Cone from '../vendor/polyfork/pine-cone-e36f37.mjs';
import * as Acorn from '../vendor/polyfork/acorn-cup-0ed13c.mjs';
import * as Leaf from '../vendor/polyfork/fallen-oak-leaf-5b15fe.mjs';

const P = PALETTES.cozy;
const mats = new Map();
const mat = (hex) => mats.get(hex) ?? mats.set(hex, new THREE.MeshLambertMaterial({ color: hex })).get(hex);
const mesh = (geo, hex, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat(hex)); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; };

// Modelo del kit Polyfork encajado a un ancho (celdas) y apoyado en el suelo; materiales Lambert como el resto.
function kit(mod, opts, width, x = 0, z = 0, rotY = 0) {
  const m = mod.createAsset(opts), box = new THREE.Box3().setFromObject(m), size = box.getSize(new THREE.Vector3());
  const k = width / Math.max(size.x, size.z), wrap = new THREE.Group();
  m.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
  m.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; o.material = [].concat(o.material).map((mt) => new THREE.MeshLambertMaterial({ vertexColors: mt.vertexColors, color: mt.color, emissive: mt.emissive ?? 0, emissiveIntensity: mt.emissiveIntensity ?? 1, flatShading: true, side: THREE.DoubleSide })); if (o.material.length === 1) o.material = o.material[0]; } });
  wrap.add(m); wrap.scale.setScalar(k); wrap.position.set(x, 0, z); wrap.rotation.y = rotY;
  return wrap;
}

function mushroom(g, x, z, s) {
  g.add(mesh(new THREE.CylinderGeometry(0.06 * s, 0.08 * s, 0.35 * s, 6), P.paper, x, 0.17 * s, z));
  g.add(mesh(new THREE.SphereGeometry(0.2 * s, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), P.rust, x, 0.33 * s, z));
}

const BUILD = {
  // La maceta volcada con puerta: el refugio clásico de un terrario de isópodos.
  refugio: (g) => { g.add(kit(Pot, { door: 'doorway', bloom: 0.7 }, 1.8)); g.add(kit(Moss, { loft: 0.8 }, 0.6, -0.65, -0.55)); },
  comedero: (g) => {
    g.add(mesh(new THREE.CylinderGeometry(0.42, 0.32, 0.18, 10), P.stone, 0, 0.09, 0));
    g.add(mesh(new THREE.ConeGeometry(0.28, 0.12, 5), P.amber, 0, 0.24, 0));
  },
  huerto: (g) => {
    g.add(mesh(new THREE.BoxGeometry(1.8, 0.1, 1.8), P.soil, 0, 0.05, 0));
    [[-0.45, -0.4, 0.7, 1], [0.45, -0.35, 0.55, 3], [0.1, 0.45, 0.8, 5], [-0.55, 0.5, 0.45, 7]].forEach(([x, z, w, a]) => g.add(kit(Puff, { arrangement: a, state: a > 5 ? 'ripe' : 'young' }, w, x, z)));
  },
  charca: (g) => {
    g.add(mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.08, 16), P.water, 0, 0.04, 0));
    g.children[0].scale.z = 0.5;
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2;
      g.add(mesh(new THREE.DodecahedronGeometry(0.16, 0), P.stone, Math.cos(a) * 0.9, 0.08, Math.sin(a) * 0.45));
      // Musgo entre las piedras y por fuera: la charca es de donde sale el musgo.
      const b = a + Math.PI / 7, tuft = mesh(new THREE.SphereGeometry(0.17 + (k % 3) * 0.05, 7, 4), k % 2 ? P.moss : P.grass, Math.cos(b) * 1.02, 0.05, Math.sin(b) * 0.56);
      tuft.scale.y = 0.45; g.add(tuft);
    }
    const pad = mesh(new THREE.CircleGeometry(0.16, 9, 0.4, Math.PI * 1.75), P.moss, 0.3, 0.085, 0.05);
    pad.rotation.x = -Math.PI / 2; g.add(pad);
  },
  altar: (g) => {
    g.add(mesh(new THREE.BoxGeometry(1.4, 0.3, 1.2), P.stone, 0, 0.15, 0));
    g.add(mesh(new THREE.BoxGeometry(0.06, 1.6, 0.06), P.bark, -0.6, 0.8, -0.5));
    const flag = mesh(new THREE.PlaneGeometry(0.45, 0.6), P.rust, -0.36, 1.3, -0.5);
    flag.material = new THREE.MeshLambertMaterial({ color: P.rust, side: THREE.DoubleSide });
    g.add(flag);
    g.add(mesh(new THREE.BoxGeometry(0.9, 0.5, 0.7), P.stone, 0, 0.55, 0));
    g.add(mesh(new THREE.SphereGeometry(0.45, 7, 5), P.moss, 0, 0.95, 0));
  },
  corcho: (g) => {
    g.add(kit(Twig, { colorway: 'peeling', bark: 'peeling' }, 1.7, 0, 0.35, 0.1));
    const bark = mesh(new THREE.CylinderGeometry(0.5, 0.5, 1.9, 9, 1, true, 0, Math.PI), P.bark, 0, 0, 0);
    bark.rotation.z = Math.PI / 2; bark.rotation.y = Math.PI / 2; bark.material.side = THREE.DoubleSide; bark.scale.set(1, 1, 0.7);
    g.add(bark);
    g.add(mesh(new THREE.SphereGeometry(0.2, 6, 4), P.moss, -0.5, 0.45, 0.1));
  },
  sepia: (g) => {
    const bone = mesh(new THREE.SphereGeometry(0.42, 10, 6), P.paper, 0, 0.12, 0);
    bone.scale.set(1, 0.3, 0.55); g.add(bone);
  },
  esfagno: (g) => { [[-0.4, -0.35, 1, 0.9], [0.45, -0.3, 0.85, 1.1], [0, 0.45, 1.05, 1.2]].forEach(([x, z, w, l]) => g.add(kit(Moss, { loft: l }, w, x, z))); },
  colembolos: (g) => {
    for (let k = 0; k < 7; k++) g.add(mesh(new THREE.SphereGeometry(0.05, 5, 3), P.paper, Math.cos(k * 0.9) * 0.25, 0.06, Math.sin(k * 1.7) * 0.25));
    g.add(mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.05, 10), P.soil, 0, 0.02, 0));
  },
  tronco: (g) => {
    const log = mesh(new THREE.CylinderGeometry(0.42, 0.46, 2.8, 10), P.bark, 0, 0.42, 0);
    log.rotation.z = Math.PI / 2; g.add(log);
    [[-0.7, 0.35, 0.35, 2], [0.5, -0.4, 0.3, 4]].forEach(([x, z, w, a]) => g.add(kit(Puff, { arrangement: a }, w, x, z)));
    g.add(kit(Leaf, { colorway: 'autumn', curl: 0.4 }, 0.7, 0.9, 0.45, 0.6)); g.add(kit(Cone, { open: 0.8 }, 0.35, -1.2, -0.35));
  },
  seta: (g) => {
    g.add(kit(Bonnet, { glow: 'off' }, 0.42)); g.add(kit(Bonnet, { glow: 'off', stage: 'young' }, 0.25, 0.25, 0.2));
    g.traverse((o) => { if (o.isMesh) [].concat(o.material).forEach((m) => { m.emissive = new THREE.Color(0xaac9c2); m.emissiveIntensity = 0.35; }); });
    const light = new THREE.PointLight(0xaac9c2, 2.5, 3.5, 1.6); light.position.y = 1; g.add(light);
  },
  piedra: (g) => { g.add(kit(Slate, { thickness: 0.4, layers: 2 }, 0.95)); g.add(kit(Pebble, { thickness: 0.4, arrangement: 3 }, 0.4, 0.25, 0.25)); },
};

// Círculo de piedras bajo las piezas grandes (el anillo que rodea cada estructura en la base de CotL).
function stoneRing(g, r) {
  const n = Math.round(r * 9), geo = new THREE.DodecahedronGeometry(0.11, 0);
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2, st = mesh(geo, P.stone, Math.cos(a) * r, 0.04, Math.sin(a) * r);
    st.scale.set(1, 0.5, 1); g.add(st);
  }
}

// Nivel: la pieza crece un poco y lleva tantas gemas ámbar como niveles por encima del primero.
export function propMesh(type, rot = 0, level = 1) {
  const g = new THREE.Group();
  BUILD[type](g);
  g.scale.setScalar(1 + (level - 1) * 0.08);
  if (level < MAX_LEVEL) for (let k = 1; k < level; k++) { const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), new THREE.MeshBasicMaterial({ color: P.amber })); gem.position.set(-0.3 + k * 0.25, 1.35, 0); g.add(gem); }
  const { w, h } = BUILDINGS[type].size;
  if (w * h >= 4) stoneRing(g, Math.max(w, h) * 0.62);
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
