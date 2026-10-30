import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { terrainHeightAt, mergeStaticMeshes } from "../src/terrarium-art.js";

test("el relieve del sustrato es determinista y finito en las tres formas", () => {
  for (const shape of ["rectangular", "cilindrico", "esferico"]) {
    const samples = [
      [-0.8, -0.35],
      [0, 0],
      [0.62, 0.4],
      [1.1, -0.2]
    ];
    for (const [x, z] of samples) {
      const first = terrainHeightAt(x, z, shape);
      const second = terrainHeightAt(x, z, shape);
      assert.ok(Number.isFinite(first), `${shape}: altura no finita en ${x}, ${z}`);
      assert.equal(first, second, `${shape}: el campo cambia con la misma entrada`);
    }
  }
});

test("el terreno circular se aplana fuera de su borde lógico", () => {
  const edge = terrainHeightAt(1.48, 0, "cilindrico", 1.48);
  const center = terrainHeightAt(0, 0, "cilindrico", 1.48);
  assert.ok(edge < center, "el perímetro debe descender hasta el borde del sustrato");
});

test("el terreno rectangular conserva límites y relieve interior", () => {
  const edge = terrainHeightAt(1.58, 0, "rectangular");
  const center = terrainHeightAt(0, 0, "rectangular");
  assert.ok(edge < center, "el relieve debe desvanecerse al acercarse al canto");
});

test("el montículo principal tiene relieve real frente al borde en cada recipiente", () => {
  for (const [shape, radius, edgeX] of [
    ["rectangular", 1.48, 1.56],
    ["cilindrico", 1.48, 1.465],
    ["esferico", 1.18, 1.165]
  ]) {
    const mound = terrainHeightAt(-0.68, -0.34, shape, radius);
    const edge = terrainHeightAt(edgeX, 0, shape, radius);
    assert.ok(mound - edge >= 0.12,
      `${shape}: elevación del montículo frente al borde ${(mound-edge).toFixed(3)} m`);
  }
});

test("el microbosque conserva una zona baja de observación y relieve determinista", () => {
  const moundA = terrainHeightAt(-0.68, -0.34, "rectangular", 1.48);
  const moundB = terrainHeightAt(-0.68, -0.34, "rectangular", 1.48);
  const openGround = terrainHeightAt(0.02, -0.78, "rectangular", 1.48);
  assert.equal(moundA, moundB);
  assert.ok(moundA - openGround > 0.035);
});

test("el batching conserva transforms y convierte meshes repetidos a una sola llamada", () => {
  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({ color: 0x668844 });
  const first = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
  const second = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
  first.position.set(-2, 0.5, 0);
  second.position.set(2, 0.5, 0);
  group.add(first, second);
  const protectedGeometry = new THREE.SphereGeometry(0.3, 8, 6);
  const instances = new THREE.InstancedMesh(protectedGeometry, material, 1);
  instances.setMatrixAt(0, new THREE.Matrix4().makeTranslation(0, 0.3, 0));
  group.add(instances);

  const result = mergeStaticMeshes(group);
  assert.equal(result.sourceMeshes, 2);
  assert.equal(result.mergedDrawMeshes, 1);
  assert.equal(result.drawCallsSaved, 1);
  assert.equal(group.children.filter(child => child.isInstancedMesh).length, 1);
  assert.equal(group.children.filter(child => child.isMesh && !child.isInstancedMesh).length, 1);

  const merged = group.children.find(child => child.name.startsWith("merged-"));
  const positions = merged.geometry.getAttribute("position");
  const bounds = new THREE.Box3().setFromBufferAttribute(positions);
  assert.ok(bounds.min.x <= -2.49 && bounds.max.x >= 2.49, "se conservan los desplazamientos locales");
  assert.ok(bounds.min.y <= 0 && bounds.max.y >= 1, "se conserva la altura");
  merged.geometry.dispose();
  protectedGeometry.dispose();
  material.dispose();
});
