<template>
  <div class="db-tree">
    <div class="tree-header">
      <h3>🔗 MySQL</h3>
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
              <template v-if="data.type === 'connection'">🔗</template>
              <template v-else-if="data.type === 'database'">🗃</template>
              <template v-else-if="data.type === 'table'">⊞</template>
            </span>
            <span class="node-label">{{ data.name }}</span>
            <span v-if="data.type === 'table' && data.rowCount !== undefined" class="node-hint">{{ data.rowCount }}行</span>
            <span v-if="data.type === 'database' && data.keyCount !== undefined" class="node-hint">{{ data.keyCount }}键</span>
            <span class="node-actions">
              <span v-if="data.type === 'connection' && !conn.isConnected(data.id)" class="action-btn connect-btn" @click.stop="handleConnect(data)" title="连接">▶</span>
              <span v-if="data.type === 'connection' && conn.isConnected(data.id)" class="action-btn disconnect-btn" @click.stop="handleDisconnect(data)" title="断开">■</span>
              <span v-if="data.type === 'database'" class="action-btn refresh-btn" @click.stop="handleRefreshTables(data)" title="刷新表">↻</span>
              <el-dropdown trigger="click" @command="(cmd) => handleAction(cmd, data)" @click.stop>
                <span class="action-trigger">⋮</span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <template v-if="data.type === 'connection'">
                      <el-dropdown-item v-if="conn.isConnected(data.id)" command="createDatabase">新建数据库</el-dropdown-item>
                      <el-dropdown-item command="editConnection">编辑</el-dropdown-item>
                      <el-dropdown-item command="deleteConnection" divided class="danger-item">删除</el-dropdown-item>
                    </template>
                    <template v-if="data.type === 'database'">
                      <el-dropdown-item command="createTable">新建表</el-dropdown-item>
                      <el-dropdown-item command="dropDatabase" divided class="danger-item">删除数据库</el-dropdown-item>
                    </template>
                    <template v-if="data.type === 'table'">
                      <el-dropdown-item command="viewStructure">查看结构</el-dropdown-item>
                      <el-dropdown-item command="dropTable" divided class="danger-item">删除表</el-dropdown-item>
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
      db-type="mysql"
      :connection="editingConnection"
      @save="handleSaveConnection"
    />

    <CreateDatabaseDialog
      v-model="showCreateDatabaseDialog"
      :connection-name="createDatabaseTarget?.name || ''"
      @save="handleSaveCreateDatabase"
    />
    <CreateTableDialog
      v-model="showCreateTableDialog"
      :db-name="createTableTarget?.dbName || ''"
      @save="handleSaveCreateTable"
    />
    <TableStructureDialog
      v-model="showTableStructureDialog"
      :table-name="tableStructureTarget?.tableName || ''"
      :db-name="tableStructureTarget?.dbName || ''"
      :connection-id="tableStructureTarget?.runtimeId || ''"
      @structure-changed="handleStructureChanged"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useConnectionManager } from '../composables/useConnectionManager.js'
import ConnectionDialog from './dialogs/ConnectionDialog.vue'
import CreateDatabaseDialog from './dialogs/mysql/CreateDatabaseDialog.vue'
import CreateTableDialog from './dialogs/mysql/CreateTableDialog.vue'
import TableStructureDialog from './dialogs/mysql/TableStructureDialog.vue'

const emit = defineEmits([
  'select-connection',
  'select-database',
  'select-table',
  'connection-changed'
])

const conn = useConnectionManager('mysql')

const treeRef = ref(null)
const treeData = ref([])
const expandedKeys = ref([])
const treeProps = { children: 'children', label: 'name' }

const showConnectionDialog = ref(false)
const editingConnection = ref(null)
const editingSavedId = ref(null)

const showCreateDatabaseDialog = ref(false)
const createDatabaseTarget = ref(null)
const showCreateTableDialog = ref(false)
const createTableTarget = ref(null)
const showTableStructureDialog = ref(false)
const tableStructureTarget = ref(null)

function handleAction(command, data) {
  const actions = {
    createDatabase: () => handleCreateDatabase(data),
    editConnection: () => handleEditConnection(data),
    deleteConnection: () => handleDeleteConnection(data),
    createTable: () => handleCreateTable(data),
    dropDatabase: () => handleDropDatabase(data),
    viewStructure: () => handleViewTableStructure(data),
    dropTable: () => handleDropTable(data)
  }
  actions[command]?.()
}

onMounted(() => {
  loadConnections()
})

async function loadConnections() {
  try {
    const all = await window.electronAPI.dbSavedConnections()
    treeData.value = all.filter(c => c.type === 'mysql').map(c => ({
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
  else if (data.type === 'table') emit('select-table', data)
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
    loadTables(data)
  }
}

async function handleConnect(data) {
  try {
    const cfg = {
      type: data.config.type || 'mysql',
      host: data.config.host,
      port: parseInt(data.config.port, 10),
      user: data.config.user,
      password: data.config.password
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
      id: `${connectionNode.id}::${db}`,
      name: db,
      type: 'database',
      connectionId: connectionNode.id,
      dbName: db,
      children: []
    }))
  } catch (err) {
    console.error('加载数据库列表失败:', err)
    connectionNode.children = []
  }
}

async function loadTables(dbNode) {
  const runtimeId = conn.getRuntimeId(dbNode.connectionId)
  if (!runtimeId) return
  try {
    const tables = await window.electronAPI.dbCall(runtimeId, 'listTables', dbNode.dbName)
    dbNode.children = tables.map(t => ({
      id: `${dbNode.id}::${t.name}`,
      name: t.name,
      type: 'table',
      connectionId: dbNode.connectionId,
      dbName: dbNode.dbName,
      tableName: t.name,
      rowCount: t.rows,
      children: []
    }))
  } catch (err) {
    console.error('加载表列表失败:', err)
    dbNode.children = []
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

function handleCreateDatabase(data) {
  createDatabaseTarget.value = { id: data.id, name: data.name }
  showCreateDatabaseDialog.value = true
}

async function handleSaveCreateDatabase({ name, charset, collation }) {
  const runtimeId = conn.getRuntimeId(createDatabaseTarget.value.id)
  if (!runtimeId) return
  try {
    await window.electronAPI.dbCall(runtimeId, 'createDatabase', name, charset, collation)
    const connNode = treeData.value.find(n => n.id === createDatabaseTarget.value.id)
    if (connNode) await loadDatabases(connNode)
  } catch (err) {
    alert('创建数据库失败: ' + (err.message || '未知错误'))
  }
}

async function handleDropDatabase(data) {
  if (!confirm(`确定删除数据库 "${data.dbName}" 吗？此操作不可恢复！`)) return
  const runtimeId = conn.getRuntimeId(data.connectionId)
  if (!runtimeId) return
  try {
    await window.electronAPI.dbCall(runtimeId, 'dropDatabase', data.dbName)
    const connNode = treeData.value.find(n => n.id === data.connectionId)
    if (connNode) await loadDatabases(connNode)
  } catch (err) {
    alert('删除数据库失败: ' + (err.message || '未知错误'))
  }
}

function handleCreateTable(data) {
  createTableTarget.value = { connectionId: data.connectionId, dbName: data.dbName }
  showCreateTableDialog.value = true
}

async function handleSaveCreateTable({ tableName, columns }) {
  const runtimeId = conn.getRuntimeId(createTableTarget.value.connectionId)
  if (!runtimeId) return
  try {
    await window.electronAPI.dbCall(runtimeId, 'createTable', createTableTarget.value.dbName, tableName, columns)
    const connNode = treeData.value.find(n => n.id === createTableTarget.value.connectionId)
    if (connNode) {
      const dbNode = connNode.children?.find(n => n.dbName === createTableTarget.value.dbName)
      if (dbNode) await loadTables(dbNode)
    }
  } catch (err) {
    alert('创建表失败: ' + (err.message || '未知错误'))
  }
}

function handleViewTableStructure(data) {
  const runtimeId = conn.getRuntimeId(data.connectionId)
  tableStructureTarget.value = {
    connectionId: data.connectionId,
    runtimeId: runtimeId,
    dbName: data.dbName,
    tableName: data.tableName
  }
  showTableStructureDialog.value = true
}

async function handleDropTable(data) {
  if (!confirm(`确定删除表 "${data.tableName}" 吗？此操作不可恢复！`)) return
  const runtimeId = conn.getRuntimeId(data.connectionId)
  if (!runtimeId) return
  try {
    await window.electronAPI.dbCall(runtimeId, 'dropTable', data.dbName, data.tableName)
    const connNode = treeData.value.find(n => n.id === data.connectionId)
    if (connNode) {
      const dbNode = connNode.children?.find(n => n.dbName === data.dbName)
      if (dbNode) await loadTables(dbNode)
    }
  } catch (err) {
    alert('删除表失败: ' + (err.message || '未知错误'))
  }
}

async function handleRefreshTables(data) {
  const connNode = treeData.value.find(n => n.id === data.connectionId)
  if (!connNode) return
  const dbNode = connNode.children?.find(n => n.id === data.id)
  if (dbNode) {
    await loadTables(dbNode)
    if (!expandedKeys.value.includes(data.id)) {
      expandedKeys.value.push(data.id)
    }
  }
}

function handleStructureChanged() {
  if (!tableStructureTarget.value) return
  const { connectionId, dbName } = tableStructureTarget.value
  const connNode = treeData.value.find(n => n.id === connectionId)
  if (connNode) {
    const dbNode = connNode.children?.find(n => n.dbName === dbName)
    if (dbNode) loadTables(dbNode)
  }
}

defineExpose({ loadConnections, getRuntimeId: conn.getRuntimeId, isConnected: conn.isConnected })
</script>

<style scoped>
.db-tree {
  min-width: 0;
  /* display: flex; */
  flex-direction: column;
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
  /* flex: 1; */
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
.table-node .node-label {
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
