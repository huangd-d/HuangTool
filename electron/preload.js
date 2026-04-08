const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getVersions: () => process.versions,
  getDocsDirectories: () => ipcRenderer.invoke('get-docs-directories'),
  openDocWindow: (dir) => ipcRenderer.invoke('open-doc-window', dir),
  sendApiRequest: (options) => ipcRenderer.invoke('send-api-request', options),
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
  closeWindow: () => ipcRenderer.send('close-window')
})