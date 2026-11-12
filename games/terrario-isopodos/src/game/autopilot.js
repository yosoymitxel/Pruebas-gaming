// Piloto automático del isópodo principal: lo usan el selfcheck (¿cada aberración es vencible?) y la
// demo del menú. Juega como un jugador prudente: esquiva lo que lo alcanzaría, pega, y gasta ATB
// en curar cuando el equipo flojea y en golpes fuertes cuando el enemigo está aturdido o presionado.
import { mainActor, enemies, allies, threatens, useAbility, useItem, weaponOf } from './combat.js';
import { ABILITIES } from '../data/abilities.js';
import { CLASSES } from '../data/isopods.js';

export function autopilot(c, skill = 1) {
  const me = mainActor(c);
  const foes = enemies(c);
  if (!me || !foes.length) return {};
  const target = foes.reduce((b, e) => (Math.hypot(e.x - me.x, e.y - me.y) < Math.hypot(b.x - me.x, b.y - me.y) ? e : b));

  const team = allies(c).filter((a) => a.hp > 0);
  const hurt = team.reduce((s, a) => s + a.hp / a.maxHp, 0) / team.length < 0.55;
  for (const a of team) {
    for (const id of a.abilities ?? CLASSES[a.cls].abilities) {
      const ab = ABILITIES[id];
      const good = ab.kind === 'heal' ? hurt : ab.kind === 'shield' ? hurt : ab.kind === 'taunt' ? false
        : foes.some((e) => e.staggered > 0 || e.pressured > 0);
      if (good && a.atb >= ab.atb && c.rng() < skill) useAbility(c, a.id, id);
    }
  }
  if (me.hp / me.maxHp < 0.35 && c.items.gota > 0) useItem(c, 'gota');

  const threat = foes.find((e) => e.state === 'windup' && e.timer < 0.3 && threatens(e, me));
  if (threat && c.rng() < skill) {
    const ang = Math.atan2(me.y - threat.y, me.x - threat.x) + Math.PI / 2;
    return { move: { x: Math.cos(ang), y: Math.sin(ang) }, roll: true };
  }
  const close = foes.filter((e) => Math.hypot(e.x - me.x, e.y - me.y) < 2 + e.r).length;
  if (close >= 2 && !(me.heavyCd > 0) && c.rng() < skill * 0.1) return { heavy: true }; // varios encima: golpe fuerte en círculo
  const d = Math.hypot(target.x - me.x, target.y - me.y);
  if (d > target.r + weaponOf(c).reach * 0.85) return { move: { x: (target.x - me.x) / d, y: (target.y - me.y) / d } };
  return { attack: true };
}
