export const EXPEDITION_RNG_VERSION=1;
const UINT32_RANGE=0x1_0000_0000;
export function normalizeSeed(value){
  if(!Number.isSafeInteger(value)||value<0||value>0xffffffff)throw new RangeError("La semilla debe ser un entero sin signo de 32 bits");
  return value>>>0;
}
export function deriveSeed(seed,...parts){
  let hash=(0x811c9dc5^normalizeSeed(seed))>>>0;
  const input=parts.map(part=>String(part)).join("\u001f");
  for(let i=0;i<input.length;i++){hash^=input.charCodeAt(i);hash=Math.imul(hash,0x01000193)>>>0;}
  hash^=hash>>>16;hash=Math.imul(hash,0x7feb352d)>>>0;
  hash^=hash>>>15;hash=Math.imul(hash,0x846ca68b)>>>0;
  hash^=hash>>>16;
  return hash>>>0;
}
export function createRng(seed){
  let value=normalizeSeed(seed)||0x6d2b79f5;
  return function next(){
    value=(value+0x6d2b79f5)>>>0;
    let t=value;
    t=Math.imul(t^(t>>>15),t|1);
    t^=t+Math.imul(t^(t>>>7),t|61);
    return ((t^(t>>>14))>>>0)/UINT32_RANGE;
  };
}
export function weightedPick(seed,entries){
  if(!Array.isArray(entries)||entries.length===0)throw new TypeError("La tabla de resultados está vacía");
  const usable=entries.filter(entry=>Number.isSafeInteger(entry.weight)&&entry.weight>0);
  if(!usable.length)throw new RangeError("La tabla debe contener pesos positivos");
  const total=usable.reduce((sum,entry)=>sum+entry.weight,0);
  if(!Number.isSafeInteger(total))throw new RangeError("El peso total supera el rango seguro");
  let roll=createRng(seed)()*total;
  for(const entry of usable){roll-=entry.weight;if(roll<0)return entry.value;}
  return usable.at(-1).value;
}
