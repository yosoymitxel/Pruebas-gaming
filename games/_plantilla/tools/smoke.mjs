// Recorrido en navegador: menú → jugar → moverse → pausa → menú. Capturas en artifacts/visual y falla con
// errores de consola. Con `npx vite --port 5199` corriendo: node tools/smoke.mjs [--mobile]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const { chromium } = createRequire(import.meta.url)('playwright');
const mobile = process.argv.includes('--mobile');
const out = 'artifacts/visual';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage(mobile ? { viewport: { width: 360, height: 800 }, hasTouch: true, isMobile: true } : { viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
const tag = mobile ? '360' : '1280';
await page.goto(process.env.URL ?? 'http://localhost:5199/');
await page.waitForTimeout(800);
await page.screenshot({ path: `${out}/01-menu-${tag}.png` });
await page.getByRole('button', { name: 'Jugar' }).click();
await page.waitForTimeout(800);
await page.keyboard.down('KeyD'); await page.waitForTimeout(600); await page.keyboard.up('KeyD');
await page.screenshot({ path: `${out}/02-juego-${tag}.png` });
if (!(await page.evaluate(() => window.__game.game.player.x !== 0))) errors.push('el jugador no se movió');
await page.getByRole('button', { name: 'Pausa' }).click();
await page.getByRole('button', { name: 'Menú' }).click();
if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) errors.push('desbordamiento horizontal');
await browser.close();
console.log(errors.length ? `✗ ${errors.join('\n')}` : `✓ recorrido completo (${tag})`);
process.exit(errors.length ? 1 : 0);
