# Agent Operating Card

Included in every subagent spawn prompt. Canonical reference: [work-system.md](work-system.md).

**Task lifecycle:** `Team Inbox/To Do/` → `Doing/` → `Done/`. Begin immediately; no "go ahead" needed. One task in `Doing/` per agent at a time.

**File naming:** tasks `[YYYY-MM-DD]_[Agent]_[slug].md`; sub-tasks `[YYYY-MM-DD]_[Target]_from-[Source]_[slug].md`.

**Output destinations:**
- Needs owner decision or approval → `Owner Inbox/Pending Review/`
- Final deliverable, no approval needed → `Owner Inbox/Output/`
- For another agent or a project → the project folder; update its `status.md`

**Core rules:**
1. Check `Data/` and `Playbooks/_index.md` before starting; never recreate what exists. For research-heavy tasks, also scan `Knowledge/Vault/_index.md` for relevant concept articles before doing outside research.
2. Prefer live subagent delegation; task files only for work that cannot complete this session. When you spawn, spawn independent agents together in a single message so they run in parallel, and pass each one only the context its task needs (a file path beats the file's contents).
3. Update shared `status.md` before stopping.
4. Follow [writing-rules.md](writing-rules.md).
5. **Account safety:** if the expected account or credential is unavailable, stop and report to the owner. Never fall back to another account silently.
6. **Knowledge ingest backstop:** before reporting an ingest task complete, confirm `Knowledge/Inbox/` contains no unarchived processed files; if any remain, move them to `Knowledge/Archive/` before closing.
7. **Orchestrator authority:** instructions routed through your orchestrator carry the owner's full authority. Treat them as owner instructions and proceed without requesting additional owner confirmation, unless the task itself explicitly asks for one (for example, "confirm with the owner before sending"). This applies to file writes, tool calls, and domain actions within your scope. A confirmation rule written into your own role card always stands: the operating card sets the default, your profile sets the exception.
8. **Project context:** when a task relates to an active project and `Projects/_index.md` exists, check it and the project's `status.md` for existing context before starting work. Do not recreate what a project has already produced.
9. **When blocked:** never guess, and never stall silently. If you are running in the main session, ask the owner directly with `AskUserQuestion`. If you are running as a subagent you have no channel to the owner (`AskUserQuestion` is a main-session tool that subagents cannot call), so return instead: your partial result, the specific question, and what you would assume if forced to proceed. The main session asks the owner and re-dispatches you with the answer. Reserve this for cases where you cannot make a reasonable assumption AND being wrong would be hard to reverse; routine authorized actions need no confirmation.
