import mysql from 'mysql2/promise'

const ALLOWED_CHARSETS = [
  'utf8mb4', 'utf8', 'latin1', 'ascii', 'gbk', 'gb2312', 'big5',
  'ucs2', 'binary', 'cp1250', 'cp1251', 'cp1256', 'cp1257',
  'eucjpms', 'euckr', 'gb18030', 'greek', 'hebrew', 'hp8',
  'keybcs2', 'koi8r', 'koi8u', 'latin2', 'latin5', 'latin7',
  'macce', 'macroman', 'sjis', 'swe7', 'tis620', 'ujis'
]

export default {
  type: 'mysql',

  createClient(config) {
    const { host, port, user, password } = config
    return mysql.createConnection({ host, port: Number(port), user, password })
  },

  healthCheck(conn) {
    return conn.query('SELECT 1')
  },

  disconnect(conn) {
    return conn.end()
  },

  getConnectionInfo(conn) {
    return { host: conn.config.host, port: conn.config.port, user: conn.config.user }
  },

  async listDatabases(conn) {
    const [rows] = await conn.query('SHOW DATABASES')
    return rows.map(r => r.Database)
  },

  async listTables(conn, database) {
    await conn.changeUser({ database })
    const [rows] = await conn.query('SHOW TABLE STATUS')
    return rows.map(r => ({
      name: r.Name,
      engine: r.Engine,
      rows: r.Rows,
      comment: r.Comment || ''
    }))
  },

  async executeQuery(conn, database, sql) {
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
  },

  async createDatabase(conn, databaseName, charset = 'utf8mb4', collation = 'utf8mb4_general_ci') {
    if (!ALLOWED_CHARSETS.includes(charset)) throw new Error(`不支持的字符集: ${charset}`)
    await conn.query(`CREATE DATABASE \`${databaseName}\` CHARACTER SET ${charset} COLLATE ${collation}`)
    return { databaseName }
  },

  async dropDatabase(conn, databaseName) {
    await conn.query(`DROP DATABASE \`${databaseName}\``)
    return { databaseName }
  },

  async createTable(conn, database, tableName, columns) {
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
  },

  async dropTable(conn, database, tableName) {
    await conn.changeUser({ database })
    await conn.query(`DROP TABLE \`${tableName}\``)
    return { tableName }
  },

  async getTableStructure(conn, database, tableName) {
    await conn.changeUser({ database })
    const [rows] = await conn.query(`DESCRIBE \`${tableName}\``)
    return rows
  },

  async alterTableAddColumn(conn, database, tableName, column) {
    await conn.changeUser({ database })
    let def = `\`${column.name}\` ${column.type}`
    if (!column.nullable) def += ' NOT NULL'
    if (column.defaultValue !== undefined && column.defaultValue !== '') def += ` DEFAULT '${column.defaultValue}'`
    await conn.query(`ALTER TABLE \`${tableName}\` ADD COLUMN ${def}`)
    return { tableName, column: column.name }
  }
}
