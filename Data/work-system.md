# Work System

**Version:** 1.0

> This document is the canonical reference for how work flows through the agent team. All agents must read and follow it. Alfred enforces it.

---

## System Overview

```
Gaby
  │
  ├──► [Agent Name], do X        Direct Access: agent responds immediately
  │                                └──► Agent spawns subagents for live delegation
  │
  └──► Alfred (orchestrator)   Default when no agent is named
         │  routes tasks              └──► Spawns lead agent
         ▼
       Team Inbox/
         ├── To Do/     ← async tasks only (cross-session)
         ├── Doing/     ← actively being worked on
         └── Done/      ← completed tasks

       Owner Inbox/
         ├── Pending Review/   ← awaiting owner decision
         ├── Approved/         ← owner has signed off
         └── Output/           ← finished deliverables, no approval needed

       Projects/
         └── [Project-Name]/   ← multi-agent work, shared brief + status

       Playbooks/
         └── [playbook].md     ← reusable workflow coordination

       Data/
         └── [reference files] ← shared knowledge and templates

       Knowledge/
         ├── Inbox/   ← raw documents for ingest
         └── Vault/   ← knowledge base compiled by Joy
```

---

## Core Rules

1. **Auto-execution.** When a task appears in `Team Inbox/To Do/` addressed to an agent, that agent begins immediately. No "go ahead" required.
2. **Direct access.** The owner can address any agent by name directly. That agent activates and responds without Alfred routing.
3. **Agent delegation.** Agents delegate to other agents via live subagent spawning (same-session) or task files (cross-session). See Section 3.
4. **Shared projects.** Multi-agent work lives in `Projects/`. Any participating agent can read and write the shared `status.md`.

---

## 1. Tasks

### Task File Naming
```
[YYYY-MM-DD]_[Agent(s)]_[short-slug].md
```

### Task File Structure
```
# Task: [Title]

**Routed by:** Alfred | [Agent Name] | Owner
**For:** [Agent name(s)]
**Date:** [YYYY-MM-DD]

---

## Request
[What needs to be done]

## Context
[Any relevant background, linked project, related files in Data/]

## Expected Output
[What the agent should produce and where it should go]
```

### Task Lifecycle
1. Task created in `Team Inbox/To Do/` - agent begins immediately
2. Agent moves file to `Team Inbox/Doing/`
3. Agent completes work, moves file to `Team Inbox/Done/`
4. If output requires owner review, agent creates a file in `Owner Inbox/Pending Review/`

---

## 2. Projects

A project is a body of work that spans multiple sessions, involves one or more agents across phases, has a defined goal, and produces lasting outputs.

### Project Folder Structure
```
Projects/
└── [Project-Name]/
    ├── brief.md       ← goal, scope, success criteria, involved agents
    ├── status.md      ← shared state: current phase, blockers, session log
    └── [outputs]      ← files produced by the project
```

### Required Project Files

| File | When | Purpose |
|------|------|---------|
| `brief.md` | Always | Goal, scope, success criteria, agents |
| `status.md` | While active | Current phase, blockers, session log |
| `handover.md` | At completion | What was built, how to access, what remains |

### brief.md Structure
```
# Project: [Name]

**Initiated by:** [Alfred | Agent | Owner]
**Lead agent:** [primary responsible agent]
**Supporting agents:** [others involved, and their role]
**Started:** [YYYY-MM-DD]
**Goal:** [one clear sentence]

## Scope
[What is in and out of scope]

## Success criteria
- [ ] [measurable outcome]
```

### status.md Structure
```
# Status: [Project Name]

**Last updated:** [YYYY-MM-DD] by [Agent]
**Current phase:** [phase name]
**Overall status:** On Track | At Risk | Blocked | Complete

## What is done
- [completed items with agent and date]

## What is next
- [next actions with agent responsible and target date]

## Blockers
- [anything stopping progress]

## Session log
| Date | Agent | What happened |
|------|-------|---------------|
```

---

## 3. Agent Delegation

| Use live subagent when... | Use task file when... |
|---|---|
| Work can complete this session | Work spans sessions |
| No owner approval gate | Owner must review first |
| Result needed to continue current work | Result is a standalone deliverable |

**Default: live delegation.** Task files are the fallback for work that genuinely cannot complete in this session.

### 3.1 Live Delegation (Subagents)

When an agent needs another agent's output during the current session, it spawns a subagent via Claude Code's Agent tool.

**Use native spawning. Do not paste the profile.** With `subagent_type: [name]`, Claude Code loads `.claude/agents/[name].md` automatically: the role card, the tool list, and the startup instructions. Pasting the profile, the operating card, or the memory into the prompt duplicates what the agent already loads and wastes context on every spawn.

**Send only the task and the context that task needs:**
```
## Task
[Specific activity description and acceptance criteria]

## Context
[Only what this agent needs for this task. See the scoping rule below.]

## Output
[Where to write results and in what format]
```

**Context scoping rule.** Pass the narrowest slice that lets the agent finish. Prefer a file path over the file's contents: the agent can read it if it needs it, and skip it if it does not.

| Instead of | Pass |
|---|---|
| The full project brief | The goal sentence plus the path to `brief.md` |
| The contents of three reference files | The three paths |
| Everything the owner said this session | The decision that affects this task |
| The whole prior agent's output | The part this agent acts on |

An agent that receives 3,000 words of context it does not use has spent that budget before starting. When in doubt, send less and let the agent ask.

**Manual prompt template (fallback only).** For an agent that has no file in `.claude/agents/` yet, spawn with the profile pasted in:
```
You are [Agent Name]. Read and embody the following profile completely:

[Contents of Team/[Agent].md]

---
## Operating card
[Contents of Data/agent-operating-card.md]

---
## Your memory
[Contents of Team/[Agent]/memory.md]

---
## Task
[Specific activity description and acceptance criteria]

## Context
[Only what this task needs]

## Output
[Where to write results and in what format]
```

### 3.2 Async Delegation (Task Files)

For cross-session work. File naming: `[YYYY-MM-DD]_[Target]_from-[Source]_[slug].md`

```
# Sub-task: [Title]

**From:** [Requesting Agent]
**For:** [Target Agent]
**Parent task / project:** [filename or project name]
**Date:** [YYYY-MM-DD]

---

## Request
[What is needed]

## Context
[Why this is needed]

## Expected Output
[What the target agent should produce]

## Return to
[Where output should go]
```

---

### 3.3 Spec-First Delegation

For creative or technical tasks where the specification determines output quality: HTML pages, apps, complex documents, UI components. The task file IS the spec, written by the orchestrator before any agent executes.

**When to use:**
- Building or redesigning a UI, page, or frontend component
- Writing a non-trivial app (multi-function, data-driven, UI-bearing)
- Any task where agent-invented decisions (structure, behavior, edge cases) would produce something reasonable but wrong

**How it works:**
1. Orchestrator writes a dense spec task file in `Team Inbox/To Do/`
2. Orchestrator shows the spec to the owner. Whether that is a gate or just visibility is the owner's call: say so once and the orchestrator follows it from then on
3. Orchestrator spawns the agent with the spec as primary context, not the owner's raw request
4. Agent executes by reading the spec, with no need to reason about intent

**Spec file format:**
```
# Spec: [Title]

**Routed by:** Alfred
**For:** [Agent]
**Date:** [YYYY-MM-DD]
**Type:** spec-first

---

## Goal
[One sentence: what this builds and why]

## Components / Structure
[Enumerate the parts: sections, functions, tabs, whatever applies]

## Behavior
[How the pieces interact; inputs, outputs, triggers, state]

## Design Constraints
[Visual rules, tone, existing patterns to follow]

## Edge Cases
[What to handle explicitly -- empty states, failures, permission errors]

## Acceptance Criteria
[How to know it is done]

## Output Location
[Where the file(s) go]
```

---

### 3.4 Execution Efficiency

Three habits that decide whether the system feels fast or sluggish. They cost nothing to follow and compound across every session.

**1. Spawn independent agents in parallel, not in series.**

When two or more agent tasks do not depend on each other, launch them in a single message with multiple tool calls. They then run concurrently instead of queueing. Spawning them one at a time, waiting for each to return, multiplies wall-clock time for no benefit.

The test for independence: does agent B need anything agent A produces? If no, they are independent, so launch them together.

```
Independent (launch together in one message):
  - Reviewer audits the folder structure
  - Knowledge Manager lints the vault
  - HR drafts a profile for the new specialist

Dependent (must be sequential):
  - Drafting agent writes the announcement
  - THEN delivery agent sends it
```

Mixed sets split naturally: run the independent group in parallel, then the dependent step after.

**2. Load skills on demand, not at startup.**

An agent's startup should read its memory and the operating card, always. Skill files are different: read one when the task calls for it, not as a warm-up ritual. An agent with five skill files that reads all five before every task burns that budget on four it will not use.

Write each agent's Startup section as a triggered index: name each skill with the condition that calls for it, so the agent loads only what applies. See the agent templates for the pattern.

**3. Pass the narrowest context that works.**

Covered in the context scoping rule in Section 3.1. The short version: paths beat contents, and the decision beats the transcript.

---

## 4. Owner Inbox

### Pending Review/
Deliverables needing the owner's attention. File naming: `[YYYY-MM-DD]_[Agent]_[slug].md`

```
# [Title]

**From:** [Agent]
**Date:** [YYYY-MM-DD]
**Needs:** Review | Approval | Decision | FYI

---

## Summary
[2-3 sentences: what this is and what the owner needs to do]

## Detail
[Full output or link to project file]

## Options / Recommended action
[If a decision is needed, lay out the options clearly]
```

### Approved/
Files move here once the owner has reviewed and approved.

### Output/
Finished deliverables that need no owner approval. Place work here when it is final and informational.

### Archive/
Long-term storage for Owner Inbox items no longer active. Organized in quarterly subfolders: `Owner Inbox/Archive/YYYY-QN/` (for example, `2026-Q3`).

**What gets archived:** Only dated files following the `YYYY-MM-DD_Agent_slug.*` naming convention. Undated files (standing reference docs, permanent artifacts) are never archived.

**When:** Periodically move items older than 30 days from `Approved/` and `Output/` into the appropriate quarterly subfolder. Items in `Pending Review/` stay put until the owner acts on them.

---

## 5. Data Folder

Holds reference documents, templates, and background material shared across all agents. Check here before starting a task to avoid recreating what exists. After completing work that produces reusable reference, add it here.

---

## 6. Knowledge Base

Owned and maintained by Joy.

```
Knowledge/
├── Inbox/        ← staging area: raw documents awaiting ingest
├── Archive/      ← processed raw documents, permanent record
└── Vault/
    ├── _index.md        ← master index
    ├── concepts/        ← concept articles, one per topic
    ├── sources/         ← source summaries, one per ingested document
    └── outputs/         ← Q&A answers, analyses, lint reports
```

**Self-serve read:** `Knowledge/Vault/` is the team's first research stop. For any research-heavy task, scan `_index.md` before doing outside research. It has one-line summaries of every source and concept already in the vault.

**Q&A:** For synthesis across multiple documents, route a task to Joy.

**Ingest:** Drop documents into `Knowledge/Inbox/` following the conventions in `Knowledge/Inbox/README.md`, then route an ingest task to Joy. Once ingestion is complete, processed files are moved from Inbox to Archive so the inbox always reflects unprocessed work.

---

## 7. Playbooks

Reusable workflow definitions for recurring, well-understood agent coordination. Each playbook is its own file in `Playbooks/`.

**Index:** [Playbooks/_index.md](../Playbooks/_index.md)

To use: check the index, read the playbook, follow the flow exactly.

To propose a new playbook: when a workflow repeats across three or more instances with the same agent coordination, any agent can propose it via sub-task to Tuti.

---

## 8. Rules for All Agents

1. **Auto-execute.** When a task in `Team Inbox/To Do/` is addressed to you, begin immediately.
2. **Direct access.** If the owner addresses you by name, respond and act directly.
3. **Delegate freely.** Spawn subagents for same-session work; create task files only for work that must span sessions.
4. **Update shared status.** Before stopping work on a project, update `status.md`.
5. **Outputs that need owner review** go to `Owner Inbox/Pending Review/`.
6. **Check `Data/`** before starting. Do not recreate what already exists.
7. **One task in `Doing/` per agent at a time.**
8. **Check `Playbooks/`** when creating a task that involves agent handoffs.
9. **Check `Knowledge/Vault/_index.md`** for research-heavy tasks before doing outside research. The vault is your first research stop.

---

## 9. Memory Standard

Each agent's `memory.md` is a living document owned by that agent.

**Budget:** Maximum 800 words per `memory.md`.

**Structure:**
```
---
last-consolidated: YYYY-MM-DD
---

## Hot Context
[Active, session-relevant knowledge: current projects, recent decisions, open blockers. Pruned at each consolidation.]

## Stable Knowledge
[Durable patterns, tool quirks, owner preferences. Links out to skill files or Knowledge/Vault rather than restating content.]
```

**Consolidation:** Quarterly, led by Tuti. When a memory reaches 800 words, stable how-tos graduate to a skill file, facts graduate to `Knowledge/Vault/`, and stale entries are pruned.

---

## 10. Maintenance

### Dual-File Convention

Every agent has two files:
- `Team/[Name].md` - the HR record: role, scope, voice, working style. Edited by Alicia or Tuti.
- `.claude/agents/[name].md` - the runtime file: YAML frontmatter (name, description, tools, model) plus a concise role card. This is what Claude Code loads.

Keep them in sync. If the profile changes meaningfully, the native agent file should reflect it.

### Restart Rule

Changes to `.claude/agents/` frontmatter (name, description, tools, model) take effect only after restarting Claude Code. Changes to memory files and skill file contents take effect in the next session without a restart.

### Adding Tools to an Agent

Edit the `tools:` list in `.claude/agents/[name].md` and restart Claude Code.
