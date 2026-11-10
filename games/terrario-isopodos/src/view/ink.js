// Postproceso «cuaderno»: la escena 3D se pasa a papel y tinta. Contorno por saltos de profundidad y
// color, sombreado por punteado (más puntos cuanto más oscuro) y color en aguada sobre el papel.
// `wash` = cuánto color se ve (0 = solo tinta); `gloom` = deriva a la paleta de terror y viñeta.
// `tilt` 0–1: desenfoque arriba y abajo (efecto maqueta).
// La niebla (fogNear–fogFar, distancia a cámara) aclara lo lejano hacia el papel: da profundidad.
// `look` (FILTERS): 0 tinta · 1 CRT (curvatura, líneas, color separado) · 2 papel viejo (sepia, manchas).
export const FILTERS = ['tinta', 'crt', 'papel'];
import * as THREE from 'three';

export function createInkPass() {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      tColor: { value: null }, tDepth: { value: null }, res: { value: new THREE.Vector2(1, 1) },
      dpr: { value: 1 }, paper: { value: new THREE.Color() }, ink: { value: new THREE.Color() },
      wash: { value: 0.6 }, gloom: { value: 0 }, near: { value: 0.1 }, far: { value: 100 }, time: { value: 0 },
      fogNear: { value: 20 }, fogFar: { value: 40 }, look: { value: 0 }, tilt: { value: 1 },
    },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: /* glsl */`
      uniform sampler2D tColor, tDepth; uniform vec2 res; uniform float dpr, wash, gloom, near, far, time, fogNear, fogFar;
      uniform vec3 paper, ink; uniform int look; uniform float tilt; varying vec2 vUv;
      float depthAt(vec2 uv){ float z = texture2D(tDepth, uv).x * 2. - 1.; return 2. * near * far / (far + near - z * (far - near)); }
      float lum(vec3 c){ return dot(c, vec3(.299, .587, .114)); }
      float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
      float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
        return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
      void main(){
        vec2 px = 1. / res;
        vec2 uv = vUv;
        if (look == 1) { vec2 c = uv * 2. - 1.; c *= 1. + dot(c.yx, c.yx) * .045; uv = c * .5 + .5; }
        if (uv.x < 0. || uv.y < 0. || uv.x > 1. || uv.y > 1.) { gl_FragColor = vec4(ink * .5, 1.); return; }
        if (texture2D(tDepth, uv).x >= .99999) { gl_FragColor = vec4(0.); return; } // vacío: lo pinta el CSS
        vec3 col = texture2D(tColor, uv).rgb;
        if (look == 1) { col.r = texture2D(tColor, uv + vec2(px.x * 2. * dpr, 0.)).r; col.b = texture2D(tColor, uv - vec2(px.x * 2. * dpr, 0.)).b; }
        // Tilt-shift (como Cult of the Lamb): arriba y abajo se desenfoca y la escena parece una maqueta.
        float blur = tilt * smoothstep(.2, .5, abs(uv.y - .5));
        if (blur > .02) {
          vec3 acc = col; float r = blur * 3.5 * dpr;
          for (int k = 0; k < 8; k++) { float a = float(k) * .785; acc += texture2D(tColor, uv + vec2(cos(a), sin(a)) * px * r).rgb; }
          col = acc / 9.;
        }
        float d = depthAt(uv);
        float edge = 0.;
        float ce = 0.;
        for (int i = 0; i < 4; i++) {
          vec2 o = (i == 0 ? vec2(1,0) : i == 1 ? vec2(-1,0) : i == 2 ? vec2(0,1) : vec2(0,-1)) * px * dpr * 1.2;
          float dn = depthAt(uv + o);
          edge += clamp(abs(dn - d) / max(d, .001) * 22. - .25, 0., 1.);
          ce += abs(lum(texture2D(tColor, uv + o).rgb) - lum(col));
        }
        edge = clamp(edge * .5 + smoothstep(.12, .35, ce), 0., 1.) * (1. - blur * .7);
        float dark = 1. - lum(col);
        vec2 cellPx = gl_FragCoord.xy / (3. * dpr);
        vec2 cell = floor(cellPx);
        float h = hash(cell + floor(time * 8.) * step(.5, gloom) * 7.);
        vec2 f = fract(cellPx) - .5;
        float dotMask = step(length(f), .36) * step(h, pow(max(dark - .48, 0.), 1.2) * 2.6) * (1. - blur * .6);
        float grain = hash(floor(gl_FragCoord.xy / dpr)) * .03;
        vec3 washed = mix(paper, col * mix(vec3(1.), paper * 1.08, .35), wash) - grain;
        vec3 outc = mix(washed, ink, max(edge, dotMask * .85));
        float fog = smoothstep(fogNear, fogFar, d) * step(d, far * .98);
        outc = mix(outc, paper, fog * .6);
        vec2 v = uv - .5;
        outc = mix(outc, ink, gloom * smoothstep(.35, .75, length(v * vec2(1., .9))) * .7);
        if (look == 1) {
          outc *= .82 + .18 * sin(gl_FragCoord.y / dpr * 3.1416 * .5);
          outc *= 1. - smoothstep(.45, .75, length(v)) * .55;
          outc += vec3(.02, .03, .0) * sin(time * 50.);
        } else if (look == 2) {
          float l = lum(outc);
          outc = mix(outc, vec3(l * 1.05, l * .9, l * .68), .75);
          float blot = smoothstep(.55, .8, vnoise(gl_FragCoord.xy / (90. * dpr)) * .6 + vnoise(gl_FragCoord.xy / (23. * dpr)) * .4);
          outc *= 1. - blot * .08 - hash(gl_FragCoord.xy) * .05;
          outc *= 1. - smoothstep(.4, .8, length(v)) * .35;
        }
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
