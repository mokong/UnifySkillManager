---
id: code-quality-auditor-agent
type: skill
name: Code Quality Auditor Agent
description: ""
tags:
  - claude
targets:
  - claude
scope:
  - global
enabled: true
version: 1.0.0
sourcePath: /Users/apple/.claude/skills/code-quality-auditor.md
importedAt: "2026-04-17T10:11:44.668Z"
createdAt: "2026-04-17T10:11:44.668Z"
updatedAt: "2026-04-17T10:11:44.668Z"
---

# Code Quality Auditor Agent

代码质量审计代理，全面评估代码质量，识别代码异味，提供改进建议。

## 使用方法

触发关键词：
- "代码质量审查"
- "代码审计"
- "检查代码质量"
- "代码评分"
- "代码异味检测"

## 功能说明

### 1. 审计维度

#### 1.1 命名规范（15分）
```
检查项：
✅ 类名是否使用大驼峰
✅ 方法名是否使用小驼峰
✅ 变量名是否语义化
✅ 常量名是否符合规范
✅ 是否使用了缩写
✅ 是否有拼写错误
```

#### 1.2 代码复杂度（20分）
```
检查项：
✅ 圈复杂度（< 10）
✅ 方法长度（< 50 行）
✅ 类长度（< 500 行）
✅ 嵌套深度（< 4 层）
✅ 参数个数（< 5 个）
```

#### 1.3 代码重复（15分）
```
检查项：
✅ 重复代码块
✅ 相似代码模式
✅ 可提取的公共逻辑
```

#### 1.4 注释完整性（10分）
```
检查项：
✅ 公共方法是否有文档注释
✅ 复杂逻辑是否有说明
✅ TODO/FIXME 是否合理
✅ 注释是否过时
```

#### 1.5 错误处理（15分）
```
检查项：
✅ 是否正确处理错误
✅ 是否有空 catch 块
✅ 是否使用了 force unwrap
✅ 是否有未处理的可选值
```

#### 1.6 内存管理（10分）
```
检查项：
✅ 是否有循环引用
✅ 是否正确使用 weak/unowned
✅ 是否有内存泄漏风险
```

#### 1.7 可测试性（10分）
```
检查项：
✅ 是否使用依赖注入
✅ 是否有协议抽象
✅ 是否易于 Mock
✅ 是否有单元测试
```

#### 1.8 安全性（5分）
```
检查项：
✅ 是否有硬编码的敏感信息
✅ 是否有 SQL 注入风险
✅ 是否有 XSS 风险
```

### 2. 代码异味检测

#### 异味1: 过长方法
```swift
// ❌ 代码异味：方法过长（100+ 行）
func processData() {
    // 100+ 行代码
    // 做了太多事情
}

// ✅ 重构：拆分为多个小方法
func processData() {
    validateData()
    transformData()
    saveData()
    notifyObservers()
}

private func validateData() { }
private func transformData() { }
private func saveData() { }
private func notifyObservers() { }
```

#### 异味2: 过大的类
```swift
// ❌ 代码异味：类过大（1000+ 行）
class UserViewController: UIViewController {
    // 1000+ 行代码
    // 包含太多职责
}

// ✅ 重构：拆分职责
class UserViewController: UIViewController {
    private let viewModel: UserViewModel
    // 只负责 UI，约 200 行
}

class UserViewModel {
    // 业务逻辑，约 300 行
}

extension UserViewController {
    // UI 设置
}

extension UserViewController {
    // 事件处理
}
```

#### 异味3: 过多参数
```swift
// ❌ 代码异味：参数过多
func createUser(
    name: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    country: String,
    zipCode: String
) { }

// ✅ 重构：使用参数对象
struct UserInfo {
    let name: String
    let email: String
    let phone: String
    let address: Address
}

struct Address {
    let street: String
    let city: String
    let country: String
    let zipCode: String
}

func createUser(info: UserInfo) { }
```

#### 异味4: 重复代码
```swift
// ❌ 代码异味：重复代码
func loadUserData() {
    showLoading()
    UserService().getUserInfo { result in
        hideLoading()
        switch result {
        case .success(let user):
            self.updateUI(with: user)
        case .failure(let error):
            self.showError(error.localizedDescription)
        }
    }
}

func loadTaskData() {
    showLoading()
    TaskService().getTasks { result in
        hideLoading()
        switch result {
        case .success(let tasks):
            self.updateUI(with: tasks)
        case .failure(let error):
            self.showError(error.localizedDescription)
        }
    }
}

// ✅ 重构：提取公共逻辑
func loadData<T>(
    request: @escaping (@escaping (Result<T, Error>) -> Void) -> Void,
    onSuccess: @escaping (T) -> Void
) {
    showLoading()
    request { [weak self] result in
        self?.hideLoading()
        switch result {
        case .success(let data):
            onSuccess(data)
        case .failure(let error):
            self?.showError(error.localizedDescription)
        }
    }
}

func loadUserData() {
    loadData(
        request: { UserService().getUserInfo(completion: $0) },
        onSuccess: { self.updateUI(with: $0) }
    )
}
```

#### 异味5: 神秘命名
```swift
// ❌ 代码异味：命名不清晰
func proc(d: [String: Any]) -> Bool {
    let x = d["id"] as? String
    let y = d["name"] as? String
    return x != nil && y != nil
}

// ✅ 重构：使用清晰的命名
func validateUserData(_ data: [String: Any]) -> Bool {
    let userId = data["id"] as? String
    let userName = data["name"] as? String
    return userId != nil && userName != nil
}
```

#### 异味6: 过深嵌套
```swift
// ❌ 代码异味：嵌套过深
func processUser(user: User?) {
    if let user = user {
        if user.isActive {
            if user.isVIP {
                if user.hasPermission {
                    // 处理逻辑
                }
            }
        }
    }
}

// ✅ 重构：使用 guard 提前返回
func processUser(user: User?) {
    guard let user = user else { return }
    guard user.isActive else { return }
    guard user.isVIP else { return }
    guard user.hasPermission else { return }

    // 处理逻辑
}
```

#### 异味7: 魔法数字
```swift
// ❌ 代码异味：魔法数字
func calculateDiscount(price: Double) -> Double {
    if price > 100 {
        return price * 0.9
    } else if price > 50 {
        return price * 0.95
    }
    return price
}

// ✅ 重构：使用命名常量
struct DiscountConfig {
    static let highPriceThreshold = 100.0
    static let mediumPriceThreshold = 50.0
    static let highPriceDiscount = 0.9
    static let mediumPriceDiscount = 0.95
}

func calculateDiscount(price: Double) -> Double {
    if price > DiscountConfig.highPriceThreshold {
        return price * DiscountConfig.highPriceDiscount
    } else if price > DiscountConfig.mediumPriceThreshold {
        return price * DiscountConfig.mediumPriceDiscount
    }
    return price
}
```

#### 异味8: 空 catch 块
```swift
// ❌ 代码异味：空 catch 块
func loadData() {
    do {
        let data = try fetchData()
        process(data)
    } catch {
        // 空 catch，错误被吞掉
    }
}

// ✅ 重构：正确处理错误
func loadData() {
    do {
        let data = try fetchData()
        process(data)
    } catch {
        print("❌ Failed to load data: \(error)")
        showError(error.localizedDescription)
        // 或者重新抛出
        // throw error
    }
}
```

#### 异味9: Force Unwrap
```swift
// ❌ 代码异味：force unwrap
func displayUser() {
    let user = getUser()
    nameLabel.text = user!.name  // 可能崩溃
}

// ✅ 重构：安全解包
func displayUser() {
    guard let user = getUser() else {
        showError("User not found")
        return
    }
    nameLabel.text = user.name
}

// ✅ 或使用可选链
func displayUser() {
    nameLabel.text = getUser()?.name ?? "Unknown"
}
```

#### 异味10: 过度注释
```swift
// ❌ 代码异味：过度注释
func calculateTotal(items: [Item]) -> Double {
    // 创建一个变量来存储总和
    var total = 0.0

    // 遍历所有商品
    for item in items {
        // 将商品价格加到总和中
        total += item.price
    }

    // 返回总和
    return total
}

// ✅ 重构：代码自解释，只在必要时注释
func calculateTotal(items: [Item]) -> Double {
    return items.reduce(0) { $0 + $1.price }
}

// 或者保留简洁的注释
/// 计算商品总价
func calculateTotal(items: [Item]) -> Double {
    return items.reduce(0) { $0 + $1.price }
}
```

### 3. 审计报告模板

```markdown
# 代码质量审计报告

## 基本信息
- **审计文件**: TaskViewController.swift
- **审计时间**: 2026-02-28
- **代码行数**: 456 行
- **审计人**: Code Quality Auditor Agent

## 质量评分

### 总体评分: 72/100 (良好)

| 维度 | 得分 | 满分 | 等级 | 说明 |
|------|------|------|------|------|
| 命名规范 | 13/15 | 15 | 优秀 | 命名清晰，少量缩写 |
| 代码复杂度 | 12/20 | 20 | 中等 | 部分方法过长 |
| 代码重复 | 10/15 | 15 | 中等 | 存在重复代码 |
| 注释完整性 | 7/10 | 10 | 良好 | 部分方法缺少注释 |
| 错误处理 | 10/15 | 15 | 中等 | 有空 catch 块 |
| 内存管理 | 8/10 | 10 | 良好 | 少量循环引用风险 |
| 可测试性 | 7/10 | 10 | 良好 | 部分代码难以测试 |
| 安全性 | 5/5 | 5 | 优秀 | 无明显安全问题 |

### 评分等级
- 90-100: 优秀 ⭐⭐⭐⭐⭐
- 80-89: 良好 ⭐⭐⭐⭐
- 70-79: 中等 ⭐⭐⭐
- 60-69: 及格 ⭐⭐
- < 60: 不及格 ⭐

## 问题清单

### 🔴 严重问题（必须修复）

#### 1. 方法过长
**位置**: `TaskViewController.swift:123-223`
**问题**: `loadTaskData()` 方法长达 100 行
**复杂度**: 圈复杂度 15（建议 < 10）
**影响**:
- 难以理解
- 难以测试
- 难以维护

**代码片段**:
```swift
func loadTaskData() {
    // 100 行代码
    // 包含：网络请求、数据处理、UI 更新、错误处理
}
```

**建议**:
```swift
func loadTaskData() {
    fetchTasks()
}

private func fetchTasks() {
    taskService.getTasks()
        .sink { [weak self] completion in
            self?.handleCompletion(completion)
        } receiveValue: { [weak self] tasks in
            self?.handleTasks(tasks)
        }
        .store(in: &cancellables)
}

private func handleCompletion(_ completion: Subscribers.Completion<Error>) {
    if case .failure(let error) = completion {
        showError(error.localizedDescription)
    }
}

private func handleTasks(_ tasks: [Task]) {
    self.tasks = tasks
    updateUI()
}
```

#### 2. 空 catch 块
**位置**: `TaskViewController.swift:345`
**问题**: 错误被静默吞掉
**影响**:
- 难以调试
- 用户体验差
- 可能导致数据不一致

**代码片段**:
```swift
do {
    let data = try JSONDecoder().decode(Task.self, from: jsonData)
    process(data)
} catch {
    // 空 catch
}
```

**建议**:
```swift
do {
    let data = try JSONDecoder().decode(Task.self, from: jsonData)
    process(data)
} catch {
    print("❌ Decoding error: \(error)")
    showError("数据解析失败")
    // 或者使用日志系统
    Logger.error("Failed to decode task", error: error)
}
```

#### 3. Force Unwrap
**位置**: `TaskViewController.swift:267, 289, 312`
**问题**: 3 处使用 force unwrap，可能导致崩溃
**影响**:
- 应用崩溃风险
- 用户体验差

**代码片段**:
```swift
let task = tasks.first!  // 可能崩溃
let name = task.name!    // 可能崩溃
```

**建议**:
```swift
guard let task = tasks.first else {
    print("⚠️ No tasks available")
    return
}

let name = task.name ?? "Unknown"
```

### 🟡 中等问题（建议修复）

#### 4. 重复代码
**位置**: `TaskViewController.swift:156-178, 234-256`
**问题**: 两处相似的网络请求处理代码
**重复行数**: 约 40 行
**影响**:
- 维护成本高
- 容易出错

**建议**: 提取公共方法

#### 5. 命名不清晰
**位置**: `TaskViewController.swift:89`
**问题**: 变量名 `tmp` 不清晰
**影响**:
- 代码可读性差

**代码片段**:
```swift
let tmp = data["id"] as? String
```

**建议**:
```swift
let taskId = data["id"] as? String
```

#### 6. 魔法数字
**位置**: `TaskViewController.swift:123, 145, 167`
**问题**: 多处使用魔法数字
**影响**:
- 代码可读性差
- 难以维护

**代码片段**:
```swift
if tasks.count > 10 {
    // ...
}

delay(0.5) {
    // ...
}
```

**建议**:
```swift
private enum Constants {
    static let maxTasksToDisplay = 10
    static let animationDuration = 0.5
}

if tasks.count > Constants.maxTasksToDisplay {
    // ...
}

delay(Constants.animationDuration) {
    // ...
}
```

### 🟢 轻微问题（可选修复）

#### 7. 注释不完整
**位置**: 多处
**问题**: 部分公共方法缺少文档注释
**建议**: 添加文档注释

#### 8. 可以使用更简洁的语法
**位置**: `TaskViewController.swift:234`
**问题**: 可以使用更简洁的语法
**代码片段**:
```swift
let names = tasks.map { task in
    return task.name
}
```

**建议**:
```swift
let names = tasks.map(\.name)
```

## 代码度量

### 复杂度分析
```
方法复杂度分布：
- 简单（1-5）: 12 个方法 ✅
- 中等（6-10）: 5 个方法 ⚠️
- 复杂（11-15）: 2 个方法 ❌
- 非常复杂（> 15）: 1 个方法 🔴
```

### 代码行数分布
```
方法行数分布：
- 短（< 10 行）: 8 个方法 ✅
- 中（10-30 行）: 7 个方法 ✅
- 长（30-50 行）: 3 个方法 ⚠️
- 很长（> 50 行）: 2 个方法 ❌
```

### 重复代码分析
```
重复代码块：
- 完全重复: 2 处（40 行）
- 高度相似: 3 处（60 行）
- 可提取公共逻辑: 5 处
```

## 改进建议

### 立即行动（本周）
1. ✅ 修复所有 force unwrap
2. ✅ 处理所有空 catch 块
3. ✅ 拆分过长方法（> 50 行）

### 短期改进（2周内）
1. 提取重复代码
2. 改进命名
3. 添加文档注释
4. 替换魔法数字

### 中期改进（1个月内）
1. 降低代码复杂度
2. 提高测试覆盖率
3. 改进错误处理
4. 优化内存管理

### 长期改进（持续）
1. 建立代码审查流程
2. 引入静态分析工具
3. 定期重构
4. 提升团队代码质量意识

## 最佳实践建议

### 1. 命名规范
```swift
// ✅ 好的命名
class UserProfileViewController { }
func fetchUserData() { }
let maxRetryCount = 3

// ❌ 不好的命名
class UPViewController { }
func getData() { }
let max = 3
```

### 2. 方法长度
```swift
// ✅ 保持方法简短（< 30 行）
func loadUser() {
    fetchUser()
    updateUI()
}

// ❌ 方法过长
func loadUser() {
    // 100+ 行代码
}
```

### 3. 错误处理
```swift
// ✅ 正确处理错误
do {
    let data = try fetchData()
    process(data)
} catch {
    handleError(error)
}

// ❌ 空 catch
do {
    let data = try fetchData()
} catch { }
```

### 4. 可选值处理
```swift
// ✅ 安全解包
guard let user = user else { return }

// ❌ force unwrap
let user = user!
```

## 工具推荐

### 静态分析工具
- **SwiftLint**: 代码规范检查
- **SwiftFormat**: 代码格式化
- **Periphery**: 未使用代码检测
- **SonarQube**: 代码质量分析

### 使用方法
```bash
# 安装 SwiftLint
brew install swiftlint

# 运行检查
swiftlint

# 自动修复
swiftlint --fix
```

## 总结

### 优点
✅ 整体代码结构清晰
✅ 命名规范较好
✅ 无明显安全问题

### 需要改进
❌ 部分方法过长
❌ 存在重复代码
❌ 错误处理不完善
❌ 有 force unwrap 风险

### 改进优先级
1. 🔴 修复 force unwrap（防止崩溃）
2. 🔴 处理空 catch 块（改进错误处理）
3. 🟡 拆分过长方法（提高可维护性）
4. 🟡 提取重复代码（减少维护成本）
5. 🟢 完善注释（提高可读性）

### 预期效果
完成改进后，预计代码质量评分可提升至 **85/100（良好）**
```

## 使用示例

### 示例1: 审计单个文件
```
用户: 审计 TaskViewController.swift 的代码质量

助手:
1. 分析代码结构
2. 检测代码异味
3. 计算质量评分
4. 生成问题清单
5. 提供改进建议
```

### 示例2: 审计整个模块
```
用户: 审计 Profile 模块的代码质量

助手:
1. 扫描所有文件
2. 统计代码度量
3. 检测重复代码
4. 生成综合报告
```

### 示例3: 对比审计
```
用户: 对比重构前后的代码质量

助手:
1. 审计重构前代码
2. 审计重构后代码
3. 对比评分变化
4. 评估改进效果
```

## 注意事项

### 1. 评分标准
- 基于项目规范
- 考虑实际情况
- 客观公正

### 2. 问题优先级
- 严重问题优先修复
- 中等问题逐步改进
- 轻微问题可选修复

### 3. 改进建议
- 具体可行
- 优先级明确
- 提供代码示例

### 4. 持续改进
- 定期审计
- 跟踪改进进度
- 建立质量文化

## 相关文档

- `CLAUDE.md` - 项目编码规范
- `architecture-reviewer.md` - 架构审查
- `memory-leak-detector.md` - 内存泄漏检测
