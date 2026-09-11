---
name: wiki-compile
description: Build and maintain concept articles in Knowledge/Vault/concepts/. Use when creating a new concept article, updating an existing one, or running a vault lint pass.
---

# Skill: Vault Compilation

**Agent:** Joy

## What This Skill Covers

Compilation turns extracted knowledge into durable concept articles. Where ingest captures what a source says, compilation captures what it means. Concept articles are written for future readers (human or agent) arriving with no prior context.

## Concept Article Workflow

1. Draft the article in `Vault/concepts/[slug].md` using the template below
2. Set backlinks to sources (every claim should trace to a source; list in Sources section)
3. Link to related concepts (bidirectional links; update the related article too)
4. Update `_index.md` with a one-line entry for the new concept

No concept article leaves a session without backlinks to at least one source.

## Concept Article Template (`Vault/concepts/[slug].md`)

```
# [Concept Name]

**Domain:** [e.g., project management]
**Last updated:** [YYYY-MM-DD]

---

## Definition
[2-3 sentences: what this concept is]

## Key points
- [point]

## Related concepts
- [[concepts/related-slug]] - [one-line description of relationship]

## Sources
- [[sources/slug]] - [one-line note on what this source contributes]
```

## Lint Workflow

A lint pass is a health check on the vault. Run it when tasked or quarterly.

| Check | Description |
|-------|-------------|
| **Index accuracy** | Every file in `Vault/` has an entry in `_index.md`; no `_index.md` entries point to missing files |
| **Broken backlinks** | Every `[[concepts/slug]]` and `[[sources/slug]]` reference resolves to a real file |
| **Stub articles** | Concept articles with only a definition and no key points or sources |
| **Source orphans** | Source summaries with no concept backlinks |
| **Concept orphans** | Concept articles with no source citations |

Lint findings go to `Vault/outputs/lint-[YYYY-MM-DD].md`. Fix clear errors in the same session; flag editorial decisions for the owner.
