import { app, BrowserWindow, protocol, ipcMain, net } from 'electron'
import path from 'path'
import fs from 'fs'

import { pathToFileURL, fileURLToPath } from 'url'

// 模拟 __dirname 在 ES6 模块中
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename);


// 🔥 关键代码：引入并启用热重载
// 注意：这行代码需要在 app.whenReady() 之前执行
try {
  // 传入 electron 模块，reloader 会自动处理
  require('electron-reloader')(module)
} catch (err) {
  // 忽略生产环境下的错误
}

// 1. 注册特权协议 (必须在 app.ready 之前)
// 我们定义 'app' 为协议头，类似于 http 或 https
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      secure: true,           // 安全：视为 HTTPS
      standard: true,         // 标准：支持相对路径解析
      supportFetchAPI: true,  // 支持 fetch API
      stream: true,           // 支持流：这对加载大文件或视频至关重要
      bypassCSP: true,        // 绕过内容安全策略（开发时方便，生产环境需谨慎）
      allowServiceWorkers: true, // 允许 Service Worker
      corsEnabled: true       // 允许跨域（视需求开启）
    }
  }
])

let mainWindow

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false, // 必须关闭以保证安全
      // sandbox: true, // 启用沙盒（主窗口也建议开启）
      webSecurity: true,       // 保持开启，依靠自定义协议解决跨域
      // disableHtmlFullscreenWindowResize: true,
      webviewTag: true,        // 启用 webview 标签
    }
  })


  mainWindow.loadURL('http://localhost:5173')
  // 开发环境加载 Vite 地址
  // if (process.env.NODE_ENV === 'development') {
  //   mainWindow.loadURL('http://localhost:5173')
  //   // 可选：自动打开开发者工具
  //   mainWindow.webContents.openDevTools()
  // } else {
  //   // 生产环境加载打包文件
  //   mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  // }
}

async function getDocsDirectories() {
  const docsPath = path.join(__dirname, 'docs')
  try {
    const entries = await fs.promises.readdir(docsPath, { withFileTypes: true })
    return entries
      .filter(entry => entry.isDirectory())
      .map(dir => dir.name)
  } catch (error) {
    console.error('Error reading docs directory:', error)
    return []
  }
}


app.whenReady().then(() => {
  createWindow();


  // 2. 注册协议处理程序 (在 app.ready 之后)
  protocol.handle('app', async (request) => {
    const url = new URL(request.url)

    // 解析路径：例如 app://vue 或 app://vite
    const pathname = url.pathname
    const hostname = url.hostname
    
    // 定义你的本地资源根目录
    // 直接使用 docs 目录
    const RESOURCE_PATH = path.join(app.getAppPath(), 'docs')

    // 拼接完整文件路径
    // 处理路径，确保正确指向对应目录的 index.html
    let filePath
    if (pathname === '/' && hostname) {
      // 处理 app://vue 格式的请求
      filePath = path.join(RESOURCE_PATH, hostname, 'index.html')
    } else if (pathname === '/' || pathname === '/home') {
      // 主页请求
      filePath = path.join(__dirname, 'index.html')
    } else {
      // 文档目录请求
      const dirName = pathname.replace(/^\/|\/$/g, '')
      filePath = path.join(RESOURCE_PATH, dirName, 'index.html')
    }

    // 【安全关键】防止目录遍历攻击 (Path Traversal)
    // 确保请求的路径仍在允许的目录内部
    const allowedPaths = [
      path.join(app.getAppPath(), 'docs'),
      __dirname
    ]
    
    const isAllowed = allowedPaths.some(allowedPath => 
      filePath.startsWith(allowedPath)
    )
    
    if (!isAllowed) {
      return new Response('403 Forbidden', { status: 403, statusText: 'Forbidden' })
    }

    try {
      // 检查文件是否存在
      await fs.promises.access(filePath)
      
      // 使用 net.fetch 将文件路径转换为流式响应
      // 这比 fs.readFile 性能更好，且支持视频/大文件
      return net.fetch(pathToFileURL(filePath).toString())
    } catch (error) {
      console.error('Error loading file:', error)
      return new Response('File not found', { status: 404, statusText: 'Not Found' })
    }
  });

  ipcMain.handle('get-docs-directories', async () => {
    return await getDocsDirectories()
  })

  ipcMain.handle('open-doc-window', async (event, dir) => {

    const docWindow = new BrowserWindow({
      width: 1000,
      height: 800,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    })
    console.log('dir---', dir);
    

    // 加载对应的文档页面
    docWindow.loadURL(`app://${dir}`)

    if (process.env.NODE_ENV === 'development') {
      docWindow.webContents.openDevTools()
    }

    return true
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})