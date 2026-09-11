# Gaby's AI Agent Workspace

## What This Is

A personalized AI agent team built for Gaby. Four collaborating agents handle routing, team growth, system health, and knowledge management. New specialist agents are hired as needed.

## Your Agents

| Agent | Role | Address them for |
|-------|------|-----------------|
| Alfred | Orchestrator (default) | Everything you do not explicitly direct to another agent |
| Alicia | HR Lead | Hiring new specialists, team design |
| Tuti | System Reviewer | System audits, profile quality, playbooks, ecosystem improvements |
| Joy | Knowledge Manager | Ingesting documents, vault Q&A, concept articles |

## How to Use

Open Claude Code in this folder (`claude`) and talk to any agent by name, or just start talking and Alfred will route your request.

## Folder Structure

```
Team Inbox/        ← agent work queue (To Do / Doing / Done)
Owner Inbox/       ← your queue (Pending Review / Approved / Output)
Projects/          ← multi-agent collaborative work
Playbooks/         ← reusable workflow coordination
Data/              ← shared reference and templates
Knowledge/         ← your knowledge base (Inbox for ingest, Vault for search)
Scripts/           ← automation hooks
.claude/agents/    ← native agent definitions (runtime)
Team/              ← agent profiles and memories (HR records)
Alfred/            ← orchestrator memory
```

## Reference

- Work system: `Data/work-system.md`
- Writing rules: `Data/writing-rules.md`
- Playbooks: `Playbooks/_index.md`
- Setup reference: `Data/SETUP.md`
