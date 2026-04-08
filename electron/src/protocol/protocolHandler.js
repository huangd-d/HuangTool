import { app, protocol, net, fs } from 'electron'
import path from 'path'
import { pathToFileURL } from 'url'

// 注册自定义协议
export function registerProtocol() {
  // 1. 注册特权协议 (必须在 app.ready 之前)
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
  ]);
}

// 处理协议请求
export function handleProtocol() {
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
      filePath = path.join(app.getAppPath(), 'index.html')
    } else {
      // 文档目录请求
      const dirName = pathname.replace(/^\/|\/$/g, '')
      filePath = path.join(RESOURCE_PATH, dirName, 'index.html')
    }

    // 【安全关键】防止目录遍历攻击 (Path Traversal)
    // 确保请求的路径仍在允许的目录内部
    const allowedPaths = [
      path.join(app.getAppPath(), 'docs'),
      app.getAppPath()
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
}