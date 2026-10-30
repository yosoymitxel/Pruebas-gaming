import { refugePerchHeight } from "./habitat.js";

/**
 * Pose visual del isópodo respecto al refugio más cercano.
 * No muta la posición de dominio ni las reglas de colisión.
 */
export function resolveIsopodRefugePose(entity, refuge) {
  const resource=refuge?.resource??null;
  const distance=Number(refuge?.distance);
  const inReach=Boolean(resource&&Number.isFinite(distance)&&distance<.43);
  const approachingThisBark=entity?.behavior==="seeking-shelter"&&entity?.intent==="shelter"&&entity?.targetResourceId===resource?.id;
  const settledUnderBark=["burrowing","resting"].includes(entity?.behavior);
  const underCover=Boolean(inReach&&resource.type==="bark"&&(approachingThisBark||settledUnderBark));
  const perched=inReach&&!underCover;
  const refugeTop=perched?refugePerchHeight(resource):0;
  const burrowOffset=entity?.behavior==="burrowing"&&!underCover&&!perched?-.045:0;
  return {underCover,perched,heightOffset:refugeTop+burrowOffset};
}
