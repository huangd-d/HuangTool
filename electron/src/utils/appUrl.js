import { app } from 'electron'

const DEV_SERVER_URL = 'http://localhost:5173'

export function getAppURL(routePath = '') {
  if (!app.isPackaged) {
    return `${DEV_SERVER_URL}${routePath}`
  }
  return `app://web-dist${routePath}`
}
