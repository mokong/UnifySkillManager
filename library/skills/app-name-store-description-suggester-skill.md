---
id: app-name-store-description-suggester-skill
type: skill
name: appstore-info-generator
description: 结合竞品与功能描述，生成 App 名称、商店文案、ASO 关键词（需联网检索时以工具为准）
tags:
  - codebuddy
targets:
  - codex
  - codebuddy
scope:
  - global
enabled: true
version: 1.0.0
createdAt: "2026-04-17T10:11:44.670Z"
updatedAt: "2026-04-17T10:22:07.471Z"
---

# App Name & Store Description Suggester Skill

## 触发条件
- 用户提到：App 名字、应用名称建议、商店描述、App Store 文案、竞品分析、SEO 关键词
- 需要为当前项目生成 App 名字、副标题、简介、描述或关键词

## 核心指令（Agent 尽量执行的流程）
1. 理解用户当前项目功能：  
   - 如果用户在提示中提供了项目描述，直接使用。  
   - 如果未提供，询问用户「请简要描述你的 App 核心功能（如极简番茄钟、任务管理、健身记录等）」。

2. 使用可用搜索工具检索：  
   - 查询格式示例：  
     「App Store top [功能关键词] apps」  
     示例：App Store top pomodoro timer apps  
     或：App Store top task management apps

3. 提取前若干个最相关的竞品 App，分析以下内容：  
   - 应用名称 + 副标题  
   - 核心卖点（从描述、截图、评分中提炼）  
   - 商店描述文案的关键句式和吸引点

4. 基于竞品分析 + 项目功能，为用户生成：  
   - **App 名字和副标题**：给出 3 个建议，尽量独特、易记、包含核心关键词，避免与竞品重名  
   - **商店描述**：一段完整 AIDA 模型文案（Attention、Interest、Desire、Action），控制篇幅适合商店字段  
   - **SEO 关键词**：适合 App Store 关键词字段长度习惯的关键词组

5. 输出结构（建议遵守）：
   - 先用中文总结竞品分析
   - 然后给出生成的 App 名字建议 + 理由
   - 接着给出完整的商店描述文案
   - 最后给出 SEO 关键词组

## 自定义命令

1. /generate-app-name [项目功能描述]  
2. /suggest-app-store [项目功能描述]  

## 额外要求
- 生成的名字和文案要积极、现代，符合产品调性
- 文案中适当突出差异化（如「极简」「高效」「隐私优先」等，按真实功能表述）
- 遵守项目语言与规范约定
