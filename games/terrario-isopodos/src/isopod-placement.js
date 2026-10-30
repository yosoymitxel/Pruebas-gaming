/**
 * Pose visual del isópodo respecto al refugio más cercano.
 * No muta la posición de dominio ni las reglas de colisión.
 */
export function resolveIsopodRefugePose(entity, refuge) {
  const resource=refuge?.resource??null;
  const distance=Number(refuge?.distance);
  const inReach=Boolean(resource&&Number.isFinite(distance)&&distance<.43);
  const underCover=Boolean(inReach&&resource.type==="bark"&&["burrowing","resting"].includes(entity?.behavior));
  const perched=inReach&&!underCover;
  const refugeTop=perched?(resource.type==="shelter"?.43:.28):0;
  const burrowOffset=entity?.behavior==="burrowing"&&!underCover&&!perched?-.045:0;
  return {underCover,perched,heightOffset:refugeTop+burrowOffset};
}
