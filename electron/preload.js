const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getVersions: () => process.versions,
  getDocsDirectories: () => ipcRenderer.invoke('get-docs-directories'),
  // API 请求
  sendApiRequest: (options) => ipcRenderer.invoke('send-api-request', options),
  getFullEndpoint: (fileName, categoryId, endpointId) =>
    ipcRenderer.invoke('get-full-endpoint', fileName, categoryId, endpointId),
  // API 项目管理
  getApiProjects: () => ipcRenderer.invoke('get-api-projects'),
  createApiProject: (project) => ipcRenderer.invoke('create-api-project', project),
  updateApiProject: (project) => ipcRenderer.invoke('update-api-project', project),
  deleteApiProject: (fileName) => ipcRenderer.invoke('delete-api-project', fileName),
  // API 分类管理 (fileName 为完整文件名，如 "example-project.json")
  getApiCategories: (fileName) => ipcRenderer.invoke('get-api-categories', fileName),
  createApiCategory: (fileName, category) => ipcRenderer.invoke('create-api-category', fileName, category),
  updateApiCategory: (fileName, category) => ipcRenderer.invoke('update-api-category', fileName, category),
  deleteApiCategory: (fileName, categoryId) => ipcRenderer.invoke('delete-api-category', fileName, categoryId),
  // API 接口管理
  getApiEndpoints: (fileName, categoryId) => ipcRenderer.invoke('get-api-endpoints', fileName, categoryId),
  createApiEndpoint: (fileName, categoryId, endpoint) => ipcRenderer.invoke('create-api-endpoint', fileName, categoryId, endpoint),
  updateApiEndpoint: (fileName, categoryId, endpoint) => ipcRenderer.invoke('update-api-endpoint', fileName, categoryId, endpoint),
  deleteApiEndpoint: (fileName, categoryId, endpointId) => ipcRenderer.invoke('delete-api-endpoint', fileName, categoryId, endpointId),
  // 窗口控制
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  // 页签管理
  createTab: (title, path, bounds) => ipcRenderer.send('create-tab', { title, path, bounds }),
  switchTab: (tabId) => ipcRenderer.send('switch-tab', tabId),
  closeTab: (tabId) => ipcRenderer.send('close-tab', tabId),
  // 页签事件监听
  onTabCreated: (callback) => ipcRenderer.on('tab-created', (event, tab) => callback(tab)),
  onTabSwitched: (callback) => ipcRenderer.on('tab-switched', (event, tabId) => callback(tabId)),
  onTabClosed: (callback) => ipcRenderer.on('tab-closed', (event, tabId) => callback(tabId)),
  // 导航事件
  navigateTo: (feature) => ipcRenderer.send('navigate-to', feature),
  onNavigateTo: (callback) => ipcRenderer.on('navigate-to', (event, feature) => callback(feature))
})