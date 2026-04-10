import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import { getMainWindow } from './mainWindowManager.js'
import { createTab, switchTab, closeTab, getActiveTabId, resizeViews } from './tabManager.js'

// 注册窗口控制事件
export function registerWindowEvents() {
  // 禁用默认菜单
  Menu.setApplicationMenu(null);

  // 窗口控制事件
  ipcMain.on('minimize-window', () => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
      mainWindow.minimize()
    }
  });

  ipcMain.on('maximize-window', () => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize()
      } else {
        mainWindow.maximize()
      }
    }
  });

  ipcMain.on('close-window', () => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
      mainWindow.close()
    }
  });

  // 页签管理事件
  ipcMain.on('create-tab', (event, { title, path }) => {
    createTab(title, path);
  });

  ipcMain.on('switch-tab', (event, tabId) => {
    switchTab(tabId);
  });

  ipcMain.on('close-tab', (event, tabId) => {
    closeTab(tabId);
  });

  // 窗口大小变化事件
  const mainWindow = getMainWindow()
  if (mainWindow) {
    mainWindow.on('resize', () => {
      resizeViews(); // 使用专门的 resize 函数
    });
  }

  // 应用激活事件
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      import('./mainWindowManager.js').then(({ createWindow }) => {
        createWindow()
      })
    }
  });

  // 窗口关闭事件
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  });
}
