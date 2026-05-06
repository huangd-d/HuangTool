import { ipcMain } from 'electron'
import * as manager from './connection-manager.js'
import { getSavedConnections, saveConnection, deleteSavedConnection } from './config.js'
import mysqlStrategy from './strategies/mysql.js'
import redisStrategy from './strategies/redis.js'

manager.registerStrategy(mysqlStrategy.type, mysqlStrategy)
manager.registerStrategy(redisStrategy.type, redisStrategy)

export function registerDatabaseHandlers() {
  ipcMain.handle('db-connect', (_, config) => manager.createConnection(config))
  ipcMain.handle('db-disconnect', (_, id) => manager.disconnectConnection(id))
  ipcMain.handle('db-test', (_, config) => manager.testConnection(config))
  ipcMain.handle('db-connections', () => manager.getActiveConnections())

  ipcMain.handle('db-saved-connections', () => getSavedConnections())
  ipcMain.handle('db-save-connection', (_, config) => saveConnection(config))
  ipcMain.handle('db-delete-connection', (_, id) => deleteSavedConnection(id))

  ipcMain.handle('db-call', (_, connectionId, method, ...args) => {
    return manager.call(connectionId, method, ...args)
  })
}
