// Bichos en 3D low-poly (Polyfork, src/vendor/polyfork, uso comercial sin atribución) fotografiados a un lienzo:
// el juego los sigue usando como sprites (mismo billboard, misma tinta), pero el dibujo sale de un modelo real.
// Isópodos: la cochinilla recoloreada por especie (los Porcellio más planos y estirados); enemigos: un modelo por bicho.
import * as THREE from 'three';
import * as Pill from '../vendor/polyfork/pill-woodlouse-base.mjs';
import * as Centipede from '../vendor/polyfork/stone-centipede-base.mjs';
import * as Tarantula from '../vendor/polyfork/tarantula-base.mjs';
import * as Aphid from '../vendor/polyfork/green-aphid-base.mjs';
import * as Caterpillar from '../vendor/polyfork/swallowtail-caterpillar-base.mjs';
import * as Slug from '../vendor/polyfork/leopard-slug-base.mjs';
import * as Wasp from '../vendor/polyfork/common-wasp-base.mjs';
import * as Stag from '../vendor/polyfork/stag-beetle-906c6e.mjs';
import * as Orb from '../vendor/polyfork/garden-orb-weaver-b32844.mjs';
import * as Worm from '../vendor/polyfork/earthworm-4a0bde.mjs';
import { SPECIES } from '../data/species.js';

let renderer = null;
function studio() {
  if (renderer) return renderer;
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  return renderer;
}

// Foto de perfil de tres cuartos, mirando a la derecha, encuadrada al lienzo y apoyada abajo.
function shoot(c, w, h, group, { yaw = 0, pitch = 0.32, fill = 0.92 } = {}) {
  const r = studio();
  r.setSize(w, h, false);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xfff6e4, 0x3a3326, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 1.8); sun.position.set(-2, 4, 3); scene.add(sun);
  const pivot = new THREE.Group(); pivot.add(group); pivot.rotation.y = yaw; scene.add(pivot);
  pivot.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(pivot), size = box.getSize(new THREE.Vector3()), mid = box.getCenter(new THREE.Vector3());
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
  cam.position.set(mid.x, mid.y + Math.sin(pitch) * 10, mid.z + Math.cos(pitch) * 10);
  cam.lookAt(mid);
  cam.updateMatrixWorld(true);
  // Encaje: proyecta la caja a la cámara y ajusta el frustum con el aspecto del lienzo.
  const pts = [];
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) pts.push(new THREE.Vector3(x, y, z).applyMatrix4(cam.matrixWorldInverse));
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  let [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const sw = (x1 - x0) / fill, sh = (y1 - y0) / fill, aspect = w / h, half = Math.max(sw / aspect, sh) / 2, cx = (x0 + x1) / 2;
  cam.left = cx - half * aspect; cam.right = cx + half * aspect;
  cam.bottom = y0 - (y1 - y0) * (1 - fill) * 0.5; cam.top = cam.bottom + half * 2;
  cam.updateProjectionMatrix();
  r.render(scene, cam);
  c.drawImage(r.domElement, 0, 0, w, h);
  group.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
}

const shade = (hex, t) => '#' + new THREE.Color(hex).lerp(new THREE.Color(t > 0 ? '#ffffff' : '#000000'), Math.abs(t)).getHexString();

// Isópodo de la especie: caparazón y bordes con sus colores; los que no se enrollan, más planos y largos.
export function isopodModel(id, { rolled = false, molt = false } = {}) {
  const s = SPECIES[id] ?? SPECIES.vulgare, [c0, c1, c2] = s.colors, flat = s.body === 'plano' || s.body === 'fino';
  return Pill.createAsset({
    shell: molt ? '#e8e0cc' : c0, rim: s.pattern === 'liso' ? shade(c0, 0.35) : c1, under: shade(c2, 0.1), belly: shade(c0, -0.2),
    rolled, dome: flat ? 0.8 : s.body === 'pato' ? 1.15 : 1, breadth: s.body === 'fino' ? 0.8 : 1, antennae: flat ? 1.4 : 1,
  });
}
export const drawIsopod3D = (c, w, h, id, opts = {}) => shoot(c, w, h, isopodModel(id, opts), { yaw: Math.PI / 2 - 0.45 });
export const drawBall3D = (c, w, h, id) => shoot(c, w, h, isopodModel(id, { rolled: true }), { yaw: 0.6, fill: 0.8 });

// Enemigos: modelo y colores del nido (pálidos y enfermos, nada de verde de jardín).
const FOES = {
  larva: () => Caterpillar.createAsset({ skin: '#e2dccb', pale: '#f1ece0', band: '#b8ae98', spots: '#5a3a2a', legs: '#3a2a20', girth: 1.2 }),
  acaro: () => Aphid.createAsset({ body: '#b8322a', legs: '#8a2a20', dark: '#5a1a14', eyes: '#1a0a08', fullness: 1.2 }),
  cienpies: () => Centipede.createAsset({ colorway: 'chestnut' }),
  arana: () => Tarantula.createAsset({}),
  mosca: () => Wasp.createAsset({ colorway: 'hornet' }),
  moho: () => Slug.createAsset({ body: '#c9bd6a', mantle: '#b8ab55', spots: '#4a3a5a', pale: '#ddd28a', sole: '#6a5f2a' }),
};
export const FOE_MODELS = Object.keys(FOES);

// Élites y jefes (antes ilustraciones planas): mismos modelos del kit, grandes y con color de pesadilla.
const ELITES = {
  'el-segador.webp': () => Stag.createAsset({ colorway: 'ebony', mandibles: 1.2 }),
  'el-bufon.webp': () => Orb.createAsset({ abdomen: '#d9cfe0', folium: '#5a2e6a', marks: '#f2ebdf', carapace: '#c9b8d4', legs: '#8a7a96', bands: '#3a2440', tips: '#1a1020', size: 1.4 }),
  'la-gemela.webp': () => Tarantula.createAsset({ body: '#d8d0c0', abdomen: '#e6dfd0', band: '#7a1f2a', tips: '#2a2420', size: 1.5 }),
  'el-comensal.webp': () => Worm.createAsset({ skin: '#8a6f6a', saddle: '#b08a80', mouth: '#3a0f12', girth: 1.2, swell: 1, length: 1.25 }),
};

// Modelo vivo para la escena (no foto) según la clave de sprite: 'iso|ball|molt:<especie>' o 'proc:<enemigo>'.
export function liveModel(key) {
  const [kind, arg] = key.split(':');
  if (kind === 'iso' || kind === 'molt') return isopodModel(arg, { molt: kind === 'molt' });
  if (kind === 'ball') return isopodModel(arg, { rolled: true });
  if (kind === 'proc' && FOES[arg]) return FOES[arg]();
  const elite = ELITES[key];
  if (elite) return elite();
  return null;
}
export const drawFoe3D = (kind) => (c, w, h) => shoot(c, w, h, FOES[kind](), { yaw: Math.PI / 2 - 0.45 });

// Foto de cualquier modelo vivo (retratos, pruebas).
export const drawLive3D = (c, w, h, key) => shoot(c, w, h, liveModel(key), { yaw: Math.PI / 2 - 0.45 });
