// ¿Cada aberración es vencible por el equipo inicial y no trivial? node tools/combat-selfcheck.mjs
// Juega 20 combates por aberración con el piloto automático y cuenta victorias. Sale con 1 si alguna
// queda fuera de rango (imposible o paseo).
import { createCombat, step } from '../src/game/combat.js';
import { autopilot } from '../src/game/autopilot.js';
import { ABERRATIONS } from '../src/data/aberrations.js';
import { CLASSES } from '../src/data/isopods.js';

const PARTY = ['rodador', 'guardian', 'musgoso'].map((cls, i) => ({ id: i + 1, cls, name: cls, hp: CLASSES[cls].hp, maxHp: CLASSES[cls].hp }));
const ENCOUNTERS = { larva: ['larva', 'larva', 'larva'], bufon: ['bufon'], segador: ['segador'], gemela: ['gemela'], comensal: ['comensal'] };

export function fight(kinds, seed, skill = 0.85) {
  const c = createCombat({ party: PARTY.map((p) => ({ ...p })), enemies: kinds, items: { gota: 2, hongo: 1 }, seed });
  for (let k = 0; k < 60 * 240 && !c.result; k++) step(c, 1 / 60, autopilot(c, skill));
  const hpLeft = c.actors.filter((a) => a.side === 'ally').reduce((s, a) => s + a.hp / a.maxHp, 0) / 3;
  return { result: c.result ?? 'timeout', time: c.t, hpLeft };
}

export function selfcheck(runs = 20) {
  const rows = [];
  for (const [id, kinds] of Object.entries(ENCOUNTERS)) {
    const games = Array.from({ length: runs }, (_, s) => fight(kinds, 1000 + s));
    const wins = games.filter((g) => g.result === 'win');
    const minWins = ABERRATIONS[id].role === 'jefe' ? 0.5 : 0.75;
    rows.push({
      id, wins: wins.length / runs, minWins,
      avgTime: wins.reduce((s, g) => s + g.time, 0) / Math.max(1, wins.length),
      avgHpLeft: wins.reduce((s, g) => s + g.hpLeft, 0) / Math.max(1, wins.length),
    });
  }
  // Pasable para un jugador prudente y que no sea un paseo (algo de vida perdida o algún tropiezo).
  return rows.map((r) => ({ ...r, ok: r.wins >= r.minWins && (r.wins < 1 || r.avgHpLeft < 0.95) }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rows = selfcheck();
  for (const r of rows) console.log(`${r.ok ? '✓' : '✗'} ${r.id.padEnd(9)} victorias ${(r.wins * 100).toFixed(0)} % (mín ${r.minWins * 100}), ${r.avgTime.toFixed(0)} s, vida restante ${(r.avgHpLeft * 100).toFixed(0)} %`);
  process.exit(rows.every((r) => r.ok) ? 0 : 1);
}
