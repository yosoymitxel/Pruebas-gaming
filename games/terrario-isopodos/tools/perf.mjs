// Medición de laboratorio (web-performance): carga y fluidez en móvil emulado. Una sesión, no datos de campo.
// Uso: npm run build && npx vite preview --port 5200 & node tools/perf.mjs [--desktop]
// Condiciones: 360×800, CPU 4× más lenta, red tipo 4G lenta (1,6 Mb/s, 150 ms). Imprime una tabla JSON.
import { createRequire } from 'node:module';

const { chromium } = createRequire(import.meta.url)('playwright');
const desktop = process.argv.includes('--desktop');
const URL = process.env.URL ?? 'http://localhost:5200/';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage(desktop ? { viewport: { width: 1366, height: 768 } } : { viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const cdp = await page.context().newCDPSession(page);
await cdp.send('Network.enable');
if (!desktop) {
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
}
const bytes = { total: 0, js: 0, css: 0, img: 0, font: 0 };
cdp.on('Network.loadingFinished', (e) => { bytes.total += e.encodedDataLength; });
cdp.on('Network.responseReceived', (e) => {
  const t = e.response.mimeType, kind = t.includes('javascript') ? 'js' : t.includes('css') ? 'css' : t.startsWith('image') ? 'img' : t.includes('font') ? 'font' : null;
  if (kind) cdp.on('Network.loadingFinished', function f(d) { if (d.requestId === e.requestId) { bytes[kind] += d.encodedDataLength; cdp.off('Network.loadingFinished', f); } });
});
await page.addInitScript(() => {
  window.__perf = { lcp: 0, cls: 0, longTasks: 0, longMs: 0 };
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__perf.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__perf.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__perf.longTasks++; window.__perf.longMs += e.duration - 50; } }).observe({ type: 'longtask', buffered: true });
});
const t0 = Date.now();
await page.goto(URL, { waitUntil: 'load' });
const loadMs = Date.now() - t0;
await page.waitForTimeout(2500);
const fcp = await page.evaluate(() => performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? null);
const vitals = await page.evaluate(() => ({ ...window.__perf }));

// Fluidez: fotogramas por segundo y peor fotograma durante 3 s en cada escena.
const fps = async () => page.evaluate(() => new Promise((res) => {
  const times = []; let last = performance.now();
  const end = last + 3000;
  const tick = (t) => { times.push(t - last); last = t; if (t < end) requestAnimationFrame(tick); else res({ fps: Math.round(times.length / 3), worstMs: Math.round(Math.max(...times.slice(2))) }); };
  requestAnimationFrame(tick);
}));
const scenes = { menu: await fps() };
await page.evaluate(() => { localStorage.clear(); window.__terrario.newGame(); });
await page.waitForTimeout(1500);
scenes.terrario = await fps();
await page.evaluate(() => { const s = window.__terrario, isl = s.game.islands.find((i) => i.kind === 'recoleccion'); s.startGather(isl, s.game.home.isopods[0].id); });
await page.waitForTimeout(1500);
scenes.recoleccion = await fps();
await page.evaluate(() => { const s = window.__terrario; s.goHome(); const nest = s.game.islands.find((i) => i.kind === 'nido'); s.startRun(nest, s.game.home.isopods.slice(0, 3).map((i) => i.id)); s.enter(s.run.dungeon.nodes.find((n) => n.layer === 0).id); });
await page.waitForTimeout(1500);
scenes.combate = await fps();
const kb = (n) => Math.round(n / 1024);
console.log(JSON.stringify({
  condiciones: desktop ? '1366×768 sin limitar' : '360×800 dpr2, CPU 4×, 1,6 Mb/s 150 ms',
  cargaMs: loadMs, fcpMs: Math.round(fcp), lcpMs: Math.round(vitals.lcp), cls: +vitals.cls.toFixed(3),
  tareasLargas: vitals.longTasks, bloqueoMs: Math.round(vitals.longMs),
  kB: { total: kb(bytes.total), js: kb(bytes.js), css: kb(bytes.css), img: kb(bytes.img), font: kb(bytes.font) },
  escenas: scenes,
}, null, 1));
await browser.close();
