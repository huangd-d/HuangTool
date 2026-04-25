# HTool - 综合工具平台

基于 Electron + Vue 3 的内网前端工具箱桌面应用，提供 API 管理、技术文档预览、Office 文档预览三大模块。

## 技术栈

- **Electron 41** (ES Module，无 TypeScript)
- **Vue 3** + **Vue Router 5** (history 模式) + **Element Plus 2**
- **Vite 8** (构建工具)
- **node-fetch** + **proxy-agent** (API 请求与代理)
- 纯 JavaScript 项目，无 TypeScript / ESLint 配置

## 项目结构

```
electron/                    # Electron 主进程
├── src/
│   ├── index.js             # 主入口：启动流程、注册协议、创建窗口
│   ├── utils/
│   │   ├── paths.js         # 资源路径工具（getSwaggerPath, getDocsPath）
│   │   └── appUrl.js        # 页面URL工具（getAppURL，开发/生产切换）
│   ├── api/
│   │   ├── apiHandler.js    # IPC 处理：项目/分类/接口 CRUD + 请求
│   │   ├── docsHandler.js   # IPC 处理：docs 目录列表
│   │   └── requestHandler.js # HTTP 请求引擎 (node-fetch + ProxyAgent)
│   ├── protocol/
│   │   └── protocolHandler.js # 自定义 app:// 协议（前端应用 + 文档站点）
│   └── window/
│       ├── mainWindowManager.js # BaseWindow + 壳 WebContentsView 创建
│       ├── tabManager.js    # 标签页：多 WebContentsView 管理
│       ├── windowEvents.js  # IPC 事件：窗口控制、标签、导航、缩放
│       └── windowManager.js # 统一导出 + initializeFirstTab
├── build/                   # electron-builder 资源（图标等）
├── preload.js               # Context Bridge：暴露 electronAPI
├── swagger/                 # API 项目 JSON 数据文件（本地文件存储，无数据库）
├── docs/                    # 技术文档静态站点（element-plus/、vue/、vite/）
├── web-dist/                # Vite 构建输出（gitignore，构建时生成）
└── package.json             # 主进程依赖 + electron-builder 配置

web/                         # Vue 3 前端
├── src/
│   ├── main.js              # Vue 入口：createApp + Router + ElementPlus
│   ├── App.vue              # 根组件（仅 <router-view />）
│   ├── style.css            # Apple 风格设计系统 (CSS 变量)
│   ├── config/
│   │   └── menuConfig.js    # 菜单定义 + createTab 辅助函数
│   ├── router/
│   │   └── index.js         # 路由：/ /home /api /docs /office
│   ├── views/
│   │   ├── Layout.vue       # 壳布局：Header + Sidebar(60px图标) + Main
│   │   ├── HomeView.vue     # 首页：功能卡片入口
│   │   ├── ApiView.vue      # API管理：el-tree + 端点编辑器
│   │   ├── DocsView.vue     # 技术文档：目录列表 + webview(app://协议)
│   │   └── OfficeView.vue   # Office预览：文件选择 + jit-viewer
│   └── components/
│       ├── WindowControls.vue   # 最小/最大化/关闭按钮
│       ├── EndpointView.vue     # 接口请求/响应 UI（Postman 风格）
│       ├── ApiSidebar.vue       # API 侧边栏（备用，当前未使用）
│       └── dialogs/             # 项目/分类/接口 新建编辑对话框
├── vite.config.js           # 条件base + outDir + webview 配置
└── package.json             # 前端依赖

package.json                 # 根目录构建编排脚本
```

## 架构：BaseWindow + 多 WebContentsView

应用使用 Electron `BaseWindow`（frameless）+ 多个 `WebContentsView` 的架构：

1. **壳视图 (Shell View)**：开发模式加载 `http://localhost:5173`，生产模式加载 `app://app/`，提供 Header 标题栏 + 60px 图标侧边栏 + 导航
2. **标签页视图**：点击功能时 `createTab()` 创建新 `WebContentsView`，加载同一 Vue 应用但指定路由 `?tab=true`
3. **切换机制**：非活动标签页 bounds 设为 `{width:0, height:0}` 隐藏，活动标签页占满主区域
4. **跨视图通信**：渲染进程 → `ipcMain` → 壳视图 `webContents.send()`，实现导航和状态同步

## 三大功能模块

### 1. API 管理（类似 Postman）
- 三级层级：**项目 → 分类 → 接口**
- 数据存储：`electron/swagger/` 目录下的 JSON 文件，一个文件 = 一个项目
- 项目 JSON 结构包含 `config`(baseUrl/proxy/headers/timeout) + `categories` + `endpoints`
- 接口请求通过主进程 `requestHandler.js` 发送，支持代理和超时
- Vue 端使用 `el-tree` 展示层级，`EndpointView` 提供 Postman 风格的请求/响应 UI

### 2. 技术文档预览
- 文档站点放入 `electron/docs/` 目录（如 `docs/element-plus/`）
- 自定义 `app://` 协议：`app://{目录名}` 映射到 `docs/{目录名}/index.html`，`app://app/` 映射到前端应用
- Vue 端使用 `<webview>` 标签加载 `app://` URL
- 协议注册分两阶段：`registerProtocol()`(before whenReady) + `handleProtocol()`(after whenReady)
- `app://app/` 支持 SPA fallback（Vue Router history 模式）
- 协议注册分两阶段：`registerProtocol()`(before whenReady) + `handleProtocol()`(after whenReady)
- 内置路径遍历防护

### 3. Office 文档预览
- 支持导入 `.docx/.xlsx/.pptx` 文件
- 使用 `jit-viewer` 包进行渲染（当前为占位实现）
- 文件选择 + 最近文件列表 + 标签页预览

## IPC 通信接口 (preload.js → window.electronAPI)

| 类别 | 方法 |
|------|------|
| 窗口控制 | `minimizeWindow()`, `maximizeWindow()`, `closeWindow()` |
| 标签页 | `createTab()`, `switchTab()`, `closeTab()`, `onTabCreated/Switched/Closed()` |
| 导航 | `navigateTo()`, `onNavigateTo()` |
| API项目 | `getApiProjects()`, `createApiProject()`, `updateApiProject()`, `deleteApiProject()` |
| API分类 | `getApiCategories()`, `createApiCategory()`, `updateApiCategory()`, `deleteApiCategory()` |
| API接口 | `getApiEndpoints()`, `createApiEndpoint()`, `updateApiEndpoint()`, `deleteApiEndpoint()` |
| API请求 | `sendApiRequest()`, `getFullEndpoint()` |
| 文档 | `getDocsDirectories()`, `openDocWindow()` |

## 开发与构建命令

```bash
# 开发模式
cd web && npm run dev          # Vite dev server (localhost:5173)
cd electron && npm start       # NODE_ENV=development electron .

# 构建前端
cd web && npm run build        # 构建到 electron/web-dist/

# 打包安装包
cd electron && npm run build:win    # Windows NSIS 安装包
cd electron && npm run build:linux  # Linux AppImage + deb

# 根目录快捷命令
npm run dev:web          # 前端开发
npm run dev:electron     # Electron 开发
npm run build:win        # 构建 Windows 安装包
npm run build:linux      # 构建 Linux 安装包
```

## 打包架构

- **electron-builder**：Windows (NSIS) + Linux (AppImage/deb)
- **资源分离**：`swagger/` 和 `docs/` 通过 `extraResources` 放在 asar 外部（swagger 需运行时写入，docs 体积大）
- **生产环境路径**：`swagger/` 和 `docs/` 在打包后位于 `process.resourcesPath/` 下
- **生产环境页面加载**：通过 `app://app/` 自定义协议 serve `web-dist/` 目录，支持 Vue Router history 模式
- **Vite 构建**：`base: 'app://app/'` 使构建产物中的资源引用使用自定义协议
- **图标资源**：`electron/build/icon.ico` (Windows) + `electron/build/icon.png` (Linux)

## 关键约定

- **无数据库**：API 数据全部使用 JSON 文件存储在 `electron/swagger/`
- **文档不入 Git**：`electron/docs/*` 已在 `.gitignore` 中排除，文档站点为外部导入
- **frameless 窗口**：自定义标题栏，`-webkit-app-region: drag` 实现拖拽
- **webview 标签**：Vite 配置中将 `<webview>` 标记为自定义元素，避免 Vue 编译
- **安全**：`contextIsolation: true`, `nodeIntegration: false`, app:// 协议含路径遍历防护
- **样式系统**：Apple 风格 CSS 变量（SF Pro 字体栈、`--accent: #0071e3` 等）
- **查看版本信息**：使用package.json 中的版本号
- **忽略**：electron/swagger 和 electron/docs 目录下的所有文件，在ai查询时忽略
