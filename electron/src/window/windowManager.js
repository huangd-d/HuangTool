// 导入各个模块
import { createWindow as createMainWindow, getMainWindow, setMainWindow } from './mainWindowManager.js'
import { createTab, switchTab, closeTab, getAllTabs, getActiveTabId, getTabBarHeight } from './tabManager.js'
import { registerWindowEvents } from './windowEvents.js'

// 重新导出所有功能
export { createMainWindow as createWindow, getMainWindow, setMainWindow }
export { createTab, switchTab, closeTab, getAllTabs, getActiveTabId, getTabBarHeight }
export { registerWindowEvents }

// 初始化第一个页签
export function initializeFirstTab() {
  createTab('首页', '/');
}
