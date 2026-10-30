import { createDioramaKit } from "../diorama-kit.js";

const MAP_POSITIONS = {
  "garden-entry": [0, 1.45],
  "abandoned-pot": [-1.15, 1.15],
  "mossy-stone": [-1.65, 0.05],
  "mite-nest": [-1.1, -1.25],
  "rotten-fruit": [0, -1.55],
  "compost-bin": [1.15, -1.2],
  "web-zone": [1.75, 0.05],
  "rotting-log": [1.15, 1.15]
};

const PORTRAIT_MAP_POSITIONS = {
  "garden-entry": [0, -1.95],
  "abandoned-pot": [-0.95, -1.35],
  "mossy-stone": [-0.95, -0.55],
  "mite-nest": [-0.85, 0.45],
  "rotten-fruit": [-0.3, 1.65],
  "compost-bin": [0.7, 1.65],
  "web-zone": [0.95, 0.55],
  "rotting-log": [0.9, -0.6]
};

function addPath(T,group,start,end,material,surfaceHeightAt,halfWidth=.085) {
  const a=new T.Vector3(start[0],surfaceHeightAt(start[0],start[2])+.009,start[2]);
  const b=new T.Vector3(end[0],surfaceHeightAt(end[0],end[2])+.009,end[2]);
  const curve=new T.CatmullRomCurve3([
    a,
    a.clone().lerp(b,.34).add(new T.Vector3(0,.012,0)),
    a.clone().lerp(b,.72).add(new T.Vector3(0,.006,0)),
    b
  ]);
  const segments=40,positions=[],uvs=[],indices=[];
  for(let i=0;i<=segments;i++){
    const t=i/segments,center=curve.getPointAt(t),tangent=curve.getTangentAt(t);
    const side=new T.Vector3(-tangent.z,0,tangent.x).normalize();
    const width=halfWidth*(.82+.18*Math.sin(Math.PI*t));
    for(const sign of [-1,1]){
      const x=center.x+side.x*width*sign,z=center.z+side.z*width*sign;
      positions.push(x,surfaceHeightAt(x,z)+.012,z);
      uvs.push(t,sign<0?0:1);
    }
    if(i<segments){
      const aIndex=i*2,bIndex=aIndex+1,cIndex=aIndex+2,dIndex=cIndex+1;
      indices.push(aIndex,bIndex,cIndex,bIndex,dIndex,cIndex);
    }
  }
  const geometry=new T.BufferGeometry();
  geometry.setAttribute("position",new T.Float32BufferAttribute(positions,3));
  geometry.setAttribute("uv",new T.Float32BufferAttribute(uvs,2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const trail=new T.Mesh(geometry,material);
  trail.name="expedition-soil-trail";
  trail.userData.expeditionTrail=true;
  trail.userData.halfWidth=halfWidth;
  trail.castShadow=false;
  trail.receiveShadow=true;
  group.add(trail);
  return trail;
}

function addNodeLandmark(T,kit,root,node,current,seen,preview,nodeScale,unlocked) {
  const [x,z]=node.position;
  const landmark=kit.addBiome(root,node.id,{
    position:[x,0,z],
    scale:nodeScale,
    density:current?.95:.9
  });
  landmark.name="expedition-landmark-"+node.id;
  landmark.userData.expeditionNodeId=node.id;
  landmark.userData.isCurrent=Boolean(current);
  landmark.userData.isPreview=Boolean(preview);
  landmark.userData.isVisited=Boolean(seen);
  landmark.userData.isLocked=!unlocked;
  if(!unlocked){
    const gate=new T.Group();
    gate.name="expedition-locked-root-gate";
    for(const angle of [-.58,.58]){
      const branch=new T.Mesh(new T.CylinderGeometry(.014,.021,.62,7),kit.materials.darkBark);
      branch.position.set(0,.24,.13);
      branch.rotation.z=angle;
      branch.rotation.x=.2;
      branch.castShadow=true;
      gate.add(branch);
    }
    landmark.add(gate);
  }
  const pick=new T.Mesh(
    new T.SphereGeometry(.53,14,10),
    new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false})
  );
  pick.name="expedition-node-hotspot";
  pick.position.set(0,.36,0);
  pick.userData.expeditionNodeId=node.id;
  landmark.add(pick);
  return landmark;
}

function addActor(root,position,makeIsopod,scale,rotation) {
  if(typeof makeIsopod!=="function")return null;
  const actor=makeIsopod();
  actor.name="expedition-isopod";
  actor.scale.setScalar(scale);
  actor.position.set(...position);
  actor.rotation.y=rotation;
  actor.userData.expeditionActor=true;
  actor.userData.baseX=actor.position.x;
  actor.userData.baseZ=actor.position.z;
  root.add(actor);
  return actor;
}

export function buildExpeditionMapDiorama(T,{
  nodes,visitedNodes=[],currentNodeId="garden-entry",previewNodeId=null,seed=0,
  aspect=1,makeIsopod=null,biomeId="woodland-map",
  paletteOverrides={},nodePositions=null,nodeScale=1.04,
  actorScale=.86,scatterDensity=1,unlockedNodeIds=null
}={}) {
  const portrait=aspect<.78;
  const kit=createDioramaKit({shape:"esferico",radius:2.75,seed,paletteOverrides});
  const root=kit.createBase(2.75,{
    plinthDepth:.12,soilDepth:.15,plinthOverhang:.035,
    rimRadius:.012,segments:88,radialSegments:26
  });
  const localPositions=nodePositions
    ? {...(portrait?PORTRAIT_MAP_POSITIONS:MAP_POSITIONS),...nodePositions}
    : (portrait?PORTRAIT_MAP_POSITIONS:MAP_POSITIONS);
  const positionMap={};
  for(const [id,base] of Object.entries(localPositions)){
    positionMap[id]=[
      base[0]+(kit.random()-.5)*(portrait?.055:.09),
      base[1]+(kit.random()-.5)*(portrait?.07:.09)
    ];
  }

  kit.addAsset(root,"groundcover",{
    count:Math.round(330*scatterDensity),
    kind:"groundcover-random",
    name:"expedition-groundcover",
    colors:[0x496b3b,0x5d7d43,0x759451]
  });
  kit.addAsset(root,"leaf-litter",{
    count:Math.round(260*scatterDensity),
    kind:"random",
    name:"expedition-leaf-litter",
    colors:[0x6c5038,0x856343,0xa17c4f,0x596542,0xb18a58]
  });
  kit.addBiome(root,biomeId,{density:1});

  const links=new Set();
  for(const node of Object.values(nodes??{})){
    for(const targetId of node.links??[]){
      const key=[node.id,targetId].sort().join("|");
      if(links.has(key))continue;
      links.add(key);
      const a=positionMap[node.id],b=positionMap[targetId];
      if(a&&b)addPath(T,root,[a[0],0,a[1]],[b[0],0,b[1]],kit.materials.path,kit.surfaceHeightAt,.085);
    }
  }

  const visited=new Set(visitedNodes);
  const unlocked=new Set(unlockedNodeIds??Object.keys(nodes??{}));
  const lockedNodeIds=[];
  for(const node of Object.values(nodes??{})){
    const [x,z]=positionMap[node.id]??[0,0];
    const isUnlocked=unlocked.has(node.id);
    if(!isUnlocked)lockedNodeIds.push(node.id);
    addNodeLandmark(T,kit,root,{...node,position:[x,z]},
      node.id===currentNodeId,visited.has(node.id),node.id===previewNodeId,nodeScale,isUnlocked);
  }

  if(currentNodeId&&positionMap[currentNodeId]){
    const current=positionMap[currentNodeId];
    const actorX=current[0]-.3,actorZ=current[1]+.34;
    addActor(root,[actorX,kit.surfaceHeightAt(actorX,actorZ)+.022,actorZ],makeIsopod,actorScale,-.48);
  }

  const localMapPositions=structuredClone(positionMap);
  if(portrait){
    root.scale.set(.55,1,1.05);
    for(const [id,position] of Object.entries(positionMap)){
      positionMap[id]=[position[0]*.55,position[1]*1.05];
    }
  }
  root.userData.mapPositions=positionMap;
  root.userData.mapPositionsLocal=localMapPositions;
  root.userData.expeditionPortrait=portrait;
  root.userData.expeditionScene="map";
  root.userData.biomeId=biomeId;
  root.userData.surfaceType="organic-soil-cutaway";
  root.userData.landmarkCount=Object.keys(nodes??{}).length;
  root.userData.lockedNodeIds=lockedNodeIds;
  root.userData.lockedNodeCount=lockedNodeIds.length;
  root.userData.expeditionTrailCount=links.size;
  return root;
}

const EVENT_SCENES=Object.freeze({
  web:Object.freeze({
    assets:[
      Object.freeze({type:"web",position:[-.52,0,-.12],scale:1.2,span:.62}),
      Object.freeze({type:"moss-bed",position:[.5,0,-.08],scale:.88,density:.86})
    ],
    choices:[[-.52,.2,-.12],[.5,.2,-.08]]
  }),
  mites:Object.freeze({
    assets:[
      Object.freeze({type:"mites",position:[-.5,0,-.12],scale:1.25,count:28,size:.034,radius:.23}),
      Object.freeze({type:"fallen-log",position:[.48,0,-.08],scale:1.1})
    ],
    choices:[[-.5,.2,-.12],[.48,.2,-.08]]
  }),
  dew:Object.freeze({
    assets:[
      Object.freeze({type:"dew",position:[-.5,0,-.12],scale:1.15,count:9,size:.095,radius:.12,height:.12}),
      Object.freeze({type:"moss-bed",position:[.5,0,-.08],scale:.96,density:.9})
    ],
    choices:[[-.5,.24,-.12],[.5,.2,-.08]]
  }),
  fruit:Object.freeze({
    assets:[
      Object.freeze({type:"fallen-fruit",position:[-.48,0,-.1],scale:1,size:.52}),
      Object.freeze({type:"mushroom-cluster",position:[.52,0,-.08],scale:.98,density:.86})
    ],
    choices:[[-.48,.24,-.1],[.52,.2,-.08]]
  }),
  roots:Object.freeze({
    assets:[
      Object.freeze({type:"broken-pot",position:[-.36,0,-.1],scale:1.02,size:.62}),
      Object.freeze({type:"root-arch",position:[.46,0,-.04],scale:1.08})
    ],
    choices:[[-.36,.22,-.1],[.46,.2,-.04]]
  }),
  compost:Object.freeze({
    assets:[
      Object.freeze({type:"compost-pile",position:[-.48,0,-.1],scale:1,size:.62}),
      Object.freeze({type:"moss-bed",position:[.5,0,-.08],scale:.9,density:.86})
    ],
    choices:[[-.48,.24,-.1],[.5,.2,-.08]]
  })
});

function addChoiceTarget(T,root,id,position) {
  const target=new T.Group();
  target.position.set(...position);
  target.userData.expeditionChoiceId=id;
  target.name="expedition-choice-hotspot";
  const pick=new T.Mesh(
    new T.SphereGeometry(.48,14,10),
    new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false})
  );
  pick.position.y=.08;
  pick.userData.expeditionChoiceId=id;
  target.add(pick);
  root.add(target);
  return target;
}

export function buildExpeditionLevelDiorama(T,{
  nodeId,event,seed=0,aspect=1,makeIsopod=null,
  biomeId=nodeId,biomeScale=1.1,paletteOverrides={},
  choicePositions=null,actorScale=.92
}={}) {
  const kit=createDioramaKit({shape:"esferico",radius:1.95,seed:seed^0x51a9e31,paletteOverrides});
  const root=kit.createBase(1.95,{plinthDepth:.12,soilDepth:.15,plinthOverhang:.03,rimRadius:.01,segments:88,radialSegments:26});
  kit.addAsset(root,"groundcover",{count:125,kind:"groundcover-random",name:"encounter-groundcover"});
  kit.addAsset(root,"leaf-litter",{count:135,kind:"random",name:"encounter-leaf-litter"});
  kit.addBiome(root,biomeId,{scale:biomeScale,density:.9});

  const scene=EVENT_SCENES[event?.type]??{assets:[],choices:[]};
  for(const asset of scene.assets)kit.addAsset(root,asset.type,asset);
  const positions=choicePositions??scene.choices;
  for(let i=0;i<(event?.options?.length??0);i++){
    const fallback=i===0?[-.5,.22,-.1]:[.5,.22,-.08];
    addChoiceTarget(T,root,event.options[i].id,positions[i]??fallback);
  }

  const actorX=.02,actorZ=1.04;
  addActor(root,[actorX,kit.surfaceHeightAt(actorX,actorZ)+.024,actorZ],makeIsopod,actorScale,.42);
  const portrait=aspect<.78;
  if(portrait)root.scale.set(.68,1,1.16);
  root.userData.expeditionPortrait=portrait;
  root.userData.expeditionScene="level";
  root.userData.eventType=event?.type??"";
  root.userData.nodeId=nodeId;
  root.userData.biomeId=biomeId;
  root.userData.surfaceType="organic-soil-cutaway";
  root.userData.focalAssets=scene.assets.map(asset=>asset.type);
  return root;
}
