---
id: changelog-与文档规范-发版-写说明时启用
type: skill
name: changelog-documentation
description: 编写 CHANGELOG、Release Notes、发版说明时遵循团队规范；按需唤起
tags:
  - codebuddy
targets:
  - codebuddy
scope:
  - global
enabled: true
version: 1.0.0
sourcePath: /Users/apple/.codebuddy/skills/changelog-documentation/SKILL.md
importedAt: "2026-04-17T10:11:44.670Z"
createdAt: "2026-04-17T10:11:44.670Z"
updatedAt: "2026-04-17T10:11:44.670Z"
---

# Changelog 与文档规范（发版/写说明时启用）

## 何时使用

- 编写或整理 **CHANGELOG**、**Release Notes**、**发版说明**、**对外 API 文档** 时。
- 日常功能开发、改业务代码**不必**默认套用全文。

## 怎么做

1. **在已同步的工程内**：打开并遵循 **`Docs/Guides/CHANGELOG_AND_DOCUMENTATION_GUIDE.md`**。  
2. **仅在本机 Doc 仓编辑时**：完整规范见 **`Doc/ai-generic/docs/CHANGELOG_AND_DOCUMENTATION_GUIDE.md`**（与 `ai-generic` 同步源同目录）。  
3. API 命名、组件文档结构等以 **项目自有 Wiki** 为准。

## Rule 与 Skill 分工

- **Skill（本页）**：何时用 + 指向完整规范。  
- **Rule**：一句「发版更新 CHANGELOG，格式见上述 Guide」即可。
