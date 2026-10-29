import test from "node:test";
import assert from "node:assert/strict";
import {createTerrariumState} from "../src/state.js";
import {purchaseItem,SHOP_ITEMS,stepSimulation} from "../src/simulation.js";
import {serializeTerrarium,parseTerrarium} from "../src/persistence.js";

test("la tienda descuenta bellotas y coloca el artículo comprado",()=>{
  const state=createTerrariumState();
  const before=state.resources.length;
  const result=purchaseItem(state,"mushroom");
  assert.equal(result.coins,30-SHOP_ITEMS.find(item=>item.id==="mushroom").price);
  assert.equal(state.coins,result.coins);
  assert.equal(state.resources.length,before+1);
  assert.equal(state.resources.at(-1).type,"mushroom");
});

test("una compra que no puede pagarse no modifica el terrario",()=>{
  const state=createTerrariumState();
  state.coins=0;
  const before=JSON.stringify(state.resources);
  assert.throws(()=>purchaseItem(state,"bark"),/suficientes bellotas/);
  assert.equal(state.coins,0);
  assert.equal(JSON.stringify(state.resources),before);
});

test("el saldo de tienda sobrevive al guardado y la carga",()=>{
  const state=createTerrariumState();
  purchaseItem(state,"fern");
  const restored=parseTerrarium(serializeTerrarium(state));
  assert.equal(restored.coins,state.coins);
  assert.equal(restored.resources.at(-1).type,"fern");
});

test("el estrés alto activa la conducta defensiva de hacerse bola",()=>{
  const state=createTerrariumState();
  state.entities[0].stress=.99;
  stepSimulation(state,1);
  assert.equal(state.entities[0].behavior,"defensive-curl");
});
