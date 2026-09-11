---
last-consolidated: 2026-09-11
---

# Alicia - Working Memory

> Instructions for Alicia: Record hiring decisions, what worked in agent designs, patterns that help identify the right expertise, and notes on team composition.

---

## Hot Context

[Nothing yet. Record active hiring tasks and decisions here as they arise.]

---

## Stable Knowledge

### Team Roster

| Agent | Role | Hired |
|-------|------|-------|
| Alfred | Orchestrator | 2026-09-11 (initial setup) |
| Alicia | HR Lead | 2026-09-11 (initial setup) |
| Tuti | System Reviewer | 2026-09-11 (initial setup) |
| Joy | Knowledge Manager | 2026-09-11 (initial setup) |
| Samuel | Analista de Requisitos | 2026-09-11 (first real hire) |

### Owner Context

- Full name: **Gabriela Obando**. Automation specialist at the Business Center. Programmer.
- Stack: Google Apps Script, Visual Studio. Tickets arrive on a **Monday.com** board.
- Work cycle: ticket → review → meeting with requester → development.
- The team still has **no coding capability**. Samuel deliberately stops before the code. If a future task is about writing or debugging Apps Script, that is a genuine gap and a separate hire.

### Hiring Notes

**Samuel (2026-09-11) — first real hire.**

What worked:
- **The interview found a different job than the one on the table.** Alfred surfaced two candidates: an Apps Script developer or a requirements analyst. Question 1 settled it in one answer — Gaby said the bottleneck was ambiguous tickets, and later, unprompted, "no porque no codifique". Never design from the capability gap on the org chart. Design from where the owner's week actually hurts.
- **Question 3 as a menu of concrete Friday-afternoon outcomes (A/B/C/D) instead of "what does success look like".** Abstract success questions get abstract answers. She picked A as the core and C and D as extras, which is exactly the priority information needed to decide what is the job and what is a feature.
- **Naming the numbers back to her got a correction.** I repeated "16 stuck tickets" and she corrected it to 10 unreviewed + 6 actively in code. That correction shrank the problem and moved the design's weight toward triage of the unreviewed queue. Say the numbers out loud; owners fix them.

What to do differently:
- **I proposed a boundary she vetoed, and the veto improved the design.** I wrote "never contacts the requester" as a safe default. She rejected it: she wants Samuel drafting messages to ask for missing inputs and to confirm the scope freeze, always opening with a fixed self-introduction. My instinct was to protect her from an agent overstepping; her instinct was that the follow-up chasing is part of the pain. **Propose boundaries as drafts to be vetoed, not as safe defaults quietly included.** Showing them in writing at Step 3 is what surfaced this. Keep doing that.
- **She also softened "never invents requirements" to "can suggest, I decide".** The fix was structural, not verbal: suggestions live in a separate labelled section, never in the spec body. When an owner loosens a boundary, look for a structural form of the boundary rather than dropping it.
- **Check tool reality against what the owner asks for.** She said "I want it to write to the requester" and could reasonably have expected sending. There is no mail integration, so Samuel drafts and she sends. I said this explicitly before approval instead of letting the profile imply a capability that does not exist. Always reconcile a requested behaviour with the actual tool list before presenting.
- **Design for the integration that does not exist yet.** Tickets live in Monday with no API access, so the input is pasted. The hybrid — pasted input, persisted output — keeps the queue alive across sessions and means only the input changes when the API arrives. Reusable pattern for any agent blocked on a pending integration.

### Reusable Patterns

- **Ask one question per turn, and reflect the previous answer back before asking the next.** Gaby corrected a number, vetoed a boundary, and added the Monday detail because each turn showed her what I had understood.
- **Language:** profiles written from now on go in Spanish (writing rule 3; only initial-setup files stay in English). Samuel is the first Spanish profile. Ask the owner rather than assuming when the rule is ambiguous — I flagged it at Step 3 and Gaby went with Spanish.
- **Pending integrations belong in the new agent's memory under Stable Knowledge**, phrased as "these do not exist", so the agent never proposes them as available.
