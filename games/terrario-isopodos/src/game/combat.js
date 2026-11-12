// Combate en tiempo real con ATB (lógica pura, sin DOM). Arena circular en unidades de celda.
// La interfaz llama a step() cada fotograma con el dt ya escalado (la pausa táctica pasa dt × 0.1) y
// lee `c.actors` y `c.events` para dibujar. Nada de lo que se ve decide daño ni resultado.
import { ABERRATIONS } from '../data/aberrations.js';
import { ABILITIES, ITEMS } from '../data/abilities.js';
import { CLASSES } from '../data/isopods.js';
import { layoutArena } from './arena.js';
import { speciesOf } from '../data/species.js';
import { POOL } from '../data/arenas.js';
import { mulberry32 } from '../core/rng.js';
import { bump } from '../core/physics.js';

export const ARENA_R = 6;
export const ATB_MAX = 2;
const STAGGER_TIME = 4, STAGGER_DAMAGE = 1.6, PRESSURE_STAGGER = 2.5;
// Esquiva según la especie: bolita (Armadillidium, Cubaris) aguanta más invulnerable y rueda más corto;
// carrera (Porcellio) llega más lejos con menos invulnerabilidad.
const ROLL = { time: 0.32, invuln: 0.3, speed: 9, cooldown: 0.5 };
const DASH = { time: 0.26, invuln: 0.2, speed: 12.5, cooldown: 0.4 };
const BALL = { time: 0.42, invuln: 0.42, speed: 7.5, cooldown: 0.55 };
const COMBO = [{ windup: 0.12, recover: 0.16, mul: 1 }, { windup: 0.12, recover: 0.16, mul: 1.1 }, { windup: 0.2, recover: 0.4, mul: 1.8 }];
const REACH = 1.25;
// Ataque fuerte (como el de Cult of the Lamb): mantener y soltar. Golpe en círculo que empuja y aturde, con espera.
export const HEAVY = { windup: 0.3, recover: 0.42, mul: 2.4, radius: 1.9, stagger: 2.2, cooldown: 2.2, charge: 0.45 };

export function createCombat({ party, enemies, mods = {}, enemyHpMul = 1, items = {}, seed = 1, arena = 'claro' }) {
  const c = { t: 0, rng: mulberry32(seed), actors: [], events: [], items: { ...items }, mods, result: null, nextId: 1, main: 0, arena: layoutArena(arena, seed), poolT: 0 };
  party.forEach((p, i) => addAlly(c, p, i, party.length));
  enemies.forEach((kind, i) => addEnemy(c, kind, (i - (enemies.length - 1) / 2) * 2.2, -3, enemyHpMul));
  c.main = c.actors[0].id;
  return c;
}

function addAlly(c, p, i, n) {
  const cls = CLASSES[p.cls];
  c.actors.push({
    id: c.nextId++, side: 'ally', ref: p.id, cls: p.cls, name: p.name, shell: p.shell,
    x: (i - (n - 1) / 2) * 1.6, y: 4, vx: 0, vy: 0, r: 0.35, hp: p.hp, maxHp: p.maxHp, facing: -Math.PI / 2,
    atb: 0, state: 'idle', timer: 0, combo: 0, comboWindow: 0, invuln: 0, shield: 0, shieldT: 0, taunt: 0,
    held: 0, rollCd: 0, damage: (cls.damage + (p.damageAdd ?? 0)) * (c.mods.damageMul ?? 1), speed: cls.speed * speciesOf(p.shell).speed * (p.speedMul ?? 1), dodged: null,
    abilities: p.abilities ?? cls.abilities,
    dodge: speciesOf(p.shell).rolls ? BALL : DASH,
  });
}

function addEnemy(c, kind, x, y, hpMul = 1) {
  const a = ABERRATIONS[kind];
  const hp = Math.round(a.hp * hpMul);
  c.actors.push({
    id: c.nextId++, side: 'enemy', kind, x, y, vx: 0, vy: 0, r: a.radius, hp, maxHp: hp, facing: Math.PI / 2,
    stagger: 0, staggerMax: a.stagger, staggered: 0, pressured: 0, state: 'idle', timer: 0, attack: null,
    aim: 0, hitSet: null, grabbed: null, hurtDuringGrab: 0,
    cds: a.attacks.map((at) => at.cooldown * (0.3 + 0.5 * c.rng())),
  });
}

const alive = (a) => a.hp > 0;
export const allies = (c) => c.actors.filter((a) => a.side === 'ally');
export const enemies = (c) => c.actors.filter((a) => a.side === 'enemy' && alive(a));
export const mainActor = (c) => c.actors.find((a) => a.id === c.main);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const nearest = (from, list) => list.reduce((best, a) => (!best || dist(from, a) < dist(from, best) ? a : best), null);
const angleDiff = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
const emit = (c, type, data) => c.events.push({ type, t: c.t, ...data });

// input: { move: {x, y}, attack, roll, switchTo } (attack/roll = pulsado este fotograma).
export function step(c, dt, input = {}) {
  if (c.result) return;
  c.t += dt;
  const main = mainActor(c);
  if (input.switchTo) switchMain(c, input.switchTo);
  for (const a of c.actors) if (alive(a)) a.side === 'ally' ? tickAlly(c, a, dt, a === main ? input : null) : tickEnemy(c, a, dt);
  physics(c, dt);
  hazards(c, dt);
  if (!enemies(c).length) finish(c, 'win');
  else if (!allies(c).some(alive)) finish(c, 'lose');
}

function finish(c, result) {
  c.result = result;
  emit(c, result);
}

export function switchMain(c, id) {
  const a = c.actors.find((x) => x.id === id && x.side === 'ally' && alive(x));
  if (a) c.main = a.id;
}

function tickAlly(c, a, dt, input) {
  for (const k of ['invuln', 'rollCd', 'taunt', 'comboWindow', 'heavyCd']) a[k] = Math.max(0, a[k] - dt);
  if (a.shieldT > 0 && (a.shieldT -= dt) <= 0) a.shield = 0;
  a.atb = Math.min(ATB_MAX, a.atb + dt * (input ? 0.02 : 0.05) * atbMul(c));
  if (a.held > 0) { a.held -= dt; a.vx = a.vy = 0; return; }
  if (a.state === 'roll') { if ((a.timer -= dt) <= 0) a.state = 'idle'; return; }
  if (a.state === 'attack') return tickSwing(c, a, dt);
  const intent = input ?? autoAlly(c, a);
  const mx = intent.move?.x ?? 0, my = intent.move?.y ?? 0, len = Math.hypot(mx, my);
  a.vx = len ? (mx / Math.max(1, len)) * a.speed : 0;
  a.vy = len ? (my / Math.max(1, len)) * a.speed : 0;
  if (len > 0.1) a.facing = Math.atan2(my, mx);
  if (intent.roll && a.rollCd <= 0) startRoll(a, len ? mx / len : Math.cos(a.facing), len ? my / len : Math.sin(a.facing));
  else if (intent.heavy && !(a.heavyCd > 0)) { Object.assign(a, { state: 'attack', phase: 'windup', heavy: true, timer: HEAVY.windup, vx: 0, vy: 0, heavyCd: HEAVY.cooldown }); emit(c, 'heavyStart', { id: a.id }); }
  else if (intent.attack) startSwing(c, a);
}

const atbMul = (c) => c.mods.atbMul ?? 1;

function startRoll(a, dx, dy) {
  const r = a.dodge ?? ROLL;
  Object.assign(a, { state: 'roll', timer: r.time, invuln: r.invuln, rollCd: r.time + r.cooldown, vx: dx * r.speed, vy: dy * r.speed });
}

function startSwing(c, a) {
  const target = nearest(a, enemies(c));
  if (target && dist(a, target) < REACH + target.r + 1.5) a.facing = Math.atan2(target.y - a.y, target.x - a.x);
  a.combo = a.comboWindow > 0 ? (a.combo + 1) % COMBO.length : 0;
  Object.assign(a, { state: 'attack', phase: 'windup', timer: COMBO[a.combo].windup, vx: 0, vy: 0 });
}

function tickSwing(c, a, dt) {
  if ((a.timer -= dt) > 0) return;
  if (a.phase === 'windup' && a.heavy) {
    for (const e of enemies(c)) if (dist(a, e) <= HEAVY.radius + e.r) { hurtEnemy(c, e, a.damage * HEAVY.mul, HEAVY.stagger, a); a.atb = Math.min(ATB_MAX, a.atb + 0.3 * atbMul(c)); }
    emit(c, 'heavy', { id: a.id, x: a.x, y: a.y });
    Object.assign(a, { phase: 'recover', timer: HEAVY.recover });
    return;
  }
  if (a.phase === 'windup') {
    const hit = COMBO[a.combo];
    for (const e of enemies(c)) {
      if (dist(a, e) <= REACH + e.r && angleDiff(Math.atan2(e.y - a.y, e.x - a.x), a.facing) < 1.1) {
        hurtEnemy(c, e, a.damage * hit.mul, 1, a);
        a.atb = Math.min(ATB_MAX, a.atb + (a.id === c.main ? 0.2 : 0.12) * atbMul(c));
      }
    }
    Object.assign(a, { phase: 'recover', timer: hit.recover });
  } else {
    Object.assign(a, { state: 'idle', comboWindow: a.heavy ? 0 : 0.45, heavy: false });
  }
}

// Apoyo: se acerca al enemigo más cercano (o se aleja si es Musgoso y hay peligro) y pega.
function autoAlly(c, a) {
  const e = nearest(a, enemies(c));
  if (!e) return {};
  const threat = enemies(c).find((x) => x.state === 'windup' && threatens(x, a));
  if (threat && a.dodged !== threat.id && c.rng() < 0.7) {
    a.dodged = threat.id;
    const away = Math.atan2(a.y - threat.y, a.x - threat.x) + (c.rng() - 0.5);
    return { move: { x: Math.cos(away), y: Math.sin(away) }, roll: true };
  }
  const d = dist(a, e), want = REACH + e.r - 0.2;
  if (d > want) return { move: { x: (e.x - a.x) / d, y: (e.y - a.y) / d } };
  return { attack: c.rng() < 0.03 };
}

// ¿El ataque que `e` está preparando alcanzaría a `a` desde donde está ahora?
export function threatens(e, a) {
  const at = e.attack;
  if (!at) return false;
  const d = dist(e, a), ang = Math.atan2(a.y - e.y, a.x - e.x);
  switch (at.kind) {
    case 'slash': case 'scream': return d <= at.range + e.r + a.r && angleDiff(ang, e.aim) <= at.arc / 2;
    case 'stomp': return d <= at.range + a.r;
    case 'charge': case 'grab': {
      const along = (a.x - e.x) * Math.cos(e.aim) + (a.y - e.y) * Math.sin(e.aim);
      const side = Math.abs(-(a.x - e.x) * Math.sin(e.aim) + (a.y - e.y) * Math.cos(e.aim));
      return along > 0 && along < at.range + e.r && side < e.r + a.r;
    }
    default: return false;
  }
}

function pickTarget(c) {
  const team = allies(c).filter(alive);
  return (c.rng() < 0.6 ? team.find((a) => a.id === c.main) : null) ?? team[Math.floor(c.rng() * team.length)];
}

function tickEnemy(c, e, dt) {
  const def = ABERRATIONS[e.kind];
  e.cds = e.cds.map((t) => Math.max(0, t - dt));
  e.pressured = Math.max(0, e.pressured - dt);
  if (e.grabbed) holdGrab(c, e, dt);
  if (e.staggered > 0) {
    e.vx = e.vy = 0;
    if ((e.staggered -= dt) <= 0) emit(c, 'recover', { id: e.id });
    return;
  }
  if (e.state === 'windup') { if ((e.timer -= dt) <= 0) release(c, e); return; }
  if (e.state === 'active') { chargeTick(c, e, dt); return; }
  if (e.state === 'recover') { e.vx = e.vy = 0; if ((e.timer -= dt) <= 0) e.state = 'idle'; return; }

  const taunting = allies(c).find((a) => alive(a) && a.taunt > 0);
  // Si su objetivo huye lejos y otro isópodo le pega de cerca, se vuelve contra ese: huir no sale gratis.
  const near = allies(c).filter((a) => alive(a) && dist(e, a) < e.r + 2.2).sort((a, b) => dist(e, a) - dist(e, b))[0];
  if (!taunting && near && e.target && dist(e, e.target) > 5) e.target = near;
  if (taunting || !e.target || !alive(e.target)) e.target = taunting ?? pickTarget(c);
  const target = e.target;
  if (!target) return;
  const d = dist(e, target);
  const i = def.attacks.findIndex((at, k) => e.cds[k] <= 0 && usable(c, e, at, d, target));
  e.facing = Math.atan2(target.y - e.y, target.x - e.x);
  if (i >= 0) {
    const at = def.attacks[i];
    e.cds[i] = at.cooldown;
    Object.assign(e, { state: 'windup', timer: at.windup, attack: at, aim: e.facing, vx: 0, vy: 0 });
    emit(c, 'telegraph', { id: e.id, kind: at.kind });
    return;
  }
  const keep = e.r + target.r + 0.6;
  e.vx = d > keep ? ((target.x - e.x) / d) * def.speed : 0;
  e.vy = d > keep ? ((target.y - e.y) / d) * def.speed : 0;
}

function usable(c, e, at, d, target) {
  if (at.kind === 'summon') return c.actors.filter((a) => alive(a) && a.kind === at.spawn).length < at.max;
  if (at.kind === 'charge') return d > 2.5 && d < at.range + e.r;
  return d <= at.range + e.r + target.r;
}

function release(c, e) {
  const at = e.attack;
  emit(c, 'strike', { id: e.id, kind: at.kind });
  if (at.kind === 'charge') {
    Object.assign(e, { state: 'active', timer: 0.35, hitSet: new Set(), vx: Math.cos(e.aim) * at.range / 0.35, vy: Math.sin(e.aim) * at.range / 0.35 });
    return;
  }
  if (at.kind === 'summon') {
    for (let k = 0; k < at.count; k++) {
      const ang = c.rng() * Math.PI * 2;
      addEnemy(c, at.spawn, e.x + Math.cos(ang) * 1.6, e.y + Math.sin(ang) * 1.6);
    }
  } else if (at.kind === 'grab') {
    const victim = allies(c).filter((a) => alive(a) && threatens(e, a)).sort((a, b) => dist(e, a) - dist(e, b))[0];
    if (victim && !hurtAlly(c, victim, at.damage, e).dodged) {
      victim.held = at.hold;
      victim.x = e.x + Math.cos(e.aim) * (e.r + victim.r + 0.1);
      victim.y = e.y + Math.sin(e.aim) * (e.r + victim.r + 0.1);
      Object.assign(e, { grabbed: victim, hurtDuringGrab: 0, grabTick: 0.25 });
    }
  } else {
    for (const a of allies(c)) if (alive(a) && threatens(e, a)) {
      const r = hurtAlly(c, a, at.damage, e);
      if (at.drain && !r.dodged) a.atb = Math.max(0, a.atb - at.drain);
    }
  }
  endAttack(e, at);
}

function endAttack(e, at) {
  Object.assign(e, { state: 'recover', timer: at.recover, pressured: at.pressure ? at.recover : 0, vx: 0, vy: 0 });
}

function chargeTick(c, e, dt) {
  for (const a of allies(c)) {
    if (alive(a) && !e.hitSet.has(a.id) && dist(e, a) < e.r + a.r + 0.15) { e.hitSet.add(a.id); hurtAlly(c, a, e.attack.damage, e); }
  }
  if ((e.timer -= dt) <= 0) endAttack(e, e.attack);
}

function holdGrab(c, e, dt) {
  const v = e.grabbed;
  if (!alive(v) || v.held <= 0 || e.hurtDuringGrab >= 25 || e.staggered > 0) {
    v.held = 0; e.grabbed = null; return;
  }
  if ((e.grabTick -= dt) <= 0) { e.grabTick = 0.25; hurtAlly(c, v, e.attack.damage * 0.5, e); }
}

// Retroceso: empuje que se suma al movimiento y se apaga solo (lo pesado se mueve menos).
function knock(target, from, force) {
  if (!from) return;
  const d = Math.hypot(target.x - from.x, target.y - from.y) || 1;
  target.kbx = (target.kbx ?? 0) + ((target.x - from.x) / d) * force;
  target.kby = (target.kby ?? 0) + ((target.y - from.y) / d) * force;
}

function hurtAlly(c, a, amount, from) {
  if (a.invuln > 0) { emit(c, 'dodge', { id: a.id }); return { dodged: true }; }
  amount *= c.mods.enemyDamageMul ?? 1;
  const absorbed = Math.min(a.shield, amount);
  a.shield -= absorbed;
  const dmg = Math.round(amount - absorbed);
  a.hp = Math.max(0, a.hp - dmg);
  emit(c, 'hit', { id: a.id, amount: dmg, from: from?.id, heavy: dmg >= 15 });
  knock(a, from, Math.min(9, 2 + dmg * 0.25));
  if (a.hp <= 0) {
    a.state = 'down'; a.vx = a.vy = 0; a.held = 0;
    emit(c, 'down', { id: a.id });
    if (a.id === c.main) { const next = allies(c).find(alive); if (next) c.main = next.id; }
  }
  return { dodged: false };
}

function hurtEnemy(c, e, amount, staggerMul, from) {
  const dmg = Math.round(amount * (e.staggered > 0 ? STAGGER_DAMAGE : 1));
  knock(e, from, (amount * 0.35) / ABERRATIONS[e.kind].radius ** 2);
  e.hp = Math.max(0, e.hp - dmg);
  if (e.grabbed) e.hurtDuringGrab += dmg;
  emit(c, 'hit', { id: e.id, amount: dmg, staggered: e.staggered > 0 });
  if (e.staggered <= 0) {
    e.stagger += amount * 0.6 * staggerMul * (e.pressured > 0 ? PRESSURE_STAGGER : 1) * (c.mods.staggerMul ?? 1);
    if (e.stagger >= e.staggerMax) {
      Object.assign(e, { stagger: 0, staggered: STAGGER_TIME, state: 'idle', attack: null, vx: 0, vy: 0 });
      emit(c, 'stagger', { id: e.id });
    }
  }
  if (e.hp <= 0) { e.state = 'dead'; emit(c, 'death', { id: e.id }); }
}

// Habilidad u objeto. Devuelve false si no se puede usar ahora.
export function useAbility(c, actorId, abilityId) {
  const a = c.actors.find((x) => x.id === actorId);
  const ab = ABILITIES[abilityId];
  if (!a || !alive(a) || a.held > 0 || !ab || !(a.abilities ?? CLASSES[a.cls].abilities).includes(abilityId) || a.atb < ab.atb) return false;
  a.atb -= ab.atb;
  apply(c, a, ab);
  emit(c, 'ability', { id: a.id, ability: abilityId });
  return true;
}

export function useItem(c, itemId) {
  const it = ITEMS[itemId], user = mainActor(c);
  if (!it || !(c.items[itemId] > 0) || !user || !alive(user)) return false;
  c.items[itemId]--;
  apply(c, user, it);
  emit(c, 'item', { id: user.id, item: itemId });
  return true;
}

function apply(c, a, ab) {
  const team = allies(c).filter(alive);
  switch (ab.kind) {
    case 'strike': { const e = nearest(a, enemies(c).filter((x) => dist(a, x) <= ab.range + x.r)); if (e) hurtEnemy(c, e, ab.power, ab.staggerMul, a); break; }
    case 'burst': for (const e of enemies(c)) if (dist(a, e) <= ab.range + e.r) hurtEnemy(c, e, ab.power, ab.staggerMul, a); break;
    case 'heal': for (const t of team) t.hp = Math.min(t.maxHp, t.hp + ab.power); break;
    case 'shield': for (const t of team) { t.shield = ab.power; t.shieldT = ab.time; } break;
    case 'taunt': a.taunt = ab.time; for (const e of enemies(c)) e.target = a; break;
  }
}

// Charcas de esporas: cada medio segundo queman a quien esté dentro, sea del bando que sea.
function hazards(c, dt) {
  if (!c.arena.pools.length || (c.poolT += dt) < POOL.tick) return;
  c.poolT = 0;
  for (const a of c.actors) {
    if (!alive(a) || !c.arena.pools.some((p) => Math.hypot(a.x - p.x, a.y - p.y) < p.r + a.r * 0.4)) continue;
    const dmg = POOL.dps * POOL.tick;
    if (a.side === 'enemy') hurtEnemy(c, a, dmg, 0.3, null);
    else hurtAlly(c, a, dmg / (c.mods.enemyDamageMul ?? 1), null);
  }
}

function physics(c, dt) {
  const live = c.actors.filter((a) => alive(a) || a.side === 'ally');
  for (const a of live) {
    if (a.state === 'down') continue;
    a.x += (a.vx + (a.kbx ?? 0)) * dt; a.y += (a.vy + (a.kby ?? 0)) * dt;
    if (a.kbx) { const k = Math.exp(-dt * 10); a.kbx *= k; a.kby *= k; if (Math.abs(a.kbx) + Math.abs(a.kby) < 0.05) a.kbx = a.kby = 0; }
    const d = Math.hypot(a.x, a.y), max = ARENA_R - a.r;
    if (d > max) { a.x *= max / d; a.y *= max / d; }
    const { pillars, pit } = c.arena;
    if (pit && d < pit + a.r) { const k = (pit + a.r) / Math.max(d, 0.01); a.x = (a.x || 0.01) * k; a.y *= k; }
    for (const p of pillars) {
      const dx = a.x - p.x, dy = a.y - p.y, dd = Math.hypot(dx, dy), min = p.r + a.r;
      if (dd < min) { a.x = p.x + (dx / (dd || 1)) * min; a.y = p.y + (dy / (dd || 1)) * min; }
    }
  }
  const solid = live.filter((a) => a.state !== 'down' && !(a.held > 0));
  for (let i = 0; i < solid.length; i++) {
    for (let j = i + 1; j < solid.length; j++) {
      const a = solid[i], b = solid[j];
      if (a.state === 'roll' || b.state === 'roll') continue;
      bump(a, b, a.r + b.r, 0, a.side === 'enemy' ? 6 : 1, b.side === 'enemy' ? 6 : 1);
    }
  }
}
