import Redis from 'ioredis'

async function selectDb(client, db) {
  if (db !== undefined && db !== null) {
    await client.select(Number(db))
  }
}

function parseCommand(command) {
  const parts = []
  let current = ''
  let inQuote = false
  let quoteChar = ''
  for (let i = 0; i < command.length; i++) {
    const ch = command[i]
    if (inQuote) {
      if (ch === quoteChar) {
        inQuote = false
      } else {
        current += ch
      }
    } else if (ch === '"' || ch === "'") {
      inQuote = true
      quoteChar = ch
    } else if (ch === ' ' || ch === '\t') {
      if (current) {
        parts.push(current)
        current = ''
      }
    } else {
      current += ch
    }
  }
  if (current) parts.push(current)
  return parts
}

export default {
  type: 'redis',

  createClient(config) {
    const { host = '127.0.0.1', port = 6379, password, username, db } = config
    return new Redis({
      host, port: Number(port),
      password: password || undefined,
      username: username || undefined,
      db: db !== undefined ? Number(db) : undefined,
      connectTimeout: 5000
    })
  },

  healthCheck(client) {
    return client.ping()
  },

  disconnect(client) {
    client.disconnect()
  },

  getConnectionInfo(client) {
    return { host: client.options.host, port: client.options.port }
  },

  async listDatabases(client) {
    const result = await client.config('GET', 'databases')
    const dbCount = Number(result[1]) || 16
    const databases = []
    for (let i = 0; i < dbCount; i++) {
      let keyCount = 0
      try {
        await client.select(i)
        keyCount = await client.dbsize()
      } catch {
        // DB not available
      }
      databases.push({ db: i, keyCount })
    }
    await client.select(0)
    return databases
  },

  async listKeys(client, db, pattern = '*', cursor = '0', count = 200) {
    await selectDb(client, db)
    const start = Date.now()
    const [nextCursor, keys] = await client.scan(cursor, 'MATCH', pattern, 'COUNT', count)
    if (keys.length > 0) {
      const pipeline = client.pipeline()
      for (const key of keys) {
        pipeline.type(key)
        pipeline.ttl(key)
      }
      const results = await pipeline.exec()
      const keyInfos = keys.map((key, i) => ({
        name: key,
        type: results[i * 2][1],
        ttl: results[i * 2 + 1][1]
      }))
      return { cursor: nextCursor, keys: keyInfos, time: Date.now() - start }
    }
    return { cursor: nextCursor, keys: [], time: Date.now() - start }
  },

  async getKeyValue(client, db, key, keyType) {
    await selectDb(client, db)
    let value
    switch (keyType) {
      case 'string':
        value = await client.get(key)
        break
      case 'hash':
        value = await client.hgetall(key)
        break
      case 'list':
        value = await client.lrange(key, 0, -1)
        break
      case 'set':
        value = await client.smembers(key)
        break
      case 'zset':
        value = await client.zrange(key, 0, -1, 'WITHSCORES')
        break
      default:
        value = await client.get(key)
    }
    const ttl = await client.ttl(key)
    return { key, type: keyType, value, ttl }
  },

  async setKeyValue(client, db, key, keyType, value, ttl = -1) {
    await selectDb(client, db)
    await client.del(key)
    switch (keyType) {
      case 'string':
        await client.set(key, value)
        break
      case 'hash': {
        const fields = []
        for (const [field, val] of Object.entries(value)) {
          fields.push(field, val)
        }
        if (fields.length > 0) await client.hset(key, ...fields)
        break
      }
      case 'list':
        if (value.length > 0) await client.rpush(key, ...value)
        break
      case 'set':
        if (value.length > 0) await client.sadd(key, ...value)
        break
      case 'zset': {
        const scores = []
        for (const { score, member } of value) {
          scores.push(score, member)
        }
        if (scores.length > 0) await client.zadd(key, ...scores)
        break
      }
    }
    if (ttl > 0) {
      await client.expire(key, ttl)
    }
    return { key, type: keyType }
  },

  async deleteKey(client, db, key) {
    await selectDb(client, db)
    const deleted = await client.del(key)
    return { key, deleted }
  },

  async renameKey(client, db, oldKey, newKey) {
    await selectDb(client, db)
    await client.rename(oldKey, newKey)
    return { oldKey, newKey }
  },

  async getKeyInfo(client, db, key) {
    await selectDb(client, db)
    const [type, ttl, encoding] = await Promise.all([
      client.type(key),
      client.ttl(key),
      client.object('ENCODING', key).catch(() => null)
    ])
    return { key, type, ttl, encoding }
  },

  async setTTL(client, db, key, ttl) {
    await selectDb(client, db)
    if (ttl === -1) {
      await client.persist(key)
    } else {
      await client.expire(key, ttl)
    }
    return { key, ttl }
  },

  async executeCommand(client, db, command) {
    await selectDb(client, db)
    const parts = parseCommand(command)
    if (parts.length === 0) throw new Error('空命令')
    const start = Date.now()
    const result = await client.call(...parts)
    const time = Date.now() - start
    return { result, time }
  }
}
