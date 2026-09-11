---
last-consolidated: 2026-09-11
---

# Alicia - Working Memory

> Instructions for Alicia: Record hiring decisions, what worked in agent designs, patterns that help identify the right expertise, and notes on team composition.

---

## Hot Context

**2026-09-11 — Samuel modified the same day he was hired: analyst + developer.** Gaby lifted the no-code ban and cancelled the separate developer hire, folding it into Samuel. The developer requirements (Apps Script and Java today, open to future environments, proposes improvements) now live in his profile. She approved all four boundaries I put up for veto, unchanged. Details in Hiring Notes below.

---

## Stable Knowledge

### Team Roster

| Agent | Role | Hired |
|-------|------|-------|
| Alfred | Orchestrator | 2026-09-11 (initial setup) |
| Alicia | HR Lead | 2026-09-11 (initial setup) |
| Tuti | System Reviewer | 2026-09-11 (initial setup) |
| Joy | Knowledge Manager | 2026-09-11 (initial setup) |
| Samuel | Analista de Requisitos y Desarrollador | 2026-09-11 (first real hire; scope widened same day) |

### Owner Context

- Full name: **Gabriela Obando**. Automation specialist at the Business Center. Programmer.
- Stack: Google Apps Script, Visual Studio. Tickets arrive on a **Monday.com** board.
- Work cycle: ticket → review → meeting with requester → development.
- **Coding capability now exists: Samuel.** Apps Script and Java today, other environments as they come. Do not hire a separate developer; that hire was proposed and Gaby chose to fold it into Samuel instead.
- **No execution environment in this workspace.** No JDK, no `clasp`, no Google credentials. Apps Script runs on Google's servers against her data. Any agent that writes code delivers it; Gaby runs it.
- **No audio, no meeting attendance, no mail sending.** These are capability gaps, not permission gaps. The realistic channel for meeting content is a Google Meet transcript that Gaby pastes.

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

**Samuel (2026-09-11, same day) — scope modification, not a new hire.**

Gaby: "quiero quitar la restriccion de que construya el codigo pero quiero que sea bajo mi guia". She was also about to hire a separate developer; Alfred gave her three options and she chose one agent doing both jobs.

What worked:
- **Reapplied the structural-boundary pattern instead of inventing a new one.** This morning, when she softened "never invents requirements", the fix was a separate labelled suggestions section, not a softer sentence. Same move here: "never writes code" became three interlocking rules — plan before code (a gate), new files by default (a location rule), unrequested ideas go in a labelled proposals section (the same pattern again). **When an owner loosens a boundary for the second time, look first at how you solved it the first time.** A pattern that already survived her veto is a better starting point than a fresh design.
- **Read the boundary against the owner's actual fear, not the literal rule.** The rule was "no code". The fear, in her words, was "me puede causar retrocesos" — code undoing finished work. Once you name the fear, the rule can change shape while protecting the same thing. The forbidden thing is now "code she did not ask for, touching work she considers done", which is closer to the fear than the original ban was.
- **Turning the gate into a queue state made it auditable.** The approval gate became a `esperando luz verde` state in the ticket queue. A ticket sitting in `en código` that never passed through it is a visibly skipped rule. **A boundary you can see in a status field beats one that only lives in a profile sentence.**
- **Argued the tool decision instead of defaulting it.** Alfred asked whether Samuel needed Bash. I recommended against and gave the reason that mattered: Bash is the only tool that breaks the code contract, because all three rules rest on controlling which files get touched. Read/Write/Edit make a file change a visible, bounded act; `mv`, `rm`, `git checkout` and redirections do not. She accepted on that argument. **Tool lists are design decisions. Write the argument down, in the agent's memory too, so a later reviewer does not "fix" the omission.**
- **Presented before/after of changed sections only, not the whole profile.** For a modification this is what makes the diff reviewable. Re-showing the full profile hides what actually moved.

What to watch:
- **Write scope so it does not need rewriting.** Gaby wants future languages. The profile says Apps Script and Java "today" and puts the onboarding procedure for an unfamiliar environment in the skill (ask about execution, deployment, conventions, dependencies, testing; then record it in memory). The profile names the current state; the skill carries the extension mechanism.
- **When the owner asks for a capability that does not exist, offer the realistic substitute in the design.** She asked whether Samuel could sit in on her meetings. He cannot: no audio, no call-joining, and it is not a permissions issue. The available path is a Google Meet transcript. So the design now distinguishes two input types — her short filtered note versus a long literal transcript — and his memory states plainly that he does not attend meetings, he receives what was said. Same reconciliation habit as the mail one this morning.

### Reusable Patterns

- **Ask one question per turn, and reflect the previous answer back before asking the next.** Gaby corrected a number, vetoed a boundary, and added the Monday detail because each turn showed her what I had understood.
- **Language:** profiles written from now on go in Spanish (writing rule 3; only initial-setup files stay in English). Samuel is the first Spanish profile. Ask the owner rather than assuming when the rule is ambiguous — I flagged it at Step 3 and Gaby went with Spanish.
- **Pending integrations belong in the new agent's memory under Stable Knowledge**, phrased as "these do not exist", so the agent never proposes them as available.
- **Boundaries are drafts to be vetoed, never safe defaults slipped in.** Confirmed twice now. The morning veto ("never contacts the requester") improved the design; the afternoon list of four vetoable boundaries came back approved unchanged, which is also information — it means the reasoning travelled, not just the rule.
- **Structural over verbal, always.** A boundary with a shape (a separate section, a required file location, an approval gate, a queue state) survives pressure. A boundary that is only a sentence in a profile erodes the first time the owner is in a hurry.
- **A modification is not a hire. Skip the five-question interview, keep Step 3.** Present before/after of the changed sections and ask for approval before touching files.
- **Surgical edits to shared files.** When another agent is queued to rewrite a file (Tuti on `CLAUDE.md`), change only the one line that is mine. Shared-file collisions are cheap to avoid and expensive to untangle.
