// ¿Todo el código del juego se puede leer? node tools/syntax-check.mjs. Una fusión mala dejó una vez un
// bloque duplicado que rompía la carga del juego sin que fallara ninguna prueba de lógica.
import { readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
const files = [];
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(m?js)$/.test(f)) files.push(p); } };
walk('src');
const bad = files.filter((f) => { try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); return false; } catch (e) { console.log(`✗ ${f}\n${String(e.stderr).split('\n').slice(0, 4).join('\n')}`); return true; } });
console.log(bad.length ? `✗ ${bad.length} archivo(s) con error` : `✓ ${files.length} archivos sin errores de sintaxis`);
process.exit(bad.length ? 1 : 0);
