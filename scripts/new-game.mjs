// Crea un juego nuevo a partir de games/_plantilla y lo registra en el catálogo.
// Uso (desde la raíz): node scripts/new-game.mjs <id-en-minusculas> "Nombre del juego"
import { cpSync, readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const [id, name] = process.argv.slice(2);
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id ?? '') || !name) {
  console.error('Uso: node scripts/new-game.mjs <id-en-minusculas> "Nombre del juego"');
  process.exit(1);
}
const root = new URL('..', import.meta.url).pathname;
const from = join(root, 'games/_plantilla'), to = join(root, 'games', id);
if (existsSync(to)) { console.error(`Ya existe games/${id}`); process.exit(1); }

const SKIP = new Set(['node_modules', 'dist', 'artifacts', 'package-lock.json']);
cpSync(from, to, { recursive: true, filter: (src) => !SKIP.has(src.split('/').pop()) });

const TEXT = /\.(js|mjs|json|html|css|md)$/;
const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));
for (const file of walk(to).filter((f) => TEXT.test(f))) {
  const text = readFileSync(file, 'utf8');
  if (text.includes('__ID__') || text.includes('__NOMBRE__')) writeFileSync(file, text.replaceAll('__ID__', id).replaceAll('__NOMBRE__', name));
}

const catalogPath = join(root, 'games/catalog.json');
const catalog = JSON.parse(readFileSync(catalogPath, 'utf8'));
catalog.games.push({ id, name, category: 'Por definir', status: 'Prototipo', description: `${name}: en desarrollo.`, path: `./games/${id}/`, art: 'none' });
writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);

// Fila en la tabla de enlaces de games/README.md (después de la última fila existente).
const readmePath = join(root, 'games/README.md');
const lines = readFileSync(readmePath, 'utf8').split('\n');
const last = lines.findLastIndex((l) => l.startsWith('| ') && l.includes('[Jugar]'));
lines.splice(last + 1, 0, `| ${name} | [Jugar](https://yosoymitxel.github.io/Pruebas-gaming/games/${id}/) | [${id}/](${id}/README.md) |`);
writeFileSync(readmePath, lines.join('\n'));

console.log(`Creado games/${id}. Siguiente:\n  cd games/${id} && npm install && npm test && npx vite`);
