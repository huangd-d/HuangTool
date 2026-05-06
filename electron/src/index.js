import { app } from 'electron'
import path from 'path'
import fs from 'fs'
import { getSwaggerPath } from './utils/paths.js'

// 确保 swagger 目录存在
const swaggerPath = getSwaggerPath()
if (!fs.existsSync(swaggerPath)) {
  fs.mkdirSync(swaggerPath, { recursive: true })
  console.log('Created swagger directory:', swaggerPath)
}

// 打印环境变量用于调试
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('App Path:', app.getAppPath())
console.log('isPackaged:', app.isPackaged)

// 导入模块
import { registerProtocol, handleProtocol } from './protocol/protocolHandler.js'
import { createWindow, registerWindowEvents, initializeFirstTab } from './window/windowManager.js'
import { registerApiHandlers } from './api/apiHandler.js'
import { registerDocsHandlers } from './api/docsHandler.js'
import { registerDatabaseHandlers } from './api/handler.js'

// 注册协议
registerProtocol()

// 应用就绪
app.whenReady().then(() => {
  // 注册协议处理（必须在 loadURL 之前，否则 app:// 协议无法解析）
  handleProtocol()

  // 创建主窗口
  createWindow()

  // 初始化第一个页签
  initializeFirstTab()

  // 注册窗口事件
  registerWindowEvents()

  // 注册 API 处理
  registerApiHandlers()

  // 注册文档处理
  registerDocsHandlers()

  // 注册数据库处理
  registerDatabaseHandlers()
})
