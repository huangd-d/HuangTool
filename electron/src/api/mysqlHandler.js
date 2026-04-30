import { ipcMain } from 'electron'
import {
  createConnection,
  disconnectConnection,
  listDatabases,
  listTables,
  executeQuery,
  getActiveConnections,
  testConnection,
  createDatabase,
  dropDatabase,
  createTable,
  dropTable,
  getTableStructure,
  alterTableAddColumn
} from './mysqlConnection.js'
import {
  getSavedConnections,
  saveConnection,
  deleteSavedConnection
} from './mysqlConfig.js'

export function registerMysqlHandlers() {
  ipcMain.handle('mysql-connect', async (_event, config) => {
    return await createConnection(config)
  })

  ipcMain.handle('mysql-disconnect', async (_event, connectionId) => {
    return await disconnectConnection(connectionId)
  })

  ipcMain.handle('mysql-list-databases', async (_event, connectionId) => {
    return await listDatabases(connectionId)
  })

  ipcMain.handle('mysql-list-tables', async (_event, connectionId, database) => {
    return await listTables(connectionId, database)
  })

  ipcMain.handle('mysql-execute-query', async (_event, connectionId, database, sql) => {
    return await executeQuery(connectionId, database, sql)
  })

  ipcMain.handle('mysql-get-connections', async () => {
    return getActiveConnections()
  })

  // 保存的连接配置 CRUD
  ipcMain.handle('mysql-get-saved-connections', async () => {
    return getSavedConnections()
  })

  ipcMain.handle('mysql-save-connection', async (_event, config) => {
    return saveConnection(config)
  })

  ipcMain.handle('mysql-delete-saved-connection', async (_event, id) => {
    return deleteSavedConnection(id)
  })

  // 连接测试
  ipcMain.handle('mysql-test-connection', async (_event, config) => {
    return await testConnection(config)
  })

  // 数据库操作
  ipcMain.handle('mysql-create-database', async (_event, connectionId, databaseName, charset, collation) => {
    return await createDatabase(connectionId, databaseName, charset, collation)
  })

  ipcMain.handle('mysql-drop-database', async (_event, connectionId, databaseName) => {
    return await dropDatabase(connectionId, databaseName)
  })

  // 表操作
  ipcMain.handle('mysql-create-table', async (_event, connectionId, database, tableName, columns) => {
    return await createTable(connectionId, database, tableName, columns)
  })

  ipcMain.handle('mysql-drop-table', async (_event, connectionId, database, tableName) => {
    return await dropTable(connectionId, database, tableName)
  })

  ipcMain.handle('mysql-get-table-structure', async (_event, connectionId, database, tableName) => {
    return await getTableStructure(connectionId, database, tableName)
  })

  ipcMain.handle('mysql-alter-table-add-column', async (_event, connectionId, database, tableName, column) => {
    return await alterTableAddColumn(connectionId, database, tableName, column)
  })
}
