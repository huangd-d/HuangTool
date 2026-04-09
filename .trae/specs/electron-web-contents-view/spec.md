# Electron BrowserView 替换为 WebContentsView - 产品需求文档

## Overview
- **Summary**: 将 Electron 应用中的已弃用 `BrowserView` 类替换为官方推荐的 `WebContentsView` 类，以确保应用在 Electron 30+ 版本中正常运行。
- **Purpose**: 解决 Electron 30+ 版本中 `BrowserView` 被标记为弃用的问题，确保应用的兼容性和未来可维护性。
- **Target Users**: 开发人员和最终用户，确保应用在最新 Electron 版本中正常运行。

## Goals
- 替换 `BrowserView` 为 `WebContentsView`
- 确保多页签功能正常工作
- 保持应用的性能和数据隔离效果
- 确保与前端应用的通信正常

## Non-Goals (Out of Scope)
- 更改应用的整体功能
- 修改前端应用的代码结构
- 优化应用的其他性能问题

## Background & Context
- Electron 30+ 版本中，`BrowserView` 类被标记为弃用
- 官方推荐使用 `WebContentsView` 作为替代方案
- 应用当前使用 `BrowserView` 实现多页签功能
- 需要确保替换后多页签功能正常工作

## Functional Requirements
- **FR-1**: 将 `BrowserView` 类替换为 `WebContentsView` 类
- **FR-2**: 更新添加和移除视图的方法
- **FR-3**: 更新视图的销毁方法
- **FR-4**: 确保多页签功能正常工作
- **FR-5**: 确保与前端应用的通信正常

## Non-Functional Requirements
- **NFR-1**: 保持应用的性能
- **NFR-2**: 保持数据隔离效果
- **NFR-3**: 确保代码的可维护性

## Constraints
- **Technical**: Electron 30+ 版本
- **Dependencies**: 前端应用需要正常运行

## Assumptions
- 前端应用已经正常运行
- Electron 应用的其他部分已经正常工作

## Acceptance Criteria

### AC-1: 成功替换 BrowserView 为 WebContentsView
- **Given**: Electron 应用使用 `BrowserView` 实现多页签功能
- **When**: 替换为 `WebContentsView` 后
- **Then**: 应用能够正常启动和运行
- **Verification**: `programmatic`

### AC-2: 多页签功能正常工作
- **Given**: 应用启动后
- **When**: 创建、切换和关闭页签时
- **Then**: 页签功能正常工作
- **Verification**: `human-judgment`

### AC-3: 与前端应用的通信正常
- **Given**: 应用启动后
- **When**: 从前端应用创建新页签时
- **Then**: 新页签能够正常创建和显示
- **Verification**: `human-judgment`

## Open Questions
- [ ] 无
