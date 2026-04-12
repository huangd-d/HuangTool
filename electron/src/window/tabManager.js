import { app, WebContentsView } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { getMainWindow } from './mainWindowManager.js'

// 模拟 __dirname 在 ES6 模块中
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let views = new Map() // 存储 WebContentsView 实例
let activeTabId = null // 当前激活的页签 ID
let tabBarHeight = 48 // 页签栏高度

// 创建新页签
export function createTab(title, tabPath) {
  const tabId = Date.now().toString();
  const mainWindow = getMainWindow()
  
  // 创建 WebContentsView
  const view = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, '..', '..', 'preload.js'), // 修正路径
      contextIsolation: true,
      nodeIntegration: false,
      partition: `persist:tab-${tabId}`, // 设置独立的 partition 实现数据隔离
    }
  });
  
  // 加载页面（添加 tab 参数：无头部栏，有内容区）
  const devUrl = `http://localhost:5173${tabPath}?tab=true`;
  view.webContents.loadURL(devUrl).catch(err => {
    console.error(`加载页面失败 [${tabId}]:`, err);
  });
  view.webContents.openDevTools();
  
  // 开发环境下打开页签的开发者工具（可选，默认关闭）
  // if (process.env.NODE_ENV === 'development') {
  //   view.webContents.openDevTools();
  // }
  
  // 将 WebContentsView 添加到主窗口
  mainWindow.contentView.addChildView(view);
  
  // 存储 WebContentsView 实例
  views.set(tabId, { id: tabId, title, path: tabPath, view });
  
  // 切换到新页签
  switchTab(tabId);
  
  // 通知前端应用新页签已创建
  mainWindow.webContents.send('tab-created', { id: tabId, title, path: tabPath });
  
  return tabId;
}

// 切换页签
export function switchTab(tabId) {
  const tab = views.get(tabId);
  if (!tab) return;
  
  const mainWindow = getMainWindow()
  if (!mainWindow) return
  
  const { width, height } = mainWindow.getBounds();
  
  // 隐藏所有 WebContentsView - 设置为不可见区域
  views.forEach(({ view, id }) => {
    if (id !== tabId) {
      // 将非活动视图移到屏幕外或设置尺寸为0
      view.setBounds({ x: 0, y: tabBarHeight, width: 0, height: 0 });
    }
  });
  
  // 显示当前 WebContentsView
  tab.view.setBounds({ x: 0, y: tabBarHeight, width, height: height - tabBarHeight });
  
  // 更新激活的页签 ID
  activeTabId = tabId;
  
  // 通知前端应用页签已切换
  mainWindow.webContents.send('tab-switched', tabId);
}

// 关闭页签
export function closeTab(tabId) {
  const tab = views.get(tabId);
  if (!tab) return;
  
  const mainWindow = getMainWindow()
  if (!mainWindow) return
  
  // 移除 WebContentsView
  mainWindow.contentView.removeChildView(tab.view);
  
  // 清理事件监听器（如果有的话）
  tab.view.webContents.removeAllListeners();
  tab.view.webContents.destroy();
  
  // 从存储中删除
  views.delete(tabId);
  
  // 如果关闭的是当前激活的页签，切换到其他页签
  if (activeTabId === tabId && views.size > 0) {
    const firstTabId = Array.from(views.keys())[0];
    switchTab(firstTabId);
  } else if (views.size === 0) {
    // 如果没有页签了，重置 activeTabId
    activeTabId = null;
  }
  
  // 通知前端应用页签已关闭
  mainWindow.webContents.send('tab-closed', tabId);
}

// 获取所有页签（返回可序列化的数据）
export function getAllTabs() {
  const tabs = [];
  views.forEach(({ id, title, path }) => {
    tabs.push({ id, title, path });
  });
  return tabs;
}

// 获取当前激活的页签 ID
export function getActiveTabId() {
  return activeTabId
}

// 获取页签栏高度
export function getTabBarHeight() {
  return tabBarHeight
}

// 调整所有视图的大小（窗口大小变化时调用）
export function resizeViews() {
  const mainWindow = getMainWindow()
  if (!mainWindow) return
  
  const { width, height } = mainWindow.getBounds();
  
  views.forEach(({ view, id }) => {
    if (id === activeTabId) {
      // 只调整当前激活的视图
      view.setBounds({ x: 0, y: tabBarHeight, width, height: height - tabBarHeight });
    }
  });
}
