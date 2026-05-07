<template>
  <BaseConnectionTree
    :connection="connection"
    :is-connected="connManager.isConnected(connection.id)"
    type-icon="🔴"
    @connect="handleConnect"
    @disconnect="handleDisconnect"
    @edit="handleEditConnection"
    @delete="handleDeleteConnection"
    @header-click="handleHeaderClick"
  >
    <el-tree
      v-if="treeData.length > 0"
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
        <div class="tree-node" :class="data.type + '-node'">
          <span class="node-icon">
            <template v-if="data.type === 'database'">🗃</template>
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
            <span v-if="data.type === 'database'" class="action-btn refresh-btn" @click.stop="handleRefreshKeys(data)" title="刷新Key">↻</span>
            <el-dropdown trigger="click" @command="(cmd) => handleAction(cmd, data)" @click.stop>
              <span class="action-trigger">⋮</span>
              <template #dropdown>
                <el-dropdown-menu>
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
  </BaseConnectionTree>
</template>

<script setup>
import { ref } from 'vue'
import BaseConnectionTree from './BaseConnectionTree.vue'
import ConnectionDialog from './dialogs/ConnectionDialog.vue'
import AddKeyDialog from './dialogs/redis/AddKeyDialog.vue'
import TTLDialog from './dialogs/redis/TTLDialog.vue'
import RenameDialog from './dialogs/redis/RenameDialog.vue'

const props = defineProps({
  connection: { type: Object, required: true },
  connManager: { type: Object, required: true }
})

const emit = defineEmits([
  'select-connection',
  'select-database',
  'select-key',
  'connection-changed',
  'connection-updated',
  'connection-deleted'
])

const treeRef = ref(null)
const treeData = ref([])
const expandedKeys = ref([])
const treeProps = { children: 'children', label: 'name' }

const dbCursors = ref(new Map())

const showConnectionDialog = ref(false)
const editingConnection = ref(null)

const showAddKeyDialog = ref(false)
const addKeyTarget = ref(null)
const showTTLDialog = ref(false)
const ttlTarget = ref(null)
const showRenameDialog = ref(false)
const renameTarget = ref(null)

function handleAction(command, data) {
  const actions = {
    addKey: () => handleAddKey(data),
    flushDb: () => handleFlushDb(data),
    editTTL: () => handleEditTTL(data),
    renameKey: () => handleRenameKey(data),
    deleteKey: () => handleDeleteKey(data)
  }
  actions[command]?.()
}

function handleHeaderClick() {
  emit('select-connection', {
    id: props.connection.id,
    name: props.connection.name,
    type: 'connection',
    config: props.connection
  })
}

function handleNodeClick(data) {
  if (data.type === 'database') emit('select-database', data)
  else if (data.type === 'key') emit('select-key', data)
}

function handleNodeCollapse(_data, node) {
  expandedKeys.value = expandedKeys.value.filter(k => k !== node.id)
}

function onNodeExpand(data) {
  if (!expandedKeys.value.includes(data.id)) {
    expandedKeys.value.push(data.id)
  }
  if (data.type === 'database' && !data.children.length) {
    loadKeys(data)
  }
}

async function handleConnect() {
  try {
    const cfg = {
      type: 'redis',
      host: props.connection.host || '127.0.0.1',
      port: parseInt(props.connection.port, 10) || 6379,
      username: props.connection.username,
      password: props.connection.password,
      db: props.connection.db || 0
    }
    const result = await window.electronAPI.dbConnect(cfg)
    props.connManager.add(props.connection.id, result.id, 'redis')
    await loadDatabases()
    emit('connection-changed', { savedId: props.connection.id, runtimeId: result.id, action: 'connect' })
  } catch (err) {
    alert('连接失败: ' + (err.message || '未知错误'))
  }
}

async function handleDisconnect() {
  const rid = props.connManager.getRuntimeId(props.connection.id)
  emit('connection-changed', { savedId: props.connection.id, runtimeId: rid, action: 'disconnect' })
  try {
    if (rid) await window.electronAPI.dbDisconnect(rid)
  } catch (err) {
    console.error('断开连接错误:', err)
  }
  props.connManager.remove(props.connection.id)
  treeData.value = []
  expandedKeys.value = []
  dbCursors.value.clear()
}

async function loadDatabases() {
  const runtimeId = props.connManager.getRuntimeId(props.connection.id)
  if (!runtimeId) return
  try {
    const result = await window.electronAPI.dbCall(runtimeId, 'listDatabases')
    treeData.value = result.map(db => ({
      id: `${props.connection.id}::db${db.db}`,
      name: `db${db.db}`,
      type: 'database',
      connectionId: props.connection.id,
      dbNumber: db.db,
      keyCount: db.keyCount,
      children: []
    }))
  } catch (err) {
    console.error('加载数据库列表失败:', err)
    treeData.value = []
  }
}

async function loadKeys(dbNode, append = false) {
  const runtimeId = props.connManager.getRuntimeId(props.connection.id)
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
      connectionId: props.connection.id,
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

function handleEditConnection() {
  editingConnection.value = { ...props.connection }
  showConnectionDialog.value = true
}

async function handleSaveConnection(formData) {
  try {
    formData.id = props.connection.id
    await window.electronAPI.dbSaveConnection(formData)
    emit('connection-updated')
  } catch (err) {
    alert('保存失败: ' + (err.message || '未知错误'))
  }
}

async function handleDeleteConnection() {
  if (!confirm(`确定删除连接 "${props.connection.name}" ？`)) return
  if (props.connManager.isConnected(props.connection.id)) {
    await handleDisconnect()
  }
  try {
    await window.electronAPI.dbDeleteConnection(props.connection.id)
    emit('connection-deleted', props.connection.id)
  } catch (err) {
    alert('删除失败: ' + (err.message || '未知错误'))
  }
}

function handleAddKey(data) {
  addKeyTarget.value = {
    connectionId: props.connection.id,
    dbNumber: data.dbNumber
  }
  showAddKeyDialog.value = true
}

async function handleSaveAddKey({ keyName, keyType, value, ttl }) {
  if (!addKeyTarget.value) return
  const runtimeId = props.connManager.getRuntimeId(props.connection.id)
  if (!runtimeId) return
  try {
    await window.electronAPI.dbCall(runtimeId, 'setKeyValue', addKeyTarget.value.dbNumber, keyName, keyType, value, ttl)
    const dbNode = treeData.value.find(n => n.dbNumber === addKeyTarget.value.dbNumber)
    if (dbNode) await loadKeys(dbNode)
  } catch (err) {
    alert('创建Key失败: ' + (err.message || '未知错误'))
  }
}

async function handleDeleteKey(data) {
  if (!confirm(`确定删除Key "${data.name}" 吗？`)) return
  const runtimeId = props.connManager.getRuntimeId(props.connection.id)
  if (!runtimeId) return
  try {
    await window.electronAPI.dbCall(runtimeId, 'deleteKey', data.dbNumber, data.name)
    const dbNode = treeData.value.find(n => n.dbNumber === data.dbNumber)
    if (dbNode) await loadKeys(dbNode)
  } catch (err) {
    alert('删除Key失败: ' + (err.message || '未知错误'))
  }
}

function handleEditTTL(data) {
  ttlTarget.value = {
    connectionId: props.connection.id,
    dbNumber: data.dbNumber,
    keyName: data.name,
    ttl: data.ttl
  }
  showTTLDialog.value = true
}

async function handleSaveTTL({ keyName, ttl }) {
  if (!ttlTarget.value) return
  const runtimeId = props.connManager.getRuntimeId(props.connection.id)
  if (!runtimeId) return
  try {
    await window.electronAPI.dbCall(runtimeId, 'setTTL', ttlTarget.value.dbNumber, keyName, ttl)
    const dbNode = treeData.value.find(n => n.dbNumber === ttlTarget.value.dbNumber)
    if (dbNode) await loadKeys(dbNode)
  } catch (err) {
    alert('修改TTL失败: ' + (err.message || '未知错误'))
  }
}

function handleRenameKey(data) {
  renameTarget.value = {
    connectionId: props.connection.id,
    dbNumber: data.dbNumber,
    keyName: data.name
  }
  showRenameDialog.value = true
}

async function handleSaveRename({ oldKey, newKey }) {
  if (!renameTarget.value) return
  const runtimeId = props.connManager.getRuntimeId(props.connection.id)
  if (!runtimeId) return
  try {
    await window.electronAPI.dbCall(runtimeId, 'renameKey', renameTarget.value.dbNumber, oldKey, newKey)
    const dbNode = treeData.value.find(n => n.dbNumber === renameTarget.value.dbNumber)
    if (dbNode) await loadKeys(dbNode)
  } catch (err) {
    alert('重命名失败: ' + (err.message || '未知错误'))
  }
}

async function handleFlushDb(data) {
  if (!confirm(`确定清空 db${data.dbNumber} 的所有Key吗？此操作不可恢复！`)) return
  const runtimeId = props.connManager.getRuntimeId(props.connection.id)
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

defineExpose({ handleConnect })
</script>

<style scoped>
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

:deep(.el-tree-node__content:hover) .node-actions {
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

.action-btn.refresh-btn {
  font-size: 13px;
}

.database-node .node-label,
.key-node .node-label {
  font-size: 12px;
}
</style>
