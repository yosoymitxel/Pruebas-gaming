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
  const hills = shape === "esferico"
    ? mound(-0.34,-0.22,.24,.23,.26) +
      mound(.34,.22,.22,.2,.21) +
      mound(.2,-.43,.18,.17,.15) +
      mound(-.43,.36,.18,.17,.13)
    : mound(-0.68, -0.34, 0.48, 0.43, 0.34) +
      mound(0.64, 0.43, 0.36, 0.31, 0.28) +
      mound(0.92, -0.48, 0.3, 0.27, 0.2) +
      mound(-0.96, 0.55, 0.32, 0.26, 0.14) +
      0.045 * Math.exp(-(((z - (0.24 * Math.sin(x * 2.2) - 0.08)) / 0.17) ** 2)) * Math.exp(-((x / 1.1) ** 4));
  const grain =
    Math.sin(x * 8.1 + z * 3.7) * 0.012 +
    Math.cos(z * 10.3 - x * 2.4) * 0.009 +
    Math.sin((x - z) * 17.0) * 0.002;
  return BASE_Y + (hills * 0.8 + grain) * edge - (1 - edge) * 0.012;
}

function texture(kind, seed) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 192;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const size=canvas.width;
  const pixels = ctx.createImageData(size, size);
  const random = rng(seed);
  const base = kind === "moss" ? [86, 112, 59] : kind === "bark" ? [104, 76, 48] : [96, 75, 56];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const broad =
      Math.sin(x * .031 + Math.sin(y * .019) * 1.7) * 4.2 +
      Math.cos(y * .037 - x * .013) * 3.1;
    const medium =
      Math.sin(x * .17 + Math.cos(y * .11) * 2.1) * 2.8 +
      Math.cos(y * .21 + x * .047) * 2.1;
    const grain = (random() - .5) * (kind === "moss" ? 28 : 34);
    const fleck = random() > .988 ? (random() - .5) * 34 : 0;
    pixels.data[i] = clamp(base[0] + broad + medium + grain + fleck, 0, 255);
    pixels.data[i + 1] = clamp(base[1] + broad * .82 + medium * .8 + grain * .76 + fleck * .8, 0, 255);
    pixels.data[i + 2] = clamp(base[2] + broad * .64 + medium * .62 + grain * .58 + fleck * .52, 0, 255);
    pixels.data[i + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);

  // Small mineral grains and decayed organic fragments, not a tiled sine pattern.
  const flecks = kind === "soil" ? 1900 : kind === "bark" ? 1250 : 900;
  for(let i=0;i<flecks;i++){
    const x=random()*size,y=random()*size;
    const radius=.22+random()*(kind==="soil"?1.05:.72);
    const tone=random();
    ctx.fillStyle=kind==="soil"
      ? tone>.56?"rgba(34,27,21,.20)":"rgba(184,148,100,.14)"
      : kind==="bark"
        ? tone>.5?"rgba(35,24,16,.22)":"rgba(190,148,93,.15)"
        : tone>.52?"rgba(30,54,23,.16)":"rgba(165,190,105,.18)";
    ctx.beginPath();
    ctx.ellipse(x,y,radius,radius*(.34+random()*.55),random()*Math.PI,0,Math.PI*2);
    ctx.fill();
  }

  const map = new T.CanvasTexture(canvas);
  map.colorSpace = T.SRGBColorSpace;
  map.wrapS = map.wrapT = T.RepeatWrapping;
  map.repeat.set(kind === "bark" ? 2.4 : 3.2, kind === "bark" ? 1.2 : 3.2);
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

function organicTubeGeometry(curve, radius, seed, segments = 42, radialSegments = 16, flatten = 0.82, arc = Math.PI * 2) {
  const frames = curve.computeFrenetFrames(segments, false);
  const positions = [], uvs = [], indices = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const center = curve.getPointAt(t);
    const envelope = 0.68 + 0.32 * Math.pow(Math.sin(Math.PI * t), 0.28);
    for (let j = 0; j <= radialSegments; j++) {
      const angle = arc < Math.PI * 2
        ? -Math.PI / 2 + j / radialSegments * arc
        : j / radialSegments * Math.PI * 2;
      const normalSide = arc < Math.PI * 2 && frames.normals[0].y < 0 ? -1 : 1;
      const roughness = 1 +
        Math.sin(angle * 3 + t * 18 + seed) * 0.065 +
        Math.cos(angle * 5 - t * 23 + seed * 0.71) * 0.028;
      const r = radius * envelope * roughness;
      const point = center.clone()
        .addScaledVector(frames.normals[i], Math.cos(angle) * r * normalSide)
        .addScaledVector(frames.binormals[i], Math.sin(angle) * r * flatten);
      positions.push(point.x, point.y, point.z);
      uvs.push(t, j / radialSegments);
      if (i < segments && j < radialSegments) {
        const a = i * (radialSegments + 1) + j;
        const b = a + 1;
        const c = a + radialSegments + 1;
        const d = c + 1;
        indices.push(a, b, c, b, d, c);
      }
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
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
    let p;
    if (kind === "groundcover" || kind === "ground") {
      const sites = kind === "ground"
        ? [[-0.98, -0.28], [-0.72, 0.43], [0.7, 0.34], [0.96, -0.46], [-0.12, -0.78]]
        : [[-0.86, -0.22], [0.72, 0.24], [-0.12, -0.76], [0.98, -0.46]];
      const site = sites[i % sites.length];
      const spread = kind === "ground" ? 0.42 : 0.28;
      p = {x:site[0] + (random() - 0.5) * spread,z:site[1] + (random() - 0.5) * spread * 0.72};
      if (!inside(p.x, p.z, shape, radius)) p = point(random, shape, radius, 0.12);
    } else {
      p = point(random, shape, radius, 0.06);
    }
    const angle = random() * Math.PI * 2;
    const length = kind === "sprig"
      ? 0.045 + random() * 0.075
      : kind === "groundcover"
        ? 0.055 + random() * 0.09
        : 0.085 + random() * 0.15;
    const width = length * (kind === "sprig" ? 0.34 : kind === "groundcover" ? 0.48 : 0.31);
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
    const nx = 64, nz = 42;
    for (let z = 0; z <= nz; z++) for (let x = 0; x <= nx; x++) {
      add(-1.6 + x / nx * 3.2, -1.05 + z / nz * 2.1);
    }
    for (let z = 0; z < nz; z++) for (let x = 0; x < nx; x++) {
      const a = z * (nx + 1) + x, b = a + 1, c = a + nx + 1, d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  } else {
    const rings = 24, sides = 80;
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

function addFerns(group, random, shape, radius, materials, leafGeo, options = {}) {
  const density=clamp(Number(options.density??1),0.15,2);
  const seeds = shape === "esferico"
    ? [
        {x:-.72,z:-.55,size:.68,fronds:5,phase:.18},
        {x:.66,z:-.48,size:.62,fronds:4,phase:1.12},
        {x:-.94,z:.14,size:.4,fronds:4,phase:2.28},
        {x:.88,z:.2,size:.45,fronds:5,phase:.72},
        {x:-.12,z:.62,size:.34,fronds:4,phase:1.72},
        {x:.12,z:-.98,size:.29,fronds:3,phase:2.64}
      ]
    : [
        {x:-1.08,z:-.7,size:.74,fronds:5,phase:.22},
        {x:.82,z:-.62,size:.66,fronds:4,phase:1.34},
        {x:-1.18,z:.16,size:.43,fronds:4,phase:2.16},
        {x:1.02,z:.18,size:.49,fronds:5,phase:.86},
        {x:-.12,z:.68,size:.34,fronds:4,phase:1.82},
        {x:.14,z:-.98,size:.3,fronds:3,phase:2.74}
      ];
  const leaves = new T.InstancedMesh(leafGeo, materials.fern, Math.ceil(1800*density));
  const stems = new T.InstancedMesh(new T.CylinderGeometry(.006,.012,1,6), materials.fernStem, Math.ceil(1050*density));
  const dummy = new T.Object3D();
  const greens=[0x496e39,0x638447,0x779651,0x8ca85e,0x5a7941];
  let used=0,stemCount=0;

  for(const plant of seeds){
    const {x,z,size,fronds,phase}=plant;
    if(!inside(x,z,shape,radius))continue;
    const base=terrainHeightAt(x,z,shape,radius);
    const count=Math.max(1,Math.round((fronds+(random()>.65?1:0))*density));
    for(let f=0;f<count;f++){
      const angle=phase+(f/count)*Math.PI*2+(random()-.5)*.34;
      const direction=new T.Vector3(Math.cos(angle),0,Math.sin(angle));
      const length=size*(.62+random()*.38);
      const arch=size*(.68+random()*.18);
      const heightAt=t=>base+size*(.045+Math.sin(t*Math.PI*.78)*(arch/size)-t*.18);
      const points=[];
      for(let step=0;step<=5;step++){
        const t=step/5;
        points.push([
          x+direction.x*length*t,
          heightAt(t),
          z+direction.z*length*t
        ]);
      }
      for(let segment=0;segment<points.length-1;segment++){
        const a=new T.Vector3(...points[segment]),b=new T.Vector3(...points[segment+1]);
        const delta=b.clone().sub(a),segmentLength=delta.length();
        dummy.position.copy(a.add(b).multiplyScalar(.5));
        dummy.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());
        dummy.scale.set(1,segmentLength,1);
        dummy.updateMatrix();
        stems.setMatrixAt(stemCount++,dummy.matrix);
      }

      const across=new T.Vector3(-direction.z,0,direction.x);
      const nodeCount=10+Math.floor(random()*3);
      for(let node=1;node<=nodeCount;node++){
        const t=node/(nodeCount+1);
        const origin=new T.Vector3(
          x+direction.x*length*t,
          heightAt(t),
          z+direction.z*length*t
        );
        const taper=.24+.76*Math.sin(Math.PI*t*.88);
        for(const side of [-1,1]){
          const outward=.68+random()*.18;
          const axis=across.clone().multiplyScalar(side*outward)
            .addScaledVector(direction,.12+random()*.16)
            .add(new T.Vector3(0,.08+random()*.12,0)).normalize();
          const normal=new T.Vector3().crossVectors(axis,new T.Vector3(0,1,0)).normalize();
          const vertical=new T.Vector3().crossVectors(normal,axis).normalize();
          dummy.position.copy(origin).addScaledVector(across,side*size*(.018+random()*.018));
          dummy.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(axis,vertical,normal));
          const leafLength=size*(.32*(1-t)+.085)*taper*(.84+random()*.28);
          dummy.scale.set(leafLength,1,leafLength*(.74+random()*.14));
          dummy.updateMatrix();
          leaves.setMatrixAt(used,dummy.matrix);
          leaves.setColorAt(used,new T.Color(greens[Math.floor(random()*greens.length)]));
          used++;
        }
      }
      // A terminal leaflet makes the rachis read as a complete frond.
      const tip=new T.Mesh(leafGeo,materials.fern);
      tip.position.set(x+direction.x*length,heightAt(1),z+direction.z*length);
      tip.rotation.y=-angle;
      tip.scale.set(size*.11,1,size*.05);
      tip.castShadow=false;
      group.add(tip);
    }
  }
  stems.count=stemCount;
  stems.instanceMatrix.needsUpdate=true;
  leaves.count=used;
  leaves.instanceMatrix.needsUpdate=true;
  if(leaves.instanceColor)leaves.instanceColor.needsUpdate=true;
  stems.castShadow=true;
  leaves.castShadow=false;
  group.add(stems,leaves);
  return used;
}

function addForestRosettes(group,random,shape,radius,materials,leafGeo,options={}){
  const density=clamp(Number(options.density??1),0.15,2);
  const sites=shape==="esferico"
    ? [[-.22,-.86,.76],[.62,.48,.68],[-.86,.34,.59],[.08,.64,.48],[.92,-.08,.43]]
    : [[-.18,-.82,1.02],[.62,.55,.9],[-.88,.38,.72],[.08,.64,.56],[.92,-.08,.52]];
  const leaves=new T.InstancedMesh(leafGeo,materials.groundcover,Math.ceil(88*density));
  const dummy=new T.Object3D();
  const palette=[0x496b3b,0x5b7c43,0x78944f,0x8ca45d];
  let used=0;
  for(const [x,z,size] of sites){
    if(!inside(x,z,shape,radius))continue;
    const base=terrainHeightAt(x,z,shape,radius);
    const count=Math.max(1,Math.round((7+Math.floor(random()*3))*density));
    const phase=random()*Math.PI*2;
    for(let i=0;i<count;i++){
      const angle=phase+i/count*Math.PI*2+(random()-.5)*.32;
      const length=size*(.2+random()*.12);
      dummy.position.set(
        x+Math.cos(angle)*length*.32,
        base+.018+length*.16,
        z+Math.sin(angle)*length*.32
      );
      dummy.rotation.set((random()-.5)*.18,-angle,.12+random()*.16);
      dummy.scale.set(length,1,length*(.42+random()*.14));
      dummy.updateMatrix();
      leaves.setMatrixAt(used,dummy.matrix);
      leaves.setColorAt(used,new T.Color(palette[Math.floor(random()*palette.length)]));
      used++;
    }
  }
  leaves.count=used;
  leaves.instanceMatrix.needsUpdate=true;
  if(leaves.instanceColor)leaves.instanceColor.needsUpdate=true;
  leaves.castShadow=false;
  group.add(leaves);
  return used;
}

function addMoss(group, random, shape, radius, materials, leafGeo, options = {}) {
  const density=clamp(Number(options.density??1),0.12,2);
  const patchCount=Math.max(1,Math.round(32*density));
  const cushionGeometry = new T.IcosahedronGeometry(1, 2);
  const cushionPosition = cushionGeometry.attributes.position;
  for (let i = 0; i < cushionPosition.count; i++) {
    const x = cushionPosition.getX(i), y = cushionPosition.getY(i), z = cushionPosition.getZ(i);
    const ripple = 1 + Math.sin(x * 8 + z * 5) * 0.045 + Math.cos(y * 7 - z * 4) * 0.035;
    cushionPosition.setXYZ(i, x * ripple, y * (0.78 + Math.sin(x * 5) * 0.06) * ripple, z * ripple);
  }
  cushionGeometry.computeVertexNormals();
  const cushions = new T.InstancedMesh(cushionGeometry, materials.moss, patchCount);
  const leaflets = new T.InstancedMesh(leafGeo, materials.mossSprig, Math.ceil(2100*density));
  const dummy = new T.Object3D();
  const tones = [0x405d36, 0x527341, 0x65834a, 0x789655, 0x8aa45d];
  let cushionCount = 0, leafletCount = 0;

  const mossSites = shape==="esferico"
    ? [[-.82,-.18],[.78,.22],[-.12,-.78],[.96,-.45],[-.9,.48],[.18,.88],[-.42,.76]]
    : [[-0.82, -0.18], [0.78, 0.22], [-0.12, -0.78], [0.96, -0.45], [-1.02, 0.55], [0.18, 0.88], [-0.42, 0.76]];
  for (let patch = 0; patch < patchCount; patch++) {
    const site = mossSites[patch % mossSites.length];
    const center = {
      x:site[0] + (random() - 0.5) * 0.22,
      z:site[1] + (random() - 0.5) * 0.18
    };
    if (!inside(center.x, center.z, shape, radius)) continue;
    const ground = terrainHeightAt(center.x, center.z, shape, radius);
    const width = 0.07 + random() * 0.095;
    const depth = 0.06 + random() * 0.08;
    const crown = 0.022 + random() * 0.018;

    dummy.position.set(center.x, ground + crown * 0.42, center.z);
    dummy.rotation.y = random() * Math.PI * 2;
    dummy.scale.set(width, crown, depth);
    dummy.updateMatrix();
    cushions.setMatrixAt(cushionCount, dummy.matrix);
    cushions.setColorAt(cushionCount, new T.Color(tones[patch % tones.length]));
    cushionCount++;

    const blades = 52 + Math.floor(random() * 12);
    for (let i = 0; i < blades; i++) {
      const angle = random() * Math.PI * 2;
      const distance = Math.sqrt(random()) * 0.92;
      const x = center.x + Math.cos(angle) * width * distance;
      const z = center.z + Math.sin(angle) * depth * distance;
      if (!inside(x, z, shape, radius)) continue;
      const dome = Math.sqrt(Math.max(0, 1 - distance * distance));
      const direction = new T.Vector3(
        Math.cos(angle) * 0.56 + (random() - 0.5) * 0.4,
        0.28 + random() * 0.42,
        Math.sin(angle) * 0.56 + (random() - 0.5) * 0.4
      ).normalize();
      const up = new T.Vector3(0, 1, 0);
      const normal = new T.Vector3().crossVectors(direction, up).normalize();
      const vertical = new T.Vector3().crossVectors(normal, direction).normalize();
      const basis = new T.Matrix4().makeBasis(direction, vertical, normal);
      const length = 0.021 + random() * 0.026;
      dummy.position.set(x, terrainHeightAt(x, z, shape, radius) + 0.011 + dome * crown * 0.58, z);
      dummy.quaternion.setFromRotationMatrix(basis);
      dummy.scale.set(length, 1, length * (0.32 + random() * 0.12));
      dummy.updateMatrix();
      if(leafletCount>=leaflets.instanceMatrix.count)throw new Error("El sotobosque superó la capacidad de hojillas de musgo");
      leaflets.setMatrixAt(leafletCount, dummy.matrix);
      leaflets.setColorAt(leafletCount, new T.Color(tones[Math.floor(random() * tones.length)]));
      leafletCount++;
    }
  }

  cushions.count = cushionCount;
  leaflets.count = leafletCount;
  cushions.instanceMatrix.needsUpdate = true;
  leaflets.instanceMatrix.needsUpdate = true;
  if (cushions.instanceColor) cushions.instanceColor.needsUpdate = true;
  if (leaflets.instanceColor) leaflets.instanceColor.needsUpdate = true;
  cushions.castShadow = true;
  leaflets.castShadow = false;
  group.add(cushions, leaflets);
  return { patches: cushionCount, blades: leafletCount };
}

function addRocks(group, random, shape, radius, material, options = {}) {
  const count=Math.max(1,Math.ceil(9*clamp(Number(options.density??1),0.12,2)));
  const geometry = new T.IcosahedronGeometry(1, 1);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
    const noise = 0.88 + random() * 0.24;
    position.setXYZ(i, x * noise, y * (0.68 + random() * 0.25), z * noise);
  }
  geometry.computeVertexNormals();
  const rocks = new T.InstancedMesh(geometry, material, count);
  const dummy = new T.Object3D();
  const sites = shape==="esferico"
    ? [[-.96,.4],[-.82,.55],[.82,-.36],[.92,-.45],[.22,.82]]
    : [[-1.02, 0.43], [-0.86, 0.54], [0.84, -0.36], [0.98, -0.48], [0.22, 0.82]];
  const tones = [0x505b53, 0x626b5f, 0x48564e, 0x747667, 0x56615b];
  let used = 0;
  for (let i = 0; i < count; i++) {
    const site = sites[i % sites.length];
    let x = site[0] + (random() - 0.5) * 0.16;
    let z = site[1] + (random() - 0.5) * 0.14;
    if (!inside(x, z, shape, radius)) {
      const p = point(random, shape, radius, 0.22);
      x = p.x; z = p.z;
    }
    const size = 0.05 + random() * 0.065;
    const floor = terrainHeightAt(x, z, shape, radius);
    dummy.position.set(x, floor + size * 0.42, z);
    dummy.rotation.set(random() * 0.28, random() * Math.PI * 2, random() * 0.22);
    dummy.scale.set(size * (0.88 + random() * 0.3), size * (0.58 + random() * 0.28), size * (0.76 + random() * 0.42));
    dummy.updateMatrix();
    rocks.setMatrixAt(used, dummy.matrix);
    rocks.setColorAt(used, new T.Color(tones[i % tones.length]));
    used++;
  }
  rocks.count = used;
  rocks.instanceMatrix.needsUpdate = true;
  if (rocks.instanceColor) rocks.instanceColor.needsUpdate = true;
  rocks.castShadow = true;
  rocks.receiveShadow = true;
  group.add(rocks);
}
function seedForLog(x, z) {
  return Math.abs(Math.floor((x * 73856093 + z * 19349663) * 1000)) % 997;
}

function addLogAndRoots(group, x, z, shape, radius, materials, random) {
  if (!inside(x, z, shape, radius)) return;
  const y = terrainHeightAt(x, z, shape, radius) + 0.045;
  const length = shape === "esferico" ? 0.52 : 0.62;
  const r = shape === "esferico" ? 0.068 : 0.078;
  const log = new T.Group();
  const curve = new T.CatmullRomCurve3([
    new T.Vector3(-length * 0.5, -0.028, 0.008),
    new T.Vector3(-length * 0.24, 0.012, -0.014),
    new T.Vector3(0, 0.028, 0.012),
    new T.Vector3(length * 0.24, 0.006, 0.026),
    new T.Vector3(length * 0.5, -0.035, 0.012)
  ]);
  const shell = new T.Mesh(organicTubeGeometry(curve,r,seedForLog(x,z),48,18,.78,Math.PI),materials.bark);
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
  addMergedTubes(log,darkGrooves,.0034,materials.darkBark,24);
  addMergedTubes(log,lightGrooves,.0022,materials.barkEdge,24);

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
    [[x-.20,y-.028,z+.02],[x-.34,y-.085,z+.12],[x-.46,terrainHeightAt(x-.46,z+.22,shape,radius)+.01,z+.22]],
    [[x+.15,y-.024,z-.03],[x+.29,y-.09,z-.14],[x+.43,terrainHeightAt(x+.43,z-.23,shape,radius)+.01,z-.23]]
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
    dummy.position.set(x + (i === 0 ? -0.19 : 0.2), y + 0.045, z + (i === 0 ? 0 : -0.04));
    dummy.rotation.set(.12, i * .7, .08);
    dummy.scale.set(.067,.072,.062);
    dummy.updateMatrix();
    stones.setMatrixAt(i,dummy.matrix);
  }
  stones.instanceMatrix.needsUpdate=true;
  group.add(stones);
  const archCurve = new T.CatmullRomCurve3([
    new T.Vector3(x - 0.21, y + 0.085, z),
    new T.Vector3(x - 0.16, y + 0.2, z + 0.01),
    new T.Vector3(x + 0.01, y + 0.24, z - 0.02),
    new T.Vector3(x + 0.16, y + 0.19, z - 0.03),
    new T.Vector3(x + 0.22, y + 0.08, z - 0.06)
  ]);
  const arch = new T.Mesh(organicTubeGeometry(archCurve,0.02,3471,32,12,.78),materials.bark);
  arch.castShadow = true;
  arch.receiveShadow = true;
  group.add(arch);
}

function addMushrooms(group, x, z, shape, radius, random, materials, options = {}) {
  if(!inside(x,z,shape,radius))return;
  const count=Math.max(1,Math.ceil(3*clamp(Number(options.density??1),0.12,2)));
  const stems=new T.InstancedMesh(new T.CylinderGeometry(.72,1,1,9),materials.mushroomStem,count);
  const gills=new T.InstancedMesh(new T.SphereGeometry(1,12,8),materials.mushroomGills,count);
  const caps=new T.InstancedMesh(new T.SphereGeometry(1,16,10),materials.mushroomCap,count);
  const dummy=new T.Object3D();
  for(let i=0;i<count;i++){
    const px=x+(i-1)*.055,pz=z+(random()-.5)*.08;
    const height=.052+random()*.042,capRadius=.023+random()*.014;
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
    gravel: new T.MeshStandardMaterial({ color: 0x747b70, roughness: 1, flatShading: true }),
    soil: new T.MeshStandardMaterial({ color: 0xffffff, map: texture("soil", 31), roughness: 0.99 }),
    humus: new T.MeshStandardMaterial({ color: 0x55402f, roughness: 1 }),
    topsoil: new T.MeshStandardMaterial({ color: 0xffffff, map: texture("soil", 57), roughness: 1, vertexColors: true }),
    moss: new T.MeshStandardMaterial({ color: 0xffffff, roughness: 1, flatShading: true }),
    mossSprig: new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.98, side: T.DoubleSide }),
    leaf: new T.MeshStandardMaterial({ color: 0xa28b61, roughness: 0.96, side: T.DoubleSide }),
    groundcover: new T.MeshStandardMaterial({ color: 0x91a96b, roughness: 0.98, side: T.DoubleSide }),
    fern: new T.MeshStandardMaterial({ color: 0x9bb477, roughness: 0.95, side: T.DoubleSide }),
    fernStem: new T.MeshStandardMaterial({ color: 0x3f6238, roughness: 0.96 }),
    bark: new T.MeshStandardMaterial({ color: 0xc6b08d, map: texture("bark", 19), roughness: 0.98 }),
    darkBark: new T.MeshStandardMaterial({ color: 0x30251d, roughness: 1, side: T.DoubleSide }),
    barkEdge: new T.MeshStandardMaterial({ color: 0x907451, roughness: 0.98 }),
    rock: new T.MeshStandardMaterial({ color: 0x92998d, roughness: 1, flatShading: true }),
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

  const leafLitter = makeLeaves(random, leaves, materials.leaf, shape, radius, 420,
    [0x6c5038, 0x856343, 0xa17c4f, 0x596542, 0xb18a58], "ground");
  leafLitter.name = "individual-forest-litter";
  group.add(leafLitter);
  const cover = makeLeaves(random, leaves, materials.groundcover, shape, radius, 150,
    [0x496b3b, 0x5d7d43, 0x759451], "groundcover");
  cover.name = "low-groundcover";
  group.add(cover);

  const fernLeaves = addFerns(group, random, shape, radius, materials, leaves);
  const rosetteLeaves = addForestRosettes(group, random, shape, radius, materials, leaves);
  const mossStats = addMoss(group, random, shape, radius, materials, leaves);
  addRocks(group, random, shape, radius, materials.rock);
  addLogAndRoots(group, shape === "esferico" ? -0.08 : -0.16, shape === "esferico" ? -0.62 : -0.64, shape, radius, materials, random);
  addRootArch(group, shape === "esferico" ? 0.34 : 0.94, shape === "esferico" ? -0.46 : -0.72, shape, radius, materials);
  addMushrooms(group, shape === "esferico" ? -0.3 : -0.58, shape === "esferico" ? -0.42 : -0.55, shape, radius, random, materials);
  addMushrooms(group, shape === "esferico" ? 0.32 : 0.72, shape === "esferico" ? -0.39 : -0.58, shape, radius, random, materials);

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
    version: "woodland-diorama-v12",
    seed,
    leafInstances: leafLitter.count + cover.count,
    fernLeaves: fernLeaves + rosetteLeaves,
    rosetteLeaves,
    mossPillows: mossStats.patches,
    mossTufts: mossStats.patches,
    mossBlades: mossStats.blades,
    rocks: 9,
    substrateLayers: 3,
    terrainRelief: Number((highest - lowest).toFixed(3)),
    staticMeshesMerged: batchingStats.sourceMeshes,
    staticDrawMeshes: batchingStats.mergedDrawMeshes,
    staticDrawCallsSaved: batchingStats.drawCallsSaved
  };
  return group;
}


export { rng as createSeededRandom, leafGeometry as createLeafGeometry, makeLeaves as buildLeafInstances, addFerns as buildFernBed, addForestRosettes as buildForestRosettes, addMoss as buildMossBed, addRocks as buildRockScatter, addLogAndRoots as buildFallenLog, addRootArch as buildRootArch, addMushrooms as buildMushroomCluster, palette as createWoodlandMaterials };
