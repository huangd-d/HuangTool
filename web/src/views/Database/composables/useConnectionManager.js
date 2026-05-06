import { ref } from 'vue'

export function useConnectionManager(filterType) {
  const activeIds = ref(new Set())
  const idMap = ref(new Map())

  function add(savedId, runtimeId) {
    const s = new Set(activeIds.value)
    s.add(savedId)
    activeIds.value = s
    const m = new Map(idMap.value)
    m.set(savedId, runtimeId)
    idMap.value = m
  }

  function remove(savedId) {
    const s = new Set(activeIds.value)
    s.delete(savedId)
    activeIds.value = s
    const m = new Map(idMap.value)
    m.delete(savedId)
    idMap.value = m
  }

  function getRuntimeId(savedId) {
    return idMap.value.get(savedId)
  }

  function isConnected(savedId) {
    return activeIds.value.has(savedId)
  }

  async function connect(data) {
    const result = await window.electronAPI.dbConnect(data.config)
    add(data.id, result.id)
    return result
  }

  async function disconnect(data) {
    const runtimeId = getRuntimeId(data.id)
    if (runtimeId) await window.electronAPI.dbDisconnect(runtimeId)
    remove(data.id)
  }

  async function loadConnections() {
    const all = await window.electronAPI.dbSavedConnections()
    return filterType ? all.filter(c => c.type === filterType) : all
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
    activeIds, idMap,
    add, remove, getRuntimeId, isConnected,
    connect, disconnect, loadConnections, saveConnection, deleteConnection, testConnection
  }
}
