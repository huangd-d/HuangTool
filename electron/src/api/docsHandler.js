import fs from 'fs'
import path from 'path'
import { app, ipcMain } from 'electron'

// 获取文档目录
export async function getDocsDirectories() {
  const docsPath = path.join(app.getAppPath(), 'docs')
  try {
    const entries = await fs.promises.readdir(docsPath, { withFileTypes: true })
    return entries
      .filter(entry => entry.isDirectory())
      .map(dir => dir.name)
  } catch (error) {
    console.error('Error reading docs directory:', error)
    return []
  }
}

// 注册文档相关的 IPC 事件
export function registerDocsHandlers() {
  ipcMain.handle('get-docs-directories', async () => {
    return await getDocsDirectories()
  });

  ipcMain.handle('open-doc-window', async (event, dir) => {
    const { openDocWindow } = await import('../window/windowManager.js')
    return openDocWindow(dir)
  });
}