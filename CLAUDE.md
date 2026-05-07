# HTool - 综合工具平台

基于 Electron + Vue 3 的内网前端工具箱桌面应用，提供 API 管理、技术文档预览、Office 文档预览、数据库管理四大模块。

## 技术栈

- **Electron 41** (ES Module，无 TypeScript)
- **Vue 3** + **Vue Router 5** (history 模式) + **Element Plus 2**
- **Vite 8** (构建工具)
- **node-fetch** + **proxy-agent** (API 请求与代理)
- **mysql2** (MySQL 驱动) + **ioredis** (Redis 驱动)
- **jit-viewer** (Office 文档渲染)

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
│   │   ├── connection-manager.js # 统一连接管理（Map + 策略注册 + call() 分发）
│   │   ├── handler.js       # 统一 IPC 注册（db-* 前缀 + db-call 通用分发）
│   │   ├── config.js        # 共用连接配置持久化（database/database-connections.json）
│   │   └── strategies/
│   │       ├── mysql.js     # MySQL 策略（mysql2/promise），type: 'mysql'
│   │       └── redis.js     # Redis 策略（ioredis），type: 'redis'
│   ├── protocol/
│   │   └── protocolHandler.js # 自定义 app:// + docs:// 协议（前端应用 + 文档站点 + swagger）
│   └── window/
│       ├── mainWindowManager.js # BaseWindow + 壳 WebContentsView 创建
│       ├── tabManager.js    # 标签页：多 WebContentsView 管理
│       ├── windowEvents.js  # IPC 事件：窗口控制、标签、导航、缩放
│       └── windowManager.js # 统一导出 + initializeFirstTab
├── build/                   # electron-builder 资源（图标等）
├── preload.js               # Context Bridge：暴露 electronAPI
├── swagger/                 # API 项目 JSON 数据文件（本地文件存储，无数据库）
├── database/                # 数据库连接配置持久化（database-connections.json）
├── docs/                    # 技术文档静态站点（element-plus/、vue/、vite/）
├── web-dist/                # Vite 构建输出（gitignore，构建时生成）
└── package.json             # 主进程依赖 + electron-builder 配置

web/                         # Vue 3 前端
├── src/
│   ├── main.js              # Vue 入口：createApp + Router + ElementPlus
│   ├── App.vue              # 根组件（仅 <router-view />）
│   ├── style.css            # 暗黑橙主题设计系统 (CSS 变量)
│   ├── config/
│   │   └── menuConfig.js    # 菜单定义 + createTab 辅助函数
│   ├── router/
│   │   └── index.js         # 路由：/ /home /api /docs /office /database
│   └── views/
│       ├── Layout/              # 壳布局模块
│       │   ├── index.vue        # Header水平菜单 + Main
│       │   └── components/
│       │       └── WindowControls.vue  # 最小/最大化/关闭按钮
│       ├── Home/
│       │   └── index.vue        # 首页：功能卡片入口
│       ├── Api/                 # API管理模块
│       │   ├── index.vue        # 主视图：el-tree + 端点编辑器
│       │   └── components/
│       │       ├── ApiTree.vue          # 项目/分类/接口三级树（el-dropdown）
│       │       ├── EndpointView.vue     # 接口请求/响应 UI
│       │       ├── ProjectConfig.vue    # 项目配置
│       │       └── dialogs/
│       │           ├── ProjectDialog / CategoryDialog / EndpointDialog
│       ├── Docs/
│       │   └── index.vue        # 技术文档：目录列表 + webview
│       ├── Office/
│       │   └── index.vue        # Office预览：文件选择 + jit-viewer
│       └── Database/             # 数据库管理模块（MySQL + Redis，策略模式）
│           ├── index.vue        # 主视图：左侧统一标题栏 + 连接树列表 + 右侧动态面板
│           ├── composables/
│           │   └── useConnectionManager.js  # 统一连接状态管理（含 typeMap）
│           └── components/
│               ├── BaseConnectionTree.vue  # 连接树通用壳（头行 + 折叠 + 样式）
│               ├── MysqlTree.vue        # MySQL 单连接树（BaseConnectionTree + el-tree + MySQL 对话框）
│               ├── RedisTree.vue        # Redis 单连接树（BaseConnectionTree + el-tree + Redis 对话框）
│               ├── treeRegistry.js      # 树组件注册表 { mysql, redis }，扩展新类型只需注册
│               ├── panels/             # 右侧面板注册表
│               │   ├── MysqlPanel.vue  # MySQL: SQL编辑器 + 结果表格
│               │   ├── RedisPanel.vue  # Redis: 命令面板 + Key值编辑器
│               │   └── index.js        # panels = { mysql, redis }
│               └── dialogs/
│                   ├── ConnectionDialog.vue  # 统一连接表单（根据 dbType 切换）
│                   ├── mysql/               # MySQL 专属对话框
│                   │   ├── CreateDatabaseDialog / CreateTableDialog / TableStructureDialog
│                   └── redis/               # Redis 专属对话框
│                       ├── AddKeyDialog / TTLDialog / RenameDialog
├── vite.config.js           # 条件base + outDir + webview + 路径别名配置
└── package.json             # 前端依赖

package.json                 # 根目录构建编排脚本
```

## 架构：BaseWindow + 多 WebContentsView

应用使用 Electron `BaseWindow`（frameless）+ 多个 `WebContentsView` 的架构：

1. **壳视图 (Shell View)**：开发模式加载 `http://localhost:5173`，生产模式加载 `app://web-dist/`，提供 Header 标题栏（含水平菜单图标导航）
2. **标签页视图**：点击功能时 `createTab()` 创建新 `WebContentsView`，加载同一 Vue 应用但指定路由 `?tab=true`
3. **切换机制**：非活动标签页 bounds 设为 `{width:0, height:0}` 隐藏，活动标签页占满主区域
4. **跨视图通信**：渲染进程 → `ipcMain` → 壳视图 `webContents.send()`，实现导航和状态同步

## 四大功能模块

### 1. API 管理（类似 Postman）
- 三级层级：**项目 → 分类 → 接口**
- 数据存储：`electron/swagger/` 目录下的 JSON 文件，一个文件 = 一个项目
- 项目 JSON 结构包含 `config`(baseUrl/proxy/headers/timeout) + `categories` + `endpoints`
- 接口请求通过主进程 `requestHandler.js` 发送，支持代理和超时
- Vue 端使用 `el-tree` 展示层级，`EndpointView` 提供 Postman 风格的请求/响应 UI
- 树节点 hover 显示 `⋮` 图标，点击展开 el-dropdown 下拉菜单（新建/编辑/删除）

### 2. 技术文档预览
- 文档站点放入 `electron/docs/` 目录（如 `docs/element-plus/`）
- 自定义 `docs://` 协议：`docs://{目录名}` 映射到 `docs/{目录名}/` 目录，支持 SPA fallback
- 自定义 `app://web-dist/` 协议：映射到前端应用构建产物
- 自定义 `app://swagger/` 协议：映射到 swagger JSON 数据文件
- Vue 端使用 `<webview>` 标签加载 `docs://` URL
- 协议注册分两阶段：`registerProtocol()`(before whenReady) + `handleProtocol()`(after whenReady)
- 所有协议均内置路径遍历防护

### 3. Office 文档预览
- 使用 `jit-viewer` SDK（`createViewer` API）进行文档渲染
- 支持格式：PDF、Office（`.docx/.xlsx/.xls/.pptx/.ppt`）、OFD、CSV/TSV、TXT、Markdown、HTML、图片、视频、CAD（`.dxf`）、3D 模型（`.glb/.gltf/.stl`）
- 配置：暗黑主题 + 中文 locale + 内置工具栏
- 文件选择 + 最近文件列表 + 多标签页预览（每个 tab 独立 `createViewer` 实例）

### 4. 数据库管理
- 左侧统一标题栏（"连接" + "+"下拉选择数据库类型），下方按创建顺序排列连接树，每连接一颗独立 el-tree
- 每个连接树使用 `BaseConnectionTree` 壳组件（可折叠头行：连接名 + 连接/断开 + 编辑/删除下拉），内部按类型渲染 MysqlTree 或 RedisTree
- **MySQL**：树结构（**数据库 → 表**），连接配置 `type: 'mysql'`（也支持 postgres/sqlite 子类型）
- **Redis**：树结构（**DB号(0-15) → Key**），连接配置 `type: 'redis'`
- 连接配置共用 `database-connections.json`，`useConnectionManager` 统一管理所有类型连接（含 typeMap）
- `treeRegistry.js` 映射数据库类型到树组件，扩展新类型只需创建 XxxTree.vue + 注册
- 树节点 hover 显示常用操作图标 + `⋮` 下拉菜单
- 右侧面板由 `connManager.getConnectionType(savedId)` 自动判断，切换 MysqlPanel 或 RedisPanel
- MySQL 右侧：MysqlPanel（SQL 编辑器 + 结果表格）
- Redis 右侧：RedisPanel（命令输入 + 内联结果 + Key值编辑器，支持 string/hash/list/set/zset）
- Redis 支持：SCAN 分页、Key CRUD、TTL 管理、重命名、清空 DB

## IPC 通信接口 (preload.js → window.electronAPI)

| 类别 | 方法 |
|------|------|
| 工具 | `getVersions()` |
| 窗口控制 | `minimizeWindow()`, `maximizeWindow()`, `closeWindow()` |
| 标签页 | `createTab()`, `switchTab()`, `closeTab()`, `onTabCreated/Switched/Closed()` |
| 导航 | `navigateTo()`, `onNavigateTo()` |
| API项目 | `getApiProjects()`, `createApiProject()`, `updateApiProject()`, `deleteApiProject()` |
| API分类 | `getApiCategories()`, `createApiCategory()`, `updateApiCategory()`, `deleteApiCategory()` |
| API接口 | `getApiEndpoints()`, `createApiEndpoint()`, `updateApiEndpoint()`, `deleteApiEndpoint()` |
| API请求 | `sendApiRequest()`, `getFullEndpoint()` |
| 文档 | `getDocsDirectories()` |
| 数据库连接 | `dbConnect()`, `dbDisconnect()`, `dbTest()`, `dbConnections()`, `dbSavedConnections()`, `dbSaveConnection()`, `dbDeleteConnection()` |
| 数据库调用 | `dbCall(connectionId, method, ...args)` — 通用策略方法分发（MySQL/Redis 共用） |

## 开发与构建命令

```bash
# 开发模式
cd web && npm run dev          # Vite dev server (localhost:5173)
cd electron && npm start       # NODE_ENV=development electron .

# 构建前端
cd web && npm run build        # 构建到 electron/web-dist/

# 打包安装包
cd electron && npm run build:win    # Windows Portable 安装包
cd electron && npm run build:linux  # Linux AppImage + deb

# 根目录快捷命令
npm run dev:web          # 前端开发
npm run dev:electron     # Electron 开发
npm run build:win        # 构建 Windows 安装包
npm run build:linux      # 构建 Linux 安装包
```

## 打包架构

- **electron-builder**：Windows (Portable) + Linux (AppImage/deb)
- **资源分离**：`web-dist/`、`swagger/` 和 `docs/` 通过 `extraResources` 放在 asar 外部（swagger 需运行时写入，docs 体积大，web-dist 为前端构建产物）。`database/` 目录目前未加入 extraResources，且 `config.js` 使用 `__dirname` 相对路径，生产环境写入可能需适配
- **生产环境路径**：`swagger/` 和 `docs/` 在打包后位于 `process.resourcesPath/` 下
- **生产环境页面加载**：通过 `app://web-dist/` 自定义协议 serve `web-dist/` 目录，支持 Vue Router history 模式
- **Vite 构建**：`base: 'app://web-dist/'`（构建时）使构建产物中的资源引用使用自定义协议
- **图标资源**：`electron/build/icon.ico` (Windows) + `electron/build/icon.png` (Linux)

## 关键约定

- **无数据库**：API 数据使用 JSON 文件存储在 `electron/swagger/`；数据库模块的连接配置存储在 `electron/database/database-connections.json`
- **文档不入 Git**：`electron/docs/*` 已在 `.gitignore` 中排除，文档站点为外部导入
- **frameless 窗口**：自定义标题栏，`-webkit-app-region: drag` 实现拖拽
- **webview 标签**：Vite 配置中将 `<webview>` 标记为自定义元素，避免 Vue 编译
- **路径别名**：Vite 配置 `@`→`/src`、`views`→`/src/views`、`config`→`/src/config`
- **安全**：`contextIsolation: true`, `nodeIntegration: false`, app:// 及 docs:// 协议含路径遍历防护
- **样式系统**：暗黑橙主题 CSS 变量（`--accent: #FF9000`，Arial 字体栈，13px 基础字号），滚动条统一为黑色轨道 + 橙色滑块（`--accent`）
- **查看版本信息**：使用package.json 中的版本号
- **忽略**：electron/swagger 和 electron/docs 目录下的所有文件，在ai查询时忽略
