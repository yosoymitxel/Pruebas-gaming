#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if ! command -v node >/dev/null 2>&1 || ! command -v npx >/dev/null 2>&1; then
  echo "ERROR: instala Node.js y npm/npx antes de continuar." >&2
  exit 1
fi

NODE_MAJOR="$(node -p 'Number(process.versions.node.split(".")[0])')"
NODE_MINOR="$(node -p 'Number(process.versions.node.split(".")[1])')"
if (( NODE_MAJOR < 22 || (NODE_MAJOR == 22 && NODE_MINOR < 20) )); then
  echo "ERROR: el CLI actual skills requiere Node.js 22.20 o posterior." >&2
  exit 1
fi

# Copia las skills al repo; evita enlaces simbólicos que se rompan al moverlo.
# Se instalan para Codex y Claude Code dentro del proyecto, no globalmente.
SOURCES=(
  "miqdadbadjuber/anti-slop"
  "dietrichgebert/ponytail"
  "leonxlnx/taste-skill"
  "pbakaus/impeccable"
  "gamedev-skills/awesome-gamedev-agent-skills"
  "Donchitos/Claude-Code-Game-Studios"
  "emilkowalski/skills"
  "https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines"
)

mkdir -p .agents/skills .claude/skills skills
FAILURES=()

for source in "${SOURCES[@]}"; do
  echo
  echo "=== Instalando skills desde: $source ==="
  if npx --yes skills add "$source" --all --copy -a codex -a claude-code -y; then
    echo "OK: $source"
  else
    echo "ERROR: falló la instalación de $source" >&2
    FAILURES+=("$source")
  fi
done

echo
echo "=== Skills detectadas en el repositorio ==="
find .agents/skills .claude/skills -type f -name SKILL.md -print 2>/dev/null | sort -u || true

if (("${#FAILURES[@]}" > 0)); then
  printf '\nERROR: fallaron %s fuentes:\n' "${#FAILURES[@]}" >&2
  printf ' - %s\n' "${FAILURES[@]}" >&2
  echo "Revisa los mensajes anteriores; no se declara instalación completa." >&2
  exit 1
fi

echo
echo "Instalación finalizada sin errores del CLI. Ejecuta ./scripts/validate-skills.sh y revisa licencias y duplicados antes de integrar."
