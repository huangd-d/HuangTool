<template>
  <div class="db-tree">
    <div class="tree-header">
      <h3>🔴 Redis</h3>
      <div class="tree-actions">
        <button class="btn-icon" @click="handleAddConnection" title="新建连接">+</button>
      </div>
    </div>

    <div class="tree-body" v-if="treeData.length > 0">
      <el-tree
        ref="treeRef"
        :data="treeData"
        :props="treeProps"
        node-key="id"
        :expanded-keys="expandedKeys"
        @node-click="handleNodeClick"
        @node-expand="onNodeExpand"
        @node-collapse="handleNodeCollapse"
      >
        <template #default="{ node, data }">
          <div class="tree-node" :class="[data.type + '-node', { 'is-connected': data.type === 'connection' && conn.isConnected(data.id) }]">
            <span class="node-icon">
              <template v-if="data.type === 'connection'">🔴</template>
              <template v-else-if="data.type === 'database'">🗃</template>
              <template v-else-if="data.type === 'key'">
                <template v-if="data.keyType === 'string'">📝</template>
                <template v-else-if="data.keyType === 'hash'">🏷</template>
                <template v-else-if="data.keyType === 'list'">📋</template>
                <template v-else-if="data.keyType === 'set'">🔶</template>
                <template v-else-if="data.keyType === 'zset'">💎</template>
                <template v-else>🔑</template>
              </template>
            </span>
            <span class="node-label">{{ data.name }}</span>
            <span v-if="data.type === 'database' && data.keyCount !== undefined" class="node-hint">{{ data.keyCount }}键</span>
            <span v-if="data.type === 'key' && data.ttl !== undefined && data.ttl > 0" class="node-hint ttl">{{ data.ttl }}s</span>
            <span class="node-actions">
              <span v-if="data.type === 'connection' && !conn.isConnected(data.id)" class="action-btn connect-btn" @click.stop="handleConnect(data)" title="连接">▶</span>
              <span v-if="data.type === 'connection' && conn.isConnected(data.id)" class="action-btn disconnect-btn" @click.stop="handleDisconnect(data)" title="断开">■</span>
              <span v-if="data.type === 'database'" class="action-btn refresh-btn" @click.stop="handleRefreshKeys(data)" title="刷新Key">↻</span>
              <el-dropdown trigger="click" @command="(cmd) => handleAction(cmd, data)" @click.stop>
                <span class="action-trigger">⋮</span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <template v-if="data.type === 'connection'">
                      <el-dropdown-item command="editConnection">编辑</el-dropdown-item>
                      <el-dropdown-item command="deleteConnection" divided class="danger-item">删除</el-dropdown-item>
                    </template>
                    <template v-if="data.type === 'database'">
                      <el-dropdown-item command="addKey">新建Key</el-dropdown-item>
                      <el-dropdown-item command="flushDb" divided class="danger-item">清空DB</el-dropdown-item>
                    </template>
                    <template v-if="data.type === 'key'">
                      <el-dropdown-item command="editTTL">编辑TTL</el-dropdown-item>
                      <el-dropdown-item command="renameKey">重命名</el-dropdown-item>
                      <el-dropdown-item command="deleteKey" divided class="danger-item">删除Key</el-dropdown-item>
                    </template>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </span>
          </div>
        </template>
      </el-tree>
    </div>

    <ConnectionDialog
      v-model="showConnectionDialog"
      db-type="redis"
      :connection="editingConnection"
      @save="handleSaveConnection"
    />

    <AddKeyDialog
      v-model="showAddKeyDialog"
      :db-number="addKeyTarget?.dbNumber"
      @save="handleSaveAddKey"
    />
    <TTLDialog
      v-model="showTTLDialog"
      :key-name="ttlTarget?.keyName || ''"
      :current-ttl="ttlTarget?.ttl"
      @save="handleSaveTTL"
    />
    <RenameDialog
      v-model="showRenameDialog"
      :key-name="renameTarget?.keyName || ''"
      @save="handleSaveRename"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useConnectionManager } from '../composables/useConnectionManager.js'
import ConnectionDialog from './dialogs/ConnectionDialog.vue'
import AddKeyDialog from './dialogs/redis/AddKeyDialog.vue'
import TTLDialog from './dialogs/redis/TTLDialog.vue'
import RenameDialog from './dialogs/redis/RenameDialog.vue'

const emit = defineEmits([
  'select-connection',
  'select-database',
  'select-key',
  'connection-changed'
])

const conn = useConnectionManager('redis')

const treeRef = ref(null)
const treeData = ref([])
const expandedKeys = ref([])
const treeProps = { children: 'children', label: 'name' }

const dbCursors = ref(new Map())

const showConnectionDialog = ref(false)
const editingConnection = ref(null)
const editingSavedId = ref(null)

const showAddKeyDialog = ref(false)
const addKeyTarget = ref(null)
const showTTLDialog = ref(false)
const ttlTarget = ref(null)
const showRenameDialog = ref(false)
const renameTarget = ref(null)

function handleAction(command, data) {
  const actions = {
    editConnection: () => handleEditConnection(data),
    deleteConnection: () => handleDeleteConnection(data),
    addKey: () => handleAddKey(data),
    flushDb: () => handleFlushDb(data),
    editTTL: () => handleEditTTL(data),
    renameKey: () => handleRenameKey(data),
    deleteKey: () => handleDeleteKey(data)
  }
  actions[command]?.()
}

onMounted(() => {
  loadConnections()
})

async function loadConnections() {
  try {
    const all = await window.electronAPI.dbSavedConnections()
    treeData.value = all.filter(c => c.type === 'redis').map(c => ({
      id: c.id,
      name: c.name || `${c.host}:${c.port}`,
      type: 'connection',
      config: c,
      children: []
    }))
  } catch (err) {
    console.error('加载连接列表失败:', err)
  }
}

function handleNodeClick(data) {
  if (data.type === 'connection') emit('select-connection', data)
  else if (data.type === 'database') emit('select-database', data)
  else if (data.type === 'key') emit('select-key', data)
}

function handleNodeCollapse(_data, node) {
  expandedKeys.value = expandedKeys.value.filter(k => k !== node.id)
}

function onNodeExpand(data) {
  if (!expandedKeys.value.includes(data.id)) {
    expandedKeys.value.push(data.id)
  }
  if (data.type === 'connection' && conn.isConnected(data.id) && !data.children.length) {
    loadDatabases(data)
  }
  if (data.type === 'database' && !data.children.length) {
    loadKeys(data)
  }
}

async function handleConnect(data) {
  try {
    const cfg = {
      type: 'redis',
      host: data.config.host || '127.0.0.1',
      port: parseInt(data.config.port, 10) || 6379,
      username: data.config.username,
      password: data.config.password,
      db: data.config.db || 0
    }
    const result = await window.electronAPI.dbConnect(cfg)
    conn.add(data.id, result.id)
    data.children = []
    expandedKeys.value.push(data.id)
    await loadDatabases(data)
    emit('connection-changed', { savedId: data.id, runtimeId: result.id, action: 'connect' })
  } catch (err) {
    alert('连接失败: ' + (err.message || '未知错误'))
  }
}

async function handleDisconnect(data) {
  const runtimeId = conn.getRuntimeId(data.id)
  try {
    if (runtimeId) await window.electronAPI.dbDisconnect(runtimeId)
  } catch (err) {
    console.error('断开连接错误:', err)
  }
  conn.remove(data.id)
  data.children = []
  expandedKeys.value = expandedKeys.value.filter(k => k !== data.id)
  emit('connection-changed', { savedId: data.id, runtimeId: null, action: 'disconnect' })
}

async function loadDatabases(connectionNode) {
  const runtimeId = conn.getRuntimeId(connectionNode.id)
  if (!runtimeId) return
  try {
    const result = await window.electronAPI.dbCall(runtimeId, 'listDatabases')
    connectionNode.children = result.map(db => ({
      id: `${connectionNode.id}::db${db.db}`,
      name: `db${db.db}`,
      type: 'database',
      connectionId: connectionNode.id,
      dbNumber: db.db,
      keyCount: db.keyCount,
      children: []
    }))
  } catch (err) {
    console.error('加载数据库列表失败:', err)
    connectionNode.children = []
  }
}

async function loadKeys(dbNode, append = false) {
  const runtimeId = conn.getRuntimeId(dbNode.connectionId)
  if (!runtimeId) return
  try {
    const cursor = append ? (dbCursors.value.get(dbNode.id) || '0') : '0'
    if (append && cursor === '0') return
    const result = await window.electronAPI.dbCall(runtimeId, 'listKeys', dbNode.dbNumber, '*', cursor, 200)
    dbCursors.value.set(dbNode.id, result.cursor)
    const keyNodes = result.keys.map(k => ({
      id: `${dbNode.id}::${k.name}`,
      name: k.name,
      type: 'key',
      connectionId: dbNode.connectionId,
      dbNumber: dbNode.dbNumber,
      keyType: k.type,
      ttl: k.ttl,
      children: []
    }))
    if (append) {
      dbNode.children = [...dbNode.children, ...keyNodes]
    } else {
      dbNode.children = keyNodes
    }
    dbNode.keyCount = dbNode.children.length
  } catch (err) {
    console.error('加载Key列表失败:', err)
    if (!append) dbNode.children = []
  }
}

function handleAddConnection() {
  editingConnection.value = null
  editingSavedId.value = null
  showConnectionDialog.value = true
}

function handleEditConnection(data) {
  editingConnection.value = { ...data.config }
  editingSavedId.value = data.id
  showConnectionDialog.value = true
}

async function handleDeleteConnection(data) {
  if (!confirm(`确定删除连接 "${data.name}" ？`)) return
  if (conn.isConnected(data.id)) {
    await handleDisconnect(data)
  }
  try {
    await window.electronAPI.dbDeleteConnection(data.id)
    await loadConnections()
    emit('connection-changed', { savedId: data.id, runtimeId: null, action: 'delete' })
  } catch (err) {
    alert('删除失败: ' + (err.message || '未知错误'))
  }
}

async function handleSaveConnection(formData) {
  const isCreating = !editingSavedId.value
  try {
    if (editingSavedId.value) {
      formData.id = editingSavedId.value
    }
    await window.electronAPI.dbSaveConnection(formData)
    await loadConnections()
    if (isCreating && treeData.value.length > 0) {
      const newNode = treeData.value[treeData.value.length - 1]
      await handleConnect(newNode)
    }
  } catch (err) {
    alert('保存失败: ' + (err.message || '未知错误'))
  }
}

function handleAddKey(data) {
  addKeyTarget.value = {
    connectionId: data.connectionId,
    dbNumber: data.dbNumber
  }
  showAddKeyDialog.value = true
}

async function handleSaveAddKey({ keyName, keyType, value, ttl }) {
  if (!addKeyTarget.value) return
  const runtimeId = conn.getRuntimeId(addKeyTarget.value.connectionId)
  if (!runtimeId) return
  try {
    await window.electronAPI.dbCall(runtimeId, 'setKeyValue', addKeyTarget.value.dbNumber, keyName, keyType, value, ttl)
    const connNode = treeData.value.find(n => n.id === addKeyTarget.value.connectionId)
    if (connNode) {
      const dbNode = connNode.children?.find(n => n.dbNumber === addKeyTarget.value.dbNumber)
      if (dbNode) await loadKeys(dbNode)
    }
  } catch (err) {
    alert('创建Key失败: ' + (err.message || '未知错误'))
  }
}

async function handleDeleteKey(data) {
  if (!confirm(`确定删除Key "${data.name}" 吗？`)) return
  const runtimeId = conn.getRuntimeId(data.connectionId)
  if (!runtimeId) return
  try {
    await window.electronAPI.dbCall(runtimeId, 'deleteKey', data.dbNumber, data.name)
    const connNode = treeData.value.find(n => n.id === data.connectionId)
    if (connNode) {
      const dbNode = connNode.children?.find(n => n.dbNumber === data.dbNumber)
      if (dbNode) await loadKeys(dbNode)
    }
  } catch (err) {
    alert('删除Key失败: ' + (err.message || '未知错误'))
  }
}

function handleEditTTL(data) {
  ttlTarget.value = {
    connectionId: data.connectionId,
    dbNumber: data.dbNumber,
    keyName: data.name,
    ttl: data.ttl
  }
  showTTLDialog.value = true
}

async function handleSaveTTL({ keyName, ttl }) {
  if (!ttlTarget.value) return
  const runtimeId = conn.getRuntimeId(ttlTarget.value.connectionId)
  if (!runtimeId) return
  try {
    await window.electronAPI.dbCall(runtimeId, 'setTTL', ttlTarget.value.dbNumber, keyName, ttl)
    const connNode = treeData.value.find(n => n.id === ttlTarget.value.connectionId)
    if (connNode) {
      const dbNode = connNode.children?.find(n => n.dbNumber === ttlTarget.value.dbNumber)
      if (dbNode) await loadKeys(dbNode)
    }
  } catch (err) {
    alert('修改TTL失败: ' + (err.message || '未知错误'))
  }
}

function handleRenameKey(data) {
  renameTarget.value = {
    connectionId: data.connectionId,
    dbNumber: data.dbNumber,
    keyName: data.name
  }
  showRenameDialog.value = true
}

async function handleSaveRename({ oldKey, newKey }) {
  if (!renameTarget.value) return
  const runtimeId = conn.getRuntimeId(renameTarget.value.connectionId)
  if (!runtimeId) return
  try {
    await window.electronAPI.dbCall(runtimeId, 'renameKey', renameTarget.value.dbNumber, oldKey, newKey)
    const connNode = treeData.value.find(n => n.id === renameTarget.value.connectionId)
    if (connNode) {
      const dbNode = connNode.children?.find(n => n.dbNumber === renameTarget.value.dbNumber)
      if (dbNode) await loadKeys(dbNode)
    }
  } catch (err) {
    alert('重命名失败: ' + (err.message || '未知错误'))
  }
}

async function handleFlushDb(data) {
  if (!confirm(`确定清空 db${data.dbNumber} 的所有Key吗？此操作不可恢复！`)) return
  const runtimeId = conn.getRuntimeId(data.connectionId)
  if (!runtimeId) return
  try {
    await window.electronAPI.dbCall(runtimeId, 'executeCommand', data.dbNumber, 'FLUSHDB')
    data.children = []
    data.keyCount = 0
    dbCursors.value.delete(data.id)
  } catch (err) {
    alert('清空DB失败: ' + (err.message || '未知错误'))
  }
}

async function handleRefreshKeys(data) {
  dbCursors.value.delete(data.id)
  await loadKeys(data, false)
  if (!expandedKeys.value.includes(data.id)) {
    expandedKeys.value.push(data.id)
  }
}

defineExpose({ loadConnections, getRuntimeId: conn.getRuntimeId, isConnected: conn.isConnected })
</script>

<style scoped>
.db-tree {
  min-width: 0;
  /* display: flex; */
  /* flex-direction: column; */
  background: var(--content-bg-card);
  /* overflow: hidden; */
}

.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid var(--content-border);
  flex-shrink: 0;
}

.tree-header h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--accent);
}

.tree-actions {
  display: flex;
  gap: 4px;
}

.btn-icon {
  width: 22px;
  height: 22px;
  border: none;
  background: rgba(255, 144, 0, 0.1);
  color: var(--accent);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.btn-icon:hover {
  background: var(--accent);
  color: #FFFFFF;
}

.tree-body {
  flex: 1;
}

.tree-body :deep(.el-tree) {
  background: transparent;
}

.tree-body :deep(.el-tree-node__content) {
  height: 28px;
  padding-right: 8px;
}

.tree-body :deep(.el-tree-node__content:hover) {
  background-color: var(--content-bg);
}

.tree-body :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: var(--content-bg);
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  font-size: 13px;
  color: var(--content-text);
  overflow: hidden;
}

.node-icon {
  font-size: 12px;
  flex-shrink: 0;
}

.node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-hint {
  font-size: 11px;
  color: var(--content-text-hint);
  flex-shrink: 0;
}

.node-hint.ttl {
  color: var(--accent);
}

.node-actions {
  display: none;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.tree-body :deep(.el-tree-node__content:hover) .node-actions {
  display: flex;
}

.action-trigger {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  color: var(--content-text-hint);
  font-size: 14px;
  cursor: pointer;
  font-weight: 700;
  letter-spacing: 1px;
  transition: all 0.2s;
}

.action-trigger:hover {
  color: var(--accent);
  background: rgba(255, 144, 0, 0.1);
}

.action-btn {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  color: var(--content-text-hint);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}

.action-btn:hover {
  color: var(--accent);
  background: rgba(255, 144, 0, 0.1);
}

.action-btn.disconnect-btn:hover {
  color: var(--error);
  background: rgba(217, 48, 37, 0.1);
}

.action-btn.connect-btn {
  color: var(--accent);
}

.action-btn.refresh-btn {
  font-size: 13px;
}

.db-tree :deep(.el-dropdown-menu) {
  background: var(--content-bg-card);
  border: 1px solid var(--content-border);
  padding: 4px;
}

.db-tree :deep(.el-dropdown-menu__item) {
  color: var(--content-text);
  font-size: 12px;
  padding: 5px 12px;
  border-radius: 3px;
}

.db-tree :deep(.el-dropdown-menu__item:hover) {
  background: rgba(255, 144, 0, 0.1);
  color: var(--accent);
}

.db-tree :deep(.el-dropdown-menu__item.danger-item) {
  color: #ff3b30;
}

.db-tree :deep(.el-dropdown-menu__item.danger-item:hover) {
  background: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
}

.db-tree :deep(.el-dropdown-menu__item--divided:before) {
  border-top-color: var(--content-border);
  margin: 4px 0;
}

.connection-node.is-connected .node-label {
  color: var(--accent);
  font-weight: 600;
}

.database-node .node-label,
.key-node .node-label {
  font-size: 12px;
}

.tree-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--content-text-hint);
  font-size: 12px;
  padding: 16px 0;
}

.btn-add {
  padding: 6px 16px;
  background: var(--accent);
  color: #FFFFFF;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  transition: background 0.2s;
}

.btn-add:hover {
  background: var(--accent-hover);
}
</style>
