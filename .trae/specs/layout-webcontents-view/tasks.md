# Layout 菜单点击创建/切换 WebContentsView - 实现计划

## [x] Task 1: 添加 findTabByPath 方法
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 在 tabManager.js 中添加 findTabByPath 函数
  - 遍历 views Map 根据 path 查找已存在的页签
  - 返回对应的 tabId 或 null
- **Acceptance Criteria**:
  - 能够根据 path 正确查找已存在的页签
  - 查找失败时返回 null

## [x] Task 2: 修改 createTab 方法添加页签存在性检查
- **Priority**: P0
- **Depends On**: Task 1
- **Description**:
  - 修改 createTab 方法，在创建前先调用 findTabByPath 检查
  - 如果已存在对应 path 的页签，调用 switchTab 切换
  - 如果不存在，才创建新页签
- **Acceptance Criteria**:
  - 点击已存在的页签时直接切换，不创建新页签
  - 点击不存在的页签时创建新页签

## [x] Task 3: 修改 switchTab 方法支持 path 参数
- **Priority**: P1
- **Depends On**: Task 1
- **Description**:
  - 修改 switchTab 方法，支持传入 tabId 或 path
  - 如果传入的是 path，先调用 findTabByPath 查找 tabId
  - 然后执行切换逻辑
- **Acceptance Criteria**:
  - 传入 tabId 时正常工作
  - 传入 path 时能正确查找并切换

## Task Dependencies
- Task 2 依赖 Task 1
- Task 3 依赖 Task 1
