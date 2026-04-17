---
id: ios-crash-log-analyzer-skill
type: skill
name: crash-analyzer
description: 分析 iOS/macOS 崩溃日志、符号化栈帧、归类原因与最小改动修复建议
tags:
  - codebuddy
targets:
  - codebuddy
scope:
  - global
enabled: true
version: 1.0.0
sourcePath: /Users/apple/.codebuddy/skills/crash-analyzer/SKILL.md
importedAt: "2026-04-17T10:11:44.670Z"
createdAt: "2026-04-17T10:11:44.670Z"
updatedAt: "2026-04-17T10:11:44.670Z"
---

# iOS Crash Log Analyzer Skill

## 触发条件
- 用户提供了 .crash 文件内容、控制台崩溃日志、Xcode 崩溃报告片段
- 提到关键词：崩溃、crash、EXC_BAD_ACCESS、SIGABRT、NSException 等

## 核心指令（Agent 必须严格遵循）
1. 先完整读取并解析提供的日志文本。
2. 提取关键字段：
   - Exception Type / Signal
   - Thread 0 Crashed（主线程崩溃优先关注）
   - Last Exception Backtrace / 栈帧
   - Binary Images 部分（查找应用名、偏移地址）
   - Faulting Address / 非法地址
3. 尝试符号化（如果日志有地址但无符号）：
   - 给出 atos 命令建议：atos -arch arm64 -o MyApp.app/MyApp -l 0x基址 0x偏移
   - 常见模式判断：nil unwrap → force unwrap、数组越界、内存释放后使用等
4. 分类常见崩溃类型并给出概率排序：
   - EXC_BAD_ACCESS (KERN_INVALID_ADDRESS) → 野指针 / 释放后使用
   - NSInvalidArgumentException → 参数错误
   - SIGABRT → assertion failure / Swift runtime failure
   - Swift concurrency 相关（Sendable violation, actor isolation 等）
5. 给出**最小改动修复建议**：
   - 用 guard let / if let 防护
   - 替换 ! 为 ? 或 Result
   - 添加 defer / weak self
6. 最后输出结构化总结：
   - 崩溃类型
   - 可能原因（Top 3）
   - 修复代码片段（贴近项目风格：Swift/SwiftUI/OC）
   - 预防措施

## 自定义命令
/analyze-crash [日志文本或文件路径]
直接触发完整分析流程

示例调用：
/analyze-crash 
Thread 0 Crashed:
0   MyApp  0x0000000100123456  ViewController.viewDidLoad + 128
