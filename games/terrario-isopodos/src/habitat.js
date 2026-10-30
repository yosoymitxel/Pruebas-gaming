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

 
// Diagonal hollow-log orientation and complete horizontal footprint.
export const HOLLOW_BARK_ROTATION=Math.PI/5;
export function getBarkFootprint(scale=1,margin=.08){
  if(!Number.isFinite(scale)||scale<=0)throw new RangeError("La escala del tronco debe ser positiva y finita");
  if(!Number.isFinite(margin)||margin<0)throw new RangeError("El margen del tronco debe ser no negativo");
  const halfLength=.39*scale;
  const halfWidth=.18*scale;
  const cosine=Math.abs(Math.cos(HOLLOW_BARK_ROTATION));
  const sine=Math.abs(Math.sin(HOLLOW_BARK_ROTATION));
  return {
    halfLength,halfWidth,rotation:HOLLOW_BARK_ROTATION,
    extentX:halfLength*cosine+halfWidth*sine+margin,
    extentZ:halfLength*sine+halfWidth*cosine+margin,
    radius:Math.hypot(halfLength,halfWidth)+margin
  };
}
export function constrainBarkToHabitat(x,z,shape="rectangular",scale=1.02,margin=.08){
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
