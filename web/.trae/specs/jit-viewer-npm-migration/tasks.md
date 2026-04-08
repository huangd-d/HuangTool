# JIT Viewer 从 CDN 改为 npm 包引入 - 实现计划

## [ ] Task 1: 安装 @jitoffice/jit-viewer-sdk npm 包
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 在项目根目录执行 npm install 命令安装 @jitoffice/jit-viewer-sdk 包
  - 确认包安装成功
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `programmatic` TR-1.1: 执行 npm install @jitoffice/jit-viewer-sdk 命令无错误
  - `programmatic` TR-1.2: 查看 package.json 文件确认包已添加到依赖中
- **Notes**: 安装时可指定具体版本，如 @latest 或特定版本号

## [ ] Task 2: 修改 OfficeView.vue 组件，使用 import 方式引入 JIT Viewer
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 在 OfficeView.vue 文件顶部添加 import 语句引入 JIT Viewer
  - 移除动态加载 SDK 的 loadJitViewerSDK 函数
  - 修改 loadJitViewer 函数，使用导入的 JitViewer 构造函数
  - 移除对 window.JitViewer 的引用
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `human-judgment` TR-2.1: 代码使用 import 方式引入 JIT Viewer
  - `human-judgment` TR-2.2: 移除了动态加载 SDK 的逻辑
  - `human-judgment` TR-2.3: 代码符合 Vue 3 标准风格
- **Notes**: 需要注意包的导出方式，确保正确导入 JitViewer 构造函数

## [ ] Task 3: 测试文档预览功能
- **Priority**: P1
- **Depends On**: Task 2
- **Description**: 
  - 运行开发服务器
  - 选择 Office 文档进行预览
  - 验证文档能够正常加载和显示
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `human-judgment` TR-3.1: 文档能够正常预览
  - `human-judgment` TR-3.2: 预览功能与之前一致
- **Notes**: 测试不同类型的 Office 文档（docx、xlsx、pptx）

## [ ] Task 4: 执行构建命令验证
- **Priority**: P1
- **Depends On**: Task 2
- **Description**: 
  - 执行 npm run build 命令
  - 验证构建过程成功完成，无错误
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `programmatic` TR-4.1: 执行 npm run build 命令无错误
  - `programmatic` TR-4.2: 构建产物生成成功
- **Notes**: 构建过程应包括代码压缩和打包
