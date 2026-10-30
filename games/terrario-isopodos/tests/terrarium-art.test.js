import test from "node:test";
import assert from "node:assert/strict";
import { terrainHeightAt } from "../src/terrarium-art.js";

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
