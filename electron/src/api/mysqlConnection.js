import mysql from 'mysql2/promise'

const connections = new Map()
let nextId = 1

const ALLOWED_CHARSETS = [
  'utf8mb4', 'utf8', 'latin1', 'ascii', 'gbk', 'gb2312', 'big5',
  'ucs2', 'binary', 'cp1250', 'cp1251', 'cp1256', 'cp1257',
  'eucjpms', 'euckr', 'gb18030', 'greek', 'hebrew', 'hp8',
  'keybcs2', 'koi8r', 'koi8u', 'latin2', 'latin5', 'latin7',
  'macce', 'macroman', 'sjis', 'swe7', 'tis620', 'ujis'
]

function getConnection(connectionId) {
  const entry = connections.get(connectionId)
  if (!entry) throw new Error(`连接 ${connectionId} 不存在`)
  return entry
}

export async function testConnection(config) {
  const { type = 'mysql', host, port, user, password } = config
  const conn = await mysql.createConnection({ host, port: Number(port), user, password })
  await conn.query('SELECT 1')
  await conn.end()
  return { success: true, type }
}

export async function createConnection(config) {
  const { type = 'mysql', host, port, user, password } = config
  const conn = await mysql.createConnection({ host, port: Number(port), user, password })
  await conn.query('SELECT 1')
  const id = String(nextId++)
  connections.set(id, { conn, type })
  return { id, host, port: Number(port), user, type }
}

export async function disconnectConnection(connectionId) {
  const { conn } = getConnection(connectionId)
  await conn.end()
  connections.delete(connectionId)
  return true
}

export async function listDatabases(connectionId) {
  const { conn } = getConnection(connectionId)
  const [rows] = await conn.query('SHOW DATABASES')
  return rows.map(r => r.Database)
}

export async function listTables(connectionId, database) {
  const { conn } = getConnection(connectionId)
  await conn.changeUser({ database })
  const [rows] = await conn.query('SHOW TABLE STATUS')
  return rows.map(r => ({
    name: r.Name,
    engine: r.Engine,
    rows: r.Rows,
    comment: r.Comment || ''
  }))
}

export async function executeQuery(connectionId, database, sql) {
  const { conn } = getConnection(connectionId)
  if (database) {
    await conn.changeUser({ database })
  }
  const start = Date.now()
  const [result] = await conn.query(sql)
  const time = Date.now() - start

  if (Array.isArray(result)) {
    const columns = result.length > 0 ? Object.keys(result[0]) : []
    return { columns, rows: result, affectedRows: undefined, insertId: undefined, time }
  }

  return {
    columns: [],
    rows: [],
    affectedRows: result.affectedRows,
    insertId: result.insertId,
    changedRows: result.changedRows,
    time
  }
}

export function getActiveConnections() {
  const list = []
  for (const [id, { conn, type }] of connections) {
    list.push({ id, host: conn.config.host, port: conn.config.port, user: conn.config.user, type })
  }
  return list
}

export async function createDatabase(connectionId, databaseName, charset = 'utf8mb4', collation = 'utf8mb4_general_ci') {
  const { conn } = getConnection(connectionId)
  if (!ALLOWED_CHARSETS.includes(charset)) throw new Error(`不支持的字符集: ${charset}`)
  await conn.query(`CREATE DATABASE \`${databaseName}\` CHARACTER SET ${charset} COLLATE ${collation}`)
  return { databaseName }
}

export async function dropDatabase(connectionId, databaseName) {
  const { conn } = getConnection(connectionId)
  await conn.query(`DROP DATABASE \`${databaseName}\``)
  return { databaseName }
}

export async function createTable(connectionId, database, tableName, columns) {
  const { conn } = getConnection(connectionId)
  await conn.changeUser({ database })
  const colDefs = columns.map(col => {
    let def = `\`${col.name}\` ${col.type}`
    if (col.isPrimaryKey) def += ' PRIMARY KEY'
    if (col.isAutoIncrement) def += ' AUTO_INCREMENT'
    if (!col.nullable && !col.isPrimaryKey) def += ' NOT NULL'
    if (col.defaultValue !== undefined && col.defaultValue !== '') def += ` DEFAULT '${col.defaultValue}'`
    return def
  })
  await conn.query(`CREATE TABLE \`${tableName}\` (${colDefs.join(', ')})`)
  return { tableName }
}

export async function dropTable(connectionId, database, tableName) {
  const { conn } = getConnection(connectionId)
  await conn.changeUser({ database })
  await conn.query(`DROP TABLE \`${tableName}\``)
  return { tableName }
}

export async function getTableStructure(connectionId, database, tableName) {
  const { conn } = getConnection(connectionId)
  await conn.changeUser({ database })
  const [rows] = await conn.query(`DESCRIBE \`${tableName}\``)
  return rows
}

export async function alterTableAddColumn(connectionId, database, tableName, column) {
  const { conn } = getConnection(connectionId)
  await conn.changeUser({ database })
  let def = `\`${column.name}\` ${column.type}`
  if (!column.nullable) def += ' NOT NULL'
  if (column.defaultValue !== undefined && column.defaultValue !== '') def += ` DEFAULT '${column.defaultValue}'`
  await conn.query(`ALTER TABLE \`${tableName}\` ADD COLUMN ${def}`)
  return { tableName, column: column.name }
}
