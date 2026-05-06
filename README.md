# HTool - 综合工具平台

基于 Electron + Vue 3 的内网前端工具箱桌面应用，提供 API 管理、技术文档预览、Office 文档预览、数据库管理四大模块。

## 技术栈

- **Electron 41** (ES Module，无 TypeScript)
- **Vue 3** + **Vue Router 5** (history 模式) + **Element Plus 2**
- **Vite 8** (构建工具)
- **node-fetch** + **proxy-agent** (API 请求与代理)
- **mysql2** (MySQL 驱动) + **ioredis** (Redis 驱动)
- **jit-viewer** (Office 文档渲染)
- 纯 JavaScript 项目，无 TypeScript / ESLint 配置

## 项目结构

```
electron/                    # Electron 主进程
├── src/
│   ├── index.js             # 主入口：启动流程、注册协议、创建窗口
│   ├── utils/
│   │   ├── paths.js         # 资源路径工具（getSwaggerPath, getDocsPath, getWebDistPath）
│   │   └── appUrl.js        # 页面URL工具（getAppURL，开发/生产切换）
│   ├── api/
│   │   ├── apiHandler.js    # IPC 处理：项目/分类/接口 CRUD + 请求
│   │   ├── docsHandler.js   # IPC 处理：docs 目录列表
│   │   ├── requestHandler.js # HTTP 请求引擎 (node-fetch + ProxyAgent)
│   │   ├── connection-manager.js # 统一连接管理
│   │   ├── handler.js       # 统一 IPC 注册（db-* 前缀）
│   │   ├── config.js        # 共用连接配置持久化
│   │   └── strategies/      # 数据库策略（mysql.js / redis.js）
│   ├── protocol/
│   │   └── protocolHandler.js # 自定义 app:// + docs:// 协议
│   └── window/
│       ├── mainWindowManager.js # BaseWindow + 壳 WebContentsView 创建
│       ├── tabManager.js    # 标签页：多 WebContentsView 管理
│       ├── windowEvents.js  # IPC 事件：窗口控制、标签、导航、缩放
│       └── windowManager.js # 统一导出 + initializeFirstTab
├── build/                   # electron-builder 资源（图标等）
├── preload.js               # Context Bridge：暴露 electronAPI
├── swagger/                 # API 项目 JSON 数据文件
├── database/                # 数据库连接配置持久化
├── docs/                    # 技术文档静态站点
├── web-dist/                # Vite 构建输出（gitignore）
└── package.json             # 主进程依赖 + electron-builder 配置

web/                         # Vue 3 前端
├── src/
│   ├── main.js              # Vue 入口：createApp + Router + ElementPlus
│   ├── App.vue              # 根组件
│   ├── style.css            # 暗黑橙主题 CSS 变量
│   ├── config/menuConfig.js # 菜单定义 + createTab 辅助函数
│   ├── router/index.js      # 路由：/ /home /api /docs /office /database
│   └── views/               # 按模块组织的页面视图（各含 index.vue + components/）
├── vite.config.js           # 条件 base + outDir + 路径别名
└── package.json             # 前端依赖
```

## 功能模块

### 1. API 管理
- 三级层级：项目 → 分类 → 接口
- 数据存储：`electron/swagger/` 目录下的 JSON 文件
- 支持代理和超时的接口请求
- Postman 风格的请求/响应 UI

### 2. 技术文档预览
- 文档站点放入 `electron/docs/` 目录
- 自定义 `docs://` 协议加载文档
- SPA fallback 支持

### 3. Office 文档预览
- 支持 PDF、Office（.docx/.xlsx/.pptx 等）、OFD、Markdown、图片、视频、CAD、3D 模型等格式
- 使用 `jit-viewer` SDK 渲染，内置工具栏（缩放、翻页、打印、下载等）
- 多标签页预览

### 4. 数据库管理
- 左侧按类型纵向排列 MySQL 树 + Redis 树，右侧面板自动切换
- **MySQL**：连接 → 数据库 → 表三级树，SQL 编辑器 + 结果表格
- **Redis**：连接 → DB号 → Key 三级树，命令输入面板 + 类型感知值编辑器
- 连接配置共用 `database-connections.json`，通过 `type` 字段区分
- 支持 Key CRUD、TTL 管理、重命名、清空 DB 等操作

## 安装和运行

### 前置条件
- Node.js 18+

### 安装依赖

```bash
cd web && npm install
cd ../electron && npm install
```

### 开发模式

需要两个终端分别运行：

```bash
# 终端 1：前端开发服务器
cd web && npm run dev

# 终端 2：Electron 主进程
cd electron && npm start
```

或使用根目录快捷命令：

```bash
npm run dev:web          # 前端开发
npm run dev:electron     # Electron 开发
```

## 构建和打包

```bash
# 构建前端
cd web && npm run build

# 打包（会自动构建前端）
cd electron && npm run build:win    # Windows Portable
cd electron && npm run build:linux  # Linux AppImage + deb

# 根目录快捷命令
npm run build:win
npm run build:linux
```

## 许可证

MIT License
