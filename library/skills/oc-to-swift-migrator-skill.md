---
id: oc-to-swift-migrator-skill
type: skill
name: oc-to-swift-migrator
description: Objective-C 模块迁移到 Swift：MVVM、保持 UI/逻辑一致；目录与网络栈以目标工程文档为准
tags:
  - codebuddy
targets:
  - codebuddy
scope:
  - global
enabled: true
version: 1.0.0
sourcePath: /Users/apple/.codebuddy/skills/oc-to-swift-migrator/SKILL.md
importedAt: "2026-04-17T10:11:44.671Z"
createdAt: "2026-04-17T10:11:44.671Z"
updatedAt: "2026-04-17T10:11:44.671Z"
---

# OC to Swift Migrator Skill

## 触发条件
- 用户提供 OC 代码路径或片段
- 提到：OC → Swift 迁移、重写、转换、Swift 实现

## 核心指令
1. 分析 OC 代码：提取 UI（布局、控件）、逻辑（业务、网络、交互）、Model（数据结构）。
2. 生成 Swift 版本：
   - 输出路径遵循目标工程目录约定（见各仓库 CLAUDE.md / AGENTS.md）
   - 类名避免冲突：加前缀/后缀或命名空间式命名；若已有同名，询问用户
   - 架构：MVVM（View 轻量，ViewModel 处理逻辑，Model 纯数据 + Codable）
   - 布局：按工程约定（如 SnapKit 或 SwiftUI）
   - 网络：按工程统一网络层（async/await、Combine 或项目封装）
   - 跳转：优先使用 Swift 侧路由/Coordinator 约定
   - Model：OC Model 用 Swift struct/enum 重写时优先 immutable
3. 保持一致性：
   - UI 视觉/交互与产品要求一致
   - 逻辑不丢失：delegate → closure/async、NSError → Error/Result
   - 添加防护：guard let、try、避免无谓的 force unwrap
4. 输出格式：
   - 先中文解释改动点（新增/优化/潜在风险）
   - 给出完整 Swift 代码（文件头、MARK 分段、注释按工程规范）
   - 可做 OC / Swift 对照说明
5. 新建文件时：遵守工程文件头约定；提醒加入 Xcode Target

## 自定义命令
/migrate-oc [OC 路径或代码描述]

示例：
/migrate-oc Modules/Profile/SubModules/Task/View 内容
