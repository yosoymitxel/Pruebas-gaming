// Recipientes de terrario: todo escenario del juego está dentro de uno. Vidrio casi invisible con el borde
// a tinta y dos reflejos, base de madera y boca; debajo del paisaje, las capas de un terrario real
// (grava de drenaje y carbón) se ven a través del cristal.
import * as THREE from 'three';
import { PALETTES } from '../data/palettes.js';

const P = PALETTES.cozy;
export const GRAVEL = [-1.2, -0.95], CHARCOAL = [-0.95, -0.82];
const ink = (opacity = 0.55) => new THREE.LineBasicMaterial({ color: P.ink, transparent: true, opacity });
const glassMat = () => new THREE.MeshBasicMaterial({ color: P.water, transparent: true, opacity: 0.07, depthWrite: false, side: THREE.DoubleSide });
const shine = () => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide });
const lambert = (hex) => new THREE.MeshLambertMaterial({ color: hex });

// Capas de drenaje bajo cada celda [x, z] (centro). Dos mallas instanciadas.
export function substrateCells(centers) {
  const g = new THREE.Group(), m = new THREE.Matrix4();
  for (const [[y0, y1], hex] of [[GRAVEL, P.stone], [CHARCOAL, P.ink]]) {
    const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, y1 - y0, 1), lambert(hex), centers.length);
    centers.forEach(([x, z], k) => { m.makeTranslation(x, (y0 + y1) / 2, z); inst.setMatrixAt(k, m); });
    inst.receiveShadow = true;
    g.add(inst);
  }
  return g;
}

export function substrateDisc(radius) {
  const g = new THREE.Group();
  for (const [[y0, y1], hex] of [[GRAVEL, P.stone], [CHARCOAL, P.ink]]) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, y1 - y0, 48), lambert(hex));
    m.position.y = (y0 + y1) / 2;
    g.add(m);
  }
  return g;
}

// Tanque rectangular: caja [x0, x1] × [z0, z1] de alto `height` sobre la base.
export function tank(x0, z0, x1, z1, height = 2) {
  const g = new THREE.Group();
  const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, y0 = GRAVEL[0], h = height - y0;
  const box = new THREE.BoxGeometry(w, h, d).translate(cx, y0 + h / 2, cz);
  g.add(new THREE.Mesh(box, glassMat()), new THREE.LineSegments(new THREE.EdgesGeometry(box), ink()));
  const plate = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.25, d + 0.5), lambert(P.bark));
  plate.position.set(cx, y0 - 0.125, cz);
  plate.castShadow = plate.receiveShadow = true;
  g.add(plate);
  for (const k of [0.18, 0.26]) { // reflejos en la cara frontal
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.12, h * 0.8), shine());
    s.position.set(x0 + w * k, y0 + h * 0.5, z1 + 0.01);
    s.rotation.z = -0.35;
    g.add(s);
  }
  return g;
}

// Frasco cilíndrico de radio `r` centrado en (cx, cz).
export function jar(r, height = 2.5, cx = 0, cz = 0) {
  const g = new THREE.Group();
  const y0 = GRAVEL[0], h = height - y0;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 64, 1, true), glassMat());
  body.position.set(cx, y0 + h / 2, cz);
  g.add(body);
  for (const y of [y0, height]) {
    const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(
      Array.from({ length: 64 }, (_, k) => new THREE.Vector3(cx + Math.cos((k / 64) * Math.PI * 2) * r, y, cz + Math.sin((k / 64) * Math.PI * 2) * r))), ink(0.6));
    g.add(ring);
  }
  const lip = new THREE.Mesh(new THREE.TorusGeometry(r, 0.08, 6, 64), lambert(P.amber));
  lip.rotation.x = Math.PI / 2;
  lip.position.set(cx, height, cz);
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.3, r + 0.4, 0.25, 64), lambert(P.bark));
  plate.position.set(cx, y0 - 0.125, cz);
  plate.receiveShadow = true;
  g.add(lip, plate);
  return g;
}

// Reflejos verticales del frasco: siempre del lado de la cámara (se reorientan con el giro).
export function jarShine(r, height = 2.5) {
  const g = new THREE.Group(), y0 = GRAVEL[0], h = height - y0;
  for (const a of [-0.55, -0.4]) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.14, h * 0.85), shine());
    s.position.set(Math.sin(a) * (r + 0.02), y0 + h / 2, Math.cos(a) * (r + 0.02));
    s.rotation.y = a;
    g.add(s);
  }
  return g;
}
