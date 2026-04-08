# JIT Viewer 从 CDN 改为 npm 包引入 - 产品需求文档

## Overview
- **Summary**: 将 OfficeView.vue 组件中使用的 JIT Viewer SDK 从 CDN 动态加载方式改为通过 npm 包安装和导入的方式。
- **Purpose**: 提高项目的可维护性和稳定性，避免 CDN 依赖带来的潜在问题，如网络不稳定、版本控制困难等。
- **Target Users**: 前端开发人员和项目维护者。

## Goals
- 将 JIT Viewer SDK 从 CDN 引入改为 npm 包引入
- 确保文档预览功能正常工作
- 保持代码的可维护性和可读性

## Non-Goals (Out of Scope)
- 不修改文档预览的功能逻辑
- 不更改现有的 UI 设计
- 不影响其他组件的功能

## Background & Context
- 当前项目使用 Vue 3 + Composition API
- 目前通过 CDN 动态加载 JIT Viewer SDK
- 需要提高项目的稳定性和可维护性

## Functional Requirements
- **FR-1**: 安装 @jitoffice/jit-viewer-sdk npm 包
- **FR-2**: 修改 OfficeView.vue 组件，使用 import 方式引入 JIT Viewer
- **FR-3**: 移除动态加载 SDK 的逻辑
- **FR-4**: 确保文档预览功能正常工作

## Non-Functional Requirements
- **NFR-1**: 代码质量符合 Vue 3 标准风格
- **NFR-2**: 保持功能与之前一致
- **NFR-3**: 构建过程正常通过

## Constraints
- **Technical**: Vue 3 + Composition API
- **Dependencies**: @jitoffice/jit-viewer-sdk npm 包

## Assumptions
- @jitoffice/jit-viewer-sdk 包存在且可用
- 包的 API 与 CDN 版本一致

## Acceptance Criteria

### AC-1: npm 包安装成功
- **Given**: 项目环境正常
- **When**: 执行 npm install @jitoffice/jit-viewer-sdk 命令
- **Then**: 包安装成功，无错误
- **Verification**: `programmatic`

### AC-2: 组件代码修改完成
- **Given**: 包安装成功
- **When**: 修改 OfficeView.vue 组件代码
- **Then**: 代码使用 import 方式引入 JIT Viewer，移除动态加载逻辑
- **Verification**: `human-judgment`

### AC-3: 文档预览功能正常
- **Given**: 代码修改完成
- **When**: 运行项目并选择 Office 文档
- **Then**: 文档能够正常预览
- **Verification**: `human-judgment`

### AC-4: 构建过程正常
- **Given**: 代码修改完成
- **When**: 执行构建命令
- **Then**: 构建成功，无错误
- **Verification**: `programmatic`

## Open Questions
- [ ] 确认 @jitoffice/jit-viewer-sdk 包的具体版本
