import { app } from 'electron'
import path from 'path'

export function getSwaggerPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'swagger')
    : path.join(app.getAppPath(), 'swagger')
}

export function getDocsPath() {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'docs')
    : path.join(app.getAppPath(), 'docs')
}
