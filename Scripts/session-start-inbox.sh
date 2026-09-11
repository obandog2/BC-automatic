#!/bin/sh
# Hook SessionStart: lista las tareas pendientes en Team Inbox/To Do/.
# No imprime nada cuando el inbox esta vacio (sin salida en sesiones limpias).
# Registrado en .claude/settings.json (alcance de proyecto).

INBOX="${CLAUDE_PROJECT_DIR:-$(pwd)}/Team Inbox/To Do"

[ -d "$INBOX" ] || exit 0

count=0
files=""
for f in "$INBOX"/*.md; do
  [ -f "$f" ] || continue
  count=$((count + 1))
  files="$files
- $(basename "$f")"
done

[ "$count" -eq 0 ] && exit 0

echo "TAREAS PENDIENTES en Team Inbox/To Do/ ($count). Repórtaselas a la owner antes de empezar trabajo nuevo:$files"
