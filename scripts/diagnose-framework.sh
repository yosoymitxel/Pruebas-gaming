#!/usr/bin/env bash
# One-command diagnostic for the Pruebas-gaming framework.
# Run from any directory inside the repository:
#   bash scripts/diagnose-framework.sh
set -uo pipefail

ROOT="$(git rev-parse --show-toplevel 2>/dev/null)" || {
  echo "FAIL: no estás dentro de un repositorio Git."
  exit 2
}
cd "$ROOT"

failures=0
checks=0
pass() { checks=$((checks + 1)); printf 'PASS %s\n' "$1"; }
fail() { checks=$((checks + 1)); failures=$((failures + 1)); printf 'FAIL %s\n' "$1"; }

echo "=== DIAGNÓSTICO DEL FRAMEWORK ==="
printf 'Rama: '; git branch --show-current
printf 'Commit: '; git rev-parse --short HEAD
printf 'Node: '; node --version 2>/dev/null || echo "no instalado"
printf 'npm: '; npm --version 2>/dev/null || echo "no instalado"
printf 'Git: '; git --version 2>/dev/null || echo "no instalado"

required_files=(
  README.md
  AGENTS.md
  framework/README.md
  framework/ORCHESTRATION.md
  framework/QUALITY-GATES.md
  framework/TASK-PROFILES.md
  framework/REPORT-TEMPLATE.md
  docs/CATALOGO.md
  docs/ESTANDARES.md
  .github/workflows/framework-check.yml
  scripts/validate-skills.sh
  scripts/index-skills.sh
  scripts/install-skills.sh
  skills/INDEX.md
)

for file in "${required_files[@]}"; do
  if [[ -s "$file" ]]; then pass "archivo $file"; else fail "falta/vacío: $file"; fi
done

for gate in CODE_GATE GAMEPLAY_GATE DESIGN_GATE INTEGRATION_GATE; do
  if grep -q "$gate" framework/QUALITY-GATES.md; then pass "gate $gate"; else fail "falta gate $gate"; fi
done

if bash -n scripts/validate-skills.sh scripts/index-skills.sh scripts/install-skills.sh; then
  pass "sintaxis de scripts existentes"
else
  fail "sintaxis de scripts existentes"
fi

if grep -q '^name: ' .github/workflows/framework-check.yml &&
   grep -q 'pull_request:' .github/workflows/framework-check.yml &&
   grep -q 'Validate required framework files' .github/workflows/framework-check.yml &&
   grep -q 'Validate skill front matter' .github/workflows/framework-check.yml; then
  pass "estructura básica del workflow CI"
else
  fail "estructura básica del workflow CI"
fi

skill_count=0
while IFS= read -r -d '' file; do
  skill_count=$((skill_count + 1))
  if grep -q '^name: ' "$file" && grep -q '^description: ' "$file"; then
    pass "frontmatter $file"
  else
    fail "frontmatter incompleto: $file"
  fi
done < <(find .agents/skills .claude/skills skills -type f -name SKILL.md -print0 2>/dev/null)

if (( skill_count > 0 )); then
  pass "skills encontradas: $skill_count"
else
  fail "no se encontró ningún SKILL.md"
fi

if node -e 'const [a,b]=process.versions.node.split(".").map(Number); process.exit(a > 22 || (a === 22 && b >= 20) ? 0 : 1)' 2>/dev/null; then
  pass "Node.js cumple mínimo 22.20"
else
  fail "Node.js requiere 22.20 o superior para el instalador"
fi

echo
printf 'Resultado: %s comprobaciones, %s fallos.\n' "$checks" "$failures"
printf 'Estado Git: '
if [[ -z "$(git status --porcelain)" ]]; then
  echo "limpio"
else
  echo "hay cambios locales"
  git status --short
fi

if (( failures > 0 )); then exit 1; fi
echo "DIAGNÓSTICO PASS"
