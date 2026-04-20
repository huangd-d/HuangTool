# 菜单标签功能 - 产品需求文档

## Overview
- **Summary**: 去除头部浏览器标签功能，将标签页管理功能集成到左侧菜单中，点击菜单实现类似浏览器页签的功能。
- **Purpose**: 简化界面布局，将标签管理功能与菜单集成，提升用户体验和界面整洁度。
- **Target Users**: 开发人员和测试人员，使用该应用进行 API 测试和管理。

## Goals
- 去除头部浏览器标签功能
- 点击左侧菜单实现类似浏览器页签的功能
- 保持标签页的基本功能（切换、关闭、新建）
- 确保菜单与标签页功能的无缝集成

## Non-Goals (Out of Scope)
- 不改变现有的 API 功能逻辑
- 不添加新的 API 测试功能
- 不修改后端数据结构
- 不涉及用户认证和权限管理

## Background & Context
- 当前界面存在头部浏览器标签和左侧菜单双重导航，界面显得冗余
- 希望通过将标签功能集成到左侧菜单，简化界面布局
- 保持标签页的基本功能，确保用户体验不受影响

## Functional Requirements
- **FR-1**: 去除头部浏览器标签功能
- **FR-2**: 点击左侧菜单实现标签页的创建和切换
- **FR-3**: 实现标签页的关闭功能
- **FR-4**: 实现标签页的新建功能
- **FR-5**: 保持标签页的状态管理（当前活跃标签、标签顺序等）

## Non-Functional Requirements
- **NFR-1**: 界面布局简洁，操作流畅
- **NFR-2**: 菜单与标签功能集成自然，用户体验良好
- **NFR-3**: 代码结构清晰，易于维护
- **NFR-4**: 与现有 Electron 窗口管理无缝集成

## Constraints
- **Technical**: 使用 Vue 3 + element-plus + Electron
- **Dependencies**: element-plus 组件库
- **Compatibility**: 兼容 Windows、macOS、Linux 平台

## Assumptions
- Electron 已经具备标签窗口管理能力
- 左侧菜单功能已经实现
- element-plus 已经正确安装和配置

## Acceptance Criteria

### AC-1: 头部浏览器标签功能去除
- **Given**: 应用启动
- **When**: 用户打开应用
- **Then**: 头部不再显示浏览器标签功能
- **Verification**: `human-judgment`

### AC-2: 菜单点击切换效果
- **Given**: 应用启动
- **When**: 用户点击左侧菜单
- **Then**: 系统切换到对应的标签页，效果类似浏览器页签切换
- **Verification**: `programmatic`

### AC-3: 标签页状态管理
- **Given**: 存在多个标签页
- **When**: 用户切换标签页
- **Then**: 系统正确更新当前活跃标签
- **Verification**: `programmatic`

## Open Questions
- [ ] 左侧菜单的具体标签管理界面需要确认
- [ ] 标签页的具体样式和布局需要确认
- [ ] 与 Electron 窗口管理的集成细节需要确认