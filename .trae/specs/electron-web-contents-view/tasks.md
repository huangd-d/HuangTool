# Electron BrowserView 替换为 WebContentsView - 实现计划

## [x] Task 1: 检查 Electron 官方文档，了解 WebContentsView 的使用方法
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 检查 Electron 官方文档，了解 WebContentsView 的使用方法
  - 了解 WebContentsView 与 BrowserView 的区别和迁移注意事项
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `programmatic` TR-1.1: 确认 WebContentsView 的基本使用方法
  - `human-judgement` TR-1.2: 确认 WebContentsView 与 BrowserView 的主要区别
- **Notes**: 重点关注添加、移除和销毁视图的方法

## [x] Task 2: 更新 windowManager.js 文件，将 BrowserView 替换为 WebContentsView
- **Priority**: P0
- **Depends On**: Task 1
- **Description**:
  - 更新导入语句，将 BrowserView 替换为 WebContentsView
  - 更新创建视图的方法
  - 更新添加视图到窗口的方法
  - 更新移除视图的方法
  - 更新销毁视图的方法
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3
- **Test Requirements**:
  - `programmatic` TR-2.1: 应用能够正常启动
  - `human-judgement` TR-2.2: 代码结构清晰，注释完整
- **Notes**: 注意 WebContentsView 的使用方法与 BrowserView 的区别

## [x] Task 3: 更新前端开发服务器的 URL 端口
- **Priority**: P1
- **Depends On**: Task 2
- **Description**:
  - 检查前端开发服务器的运行端口
  - 更新 windowManager.js 文件中的 URL 端口
- **Acceptance Criteria Addressed**: AC-1, AC-3
- **Test Requirements**:
  - `programmatic` TR-3.1: 应用能够正常加载前端页面
  - `human-judgement` TR-3.2: 前端页面能够正常显示
- **Notes**: 前端开发服务器可能使用不同的端口，需要根据实际情况更新

## [x] Task 4: 修复 registerWindowEvents 函数中的 mainWindow 检查
- **Priority**: P1
- **Depends On**: Task 2
- **Description**:
  - 在 registerWindowEvents 函数中添加对 mainWindow 的存在性检查
  - 确保 resize 事件监听器只在 mainWindow 存在时添加
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `programmatic` TR-4.1: 应用能够正常启动，无错误
  - `human-judgement` TR-4.2: 代码结构清晰，错误处理完善
- **Notes**: 避免在 mainWindow 为 null 时调用其方法

## [ ] Task 5: 测试应用的多页签功能
- **Priority**: P0
- **Depends On**: Task 2, Task 3, Task 4
- **Description**:
  - 启动 Electron 应用
  - 测试页签的创建、切换和关闭功能
  - 测试从前端应用创建新页签的功能
- **Acceptance Criteria Addressed**: AC-2, AC-3
- **Test Requirements**:
  - `human-judgement` TR-5.1: 页签功能正常工作
  - `human-judgement` TR-5.2: 与前端应用的通信正常
- **Notes**: 重点测试多页签的基本操作和与前端的通信
