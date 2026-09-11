---
name: knowledge-ingest
description: Process raw documents from Knowledge/Inbox/ into structured source summaries and concept candidates in the Knowledge Vault. Use whenever a new document arrives in the inbox.
---

# Skill: Knowledge Ingest

**Agent:** Joy

## What This Skill Covers

Ingest is the entry point for all new knowledge. Every document that lands in `Knowledge/Inbox/` passes through this workflow before anything enters the vault. The goal is to make the document's knowledge findable and linkable.

## Ingest Workflow

### Step 1: Read the source document
Read the full document in `Knowledge/Inbox/`. Do not skim. Record the domain, origin, and date as you read.

### Step 2: Write the source summary
Create `Vault/sources/[slug].md` using the template below. The slug should be lowercase-hyphenated and descriptive.

### Step 3: Identify concept candidates
As you write the summary, list all concepts in the Key concepts section. For each:
- If a concept article already exists in `Vault/concepts/` → add a backlink from the source summary to the existing article
- If the concept is new → decide whether to create the article now (see Decision Rules)

### Step 4: Link source to concepts
For any concept article that already exists and is relevant, add a backlink in the concept article's Sources section pointing to this source summary.

### Step 5: Update `_index.md`
Add a one-line entry for the new source in `Vault/_index.md` under the Sources section:
```
- [[sources/slug]] - [one-line: what this source is and why it matters]
```
No exceptions. The index must reflect the vault's actual state at the end of every ingest session.

### Step 6: Archive the source file
Once the source summary, concept links, and index update are all complete, move the original file from `Knowledge/Inbox/` to `Knowledge/Archive/`, preserving its filename. This keeps the inbox clean and signals the document is fully processed. Never delete; only move. If multiple files were ingested in one session, archive each as it completes.

## Source Summary Template (`Vault/sources/[slug].md`)

```
# Source: [Title]

**File:** [original filename in Inbox/]
**Date added:** [YYYY-MM-DD]
**Domain:** [e.g., project management / research / meeting notes]
**Original source:** [URL or "internal"]

---

## Summary
[3-5 sentences: what this document contains and why it matters]

## Key concepts
- [concept] → [[concepts/slug]] (link if article exists)

## Relevance
[One sentence: what questions this source helps answer]
```

## Decision Rules

**Create a new concept article when:**
- The concept does not appear in `Vault/_index.md`
- The concept is distinct enough from existing articles
- The concept is likely to be referenced by multiple future sources

**Update an existing concept article when:**
- The source adds new detail, nuance, or evidence
- The existing article is a stub and this source fills it out

**Defer when:**
- The concept appears only once and is unlikely to recur
- Sufficient context already exists in other articles
