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

// Cuelga el atuendo `id` del modelo (ya centrado en `body`). Devuelve el objeto para poder quitarlo.
export function attachOutfit(model, id) {
  const def = OUTFITS[id];
  if (!def || !MODS[def.model]) return null;
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model), len = Math.max(box.max.x - box.min.x, box.max.z - box.min.z);
  const acc = piece(def, len);
  const head = def.slot === 'head' && model.getObjectByName('Head');
  if (head) {
    // en espacio del hueso: arriba del todo de la cabeza
    // la cabeza es un hueso (sin malla propia): su posición y, de alto, cerca de lo más alto del caparazón
    const top = head.getWorldPosition(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    top.lerp(c, 0.25); top.y = box.min.y + (box.max.y - box.min.y) * 0.78;
    head.worldToLocal(top); acc.position.copy(top);
    const inv = new THREE.Vector3(); head.getWorldScale(inv); acc.scale.divide(inv);
    head.add(acc);
  } else {
    acc.position.set((box.min.x + box.max.x) / 2, box.max.y - (box.max.y - box.min.y) * 0.12, (box.min.z + box.max.z) / 2);
    model.worldToLocal(acc.position);
    const inv = new THREE.Vector3(); model.getWorldScale(inv); acc.scale.divide(inv);
    if (def.model === 'twig') acc.rotation.y = 0.5;
    model.add(acc);
  }
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
