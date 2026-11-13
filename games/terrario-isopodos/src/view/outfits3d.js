// Atuendos en 3D: modelos de Polyfork encajados al tamaño del isópodo, en su cabeza (hueso Head) o al lomo.
import * as THREE from 'three';
import * as Acorn from '../vendor/polyfork/acorn-cup-0ed13c.mjs';
import * as Bonnet from '../vendor/polyfork/glowing-bonnet-mushroom-13f518.mjs';
import * as Puff from '../vendor/polyfork/puffball-mushroom-3b1324.mjs';
import * as Quartz from '../vendor/polyfork/quartz-pebble-path-stone-23c014.mjs';
import * as Leaf from '../vendor/polyfork/fallen-oak-leaf-5b15fe.mjs';
import * as Moss from '../vendor/polyfork/moss-cushion-2eabef.mjs';
import * as Cone from '../vendor/polyfork/pine-cone-e36f37.mjs';
import * as Twig from '../vendor/polyfork/fallen-twig-4c64de.mjs';
import { OUTFITS } from '../data/outfits.js';
import { shoot } from './models3d.js';

const MODS = { acorn: Acorn, bonnet: Bonnet, puff: Puff, quartz: Quartz, leaf: Leaf, moss: Moss, cone: Cone, twig: Twig };

// Pieza lista para colgar: centrada en x/z y apoyada en y = 0; ancho = size × largo del cuerpo.
function piece(def, bodyLen) {
  const m = MODS[def.model].createAsset(def.opts), box = new THREE.Box3().setFromObject(m), s = box.getSize(new THREE.Vector3());
  m.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
  m.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.material = [].concat(o.material).map((mt) => new THREE.MeshLambertMaterial({ vertexColors: mt.vertexColors, color: mt.color, emissive: mt.emissive ?? 0, emissiveIntensity: mt.emissiveIntensity ?? 1, flatShading: true, side: THREE.DoubleSide })); if (o.material.length === 1) o.material = o.material[0]; } });
  const g = new THREE.Group(); g.add(m); g.scale.setScalar((def.size * bodyLen) / Math.max(s.x, s.y, s.z, 0.001)); // la mayor medida (la seta es alta)
  return g;
}

// Cuelga el atuendo `id` del modelo: se orienta con +x hacia la cabeza (hueso Head) y se apoya en la curva del
// caparazón según `along` y `sink`. Devuelve el objeto para poder quitarlo.
export function attachOutfit(model, id, { rolled = false } = {}) {
  const def = OUTFITS[id];
  if (!def || !MODS[def.model]) return null;
  // todo se mide en el espacio propio del modelo: se suelta un momento de su padre y se deja sin transformar
  const parent = model.parent, saved = [model.position.clone(), model.quaternion.clone(), model.scale.clone()];
  parent?.remove(model); model.position.set(0, 0, 0); model.quaternion.identity(); model.scale.set(1, 1, 1);
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model), c = box.getCenter(new THREE.Vector3()), H = box.max.y - box.min.y;
  const head = model.getObjectByName('Head'), hp = head ? head.getWorldPosition(new THREE.Vector3()) : new THREE.Vector3(box.max.x, c.y, c.z);
  const ax = new THREE.Vector3(hp.x - c.x, 0, hp.z - c.z); if (ax.lengthSq() < 1e-6) ax.set(1, 0, 0); ax.normalize();
  const half = Math.abs(ax.x) * (box.max.x - box.min.x) / 2 + Math.abs(ax.z) * (box.max.z - box.min.z) / 2, len = half * 2;
  // hecho bolita: todo va arriba del todo de la bola, algo menos hundido
  const t = rolled ? 0 : def.along ?? 0, top = box.min.y + H * Math.sqrt(Math.max(0, 1 - (t * 0.92) ** 2)); // perfil de cúpula
  const acc = new THREE.Group(), n = def.count ?? 1;
  for (let k = 0; k < n; k++) {
    const pc = piece(def, rolled ? len * 1.5 : len), r = def.rot ?? [0, 0, 0]; // la bola es corta: se compensa
    const inner = new THREE.Group(); inner.add(pc); inner.rotation.set(r[0], r[1], r[2]);
    // tras girar, apoyar su base en y = 0 y centrar
    inner.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(inner), m = b.getCenter(new THREE.Vector3());
    inner.position.set(-m.x, -b.min.y, -m.z); // ya girado: el desplazamiento va fuera del giro
    const slot = new THREE.Group(); slot.add(inner);
    if (n > 1) slot.position.set(-Math.abs(k - (n - 1) / 2) * len * 0.04, 0, (k - (n - 1) / 2) * len * 0.11); // en fila a lo ancho, la del medio adelantada
    acc.add(slot);
  }
  // centro + eje × (along × medio largo), a la altura del caparazón menos lo que se hunde
  const world = c.clone().addScaledVector(ax, t * half); world.y = top - H * (rolled ? 0.06 : def.sink ?? 0.1);
  acc.position.copy(world); acc.rotation.y = Math.atan2(-ax.z, ax.x);
  // se inclina con la curva del caparazón (pendiente del perfil de cúpula en ese punto): asienta como un sombrero
  const k = 0.92, slope = rolled ? 0 : -(H / half) * (k * k * t) / Math.sqrt(Math.max(0.05, 1 - (k * t) ** 2));
  acc.rotation.z = Math.atan(slope);
  model.add(acc);
  model.position.copy(saved[0]); model.quaternion.copy(saved[1]); model.scale.copy(saved[2]); parent?.add(model);
  return acc;
}

// Miniatura del atuendo para el Armario (se hace una vez por atuendo).
const thumbs = new Map();
export function outfitThumb(id) {
  if (thumbs.has(id)) return thumbs.get(id);
  const c = document.createElement('canvas'); c.width = c.height = 96;
  shoot(c.getContext('2d'), 96, 96, piece(OUTFITS[id], 1), { yaw: 0.5, pitch: 0.45, fill: 0.8 });
  const url = c.toDataURL(); thumbs.set(id, url); return url;
}
