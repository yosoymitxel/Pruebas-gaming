export const HABITAT_GEOMETRY=Object.freeze({
  rectangular:Object.freeze({floorWidth:3.2,floorDepth:2.1,outerWidth:3.35,outerDepth:2.2,wallHeight:.78,wallThickness:.035}),
  cilindrico:Object.freeze({floorRadius:1.48,outerRadius:1.52,wallHeight:.92,wallThickness:.035}),
  esferico:Object.freeze({floorRadius:1.18,outerRadius:1.28,wallHeight:2.56,wallThickness:.035})
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
