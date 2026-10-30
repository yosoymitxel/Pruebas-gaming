import { createDioramaKit } from "../diorama-kit.js";

const MAP_POSITIONS = {
  "garden-entry": [0, 1.45], "mossy-stone": [-1.55, 0.63],
  "rotting-log": [1.5, 0.58], "rotten-fruit": [-0.98, -1.08],
  "compost-bin": [1.17, -1.16]
};
const PORTRAIT_MAP_POSITIONS = {
  "garden-entry": [0, -1.95], "mossy-stone": [-0.95, -0.55],
  "rotting-log": [0.95, -0.38], "rotten-fruit": [-0.65, 0.76],
  "compost-bin": [0.55, 1.9]
};

function addPath(T, group, start, end, material, radius = 0.014) {
  const a = new T.Vector3(...start), b = new T.Vector3(...end);
  const curve = new T.CatmullRomCurve3([
    a, a.clone().lerp(b, 0.32).add(new T.Vector3(0, 0.014, 0)),
    a.clone().lerp(b, 0.72).add(new T.Vector3(0, 0.008, 0)), b
  ]);
  const mesh = new T.Mesh(new T.TubeGeometry(curve, 22, radius, 6, false), material);
  mesh.userData.expeditionTrail = true;
  mesh.castShadow = false; mesh.receiveShadow = true; group.add(mesh);
  return mesh;
}

function addNodeMarker(T, kit, group, node, current, seen, nodeScale, preview = false) {
  const island = new T.Group();
  island.position.set(node.position[0], 0.08, node.position[1]);
  island.userData.expeditionNodeId = node.id;
  island.userData.isCurrent = Boolean(current);
  island.userData.isPreview = Boolean(preview);
  island.userData.isVisited = Boolean(seen);
  const marker = new T.Mesh(
    new T.CylinderGeometry(0.34, 0.38, 0.05, 28),
    new T.MeshStandardMaterial({ color: current ? 0x536b3b : preview ? 0x806b45 : seen ? 0x78694b : 0x6d694d, roughness: 0.94 })
  );
  marker.position.y = 0.02; marker.castShadow = true; marker.receiveShadow = true;
  island.add(marker);
  const ring = new T.Mesh(
    new T.TorusGeometry(0.275, 0.014, 7, 28),
    new T.MeshStandardMaterial({ color: current ? 0xe4dda9 : preview ? 0xc5a36b : seen ? 0x8b9d72 : 0x827b5c, roughness: 0.7 })
  );
  ring.position.y = 0.048; ring.rotation.x = Math.PI / 2; island.add(ring);
  kit.addBiome(island, node.id, { groundY: 0.07, scale: nodeScale, density: 0.72 });
  const pick = new T.Mesh(
    new T.CylinderGeometry(0.45, 0.45, 0.5, 24),
    new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide })
  );
  pick.position.y = 0.23; pick.userData.expeditionNodeId = node.id; island.add(pick);
  group.add(island);
}

function addActor(root, position, makeIsopod, scale, rotation) {
  if (typeof makeIsopod !== "function") return null;
  const actor = makeIsopod();
  actor.name = "expedition-isopod"; actor.scale.setScalar(scale);
  actor.position.set(...position); actor.rotation.y = rotation;
  actor.userData.expeditionActor = true;
  actor.userData.baseX = actor.position.x; actor.userData.baseZ = actor.position.z;
  root.add(actor); return actor;
}

export function buildExpeditionMapDiorama(T, {
  nodes, visitedNodes = [], currentNodeId = "garden-entry", previewNodeId = null, seed = 0,
  aspect = 1, makeIsopod = null, biomeId = "woodland-map",
  paletteOverrides = {}, nodePositions = null, nodeScale = 0.58,
  actorScale = 0.42, scatterDensity = 1
} = {}) {
  const portrait = aspect < 0.78;
  const kit = createDioramaKit({ shape: "esferico", radius: 2.62, seed, paletteOverrides });
  const root = kit.createBase(2.75,{plinthDepth:0.14,soilDepth:0.09,plinthOverhang:0.04,rimRadius:0.018});
  const localPositions = nodePositions
    ? { ...(portrait ? PORTRAIT_MAP_POSITIONS : MAP_POSITIONS), ...nodePositions }
    : (portrait ? PORTRAIT_MAP_POSITIONS : MAP_POSITIONS);
  const positionMap = {};
  for (const [id, base] of Object.entries(localPositions)) {
    positionMap[id] = [
      base[0] + (kit.random() - 0.5) * (portrait ? 0.09 : 0.13),
      base[1] + (kit.random() - 0.5) * (portrait ? 0.11 : 0.13)
    ];
  }
  kit.addBiome(root, biomeId, { groundY: 0.078, density: 1 });
  kit.addAsset(root, "leaf-litter", {
    groundY: 0.078, count: Math.round(104 * scatterDensity), kind: "ground",
    colors: [0x6c5038, 0x856343, 0xa17c4f, 0x596542, 0xb18a58]
  });
  const links = new Set();
  const trailMaterial = new T.MeshStandardMaterial({color:0x566b48,roughness:0.99,metalness:0});
  for (const node of Object.values(nodes ?? {})) {
    for (const target of node.links ?? []) {
      const key = [node.id, target].sort().join("|");
      if (links.has(key)) continue;
      links.add(key);
      const a = positionMap[node.id], b = positionMap[target];
      if (a && b) addPath(T, root, [a[0], 0.095, a[1]], [b[0], 0.095, b[1]], trailMaterial);
    }
  }
  const visited = new Set(visitedNodes);
  for (const node of Object.values(nodes ?? {})) {
    const [x, z] = positionMap[node.id] ?? [0, 0];
    addNodeMarker(T, kit, root, { ...node, position: [x, z] }, node.id === currentNodeId, visited.has(node.id), nodeScale, node.id === previewNodeId);
  }
  const actorNodeId=currentNodeId??"garden-entry";
  const current = positionMap[actorNodeId] ?? [0, 0];
  addActor(root, [current[0] - 0.43, 0.17, current[1] + 0.38], makeIsopod, actorScale, -0.5);

  const localMapPositions = structuredClone(positionMap);
  if (portrait) {
    root.scale.set(0.55, 1, 1.05);
    for (const [id, position] of Object.entries(positionMap)) positionMap[id] = [position[0] * 0.55, position[1] * 1.05];
  }
  root.userData.mapPositions = positionMap;
  root.userData.expeditionTrailCount = links.size;
  root.userData.mapPositionsLocal = localMapPositions;
  root.userData.expeditionPortrait = portrait;
  root.userData.expeditionScene = "map";
  root.userData.biomeId = biomeId;
  return root;
}

function addChoiceTarget(T, root, id, position, index) {
  const target = new T.Group();
  target.position.set(...position); target.userData.expeditionChoiceId = id;
  const ring = new T.Mesh(
    new T.TorusGeometry(0.19, 0.025, 8, 24),
    new T.MeshStandardMaterial({ color: index === 0 ? 0xd5d99b : 0xc7a36e, roughness: 0.48 })
  );
  ring.position.y = 0.04; ring.rotation.x = Math.PI / 2;
  const marker = new T.Mesh(
    new T.OctahedronGeometry(0.095, 1),
    new T.MeshStandardMaterial({ color: index === 0 ? 0x839653 : 0xa27b4b, roughness: 0.64 })
  );
  marker.position.y = 0.22; marker.scale.y = 1.35;
  const pick = new T.Mesh(
    new T.SphereGeometry(0.34, 12, 9),
    new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  pick.position.y = 0.19; pick.userData.expeditionChoiceId = id;
  target.add(ring, marker, pick); root.add(target);
}

const EVENT_ASSETS = Object.freeze({
  web: Object.freeze([{ type: "web", position: [0, 0.12, -0.1], groundY: 0.078, scale: 0.92 }]),
  mites: Object.freeze([{ type: "mites", position: [0, 0, 0], groundY: 0.078, scale: 1.15 }]),
  dew: Object.freeze([{ type: "dew", position: [0, 0, 0], groundY: 0.078, scale: 1 }]),
  fruit: Object.freeze([{ type: "fallen-fruit", position: [0.08, 0, 0.12], groundY: 0.078, scale: 0.9, size: 0.36 }]),
  compost: Object.freeze([{ type: "compost-pile", position: [0.08, 0, 0.08], groundY: 0.078, scale: 0.92, size: 0.48 }])
});

export function buildExpeditionLevelDiorama(T, {
  nodeId, event, seed = 0, aspect = 1, makeIsopod = null,
  biomeId = nodeId, biomeScale = 1.35, paletteOverrides = {},
  choicePositions = null, actorScale = 0.34
} = {}) {
  const kit = createDioramaKit({ shape: "esferico", radius: 1.48, seed: seed ^ 0x51a9e31, paletteOverrides });
  const root = kit.createBase(1.95);
  kit.addAsset(root, "leaf-litter", {
    groundY: 0.078, count: 68, kind: "ground",
    colors: [0x6c5038, 0x856343, 0xa17c4f, 0x596542, 0xb18a58]
  });
  kit.addBiome(root, biomeId, { groundY: 0.078, scale: biomeScale });
  for (const asset of EVENT_ASSETS[event?.type] ?? []) kit.addAsset(root, asset.type, asset);
  const positions = choicePositions ?? [
    [-0.82, 0.16, 0.92], [0.82, 0.16, 0.92],
    [-0.82, 0.16, -0.82], [0, 0.16, -0.92]
  ];
  for (let i = 0; i < (event?.options?.length ?? 0); i++) {
    addChoiceTarget(T, root, event.options[i].id, positions[i] ?? [0, 0.16, -0.92], i);
  }
  addActor(root, [-0.15, 0.16, 1.22], makeIsopod, actorScale, 0.7);
  const portrait = aspect < 0.78;
  if (portrait) root.scale.set(0.72, 1, 1.25);
  root.userData.expeditionPortrait = portrait;
  root.userData.expeditionScene = "level";
  root.userData.eventType = event?.type ?? "";
  root.userData.nodeId = nodeId;
  root.userData.biomeId = biomeId;
  return root;
}
