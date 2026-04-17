---
id: bury-point-analyzer-skill
type: skill
name: bury-point-analyzer
description: 对比 A/B 两端埋点实现，查遗漏与差异；参照一方对齐另一方（常见 OC vs Swift）
tags:
  - codebuddy
targets:
  - codebuddy
scope:
  - global
enabled: true
version: 1.0.0
sourcePath: /Users/apple/.codebuddy/skills/bury-point-analyzer/SKILL.md
importedAt: "2026-04-17T10:11:44.670Z"
createdAt: "2026-04-17T10:11:44.670Z"
updatedAt: "2026-04-17T10:11:44.670Z"
---

# Bury Point Analyzer Skill

## 触发条件
- 用户提到：埋点分析、event tracking、埋点对比、log 比较
- 需要检查埋点遗漏或修改

## 核心指令
1. 读取两个路径代码：
   - OC: A路径下（提取所有埋点调用，如 [Analytics trackEvent:@"xxx" params:@{...}]）
   - Swift: B（提取对应，如 Analytics.shared.track(event: "xxx", params: [...])）
2. 分析差异：
   - 遗漏：Swift 中缺少的埋点事件/参数/触发点
   - 不同：事件名、参数类型/值、触发时机（viewDidAppear、button tap 等）不一致
   - 额外：Swift 中多出的埋点（建议移除或确认）
3. 修改建议：
   - 参照约定基准版本，修改目标端代码（添加/调整埋点）
   - 保持最小改动：只改明确埋点部分，不格式化、不重构其他
   - 埋点统一风格：用项目 Analytics 库，参数用 enum 或 struct 封装
4. 输出格式：
   - 先中文总结：遗漏点（列出事件名/位置）、差异点（diff 风格）
   - 给出修改后的代码片段（完整方法或文件）
   - 提醒 TODO：如果不确定参数含义，加 // TODO: 确认埋点参数
5. 遵守各工程规则：匹配缩进、注释、崩溃防护

## 自定义命令
/analyze-bury [两个路径描述，默认 A 和 B]

示例：
/analyze-bury A 和 B 中的埋点
