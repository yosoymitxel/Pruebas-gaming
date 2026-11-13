// Efectos de píxel de pixelfx dentro del diorama: cada uno se dibuja en su propio lienzo (tamaño del efecto),
// sube como textura sin suavizado y va en un sprite del mundo, encima del pase de tinta (no lo ensucia).
// Se redibuja en cada fotograma del juego (fluido, sin saltos).
import * as THREE from 'three';
import { createFrame, clearFrame, createFx, composite } from '../vendor/pixelfx/core/fx.js';
import { PIXEL_VFX } from '../data/vfx.js';

const mods = import.meta.glob('../vendor/pixelfx/fx/*/[!_]*.js', { eager: true });
const modOf = (id) => mods[`../vendor/pixelfx/fx/${id}.js`];
export const PIXEL_FX_IDS = Object.keys(mods).map((k) => k.slice('../vendor/pixelfx/fx/'.length, -3));

export class PixelFx {
  constructor() {
    this.scene = new THREE.Scene();
    this.live = [];
  }

  // kind: clave de PIXEL_VFX; (x, y, z): punto del mundo bajo el efecto.
  spawn(kind, x, y, z, extra = {}) {
    const def = PIXEL_VFX[kind], mod = def && modOf(def.fx);
    if (!mod) return;
    const [w, h] = mod.meta.size, [ox, oy] = mod.meta.origin ?? [w / 2, h];
    const frame = createFrame(w, h), img = new Uint8ClampedArray(w * h * 4);
    const tex = new THREE.DataTexture(img, w, h);
    tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.flipY = true; tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false }));
    const k = def.h / h;
    sprite.scale.set(w * k, h * k, 1);
    sprite.center.set(ox / w, 1 - oy / h);
    sprite.position.set(x, y + (def.lift ?? 0), z);
    this.scene.add(sprite);
    const fx = createFx(mod, { x: ox, y: oy, seed: Math.floor(Math.random() * 1e6), ...(def.palette && { palette: def.palette }), ...extra });
    this.live.push({ fx, frame, img, tex, sprite, life: def.life ?? Infinity, step: 0, acc: Infinity });
  }

  update(dt) {
    for (const e of this.live) {
      e.fx.update(dt);
      if (e.fx.t >= e.life) e.fx.stop();
      if ((e.acc += dt) < e.step) continue;
      e.acc = 0;
      clearFrame(e.frame);
      e.fx.draw(e.frame);
      composite(e.frame, e.img, null);
      e.tex.needsUpdate = true;
    }
    this.live = this.live.filter((e) => {
      if (!e.fx.done()) return true;
      this.scene.remove(e.sprite); e.tex.dispose(); e.sprite.material.dispose();
      return false;
    });
  }

  clear() { for (const e of this.live) { this.scene.remove(e.sprite); e.tex.dispose(); } this.live = []; }
}
