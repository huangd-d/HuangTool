# Layout 菜单点击创建/切换 WebContentsView - 产品需求文档

## Overview
- **Summary**: 在 Layout.vue 中点击左侧菜单时，判断是否有已存在的对应页签，如果有就切换，如果没有就创建。修改 switchTab 方法以适应新的需求。
- **Purpose**: 实现菜单点击时的智能页签管理，避免重复创建相同内容的页签。
- **Target Users**: 开发人员和测试人员。

## Why
当前每次点击菜单都会创建新的 WebContentsView，导致重复的页签。用户希望点击菜单时先检查是否已存在对应页签，如果存在则切换到该页签，如果不存在才创建新页签。

## What Changes
- 修改 createTab 方法，添加检查逻辑：先判断是否存在对应 path 的页签
- 如果存在对应页签，调用 switchTab 切换到该页签
- 如果不存在对应页签，才创建新页签
- 修改 switchTab 方法，支持使用 path 查找页签并切换

## Impact
- Affected specs: `layout-webcontents-view`（需要修改）
- Affected code:
  - `tabManager.js` - 修改 createTab 和 switchTab 方法
  - `Layout.vue` - 可能需要调整调用方式

## ADDED Requirements

### Requirement: 页签存在性检查
系统 SHALL 提供在创建页签前检查是否已存在对应页签的能力。

#### Scenario: 菜单点击已有页签
- **WHEN** 用户点击左侧菜单图标，对应页签已存在
- **THEN** 系统切换到该页签，不创建新页签

#### Scenario: 菜单点击无对应页签
- **WHEN** 用户点击左侧菜单图标，对应页签不存在
- **THEN** 系统创建新页签并切换到该页签

### Requirement: 根据 path 查找页签
系统 SHALL 提供根据 path 查找已存在页签的能力。

#### Scenario: 查找已存在页签
- **WHEN** 调用 createTab 时
- **THEN** 系统先遍历 views Map，根据 path 查找已存在的页签
- **AND** 如果找到，调用 switchTab 切换到该页签
- **AND** 如果未找到，创建新页签

## MODIFIED Requirements

### Requirement: createTab 方法增强
**Reason**: 需要添加页签存在性检查逻辑
**Details**:
- 在创建新页签前，先检查是否已存在对应 path 的页签
- 如果已存在，调用 switchTab(tabId) 切换
- 如果不存在，才创建新页签

### Requirement: switchTab 方法增强
**Reason**: 需要支持使用 tabId 或 path 查找并切换页签
**Details**:
- 支持传入 tabId 切换到指定页签
- 支持传入 path 查找对应页签并切换

## Implementation Details

### tabManager.js 修改
```javascript
// 根据 path 查找已存在的页签
function findTabByPath(tabPath) {
    for (const [id, tab] of views.entries()) {
        if (tab.path === tabPath) {
            return id;
        }
    }
    return null;
}

// 创建或切换页签
export function createTab(title, tabPath, bounds) {
    // 先查找是否已存在对应 path 的页签
    const existingTabId = findTabByPath(tabPath);
    
    if (existingTabId) {
        // 已存在，切换到该页签
        switchTab(existingTabId);
        return existingTabId;
    }
    
    // 不存在，创建新页签
    const tabId = Date.now().toString();
    const mainWindow = getMainWindow();
    
    // ... 创建 WebContentsView 的逻辑
    
    views.set(tabId, { id: tabId, title, path: tabPath, view });
    switchTab(tabId);
    
    return tabId;
}
```
