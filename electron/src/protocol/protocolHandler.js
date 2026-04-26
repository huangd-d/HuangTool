import { app, protocol } from 'electron'
import fs from 'fs'
import path from 'path'
import { getDocsPath, getSwaggerPath, getWebDistPath } from '../utils/paths.js'

const MIME_TYPES = {
  '.html': 'text/html',
  '.htm': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  return MIME_TYPES[ext] || 'application/octet-stream'
}

function tryReadFile(filePath) {
  try {
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return null
    const data = fs.readFileSync(filePath)
    return new Response(data, {
      headers: { 'content-type': getMimeType(filePath) }
    })
  } catch {
    return null
  }
}

function serveWithSpaFallback(baseDir, urlPathname) {
  const decoded = decodeURIComponent(urlPathname)
  const resolved = path.normalize(decoded)

  // 路径遍历防护
  const fullBase = path.resolve(baseDir)
  const candidate = path.resolve(fullBase, resolved.slice(1)) // 去掉前导 /
  if (!candidate.startsWith(fullBase)) {
    return new Response('Forbidden', { status: 403 })
  }

  // 1. 精确路径
  let resp = tryReadFile(candidate)
  if (resp) return resp

  // 2. 加 .html 扩展名
  if (!path.extname(candidate)) {
    resp = tryReadFile(candidate + '.html')
    if (resp) return resp

    // 3. 当作目录，尝试 index.html
    resp = tryReadFile(path.join(candidate, 'index.html'))
    if (resp) return resp
  }

  // 4. SPA fallback → baseDir/index.html
  resp = tryReadFile(path.join(fullBase, 'index.html'))
  if (resp) return resp

  return new Response('File not found', { status: 404 })
}

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
    },
    {
      scheme: 'docs',
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
    const hostname = url.hostname
    const pathname = url.pathname

    let baseDir
    if (hostname === 'web-dist') {
      baseDir = getWebDistPath()
    } else if (hostname === 'swagger') {
      baseDir = getSwaggerPath()
    } else {
      return new Response('Not found', { status: 404 })
    }

    return serveWithSpaFallback(baseDir, pathname)
  })

  protocol.handle('docs', async (request) => {
    const url = new URL(request.url)
    const hostname = url.hostname
    const pathname = url.pathname

    const baseDir = path.join(getDocsPath(), hostname)
    if (!fs.existsSync(baseDir)) {
      return new Response('Not found', { status: 404 })
    }

    return serveWithSpaFallback(baseDir, pathname)
  })
}
