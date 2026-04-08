import { app } from 'electron'
import { fileURLToPath } from 'url'
import path from 'path'

// 模拟 __dirname 在 ES6 模块中
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 🔥 关键代码：引入并启用热重载
// 注意：这行代码需要在 app.whenReady() 之前执行
try {
  // 传入 electron 模块，reloader 会自动处理
  require('electron-reloader')(module)
} catch (err) {
  // 忽略生产环境下的错误
}

// 导入模块
import { registerProtocol, handleProtocol } from './protocol/protocolHandler.js'
import { createWindow, registerWindowEvents } from './window/windowManager.js'
import { registerApiHandlers } from './api/apiHandler.js'
import { registerDocsHandlers } from './api/docsHandler.js'

// 注册协议
registerProtocol()

// 应用就绪
app.whenReady().then(() => {
  // 创建主窗口
  createWindow()

  // 注册协议处理
  handleProtocol()

  // 注册窗口事件
  registerWindowEvents()

  // 注册 API 处理
  registerApiHandlers()

  // 注册文档处理
  registerDocsHandlers()
})