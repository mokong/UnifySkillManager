---
id: mock-data-generator
type: skill
name: Mock Data Generator
description: ""
tags:
  - claude
targets:
  - claude
scope:
  - global
enabled: true
version: 1.0.0
sourcePath: /Users/apple/.claude/skills/mock-data-generator.md
importedAt: "2026-04-17T10:11:44.669Z"
createdAt: "2026-04-17T10:11:44.669Z"
updatedAt: "2026-04-17T10:11:44.669Z"
---

# Mock Data Generator

自动生成 Mock 数据和 Mock Service，支持各种边界值测试，无需等待后端接口即可开发和测试。

## 使用方法

触发关键词：
- "生成 Mock 数据"
- "创建 Mock Service"
- "生成测试数据"
- "Mock 接口"
- "边界值测试"

## 功能说明

### 1. Mock 数据类型

#### 正常数据
```swift
// 标准的正常数据
let normalUser = User(
    id: "user_001",
    name: "张三",
    email: "zhangsan@example.com",
    avatar: "https://example.com/avatar.jpg",
    isVIP: true,
    age: 25
)
```

#### 边界值数据
```swift
// 空数据
let emptyUser = User(
    id: "",
    name: "",
    email: "",
    avatar: nil,
    isVIP: false,
    age: nil
)

// 极限值
let extremeUser = User(
    id: String(repeating: "a", count: 1000),  // 超长 ID
    name: String(repeating: "测", count: 100),  // 超长名称
    email: "a@b.c",  // 最短邮箱
    avatar: nil,
    isVIP: true,
    age: 150  // 异常年龄
)

// 特殊字符
let specialUser = User(
    id: "user_<script>alert('xss')</script>",
    name: "👨‍👩‍👧‍👦🎉💯",  // emoji
    email: "test+tag@example.com",
    avatar: "javascript:alert('xss')",
    isVIP: true,
    age: -1
)
```

#### 错误场景数据
```swift
// 网络错误
let networkError = NetworkError.networkFailure(
    NSError(domain: NSURLErrorDomain, code: NSURLErrorNotConnectedToInternet)
)

// 服务器错误
let serverError = NetworkError.serverError(message: "Internal Server Error")

// 超时错误
let timeoutError = NetworkError.networkFailure(
    NSError(domain: NSURLErrorDomain, code: NSURLErrorTimedOut)
)

// 401 未授权
let unauthorizedError = NetworkError.unauthorized
```

### 2. Mock Service 生成模板

#### 模板1: 基础 Mock Service
```swift
//
//  MockUserService.swift
//  NewAnyReel
//
//  Created by Claude on 2026-02-27.
//

import Foundation
import Combine

// MARK: - Mock User Service

/// Mock 用户服务（用于开发和测试）
class MockUserService: UserServiceProtocol {

    // MARK: - Mock Configuration

    /// Mock 场景类型
    enum MockScenario {
        case success           // 成功
        case empty             // 空数据
        case networkError      // 网络错误
        case serverError       // 服务器错误
        case timeout           // 超时
        case unauthorized      // 未授权
        case slowResponse      // 慢响应（模拟网络延迟）
        case partialData       // 部分数据
        case invalidData       // 无效数据
    }

    /// 当前 Mock 场景
    var scenario: MockScenario = .success

    /// 响应延迟（秒）
    var responseDelay: TimeInterval = 0.5

    /// 是否启用随机失败（模拟不稳定网络）
    var enableRandomFailure: Bool = false

    /// 随机失败概率（0.0 - 1.0）
    var randomFailureRate: Double = 0.1

    // MARK: - Mock Data

    /// 正常用户数据
    private let normalUser = User(
        id: "user_001",
        name: "张三",
        email: "zhangsan@example.com",
        avatar: "https://example.com/avatar/001.jpg",
        createdAt: "2026-01-01T00:00:00Z",
        isVIP: true,
        age: 25
    )

    /// 空数据用户
    private let emptyUser = User(
        id: "",
        name: "",
        email: "",
        avatar: nil,
        createdAt: "",
        isVIP: false,
        age: nil
    )

    /// 边界值用户
    private let extremeUser = User(
        id: String(repeating: "a", count: 100),
        name: String(repeating: "测", count: 50),
        email: "a@b.c",
        avatar: nil,
        createdAt: "2026-12-31T23:59:59Z",
        isVIP: true,
        age: 150
    )

    /// 特殊字符用户
    private let specialUser = User(
        id: "user_<script>",
        name: "👨‍👩‍👧‍👦🎉💯",
        email: "test+tag@example.com",
        avatar: "javascript:alert('xss')",
        createdAt: "invalid-date",
        isVIP: false,
        age: -1
    )

    // MARK: - UserServiceProtocol Implementation

    func getUserInfo(userId: String) -> AnyPublisher<User, Error> {
        return mockResponse {
            switch self.scenario {
            case .success:
                return .success(self.normalUser)
            case .empty:
                return .success(self.emptyUser)
            case .networkError:
                return .failure(NetworkError.networkFailure(
                    NSError(domain: NSURLErrorDomain, code: NSURLErrorNotConnectedToInternet)
                ))
            case .serverError:
                return .failure(NetworkError.serverError(message: "Internal Server Error"))
            case .timeout:
                return .failure(NetworkError.networkFailure(
                    NSError(domain: NSURLErrorDomain, code: NSURLErrorTimedOut)
                ))
            case .unauthorized:
                return .failure(NetworkError.unauthorized)
            case .slowResponse:
                return .success(self.normalUser)
            case .partialData:
                return .success(self.emptyUser)
            case .invalidData:
                return .success(self.specialUser)
            }
        }
    }

    func updateProfile(name: String, avatar: String?) -> AnyPublisher<User, Error> {
        return mockResponse {
            switch self.scenario {
            case .success:
                var user = self.normalUser
                // 注意：User 是 struct，需要创建新实例
                return .success(User(
                    id: user.id,
                    name: name,
                    email: user.email,
                    avatar: avatar ?? user.avatar,
                    createdAt: user.createdAt,
                    isVIP: user.isVIP,
                    age: user.age
                ))
            case .networkError:
                return .failure(NetworkError.networkFailure(
                    NSError(domain: NSURLErrorDomain, code: NSURLErrorNotConnectedToInternet)
                ))
            default:
                return .failure(NetworkError.serverError(message: "Update failed"))
            }
        }
    }

    func getUserList(page: Int, limit: Int) -> AnyPublisher<UserListResponse, Error> {
        return mockResponse {
            switch self.scenario {
            case .success:
                let users = self.generateUserList(count: limit)
                let response = UserListResponse(
                    users: users,
                    total: 100,
                    page: page,
                    limit: limit,
                    hasMore: page < 10
                )
                return .success(response)

            case .empty:
                let response = UserListResponse(
                    users: [],
                    total: 0,
                    page: page,
                    limit: limit,
                    hasMore: false
                )
                return .success(response)

            case .partialData:
                // 只返回部分数据
                let users = self.generateUserList(count: limit / 2)
                let response = UserListResponse(
                    users: users,
                    total: 100,
                    page: page,
                    limit: limit,
                    hasMore: true
                )
                return .success(response)

            default:
                return .failure(NetworkError.serverError(message: "Failed to load list"))
            }
        }
    }

    // MARK: - Private Helpers

    /// 生成 Mock 响应（带延迟和随机失败）
    private func mockResponse<T>(_ builder: @escaping () -> Result<T, Error>) -> AnyPublisher<T, Error> {
        // 检查随机失败
        if enableRandomFailure && Double.random(in: 0...1) < randomFailureRate {
            return Fail(error: NetworkError.networkFailure(
                NSError(domain: NSURLErrorDomain, code: NSURLErrorNotConnectedToInternet)
            ))
            .delay(for: .seconds(responseDelay), scheduler: DispatchQueue.main)
            .eraseToAnyPublisher()
        }

        // 根据场景返回结果
        let result = builder()

        return Future<T, Error> { promise in
            DispatchQueue.main.asyncAfter(deadline: .now() + self.responseDelay) {
                promise(result)
            }
        }
        .eraseToAnyPublisher()
    }

    /// 生成用户列表
    private func generateUserList(count: Int) -> [User] {
        return (0..<count).map { index in
            User(
                id: "user_\(String(format: "%03d", index))",
                name: "用户\(index)",
                email: "user\(index)@example.com",
                avatar: "https://example.com/avatar/\(index).jpg",
                createdAt: "2026-01-\(String(format: "%02d", (index % 28) + 1))T00:00:00Z",
                isVIP: index % 3 == 0,
                age: 20 + (index % 50)
            )
        }
    }
}

// MARK: - Mock Scenario Builder

extension MockUserService {
    /// 快速创建不同场景的 Mock Service
    static func with(scenario: MockScenario, delay: TimeInterval = 0.5) -> MockUserService {
        let service = MockUserService()
        service.scenario = scenario
        service.responseDelay = delay
        return service
    }

    /// 创建不稳定网络场景
    static func unstableNetwork(failureRate: Double = 0.3) -> MockUserService {
        let service = MockUserService()
        service.enableRandomFailure = true
        service.randomFailureRate = failureRate
        service.responseDelay = Double.random(in: 0.5...3.0)
        return service
    }
}
```

#### 模板2: Mock 数据工厂
```swift
//
//  MockDataFactory.swift
//  NewAnyReel
//
//  Created by Claude on 2026-02-27.
//

import Foundation

// MARK: - Mock Data Factory

/// Mock 数据工厂
enum MockDataFactory {

    // MARK: - User Mock Data

    enum UserMock {
        /// 正常用户
        static let normal = User(
            id: "user_001",
            name: "张三",
            email: "zhangsan@example.com",
            avatar: "https://example.com/avatar.jpg",
            createdAt: "2026-01-01T00:00:00Z",
            isVIP: true,
            age: 25
        )

        /// VIP 用户
        static let vip = User(
            id: "user_vip",
            name: "VIP用户",
            email: "vip@example.com",
            avatar: "https://example.com/vip_avatar.jpg",
            createdAt: "2025-01-01T00:00:00Z",
            isVIP: true,
            age: 30
        )

        /// 普通用户
        static let regular = User(
            id: "user_regular",
            name: "普通用户",
            email: "regular@example.com",
            avatar: "https://example.com/regular_avatar.jpg",
            createdAt: "2026-02-01T00:00:00Z",
            isVIP: false,
            age: 22
        )

        /// 空数据用户
        static let empty = User(
            id: "",
            name: "",
            email: "",
            avatar: nil,
            createdAt: "",
            isVIP: false,
            age: nil
        )

        /// 最小数据用户
        static let minimal = User(
            id: "u",
            name: "A",
            email: "a@b.c",
            avatar: nil,
            createdAt: "2026-01-01T00:00:00Z",
            isVIP: false,
            age: 1
        )

        /// 最大数据用户
        static let maximal = User(
            id: String(repeating: "a", count: 100),
            name: String(repeating: "测", count: 50),
            email: String(repeating: "a", count: 50) + "@example.com",
            avatar: "https://example.com/" + String(repeating: "a", count: 100) + ".jpg",
            createdAt: "2099-12-31T23:59:59Z",
            isVIP: true,
            age: 150
        )

        /// 特殊字符用户
        static let special = User(
            id: "user_<script>alert('xss')</script>",
            name: "👨‍👩‍👧‍👦🎉💯",
            email: "test+tag@example.com",
            avatar: "javascript:alert('xss')",
            createdAt: "invalid-date",
            isVIP: false,
            age: -1
        )

        /// 生成随机用户
        static func random() -> User {
            let id = "user_\(UUID().uuidString.prefix(8))"
            let names = ["张三", "李四", "王五", "赵六", "钱七"]
            let name = names.randomElement()!
            let age = Int.random(in: 18...60)

            return User(
                id: id,
                name: name,
                email: "\(name)@example.com",
                avatar: "https://example.com/avatar/\(id).jpg",
                createdAt: ISO8601DateFormatter().string(from: Date()),
                isVIP: Bool.random(),
                age: age
            )
        }

        /// 生成用户列表
        static func list(count: Int) -> [User] {
            return (0..<count).map { _ in random() }
        }
    }

    // MARK: - Video Mock Data

    enum VideoMock {
        /// 正常视频
        static let normal = VideoDetail(
            id: "video_001",
            title: "精彩短视频",
            description: "这是一个精彩的短视频",
            duration: 120,
            playURL: "https://example.com/video.mp4",
            coverURL: "https://example.com/cover.jpg",
            author: AuthorMock.normal,
            statistics: StatisticsMock.normal,
            tags: ["搞笑", "娱乐", "热门"],
            relatedVideos: [],
            isFavorited: false,
            createdAt: "2026-01-01T00:00:00Z"
        )

        /// 空数据视频
        static let empty = VideoDetail(
            id: "",
            title: "",
            description: nil,
            duration: 0,
            playURL: "",
            coverURL: "",
            author: AuthorMock.empty,
            statistics: StatisticsMock.zero,
            tags: [],
            relatedVideos: [],
            isFavorited: false,
            createdAt: ""
        )

        /// 超长视频
        static let long = VideoDetail(
            id: "video_long",
            title: "超长视频",
            description: "这是一个超长的视频",
            duration: 7200,  // 2小时
            playURL: "https://example.com/long_video.mp4",
            coverURL: "https://example.com/long_cover.jpg",
            author: AuthorMock.normal,
            statistics: StatisticsMock.high,
            tags: ["电影", "长视频"],
            relatedVideos: [],
            isFavorited: true,
            createdAt: "2026-01-01T00:00:00Z"
        )

        /// 生成随机视频
        static func random() -> VideoDetail {
            let id = "video_\(UUID().uuidString.prefix(8))"
            let titles = ["搞笑视频", "美食教程", "旅行vlog", "音乐MV", "游戏实况"]
            let title = titles.randomElement()!

            return VideoDetail(
                id: id,
                title: title,
                description: "\(title)的详细描述",
                duration: Int.random(in: 30...600),
                playURL: "https://example.com/video/\(id).mp4",
                coverURL: "https://example.com/cover/\(id).jpg",
                author: AuthorMock.random(),
                statistics: StatisticsMock.random(),
                tags: ["标签1", "标签2"],
                relatedVideos: [],
                isFavorited: Bool.random(),
                createdAt: ISO8601DateFormatter().string(from: Date())
            )
        }

        /// 生成视频列表
        static func list(count: Int) -> [VideoDetail] {
            return (0..<count).map { _ in random() }
        }
    }

    // MARK: - Author Mock Data

    enum AuthorMock {
        static let normal = Author(
            id: "author_001",
            name: "创作者",
            avatar: "https://example.com/author_avatar.jpg",
            isFollowed: false
        )

        static let empty = Author(
            id: "",
            name: "",
            avatar: "",
            isFollowed: false
        )

        static func random() -> Author {
            let id = "author_\(UUID().uuidString.prefix(8))"
            let names = ["创作者A", "创作者B", "创作者C"]
            return Author(
                id: id,
                name: names.randomElement()!,
                avatar: "https://example.com/author/\(id).jpg",
                isFollowed: Bool.random()
            )
        }
    }

    // MARK: - Statistics Mock Data

    enum StatisticsMock {
        static let zero = Statistics(
            playCount: 0,
            likeCount: 0,
            commentCount: 0,
            shareCount: 0
        )

        static let normal = Statistics(
            playCount: 1234,
            likeCount: 567,
            commentCount: 89,
            shareCount: 12
        )

        static let high = Statistics(
            playCount: 1_234_567,
            likeCount: 123_456,
            commentCount: 12_345,
            shareCount: 1_234
        )

        static func random() -> Statistics {
            return Statistics(
                playCount: Int.random(in: 100...100_000),
                likeCount: Int.random(in: 10...10_000),
                commentCount: Int.random(in: 1...1_000),
                shareCount: Int.random(in: 0...100)
            )
        }
    }

    // MARK: - Error Mock Data

    enum ErrorMock {
        /// 网络错误
        static let network = NetworkError.networkFailure(
            NSError(domain: NSURLErrorDomain, code: NSURLErrorNotConnectedToInternet)
        )

        /// 超时错误
        static let timeout = NetworkError.networkFailure(
            NSError(domain: NSURLErrorDomain, code: NSURLErrorTimedOut)
        )

        /// 服务器错误
        static let server = NetworkError.serverError(message: "Internal Server Error")

        /// 未授权
        static let unauthorized = NetworkError.unauthorized

        /// 解析错误
        static let decoding = NetworkError.decodingFailed

        /// 随机错误
        static func random() -> NetworkError {
            let errors: [NetworkError] = [network, timeout, server, unauthorized, decoding]
            return errors.randomElement()!
        }
    }
}
```

#### 模板3: 在 ViewModel 中使用 Mock
```swift
//
//  UserViewModel.swift
//  NewAnyReel
//
//  Created by Claude on 2026-02-27.
//

import Foundation
import Combine

class UserViewModel: ObservableObject {

    // MARK: - Properties

    @Published var user: User?
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let userService: UserServiceProtocol
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Initialization

    /// 初始化（支持依赖注入）
    /// - Parameter userService: 用户服务（可以是真实服务或 Mock 服务）
    init(userService: UserServiceProtocol = UserService()) {
        self.userService = userService
    }

    // MARK: - Public Methods

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

// MARK: - Preview & Testing

#if DEBUG
extension UserViewModel {
    /// 用于 SwiftUI Preview 的 Mock ViewModel
    static var preview: UserViewModel {
        let mockService = MockUserService.with(scenario: .success, delay: 0.1)
        let viewModel = UserViewModel(userService: mockService)
        viewModel.user = MockDataFactory.UserMock.normal
        return viewModel
    }

    /// 用于测试加载状态的 Mock ViewModel
    static var loading: UserViewModel {
        let mockService = MockUserService.with(scenario: .slowResponse, delay: 3.0)
        let viewModel = UserViewModel(userService: mockService)
        viewModel.isLoading = true
        return viewModel
    }

    /// 用于测试错误状态的 Mock ViewModel
    static var error: UserViewModel {
        let mockService = MockUserService.with(scenario: .networkError)
        let viewModel = UserViewModel(userService: mockService)
        viewModel.errorMessage = "网络连接失败"
        return viewModel
    }
}
#endif
```

### 3. 边界值测试场景

#### 场景清单
```swift
// MARK: - Test Scenarios

enum TestScenario {
    // 正常场景
    case normal              // 正常数据
    case success             // 成功响应

    // 空数据场景
    case empty               // 空数据
    case emptyList           // 空列表
    case noData              // 无数据

    // 边界值场景
    case minimal             // 最小值
    case maximal             // 最大值
    case zero                // 零值
    case negative            // 负值

    // 特殊字符场景
    case specialChars        // 特殊字符
    case emoji               // Emoji
    case html                // HTML 标签
    case script              // 脚本注入

    // 错误场景
    case networkError        // 网络错误
    case serverError         // 服务器错误
    case timeout             // 超时
    case unauthorized        // 未授权
    case forbidden           // 禁止访问
    case notFound            // 未找到
    case invalidData         // 无效数据
    case decodingError       // 解析错误

    // 性能场景
    case slowResponse        // 慢响应
    case largeData           // 大数据量
    case unstableNetwork     // 不稳定网络

    // 分页场景
    case firstPage           // 第一页
    case lastPage            // 最后一页
    case middlePage          // 中间页
    case noMoreData          // 没有更多数据
}
```

### 4. 使用示例

#### 示例1: 开发时使用 Mock
```swift
// 在开发时，使用 Mock Service
#if DEBUG
let userService: UserServiceProtocol = MockUserService.with(scenario: .success)
#else
let userService: UserServiceProtocol = UserService()
#endif

let viewModel = UserViewModel(userService: userService)
```

#### 示例2: 测试不同场景
```swift
// 测试成功场景
let successService = MockUserService.with(scenario: .success)
let successViewModel = UserViewModel(userService: successService)

// 测试空数据场景
let emptyService = MockUserService.with(scenario: .empty)
let emptyViewModel = UserViewModel(userService: emptyService)

// 测试网络错误场景
let errorService = MockUserService.with(scenario: .networkError)
let errorViewModel = UserViewModel(userService: errorService)

// 测试慢响应场景
let slowService = MockUserService.with(scenario: .slowResponse, delay: 3.0)
let slowViewModel = UserViewModel(userService: slowService)
```

#### 示例3: SwiftUI Preview
```swift
struct UserProfileView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            // 正常状态
            UserProfileView(viewModel: .preview)
                .previewDisplayName("Normal")

            // 加载状态
            UserProfileView(viewModel: .loading)
                .previewDisplayName("Loading")

            // 错误状态
            UserProfileView(viewModel: .error)
                .previewDisplayName("Error")
        }
    }
}
```

#### 示例4: 单元测试
```swift
class UserViewModelTests: XCTestCase {

    func testLoadUserSuccess() {
        // Given
        let mockService = MockUserService.with(scenario: .success, delay: 0)
        let viewModel = UserViewModel(userService: mockService)
        let expectation = self.expectation(description: "Load user")

        // When
        viewModel.loadUser(userId: "test_id")

        // Then
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            XCTAssertNotNil(viewModel.user)
            XCTAssertNil(viewModel.errorMessage)
            XCTAssertFalse(viewModel.isLoading)
            expectation.fulfill()
        }

        waitForExpectations(timeout: 1.0)
    }

    func testLoadUserNetworkError() {
        // Given
        let mockService = MockUserService.with(scenario: .networkError, delay: 0)
        let viewModel = UserViewModel(userService: mockService)
        let expectation = self.expectation(description: "Network error")

        // When
        viewModel.loadUser(userId: "test_id")

        // Then
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            XCTAssertNil(viewModel.user)
            XCTAssertNotNil(viewModel.errorMessage)
            XCTAssertFalse(viewModel.isLoading)
            expectation.fulfill()
        }

        waitForExpectations(timeout: 1.0)
    }
}
```

## 使用场景

### 场景1: 后端接口未就绪
```
用户: 后端接口还没好，帮我生成用户信息的 Mock Service

助手:
1. 根据接口文档生成数据模型
2. 生成 Mock Service
3. 生成各种测试场景的 Mock 数据
4. 提供使用示例
```

### 场景2: 测试边界情况
```
用户: 生成视频列表的边界值测试数据

助手:
1. 生成空列表
2. 生成单条数据
3. 生成大量数据
4. 生成异常数据
```

### 场景3: UI 状态测试
```
用户: 生成加载、成功、失败三种状态的 Mock

助手:
1. 生成加载状态 Mock
2. 生成成功状态 Mock
3. 生成失败状态 Mock
4. 提供 SwiftUI Preview 示例
```

## 注意事项

### 1. Mock 数据真实性
- Mock 数据应该尽量接近真实数据
- 包含各种边界情况
- 考虑实际业务场景

### 2. 性能考虑
- Mock 响应延迟应该接近真实网络延迟
- 可以模拟不稳定网络
- 测试大数据量场景

### 3. 维护性
- Mock 数据集中管理
- 使用工厂模式生成
- 及时更新 Mock 数据

### 4. 测试覆盖
- 覆盖所有边界情况
- 测试错误处理
- 测试异步场景

## 相关文档

- `CLAUDE.md` - 项目编码规范
- `moya-service-generator.md` - Moya Service 生成器
- `unit-test-generator.md` - 单元测试生成器
