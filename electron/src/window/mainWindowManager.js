import { app, BaseWindow, WebContentsView, globalShortcut } from 'electron'
import path from 'path'

let mainWindow
export const mainWindowBounds = {
  width: 1200,
  height: 800,
  x: 60,
  y: 48
}

// 创建主窗口
export function createWindow() {
  mainWindow = new BaseWindow({
    width: mainWindowBounds.width,
    height: mainWindowBounds.height,
    frame: false, // 去除默认标题栏
    roundedCorners: true, // 启用圆角
    // transparent: true, // 启用透明背景
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // 设置背景颜色为半透明黑色
    backgroundMaterial: 'acrylic', // 启用背景材质，增加阴影效果
    visualEffectState: 'active', // 激活视觉效果
  })

  const webContentsView = new WebContentsView({
    webPreferences: {
      preload: path.join(app.getAppPath(), 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false, // 必须关闭以保证安全
      webSecurity: true,       // 保持开启，依靠自定义协议解决跨域
      webviewTag: true,        // 启用 webview 标签
    }
  })

  // 加载前端应用（壳视图：只有头部栏）
  webContentsView.webContents.loadURL('http://localhost:5173');
  mainWindow.contentView.addChildView(webContentsView);
  webContentsView.setBounds({ x: 0, y: 0, width: mainWindowBounds.width, height: mainWindowBounds.height })

  webContentsView.webContents.openDevTools({
    mode: 'detach',    // 模式：'right', 'bottom', 'detach' (独立窗口)
    activate: true    // 是否自动激活窗口
  })

  // 处理资源清理
  mainWindow.on('closed', () => {
    webContentsView.webContents.close()
  })

  app.whenReady().then(() => {
    // 注册 Ctrl+Shift+I 快捷键
    globalShortcut.register('CommandOrControl+Shift+I', () => {
      // 切换调试控制台状态
      webContentsView.webContents.toggleDevTools()
    })
  })

  // 强制打开开发者工具（开发环境）
  // webContentsView.webContents.openDevTools({ mode: 'detach' });

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
