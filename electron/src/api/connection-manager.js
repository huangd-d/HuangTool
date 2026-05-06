const strategies = new Map()
const connections = new Map()
let nextId = 1

function getConnection(id) {
  const entry = connections.get(id)
  if (!entry) throw new Error(`连接 ${id} 不存在`)
  return entry
}

export function registerStrategy(type, strategy) {
  strategies.set(type, strategy)
}

export function getStrategy(type) {
  const strategy = strategies.get(type)
  if (!strategy) throw new Error(`未注册的数据库类型: ${type}`)
  return strategy
}

export async function testConnection(config) {
  const strategy = getStrategy(config.type || 'mysql')
  const client = await strategy.createClient(config)
  try {
    await strategy.healthCheck(client)
    return { success: true, type: config.type || 'mysql' }
  } finally {
    strategy.disconnect(client)
  }
}

export async function createConnection(config) {
  const type = config.type || 'mysql'
  const strategy = getStrategy(type)
  const client = await strategy.createClient(config)
  await strategy.healthCheck(client)
  const id = String(nextId++)
  connections.set(id, { client, type, strategy })
  const info = strategy.getConnectionInfo(client)
  return { id, ...info, type }
}

export async function disconnectConnection(id) {
  const { client, strategy } = getConnection(id)
  strategy.disconnect(client)
  connections.delete(id)
  return true
}

export function getActiveConnections() {
  const list = []
  for (const [id, { client, type, strategy }] of connections) {
    const info = strategy.getConnectionInfo(client)
    list.push({ id, ...info, type })
  }
  return list
}

export async function call(id, method, ...args) {
  const { client, strategy } = getConnection(id)
  if (typeof strategy[method] !== 'function') {
    throw new Error(`策略 ${strategy.type} 不支持方法: ${method}`)
  }
  return strategy[method](client, ...args)
}
