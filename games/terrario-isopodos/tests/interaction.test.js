import test from "node:test";
import assert from "node:assert/strict";
import { createTerrariumState, snapshotDomain } from "../src/state.js";
import {
  moveIsopod,
  moveResource,
  startleIsopod,
  stepSimulation,
  BIOLOGY_RULES
} from "../src/simulation.js";
import { parseTerrarium, serializeTerrarium } from "../src/persistence.js";

test("tocar un isópodo lo asusta y activa la defensa sin eliminarlo", () => {
  const state = createTerrariumState();
  const entity = state.entities[0];

  const result = startleIsopod(state, entity.id);

  assert.equal(result, entity);
  assert.equal(entity.alive, true);
  assert.equal(entity.behavior, "defensive-curl");
  assert.equal(entity.intent, "defend");
  assert.equal(entity.stress, 1);
  assert.equal(entity.defensiveTicks, 0);
  assert.equal(entity.targetResourceId, null);
});

test("la separación evita solapamientos incluso con dos isópodos en la misma coordenada",()=>{
  const createOverlappingState=()=>{
    const state=createTerrariumState();
    state.resources=[];
    const positions=[[0,0],[0,0],[-.8,-.6],[.8,-.6],[0,.8]];
    state.entities.forEach((entity,index)=>{
      [entity.x,entity.z]=positions[index];
      entity.previousX=entity.x;
      entity.previousZ=entity.z;
      entity.energy=.9;
      entity.hydration=.9;
      entity.stress=0;
      entity.behavior="exploring";
    });
    return state;
  };
  const first=createOverlappingState(),second=createOverlappingState();
  stepSimulation(first,1);
  stepSimulation(second,1);
  assert.deepEqual(first.entities,second.entities,"La separación debe ser determinista");
  const firstPairDistance=Math.hypot(
    first.entities[0].x-first.entities[1].x,
    first.entities[0].z-first.entities[1].z
  );
  assert.ok(Math.abs(firstPairDistance-BIOLOGY_RULES.minimumCollisionDistance)<1e-6,
    "La pareja coincidente debe separarse exactamente hasta el umbral físico");
  for(let i=0;i<first.entities.length;i++){
    for(let j=i+1;j<first.entities.length;j++){
      const a=first.entities[i],b=first.entities[j];
      const distance=Math.hypot(a.x-b.x,a.z-b.z);
      assert.ok(
        distance>=BIOLOGY_RULES.minimumCollisionDistance-1e-6,
        `${a.id} y ${b.id} siguen solapados: ${distance.toFixed(4)} < ${BIOLOGY_RULES.minimumCollisionDistance}`
      );
    }
  }
});

test("el gesto de mover un isópodo conserva su ID y limita el punto al terrario rectangular", () => {
  const state = createTerrariumState();
  const entity = state.entities[0];

  const moved = moveIsopod(state, entity.id, 9, -9);

  assert.equal(moved.id, "isopod-001");
  assert.ok(Math.abs(moved.x - 1.4) < 1e-9);
  assert.ok(Math.abs(moved.z + 0.85) < 1e-9);
  assert.deepEqual(
    { x: moved.previousX, z: moved.previousZ },
    { x: moved.x, z: moved.z }
  );
  assert.equal(moved.targetResourceId, null);
});

test("mover un isópodo a un tarro circular no lo deja fuera del suelo", () => {
  const state = createTerrariumState();
  state.habitat.shape = "cilindrico";

  const moved = moveIsopod(state, "isopod-002", 8, 8);

  assert.ok(Math.hypot(moved.x, moved.z) <= 1.28 + 1e-9);
});

test("el arrastre de un recurso mantiene su identidad y lo limita al recipiente", () => {
  const state = createTerrariumState();
  const original = state.resources.find(resource => resource.id === "shelter-1");

  const moved = moveResource(state, original.id, -9, 9);

  assert.equal(moved, original);
  assert.equal(moved.id, "shelter-1");
  assert.deepEqual({ x: moved.x, z: moved.z }, { x: -1.48, z: 0.93 });
  assert.equal(state.resources.filter(resource => resource.id === "shelter-1").length, 1);
});

test("mover un recurso a un tarro circular respeta el margen de colocación", () => {
  const state = createTerrariumState();
  state.habitat.shape = "cilindrico";

  const moved = moveResource(state, "leaf-litter-1", 10, 0);

  assert.ok(Math.hypot(moved.x, moved.z) <= 1.36 + 1e-9);
});

test("la interacción rechaza coordenadas no finitas sin mutar el dominio", () => {
  const state = createTerrariumState();
  const before = snapshotDomain(state);

  assert.throws(() => moveIsopod(state, "isopod-001", Number.NaN, 1), /posición/);
  assert.throws(() => moveResource(state, "shelter-1", 1, Number.POSITIVE_INFINITY), /posición/);
  assert.equal(snapshotDomain(state), before);
});

test("la interacción ignora IDs inexistentes o individuos muertos", () => {
  const state = createTerrariumState();
  state.entities[0].alive = false;

  assert.equal(startleIsopod(state, "isopod-001"), null);
  assert.equal(moveIsopod(state, "isopod-001", 0, 0), null);
  assert.equal(moveResource(state, "missing-resource", 0, 0), null);
});

test("las posiciones movidas sobreviven al guardado y a la carga", () => {
  const state = createTerrariumState();
  moveIsopod(state, "isopod-001", -.42, .31);
  moveResource(state, "shelter-1", .25, -.34);

  const restored = parseTerrarium(serializeTerrarium(state));

  assert.deepEqual(
    restored.entities.find(entity => entity.id === "isopod-001"),
    state.entities.find(entity => entity.id === "isopod-001")
  );
  assert.deepEqual(
    restored.resources.find(resource => resource.id === "shelter-1"),
    state.resources.find(resource => resource.id === "shelter-1")
  );
});

test("el susto de un clic entra en defensa antes de volver a descansar", () => {
  const state = createTerrariumState();
  startleIsopod(state, "isopod-001");

  stepSimulation(state, 1);

  assert.equal(state.entities[0].behavior, "defensive-curl");
  assert.ok(state.entities[0].stress < 1);
});
