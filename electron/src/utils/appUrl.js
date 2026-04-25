import { app } from 'electron'

export function getAppURL(routePath = '') {
  if (app.isPackaged) {
    return `app://app${routePath}`
  }
  return `http://localhost:5173${routePath}`
}
