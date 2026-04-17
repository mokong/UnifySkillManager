---
id: alamofire-service-generator-skill
type: skill
name: alamofire-service-generator
description: 按 Alamofire + Combine（或工程约定）生成 Repository/Service 层模板；View 与 ViewModel 禁止直连 AF
tags:
  - codebuddy
targets:
  - codebuddy
scope:
  - global
enabled: true
version: 1.0.0
sourcePath: /Users/apple/.codebuddy/skills/alamofire-service-generator/SKILL.md
importedAt: "2026-04-17T10:11:44.669Z"
createdAt: "2026-04-17T10:11:44.669Z"
updatedAt: "2026-04-17T10:11:44.669Z"
---

# Alamofire Service Generator Skill

## 触发条件
- 用户提供 API 文档、接口描述、URL、参数、响应模型等
- 提到：Alamofire、Combine、网络请求、Service、Repository、API client
- 需要生成：网络层代码、请求封装、错误处理、响应解析

## 项目规范约束（须与目标工程对齐）
- Alamofire 5.x+（若工程用 URLSession/async-await，则改为同等分层结构）
- 响应式可用 Combine（`Publisher` / `AnyPublisher`）或 async/await，按工程统一
- 统一错误处理：自定义 `Error` 类型（如 `LocalizedError`）
- 所有请求封装在 Repository / Service 类中
- ViewModel / View 禁止直接调用 Alamofire
- 支持 mock（protocol + 依赖注入）
- 便于单元测试（可注入 `Session` 或抽象协议）

## 生成代码结构（推荐顺序）
1. 文件头（按工程格式）
2. // MARK: - Imports
3. // MARK: - Errors
4. // MARK: - Protocol（Repository 抽象，便于 mock）
5. // MARK: - Implementation（具体 Service）
6. // MARK: - Private Helpers（decode、handleResponse、headers 等）
7. // MARK: - Constants（每项有注释）

## 常见模式示例（GET + Codable）

```swift
func fetchUser(id: String) -> AnyPublisher<User, AppError> {
    let url = baseURL.appendingPathComponent("users/\(id)")
    return AF.request(url, method: .get)
        .publishDecodable(type: User.self)
        .tryMap { response in
            switch response.result {
            case .success(let value): return value
            case .failure(let error): throw AppError.network(error)
            }
        }
        .mapError { _ in AppError.decoding }
        .eraseToAnyPublisher()
}
```

## 自定义命令

- /generate-service [接口描述]
- /generate-service-full [多接口功能描述]
- /generate-mock [接口名] → Mock Repository

## 额外要求

- 避免 force unwrap；public API 使用 `///` 文档注释
- 处理取消与错误分支；若用户未提供模型，询问或给出 Codable 示例
