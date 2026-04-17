---
id: flutter-platform-channel-helper-skill
type: skill
name: flutter-platform-channel-helper
description: 生成 Flutter ↔ iOS 平台通道代码；优先 Pigeon，命名与错误处理规范化
tags:
  - codebuddy
targets:
  - codebuddy
scope:
  - global
enabled: true
version: 1.0.0
sourcePath: /Users/apple/.codebuddy/skills/flutter-platform-channel-helper/SKILL.md
importedAt: "2026-04-17T10:11:44.670Z"
createdAt: "2026-04-17T10:11:44.670Z"
updatedAt: "2026-04-17T10:11:44.670Z"
---

# Flutter Platform Channel Helper Skill

## 触发条件
- 涉及 Flutter 与 iOS 通信、MethodChannel、Pigeon、平台通道
- 提到：Flutter、channel、MethodChannel、Pigeon、原生调用

## 核心指令
1. 优先使用 Pigeon（类型安全、自动生成代码）
2. 通道命名：`com.yourcompany.app/feature/method`（替换为真实 bundle/团队规范）
3. 生成结构：
   - Pigeon 消息定义（按官方模板）
   - Flutter 侧 HostApi / FlutterApi
   - iOS 侧与 Pigeon 生成代码对接的实现
4. 处理错误：FlutterError / NSError 统一语义
5. 支持异步（Future / completion）
6. 禁止硬编码路径、bundle ID（使用配置或常量层）
7. 边界：Flutter 不直接访问 Keychain/沙箱路径等，经通道由原生实现

## 自定义命令
/generate-channel [功能描述]

示例：
/generate-channel 从 Flutter 调用原生获取设备 token 并返回给 Flutter
