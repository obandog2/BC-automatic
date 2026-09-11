#!/bin/sh
# SessionStart hook: list pending tasks in Team Inbox/To Do/.
# Prints nothing when the inbox is empty (no output on clean sessions).
# Registered in .claude/settings.json (project scope).

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

echo "PENDING TASKS in Team Inbox/To Do/ ($count). Report these to the owner before starting new work:$files"
