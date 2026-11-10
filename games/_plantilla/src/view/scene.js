// Escena del ejemplo: diorama flotante redondo, jugador y coleccionables. Solo dibuja el estado.
import * as THREE from 'three';
import { PALETTE } from '../data/palettes.js';
import { COLLECTIBLES } from '../data/collectibles.js';
import { ARENA_R } from '../game/game.js';

const mat = (hex) => new THREE.MeshLambertMaterial({ color: hex });

export class RoundView {
  constructor(game) {
    this.g = game;
    this.group = new THREE.Group();
    const floor = new THREE.Mesh(new THREE.CylinderGeometry(ARENA_R, ARENA_R * 0.95, 0.6, 48), mat(PALETTE.ground));
    floor.position.y = -0.3;
    floor.receiveShadow = true;
    const rock = new THREE.Mesh(new THREE.ConeGeometry(ARENA_R * 0.95, ARENA_R, 12, 3), mat(PALETTE.ink));
    rock.rotation.x = Math.PI;
    rock.position.y = -0.6 - ARENA_R / 2;
    this.player = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), mat(PALETTE.accent));
    this.player.castShadow = true;
    this.group.add(floor, rock, this.player);
    this.items = game.items.map((it) => {
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.25, 0), mat(PALETTE[COLLECTIBLES[it.kind].color]));
      m.position.set(it.x, 0.35, it.y);
      m.castShadow = true;
      this.group.add(m);
      return m;
    });
  }

  get camera() { return { distance: 20, fit: ARENA_R * 2 + 2 }; }

  update(time) {
    const p = this.g.player;
    this.player.position.set(p.x, 0.4 + Math.abs(Math.sin(time * 10)) * (Math.hypot(p.vx, p.vy) > 0.1 ? 0.12 : 0), p.y);
    this.g.items.forEach((it, k) => {
      this.items[k].visible = !it.taken;
      this.items[k].rotation.y = time + k;
      this.items[k].position.y = 0.35 + Math.sin(time * 2 + k) * 0.08;
    });
  }
}
