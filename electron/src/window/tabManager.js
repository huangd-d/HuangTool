import { app, WebContentsView } from 'electron'
import path from 'path'
import { getMainWindow } from './mainWindowManager.js'

let views = new Map() // 存储 WebContentsView 实例
let activeTabId = null // 当前激活的页签 ID
let tabBarHeight = 48 // 页签栏高度

// 创建新页签
export function createTab(title, path) {
  const tabId = Date.now().toString();
  const mainWindow = getMainWindow()
  
  // 创建 WebContentsView
  const view = new WebContentsView({
    webPreferences: {
      preload: path.join(app.getAppPath(), 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      partition: `persist:tab-${tabId}`, // 设置独立的 partition 实现数据隔离
    }
  });
  
  // 加载页面
  view.webContents.loadURL(`http://localhost:5174${path}`);
  
  // 将 WebContentsView 添加到主窗口
  mainWindow.contentView.addChildView(view);
  
  // 存储 WebContentsView 实例
  views.set(tabId, { id: tabId, title, path, view });
  
  // 切换到新页签
  switchTab(tabId);
  
  // 通知前端应用新页签已创建
  mainWindow.webContents.send('tab-created', { id: tabId, title, path });
  
  return tabId;
}

// 切换页签
export function switchTab(tabId) {
  const tab = views.get(tabId);
  if (!tab) return;
  
  const mainWindow = getMainWindow()
  if (!mainWindow) return
  
  // 隐藏所有 WebContentsView
  views.forEach(({ view }) => {
    view.setBounds({ x: 0, y: tabBarHeight, width: 0, height: 0 });
  });
  
  // 显示当前 WebContentsView
  const { width, height } = mainWindow.getBounds();
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
  tab.view.webContents.destroy();
  
  // 从存储中删除
  views.delete(tabId);
  
  // 如果关闭的是当前激活的页签，切换到其他页签
  if (activeTabId === tabId && views.size > 0) {
    const firstTabId = Array.from(views.keys())[0];
    switchTab(firstTabId);
  }
  
  // 通知前端应用页签已关闭
  mainWindow.webContents.send('tab-closed', tabId);
}

// 获取所有页签
export function getAllTabs() {
  return views
}

// 获取当前激活的页签 ID
export function getActiveTabId() {
  return activeTabId
}

// 获取页签栏高度
export function getTabBarHeight() {
  return tabBarHeight
}
