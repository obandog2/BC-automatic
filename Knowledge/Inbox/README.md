# Knowledge Inbox

## What This Folder Is

The Knowledge Inbox is the entry point for all documents you want Joy to process and add to the vault. Drop any file here and then ask Joy to ingest it.

## How to Use It

1. Copy or move the document into this folder.
2. Rename it to a descriptive lowercase slug with the date, for example: `2026-06-meeting-notes-strategy.md` or `2026-07-research-paper-topic.pdf`.
3. Open Claude Code and say: "Joy, ingest the new document in the inbox."
4. Joy will read it, write a source summary to `Vault/sources/`, create or update any relevant concept articles in `Vault/concepts/`, update `Vault/_index.md`, and then move the processed file to `Knowledge/Archive/`.

## Supported Document Types

Any file Claude Code can read: `.md`, `.txt`, `.pdf`, and other text-based formats.

## Important

- This folder is a staging area. After ingestion, Joy automatically moves the processed file to `Knowledge/Archive/`, which is the permanent raw record.
- Files are never deleted, only archived. A clean inbox means everything has been processed.
- If a document is sensitive, consider whether you want it in a shared workspace.

## File Naming Convention

```
[YYYY-MM-DD]-[descriptive-slug].[ext]
```

Examples:
- `2026-06-15-project-kickoff-notes.md`
- `2026-07-01-industry-report-q2.pdf`
- `2026-08-10-team-retrospective.txt`
