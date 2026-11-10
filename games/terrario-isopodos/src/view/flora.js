// Vegetación de recorte (como en Cult of the Lamb): matas, tréboles, arbustos con bayas y flores
// dibujados en lienzo con contorno de tinta, en dos planos cruzados para verse desde cualquier giro.
import * as THREE from 'three';
import { PALETTES } from '../data/palettes.js';

const P = PALETTES.cozy;
const S = 128;

const DRAW = {
  pasto(c) { // mata de hojas largas
    for (let k = 0; k < 9; k++) {
      const x = S * (0.2 + k * 0.075), lean = (k - 4) * 5, top = S * (0.12 + ((k * 37) % 5) * 0.05);
      c.beginPath(); c.moveTo(x - 6, S); c.quadraticCurveTo(x + lean * 0.4, S * 0.5, x + lean, top); c.quadraticCurveTo(x + lean * 0.3 + 4, S * 0.55, x + 6, S); c.closePath();
      c.fillStyle = k % 3 ? P.grass : P.moss; c.fill(); c.stroke();
    }
  },
  trebol(c) { // tres o cuatro tréboles
    [[0.3, 0.62, 18], [0.62, 0.5, 22], [0.5, 0.78, 16]].forEach(([x, y, r]) => {
      c.beginPath(); c.moveTo(x * S, y * S); c.lineTo(x * S, S); c.stroke();
      for (let a = 0; a < 3; a++) { const t = a * 2.09 - 1.57; c.beginPath(); c.arc(x * S + Math.cos(t) * r * 0.7, y * S + Math.sin(t) * r * 0.7, r * 0.62, 0, Math.PI * 2); c.fillStyle = P.grass; c.fill(); c.stroke(); }
    });
  },
  arbusto(c) { // mata redonda con bayas rojas
    [[0.32, 0.62, 30], [0.68, 0.6, 30], [0.5, 0.42, 34]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x * S, y * S, r, 0, Math.PI * 2); c.fillStyle = P.moss; c.fill(); c.stroke(); });
    c.fillStyle = P.rust;
    [[0.4, 0.4], [0.62, 0.5], [0.3, 0.66], [0.55, 0.3], [0.72, 0.68]].forEach(([x, y]) => { c.beginPath(); c.arc(x * S, y * S, 6, 0, Math.PI * 2); c.fill(); c.stroke(); });
    c.fillStyle = P.moss; c.fillRect(S * 0.2, S * 0.8, S * 0.6, S * 0.2);
  },
  flor(c) { // matojo bajo con florecitas blancas
    DRAW.trebol(c);
    [[0.25, 0.4], [0.7, 0.3], [0.5, 0.55]].forEach(([x, y]) => {
      for (let a = 0; a < 5; a++) { const t = a * 1.256; c.beginPath(); c.arc(x * S + Math.cos(t) * 7, y * S + Math.sin(t) * 7, 5.5, 0, Math.PI * 2); c.fillStyle = P.paper; c.fill(); c.stroke(); }
      c.beginPath(); c.arc(x * S, y * S, 4, 0, Math.PI * 2); c.fillStyle = P.amber; c.fill();
    });
  },
};
export const FLORA = Object.keys(DRAW);

// Vaivén con el viento (como las plantas de pixel-plays): solo la parte alta se mueve. Un reloj compartido
// que avanzan las escenas; con movimiento reducido se queda quieto.
export const sway = { value: 0 };
const windy = (mat) => {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uSway = sway;
    sh.vertexShader = 'uniform float uSway;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      float sw = sin(uSway * 1.7 + instanceMatrix[3].x * 1.3 + instanceMatrix[3].z * 0.7) * 0.07 * position.y;
      transformed.x += sw; transformed.z += sw * 0.5;`);
  };
  return mat;
};

const textures = {};
function texture(kind) {
  if (textures[kind]) return textures[kind];
  const cv = document.createElement('canvas'); cv.width = cv.height = S;
  const c = cv.getContext('2d');
  c.lineWidth = 4; c.strokeStyle = P.ink; c.lineJoin = 'round';
  DRAW[kind](c);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  return (textures[kind] = t);
}

const cross = () => {
  const a = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0), b = a.clone().rotateY(Math.PI / 2);
  const g = new THREE.BufferGeometry();
  for (const k of ['position', 'normal', 'uv']) g.setAttribute(k, new THREE.Float32BufferAttribute([...a.attributes[k].array, ...b.attributes[k].array], a.attributes[k].itemSize));
  g.setIndex([...a.index.array, ...Array.from(b.index.array, (i) => i + 4)]);
  return g;
};

// `points`: [x, y, z, escala, tipo, giro]. Una malla instanciada por tipo.
export function flora(points) {
  const group = new THREE.Group(), geo = cross(), m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  for (const kind of FLORA) {
    const list = points.filter((p) => p[4] === kind);
    if (!list.length) continue;
    // Medio autoiluminada: se lee plana como un recorte pintado, pero se apaga con la noche.
    const mat = windy(new THREE.MeshLambertMaterial({ map: texture(kind), emissiveMap: texture(kind), emissive: 0xffffff, emissiveIntensity: 0.45, alphaTest: 0.5, side: THREE.DoubleSide }));
    const inst = new THREE.InstancedMesh(geo, mat, list.length);
    list.forEach(([x, y, z, k, , r], i) => inst.setMatrixAt(i, m.compose(new THREE.Vector3(x, y, z), q.setFromAxisAngle(up, r), new THREE.Vector3(k, k, k))));
    group.add(inst);
  }
  return group;
}
