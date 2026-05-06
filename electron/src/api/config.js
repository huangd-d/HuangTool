import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATABASE_DIR = path.join(__dirname, '..', '..', 'database')
const CONFIG_FILE = path.join(DATABASE_DIR, 'database-connections.json')

function ensureConfigFile() {
  if (!fs.existsSync(DATABASE_DIR)) {
    fs.mkdirSync(DATABASE_DIR, { recursive: true })
  }
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ connections: [] }, null, 2))
  }
}

function migrateConnections(data) {
  let changed = false
  for (const conn of data.connections) {
    if (conn.type === 'database') {
      conn.type = 'mysql'
      changed = true
    }
  }
  if (changed) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2))
  }
  return data
}

export function getSavedConnections() {
  ensureConfigFile()
  const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
  return migrateConnections(data).connections
}

export function saveConnection(config) {
  ensureConfigFile()
  const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
  if (config.id) {
    const idx = data.connections.findIndex(c => c.id === config.id)
    if (idx >= 0) {
      data.connections[idx] = { ...data.connections[idx], ...config }
    } else {
      data.connections.push(config)
    }
  } else {
    if (!config.type) config.type = 'mysql'
    config.id = Date.now().toString()
    data.connections.push(config)
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2))
  return config
}

export function deleteSavedConnection(id) {
  ensureConfigFile()
  const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'))
  data.connections = data.connections.filter(c => c.id !== id)
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2))
  return true
}
