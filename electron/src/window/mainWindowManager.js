import { app, BrowserWindow } from 'electron'
import path from 'path'

let mainWindow

// 创建主窗口
export function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false, // 去除默认标题栏
    webPreferences: {
      preload: path.join(app.getAppPath(), 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false, // 必须关闭以保证安全
      webSecurity: true,       // 保持开启，依靠自定义协议解决跨域
      webviewTag: true,        // 启用 webview 标签
    }
  })

  // 加载前端应用（壳视图：只有头部栏）
  mainWindow.loadURL('http://localhost:5173/?shell=true');

  // 强制打开开发者工具（开发环境）
  // mainWindow.webContents.openDevTools({ mode: 'detach' });

  return mainWindow
}

// 获取主窗口实例
export function getMainWindow() {
  return mainWindow
}

// 设置主窗口实例
export function setMainWindow(window) {
  mainWindow = window
}
