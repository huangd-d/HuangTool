// 导入各个模块
import { createWindow as createMainWindow, getMainWindow, setMainWindow } from './mainWindowManager.js'
import { createTab, switchTab, closeTab, getAllTabs, getActiveTabId } from './tabManager.js'
import { registerWindowEvents } from './windowEvents.js'

// 重新导出所有功能
export { createMainWindow as createWindow, getMainWindow, setMainWindow }
export { createTab, switchTab, closeTab, getAllTabs, getActiveTabId }
export { registerWindowEvents }

// 初始化第一个页签
export function initializeFirstTab() {
  // 等待主窗口加载完成后再创建第一个页签
  const mainWindow = getMainWindow()
  // if (mainWindow) {
  //   mainWindow.webContents.once('did-finish-load', () => {
  //     createTab('首页', '/');
  //   });
  // }
}
