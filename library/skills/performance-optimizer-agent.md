---
id: performance-optimizer-agent
type: skill
name: Performance Optimizer Agent
description: ""
tags:
  - claude
targets:
  - claude
scope:
  - global
enabled: true
version: 1.0.0
sourcePath: /Users/apple/.claude/skills/performance-optimizer.md
importedAt: "2026-04-17T10:11:44.669Z"
createdAt: "2026-04-17T10:11:44.669Z"
updatedAt: "2026-04-17T10:11:44.669Z"
---

# Performance Optimizer Agent

性能优化代理，全面分析和优化 iOS 应用性能，包括启动时间、内存使用、网络请求、UI 渲染等。

## 使用方法

触发关键词：
- "性能优化"
- "优化性能"
- "性能分析"
- "启动时间优化"
- "内存优化"
- "卡顿优化"

## 功能说明

### 1. 优化维度

#### 1.1 启动时间优化（20分）
```
检查项：
✅ main() 之前的启动时间
✅ 动态库加载时间
✅ +load 方法执行时间
✅ 首屏渲染时间
✅ 懒加载实现
```

#### 1.2 内存优化（20分）
```
检查项：
✅ 内存泄漏
✅ 循环引用
✅ 大对象缓存
✅ 图片内存占用
✅ 内存峰值
```

#### 1.3 网络优化（15分）
```
检查项：
✅ 请求并发数
✅ 请求缓存策略
✅ 数据压缩
✅ 图片加载优化
✅ DNS 优化
```

#### 1.4 UI 渲染优化（15分）
```
检查项：
✅ 离屏渲染
✅ 图层混合
✅ 视图层级
✅ AutoLayout 性能
✅ 卡顿检测
```

#### 1.5 电池优化（10分）
```
检查项：
✅ CPU 使用率
✅ 后台任务
✅ 定位服务
✅ 网络请求频率
✅ 动画优化
```

#### 1.6 存储优化（10分）
```
检查项：
✅ 数据库查询
✅ 文件 I/O
✅ 缓存策略
✅ 磁盘空间
```

#### 1.7 线程优化（10分）
```
检查项：
✅ 主线程阻塞
✅ 线程数量
✅ GCD 使用
✅ 死锁风险
```

### 2. 性能问题检测

#### 问题1: 启动时间过长

**检测方法**:
```swift
// 在 AppDelegate 中添加启动时间监控
class AppDelegate: UIResponder, UIApplicationDelegate {
    static var launchStartTime: CFAbsoluteTime = 0

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        let launchEndTime = CFAbsoluteTimeGetCurrent()
        let launchTime = launchEndTime - AppDelegate.launchStartTime
        print("🚀 启动时间: \(launchTime * 1000)ms")

        return true
    }
}

// 在 main.swift 中记录启动开始时间
AppDelegate.launchStartTime = CFAbsoluteTimeGetCurrent()
UIApplicationMain(
    CommandLine.argc,
    CommandLine.unsafeArgv,
    nil,
    NSStringFromClass(AppDelegate.self)
)
```

**常见问题**:
```swift
// ❌ 问题1: 在 +load 中执行耗时操作
@objc class MyClass: NSObject {
    override class func load() {
        // ❌ 耗时操作
        setupDatabase()
        loadConfiguration()
    }
}

// ✅ 优化: 移到 +initialize 或懒加载
@objc class MyClass: NSObject {
    override class func initialize() {
        if self == MyClass.self {
            // 首次使用时才初始化
            setupDatabase()
        }
    }
}

// ❌ 问题2: 在 didFinishLaunching 中执行耗时操作
func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    // ❌ 阻塞启动
    loadUserData()
    setupThirdPartySDKs()
    preloadImages()

    return true
}

// ✅ 优化: 异步执行或延迟加载
func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    // ✅ 只做必要的初始化
    setupWindow()

    // ✅ 异步加载
    DispatchQueue.global().async {
        self.loadUserData()
        self.setupThirdPartySDKs()
    }

    // ✅ 延迟加载
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
        self.preloadImages()
    }

    return true
}
```

**优化方案**:
```swift
// 1. 减少动态库数量
// 合并多个动态库为一个

// 2. 使用懒加载
class AppServices {
    static let shared = AppServices()

    // ✅ 懒加载
    lazy var userService: UserService = {
        return UserService()
    }()

    lazy var videoService: VideoService = {
        return VideoService()
    }()
}

// 3. 优化首屏渲染
class HomeViewController: UIViewController {
    override func viewDidLoad() {
        super.viewDidLoad()

        // ✅ 先显示骨架屏
        showSkeletonView()

        // ✅ 异步加载数据
        loadData()
    }

    private func loadData() {
        DispatchQueue.global().async {
            let data = self.fetchData()

            DispatchQueue.main.async {
                self.hideSkeletonView()
                self.updateUI(with: data)
            }
        }
    }
}
```

#### 问题2: 内存占用过高

**检测方法**:
```swift
// 内存监控
class MemoryMonitor {
    static func currentMemoryUsage() -> UInt64 {
        var info = mach_task_basic_info()
        var count = mach_msg_type_number_t(MemoryLayout<mach_task_basic_info>.size)/4

        let kerr: kern_return_t = withUnsafeMutablePointer(to: &info) {
            $0.withMemoryRebound(to: integer_t.self, capacity: 1) {
                task_info(mach_task_self_,
                         task_flavor_t(MACH_TASK_BASIC_INFO),
                         $0,
                         &count)
            }
        }

        if kerr == KERN_SUCCESS {
            return info.resident_size
        }
        return 0
    }

    static func printMemoryUsage() {
        let memory = currentMemoryUsage()
        let memoryMB = Double(memory) / 1024.0 / 1024.0
        print("💾 当前内存: \(String(format: "%.2f", memoryMB)) MB")
    }
}
```

**常见问题**:
```swift
// ❌ 问题1: 图片内存占用过大
class ImageViewController: UIViewController {
    @IBOutlet weak var imageView: UIImageView!

    func loadImage() {
        // ❌ 直接加载大图
        imageView.image = UIImage(named: "large_image.jpg")
    }
}

// ✅ 优化: 压缩图片
class ImageViewController: UIViewController {
    @IBOutlet weak var imageView: UIImageView!

    func loadImage() {
        // ✅ 按需加载合适尺寸的图片
        if let image = UIImage(named: "large_image.jpg") {
            let targetSize = imageView.bounds.size
            imageView.image = image.resized(to: targetSize)
        }
    }
}

extension UIImage {
    func resized(to targetSize: CGSize) -> UIImage? {
        let renderer = UIGraphicsImageRenderer(size: targetSize)
        return renderer.image { _ in
            self.draw(in: CGRect(origin: .zero, size: targetSize))
        }
    }
}

// ❌ 问题2: 缓存过多数据
class DataCache {
    // ❌ 无限制缓存
    private var cache: [String: Data] = [:]

    func set(_ data: Data, forKey key: String) {
        cache[key] = data
    }
}

// ✅ 优化: 使用 NSCache，自动管理内存
class DataCache {
    // ✅ 使用 NSCache
    private let cache = NSCache<NSString, NSData>()

    init() {
        // 设置内存限制
        cache.totalCostLimit = 50 * 1024 * 1024  // 50MB
        cache.countLimit = 100  // 最多 100 个对象
    }

    func set(_ data: Data, forKey key: String) {
        cache.setObject(data as NSData, forKey: key as NSString, cost: data.count)
    }

    func get(forKey key: String) -> Data? {
        return cache.object(forKey: key as NSString) as Data?
    }
}
```

#### 问题3: UI 卡顿

**检测方法**:
```swift
// FPS 监控
class FPSMonitor {
    private var displayLink: CADisplayLink?
    private var lastTimestamp: TimeInterval = 0
    private var frameCount: Int = 0

    func start() {
        displayLink = CADisplayLink(target: self, selector: #selector(tick))
        displayLink?.add(to: .main, forMode: .common)
    }

    @objc private func tick(displayLink: CADisplayLink) {
        if lastTimestamp == 0 {
            lastTimestamp = displayLink.timestamp
            return
        }

        frameCount += 1
        let delta = displayLink.timestamp - lastTimestamp

        if delta >= 1.0 {
            let fps = Double(frameCount) / delta
            print("📊 FPS: \(Int(fps))")

            if fps < 50 {
                print("⚠️ 检测到卡顿")
            }

            frameCount = 0
            lastTimestamp = displayLink.timestamp
        }
    }
}
```

**常见问题**:
```swift
// ❌ 问题1: 主线程执行耗时操作
class VideoListViewController: UIViewController {
    func loadVideos() {
        // ❌ 主线程解析 JSON
        let data = try! Data(contentsOf: url)
        let videos = try! JSONDecoder().decode([Video].self, from: data)
        tableView.reloadData()
    }
}

// ✅ 优化: 异步处理
class VideoListViewController: UIViewController {
    func loadVideos() {
        DispatchQueue.global().async {
            let data = try! Data(contentsOf: self.url)
            let videos = try! JSONDecoder().decode([Video].self, from: data)

            DispatchQueue.main.async {
                self.videos = videos
                self.tableView.reloadData()
            }
        }
    }
}

// ❌ 问题2: Cell 中执行复杂计算
func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
    let cell = tableView.dequeueReusableCell(withIdentifier: "Cell", for: indexPath)

    // ❌ 每次都计算
    let attributedText = generateAttributedText(video.title)
    cell.titleLabel.attributedText = attributedText

    return cell
}

// ✅ 优化: 预计算或缓存
class Video {
    let title: String

    // ✅ 懒加载，只计算一次
    lazy var attributedTitle: NSAttributedString = {
        return generateAttributedText(title)
    }()
}

func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
    let cell = tableView.dequeueReusableCell(withIdentifier: "Cell", for: indexPath)
    cell.titleLabel.attributedText = video.attributedTitle
    return cell
}

// ❌ 问题3: 离屏渲染
class VideoCell: UITableViewCell {
    override func layoutSubviews() {
        super.layoutSubviews()

        // ❌ 导致离屏渲染
        thumbnailView.layer.cornerRadius = 8
        thumbnailView.layer.masksToBounds = true
    }
}

// ✅ 优化: 使用贝塞尔路径或直接切圆角图片
class VideoCell: UITableViewCell {
    override func layoutSubviews() {
        super.layoutSubviews()

        // ✅ 方案1: 光栅化
        thumbnailView.layer.cornerRadius = 8
        thumbnailView.layer.masksToBounds = true
        thumbnailView.layer.shouldRasterize = true
        thumbnailView.layer.rasterizationScale = UIScreen.main.scale

        // ✅ 方案2: 直接使用圆角图片
        // thumbnailView.image = image.withRoundedCorners(radius: 8)
    }
}
```

#### 问题4: 网络请求慢

**优化方案**:
```swift
// 1. 请求合并
class VideoService {
    private var pendingRequests: [String: [((Result<Video, Error>) -> Void)]] = [:]

    func getVideo(id: String, completion: @escaping (Result<Video, Error>) -> Void) {
        // ✅ 合并相同的请求
        if pendingRequests[id] != nil {
            pendingRequests[id]?.append(completion)
            return
        }

        pendingRequests[id] = [completion]

        // 发起请求
        provider.request(.getVideo(id: id)) { result in
            let callbacks = self.pendingRequests[id] ?? []
            self.pendingRequests[id] = nil

            // 通知所有等待的回调
            callbacks.forEach { $0(result) }
        }
    }
}

// 2. 请求缓存
class NetworkCache {
    private let cache = NSCache<NSString, CachedResponse>()

    func cachedResponse(for request: URLRequest) -> CachedResponse? {
        let key = request.url?.absoluteString ?? ""
        return cache.object(forKey: key as NSString)
    }

    func cache(_ response: CachedResponse, for request: URLRequest) {
        let key = request.url?.absoluteString ?? ""
        cache.setObject(response, forKey: key as NSString)
    }
}

// 3. 图片加载优化
class ImageLoader {
    static let shared = ImageLoader()

    private let cache = NSCache<NSString, UIImage>()
    private let downloadQueue = DispatchQueue(label: "com.app.imageloader", attributes: .concurrent)

    func loadImage(url: URL, completion: @escaping (UIImage?) -> Void) {
        let key = url.absoluteString as NSString

        // ✅ 先检查缓存
        if let cachedImage = cache.object(forKey: key) {
            completion(cachedImage)
            return
        }

        // ✅ 异步下载
        downloadQueue.async {
            guard let data = try? Data(contentsOf: url),
                  let image = UIImage(data: data) else {
                completion(nil)
                return
            }

            // ✅ 缓存图片
            self.cache.setObject(image, forKey: key)

            DispatchQueue.main.async {
                completion(image)
            }
        }
    }
}

// 4. 预加载
class VideoListViewController: UIViewController {
    func tableView(_ tableView: UITableView, willDisplay cell: UITableViewCell, forRowAt indexPath: IndexPath) {
        // ✅ 预加载下一页数据
        if indexPath.row == videos.count - 5 {
            loadNextPage()
        }

        // ✅ 预加载下面几个 Cell 的图片
        let preloadRange = (indexPath.row + 1)...(indexPath.row + 3)
        for index in preloadRange where index < videos.count {
            let video = videos[index]
            ImageLoader.shared.loadImage(url: video.thumbnailURL) { _ in }
        }
    }
}
```

### 3. 性能优化报告模板

```markdown
# 性能优化报告

## 基本信息
- **优化模块**: Home/Video/Profile
- **优化时间**: 2026-02-28
- **测试设备**: iPhone 12 Pro (iOS 15.0)
- **优化人**: Performance Optimizer Agent

## 性能评分

### 总体评分: 72/100

| 维度 | 优化前 | 优化后 | 提升 | 说明 |
|------|--------|--------|------|------|
| 启动时间 | 3.2s | 1.8s | 43.8% | 优化动态库加载 |
| 内存占用 | 180MB | 120MB | 33.3% | 优化图片缓存 |
| 网络请求 | 2.5s | 1.2s | 52.0% | 添加请求缓存 |
| UI 渲染 | 45 FPS | 58 FPS | 28.9% | 减少离屏渲染 |
| 电池消耗 | 高 | 中 | - | 优化后台任务 |

## 问题清单

### 🔴 严重问题（已修复）

#### 1. 启动时间过长（3.2秒）
**位置**: `AppDelegate.swift:didFinishLaunching`
**问题**: 在主线程执行大量初始化操作
**影响**:
- 用户等待时间长
- 启动体验差

**优化前**:
```swift
func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    setupDatabase()           // 500ms
    setupThirdPartySDKs()     // 800ms
    loadUserData()            // 600ms
    preloadImages()           // 900ms

    return true
}
```

**优化后**:
```swift
func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    // 只做必要的初始化
    setupWindow()  // 100ms

    // 异步初始化
    DispatchQueue.global().async {
        self.setupDatabase()
        self.setupThirdPartySDKs()
        self.loadUserData()
    }

    // 延迟预加载
    DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
        self.preloadImages()
    }

    return true
}
```

**效果**: 启动时间从 3.2s 降低到 1.8s

---

#### 2. 内存占用过高（180MB）
**位置**: `ImageCache.swift`
**问题**: 无限制缓存图片
**影响**:
- 内存占用高
- 可能导致内存警告

**优化前**:
```swift
class ImageCache {
    private var cache: [String: UIImage] = [:]

    func set(_ image: UIImage, forKey key: String) {
        cache[key] = image  // 无限制缓存
    }
}
```

**优化后**:
```swift
class ImageCache {
    private let cache = NSCache<NSString, UIImage>()

    init() {
        cache.totalCostLimit = 50 * 1024 * 1024  // 50MB 限制
        cache.countLimit = 100
    }

    func set(_ image: UIImage, forKey key: String) {
        let cost = image.jpegData(compressionQuality: 1.0)?.count ?? 0
        cache.setObject(image, forKey: key as NSString, cost: cost)
    }
}
```

**效果**: 内存占用从 180MB 降低到 120MB

---

#### 3. UI 卡顿（45 FPS）
**位置**: `VideoListViewController.swift:cellForRowAt`
**问题**: Cell 中执行复杂计算
**影响**:
- 滚动卡顿
- 用户体验差

**优化前**:
```swift
func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
    let cell = tableView.dequeueReusableCell(withIdentifier: "Cell", for: indexPath)

    // ❌ 每次都计算
    let attributedText = generateAttributedText(video.title)
    cell.titleLabel.attributedText = attributedText

    // ❌ 实时下载图片
    downloadImage(url: video.thumbnailURL) { image in
        cell.imageView.image = image
    }

    return cell
}
```

**优化后**:
```swift
// 1. 预计算
class Video {
    lazy var attributedTitle: NSAttributedString = {
        return generateAttributedText(title)
    }()
}

// 2. 使用图片加载库
func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
    let cell = tableView.dequeueReusableCell(withIdentifier: "Cell", for: indexPath)

    // ✅ 使用预计算的结果
    cell.titleLabel.attributedText = video.attributedTitle

    // ✅ 使用缓存的图片加载
    cell.imageView.sd_setImage(with: video.thumbnailURL)

    return cell
}
```

**效果**: FPS 从 45 提升到 58

---

### 🟡 中等问题（已优化）

#### 4. 网络请求慢（2.5秒）
**优化方案**:
- 添加请求缓存
- 合并重复请求
- 使用 HTTP/2

**效果**: 请求时间从 2.5s 降低到 1.2s

#### 5. 电池消耗高
**优化方案**:
- 减少后台任务
- 优化定位服务
- 降低网络请求频率

**效果**: 电池消耗从"高"降低到"中"

---

## 优化建议

### 已完成优化
✅ 优化启动时间
✅ 优化内存占用
✅ 优化 UI 渲染
✅ 优化网络请求
✅ 优化电池消耗

### 后续优化建议
1. 进一步优化图片加载（使用 WebP 格式）
2. 优化数据库查询（添加索引）
3. 实现更智能的预加载策略
4. 添加性能监控系统

## 性能测试数据

### 启动时间测试
```
测试次数: 10 次
优化前平均: 3.2s
优化后平均: 1.8s
提升: 43.8%
```

### 内存占用测试
```
测试场景: 浏览 100 个视频
优化前峰值: 180MB
优化后峰值: 120MB
降低: 33.3%
```

### FPS 测试
```
测试场景: 快速滚动视频列表
优化前平均: 45 FPS
优化后平均: 58 FPS
提升: 28.9%
```

## 工具推荐

### 性能分析工具
- **Instruments** - Time Profiler, Allocations, Leaks
- **MetricKit** - 收集性能指标
- **Firebase Performance** - 线上性能监控

### 使用方法
```bash
# 使用 Instruments 分析
# 1. Product -> Profile (Cmd+I)
# 2. 选择 Time Profiler 或 Allocations
# 3. 录制并分析

# 集成 MetricKit
import MetricKit

class PerformanceMonitor: NSObject, MXMetricManagerSubscriber {
    override init() {
        super.init()
        MXMetricManager.shared.add(self)
    }

    func didReceive(_ payloads: [MXMetricPayload]) {
        for payload in payloads {
            // 分析性能数据
            print("CPU: \(payload.cpuMetrics)")
            print("Memory: \(payload.memoryMetrics)")
        }
    }
}
```

## 总结

### 优化成果
✅ 启动时间提升 43.8%
✅ 内存占用降低 33.3%
✅ UI 流畅度提升 28.9%
✅ 网络请求速度提升 52.0%
✅ 电池消耗降低

### 关键优化点
1. 异步初始化
2. 使用 NSCache
3. 预计算和缓存
4. 减少离屏渲染
5. 优化网络请求

### 持续优化
- 定期性能测试
- 监控线上性能
- 及时修复性能问题
```

## 使用示例

### 示例1: 优化启动时间
```
用户: 优化应用启动时间

助手:
1. 分析启动流程
2. 识别耗时操作
3. 提供优化方案
4. 测试优化效果
5. 生成优化报告
```

### 示例2: 优化内存占用
```
用户: 分析并优化内存占用

助手:
1. 检测内存泄漏
2. 分析内存峰值
3. 优化缓存策略
4. 优化图片加载
5. 生成优化报告
```

### 示例3: 优化 UI 卡顿
```
用户: 解决视频列表滚动卡顿

助手:
1. 监控 FPS
2. 分析卡顿原因
3. 优化 Cell 渲染
4. 减少主线程操作
5. 测试优化效果
```

## 注意事项

### 1. 性能测试
- 使用真机测试
- 测试多种设备
- 测试不同网络环境
- 测试边界情况

### 2. 优化原则
- 先测量，后优化
- 优先优化瓶颈
- 避免过度优化
- 保持代码可读性

### 3. 持续监控
- 集成性能监控
- 定期性能测试
- 跟踪性能指标
- 及时修复问题

### 4. 权衡取舍
- 性能 vs 功能
- 性能 vs 可维护性
- 性能 vs 开发成本

## 相关文档

- `CLAUDE.md` - 项目规范
- `architecture-reviewer.md` - 架构审查
- `code-quality-auditor.md` - 代码质量审计
- `memory-leak-detector.md` - 内存泄漏检测
