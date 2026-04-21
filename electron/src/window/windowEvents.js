import { app, BaseWindow, ipcMain, Menu } from 'electron'
import { getMainWindow, getShellView, mainWindowBounds } from './mainWindowManager.js'
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
  ipcMain.on('create-tab', (event, { title, path, bounds }) => {
    createTab(title, path, bounds);
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
      // 更新 mainWindowBounds
      const bounds = mainWindow.getBounds();
      mainWindowBounds.width = bounds.width;
      mainWindowBounds.height = bounds.height;
      
      // 调整壳视图大小
      const shellView = getShellView();
      if (shellView) {
        shellView.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
      }
      
      // 调整当前显示的 WebContentsView 大小
      resizeViews();
    });
  }

  // 应用激活事件
  app.on('activate', () => {
    if (app.getWindows().length === 0) {
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
