// Escenario: un renderer, cámara inclinada de diorama que gira y acerca, y el pase de tinta (ink.js).
// Las escenas son grupos que se cambian con setScene() sin recrear WebGL.
import * as THREE from 'three';
import { createInkPass, FILTERS } from './ink.js';
import { PALETTE } from '../data/palettes.js';

const TILT = 0.95;

export class Stage {
  constructor(container) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    container.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(PALETTE.paper);
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.5, 160);
    this.root = new THREE.Group();
    this.scene.add(this.root);
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(-7, 16, -4);
    sun.castShadow = true;
    Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12 });
    this.scene.add(sun, new THREE.HemisphereLight(0xfff6e0, 0x6b5a48, 1.1));
    this.ink = createInkPass();
    this.rt = new THREE.WebGLRenderTarget(1, 1, { depthTexture: new THREE.DepthTexture(1, 1) });
    const u = this.ink.material.uniforms;
    u.tColor.value = this.rt.texture; u.tDepth.value = this.rt.depthTexture;
    u.paper.value.set(PALETTE.paper); u.ink.value.set(PALETTE.ink); u.wash.value = 0.8;
    this.yaw = 0.35; this.zoomK = 1; this.distance = 20; this.fit = 0;
    this.resize();
    new ResizeObserver(() => this.resize()).observe(container);
  }

  setFilter(name) { this.ink.material.uniforms.look.value = Math.max(0, FILTERS.indexOf(name)); }
  setScene(group, { distance = 20, fit = 0 } = {}) { this.root.clear(); this.root.add(group); this.distance = distance; this.fit = fit; this.frame(); }
  rotate(da) { this.yaw += da; this.frame(); }
  zoom(f) { this.zoomK = Math.min(1.4, Math.max(0.55, this.zoomK * f)); this.frame(); }

  frame() {
    const halfW = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * this.camera.aspect;
    const d = Math.max(this.distance, this.fit / 2 / halfW) * this.zoomK;
    this.camDist = d;
    this.camera.position.set(Math.sin(this.yaw) * Math.sin(TILT) * d, Math.cos(TILT) * d, Math.cos(this.yaw) * Math.sin(TILT) * d);
    this.camera.lookAt(0, 0, 0);
  }

  resize() {
    const w = this.container.clientWidth || 1, h = this.container.clientHeight || 1, dpr = this.renderer.getPixelRatio();
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.rt.setSize(w * dpr, h * dpr);
    const u = this.ink.material.uniforms;
    u.res.value.set(w * dpr, h * dpr); u.dpr.value = dpr;
    this.frame();
  }

  render(time) {
    const u = this.ink.material.uniforms;
    u.time.value = time; u.near.value = this.camera.near; u.far.value = this.camera.far;
    u.fogNear.value = this.camDist * 0.95; u.fogFar.value = this.camDist * 1.5;
    this.renderer.setRenderTarget(this.rt);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.ink.scene, this.ink.camera);
  }
}
