#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

mapfile -t FILES < <(find .agents/skills .claude/skills skills -type f -name SKILL.md -not -path '*/node_modules/*' 2>/dev/null | sort -u)
if (("${#FILES[@]}" == 0)); then
  echo "FAIL: no se encontraron archivos SKILL.md. Ejecuta ./scripts/install-skills.sh." >&2
  exit 1
fi

errors=0
for file in "${FILES[@]}"; do
  if ! grep -q '^name:' "$file" || ! grep -q '^description:' "$file"; then
    echo "FAIL: falta name o description en frontmatter: $file" >&2
    errors=$((errors + 1))
  fi
done

echo "SKILL.md encontrados: ${#FILES[@]}"
if (( errors > 0 )); then
  echo "FAIL: ${errors} skills necesitan revisión de frontmatter." >&2
  exit 1
fi
echo "PASS: todas las skills encontradas contienen name y description."
echo "Nota: esta comprobación estructural no valida licencias, seguridad, calidad ni compatibilidad del contenido."
