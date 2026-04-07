const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getVersions: () => process.versions,
  getDocsDirectories: () => ipcRenderer.invoke('get-docs-directories'),
  openDocWindow: (dir) => ipcRenderer.invoke('open-doc-window', dir)
})