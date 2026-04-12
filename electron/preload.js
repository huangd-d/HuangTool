const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getVersions: () => process.versions,
  getDocsDirectories: () => ipcRenderer.invoke('get-docs-directories'),
  // API 请求
  sendApiRequest: (options) => ipcRenderer.invoke('send-api-request', options),
  getFullEndpoint: (projectName, categoryId, endpointId) => 
    ipcRenderer.invoke('get-full-endpoint', projectName, categoryId, endpointId),
  // API 项目管理
  getApiProjects: () => ipcRenderer.invoke('get-api-projects'),
  createApiProject: (project) => ipcRenderer.invoke('create-api-project', project),
  updateApiProject: (project) => ipcRenderer.invoke('update-api-project', project),
  deleteApiProject: (projectName) => ipcRenderer.invoke('delete-api-project', projectName),
  // API 分类管理
  getApiCategories: (projectName) => ipcRenderer.invoke('get-api-categories', projectName),
  createApiCategory: (projectName, category) => ipcRenderer.invoke('create-api-category', projectName, category),
  updateApiCategory: (projectName, category) => ipcRenderer.invoke('update-api-category', projectName, category),
  deleteApiCategory: (projectName, categoryId) => ipcRenderer.invoke('delete-api-category', projectName, categoryId),
  // API 接口管理
  getApiEndpoints: (projectName, categoryId) => ipcRenderer.invoke('get-api-endpoints', projectName, categoryId),
  createApiEndpoint: (projectName, categoryId, endpoint) => ipcRenderer.invoke('create-api-endpoint', projectName, categoryId, endpoint),
  updateApiEndpoint: (projectName, categoryId, endpoint) => ipcRenderer.invoke('update-api-endpoint', projectName, categoryId, endpoint),
  deleteApiEndpoint: (projectName, categoryId, endpointId) => ipcRenderer.invoke('delete-api-endpoint', projectName, categoryId, endpointId),
  // 窗口控制
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  // 页签管理
  createTab: (title, path) => ipcRenderer.send('create-tab', { title, path }),
  switchTab: (tabId) => ipcRenderer.send('switch-tab', tabId),
  closeTab: (tabId) => ipcRenderer.send('close-tab', tabId),
  // 页签事件监听
  onTabCreated: (callback) => ipcRenderer.on('tab-created', (event, tab) => callback(tab)),
  onTabSwitched: (callback) => ipcRenderer.on('tab-switched', (event, tabId) => callback(tabId)),
  onTabClosed: (callback) => ipcRenderer.on('tab-closed', (event, tabId) => callback(tabId))
})