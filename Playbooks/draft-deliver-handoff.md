# Playbook: Draft-Deliver Handoff

**Maintained by:** Tuti
**Last updated:** 2026-09-11

## Purpose

A two-agent chain where one agent drafts a piece of communication or deliverable and a second agent handles the final delivery after owner approval. Use this any time a draft requires review before it goes out.

## Trigger

Use this playbook when:
- An agent has produced a draft (email, message, document, report) that requires owner approval before delivery
- A second agent handles the delivery channel or final formatting

## Flow

```
1. Drafting agent creates draft
         │
         ▼
2. Draft goes to Owner Inbox/Pending Review/
         │
         ▼
3. Owner reviews and approves (moves file to Owner Inbox/Approved/ or signals approval in session)
         │
         ▼
4. Delivery agent picks up approved draft and executes delivery
         │
         ▼
5. Delivery agent confirms completion in Owner Inbox/Output/ or reports back inline
```

## Step Details

**Step 2:** The drafting agent writes the file to `Owner Inbox/Pending Review/` with the standard Pending Review format. It notes in the "Options / Recommended action" field which delivery agent should handle step 4 and what the delivery channel is.

**Step 3:** The owner either approves in session (tells the orchestrator "approved, deliver it") or moves the file to `Owner Inbox/Approved/`.

**Step 4:** The delivery agent reads the approved file, confirms the delivery channel and target, and executes. If anything is ambiguous, it asks before delivering.

**Step 5:** The delivery agent writes a brief confirmation: what was delivered, to whom, when.

## Direct-Chains

This playbook authorizes the delivery agent to execute directly once the owner approves. The orchestrator does not need to be re-involved at step 4 if the approval is explicit.

## Notes

- If the delivery agent is not yet hired, pause at step 2 and ask Alicia to design the right specialist.
- If the owner wants to edit the draft before delivery, the drafting agent handles revisions before the file moves to Approved/.
