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
