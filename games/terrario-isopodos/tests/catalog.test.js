import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");

test("root catalogue links each registered game to a real standalone entry", async () => {
  const [index, catalogText] = await Promise.all([
    readFile(resolve(repoRoot, "index.html"), "utf8"),
    readFile(resolve(repoRoot, "games/catalog.json"), "utf8")
  ]);
  const catalog = JSON.parse(catalogText);
  assert.match(index, /fetch\(["']\.\/games\/catalog\.json["']\)/);
  assert.ok(Array.isArray(catalog.games));
  assert.ok(catalog.games.length > 0, "catalogue must expose at least one game");
  const ids = new Set();
  for (const game of catalog.games) {
    assert.ok(game.id && !ids.has(game.id), `missing or duplicate game id: ${game.id}`);
    ids.add(game.id);
    assert.ok(game.name && game.description, `missing catalogue copy for ${game.id}`);
    assert.match(game.path, /^\.\/games\/[a-z0-9-]+\/$/);
    const entry = resolve(repoRoot, game.path.slice(2), "index.html");
    await assert.doesNotReject(readFile(entry, "utf8"), `missing direct game entry: ${game.path}`);
  }
});
