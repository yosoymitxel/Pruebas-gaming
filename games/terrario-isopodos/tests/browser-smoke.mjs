import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const port = 4173;
const url = `http://127.0.0.1:${port}/`;
const server = spawn("npx", ["vite", "--host", "127.0.0.1", "--port", String(port), "--strictPort"], { stdio: "ignore" });
let browser;
const errors = [];
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(url); if (r.ok) { ready = true; break; } } catch {}
    await delay(500);
  }
  if (!ready) throw new Error("Vite no respondió en 30 segundos");
  await mkdir("artifacts/visual", { recursive: true });
  browser = await chromium.launch({ headless: true, args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("requestfailed", request => errors.push(`request failed: ${request.url()} ${request.failure()?.errorText ?? ""}`));
  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  await page.locator("#scene canvas").waitFor({ state: "visible" });
  await page.getByRole("button", { name: /Voxel/ }).click();
  if (await page.locator("#view-label").textContent() !== "VOXEL / 3D") throw new Error("No cambió el modo a Voxel");
  await page.getByRole("button", { name: /Diorama/ }).click();
  if (await page.locator("#view-label").textContent() !== "DIORAMA 3D") throw new Error("No volvió a Diorama");
  await page.getByRole("button", { name: "Cilíndrico" }).click();
  if (await page.locator('[data-shape="cilindrico"]').getAttribute("aria-pressed") !== "true") throw new Error("No seleccionó el recipiente cilíndrico");
  await page.getByRole("button", { name: "Rectangular" }).click();
  await page.getByRole("button", { name: "+1 min" }).click();
  if (!(await page.locator("#clock").textContent()).includes("08:01")) throw new Error("El reloj no avanzó un minuto");
  if (await page.locator("#count").textContent() !== "01") throw new Error("La cantidad de entidades cambió al alternar renderers");
  await page.screenshot({ path: "artifacts/visual/desktop-1440x1000.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: "artifacts/visual/mobile-390x844.png", fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (overflow) throw new Error("Hay overflow horizontal en viewport móvil");
  if (errors.length) throw new Error(`Errores de consola/red: ${errors.join(" | ")}`);
  console.log(JSON.stringify({ result: "PASS", url, desktop: "1440x1000", mobile: "390x844", modeSwitch: "PASS", bothShapes: "PASS", manualClockStep: "PASS", entityCountStable: "PASS", mobileHorizontalOverflow: false, errors }, null, 2));
} catch (error) {
  console.error(error);
  if (errors.length) console.error("Browser errors:", errors);
  process.exitCode = 1;
} finally {
  await browser?.close();
  server.kill("SIGTERM");
}
