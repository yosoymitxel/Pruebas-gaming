// Recorrido completo en navegador: menú → terrario (construir) → archipiélago → recolección →
// expedición → combate (pausa táctica) → resultado. Captura cada pantalla y falla con errores de consola.
// Uso (con `npx vite --port 5199` corriendo en games/terrario-isopodos/):
//   node tools/smoke.mjs [--mobile] [--out carpeta]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const mobile = process.argv.includes('--mobile');
const out = process.argv.includes('--out') ? process.argv[process.argv.indexOf('--out') + 1] : 'artifacts/visual';
const URL = process.env.URL ?? 'http://localhost:5199/';
mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage(mobile ? { viewport: { width: 360, height: 800 }, hasTouch: true, isMobile: true } : { viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
const tag = mobile ? '360' : '1280';
const shot = async (name) => page.screenshot({ path: `${out}/${name}-${tag}.png` });
const wait = (ms) => page.waitForTimeout(ms);
const s = (fn, arg) => page.evaluate(fn, arg);
const check = (cond, msg) => { if (!cond) { errors.push(msg); console.error(`✗ ${msg}`); } };
const click = async (name, label) => {
  try { await page.getByRole('button', { name, exact: typeof name === 'string' }).click({ timeout: 8000 }); }
  catch { await shot(`fallo-${label}`); throw new Error(`no se pudo pulsar «${name}» (${label}); modo=${await s(() => window.__terrario.mode)}`); }
};

await page.goto(URL);
await page.evaluate(() => localStorage.clear());
await page.reload();
await wait(800);
await shot('01-menu');
await page.getByRole('button', { name: 'Nueva partida' }).click();
await wait(1500);
await shot('02-terrario');

await page.getByRole('button', { name: 'Construir' }).click();
await wait(300);
await shot('03-construir');
await page.getByRole('button', { name: /Piedra plana/ }).click();
const before = await s(() => Object.keys(window.__terrario.game.home.grid.pieces).length);
// Celda libre del terrario → posición en pantalla (centro de la celda).
const spot = await s(async () => {
  const { canPlace } = await import('/src/game/grid.js');
  const t = window.__terrario, g = t.game.home.grid;
  for (let j = 0; j < g.h; j++) for (let i = 0; i < g.w; i++) {
    if ([[0,0],[1,0],[0,1],[-1,0],[0,-1]].every(([a, b]) => canPlace(g, 'piedra', i + a, j + b))) return t.stage.project(i + 0.5 - g.w / 2, t.view.island.heightAt(i, j), j + 0.5 - g.h / 2);
  }
});
await page.mouse.move(spot.x, spot.y);
await wait(200);
await page.mouse.click(spot.x, spot.y);
await wait(300);
check(await s(() => Object.keys(window.__terrario.game.home.grid.pieces).length) === before + 1, 'colocar una piedra en el terrario');
await shot('04-colocar');
await page.getByRole('button', { name: 'Listo' }).click();

await page.getByRole('button', { name: 'Salir al archipiélago' }).click();
await wait(400);
await shot('05-archipielago');
await page.locator('.isle-recoleccion:not(.done) button').first().click();
await page.locator('.iso-chip').first().click();
await page.getByRole('button', { name: 'Partir' }).click();
await wait(1200);
await page.keyboard.down('KeyD');
await wait(900);
await page.keyboard.up('KeyD');
await shot('06-recoleccion');
await s(() => { window.__terrario.gather.time = 0.01; });
await wait(300);
await click('Continuar', 'fin de recolección');
await wait(300);
await shot('07-resultado');
await page.getByRole('button', { name: 'Volver al terrario' }).click();
await wait(500);

await page.getByRole('button', { name: 'Salir al archipiélago' }).click();
await page.locator('.isle-nido:not(.done) button').first().click();
for (let k = 0; k < 3; k++) await page.locator('.iso-chip').nth(k).click();
await page.getByRole('button', { name: 'Partir' }).click();
await wait(600);
await shot('08-nido');
await page.locator('.node.reach').first().click({ force: true });
await wait(1500);
check(await s(() => window.__terrario.mode) === 'combat', 'el primer nodo abre un combate');
await page.keyboard.press('KeyJ');
await wait(1200);
await shot('09-combate');
await page.keyboard.press('KeyL');
await wait(300);
await shot('10-tactica');
await page.keyboard.press('KeyL');
// Termina el combate con el piloto automático para comprobar el regreso al mapa.
await s(async () => {
  const { autopilot } = await import('/src/game/autopilot.js');
  const { step } = await import('/src/game/combat.js');
  const c = window.__terrario.combat;
  while (!c.result) step(c, 1 / 60, autopilot(c, 0.95));
});
await wait(400);
await shot('11-fin-combate');
await click('Continuar', 'fin de combate');
await wait(500);
check(['dungeon', 'result'].includes(await s(() => window.__terrario.mode)), 'tras el combate vuelve al mapa o al resultado');
const overflow = await s(() => document.documentElement.scrollWidth > innerWidth);
check(!overflow, 'sin desbordamiento horizontal');
await shot('12-tras-combate');

await browser.close();
console.log(errors.length ? `✗ ${errors.length} error(es):\n${errors.join('\n')}` : `✓ recorrido completo (${tag})`);
process.exit(errors.length ? 1 : 0);
