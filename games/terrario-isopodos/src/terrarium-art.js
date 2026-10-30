import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const BASE_Y = 0.19;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const smooth = value => { const t = clamp(value, 0, 1); return t * t * (3 - 2 * t); };

function rng(seed) {
  let n = seed >>> 0;
  return () => ((n = (1664525 * n + 1013904223) >>> 0) / 4294967296);
}

export function terrainHeightAt(x, z, shape = "rectangular", radius = 1.48) {
  const edge = shape === "rectangular"
    ? 1 - smooth((Math.max(Math.abs(x) / 1.58, Math.abs(z) / 1.02) - 0.79) / 0.21)
    : smooth((radius - Math.hypot(x, z)) / 0.24);
  const mound = (cx, cz, sx, sz, amplitude) =>
    amplitude * Math.exp(-(((x - cx) / sx) ** 2 + ((z - cz) / sz) ** 2) * 1.1);
  const hills =
    mound(-0.68, -0.34, 0.5, 0.46, 0.22) +
    mound(0.64, 0.43, 0.38, 0.34, 0.16) +
    mound(0.92, -0.48, 0.32, 0.29, 0.11) +
    mound(-0.96, 0.55, 0.34, 0.28, 0.075);
  const grain =
    Math.sin(x * 8.1 + z * 3.7) * 0.008 +
    Math.cos(z * 10.3 - x * 2.4) * 0.006 +
    Math.sin((x - z) * 17.0) * 0.002;
  return BASE_Y + (hills + grain) * edge - (1 - edge) * 0.012;
}

function texture(kind, seed) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const pixels = ctx.createImageData(128, 128);
  const random = rng(seed);
  const base = kind === "moss" ? [112, 143, 65] : kind === "bark" ? [105, 73, 45] : [112, 85, 54];
  for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
    const i = (y * 128 + x) * 4;
    const wave = Math.sin(x * 0.22 + Math.sin(y * 0.08) * 1.8) * Math.cos(y * 0.17) * 10;
    const grain = (random() - 0.5) * (kind === "moss" ? 32 : 24);
    pixels.data[i] = clamp(base[0] + grain + wave, 0, 255);
    pixels.data[i + 1] = clamp(base[1] + grain * 0.8 + wave * 0.75, 0, 255);
    pixels.data[i + 2] = clamp(base[2] + grain * 0.55 + wave * 0.4, 0, 255);
    pixels.data[i + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  map.wrapS = map.wrapT = T.RepeatWrapping;
  map.repeat.set(kind === "bark" ? 2 : 3, kind === "bark" ? 1 : 3);
  map.anisotropy = 4;
  return map;
}

function leafGeometry() {
  const positions = [], uvs = [], indices = [];
  const segments = 8;
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const width = 0.19 * Math.pow(Math.sin(Math.PI * t), 0.82);
    const ridge = Math.sin(Math.PI * t) * 0.025;
    positions.push(t, ridge, width, t, ridge, -width);
    uvs.push(t, 0, t, 1);
    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  return g;
}

function inside(x, z, shape, radius) {
  return shape === "rectangular"
    ? Math.abs(x) < 1.53 && Math.abs(z) < 0.98
    : Math.hypot(x, z) < radius - 0.08;
}

function point(random, shape, radius, margin = 0.1) {
  if (shape === "rectangular") return {
    x: (random() - 0.5) * (3.05 - margin),
    z: (random() - 0.5) * (1.92 - margin)
  };
  const a = random() * Math.PI * 2;
  const r = Math.sqrt(random()) * (radius - margin);
  return { x: Math.cos(a) * r, z: Math.sin(a) * r };
}

function addTube(group, points, radius, material, segments = 14) {
  const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)));
  const tube = new T.Mesh(new T.TubeGeometry(curve, segments, radius, 5, false), material);
  tube.castShadow = true;
  tube.receiveShadow = true;
  group.add(tube);
  return tube;
}

function addMergedTubes(group, paths, radius, material, segments = 24) {
  const geometries = paths.map(points => {
    const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)));
    return new T.TubeGeometry(curve, segments, radius, 5, false);
  });
  if (!geometries.length) return null;
  const merged = mergeGeometries(geometries, false);
  for (const geometry of geometries) geometry.dispose();
  if (!merged) throw new Error("No se pudieron combinar los tubos del hábitat");
  const tube = new T.Mesh(merged, material);
  tube.castShadow = true;
  tube.receiveShadow = true;
  group.add(tube);
  return tube;
}

function makeLeaves(random, geometry, material, shape, radius, count, palette, kind) {
  const mesh = new T.InstancedMesh(geometry, material, count);
  const dummy = new T.Object3D();
  let used = 0;
  for (let i = 0; i < count; i++) {
    const p = point(random, shape, radius, 0.06);
    const angle = random() * Math.PI * 2;
    const length = kind === "sprig" ? 0.055 + random() * 0.11 : 0.12 + random() * 0.22;
    const width = length * (kind === "sprig" ? 0.25 : 0.34);
    const direction = new T.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const up = new T.Vector3(0, 1, 0);
    if (kind === "sprig") {
      direction.y = -0.18 - random() * 0.25;
      direction.normalize();
    }
    const normal = new T.Vector3().crossVectors(direction, up).normalize();
    const vertical = new T.Vector3().crossVectors(normal, direction).normalize();
    const basis = new T.Matrix4().makeBasis(direction, vertical, normal);
    dummy.position.set(p.x, terrainHeightAt(p.x, p.z, shape, radius) + (kind === "sprig" ? 0.035 : 0.006), p.z);
    dummy.quaternion.setFromRotationMatrix(basis);
    dummy.rotateX(kind === "ground" ? -0.16 : 0);
    dummy.scale.set(length, 1, width);
    dummy.updateMatrix();
    mesh.setMatrixAt(used, dummy.matrix);
    mesh.setColorAt(used, new T.Color(palette[Math.floor(random() * palette.length)]));
    used++;
  }
  mesh.count = used;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  return mesh;
}

function terrainGeometry(shape, radius) {
  const positions = [], uvs = [], colors = [], indices = [];
  const add = (x, z) => {
    const y = terrainHeightAt(x, z, shape, radius);
    positions.push(x, y, z);
    uvs.push(x * 1.8 + 0.5, z * 1.8 + 0.5);
    const tint = clamp(0.93 + Math.sin(x * 7) * 0.025 + Math.cos(z * 9) * 0.02, 0.84, 1.02);
    colors.push(tint, tint * 0.95, tint * 0.86);
  };
  if (shape === "rectangular") {
    const nx = 36, nz = 24;
    for (let z = 0; z <= nz; z++) for (let x = 0; x <= nx; x++) {
      add(-1.6 + x / nx * 3.2, -1.05 + z / nz * 2.1);
    }
    for (let z = 0; z < nz; z++) for (let x = 0; x < nx; x++) {
      const a = z * (nx + 1) + x, b = a + 1, c = a + nx + 1, d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  } else {
    const rings = 16, sides = 56;
    add(0, 0);
    for (let ring = 1; ring <= rings; ring++) {
      const r = (radius - 0.025) * ring / rings;
      for (let j = 0; j < sides; j++) {
        const a = j / sides * Math.PI * 2;
        add(Math.cos(a) * r, Math.sin(a) * r);
      }
    }
    for (let j = 0; j < sides; j++) indices.push(0, 1 + ((j + 1) % sides), 1 + j);
    for (let ring = 1; ring < rings; ring++) {
      const previous = 1 + (ring - 1) * sides, current = 1 + ring * sides;
      for (let j = 0; j < sides; j++) {
        const next = (j + 1) % sides;
        const a = previous + j, b = previous + next, c = current + j, d = current + next;
        indices.push(a, b, c, b, d, c);
      }
    }
  }
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
  g.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  g.setIndex(indices);
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}

function addSubstrate(group, shape, spec, materials) {
  const round = shape !== "rectangular";
  const segments = shape === "esferico" ? 56 : 64;
  const gravel = round
    ? new T.CylinderGeometry(spec.floorRadius, spec.floorRadius, 0.07, segments)
    : new T.BoxGeometry(spec.floorWidth, 0.07, spec.floorDepth);
  const soil = round
    ? new T.CylinderGeometry(spec.floorRadius, spec.floorRadius, 0.13, segments)
    : new T.BoxGeometry(spec.floorWidth, 0.13, spec.floorDepth);
  const humus = round
    ? new T.CylinderGeometry(spec.floorRadius, spec.floorRadius, 0.025, segments)
    : new T.BoxGeometry(spec.floorWidth, 0.035, spec.floorDepth);
  const layers = [
    [gravel, materials.gravel, 0.035],
    [soil, materials.soil, 0.135],
    [humus, materials.humus, 0.18]
  ];
  for (const [geometry, material, y] of layers) {
    const mesh = new T.Mesh(geometry, material);
    mesh.position.y = y;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  const top = new T.Mesh(terrainGeometry(shape, spec.floorRadius ?? 1.48), materials.topsoil);
  top.name = "uneven-humus-surface";
  top.receiveShadow = true;
  group.add(top);
}

function addFerns(group, random, shape, radius, materials, leafGeo) {
  const seeds = shape === "esferico"
    ? [[-0.58, -0.42, 0.68], [0.55, -0.4, 0.58], [-0.35, 0.57, 0.5], [0.44, 0.52, 0.52]]
    : [[-1.08, -0.56, 0.7], [1.08, -0.52, 0.62], [-1.1, 0.46, 0.55], [0.98, 0.48, 0.68], [-0.12, 0.78, 0.42]];
  const leaves = new T.InstancedMesh(leafGeo, materials.fern, 820);
  const stems = new T.InstancedMesh(new T.CylinderGeometry(.005,.011,1,6), materials.fernStem, 820);
  const dummy = new T.Object3D();
  let used = 0, stemCount = 0;
  for (const [x, z, size] of seeds) {
    if (!inside(x, z, shape, radius)) continue;
    const base = terrainHeightAt(x, z, shape, radius);
    for (let f = 0; f < 5; f++) {
      const a = f / 5 * Math.PI * 2 + random() * 0.22;
      const direction = new T.Vector3(Math.cos(a), 0, Math.sin(a));
      const length = size * (0.62 + random() * 0.22);
      const points = [];
      for (let step = 0; step <= 5; step++) {
        const t = step / 5;
        points.push([
          x + direction.x * length * t,
          base + size * (0.12 + t * 0.86 + Math.sin(t * Math.PI) * 0.1),
          z + direction.z * length * t
        ]);
      }
      for (let segment = 0; segment < points.length - 1; segment++) {
        const a = new T.Vector3(...points[segment]), b = new T.Vector3(...points[segment + 1]);
        const direction = b.clone().sub(a);
        dummy.position.copy(a.add(b).multiplyScalar(.5));
        const segmentLength=direction.length();
        dummy.quaternion.setFromUnitVectors(new T.Vector3(0,1,0), direction.clone().normalize());
        dummy.scale.set(1,segmentLength,1);
        dummy.updateMatrix();
        stems.setMatrixAt(stemCount++,dummy.matrix);
      }
      const across = new T.Vector3(-direction.z, 0, direction.x);
      for (let node = 1; node <= 10; node++) {
        const t = node / 11;
        const origin = new T.Vector3(
          x + direction.x * length * t,
          base + size * (0.12 + t * 0.86 + Math.sin(t * Math.PI) * 0.1),
          z + direction.z * length * t
        );
        for (const side of [-1, 1]) {
          const axis = across.clone().multiplyScalar(side * 0.9).addScaledVector(direction, 0.3)
            .add(new T.Vector3(0, 0.22 + (1 - t) * 0.16, 0)).normalize();
          const up = new T.Vector3(0, 1, 0);
          const normal = new T.Vector3().crossVectors(axis, up).normalize();
          const vertical = new T.Vector3().crossVectors(normal, axis).normalize();
          dummy.position.copy(origin).addScaledVector(across, side * size * 0.025);
          dummy.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(axis, vertical, normal));
          const leafLength = size * (0.28 * (1 - t) + 0.09);
          dummy.scale.set(leafLength, 1, leafLength * 0.43);
          dummy.updateMatrix();
          leaves.setMatrixAt(used, dummy.matrix);
          leaves.setColorAt(used, new T.Color([0x52763c, 0x71934c, 0x8ba75e][Math.floor(random() * 3)]));
          used++;
        }
      }
    }
  }
  stems.count = stemCount;
  stems.instanceMatrix.needsUpdate = true;
  group.add(stems);
  leaves.count = used;
  leaves.instanceMatrix.needsUpdate = true;
  if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
  group.add(leaves);
  return used;
}

function addMoss(group, random, shape, radius, materials, leafGeo) {
  const geometry = new T.SphereGeometry(1, 12, 8);
  const pillows = new T.InstancedMesh(geometry, materials.moss, 38);
  const dummy = new T.Object3D();
  let used = 0;
  for (let i = 0; i < 38; i++) {
    const p = point(random, shape, radius, 0.12);
    const size = 0.07 + random() * 0.12;
    dummy.position.set(p.x, terrainHeightAt(p.x, p.z, shape, radius) + 0.016, p.z);
    dummy.scale.set(size * 1.5, 0.024 + random() * 0.02, size * 1.2);
    dummy.rotation.y = random() * Math.PI * 2;
    dummy.updateMatrix();
    pillows.setMatrixAt(used, dummy.matrix);
    pillows.setColorAt(used, new T.Color([0x45683a, 0x5c7c42, 0x78954d, 0x8da65c][i % 4]));
    used++;
  }
  pillows.count = used;
  pillows.instanceMatrix.needsUpdate = true;
  if (pillows.instanceColor) pillows.instanceColor.needsUpdate = true;
  group.add(pillows);
  group.add(makeLeaves(random, leafGeo, materials.mossSprig, shape, radius, 180,
    [0x4c773d, 0x6d9149, 0x8aa45b], "sprig"));
}

function addRocks(group, random, shape, radius, material) {
  const rocks = new T.InstancedMesh(new T.DodecahedronGeometry(1, 0), material, 28);
  const dummy = new T.Object3D();
  let used = 0;
  for (let i = 0; i < 28; i++) {
    const p = point(random, shape, radius, 0.16);
    const size = 0.045 + random() * 0.12;
    dummy.position.set(p.x, terrainHeightAt(p.x, p.z, shape, radius) + size * 0.28, p.z);
    dummy.rotation.set(random() * 0.5, random() * Math.PI * 2, random() * 0.4);
    dummy.scale.set(size * 1.2, size * 0.7, size);
    dummy.updateMatrix();
    rocks.setMatrixAt(used, dummy.matrix);
    rocks.setColorAt(used, new T.Color([0x706c5d, 0x8a806c, 0x55594b, 0x9b9078][i % 4]));
    used++;
  }
  rocks.count = used;
  rocks.instanceMatrix.needsUpdate = true;
  if (rocks.instanceColor) rocks.instanceColor.needsUpdate = true;
  rocks.castShadow = true;
  group.add(rocks);
}

function addLogAndRoots(group, x, z, shape, radius, materials, random) {
  if (!inside(x, z, shape, radius)) return;
  const y = terrainHeightAt(x, z, shape, radius) + 0.145;
  const length = shape === "esferico" ? 0.56 : 0.76;
  const r = shape === "esferico" ? 0.12 : 0.15;
  const log = new T.Group();
  const curve = new T.CatmullRomCurve3([
    new T.Vector3(-length * 0.5, -0.028, 0.008),
    new T.Vector3(-length * 0.24, 0.012, -0.014),
    new T.Vector3(0, 0.028, 0.012),
    new T.Vector3(length * 0.24, 0.006, 0.026),
    new T.Vector3(length * 0.5, -0.035, 0.012)
  ]);
  const shell = new T.Mesh(new T.TubeGeometry(curve,40,r,14,false),materials.bark);
  shell.castShadow=true;shell.receiveShadow=true;
  log.add(shell);

  const darkGrooves=[],lightGrooves=[];
  for(let groove=0;groove<9;groove++){
    const angle=groove/9*Math.PI*2,path=[];
    for(let sample=0;sample<=20;sample++){
      const t=sample/20,center=curve.getPointAt(t),tangent=curve.getTangentAt(t).normalize();
      const reference=Math.abs(tangent.y)<.88?new T.Vector3(0,1,0):new T.Vector3(0,0,1);
      const axisA=new T.Vector3().crossVectors(tangent,reference).normalize();
      const axisB=new T.Vector3().crossVectors(tangent,axisA).normalize();
      const radial=.95+Math.sin(t*22+groove*1.7)*.025+Math.cos(t*47-groove)*.012;
      const offset=axisA.clone().multiplyScalar(Math.cos(angle)*r*radial)
        .addScaledVector(axisB,Math.sin(angle)*r*radial);
      path.push(center.clone().add(offset).toArray());
    }
    (groove%3===0?darkGrooves:lightGrooves).push(path);
  }
  addMergedTubes(log,darkGrooves,.0048,materials.darkBark,20);
  addMergedTubes(log,lightGrooves,.0032,materials.barkEdge,20);

  const endDiscs=new T.InstancedMesh(new T.CircleGeometry(r*.76,24),materials.darkBark,2);
  const endRings=new T.InstancedMesh(new T.RingGeometry(r*.56,r*.86,24),materials.barkEdge,2);
  for(let i=0;i<2;i++){
    const t=i===0?0:1,center=curve.getPointAt(t),tangent=curve.getTangentAt(t).normalize();
    const quaternion=new T.Quaternion().setFromUnitVectors(new T.Vector3(0,0,1),tangent);
    const pointA=center.clone().addScaledVector(tangent,i===0?-.001:.001);
    const matrix=new T.Matrix4().compose(pointA,quaternion,new T.Vector3(1,1,1));
    endDiscs.setMatrixAt(i,matrix);
    endRings.setMatrixAt(i,matrix);
  }
  endDiscs.instanceMatrix.needsUpdate=true;endRings.instanceMatrix.needsUpdate=true;
  log.add(endDiscs,endRings);
  log.position.set(x,y,z);
  log.rotation.y=random()*.34-.17;
  log.rotation.z=(random()-.5)*.08;
  group.add(log);

  const rootPaths=[
    [[x-.22,y-.08,z+.02],[x-.37,y-.19,z+.12],[x-.48,terrainHeightAt(x-.48,z+.22,shape,radius)+.012,z+.22]],
    [[x+.16,y-.07,z-.03],[x+.31,y-.18,z-.14],[x+.46,terrainHeightAt(x+.46,z-.23,shape,radius)+.01,z-.23]]
  ];
  addMergedTubes(group,rootPaths,.023,materials.barkEdge,18);

  const lichen=new T.InstancedMesh(new T.SphereGeometry(1,8,6),materials.moss,7);
  for(let i=0;i<7;i++){
    const t=.15+i*.115,point=curve.getPointAt(t);
    const size=.045+random()*.035;
    const dummy=new T.Object3D();
    dummy.position.set(point.x,point.y+r*.78,point.z);
    dummy.scale.set(size,.018,size*.8);
    dummy.rotation.y=random()*Math.PI;
    dummy.updateMatrix();
    lichen.setMatrixAt(i,dummy.matrix);
    lichen.setColorAt(i,new T.Color([0x668448,0x7d9854,0x91a464][i%3]));
  }
  lichen.instanceMatrix.needsUpdate=true;
  if(lichen.instanceColor)lichen.instanceColor.needsUpdate=true;
  log.add(lichen);
}
function addRootArch(group, x, z, shape, radius, materials) {
  if (!inside(x, z, shape, radius)) return;
  const y = terrainHeightAt(x, z, shape, radius);
  const stones = new T.InstancedMesh(new T.DodecahedronGeometry(1, 0), materials.rock, 2);
  const dummy = new T.Object3D();
  for (let i = 0; i < 2; i++) {
    dummy.position.set(x + (i === 0 ? -0.21 : 0.22), y + 0.08, z + (i === 0 ? 0 : -0.04));
    dummy.rotation.set(.12, i * .7, .08);
    dummy.scale.set(.126,.161,.112);
    dummy.updateMatrix();
    stones.setMatrixAt(i,dummy.matrix);
  }
  stones.instanceMatrix.needsUpdate=true;
  group.add(stones);
  addTube(group, [
    [x - 0.24, y + 0.14, z], [x - 0.19, y + 0.36, z + 0.01],
    [x - 0.02, y + 0.44, z - 0.02], [x + 0.17, y + 0.34, z - 0.03],
    [x + 0.25, y + 0.14, z - 0.06]
  ], 0.038, materials.bark, 20);
}

function addMushrooms(group, x, z, shape, radius, random, materials) {
  if(!inside(x,z,shape,radius))return;
  const stems=new T.InstancedMesh(new T.CylinderGeometry(.72,1,1,9),materials.mushroomStem,3);
  const gills=new T.InstancedMesh(new T.SphereGeometry(1,12,8),materials.mushroomGills,3);
  const caps=new T.InstancedMesh(new T.SphereGeometry(1,16,10),materials.mushroomCap,3);
  const dummy=new T.Object3D();
  for(let i=0;i<3;i++){
    const px=x+(i-1)*.055,pz=z+(random()-.5)*.08;
    const height=.08+random()*.075,capRadius=.035+random()*.02;
    const base=terrainHeightAt(px,pz,shape,radius);
    dummy.position.set(px,base+height/2,pz);
    dummy.scale.set(capRadius,height,capRadius);
    dummy.rotation.y=random()*Math.PI;
    dummy.updateMatrix();stems.setMatrixAt(i,dummy.matrix);

    dummy.position.set(px,base+height,pz);
    dummy.scale.set(capRadius*1.5,height*.11,capRadius*1.5);
    dummy.updateMatrix();gills.setMatrixAt(i,dummy.matrix);

    dummy.position.set(px,base+height+height*.1,pz);
    dummy.scale.set(capRadius*2.1,height*.4,capRadius*2.1);
    dummy.updateMatrix();caps.setMatrixAt(i,dummy.matrix);
  }
  stems.instanceMatrix.needsUpdate=true;gills.instanceMatrix.needsUpdate=true;caps.instanceMatrix.needsUpdate=true;
  group.add(stems,gills,caps);
}
function palette() {
  return {
    gravel: new T.MeshStandardMaterial({ color: 0x706b5a, roughness: 1, flatShading: true }),
    soil: new T.MeshStandardMaterial({ color: 0x8f704d, map: texture("soil", 31), roughness: 0.98 }),
    humus: new T.MeshStandardMaterial({ color: 0x513b29, roughness: 1 }),
    topsoil: new T.MeshStandardMaterial({ color: 0x987956, map: texture("soil", 57), roughness: 1, vertexColors: true }),
    moss: new T.MeshStandardMaterial({ color: 0xf0f3db, map: texture("moss", 73), roughness: 1 }),
    mossSprig: new T.MeshStandardMaterial({ color: 0x8eaa5e, roughness: 0.96, side: T.DoubleSide }),
    leaf: new T.MeshStandardMaterial({ color: 0xa28b61, roughness: 0.96, side: T.DoubleSide }),
    groundcover: new T.MeshStandardMaterial({ color: 0x78984d, roughness: 0.97, side: T.DoubleSide }),
    fern: new T.MeshStandardMaterial({ color: 0x88a85b, roughness: 0.94, side: T.DoubleSide }),
    fernStem: new T.MeshStandardMaterial({ color: 0x3f6238, roughness: 0.96 }),
    bark: new T.MeshStandardMaterial({ color: 0xb38a5b, map: texture("bark", 19), roughness: 0.96 }),
    darkBark: new T.MeshStandardMaterial({ color: 0x251b15, roughness: 1, side: T.DoubleSide }),
    barkEdge: new T.MeshStandardMaterial({ color: 0xc49c69, roughness: 0.94 }),
    rock: new T.MeshStandardMaterial({ color: 0x817966, roughness: 1, flatShading: true }),
    mushroomStem: new T.MeshStandardMaterial({ color: 0xe0d4b8, roughness: 0.98 }),
    mushroomGills: new T.MeshStandardMaterial({ color: 0xc8b68e, roughness: 1 }),
    mushroomCap: new T.MeshStandardMaterial({ color: 0x986348, roughness: 0.94 })
  };
}

export function mergeStaticMeshes(group) {
  group.updateMatrixWorld(true);
  const inverseWorld = new T.Matrix4().copy(group.matrixWorld).invert();
  const buckets = new Map();
  const protectedGeometries = new Set();
  const removed = new Set();
  const replacements = [];
  let mergedSourceMeshes = 0;
  let mergedDrawMeshes = 0;

  group.traverse(object => {
    if (!object.isMesh || object.isInstancedMesh || object.isSkinnedMesh ||
        Array.isArray(object.material) || object.children.length ||
        Object.keys(object.geometry.morphAttributes ?? {}).length) {
      if (object.isMesh && object.geometry) protectedGeometries.add(object.geometry);
      return;
    }
    const geometry = object.geometry;
    const attributes = Object.keys(geometry.attributes).sort().map(name => {
      const attribute = geometry.attributes[name];
      return [
        name,
        attribute.itemSize,
        attribute.normalized ? 1 : 0,
        attribute.array.constructor.name,
        attribute.gpuType ?? 0
      ].join(":");
    }).join(",");
    const signature = [
      object.material.uuid,
      geometry.index ? "indexed" : "non-indexed",
      attributes,
      object.castShadow ? 1 : 0,
      object.receiveShadow ? 1 : 0,
      object.renderOrder
    ].join("|");
    let bucket = buckets.get(signature);
    if (!bucket) {
      bucket = [];
      buckets.set(signature, bucket);
    }
    const clone = geometry.clone();
    clone.applyMatrix4(new T.Matrix4().multiplyMatrices(inverseWorld, object.matrixWorld));
    clone.clearGroups();
    bucket.push({ object, geometry: clone });
  });

  const disposedGeometries = new Set();
  for (const bucket of buckets.values()) {
    if (bucket.length < 2) {
      for (const entry of bucket) entry.geometry.dispose();
      continue;
    }
    const geometry = mergeGeometries(bucket.map(entry => entry.geometry), false);
    if (!geometry) {
      for (const entry of bucket) entry.geometry.dispose();
      continue;
    }
    geometry.computeBoundingSphere();
    const source = bucket[0].object;
    const merged = new T.Mesh(geometry, source.material);
    merged.name = "merged-" + (source.material.name || source.material.type.toLowerCase());
    merged.castShadow = source.castShadow;
    merged.receiveShadow = source.receiveShadow;
    merged.renderOrder = source.renderOrder;
    replacements.push(merged);
    for (const entry of bucket) {
      removed.add(entry.object);
      const original = entry.object.geometry;
      if (!protectedGeometries.has(original) && !disposedGeometries.has(original)) {
        original.dispose();
        disposedGeometries.add(original);
      }
      mergedSourceMeshes++;
    }
    mergedDrawMeshes++;
  }

  for (const object of removed) object.removeFromParent();
  group.add(...replacements);
  group.updateMatrixWorld(true);
  return {
    sourceMeshes: mergedSourceMeshes,
    mergedDrawMeshes,
    drawCallsSaved: mergedSourceMeshes - mergedDrawMeshes
  };
}

export function buildWoodlandInterior(shape, spec) {
  const group = new T.Group();
  group.name = "woodland-interior";
  const radius = spec.floorRadius ?? 1.48;
  const seed = shape === "esferico" ? 20261030 : shape === "cilindrico" ? 140719 : 884201;
  const random = rng(seed);
  const materials = palette();
  const leaves = leafGeometry();
  addSubstrate(group, shape, spec, materials);

  const leafLitter = makeLeaves(random, leaves, materials.leaf, shape, radius, 220,
    [0x6c5038, 0x856343, 0xa17c4f, 0x596542, 0xb18a58], "ground");
  leafLitter.name = "individual-forest-litter";
  group.add(leafLitter);
  const cover = makeLeaves(random, leaves, materials.groundcover, shape, radius, 64,
    [0x496b3b, 0x5d7d43, 0x759451], "ground");
  cover.name = "low-groundcover";
  group.add(cover);

  const fernLeaves = addFerns(group, random, shape, radius, materials, leaves);
  addMoss(group, random, shape, radius, materials, leaves);
  addRocks(group, random, shape, radius, materials.rock);
  addLogAndRoots(group, shape === "esferico" ? -0.1 : -0.18, shape === "esferico" ? -0.25 : -0.38, shape, radius, materials, random);
  addRootArch(group, shape === "esferico" ? 0.45 : 0.88, -0.36, shape, radius, materials);
  addMushrooms(group, -0.68, 0.44, shape, radius, random, materials);
  addMushrooms(shape === "esferico" ? 0.62 : 1.18, shape === "esferico" ? 0.4 : 0.48, shape, radius, random, materials);

  group.traverse(object => {
    if (object.isMesh) {
      object.castShadow = object.name !== "individual-forest-litter" && object.name !== "low-groundcover";
      object.receiveShadow = true;
    }
  });
  const batchingStats = mergeStaticMeshes(group);
  let lowest = Infinity, highest = -Infinity;
  for (let iz = 0; iz <= 18; iz++) {
    for (let ix = 0; ix <= 26; ix++) {
      const px = shape === "rectangular" ? -1.52 + ix / 26 * 3.04 : -radius + ix / 26 * radius * 2;
      const pz = shape === "rectangular" ? -0.96 + iz / 18 * 1.92 : -radius + iz / 18 * radius * 2;
      if (!inside(px, pz, shape, radius)) continue;
      const h = terrainHeightAt(px, pz, shape, radius);
      lowest = Math.min(lowest, h);
      highest = Math.max(highest, h);
    }
  }
  group.userData.visualStats = {
    version: "woodland-diorama-v4",
    seed,
    leafInstances: leafLitter.count + cover.count,
    fernLeaves,
    mossPillows: 38,
    rocks: 28,
    substrateLayers: 3,
    terrainRelief: Number((highest - lowest).toFixed(3)),
    staticMeshesMerged: batchingStats.sourceMeshes,
    staticDrawMeshes: batchingStats.mergedDrawMeshes,
    staticDrawCallsSaved: batchingStats.drawCallsSaved
  };
  return group;
}
