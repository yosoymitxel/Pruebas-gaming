// Archipiélago: los terrarios y dioramas del día en miniatura, flotando y meciéndose. Se eligen tocándolos.
import * as THREE from 'three';
import { islandFromGrid } from './island.js';
import { dress } from './scenes.js';
import { createGrid, openRect } from '../game/grid.js';

const SCALE = 0.7, SPREAD = [30, 24];

function miniGrid(seed) {
  const g = createGrid(8, 8);
  for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) {
    const d = Math.hypot(i + 0.5 - 4, j + 0.5 - 4), edge = 3.3 + Math.sin(Math.atan2(j - 4, i - 4) * 3 + seed) * 0.5;
    if (d < edge) openRect(g, i, j, 1, 1);
  }
  return g;
}

export class ArchipelagoView {
  constructor(stage, game) {
    this.stage = stage;
    this.group = new THREE.Group();
    this.models = [];
    // En vertical el mapa se reparte a lo alto (girado) para que las islas no queden diminutas.
    this.tall = stage.camera.aspect < 1;
    const [sx, sz] = this.tall ? [SPREAD[1] * 0.85, SPREAD[0] * 1.9] : SPREAD;
    this.fitW = sx + 8;
    for (const isl of game.islands) {
      const home = isl.kind === 'hogar';
      const grid = home ? game.home.grid : miniGrid(isl.seed % 7);
      const island = islandFromGrid(grid, { seed: isl.seed, rim: home ? 1 : 0, relief: home ? 0.3 : 0.6 });
      dress(island.group, isl.vessel ?? (home ? 'tanque' : 'frasco'), island, grid, isl.seed);
      const root = new THREE.Group();
      root.add(island.group);
      root.scale.setScalar(home ? SCALE * 0.75 : SCALE);
      const [u, v] = this.tall ? [isl.y - 0.45, 0.5 - isl.x] : [isl.x - 0.5, isl.y - 0.45];
      root.position.set(u * sx, 0, v * sz);
      root.userData.island = isl.id;
      this.group.add(root);
      this.models.push({ root, isl, phase: (isl.seed % 100) / 15 });
    }
    this.ray = new THREE.Raycaster();
  }

  get camera() { return { target: [0, 0], distance: 36, fit: this.fitW }; }

  update(time) {
    for (const m of this.models) {
      m.root.position.y = Math.sin(time * 0.8 + m.phase) * 0.35;
      m.root.rotation.y = Math.sin(time * 0.2 + m.phase) * 0.15;
    }
  }

  // Isla bajo el puntero (id) o null.
  pick(ev) {
    const r = this.stage.renderer.domElement.getBoundingClientRect();
    this.ray.setFromCamera(new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1), this.stage.camera);
    const hit = this.ray.intersectObjects(this.models.map((m) => m.root), true)[0];
    let o = hit?.object;
    while (o && !o.userData.island) o = o.parent;
    return o?.userData.island ?? null;
  }

  // Dónde poner el rótulo de cada isla (px de pantalla): el rombo encima de su propia isla.
  labelAt(id) {
    const m = this.models.find((x) => x.isl.id === id);
    return this.stage.project(m.root.position.x, m.root.position.y + 1.6, m.root.position.z);
  }
}
