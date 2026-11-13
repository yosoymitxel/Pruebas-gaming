// Escenario único: un renderer, una cámara inclinada de diorama y el pase de tinta. Las escenas
// (terrario, isla, arena) son grupos que se cambian sin recrear el contexto WebGL.
import * as THREE from 'three';
import { createInkPass, FILTERS } from './ink.js';
import { PALETTES } from '../data/palettes.js';
import { createBackdrop } from './backdrop.js';
import { PixelFx } from './pixfx.js';

export const TILT = 0.95; // radianes desde la vertical
export const DEFAULT_YAW = 0.35;
const ZOOM = [0.55, 1.35];

export class Stage {
  constructor(container) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setClearColor(0x000000, 0);
    // Resolución adaptativa (web-performance): empieza en min(dpr, 1.5) y baja o sube según el tiempo de
    // fotograma medido; el pase de tinta es caro por píxel y en móvil manda la GPU.
    this.maxRatio = Math.min(devicePixelRatio, 2); // nítido: antes 1,5 y bajaba a 0,75 (todo se veía borroso)
    this.renderer.setPixelRatio(this.maxRatio);
    this.frameMs = 16; this.frames = 0;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.5, 160);
    this.target = new THREE.Vector3();
    this.distance = 22;
    this.yaw = 0;
    this.zoomK = 1;
    this.shakeT = 0;
    this.root = new THREE.Group();
    this.backdrop = createBackdrop();
    this.scene.add(this.root, this.backdrop.group);
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(-7, 16, -4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 50 });
    sun.shadow.bias = -0.0015;
    this.sun = sun; this.hemi = new THREE.HemisphereLight(0xfff6e0, 0x6b5a48, 1.6);
    this.scene.add(sun, sun.target, this.hemi);
    this.pixfx = new PixelFx();
    this.ink = createInkPass();
    this.rt = new THREE.WebGLRenderTarget(1, 1, { depthTexture: new THREE.DepthTexture(1, 1) });
    this.ink.material.uniforms.tColor.value = this.rt.texture;
    this.ink.material.uniforms.tDepth.value = this.rt.depthTexture;
    this.setMood(0);
    this.ray = new THREE.Raycaster();
    this.ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.resize();
    new ResizeObserver(() => this.resize()).observe(container);
  }

  // 0 = cozy (terrario e islas), 1 = terror (expedición). Valores intermedios mezclan.
  setMood(m) {
    const paper = new THREE.Color(PALETTES.cozy.paper).lerp(new THREE.Color(PALETTES.terror.paper), m);
    const ink = new THREE.Color(PALETTES.cozy.ink).lerp(new THREE.Color(PALETTES.terror.ink), m);
    const u = this.ink.material.uniforms;
    u.paper.value.copy(paper); u.ink.value.copy(ink);
    u.night.value.copy(new THREE.Color(PALETTES.cozy.night).lerp(new THREE.Color(PALETTES.terror.night), m));
    u.wash.value = 1 - 0.45 * m;
    u.gloom.value = m;
  }

  // Hora del día (reloj 0–1): el sol da la vuelta y la luz pasa de cálida a azul de noche, con rampas de
  // color desplazadas (sombras violetas, luces amarillas) como en pixel-plays. null = luz neutra (nido).
  setTime(clock) {
    const keys = [[0, 0xffb27a, 1.4, 0xffd9b0, 1.2], [0.15, 0xffffff, 2.2, 0xfff6e0, 1.6], [0.55, 0xfff3d6, 2.1, 0xfff6e0, 1.5],
      [0.68, 0xff8a5a, 1.5, 0xffc4a0, 1.15], [0.78, 0xcdd6ff, 1.6, 0xbcc4e6, 1.5], [0.95, 0xc6d0ff, 1.55, 0xb4bde2, 1.45], [1, 0xffb27a, 1.4, 0xffd9b0, 1.2]];
    const c = clock ?? 0.35;
    let k = 0; while (k < keys.length - 2 && c > keys[k + 1][0]) k++;
    const [a, b] = [keys[k], keys[k + 1]], f = (c - a[0]) / (b[0] - a[0] || 1);
    this.sun.color.set(a[1]).lerp(new THREE.Color(b[1]), f);
    this.sun.intensity = a[2] + (b[2] - a[2]) * f;
    this.hemi.color.set(a[3]).lerp(new THREE.Color(b[3]), f);
    this.hemi.intensity = a[4] + (b[4] - a[4]) * f;
    const ang = (c - 0.35) * Math.PI * 2;
    this.sun.position.set(Math.sin(ang) * -12, 16, Math.cos(ang) * -6);
  }

  // `fit`: ancho del mundo (celdas) que debe caber a lo ancho; en vertical aleja la cámara lo justo.
  setScene(group, { target = [0, 0], distance = 22, fit = 0 } = {}) {
    this.root.clear();
    this.pixfx.clear();
    this.root.add(group);
    this.bounds = null;
    this.backdrop.group.visible = group.children.length > 0;
    this.yaw = DEFAULT_YAW;
    this.zoomK = 1;
    this.frame(target, distance, fit);
  }

  // Seguir un punto del suelo con suavidad (k por segundo); la cámara puede dejar parte de la escena fuera.
  follow(x, z, dt, k = 4) {
    const a = 1 - Math.exp(-k * dt);
    this.frame([this.target.x + (x - this.target.x) * a, this.target.z + (z - this.target.z) * a], this.distance, this.fit);
  }

  // Girar alrededor del centro y acercar/alejar (la cámara siempre mira al diorama desde arriba).
  rotate(da) { this.yaw += da; this.frame([this.target.x, this.target.z], this.distance, this.fit); }
  zoom(f) { this.zoomK = Math.min(ZOOM[1], Math.max(ZOOM[0], this.zoomK * f)); this.frame([this.target.x, this.target.z], this.distance, this.fit); }

  frame([x, z], distance, fit = this.fit ?? 0) {
    // la vista no se escapa de la escena: el punto que mira queda dentro de `bounds` (radio) si la escena lo pide
    const r = this.bounds, d0 = Math.hypot(x, z);
    if (r && d0 > r) { x *= r / d0; z *= r / d0; }
    this.target.set(x, 0, z);
    this.distance = distance;
    this.fit = fit;
    const halfH = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)), halfW = halfH * this.camera.aspect;
    const d = Math.max(distance, fit / 2 / halfW) * this.zoomK;
    this.camDist = d;
    this.camera.position.set(x + Math.sin(this.yaw) * Math.sin(TILT) * d, Math.cos(TILT) * d, z + Math.cos(this.yaw) * Math.sin(TILT) * d);
    this.camera.lookAt(this.target);
  }

  resize() {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    const dpr = this.renderer.getPixelRatio();
    this.rt.setSize(w * dpr, h * dpr);
    const u = this.ink.material.uniforms;
    u.res.value.set(w * dpr, h * dpr); u.dpr.value = dpr;
    this.frame([this.target.x, this.target.z], this.distance, this.fit);
  }

  // Fondo vacío: lo pinta el CSS de #stage según clima y ánimo (el lienzo es transparente donde no hay nada).
  setSky(weather, mood = 'cozy') { Object.assign(this.container.dataset, { weather, mood }); }

  setFilter(name) { this.ink.material.uniforms.look.value = Math.max(0, FILTERS.indexOf(name)); }

  shake(amount) { this.shakeT = Math.max(this.shakeT, amount); }

  // Cada segundo: si el fotograma medio pasa de 24 ms baja la resolución un 20 %; si va holgado (< 13 ms), sube.
  adapt(dt) {
    this.frameMs += (dt * 1000 - this.frameMs) * 0.1;
    if ((this.frames += dt) < 1) return;
    this.frames = 0;
    const r = this.renderer.getPixelRatio();
    const next = this.frameMs > 24 ? Math.max(1, r * 0.85) : this.frameMs < 13 ? Math.min(this.maxRatio, r * 1.15) : r;
    if (Math.abs(next - r) > 0.01) { this.renderer.setPixelRatio(next); this.resize(); }
  }

  render(time, dt = 1 / 60) {
    this.adapt(dt);
    const u = this.ink.material.uniforms;
    if (this.shakeT > 0) {
      this.frame([this.target.x, this.target.z], this.distance, this.fit);
      this.shakeT = Math.max(0, this.shakeT - 1 / 60);
      const k = this.shakeT * 0.6;
      this.camera.position.x += (Math.random() - 0.5) * k; this.camera.position.y += (Math.random() - 0.5) * k;
      if (!this.shakeT) this.frame([this.target.x, this.target.z], this.distance, this.fit);
    }
    u.time.value = time; u.near.value = this.camera.near; u.far.value = this.camera.far;
    u.fogNear.value = this.camDist * 0.95; u.fogFar.value = this.camDist * 1.5;
    this.backdrop.update(time);
    this.renderer.setRenderTarget(this.rt);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.ink.scene, this.ink.camera);
    this.pixfx.update(dt);
    if (this.pixfx.live.length) { this.renderer.autoClear = false; this.renderer.render(this.pixfx.scene, this.camera); this.renderer.autoClear = true; }
  }

  // Punto del suelo (x, z del mundo) a la altura `y` bajo un evento de puntero, o null.
  pick(ev, y = 0) {
    const r = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    this.ray.setFromCamera(ndc, this.camera);
    const p = new THREE.Vector3();
    this.ground.constant = -y;
    return this.ray.ray.intersectPlane(this.ground, p) ? { x: p.x, z: p.z } : null;
  }

  // Posición en píxeles CSS de un punto del mundo (para números de daño y rótulos).
  project(x, y, z) {
    const v = new THREE.Vector3(x, y, z).project(this.camera);
    return { x: (v.x + 1) / 2 * this.container.clientWidth, y: (1 - v.y) / 2 * this.container.clientHeight, visible: v.z < 1 };
  }
}
