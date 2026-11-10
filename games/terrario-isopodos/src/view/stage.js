// Escenario único: un renderer, una cámara inclinada de diorama y el pase de tinta. Las escenas
// (terrario, isla, arena) son grupos que se cambian sin recrear el contexto WebGL.
import * as THREE from 'three';
import { createInkPass } from './ink.js';
import { PALETTES } from '../data/palettes.js';

const TILT = 0.95; // radianes desde la vertical
const ZOOM = [0.55, 1.35];

export class Stage {
  constructor(container) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.5, 120);
    this.target = new THREE.Vector3();
    this.distance = 22;
    this.yaw = 0;
    this.zoomK = 1;
    this.shakeT = 0;
    this.root = new THREE.Group();
    this.scene.add(this.root);
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(-7, 16, -4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -13, right: 13, top: 13, bottom: -13, near: 1, far: 50 });
    sun.shadow.bias = -0.0015;
    this.scene.add(sun, sun.target, new THREE.HemisphereLight(0xfff6e0, 0x6b5a48, 1.1));
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
    u.wash.value = 0.8 - 0.45 * m;
    u.gloom.value = m;
    this.scene.background = paper;
  }

  // `fit`: ancho del mundo (celdas) que debe caber a lo ancho; en vertical aleja la cámara lo justo.
  setScene(group, { target = [0, 0], distance = 22, fit = 0 } = {}) {
    this.root.clear();
    this.root.add(group);
    this.yaw = 0.35;
    this.zoomK = 1;
    this.frame(target, distance, fit);
  }

  // Girar alrededor del centro y acercar/alejar (la cámara siempre mira al diorama desde arriba).
  rotate(da) { this.yaw += da; this.frame([this.target.x, this.target.z], this.distance, this.fit); }
  zoom(f) { this.zoomK = Math.min(ZOOM[1], Math.max(ZOOM[0], this.zoomK * f)); this.frame([this.target.x, this.target.z], this.distance, this.fit); }

  frame([x, z], distance, fit = this.fit ?? 0) {
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

  shake(amount) { this.shakeT = Math.max(this.shakeT, amount); }

  render(time) {
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
    this.renderer.setRenderTarget(this.rt);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.ink.scene, this.ink.camera);
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
