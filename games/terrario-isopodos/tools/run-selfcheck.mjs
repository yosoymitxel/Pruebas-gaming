// Expediciones completas con el piloto automático: ¿se puede ganar una isla de nido de punta a punta y
// cuánto cuesta? node tools/run-selfcheck.mjs [partidas] [habilidad]. Sale con 1 si queda fuera de rango
// (imposible o un paseo: un jugador medio debe ganar a veces y llegar tocado).
import { newGame } from '../src/game/game.js';
import { newRun, enterNode, enterRoom, pickCard, pickWeapon, combatSetup, finishCombat } from '../src/game/run.js';
import { nextNodes } from '../src/game/dungeon.js';
import { createCombat, step } from '../src/game/combat.js';
import { autopilot } from '../src/game/autopilot.js';
import { mulberry32 } from '../src/core/rng.js';

export function playRun(seed, skill = 0.7, weapon = null, robe = 'comun') {
  const g = newGame(seed), isl = g.islands.find((i) => i.kind === 'nido') ?? g.islands[1], rng = mulberry32(seed);
  const run = newRun(g.home, isl, g.home.isopods.slice(0, 3).map((i) => i.id), 0, { robe });
  let fights = 0, rooms = 0, combatT = 0;
  for (let guard = 0; guard < 400; guard++) {
    if (run.state === 'won' || run.state === 'lost') break;
    if (run.state === 'weapon') { pickWeapon(run, 0); if (weapon) run.weapon = { type: weapon, variant: 'comun' }; continue; }
    if (run.state === 'card') { pickCard(run, run.offer[0]); continue; }
    if (run.state === 'map') { const opts = nextNodes(run.dungeon); if (!opts.length) break; enterNode(run, opts[Math.floor(rng() * opts.length)].id); continue; }
    if (run.state === 'floor') {
      // Como un jugador: a veces se desvía a una lateral; si no queda nada cerca, vuelve sobre sus pasos.
      const f = run.floor, prev = new Map([[f.at, -1]]), q = [f.at];
      for (let h = 0; h < q.length; h++) for (const id of f.rooms[q[h]].links) if (!prev.has(id)) { prev.set(id, q[h]); q.push(id); }
      const todo = q.filter((id) => !f.rooms[id].done), side = todo.filter((id) => !f.rooms[id].main);
      let goal = (side.length && rng() < 0.6 ? side : todo.filter((id) => f.rooms[id].main))[0] ?? todo[0];
      if (goal == null) break;
      while (prev.get(goal) !== f.at) goal = prev.get(goal);
      enterRoom(run, goal); rooms++; continue;
    }
    if (run.state === 'combat') {
      const c = createCombat(combatSetup(run));
      for (let k = 0; k < 60 * 240 && !c.result; k++) step(c, 1 / 60, autopilot(c, skill));
      if (!c.result) c.result = 'lose';
      combatT += c.t; fights++;
      finishCombat(run, c);
    }
  }
  const hp = run.party.reduce((s, p) => s + Math.max(0, p.hp) / p.maxHp, 0) / run.party.length;
  return { state: run.state, fights, rooms, combatT, hp, loot: Object.values(run.loot).reduce((s, n) => s + n, 0) };
}

// Ninguna arma ni manto debe arrasar o hundir la expedición respecto a la pinza común.
export function byOption(n = 60) { // 60 partidas: con 30 el azar del combate hacía saltar la comprobación
  const rate = (w, r) => Array.from({ length: n }, (_, k) => playRun(300 + k, 0.7, w, r)).filter((x) => x.state === 'won').length / n;
  const base = rate('pinza', 'comun');
  const rows = [];
  for (const w of ['mandibula', 'aguijon', 'garras', 'maza']) rows.push({ id: `arma ${w}`, rate: rate(w, 'comun') });
  for (const r of ['dorado', 'cristal', 'destino', 'tozudo', 'berserker']) rows.push({ id: `manto ${r}`, rate: rate('pinza', r) });
  return { base, rows: rows.map((x) => ({ ...x, ok: Math.abs(x.rate - base) <= 0.35 })) };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv[2] === 'opciones') { const { base, rows } = byOption(); console.log(`base pinza ${(base * 100).toFixed(0)} %`); for (const r of rows) console.log(`${r.ok ? '✓' : '✗'} ${r.id.padEnd(16)} ${(r.rate * 100).toFixed(0)} %`); process.exit(rows.every((r) => r.ok) ? 0 : 1); }
  const n = +(process.argv[2] ?? 20), skill = +(process.argv[3] ?? 0.7);
  const rs = Array.from({ length: n }, (_, k) => playRun(100 + k, skill));
  const won = rs.filter((r) => r.state === 'won'), avg = (f, a = rs) => a.reduce((s, r) => s + f(r), 0) / Math.max(1, a.length);
  const rate = won.length / n;
  console.log(`expediciones: ganadas ${(rate * 100).toFixed(0)} % · peleas ${avg((r) => r.fights).toFixed(1)} · salas ${avg((r) => r.rooms).toFixed(1)} · combate ${(avg((r) => r.combatT) / 60).toFixed(1)} min · vida al ganar ${(avg((r) => r.hp, won) * 100).toFixed(0)} % · botín ${avg((r) => r.loot).toFixed(1)}`);
  const ok = rate >= 0.25 && rate <= 0.85;
  console.log(ok ? '✓ dentro de rango (25–85 %)' : '✗ fuera de rango (25–85 %)');
  process.exit(ok ? 0 : 1);
}
