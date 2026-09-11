# Playbook: Periodic System Audit

**Maintained by:** Tuti
**Last updated:** 2026-09-11

## Purpose

A quarterly health check of the entire agent ecosystem. Catches drift, consolidates memories, refreshes playbooks, and ensures the system stays clean as the team grows.

## Trigger

Run this playbook:
- Every quarter (or whenever the owner requests a system health check)
- When a memory file reaches 800 words
- When a new agent has been active for 90 days and has never been audited

## Flow

```
1. Tuti reads all profiles, native agent files, memories, and CLAUDE.md
         │
         ▼
2. Tuti produces audit report → Owner Inbox/Pending Review/
         │
         ▼
3. Owner reviews findings and confirms priority actions
         │
         ▼
4. Tuti implements approved changes (profiles, memories, playbooks)
         │
         ▼
5. Tuti updates Playbooks/_index.md and bumps work-system.md version
         │
         ▼
6. Tuti confirms completion in Owner Inbox/Output/
```

## Step Details

**Step 1:** Use the `ecosystem-audit` skill (see `Team/Tuti/skills/ecosystem-audit.md`). Read everything before writing the report.

**Step 2:** The report format is defined in the ecosystem-audit skill. File it to `Owner Inbox/Pending Review/` with Needs: Review.

**Step 3:** Owner reads the report and marks which Critical and Advisory findings to action. Observations are optional.

**Step 4:** Tuti implements only the confirmed actions. Does not make changes beyond what was approved.

**Step 5:** If any playbook files were changed, update the index. If the work system was changed, bump the version number in `Data/work-system.md`.

**Step 6:** Write a brief completion note to `Owner Inbox/Output/`: what was changed, what was deferred, next audit date.

## Notes

- Do not skip Step 3. Tuti does not implement changes without owner confirmation.
- Memory consolidation happens as part of Step 4 for any flagged memories.
- If a new playbook was proposed during the audit, create it in `Playbooks/` and add it to the index in Step 5.
