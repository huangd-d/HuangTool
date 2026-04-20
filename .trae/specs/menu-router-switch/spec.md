# 菜单路由切换功能 - 产品需求文档

## Overview
- **Summary**: 去除浏览器多页签（webcontView）功能，点击左侧菜单直接切换前端路由，实现简单的单页面应用导航。
- **Purpose**: 简化应用架构，移除复杂的 Electron BrowserView 标签管理，只使用 Vue Router 进行前端路由切换。
- **Target Users**: 开发人员和测试人员，使用该应用进行 API 测试和管理。

## Why
当前应用使用 Electron 的 BrowserView 标签窗口管理功能来实现类似浏览器标签页的效果，但这增加了系统复杂性和维护成本。用户需要简化导航架构，直接使用 Vue Router 进行前端路由切换，去除 BrowserView 标签管理功能。

## What Changes
- 去除 Electron BrowserView 多页签管理功能
- 点击左侧菜单直接使用 `router.push()` 切换前端路由
- 移除 Electron 标签窗口切换能力（`electronAPI.createTab`）
- 左侧菜单只显示图标和悬浮提示，点击后路由跳转，图标保持选中状态

## Impact
- Affected specs: `menu-tab-functionality`（废弃）
- Affected code:
  - `App.vue` - 移除 Electron 标签切换调用，改为 router.push
  - `electron/src/window/tabManager.js` - 可能需要禁用或移除 webcontView 相关逻辑
  - 所有涉及 `electronAPI.createTab` 的调用

## ADDED Requirements

### Requirement: 前端路由切换
系统 SHALL 提供通过左侧菜单点击直接切换 Vue Router 路由的能力。

#### Scenario: 菜单点击路由切换
- **WHEN** 用户点击左侧菜单图标
- **THEN** 系统使用 `router.push(menu.path)` 跳转到对应路由
- **AND** 菜单图标保持选中状态

### Requirement: 菜单选中状态
系统 SHALL 提供菜单图标选中状态管理，当前路由对应的菜单图标应保持高亮。

#### Scenario: 路由变化更新选中状态
- **WHEN** 路由发生变化
- **THEN** 系统根据当前路由更新 `activeMenu` 状态
- **AND** 对应的菜单图标显示选中样式

## MODIFIED Requirements

### Requirement: 菜单配置
左侧菜单 SHALL 包含以下四个菜单项：
1. 首页 - 路由路径 `/`
2. API管理 - 路由路径 `/api`
3. 技术文档访问 - 路由路径 `/docs`
4. 办公文件预览 - 路由路径 `/office`

#### Scenario: 菜单配置
- **WHEN** 应用启动
- **THEN** 左侧菜单显示上述四个菜单项
- **AND** 每个菜单项显示相应图标
- **AND** 鼠标悬停显示菜单标题

## REMOVED Requirements

### Requirement: Electron 标签窗口切换
**Reason**: 去除浏览器多页签功能，改用纯前端路由切换
**Migration**: 使用 `router.push()` 替代 `electronAPI.createTab()`

### Requirement: 标签页关闭功能
**Reason**: 不再使用 BrowserView 标签页，改为单页面应用路由切换
**Migration**: 无需迁移，直接移除

### Requirement: 标签页新建功能
**Reason**: 不再使用 BrowserView 标签页，改为单页面应用路由切换
**Migration**: 无需迁移，直接移除

### Requirement: 标签页状态管理
**Reason**: 不再需要管理 BrowserView 标签页状态
**Migration**: 使用 Vue Router 的内置状态管理
