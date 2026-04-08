# API 接口调用功能 - 产品需求文档

## Overview
- **Summary**: 基于 Electron + Vue 3 技术栈，开发一个功能完整的 API 接口调用工具，支持项目管理、分类管理、接口管理、通用配置和本地数据存储。
- **Purpose**: 解决开发人员在物理隔绝环境下的接口调试需求，提供类似 Postman 的功能，支持本地数据存储。
- **Target Users**: 开发人员、测试人员和接口调试人员。

## Goals
- 实现项目管理功能，支持创建和管理多个项目
- 实现分类管理功能，支持在项目下创建分类
- 实现接口管理功能，支持在分类下创建和管理接口
- 实现通用配置功能，同一项目共享代理地址和共用 header
- 实现接口调用功能，支持多种 HTTP 方法和请求格式
- 实现本地数据存储，使用 JSON 文件充当本地数据库
- 实现 Tab 式界面，方便同时操作多个接口

## Non-Goals (Out of Scope)
- 不支持在线同步和云存储
- 不支持团队协作和权限管理
- 不支持接口自动化测试
- 不支持 API 文档生成
- 不支持复杂的工作流和脚本

## Background & Context
- 项目基于 Electron + Vue 3 + Vite 技术栈
- 运行在物理隔绝的局域网环境中
- 需要利用 Electron 的 Node.js 能力进行网络请求转发
- 已有基础的项目结构和接口调用功能

## Functional Requirements
- **FR-1**: 项目管理
  - 支持创建、编辑、删除项目
  - 每个项目对应一个 JSON 文件，存放在 swagger 目录
  - 项目包含基本信息和通用配置

- **FR-2**: 分类管理
  - 支持在项目下创建、编辑、删除分类
  - 分类用于组织和管理接口

- **FR-3**: 接口管理
  - 支持在分类下创建、编辑、删除接口
  - 接口包含名称、URL、方法、请求参数、请求体等信息

- **FR-4**: 通用配置
  - 每个项目共享一份通用配置
  - 配置包括代理地址和共用 header
  - 配置自动应用到项目下的所有接口

- **FR-5**: 接口调用
  - 支持 HTTP/HTTPS 请求发送
  - 支持 GET、POST、PUT、DELETE 等常见 HTTP 方法
  - 支持自定义 header 和请求参数
  - 支持请求体编辑（JSON、Form 等格式）
  - 支持响应结果展示和格式化

- **FR-6**: 本地数据存储
  - 使用 JSON 文件存储项目、分类和接口信息
  - 文件存放在根目录 swagger 文件夹中
  - 每个项目对应一个 JSON 文件

- **FR-7**: Tab 式界面
  - 点击接口时在新 Tab 中打开
  - 支持多个 Tab 同时打开和切换
  - 每个 Tab 展示接口的完整信息和操作界面

## Non-Functional Requirements
- **NFR-1**: 性能要求
  - 项目加载时间 < 2秒
  - 接口请求响应时间 < 5秒
  - Tab 切换响应时间 < 0.5秒

- **NFR-2**: 安全性
  - 遵循 Electron 安全最佳实践
  - 保护用户配置和接口信息
  - 防止未授权访问本地文件

- **NFR-3**: 用户体验
  - 响应式布局
  - 直观的用户界面
  - 清晰的操作流程
  - 及时的错误提示

- **NFR-4**: 可靠性
  - 数据持久化可靠
  - 错误处理和异常捕获
  - 应用崩溃恢复机制

## Constraints
- **Technical**: 
  - Electron 最新版本
  - Vue 3 (Composition API)
  - Vite 构建工具
  - 本地文件系统存储

- **Business**: 
  - 无外部网络依赖
  - 运行在物理隔绝环境
  - 支持 Windows 平台

- **Dependencies**: 
  - electron
  - vue
  - vite

## Assumptions
- 用户具备基本的 API 接口调试知识
- 本地文件系统有足够的存储空间
- 开发环境已配置 Node.js 和相关工具

## Acceptance Criteria

### AC-1: 项目管理
- **Given**: 用户打开接口调用功能
- **When**: 用户点击创建项目按钮，输入项目名称和配置
- **Then**: 系统应创建新项目并生成对应的 JSON 文件
- **Verification**: `programmatic`
- **Notes**: 项目文件应存放在 swagger 目录下

### AC-2: 分类管理
- **Given**: 用户已创建项目
- **When**: 用户在项目下创建分类
- **Then**: 系统应在项目中添加新分类
- **Verification**: `programmatic`
- **Notes**: 分类应存储在项目的 JSON 文件中

### AC-3: 接口管理
- **Given**: 用户已创建分类
- **When**: 用户在分类下创建接口
- **Then**: 系统应在分类中添加新接口
- **Verification**: `programmatic`
- **Notes**: 接口应存储在项目的 JSON 文件中

### AC-4: 通用配置
- **Given**: 用户已创建项目
- **When**: 用户修改项目的通用配置
- **Then**: 配置应自动应用到项目下的所有接口
- **Verification**: `programmatic`
- **Notes**: 配置应包括代理地址和共用 header

### AC-5: 接口调用
- **Given**: 用户已创建接口
- **When**: 用户点击发送请求按钮
- **Then**: 系统应发送请求并显示响应结果
- **Verification**: `programmatic`
- **Notes**: 应支持常见的 HTTP 方法和请求格式

### AC-6: 本地数据存储
- **Given**: 用户创建项目、分类或接口
- **When**: 用户保存更改
- **Then**: 系统应将数据保存到对应的 JSON 文件
- **Verification**: `programmatic`
- **Notes**: JSON 文件应包含所有项目信息

### AC-7: Tab 式界面
- **Given**: 用户点击接口
- **When**: 用户在接口列表中点击一个接口
- **Then**: 系统应在新 Tab 中打开接口详情
- **Verification**: `human-judgment`
- **Notes**: Tab 应包含接口的完整信息和操作界面

## Open Questions
- [ ] JSON 文件的具体结构设计
- [ ] 接口请求参数的具体格式支持
- [ ] 响应结果的展示方式
- [ ] 项目导出和导入功能
- [ ] 接口历史记录功能