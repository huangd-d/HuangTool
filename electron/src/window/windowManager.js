import { app, BrowserWindow, ipcMain, Menu } from 'electron'
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

  // 加载打包文件
  // mainWindow.loadFile(path.join(__dirname, '../web/dist/index.html'))
  
  // 开发环境加载 Vite 地址
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    // 可选：自动打开开发者工具
    mainWindow.webContents.openDevTools();
  } else {
    // 生产环境加载打包文件
    mainWindow.loadFile(path.join(app.getAppPath(), '../web/dist/index.html'));
  }

  return mainWindow
}

// 注册窗口控制事件
export function registerWindowEvents() {
  // 禁用默认菜单
  Menu.setApplicationMenu(null);

  // 窗口控制事件
  ipcMain.on('minimize-window', () => {
    if (mainWindow) {
      mainWindow.minimize()
    }
  });

  ipcMain.on('maximize-window', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize()
      } else {
        mainWindow.maximize()
      }
    }
  });

  ipcMain.on('close-window', () => {
    if (mainWindow) {
      mainWindow.close()
    }
  });

  // 应用激活事件
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  });

  // 窗口关闭事件
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  });
}

// 打开文档窗口
export function openDocWindow(dir) {
  const docWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(app.getAppPath(), 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  console.log('dir---', dir);

  // 加载对应的文档页面
  docWindow.loadURL(`app://${dir}`);

  if (process.env.NODE_ENV === 'development') {
    docWindow.webContents.openDevTools();
  }

  return true
}