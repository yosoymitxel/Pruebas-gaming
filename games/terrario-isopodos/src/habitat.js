export const HABITAT_GEOMETRY=Object.freeze({
  rectangular:Object.freeze({floorWidth:3.2,floorDepth:2.1,outerWidth:3.35,outerDepth:2.2,wallHeight:1.28,wallThickness:.035}),
  cilindrico:Object.freeze({floorRadius:1.48,outerRadius:1.52,wallHeight:.82,wallThickness:.035}),
  esferico:Object.freeze({floorRadius:1.18,outerRadius:1.28,wallHeight:1.78,wallThickness:.035})
});
/** Los recipientes redondos tienen suelo circular; el globo no es una pared caminable. */
export function constrainToHabitat(x,z,shape="rectangular",margin=0){
  if(!Number.isFinite(x)||!Number.isFinite(z))throw new TypeError("La posición del hábitat debe ser finita");
  if(!Number.isFinite(margin)||margin<0)throw new RangeError("El margen del hábitat debe ser no negativo");
  const spec=HABITAT_GEOMETRY[shape];
  if(!spec)throw new Error("La forma del terrario no es válida");
  if(shape!=="rectangular"){
    const radius=Math.max(0,spec.floorRadius-margin),distance=Math.hypot(x,z);
    if(distance<=radius||distance===0)return{x,z};
    const scale=radius/distance;return{x:x*scale,z:z*scale};
  }
  const halfWidth=Math.max(0,spec.floorWidth/2-margin),halfDepth=Math.max(0,spec.floorDepth/2-margin);
  return{x:Math.max(-halfWidth,Math.min(halfWidth,x)),z:Math.max(-halfDepth,Math.min(halfDepth,z))};
}

 
// Shared dimensions are the source of truth for rendering, placement and perching.
export const REFUGE_MODEL_PROFILES=Object.freeze({
  shelter:Object.freeze({length:1.22,thickness:.32,scale:1.10,perchClearance:.05}),
  bark:Object.freeze({length:1.18,thickness:.24,scale:1.08,perchClearance:.05})
});

export function refugePerchHeight(resource){
  const profile=REFUGE_MODEL_PROFILES[resource?.type];
  if(!profile)return 0;
  const amount=Math.min(1.2,Math.max(.4,Number(resource?.amount??1)));
  return profile.thickness*profile.scale*amount+profile.perchClearance;
}

// Diagonal hollow-log orientation and complete horizontal footprint.
export const HOLLOW_BARK_ROTATION=Math.PI/5;
export function getBarkFootprint(scale=REFUGE_MODEL_PROFILES.bark.scale,margin=.08){
  if(!Number.isFinite(scale)||scale<=0)throw new RangeError("La escala del tronco debe ser positiva y finita");
  if(!Number.isFinite(margin)||margin<0)throw new RangeError("El margen del tronco debe ser no negativo");
  const halfLength=REFUGE_MODEL_PROFILES.bark.length*.5*scale;
  const halfWidth=REFUGE_MODEL_PROFILES.bark.thickness*scale;
  const cosine=Math.abs(Math.cos(HOLLOW_BARK_ROTATION));
  const sine=Math.abs(Math.sin(HOLLOW_BARK_ROTATION));
  return {
    halfLength,halfWidth,rotation:HOLLOW_BARK_ROTATION,
    extentX:halfLength*cosine+halfWidth*sine+margin,
    extentZ:halfLength*sine+halfWidth*cosine+margin,
    radius:Math.hypot(halfLength,halfWidth)+margin
  };
}
export function constrainBarkToHabitat(x,z,shape="rectangular",scale=REFUGE_MODEL_PROFILES.bark.scale,margin=.08){
  if(!Number.isFinite(x)||!Number.isFinite(z))throw new TypeError("La posición del tronco debe ser finita");
  const spec=HABITAT_GEOMETRY[shape];
  if(!spec)throw new Error("La forma del terrario no es válida");
  const footprint=getBarkFootprint(scale,margin);
  if(shape==="rectangular"){
    const maxX=Math.max(0,spec.floorWidth/2-footprint.extentX);
    const maxZ=Math.max(0,spec.floorDepth/2-footprint.extentZ);
    return {
      x:Math.max(-maxX,Math.min(maxX,x)),
      z:Math.max(-maxZ,Math.min(maxZ,z))
    };
  }
  const maxRadius=Math.max(0,spec.floorRadius-footprint.radius);
  const distance=Math.hypot(x,z);
  if(distance<=maxRadius||distance===0)return{x,z};
  const factor=maxRadius/distance;
  return{x:x*factor,z:z*factor};
}

export function getShelterFootprint(scale=REFUGE_MODEL_PROFILES.shelter.scale,margin=.05){
  if(!Number.isFinite(scale)||scale<=0)throw new RangeError("La escala del refugio debe ser positiva y finita");
  if(!Number.isFinite(margin)||margin<0)throw new RangeError("El margen del refugio debe ser no negativo");
  const halfLength=REFUGE_MODEL_PROFILES.shelter.length*.5*scale;
  const halfWidth=REFUGE_MODEL_PROFILES.shelter.thickness*scale;
  return {
    halfLength,halfWidth,
    extentX:halfLength+margin,
    extentZ:halfWidth+margin,
    radius:Math.hypot(halfLength,halfWidth)+margin
  };
}

export function constrainShelterToHabitat(x,z,shape="rectangular",scale=REFUGE_MODEL_PROFILES.shelter.scale,margin=.05){
  if(!Number.isFinite(x)||!Number.isFinite(z))throw new TypeError("La posición del refugio debe ser finita");
  const spec=HABITAT_GEOMETRY[shape];
  if(!spec)throw new Error("La forma del terrario no es válida");
  const footprint=getShelterFootprint(scale,margin);
  if(shape==="rectangular"){
    const maxX=Math.max(0,spec.floorWidth/2-footprint.extentX);
    const maxZ=Math.max(0,spec.floorDepth/2-footprint.extentZ);
    return {
      x:Math.max(-maxX,Math.min(maxX,x)),
      z:Math.max(-maxZ,Math.min(maxZ,z))
    };
  }
  const maxRadius=Math.max(0,spec.floorRadius-footprint.radius);
  const distance=Math.hypot(x,z);
  if(distance<=maxRadius||distance===0)return{x,z};
  const factor=maxRadius/distance;
  return{x:x*factor,z:z*factor};
}
