# 菜单路由切换功能 - 实现计划

## [x] Task 1: 修改 App.vue 菜单点击逻辑
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 修改 `handleMenuClick` 方法，移除 `electronAPI.createTab` 调用
  - 改用 `router.push(menu.path)` 实现前端路由切换
  - 保持菜单选中状态管理
- **Acceptance Criteria**:
  - 点击菜单图标使用 `router.push` 跳转路由
  - 菜单图标保持选中状态
  - 悬浮提示正常显示

## [x] Task 2: 更新菜单激活状态响应式
- **Priority**: P1
- **Depends On**: Task 1
- **Description**:
  - 使用 `watch` 监听路由变化
  - 根据当前路由更新 `activeMenu` 状态
  - 确保页面刷新后菜单激活状态正确
- **Acceptance Criteria**:
  - 路由变化时菜单选中状态正确更新
  - 刷新页面后菜单激活状态与路由匹配

## [x] Task 3: 清理 Electron 标签窗口相关代码
- **Priority**: P2
- **Depends On**: Task 1
- **Description**:
  - 检查 `tabManager.js` 中的 webcontView 相关逻辑
  - 确认是否需要禁用或注释相关代码
  - 确保不会影响应用正常运行
- **Acceptance Criteria**:
  - 应用启动正常
  - 无控制台错误
  - 左侧菜单路由切换功能正常

## Task Dependencies
- Task 2 依赖 Task 1 完成
- Task 3 可独立进行
