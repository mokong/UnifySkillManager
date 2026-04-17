---
id: swiftui-component-generator-skill
type: skill
name: swiftui-component-generator
description: 按描述生成 SwiftUI 组件 + ViewModel；iOS 17+ 优先 Observation / NavigationStack
tags:
  - codebuddy
targets:
  - codebuddy
scope:
  - global
enabled: true
version: 1.0.0
sourcePath: /Users/apple/.codebuddy/skills/swiftui-component-generator/SKILL.md
importedAt: "2026-04-17T10:11:44.671Z"
createdAt: "2026-04-17T10:11:44.671Z"
updatedAt: "2026-04-17T10:11:44.671Z"
---

# SwiftUI Component Generator Skill

## 触发条件
- 用户要求生成 SwiftUI View、组件、表单、卡片、列表项等
- 提到：SwiftUI、View、@Observable、NavigationStack 等

## 核心指令
1. 优先使用与工程最低系统版本一致的 SwiftUI API（iOS 17+ 可优先）：
   - `@Observable` 与 Observation（若工程已采用）
   - `NavigationStack` / `NavigationSplitView`
   - `@Bindable` 等与 Observation 配套
2. 结构建议：
   - 文件头与 // MARK: 分段按工程规范
   - View 极简：UI + 交互；状态经 ViewModel 或注入
   - public API 使用 `///`；常量附注释
3. View 职责：
   - 禁止在 View 中写网络与复杂业务逻辑
4. ViewModel：
   - 管理 loading / error / empty；异步用 async/await 或工程约定
5. 布局：原生 modifier；必要时 GeometryReader / Layout

## 自定义命令
/generate-swiftui [描述]

示例：
/generate-swiftui 一个带搜索框、列表、加载状态的联系人页面，支持下拉刷新
