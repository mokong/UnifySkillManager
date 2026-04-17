---
id: code-duplication-finder-agent
type: skill
name: Code Duplication Finder Agent
description: ""
tags:
  - claude
targets:
  - claude
scope:
  - global
enabled: true
version: 1.0.0
sourcePath: /Users/apple/.claude/skills/code-duplication-finder.md
importedAt: "2026-04-17T10:11:44.668Z"
createdAt: "2026-04-17T10:11:44.668Z"
updatedAt: "2026-04-17T10:11:44.668Z"
---

# Code Duplication Finder Agent

代码重复检测代理，识别重复代码，提供重构建议，减少维护成本。

## 使用方法

触发关键词：
- "查找重复代码"
- "检测代码重复"
- "重复代码分析"
- "代码克隆检测"
- "相似代码查找"

## 功能说明

### 1. 重复类型

#### 类型1: 完全重复（Type 1）
```swift
// 文件A
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

// 文件B - 完全相同
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
```

#### 类型2: 参数化重复（Type 2）
```swift
// 文件A
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

// 文件B - 变量名不同，逻辑相同
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
```

#### 类型3: 结构相似（Type 3）
```swift
// 文件A
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

// 文件B - 结构相似，有少量差异
func loadTaskData() {
    showLoading()
    TaskService().getTasks { result in
        hideLoading()
        switch result {
        case .success(let tasks):
            self.updateUI(with: tasks)
            self.trackEvent(.taskLoaded)  // 额外的逻辑
        case .failure(let error):
            self.showError(error.localizedDescription)
            self.trackEvent(.taskLoadFailed)  // 额外的逻辑
        }
    }
}
```

### 2. 检测算法

#### 算法1: 文本相似度
```
基于编辑距离（Levenshtein Distance）
- 计算两段代码的相似度
- 相似度 > 80% 认为是重复
```

#### 算法2: 抽象语法树（AST）
```
基于代码结构
- 解析代码为 AST
- 比较 AST 结构
- 忽略变量名差异
```

#### 算法3: Token 序列
```
基于 Token 序列
- 将代码转换为 Token 序列
- 使用滑动窗口查找重复
- 适合检测大段重复
```

### 3. 检测报告模板

```markdown
# 代码重复检测报告

## 基本信息
- **检测范围**: Profile 模块
- **检测时间**: 2026-02-28
- **文件总数**: 45 个
- **代码总行数**: 12,345 行

## 重复统计

### 总体统计
- **重复代码行数**: 1,234 行（10.0%）
- **重复代码块数**: 23 个
- **涉及文件数**: 15 个

### 重复类型分布
| 类型 | 数量 | 行数 | 占比 |
|------|------|------|------|
| 完全重复（Type 1） | 8 | 456 | 37% |
| 参数化重复（Type 2） | 10 | 567 | 46% |
| 结构相似（Type 3） | 5 | 211 | 17% |

### 严重程度分布
| 严重程度 | 数量 | 行数 | 说明 |
|----------|------|------|------|
| 🔴 严重（> 50 行） | 3 | 234 | 必须重构 |
| 🟡 中等（20-50 行） | 8 | 456 | 建议重构 |
| 🟢 轻微（< 20 行） | 12 | 544 | 可选重构 |

## 重复代码清单

### 🔴 严重重复（必须重构）

#### 1. 网络请求处理逻辑
**重复次数**: 5 次
**重复行数**: 78 行
**相似度**: 95%
**位置**:
- `UserViewController.swift:123-200`
- `TaskViewController.swift:234-311`
- `VideoViewController.swift:156-233`
- `ProfileViewController.swift:89-166`
- `SettingsViewController.swift:45-122`

**重复代码**:
```swift
// 在 5 个文件中重复
func loadData() {
    showLoading()

    service.fetchData { [weak self] result in
        guard let self = self else { return }

        self.hideLoading()

        switch result {
        case .success(let data):
            self.data = data
            self.tableView.reloadData()

            if data.isEmpty {
                self.showEmptyView()
            } else {
                self.hideEmptyView()
            }

        case .failure(let error):
            self.showError(error.localizedDescription)

            // 记录错误
            Logger.error("Failed to load data", error: error)

            // 埋点
            Analytics.track(event: .loadFailed, properties: [
                "error": error.localizedDescription
            ])
        }
    }
}
```

**重构建议**:
```swift
// 方案1: 提取基类
class BaseDataViewController<T>: UIViewController {
    var data: [T] = []

    func loadData(
        service: @escaping (@escaping (Result<[T], Error>) -> Void) -> Void
    ) {
        showLoading()

        service { [weak self] result in
            guard let self = self else { return }
            self.hideLoading()
            self.handleResult(result)
        }
    }

    private func handleResult(_ result: Result<[T], Error>) {
        switch result {
        case .success(let data):
            self.data = data
            self.tableView.reloadData()
            self.updateEmptyView()

        case .failure(let error):
            self.handleError(error)
        }
    }

    private func updateEmptyView() {
        if data.isEmpty {
            showEmptyView()
        } else {
            hideEmptyView()
        }
    }

    private func handleError(_ error: Error) {
        showError(error.localizedDescription)
        Logger.error("Failed to load data", error: error)
        Analytics.track(event: .loadFailed, properties: [
            "error": error.localizedDescription
        ])
    }
}

// 使用
class UserViewController: BaseDataViewController<User> {
    override func viewDidLoad() {
        super.viewDidLoad()
        loadData(service: userService.getUsers)
    }
}
```

```swift
// 方案2: 使用协议 + 扩展
protocol DataLoadable: AnyObject {
    associatedtype DataType
    var data: [DataType] { get set }
    var tableView: UITableView { get }

    func showLoading()
    func hideLoading()
    func showEmptyView()
    func hideEmptyView()
    func showError(_ message: String)
}

extension DataLoadable where Self: UIViewController {
    func loadData(
        service: @escaping (@escaping (Result<[DataType], Error>) -> Void) -> Void
    ) {
        showLoading()

        service { [weak self] result in
            guard let self = self else { return }
            self.hideLoading()

            switch result {
            case .success(let data):
                self.data = data
                self.tableView.reloadData()

                if data.isEmpty {
                    self.showEmptyView()
                } else {
                    self.hideEmptyView()
                }

            case .failure(let error):
                self.showError(error.localizedDescription)
                Logger.error("Failed to load data", error: error)
                Analytics.track(event: .loadFailed, properties: [
                    "error": error.localizedDescription
                ])
            }
        }
    }
}

// 使用
class UserViewController: UIViewController, DataLoadable {
    var data: [User] = []

    func viewDidLoad() {
        super.viewDidLoad()
        loadData(service: userService.getUsers)
    }
}
```

**预期收益**:
- 减少代码行数: 390 行（78 × 5）→ 100 行
- 减少维护成本: 修改一处即可
- 提高代码一致性

---

#### 2. Cell 配置逻辑
**重复次数**: 8 次
**重复行数**: 45 行
**相似度**: 88%
**位置**:
- `UserCell.swift:23-67`
- `TaskCell.swift:34-78`
- `VideoCell.swift:45-89`
- `CommentCell.swift:12-56`
- 其他 4 个 Cell

**重复代码**:
```swift
// 在 8 个 Cell 中重复
func configure(with item: Item) {
    // 设置标题
    titleLabel.text = item.title
    titleLabel.font = .systemFont(ofSize: 16, weight: .medium)
    titleLabel.textColor = .label

    // 设置副标题
    subtitleLabel.text = item.subtitle
    subtitleLabel.font = .systemFont(ofSize: 14)
    subtitleLabel.textColor = .secondaryLabel

    // 设置图片
    if let imageURL = item.imageURL {
        imageView.sd_setImage(with: URL(string: imageURL), placeholderImage: UIImage(named: "placeholder"))
    } else {
        imageView.image = UIImage(named: "placeholder")
    }

    // 设置时间
    timeLabel.text = formatTime(item.createdAt)
    timeLabel.font = .systemFont(ofSize: 12)
    timeLabel.textColor = .tertiaryLabel

    // 设置状态
    statusLabel.text = item.status
    statusLabel.textColor = item.isActive ? .systemGreen : .systemGray
}

private func formatTime(_ dateString: String) -> String {
    // 时间格式化逻辑
}
```

**重构建议**:
```swift
// 方案1: 提取基类
class BaseCell: UITableViewCell {
    let titleLabel = UILabel()
    let subtitleLabel = UILabel()
    let iconImageView = UIImageView()
    let timeLabel = UILabel()

    func setupLabels() {
        titleLabel.font = .systemFont(ofSize: 16, weight: .medium)
        titleLabel.textColor = .label

        subtitleLabel.font = .systemFont(ofSize: 14)
        subtitleLabel.textColor = .secondaryLabel

        timeLabel.font = .systemFont(ofSize: 12)
        timeLabel.textColor = .tertiaryLabel
    }

    func setImage(url: String?) {
        if let urlString = url, let url = URL(string: urlString) {
            iconImageView.sd_setImage(with: url, placeholderImage: UIImage(named: "placeholder"))
        } else {
            iconImageView.image = UIImage(named: "placeholder")
        }
    }

    func formatTime(_ dateString: String) -> String {
        // 统一的时间格式化逻辑
    }
}

// 使用
class UserCell: BaseCell {
    func configure(with user: User) {
        titleLabel.text = user.name
        subtitleLabel.text = user.email
        setImage(url: user.avatar)
        timeLabel.text = formatTime(user.createdAt)
    }
}
```

**预期收益**:
- 减少代码行数: 360 行（45 × 8）→ 80 行
- 统一 UI 风格
- 便于批量修改

---

### 🟡 中等重复（建议重构）

#### 3. 表单验证逻辑
**重复次数**: 4 次
**重复行数**: 32 行
**相似度**: 82%
**位置**:
- `LoginViewController.swift:89-120`
- `RegisterViewController.swift:123-154`
- `ProfileEditViewController.swift:67-98`
- `FeedbackViewController.swift:45-76`

**重复代码**:
```swift
// 在 4 个文件中重复
func validateForm() -> Bool {
    // 验证邮箱
    guard let email = emailTextField.text, !email.isEmpty else {
        showError("请输入邮箱")
        return false
    }

    guard isValidEmail(email) else {
        showError("邮箱格式不正确")
        return false
    }

    // 验证密码
    guard let password = passwordTextField.text, !password.isEmpty else {
        showError("请输入密码")
        return false
    }

    guard password.count >= 6 else {
        showError("密码至少6位")
        return false
    }

    return true
}

func isValidEmail(_ email: String) -> Bool {
    let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
    let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
    return emailPredicate.evaluate(with: email)
}
```

**重构建议**:
```swift
// 创建验证工具类
class FormValidator {
    enum ValidationError: Error, LocalizedError {
        case emptyEmail
        case invalidEmail
        case emptyPassword
        case shortPassword
        case emptyName
        case invalidPhone

        var errorDescription: String? {
            switch self {
            case .emptyEmail: return "请输入邮箱"
            case .invalidEmail: return "邮箱格式不正确"
            case .emptyPassword: return "请输入密码"
            case .shortPassword: return "密码至少6位"
            case .emptyName: return "请输入姓名"
            case .invalidPhone: return "手机号格式不正确"
            }
        }
    }

    static func validateEmail(_ email: String?) throws {
        guard let email = email, !email.isEmpty else {
            throw ValidationError.emptyEmail
        }

        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)

        guard emailPredicate.evaluate(with: email) else {
            throw ValidationError.invalidEmail
        }
    }

    static func validatePassword(_ password: String?) throws {
        guard let password = password, !password.isEmpty else {
            throw ValidationError.emptyPassword
        }

        guard password.count >= 6 else {
            throw ValidationError.shortPassword
        }
    }

    static func validateName(_ name: String?) throws {
        guard let name = name, !name.isEmpty else {
            throw ValidationError.emptyName
        }
    }
}

// 使用
class LoginViewController: UIViewController {
    func validateForm() -> Bool {
        do {
            try FormValidator.validateEmail(emailTextField.text)
            try FormValidator.validatePassword(passwordTextField.text)
            return true
        } catch {
            showError(error.localizedDescription)
            return false
        }
    }
}
```

**预期收益**:
- 减少代码行数: 128 行（32 × 4）→ 60 行
- 统一验证逻辑
- 便于添加新的验证规则

---

#### 4. 空态/错误态视图
**重复次数**: 6 次
**重复行数**: 28 行
**相似度**: 90%

**重构建议**: 创建通用的空态/错误态组件

---

### 🟢 轻微重复（可选重构）

#### 5. 埋点代码
**重复次数**: 15 次
**重复行数**: 12 行
**相似度**: 75%

**重构建议**: 使用埋点工具类统一管理

---

## 重构优先级

### 优先级1: 高频重复（> 5 次）
1. 网络请求处理逻辑（5 次，78 行）
2. Cell 配置逻辑（8 次，45 行）
3. 埋点代码（15 次，12 行）

### 优先级2: 大段重复（> 50 行）
1. 网络请求处理逻辑（78 行）

### 优先级3: 中等重复
1. 表单验证逻辑（4 次，32 行）
2. 空态/错误态视图（6 次，28 行）

## 重构方案

### 方案1: 提取基类
**适用场景**: 多个类有相同的属性和方法
**优点**: 代码复用，易于维护
**缺点**: 增加继承层次

### 方案2: 使用协议 + 扩展
**适用场景**: 需要在多个不相关的类中共享行为
**优点**: 灵活，避免多重继承
**缺点**: 可能导致协议过多

### 方案3: 提取工具类
**适用场景**: 纯函数式的重复逻辑
**优点**: 简单直接，易于测试
**缺点**: 可能导致工具类过大

### 方案4: 使用泛型
**适用场景**: 类型不同但逻辑相同
**优点**: 类型安全，代码简洁
**缺点**: 可能增加理解难度

## 预期收益

### 代码量减少
- 重构前: 12,345 行
- 重构后: 11,111 行
- 减少: 1,234 行（10%）

### 维护成本降低
- 修改一处即可影响多处
- 减少 Bug 修复时间
- 提高代码一致性

### 开发效率提升
- 复用现有代码
- 减少重复劳动
- 加快新功能开发

## 实施计划

### 第1周: 高优先级重构
- 重构网络请求处理逻辑
- 重构 Cell 配置逻辑

### 第2周: 中优先级重构
- 重构表单验证逻辑
- 重构空态/错误态视图

### 第3周: 低优先级重构
- 重构埋点代码
- 其他轻微重复

### 第4周: 验证和优化
- 测试重构后的代码
- 修复问题
- 优化性能
```

## 使用示例

### 示例1: 检测单个模块
```
用户: 查找 Profile 模块的重复代码

助手:
1. 扫描模块所有文件
2. 识别重复代码块
3. 计算相似度
4. 生成重复报告
5. 提供重构建议
```

### 示例2: 检测整个项目
```
用户: 检测项目中的所有重复代码

助手:
1. 扫描所有源文件
2. 统计重复情况
3. 按严重程度排序
4. 生成综合报告
```

### 示例3: 对比重构效果
```
用户: 对比重构前后的代码重复率

助手:
1. 检测重构前的重复率
2. 检测重构后的重复率
3. 对比改进效果
4. 评估重构收益
```

## 注意事项

### 1. 不是所有重复都需要重构
- 少量重复（< 10 行）可以接受
- 业务逻辑不同的相似代码
- 重构成本 > 维护成本

### 2. 选择合适的重构方案
- 考虑代码的使用场景
- 权衡复杂度和收益
- 保持代码可读性

### 3. 渐进式重构
- 优先重构高频重复
- 逐步改进中等重复
- 轻微重复可选

### 4. 测试验证
- 重构后充分测试
- 确保功能不变
- 检查性能影响

## 相关文档

- `CLAUDE.md` - 项目编码规范
- `code-quality-auditor.md` - 代码质量审计
- `architecture-reviewer.md` - 架构审查
