const material=(T,color,roughness=.94,extra={})=>new T.MeshStandardMaterial({color,roughness,...extra});
function makeMesh(T,geometry,mat,position=[0,0,0]){
  const object=new T.Mesh(geometry,mat);
  object.position.set(...position);
  object.castShadow=true;
  object.receiveShadow=true;
  return object;
}
function seeded(seed){
  let value=(seed>>>0)||0x6d2b79f5;
  return ()=>{value=(value+0x6d2b79f5)>>>0;let t=value;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
function addLeaf(T,group,x,z,scale,angle,color){
  const leaf=makeMesh(T,new T.SphereGeometry(1,9,6),material(T,color,.98),[x,.115,z]);
  leaf.scale.set(scale,.018,scale*.42);
  leaf.rotation.y=angle;
  group.add(leaf);
  return leaf;
}
function addRoot(T,group,a,b,radius=.035,color=0x654b32){
  const start=new T.Vector3(...a),end=new T.Vector3(...b),direction=end.clone().sub(start);
  const curve=new T.CatmullRomCurve3([
    start,
    start.clone().lerp(end,.32).add(new T.Vector3(0,.035,0)),
    start.clone().lerp(end,.72).add(new T.Vector3(0,.018,0)),
    end
  ]);
  const root=makeMesh(T,new T.TubeGeometry(curve,18,radius,7,false),material(T,color,.99));
  group.add(root);
  return root;
}
function addFern(T,group,x,z,size,random){
  const fern=new T.Group();
  const stemMat=material(T,0x536d40),leafMats=[material(T,0x6f874a),material(T,0x82975a),material(T,0x9aa56a)];
  for(let frond=0;frond<5;frond++){
    const angle=frond*2.399963229728653+random()*.18;
    const length=size*(.72+random()*.4);
    const end=[Math.cos(angle)*length,.22+length*.44,Math.sin(angle)*length];
    const curve=new T.CatmullRomCurve3([new T.Vector3(0,.08,0),new T.Vector3(end[0]*.35,.16,end[2]*.35),new T.Vector3(...end)]);
    fern.add(makeMesh(T,new T.TubeGeometry(curve,9,.009*size,5,false),stemMat));
    for(let pair=1;pair<=3;pair++){
      const t=pair/4,point=curve.getPoint(t);
      for(const side of [-1,1]){
        const blade=makeMesh(T,new T.SphereGeometry(1,7,5),leafMats[(frond+pair)%leafMats.length],[point.x+Math.cos(angle+side*.85)*.055*size,point.y,point.z+Math.sin(angle+side*.85)*.055*size]);
        blade.scale.set(.075*size,.014*size,.026*size);
        blade.rotation.y=angle+side*.7;
        fern.add(blade);
      }
    }
  }
  fern.position.set(x,0,z);
  group.add(fern);
}
function addStone(T,group,x,z,size,color=0x777b6b){
  const geometry=new T.IcosahedronGeometry(size,1),p=geometry.attributes.position;
  for(let i=0;i<p.count;i++){
    const factor=.86+Math.sin(i*2.17+x*7)*.12;
    p.setXYZ(i,p.getX(i)*factor,p.getY(i)*(.72+Math.cos(i*1.73+z)*.12),p.getZ(i)*factor);
  }
  geometry.computeVertexNormals();
  const stone=makeMesh(T,geometry,material(T,color,.99,{flatShading:true}),[x,.16+size*.32,z]);
  stone.rotation.set(.08*Math.sin(x),x*2.1,.08*Math.cos(z));
  group.add(stone);
  return stone;
}
function addMoss(T,group,x,z,radius,random){
  const colors=[0x536d3f,0x6e854b,0x82935a,0x435d37];
  for(let i=0;i<16;i++){
    const angle=random()*Math.PI*2,distance=Math.sqrt(random())*radius;
    const tuft=makeMesh(T,new T.SphereGeometry(.055+random()*.06,7,5),material(T,colors[i%colors.length],.99),[x+Math.cos(angle)*distance,.12+random()*.035,z+Math.sin(angle)*distance]);
    tuft.scale.set(1.35,.36,1.1);
    group.add(tuft);
  }
}
function addLog(T,group,x,z,length=.95,angle=.22){
  const bark=material(T,0x60472f,.99,{flatShading:true});
  const log=makeMesh(T,new T.CylinderGeometry(.19,.22,length,12,2),bark,[x,.28,z]);
  log.rotation.z=Math.PI/2;
  log.rotation.y=angle;
  group.add(log);
  for(const side of [-1,1]){
    const ring=makeMesh(T,new T.TorusGeometry(.17,.014,6,20),material(T,0x96724b,.96),[x+side*length*.5,.28,z]);
    ring.rotation.y=Math.PI/2;
    group.add(ring);
  }
  for(let i=0;i<5;i++){
    const ridge=makeMesh(T,new T.SphereGeometry(.12,7,5),material(T,i%2?0x71563a:0x523c2b,.99),[x+(i-2)*.16,.34+Math.sin(i*1.6)*.055,z+.12*Math.cos(i)]);
    ridge.scale.set(.55,.24,.24);
    ridge.rotation.y=angle;
    group.add(ridge);
  }
}
function addFruit(T,group,x,z,scale=.3){
  const apple=makeMesh(T,new T.SphereGeometry(1,16,12),material(T,0x80503b,.98),[x,.2,z]);
  apple.scale.set(scale,scale*.83,scale*.88);
  apple.rotation.z=.17;
  group.add(apple);
  const rot=makeMesh(T,new T.CylinderGeometry(.015,.021,.12,6),material(T,0x50402d),[x,.2+scale*.84,z]);
  rot.rotation.z=-.3;
  group.add(rot);
  const leaf=makeMesh(T,new T.SphereGeometry(1,8,6),material(T,0x657a43),[x+.1,.2+scale*.94,z]);
  leaf.scale.set(.12,.018,.055);
  leaf.rotation.y=.5;
  group.add(leaf);
}
function addCompost(T,group,x,z,scale=.55){
  const mound=makeMesh(T,new T.SphereGeometry(1,18,12),material(T,0x4b4030,.99),[x,.16,z]);
  mound.scale.set(scale,.24,scale*.84);
  group.add(mound);
  const fragments=[0x816a43,0x9b8050,0x687347,0x594c34];
  for(let i=0;i<22;i++){
    const angle=i*2.399963229728653,distance=.08+((i*37)%11)/11*scale*.75;
    const piece=makeMesh(T,new T.SphereGeometry(.045+(i%3)*.009,6,5),material(T,fragments[i%fragments.length],.99),[x+Math.cos(angle)*distance,.25+((i%4)*.006),z+Math.sin(angle)*distance]);
    piece.scale.set(1.5,.35,.75);
    piece.rotation.y=angle;
    group.add(piece);
  }
}
function addWeb(T,group){
  const points=[
    [-.62,.55,-.12],[.58,.62,.04],
    [-.47,.72,-.05],[.45,.75,.05]
  ];
  addRoot(T,group,points[0],points[1],.022,0x4b3b2b);
  addRoot(T,group,points[2],points[3],.014,0xc7c8b0);
  const center=new T.Vector3(.03,.65,-.035);
  const webMaterial=new T.MeshBasicMaterial({color:0xc7cdb7,transparent:true,opacity:.62});
  for(let ray=0;ray<9;ray++){
    const angle=ray/9*Math.PI*2;
    const end=new T.Vector3(center.x+Math.cos(angle)*.54,center.y+Math.sin(angle)*.12,center.z+Math.sin(angle)*.19);
    const curve=new T.CatmullRomCurve3([center.clone(),center.clone().lerp(end,.5).add(new T.Vector3(0,.025,0)),end]);
    group.add(new T.Line(new T.BufferGeometry().setFromPoints(curve.getPoints(14)),webMaterial));
  }
  for(const radius of [.12,.23,.34,.45,.54]){
    const vertices=[];
    for(let i=0;i<=48;i++){
      const angle=i/48*Math.PI*2;
      vertices.push(new T.Vector3(center.x+Math.cos(angle)*radius,center.y+Math.sin(angle)*.06,center.z+Math.sin(angle)*radius*.36));
    }
    group.add(new T.Line(new T.BufferGeometry().setFromPoints(vertices),webMaterial));
  }
}
function addMites(T,group){
  const colors=[0x40372b,0x756145,0x8c7956];
  for(let i=0;i<24;i++){
    const a=i*2.399963229728653,r=.08+((i*17)%13)/13*.28;
    const mite=makeMesh(T,new T.SphereGeometry(.027+(i%4)*.004,7,5),material(T,colors[i%colors.length],.82),[-.2+Math.cos(a)*r,.2+((i%3)*.009),.12+Math.sin(a)*r]);
    mite.scale.set(1.35,.8,1);
    group.add(mite);
  }
}
function addDew(T,group){
  for(let i=0;i<7;i++){
    const a=i*2.399963229728653,r=.1+(i%3)*.12;
    const drop=makeMesh(T,new T.SphereGeometry(.085,12,9),new T.MeshPhysicalMaterial({color:0xb5d7d2,roughness:.08,metalness:.02,transparent:true,opacity:.78,clearcoat:1}),[Math.cos(a)*r,.3+(i%2)*.045,Math.sin(a)*r]);
    drop.scale.set(.68,1.25,.68);
    group.add(drop);
  }
}
function baseIsland(T,root,radius){
  const plinth=makeMesh(T,new T.CylinderGeometry(radius,radius+.07,.22,56),material(T,0x553f2d,.98),[0,-.15,0]);
  const soil=makeMesh(T,new T.CylinderGeometry(radius*.985,radius,.12,56),material(T,0x514735,.99),[0,.015,0]);
  root.add(plinth,soil);
  const top=makeMesh(T,new T.CircleGeometry(radius*.985,64),material(T,0x69734d,.99,{side:T.DoubleSide}),[0,.078,0]);
  top.rotation.x=-Math.PI/2;
  root.add(top);
  const rim=makeMesh(T,new T.TorusGeometry(radius*.99,.035,8,72),material(T,0x8d704c,.9),[0,.078,0]);
  rim.rotation.x=Math.PI/2;
  root.add(rim);
  return root;
}
const MAP_POSITIONS={
  "garden-entry":[0,1.45],
  "mossy-stone":[-1.55,.63],
  "rotting-log":[1.5,.58],
  "rotten-fruit":[-.98,-1.08],
  "compost-bin":[1.17,-1.16]
};
const NODE_LABELS={
  "garden-entry":"Jardín húmedo",
  "mossy-stone":"Piedra musgosa",
  "rotting-log":"Tronco podrido",
  "rotten-fruit":"Fruta caída",
  "compost-bin":"Compostero"
};
function nodeProp(T,group,id,random){
  if(id==="garden-entry"){
    addRoot(T,group,[-.37,.2,.04],[-.25,.58,.04],.045,0x72543a);
    addRoot(T,group,[-.25,.58,.04],[.05,.68,.04],.043,0x72543a);
    addRoot(T,group,[.05,.68,.04],[.36,.23,.04],.045,0x72543a);
    addLeaf(T,group,-.28,.28,.2,-.8,0x76834d);
    addLeaf(T,group,.25,.3,.22,.55,0x82945a);
    addMoss(T,group,0,0,.28,random);
  }else if(id==="mossy-stone"){
    addStone(T,group,-.14,.02,.32);
    addStone(T,group,.18,.15,.2,0x656c5e);
    addMoss(T,group,-.12,.02,.31,random);
    addFern(T,group,-.34,-.18,.46,random);
  }else if(id==="rotting-log"){
    addLog(T,group,0,.02,.95,-.14);
    addMoss(T,group,-.18,.04,.23,random);
    addFern(T,group,.42,-.2,.43,random);
  }else if(id==="rotten-fruit"){
    addFruit(T,group,-.05,.05,.31);
    addLeaf(T,group,.24,-.04,.19,1.2,0x806344);
    addMushrooms(T,group,.4,-.22,.75);
  }else if(id==="compost-bin"){
    addCompost(T,group,0,.02,.46);
    addLeaf(T,group,-.38,-.12,.2,-.6,0x8b7147);
    addLeaf(T,group,.28,.18,.17,.7,0x78834d);
  }
}
function addMushrooms(T,group,x,z,size){
  for(let i=0;i<3;i++){
    const h=(.1+(i%2)*.035)*size,dx=(i-1)*.08*size,dz=(i%2)*.05*size;
    group.add(makeMesh(T,new T.CylinderGeometry(.018*size,.025*size,h,7),material(T,0xd2c6aa),[x+dx,.12+h/2,z+dz]));
    const cap=makeMesh(T,new T.SphereGeometry(1,10,7),material(T,i%2?0x947050:0x8a6345),[x+dx,.12+h+.025*size,z+dz]);
    cap.scale.set(.065*size,.03*size,.06*size);
    group.add(cap);
  }
}
export function buildExpeditionMapDiorama(T,{nodes,visitedNodes=[],currentNodeId="garden-entry",seed=0,aspect=1,makeIsopod=null}={}){
  const portrait=aspect<.78;
  const root=baseIsland(T,new T.Group(),2.75),random=seeded(seed);
  const localPositions=portrait?{
    "garden-entry":[0,-1.95],
    "mossy-stone":[-.95,-.55],
    "rotting-log":[.95,-.38],
    "rotten-fruit":[-.65,.76],
    "compost-bin":[.55,1.9]
  }:MAP_POSITIONS;
  const positionMap={};
  for(const [id,base] of Object.entries(localPositions)){
    positionMap[id]=[base[0]+(random()-.5)*(portrait?.09:.13),base[1]+(random()-.5)*(portrait?.11:.13)];
  }
  const links=new Set();
  for(const node of Object.values(nodes??{})){
    for(const target of node.links??[]){
      const key=[node.id,target].sort().join("|");
      if(links.has(key))continue;
      links.add(key);
      const a=positionMap[node.id],b=positionMap[target];
      if(a&&b)addRoot(T,root,[a[0],.17,a[1]],[b[0],.17,b[1]],.052,0x806443);
    }
  }
  const pathDots=material(T,0x9d906a,.99);
  for(let i=0;i<34;i++){
    const angle=random()*Math.PI*2,r=.35+random()*2.25;
    const pebble=makeMesh(T,new T.SphereGeometry(.035+random()*.035,6,5),pathDots,[Math.cos(angle)*r,.105,Math.sin(angle)*r]);
    pebble.scale.y=.45;
    root.add(pebble);
  }
  for(let i=0;i<22;i++){
    const angle=random()*Math.PI*2,r=1.72+random()*.78;
    addLeaf(T,root,Math.cos(angle)*r,Math.sin(angle)*r,.12+random()*.13,random()*Math.PI,random()>.5?0x806342:0x9b8058);
  }
  addFern(T,root,-2.0,.1,.72,random);
  addFern(T,root,1.9,-1.7,.66,random);
  const visited=new Set(visitedNodes);
  for(const node of Object.values(nodes??{})){
    const [x,z]=positionMap[node.id]??[0,0];
    const island=new T.Group();
    island.position.set(x,.08,z);
    island.userData.expeditionNodeId=node.id;
    const current=node.id===currentNodeId,seen=visited.has(node.id);
    const ringColor=current?0xe4dda9:seen?0x8b9d72:0xb78b50;
    island.add(makeMesh(T,new T.CylinderGeometry(.4,.44,.075,28),material(T,current?0x536b3b:seen?0x78694b:0x6d694d),[0,.03,0]));
    const ring=makeMesh(T,new T.TorusGeometry(.32,.024,8,28),material(T,ringColor,.55),[0,.075,0]);
    ring.rotation.x=Math.PI/2;
    island.add(ring);
    nodeProp(T,island,node.id,random);
    const pick=makeMesh(T,new T.CylinderGeometry(.45,.45,.5,24),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide}),[0,.23,0]);
    pick.userData.expeditionNodeId=node.id;
    island.add(pick);
    root.add(island);
  }
  if(typeof makeIsopod==="function"){
    const actor=makeIsopod();
    actor.name="expedition-isopod";
    actor.scale.setScalar(.38);
    const [x,z]=positionMap[currentNodeId]??[0,0];
    actor.position.set(x-.43,.17,z+.38);
    actor.rotation.y=-.5;
    actor.userData.expeditionActor=true;
    actor.userData.baseX=actor.position.x;
    actor.userData.baseZ=actor.position.z;
    root.add(actor);
  }
  const localMapPositions=structuredClone(positionMap);
  if(portrait){
    // Un mapa vertical se lee mejor en teléfonos sin sacrificar el terreno.
    root.scale.set(.55,1,1.05);
    for(const [id,position] of Object.entries(positionMap))positionMap[id]=[position[0]*.55,position[1]*1.05];
  }
  root.userData.mapPositions=positionMap;
  root.userData.mapPositionsLocal=localMapPositions;
  root.userData.expeditionPortrait=portrait;
  root.userData.expeditionScene="map";
  return root;
}
function addChoiceTarget(T,root,id,position,index){
  const [x,y,z]=position;
  const target=new T.Group();
  target.position.set(x,y,z);
  target.userData.expeditionChoiceId=id;
  const color=index===0?0xd5d99b:0xc7a36e;
  const ring=makeMesh(T,new T.TorusGeometry(.19,.025,8,24),material(T,color,.48),[0,.04,0]);
  ring.rotation.x=Math.PI/2;
  const marker=makeMesh(T,new T.OctahedronGeometry(.095,1),material(T,index===0?0x839653:0xa27b4b,.64),[0,.22,0]);
  marker.scale.y=1.35;
  const pick=makeMesh(T,new T.SphereGeometry(.34,12,9),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),[0,.19,0]);
  pick.userData.expeditionChoiceId=id;
  target.add(ring,marker,pick);
  root.add(target);
}
export function buildExpeditionLevelDiorama(T,{nodeId,event,seed=0,aspect=1,makeIsopod=null}={}){
  const root=baseIsland(T,new T.Group(),1.95),random=seeded(seed^0x51a9e31);
  addMoss(T,root,-.85,-.6,.48,random);
  addFern(T,root,1.15,-.62,.58,random);
  addStone(T,root,-1.12,.46,.22,0x6e7467);
  addLeaf(T,root,-.35,-.96,.25,-.3,0x8a6944);
  addLeaf(T,root,.72,.84,.22,.7,0x998256);
  if(nodeId==="garden-entry"){
    addRoot(T,root,[-.9,.17,.14],[-.35,.5,.14],.05);
    addRoot(T,root,[-.35,.5,.14],[.38,.16,.14],.05);
    addMoss(T,root,.12,.22,.5,random);
    addDew(T,root);
  }else if(nodeId==="mossy-stone"){
    addStone(T,root,0,.18,.53);
    addStone(T,root,.45,-.14,.29,0x656b60);
    addMoss(T,root,0,.18,.52,random);
    addDew(T,root);
  }else if(nodeId==="rotting-log"){
    addLog(T,root,0,.16,1.52,-.2);
    addMoss(T,root,-.18,.12,.32,random);
    if(event?.type==="web")addWeb(T,root);
    else addMites(T,root);
  }else if(nodeId==="rotten-fruit"){
    addFruit(T,root,-.12,.16,.47);
    addMushrooms(T,root,.58,-.12,1.25);
    addMites(T,root);
  }else if(nodeId==="compost-bin"){
    addCompost(T,root,0,.12,.82);
    addLeaf(T,root,-.55,-.25,.34,-.3,0x90764a);
    addLeaf(T,root,.52,.35,.3,.8,0x7b8050);
    addMites(T,root);
  }
  if(event?.type==="web"){
    addWeb(T,root);
  }else if(event?.type==="fruit"){
    addFruit(T,root,.03,.3,.38);
    addMushrooms(T,root,-.68,-.2,1.15);
  }else if(event?.type==="mites"){
    addMites(T,root);
    addLeaf(T,root,.42,-.48,.22,.9,0x8d754d);
  }else if(event?.type==="dew"){
    addDew(T,root);
    addMoss(T,root,.1,.08,.43,random);
  }else if(event?.type==="compost"){
    addCompost(T,root,.1,.12,.72);
  }
  const positions=[
    [-.82,.16,.92],
    [.82,.16,.92],
    [-.82,.16,-.82]
  ];
  for(let i=0;i<(event?.options?.length??0);i++){
    const option=event.options[i];
    const position=positions[i]??[0,.16,-.92];
    addChoiceTarget(T,root,option.id,position,i);
  }
  if(typeof makeIsopod==="function"){
    const actor=makeIsopod();
    actor.name="expedition-isopod";
    actor.scale.setScalar(.34);
    actor.position.set(-.15,.16,1.22);
    actor.rotation.y=.7;
    actor.userData.expeditionActor=true;
    actor.userData.baseX=actor.position.x;
    actor.userData.baseZ=actor.position.z;
    root.add(actor);
  }
  const portrait=aspect<.78;
  if(portrait)root.scale.set(.72,1,1.25);
  root.userData.expeditionPortrait=portrait;
  root.userData.expeditionScene="level";
  root.userData.eventType=event?.type??"";
  root.userData.nodeId=nodeId;
  return root;
}
