<!-- Managed by UnifySkillManager. Manual edits may be overwritten. -->

---
id: architecture-reviewer-agent
type: skill
name: Architecture Reviewer Agent
source: UnifySkillManager
tool: codebuddy
version: 1.0.0
---

# Architecture Reviewer Agent

架构审查代理，用于审查代码架构设计，确保符合 MVVM 模式和项目规范。

## 使用方法

触发关键词：
- "审查架构"
- "检查架构设计"
- "架构评审"
- "代码架构分析"
- "MVVM 检查"

## 功能说明

### 1. 审查维度

#### 1.1 MVVM 架构合规性
```
检查项：
✅ View/ViewController 是否只负责 UI
✅ ViewModel 是否正确处理业务逻辑
✅ Model 是否为纯数据结构
✅ Service/Repository 是否正确封装网络和数据层
✅ 是否存在跨层调用
```

#### 1.2 模块划分
```
检查项：
✅ 模块职责是否清晰
✅ 模块间耦合度是否合理
✅ 是否存在循环依赖
✅ 公共代码是否正确抽取
✅ 目录结构是否合理
```

#### 1.3 依赖关系
```
检查项：
✅ 依赖方向是否正确（单向依赖）
✅ 是否使用依赖注入
✅ 是否过度依赖单例
✅ 是否存在隐式依赖
```

#### 1.4 代码组织
```
检查项：
✅ 文件大小是否合理（< 500 行）
✅ 类职责是否单一
✅ 方法复杂度是否合理
✅ 是否正确使用扩展分组
```

### 2. 审查流程

#### 步骤1: 文件结构分析
```
分析内容：
1. 扫描目录结构
2. 识别各层文件（View/ViewModel/Model/Service）
3. 检查文件命名规范
4. 检查文件组织方式
```

#### 步骤2: 依赖关系分析
```
分析内容：
1. 提取 import 语句
2. 分析类之间的引用关系
3. 绘制依赖关系图
4. 识别循环依赖
```

#### 步骤3: MVVM 合规性检查
```
检查内容：
1. ViewController 中是否有业务逻辑
2. ViewModel 中是否有 UI 代码
3. Model 中是否有业务逻辑
4. Service 是否正确封装
```

#### 步骤4: 代码质量评估
```
评估内容：
1. 类的大小和复杂度
2. 方法的大小和复杂度
3. 代码重复度
4. 注释完整性
```

#### 步骤5: 生成审查报告
```
报告内容：
1. 架构评分（0-100）
2. 问题清单（按严重程度排序）
3. 改进建议
4. 重构方案
```

### 3. 审查规则

#### 规则1: ViewController 规范
```swift
// ❌ 不合规：ViewController 中有业务逻辑
class UserViewController: UIViewController {
    func loadData() {
        // ❌ 直接调用网络请求
        UserService().getUserInfo(userId: "123") { user in
            // ❌ 直接处理业务逻辑
            if user.isVIP {
                self.showVIPBadge()
            }
            self.updateUI(with: user)
        }
    }
}

// ✅ 合规：ViewController 只负责 UI
class UserViewController: UIViewController {
    private let viewModel: UserViewModel

    init(viewModel: UserViewModel) {
        self.viewModel = viewModel
        super.init(nibName: nil, bundle: nil)
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        bindViewModel()
    }

    private func setupUI() {
        // 只负责 UI 设置
    }

    private func bindViewModel() {
        // 绑定 ViewModel 数据
        viewModel.$user
            .sink { [weak self] user in
                self?.updateUI(with: user)
            }
            .store(in: &cancellables)
    }

    private func updateUI(with user: User?) {
        // 只负责更新 UI
    }
}
```

#### 规则2: ViewModel 规范
```swift
// ❌ 不合规：ViewModel 中有 UI 代码
class UserViewModel {
    func loadUser() {
        userService.getUserInfo(userId: userId)
            .sink { user in
                // ❌ 直接操作 UI
                self.nameLabel.text = user.name
            }
    }
}

// ✅ 合规：ViewModel 只处理业务逻辑和状态
class UserViewModel: ObservableObject {
    @Published var user: User?
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let userService: UserServiceProtocol
    private var cancellables = Set<AnyCancellable>()

    init(userService: UserServiceProtocol) {
        self.userService = userService
    }

    func loadUser(userId: String) {
        isLoading = true
        errorMessage = nil

        userService.getUserInfo(userId: userId)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] completion in
                self?.isLoading = false
                if case .failure(let error) = completion {
                    self?.errorMessage = error.localizedDescription
                }
            } receiveValue: { [weak self] user in
                self?.user = user
            }
            .store(in: &cancellables)
    }
}
```

#### 规则3: Model 规范
```swift
// ❌ 不合规：Model 中有业务逻辑
struct User: Codable {
    let id: String
    let name: String
    let isVIP: Bool

    // ❌ 业务逻辑不应该在 Model 中
    func canAccessVIPContent() -> Bool {
        return isVIP && !isExpired()
    }

    private func isExpired() -> Bool {
        // 复杂的业务判断
    }
}

// ✅ 合规：Model 只包含数据和简单的计算属性
struct User: Codable {
    let id: String
    let name: String
    let email: String
    let isVIP: Bool
    let vipExpireDate: String?

    // ✅ 简单的计算属性可以接受
    var displayName: String {
        return isVIP ? "\(name) 👑" : name
    }

    // ✅ 格式化方法可以接受
    var formattedEmail: String {
        return email.lowercased()
    }
}

// ✅ 业务逻辑放在 ViewModel 或 Service 中
class UserViewModel {
    func canAccessVIPContent(user: User) -> Bool {
        guard user.isVIP else { return false }

        if let expireDate = user.vipExpireDate {
            return !isExpired(expireDate)
        }

        return true
    }
}
```

#### 规则4: Service 规范
```swift
// ❌ 不合规：Service 中有 UI 逻辑
class UserService {
    func getUserInfo(userId: String, completion: @escaping (User?) -> Void) {
        // 网络请求...
        // ❌ 显示 Loading
        LoadingView.show()

        API.request { result in
            // ❌ 隐藏 Loading
            LoadingView.hide()

            // ❌ 显示错误提示
            if case .failure = result {
                Toast.show("加载失败")
            }

            completion(user)
        }
    }
}

// ✅ 合规：Service 只负责数据获取
class UserService: UserServiceProtocol {
    private let provider: MoyaProvider<UserAPI>

    init(provider: MoyaProvider<UserAPI> = MoyaProvider<UserAPI>()) {
        self.provider = provider
    }

    func getUserInfo(userId: String) -> AnyPublisher<User, Error> {
        return provider.requestPublisher(.getUserInfo(userId: userId))
            .map(\.data)
            .decode(type: BaseResponse.self, decoder: JSONDecoder())
            .tryMap { response in
                guard response.isSuccess else {
                    throw NetworkError.serverError(message: response.message ?? "Unknown error")
                }
                guard let user: User = response.decodeData(as: User.self) else {
                    throw NetworkError.decodingFailed
                }
                return user
            }
            .eraseToAnyPublisher()
    }
}
```

#### 规则5: 依赖注入规范
```swift
// ❌ 不合规：硬编码依赖
class UserViewModel {
    private let userService = UserService()  // ❌ 硬编码

    func loadUser() {
        userService.getUserInfo(userId: "123")
    }
}

// ✅ 合规：依赖注入
class UserViewModel {
    private let userService: UserServiceProtocol

    // ✅ 通过构造函数注入
    init(userService: UserServiceProtocol = UserService()) {
        self.userService = userService
    }

    func loadUser(userId: String) {
        userService.getUserInfo(userId: userId)
    }
}
```

### 4. 审查报告模板

```markdown
# 架构审查报告

## 基本信息
- **审查模块**: Profile/Task
- **审查时间**: 2026-02-28
- **审查人**: Architecture Reviewer Agent
- **代码行数**: 1,234 行

## 架构评分

### 总体评分: 75/100

| 维度 | 得分 | 权重 | 说明 |
|------|------|------|------|
| MVVM 合规性 | 70/100 | 30% | 部分 ViewController 过重 |
| 模块划分 | 85/100 | 25% | 模块职责较清晰 |
| 依赖关系 | 65/100 | 20% | 存在循环依赖 |
| 代码组织 | 80/100 | 15% | 文件大小合理 |
| 可测试性 | 75/100 | 10% | 部分代码难以测试 |

## 问题清单

### 🔴 严重问题（必须修复）

#### 1. ViewController 过重
**位置**: `TaskViewController.swift:1-500`
**问题**: ViewController 包含 500 行代码，包含大量业务逻辑
**影响**:
- 违反 MVVM 架构
- 难以测试
- 难以维护

**建议**:
```swift
// 当前代码结构
class TaskViewController: UIViewController {
    // 500 行代码，包含：
    // - UI 设置
    // - 网络请求
    // - 业务逻辑
    // - 数据处理
}

// 建议重构为
class TaskViewController: UIViewController {
    private let viewModel: TaskViewModel
    // 只负责 UI 和绑定，约 150 行
}

class TaskViewModel {
    // 业务逻辑和状态管理，约 200 行
}

class TaskService {
    // 网络请求，约 100 行
}
```

#### 2. 循环依赖
**位置**: `TaskManager.swift` ↔ `TaskViewController.swift`
**问题**: TaskManager 和 TaskViewController 相互引用
**影响**:
- 可能导致内存泄漏
- 代码耦合度高
- 难以单独测试

**建议**:
```swift
// 使用协议解耦
protocol TaskManagerDelegate: AnyObject {
    func taskDidUpdate(_ task: Task)
}

class TaskManager {
    weak var delegate: TaskManagerDelegate?
}

class TaskViewController: UIViewController, TaskManagerDelegate {
    private let taskManager: TaskManager

    func taskDidUpdate(_ task: Task) {
        // 处理更新
    }
}
```

#### 3. 直接调用网络层
**位置**: `TaskViewController.swift:234`
**问题**: ViewController 直接调用 Moya 进行网络请求
**影响**:
- 违反 MVVM 架构
- 无法 Mock 测试
- 代码重复

**建议**:
```swift
// ❌ 当前代码
class TaskViewController: UIViewController {
    func loadTasks() {
        provider.request(.getTasks) { result in
            // 处理结果
        }
    }
}

// ✅ 重构后
class TaskViewController: UIViewController {
    private let viewModel: TaskViewModel

    func loadTasks() {
        viewModel.loadTasks()
    }
}

class TaskViewModel {
    private let taskService: TaskServiceProtocol

    func loadTasks() {
        taskService.getTasks()
            .sink { [weak self] tasks in
                self?.tasks = tasks
            }
            .store(in: &cancellables)
    }
}
```

### 🟡 中等问题（建议修复）

#### 4. 过度使用单例
**位置**: 多处
**问题**: 大量使用 `.shared` 单例模式
**影响**:
- 难以测试
- 隐式依赖
- 状态管理混乱

**建议**:
```swift
// ❌ 当前代码
class TaskViewModel {
    func loadTasks() {
        TaskManager.shared.getTasks()
        UserManager.shared.getCurrentUser()
        AnalyticsManager.shared.track(event: .pageView)
    }
}

// ✅ 重构后
class TaskViewModel {
    private let taskManager: TaskManagerProtocol
    private let userManager: UserManagerProtocol
    private let analytics: AnalyticsProtocol

    init(
        taskManager: TaskManagerProtocol = TaskManager(),
        userManager: UserManagerProtocol = UserManager(),
        analytics: AnalyticsProtocol = AnalyticsManager()
    ) {
        self.taskManager = taskManager
        self.userManager = userManager
        self.analytics = analytics
    }
}
```

#### 5. 缺少协议抽象
**位置**: `TaskService.swift`
**问题**: Service 没有定义协议，直接使用具体类
**影响**:
- 难以 Mock
- 难以替换实现
- 耦合度高

**建议**:
```swift
// ✅ 定义协议
protocol TaskServiceProtocol {
    func getTasks() -> AnyPublisher<[Task], Error>
    func createTask(_ task: Task) -> AnyPublisher<Task, Error>
    func updateTask(_ task: Task) -> AnyPublisher<Task, Error>
}

// ✅ 实现协议
class TaskService: TaskServiceProtocol {
    // 实现
}

// ✅ Mock 实现
class MockTaskService: TaskServiceProtocol {
    // Mock 实现
}
```

### 🟢 轻微问题（可选修复）

#### 6. 文件命名不一致
**位置**: 多处
**问题**: 部分文件使用 `ARV_` 前缀，部分使用 `NAR_` 前缀
**建议**: 统一使用 `NAR_` 前缀

#### 7. 注释不完整
**位置**: 多处
**问题**: 部分公共方法缺少文档注释
**建议**: 为所有公共方法添加文档注释

## 改进建议

### 短期改进（1-2周）
1. 重构 TaskViewController，拆分为 ViewController + ViewModel
2. 解决循环依赖问题
3. 将网络请求移到 Service 层

### 中期改进（1-2个月）
1. 为所有 Service 定义协议
2. 减少单例使用，改用依赖注入
3. 提高测试覆盖率到 60%+

### 长期改进（3-6个月）
1. 完善架构文档
2. 建立代码审查流程
3. 引入静态分析工具

## 重构方案

### 方案1: TaskViewController 重构

#### 当前结构
```
TaskViewController.swift (500 行)
├── UI 设置 (100 行)
├── 网络请求 (150 行)
├── 业务逻辑 (150 行)
└── 数据处理 (100 行)
```

#### 重构后结构
```
TaskViewController.swift (150 行)
├── UI 设置
└── ViewModel 绑定

TaskViewModel.swift (200 行)
├── 状态管理
├── 业务逻辑
└── Service 调用

TaskService.swift (100 行)
└── 网络请求

Task.swift (50 行)
└── 数据模型
```

#### 重构步骤
1. 创建 TaskViewModel 类
2. 将业务逻辑移到 ViewModel
3. 创建 TaskService 协议和实现
4. 将网络请求移到 Service
5. 简化 ViewController，只保留 UI 代码
6. 添加单元测试

### 方案2: 依赖注入改造

#### 步骤1: 定义协议
```swift
protocol TaskServiceProtocol { }
protocol UserServiceProtocol { }
protocol AnalyticsProtocol { }
```

#### 步骤2: 创建依赖容器
```swift
class ServiceContainer {
    static let shared = ServiceContainer()

    let taskService: TaskServiceProtocol
    let userService: UserServiceProtocol
    let analytics: AnalyticsProtocol

    init(
        taskService: TaskServiceProtocol = TaskService(),
        userService: UserServiceProtocol = UserService(),
        analytics: AnalyticsProtocol = AnalyticsManager()
    ) {
        self.taskService = taskService
        self.userService = userService
        self.analytics = analytics
    }
}
```

#### 步骤3: 使用依赖注入
```swift
class TaskViewModel {
    private let taskService: TaskServiceProtocol

    init(taskService: TaskServiceProtocol = ServiceContainer.shared.taskService) {
        self.taskService = taskService
    }
}
```

## 总结

### 优点
✅ 模块划分较清晰
✅ 使用了 MVVM 架构
✅ 代码组织较合理

### 需要改进
❌ ViewController 过重
❌ 存在循环依赖
❌ 过度使用单例
❌ 缺少协议抽象
❌ 测试覆盖率低

### 下一步行动
1. 优先修复严重问题
2. 逐步改进中等问题
3. 建立代码审查机制
4. 提高测试覆盖率
```

## 使用示例

### 示例1: 审查单个文件
```
用户: 审查 TaskViewController.swift 的架构

助手:
1. 分析文件结构
2. 检查 MVVM 合规性
3. 识别问题
4. 提供改进建议
5. 生成重构方案
```

### 示例2: 审查整个模块
```
用户: 审查 Profile 模块的架构设计

助手:
1. 扫描模块所有文件
2. 分析依赖关系
3. 检查模块划分
4. 评估代码质量
5. 生成完整报告
```

### 示例3: 对比审查
```
用户: 对比 OC 版本和 Swift 版本的架构差异

助手:
1. 分析两个版本的架构
2. 对比差异
3. 评估改进程度
4. 提供优化建议
```

## 注意事项

### 1. 审查范围
- 专注于架构层面的问题
- 不涉及具体的业务逻辑
- 不涉及 UI 细节

### 2. 评分标准
- 客观、公正
- 基于项目规范
- 考虑实际情况

### 3. 改进建议
- 可行性高
- 优先级明确
- 提供具体方案

### 4. 持续改进
- 定期审查
- 跟踪改进进度
- 更新审查标准

## 相关文档

- `CLAUDE.md` - 项目架构规范
- `PROJECT_STRUCTURE_AND_FRAMEWORK.md` - 项目结构说明
- `SWIFT_MIGRATION_ANALYSIS.md` - Swift 迁移分析

