# UnifySkillManager

UnifySkillManager is a local Web manager for AI coding tool Skills and Rules.

## Confirmed MVP

- Local Web UI, no account system.
- Markdown-first storage. Each Skill or Rule is a `.md` file.
- Supports Markdown with optional YAML frontmatter.
- Supports adding Skills mainly by importing Markdown files through the Web UI.
- Also supports pasting Markdown and creating/editing Markdown in the browser.
- Internally parses files into a unified Skill/Rule model.
- Supports Codex, Claude, Cursor, and CodeBuddy adapters.
- Detects whether each tool is installed, its version when available, and likely global/project config paths.
- Supports global and current-project sync targets.
- Shows render previews before writing.
- Creates backups before overwriting generated files.

## Run

```bash
npm start
```

Then open:

```txt
http://127.0.0.1:4310
```

## Storage

```txt
library/
  skills/
  rules/
backups/
config/
```

Markdown frontmatter example:

```md
---
id: swiftui-review
type: skill
name: SwiftUI Review
description: Review SwiftUI code for maintainability and performance.
tags:
  - swiftui
  - ios
targets:
  - codex
  - cursor
scope:
  - global
  - project
enabled: true
version: 1.0.0
---

# SwiftUI Review

Use this skill when reviewing SwiftUI code.
```
