import { app, BaseWindow, WebContentsView, globalShortcut } from 'electron'
import path from 'path'
import { getAppURL } from '../utils/appUrl.js'

let mainWindow
let shellView
export const mainWindowBounds = {
  width: 1200,
  height: 800,
  x: 60,
  y: 48
}

// 获取壳视图
export function getShellView() {
  return shellView
}

// 创建主窗口
export function createWindow() {
  mainWindow = new BaseWindow({
    width: mainWindowBounds.width,
    height: mainWindowBounds.height,
    frame: false,
    roundedCorners: true,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backgroundMaterial: 'acrylic',
    visualEffectState: 'active',
  })

  shellView = new WebContentsView({
    webPreferences: {
      preload: path.join(app.getAppPath(), 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      webviewTag: true,
    }
  })

  // 加载前端应用
  shellView.webContents.loadURL(getAppURL('/'))
  mainWindow.contentView.addChildView(shellView)
  shellView.setBounds({ x: 0, y: 0, width: mainWindowBounds.width, height: mainWindowBounds.height })

  // 仅开发模式打开 DevTools
  if (!app.isPackaged) {
    shellView.webContents.openDevTools({
      mode: 'detach',
      activate: true
    })
  }

  // 处理资源清理
  mainWindow.on('closed', () => {
    shellView.webContents.close()
  })

  // 仅开发模式注册 DevTools 快捷键
  if (!app.isPackaged) {
    app.whenReady().then(() => {
      globalShortcut.register('CommandOrControl+Shift+I', () => {
        shellView.webContents.toggleDevTools()
      })
    })
  }

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
