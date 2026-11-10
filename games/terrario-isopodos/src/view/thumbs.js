// Miniatura de cada pieza para la interfaz: el mismo modelo 3D del terrario, de tres cuartos, renderizado con el
// renderer de la escena en un objetivo aparte y contorneado en tinta (como lo dibuja el pase de tinta).
import * as THREE from 'three';
import { propMesh } from './props.js';
import { PALETTES } from '../data/palettes.js';

const W = 192, H = 144, cache = new Map();
let rig = null;

function setup() {
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xfff6e0, 0x6b5a48, 1.7));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(-4, 8, 5); scene.add(sun);
  const cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 100);
  const rt = new THREE.WebGLRenderTarget(W, H, { colorSpace: THREE.SRGBColorSpace });
  return { scene, cam, rt, buf: new Uint8Array(W * H * 4) };
}

export function pieceThumb(renderer, type) {
  if (cache.has(type)) return cache.get(type);
  rig ??= setup();
  const { scene, cam, rt, buf } = rig, m = propMesh(type);
  scene.add(m);
  const box = new THREE.Box3().setFromObject(m), c = box.getCenter(new THREE.Vector3()), r = box.getSize(new THREE.Vector3()).length() / 2;
  const d = r / Math.sin(THREE.MathUtils.degToRad(15)) * 0.92;
  cam.position.set(c.x + d * 0.55, c.y + d * 0.6, c.z + d * 0.58); cam.lookAt(c);
  const prev = renderer.getRenderTarget(), clear = renderer.getClearAlpha();
  renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, cam);
  renderer.readRenderTargetPixels(rt, 0, 0, W, H, buf);
  renderer.setRenderTarget(prev); renderer.setClearAlpha(clear);
  scene.remove(m);
  // a canvas (volteado: WebGL lee de abajo arriba) y contorno de tinta por dilatación de la silueta
  const src = document.createElement('canvas'); src.width = W; src.height = H;
  const img = src.getContext('2d').createImageData(W, H);
  for (let y = 0; y < H; y++) img.data.set(buf.subarray((H - 1 - y) * W * 4, (H - y) * W * 4), y * W * 4);
  src.getContext('2d').putImageData(img, 0, 0);
  const out = document.createElement('canvas'); out.width = W; out.height = H;
  const o = out.getContext('2d');
  for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [-1.5, -1.5], [1.5, 1.5], [-1.5, 1.5], [1.5, -1.5]]) o.drawImage(src, dx, dy);
  o.globalCompositeOperation = 'source-in'; o.fillStyle = PALETTES.cozy.ink; o.fillRect(0, 0, W, H);
  o.globalCompositeOperation = 'source-over'; o.drawImage(src, 0, 0);
  const url = out.toDataURL();
  cache.set(type, url);
  return url;
}
