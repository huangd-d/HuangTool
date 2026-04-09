# Electron BrowserView 多页签功能 - 实现计划

## [ ] 任务 1: 修改主进程，添加 BrowserView 管理功能
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 在 windowManager.js 中添加 BrowserView 管理功能
  - 创建一个数据结构来存储和管理所有的 BrowserView 实例
  - 实现页签的创建、切换、关闭等基本操作
- **Acceptance Criteria Addressed**: AC-1, AC-2
- **Test Requirements**:
  - `human-judgment` TR-1.1: BrowserView 多页签系统正常工作
  - `human-judgment` TR-1.2: 页签基本操作正常
- **Notes**: 使用 Map 来存储 BrowserView 实例，键为页签 ID

## [ ] 任务 2: 为每个 BrowserView 设置不同的 partition，实现数据隔离
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**:
  - 在创建 BrowserView 时，为每个实例设置不同的 partition
  - 确保各页签的数据环境相互隔离
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `human-judgment` TR-2.1: 各页签的数据环境相互隔离
- **Notes**: 使用唯一的 partition 名称，如 `tab-${tabId}`

## [ ] 任务 3: 修改前端应用，适配 BrowserView 多页签系统
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**:
  - 修改 App.vue 中的页签管理逻辑
  - 移除前端路由跳转实现，改为通过 IPC 与主进程通信
  - 实现页签的创建、切换、关闭等操作的 IPC 通信
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `human-judgment` TR-3.1: 用户体验与之前保持一致
- **Notes**: 使用 Electron 的 IPC 机制进行前后端通信

## [ ] 任务 4: 实现页签的拖拽重排功能
- **Priority**: P1
- **Depends On**: 任务 1, 任务 3
- **Description**:
  - 在前端实现页签的拖拽重排功能
  - 通过 IPC 通知主进程更新 BrowserView 的顺序
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `human-judgment` TR-4.1: 页签可以通过拖拽重排
- **Notes**: 使用 HTML5 的 drag and drop API 实现拖拽功能

## [ ] 任务 5: 测试和优化
- **Priority**: P2
- **Depends On**: 任务 1, 任务 2, 任务 3, 任务 4
- **Description**:
  - 测试 BrowserView 多页签功能的各项操作
  - 优化页签切换的性能
  - 确保内存管理正常，避免内存泄漏
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3, AC-4
- **Test Requirements**:
  - `human-judgment` TR-5.1: 页签切换流畅，无明显卡顿
  - `human-judgment` TR-5.2: 单个页签崩溃不影响其他页签
  - `human-judgment` TR-5.3: 内存使用合理，无明显泄漏
- **Notes**: 测试不同场景下的性能和稳定性