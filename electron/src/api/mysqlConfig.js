import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CONFIG_FILE = path.join(__dirname, '..', '..', 'swagger', 'mysql-connections.json')

function ensureConfigFile() {
  if (!fs.existsSync(CONFIG_FILE)) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ connections: [] }, null, 2))
  }
}

export function getSavedConnections() {
  ensureConfigFile()
  return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')).connections
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
