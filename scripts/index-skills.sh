#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
OUT="skills/INDEX.md"
TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT
mkdir -p skills
printf '# Índice de skills locales\n\n' > "$TMP"
printf 'Generado por scripts/index-skills.sh. Detecta archivos locales; no certifica licencia, calidad ni ejecución.\n\n' >> "$TMP"
count=0
while IFS= read -r file; do
  [[ -n "$file" ]] || continue
  name="$(awk -F: '/^name:[[:space:]]*/ {sub(/^name:[[:space:]]*/, ""); print; exit}' "$file" || true)"
  description="$(awk -F: '/^description:[[:space:]]*/ {sub(/^description:[[:space:]]*/, ""); print; exit}' "$file" || true)"
  [[ -n "$name" ]] || name="$(basename "$(dirname "$file")")"
  [[ -n "$description" ]] || description="Sin descripción en frontmatter; revisar manualmente."
  printf -- '- **%s** — %s  \n  Ruta: %s\n' "$name" "$description" "$file" >> "$TMP"
  count=$((count + 1))
done < <(find .agents/skills .claude/skills skills -type f -name SKILL.md -not -path '*/node_modules/*' 2>/dev/null | sort -u)
if (( count == 0 )); then
  printf 'No se encontraron archivos SKILL.md locales. Las fuentes catalogadas aún no están instaladas.\n' >> "$TMP"
else
  printf '\n**Total de archivos SKILL.md detectados:** %s\n' "$count" >> "$TMP"
fi
printf '\n**Skills externas identificadas para revisión, no instaladas localmente:** game-ui-ux, save-systems, input-systems. Consultar docs/DESCUBRIMIENTO-SKILLS.md.\n' >> "$TMP"
mv "$TMP" "$OUT"
trap - EXIT
echo "Índice actualizado: $OUT (skills detectadas: $count)"
