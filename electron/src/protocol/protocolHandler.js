import { app, protocol, net } from 'electron'
import fs from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'
import { getDocsPath } from '../utils/paths.js'

export function registerProtocol() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'app',
      privileges: {
        secure: true,
        standard: true,
        supportFetchAPI: true,
        stream: true,
        bypassCSP: true,
        allowServiceWorkers: true,
        corsEnabled: true
      }
    }
  ])
}

export function handleProtocol() {
  protocol.handle('app', async (request) => {
    const url = new URL(request.url)
    const pathname = url.pathname
    const hostname = url.hostname

    // ---- 前端应用路由：app://app/... → web-dist/ ----
    if (hostname === 'app') {
      const WEB_DIST_PATH = app.isPackaged
        ? path.join(process.resourcesPath, 'web-dist')
        : path.join(app.getAppPath(), 'web-dist')
      let filePath = path.join(WEB_DIST_PATH, pathname)

      const resolvedFilePath = path.resolve(filePath)
      const resolvedBase = path.resolve(WEB_DIST_PATH)
      if (!resolvedFilePath.startsWith(resolvedBase + path.sep) && resolvedFilePath !== resolvedBase) {
        return new Response('403 Forbidden', { status: 403, statusText: 'Forbidden' })
      }

      // 目录路径或文件不存在时，回退到 index.html（SPA 路由）
      let isDirectory = false
      try {
        const stat = await fs.promises.stat(filePath)
        isDirectory = stat.isDirectory()
      } catch {
        // 文件不存在，走 SPA fallback
      }

      if (!isDirectory) {
        try {
          await fs.promises.access(filePath)
          return net.fetch(pathToFileURL(filePath).toString())
        } catch {
          // 文件不可访问，走 SPA fallback
        }
      }

      const indexPath = path.join(WEB_DIST_PATH, 'index.html')
      return net.fetch(pathToFileURL(indexPath).toString())
    }

    // ---- 文档站点路由：app://{docName}/... → docs/{docName}/... ----
    const DOCS_PATH = getDocsPath()

    let filePath
    if (pathname === '/' && hostname) {
      filePath = path.join(DOCS_PATH, hostname, 'index.html')
    } else if (pathname === '/' || pathname === '/home') {
      filePath = path.join(app.getAppPath(), 'index.html')
    } else {
      const normalizedPath = pathname.replace(/^\//, '')
      if (hostname) {
        filePath = path.join(DOCS_PATH, hostname, normalizedPath)
      } else {
        filePath = path.join(DOCS_PATH, normalizedPath)
      }
    }

    // 路径遍历防护
    const resolvedFilePath = path.resolve(filePath)
    const allowedPaths = [path.resolve(DOCS_PATH), path.resolve(app.getAppPath())]
    if (app.isPackaged) {
      allowedPaths.push(path.resolve(process.resourcesPath))
    }
    const isAllowed = allowedPaths.some(allowedPath =>
      resolvedFilePath.startsWith(allowedPath + path.sep) || resolvedFilePath === allowedPath
    )
    if (!isAllowed) {
      return new Response('403 Forbidden', { status: 403, statusText: 'Forbidden' })
    }

    // 尝试多种路径匹配：精确文件 → 目录下 index.html → 加 .html 后缀
    const candidates = [filePath]
    try {
      const stat = await fs.promises.stat(filePath)
      if (stat.isDirectory()) {
        candidates[0] = path.join(filePath, 'index.html')
      }
    } catch {
      // 文件不存在，追加候选路径
      candidates.push(path.join(filePath, 'index.html'))
      candidates.push(filePath + '.html')
    }

    for (const candidate of candidates) {
      try {
        const stat = await fs.promises.stat(candidate)
        if (!stat.isDirectory()) {
          return net.fetch(pathToFileURL(candidate).toString())
        }
      } catch {
        // 继续尝试下一个候选
      }
    }

    return new Response('File not found', { status: 404, statusText: 'Not Found' })
  })
}
