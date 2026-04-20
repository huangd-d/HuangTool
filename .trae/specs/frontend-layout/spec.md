# 前端界面调整 - 产品需求文档

## Overview
- **Summary**: 调整前端界面布局，使用 el-splitter 实现顶部固定区、左侧菜单区和右侧内容区的三区域布局，顶部栏包含窗口控制按钮，左侧菜单栏使用图标形式，右侧内容区根据选择的菜单显示不同内容。
- **Purpose**: 优化用户界面布局，提升用户体验，使界面更加现代化和易用。
- **Target Users**: 开发人员和测试人员，使用该应用进行 API 测试和管理。

## Goals
- 实现三区域布局：顶部固定区、左侧菜单区、右侧内容区
- 顶部栏包含窗口控制按钮（缩小、放大、关闭），使用 element-plus 图标
- 左侧菜单栏只显示图标，选中时高亮，点击时切换窗口
- API 界面左侧使用树结构展示项目-分类-接口层级
- 右侧内容区根据左侧选择显示具体调用信息

## Non-Goals (Out of Scope)
- 不改变现有的 API 功能逻辑
- 不添加新的 API 测试功能
- 不修改后端数据结构
- 不涉及用户认证和权限管理

## Background & Context
- 现有界面布局不够现代化，用户体验有待提升
- 希望通过使用 element-plus 组件库来优化界面
- 需要与 Electron 的窗口管理能力集成
- API 界面需要更清晰地展示项目-分类-接口的层级关系

## Functional Requirements
- **FR-1**: 实现三区域布局，使用 el-splitter 组件
- **FR-2**: 顶部栏包含窗口控制按钮（缩小、放大、关闭）
- **FR-3**: 左侧菜单栏只显示图标，选中时高亮
- **FR-4**: 左侧菜单点击时调用 Electron 标签窗口能力切换窗口
- **FR-5**: API 界面左侧使用树结构展示项目-分类-接口层级
- **FR-6**: 右侧内容区根据左侧选择显示具体调用信息

## Non-Functional Requirements
- **NFR-1**: 动画效果流畅，提升用户体验
- **NFR-2**: 代码结构清晰，易于维护
- **NFR-3**: 与现有 Electron 窗口管理无缝集成

## Constraints
- **Technical**: 使用 Vue 3 + element-plus + Electron
- **Dependencies**: element-plus 组件库
- **Compatibility**: 兼容 Windows、macOS、Linux 平台

## Assumptions
- Electron 已经具备标签窗口管理能力
- 项目-分类-接口数据结构已经存在
- element-plus 已经正确安装和配置

## Acceptance Criteria

### AC-1: 三区域布局实现
- **Given**: 应用启动
- **When**: 用户打开应用
- **Then**: 界面显示为顶部固定区、左侧菜单区、右侧内容区的三区域布局
- **Verification**: `human-judgment`

### AC-2: 顶部栏窗口控制
- **Given**: 应用启动
- **When**: 用户点击顶部栏的缩小、放大、关闭按钮
- **Then**: 窗口执行相应的缩小、放大、关闭操作
- **Verification**: `programmatic`

### AC-3: 左侧菜单图标显示
- **Given**: 应用启动
- **When**: 用户查看左侧菜单栏
- **Then**: 菜单栏只显示图标，图标大小适中
- **Verification**: `human-judgment`

### AC-4: 左侧菜单选中状态
- **Given**: 应用启动
- **When**: 用户点击左侧菜单图标
- **Then**: 被点击的图标高亮显示
- **Verification**: `human-judgment`

### AC-5: 菜单切换窗口
- **Given**: 应用启动
- **When**: 用户点击左侧菜单图标
- **Then**: Electron 标签窗口切换到对应的窗口
- **Verification**: `programmatic`

### AC-6: API 界面树结构
- **Given**: 用户进入 API 界面
- **When**: 左侧显示树结构
- **Then**: 树结构根据项目-分类-接口层级展示
- **Verification**: `human-judgment`

### AC-7: 右侧内容区显示
- **Given**: 用户在左侧树结构中选择接口
- **When**: 右侧内容区更新
- **Then**: 右侧显示该接口的具体调用信息
- **Verification**: `human-judgment`

## Open Questions
- [ ] 左侧菜单的具体图标列表需要确认
- [ ] API 界面树结构的具体交互逻辑需要确认
- [ ] 右侧内容区的具体布局需要确认