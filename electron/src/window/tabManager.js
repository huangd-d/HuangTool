import { app, WebContentsView } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'
import { getMainWindow, mainWindowBounds } from './mainWindowManager.js'

// 模拟 __dirname 在 ES6 模块中
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let views = new Map() // 存储 WebContentsView 实例
let activeTabId = null // 当前激活的页签 ID

// 根据 path 查找已存在的页签
function findTabByPath(tabPath) {
  for (const [id, tab] of views.entries()) {
    if (tab.path === tabPath) {
      return id;
    }
  }
  return null;
}

// 创建或切换页签（支持自定义 bounds）
export function createTab(title, tabPath, bounds) {
  // 先查找是否已存在对应 path 的页签
  const existingTabId = findTabByPath(tabPath);

  if (existingTabId) {
    // 已存在，切换到该页签
    switchTab(existingTabId);
    return existingTabId;
  }

  // 不存在，创建新页签
  const tabId = Date.now().toString();
  const mainWindow = getMainWindow()

  // 创建 WebContentsView
  const view = new WebContentsView({
    webPreferences: {
      preload: path.join(app.getAppPath(), 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      partition: `persist:tab-${tabId}`,
    }
  });
  console.log('view---', view, title, tabPath, bounds);

  // 加载页面（添加 tab 参数：无头部栏，有内容区）
  const devUrl = `http://localhost:5173${tabPath}?tab=true`;
  view.webContents.loadURL(devUrl).catch(err => {
    console.error(`加载页面失败 [${tabId}]:`, err);
  });

  // 将 WebContentsView 添加到主窗口
  mainWindow.contentView.addChildView(view);

  // 使用传入的 bounds 或默认值设置位置和大小
  const viewBounds = bounds || { x: mainWindowBounds.x, y: mainWindowBounds.y, width: mainWindowBounds.width, height: mainWindowBounds.height - tabBarHeight };
  view.setBounds(viewBounds);

  

  // 存储 WebContentsView 实例
  views.set(tabId, { id: tabId, title, path: tabPath, view });

  // 切换到新页签
  switchTab(tabId, viewBounds);

  // 通知前端应用新页签已创建
  if (mainWindow && mainWindow.contentView && mainWindow.contentView.webContents) {
    mainWindow.contentView.webContents.send('tab-created', { id: tabId, title, path: tabPath });
  }

  return tabId;
}

// 切换页签（支持 tabId 或 path）
export function switchTab(tabIdOrPath, bounds = null) {
  // 如果传入的是 path，先查找对应的 tabId
  let tabId = tabIdOrPath;
  if (typeof tabIdOrPath === 'string' && !views.has(tabIdOrPath)) {
    tabId = findTabByPath(tabIdOrPath);
  }

  const tab = views.get(tabId);
  if (!tab) return;

  const mainWindow = getMainWindow()
  if (!mainWindow) return

  const { width, height } = mainWindow.getBounds();

  // 隐藏所有 WebContentsView - 设置为不可见区域
  views.forEach(({ view, id }) => {
    if (id !== tabId) {
      // 将非活动视图移到屏幕外或设置尺寸为0
      view.setBounds({ x: mainWindowBounds.x, y: mainWindowBounds.y, width: 0, height: 0 });
    }
  });
  const viewBounds = bounds || { x: mainWindowBounds.x, y: mainWindowBounds.y, width: mainWindowBounds.width - mainWindowBounds.x, height: mainWindowBounds.height - mainWindowBounds.y };

  // 显示当前 WebContentsView
  tab.view.setBounds(viewBounds);


  // 更新激活的页签 ID
  activeTabId = tabId;

  // 通知前端应用页签已切换
  if (mainWindow && mainWindow.contentView && mainWindow.contentView.webContents) {
    mainWindow.contentView.webContents.send('tab-switched', tabId);
  }
}

// 关闭页签
export function closeTab(tabId) {
  const tab = views.get(tabId);
  if (!tab) return;

  const mainWindow = getMainWindow()
  if (!mainWindow) return

  // 移除 WebContentsView
  if (mainWindow.contentView && typeof mainWindow.contentView.removeChildView === 'function') {
    mainWindow.contentView.removeChildView(tab.view);
  } else if (mainWindow.removeChildView) {
    mainWindow.removeChildView(tab.view);
  }

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
  if (mainWindow && mainWindow.contentView && mainWindow.contentView.webContents) {
    mainWindow.contentView.webContents.send('tab-closed', tabId);
  }
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

  const { width, height } = mainWindowBounds;

  views.forEach(({ view, id }) => {
    if (id === activeTabId) {
      // 只调整当前激活的视图
      view.setBounds({ x: mainWindowBounds.x, y: mainWindowBounds.y, width, height: height - tabBarHeight });
    }
  });
}
