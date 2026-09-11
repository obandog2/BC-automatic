---
name: ecosystem-audit
description: Structured audit of the entire agent ecosystem. Use when asked for a system audit, health check, or when preparing for quarterly memory consolidation.
---

# Skill: Ecosystem Audit

**Agent:** Tuti

## What This Skill Covers

A full audit examines every agent profile, every memory file, the CLAUDE.md routing table, the Playbooks index, and the folder structure. The goal is to catch drift before it causes problems: profiles that no longer match their native agent files, memories that have grown bloated, playbooks that are stale, and structural gaps.

## Audit Checklist

### 1. Profile Sync
- Read every `Team/[Name].md`
- Read every `.claude/agents/[name].md`
- Flag: profile and native file out of sync on role, scope, or voice
- Flag: agent in Team/ with no native file (will use fallback spawning)
- Flag: native file with no Team/ profile

### 2. Memory Health
- Read every `Team/[Name]/memory.md` and `Alfred/memory.md`
- Flag: memory over 800 words (consolidation due)
- Flag: Hot Context entries older than 90 days (likely stale)
- Flag: memories with no entries (agent has been active but not recording)

### 3. Routing Table
- Read `CLAUDE.md`
- Verify every agent in the routing table has a native file in `.claude/agents/`
- Flag: agents in Team/ not represented in the routing table

### 4. Playbooks
- Read `Playbooks/_index.md`
- Verify every listed playbook file exists
- Flag: playbooks referenced in agent profiles that are not in the index

### 5. Folder Structure
- Use Bash to list key directories
- Flag: unexpected files at the root
- Flag: agents with no `skills/` folder when the role warrants one

## Report Format

```
# Ecosystem Audit - [YYYY-MM-DD]

**Scope:** [what was checked]
**Health summary:** [Green | Yellow | Red] - [one sentence]

## Findings

### Critical (fix now)
1. [Finding] - [file] - [action]

### Advisory (fix soon)
1. [Finding] - [file] - [action]

### Observations (optional improvements)
1. [Finding] - [file] - [action]

## Recommended next actions
1. [Priority action]
```

## Consolidation Procedure

When a memory file reaches 800 words:
1. Identify stable how-tos that belong in a skill file
2. Identify facts that belong in `Knowledge/Vault/`
3. Move them to their destination
4. Prune stale Hot Context entries
5. Rewrite the memory file under budget
6. Record the consolidation date in the frontmatter
