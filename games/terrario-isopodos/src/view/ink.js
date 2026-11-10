// Postproceso «cuaderno»: la escena 3D se pasa a papel y tinta. Contorno por saltos de profundidad y
// color, sombreado por punteado (más puntos cuanto más oscuro) y color en aguada sobre el papel.
// `wash` = cuánto color se ve (0 = solo tinta); `gloom` = deriva a la paleta de terror y viñeta.
// La niebla (fogNear–fogFar, distancia a cámara) aclara lo lejano hacia el papel: da profundidad.
import * as THREE from 'three';

export function createInkPass() {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      tColor: { value: null }, tDepth: { value: null }, res: { value: new THREE.Vector2(1, 1) },
      dpr: { value: 1 }, paper: { value: new THREE.Color() }, ink: { value: new THREE.Color() },
      wash: { value: 0.6 }, gloom: { value: 0 }, near: { value: 0.1 }, far: { value: 100 }, time: { value: 0 },
      fogNear: { value: 20 }, fogFar: { value: 40 },
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: /* glsl */`
      uniform sampler2D tColor, tDepth; uniform vec2 res; uniform float dpr, wash, gloom, near, far, time, fogNear, fogFar;
      uniform vec3 paper, ink; varying vec2 vUv;
      float depthAt(vec2 uv){ float z = texture2D(tDepth, uv).x * 2. - 1.; return 2. * near * far / (far + near - z * (far - near)); }
      float lum(vec3 c){ return dot(c, vec3(.299, .587, .114)); }
      float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      void main(){
        vec2 px = 1. / res;
        vec3 col = texture2D(tColor, vUv).rgb;
        float d = depthAt(vUv);
        float edge = 0.;
        float ce = 0.;
        for (int i = 0; i < 4; i++) {
          vec2 o = (i == 0 ? vec2(1,0) : i == 1 ? vec2(-1,0) : i == 2 ? vec2(0,1) : vec2(0,-1)) * px * dpr * 1.2;
          float dn = depthAt(vUv + o);
          edge += clamp(abs(dn - d) / max(d, .001) * 22. - .25, 0., 1.);
          ce += abs(lum(texture2D(tColor, vUv + o).rgb) - lum(col));
        }
        edge = clamp(edge * .5 + smoothstep(.12, .35, ce), 0., 1.);
        float dark = 1. - lum(col);
        vec2 cellPx = gl_FragCoord.xy / (3. * dpr);
        vec2 cell = floor(cellPx);
        float h = hash(cell + floor(time * 8.) * step(.5, gloom) * 7.);
        vec2 f = fract(cellPx) - .5;
        float dotMask = step(length(f), .36) * step(h, pow(max(dark - .48, 0.), 1.2) * 2.6);
        float grain = hash(floor(gl_FragCoord.xy / dpr)) * .03;
        vec3 washed = mix(paper, col * mix(vec3(1.), paper * 1.08, .35), wash) - grain;
        vec3 outc = mix(washed, ink, max(edge, dotMask * .85));
        float fog = smoothstep(fogNear, fogFar, d) * step(d, far * .98);
        outc = mix(outc, paper, fog * .6);
        vec2 v = vUv - .5;
        outc = mix(outc, ink, gloom * smoothstep(.35, .75, length(v * vec2(1., .9))) * .7);
        gl_FragColor = vec4(outc, 1.);
      }`,
    depthTest: false, depthWrite: false,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  const scene = new THREE.Scene();
  scene.add(quad);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  return { material, scene, camera };
}
