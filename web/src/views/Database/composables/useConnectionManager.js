import { ref } from 'vue'

export function useConnectionManager() {
  const activeIds = ref(new Set())
  const idMap = ref(new Map())
  const typeMap = ref(new Map())

  function add(savedId, runtimeId, dbType) {
    const s = new Set(activeIds.value)
    s.add(savedId)
    activeIds.value = s
    const m = new Map(idMap.value)
    m.set(savedId, runtimeId)
    idMap.value = m
    const t = new Map(typeMap.value)
    t.set(savedId, dbType)
    typeMap.value = t
  }

  function remove(savedId) {
    const s = new Set(activeIds.value)
    s.delete(savedId)
    activeIds.value = s
    const m = new Map(idMap.value)
    m.delete(savedId)
    idMap.value = m
    const t = new Map(typeMap.value)
    t.delete(savedId)
    typeMap.value = t
  }

  function getRuntimeId(savedId) {
    return idMap.value.get(savedId)
  }

  function isConnected(savedId) {
    return activeIds.value.has(savedId)
  }

  function getConnectionType(savedId) {
    return typeMap.value.get(savedId)
  }

  async function connect(data) {
    const result = await window.electronAPI.dbConnect(data.config)
    add(data.id, result.id, data.config?.type || 'mysql')
    return result
  }

  async function disconnect(data) {
    const runtimeId = getRuntimeId(data.id)
    if (runtimeId) await window.electronAPI.dbDisconnect(runtimeId)
    remove(data.id)
  }

  async function loadConnections() {
    return window.electronAPI.dbSavedConnections()
  }

  async function saveConnection(config) {
    await window.electronAPI.dbSaveConnection(config)
  }

  async function deleteConnection(id) {
    await window.electronAPI.dbDeleteConnection(id)
  }

  async function testConnection(config) {
    return window.electronAPI.dbTest(config)
  }

  return {
    activeIds, idMap, typeMap,
    add, remove, getRuntimeId, isConnected, getConnectionType,
    connect, disconnect, loadConnections, saveConnection, deleteConnection, testConnection
  }
}
