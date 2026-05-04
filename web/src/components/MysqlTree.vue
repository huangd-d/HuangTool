<template>
  <div class="mysql-tree">
    <div class="tree-header">
      <h3>数据库</h3>
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
          <div class="tree-node" :class="[data.type + '-node', { 'is-connected': data.type === 'connection' && activeConnectionIds.has(data.id) }]">
            <span class="node-icon">
              <template v-if="data.type === 'connection'">🔗</template>
              <template v-else-if="data.type === 'database'">🗃</template>
              <template v-else-if="data.type === 'table'">⊞</template>
            </span>
            <span class="node-label">{{ data.name }}</span>
            <span v-if="data.type === 'table' && data.rowCount !== undefined" class="node-hint">{{ data.rowCount }}行</span>
            <span class="node-actions">
              <el-dropdown trigger="click" @command="(cmd) => handleAction(cmd, data)" @click.stop>
                <span class="action-trigger">⋮</span>
                <template #dropdown>
                  <el-dropdown-menu>
                    <!-- 连接节点 -->
                    <template v-if="data.type === 'connection'">
                      <el-dropdown-item v-if="activeConnectionIds.has(data.id)" command="createDatabase">新建数据库</el-dropdown-item>
                      <el-dropdown-item v-if="!activeConnectionIds.has(data.id)" command="connect">连接</el-dropdown-item>
                      <el-dropdown-item v-if="activeConnectionIds.has(data.id)" command="disconnect">断开</el-dropdown-item>
                      <el-dropdown-item command="editConnection">编辑</el-dropdown-item>
                      <el-dropdown-item command="deleteConnection" divided class="danger-item">删除</el-dropdown-item>
                    </template>
                    <!-- 数据库节点 -->
                    <template v-if="data.type === 'database'">
                      <el-dropdown-item command="createTable">新建表</el-dropdown-item>
                      <el-dropdown-item command="refreshTables">刷新表</el-dropdown-item>
                      <el-dropdown-item command="dropDatabase" divided class="danger-item">删除数据库</el-dropdown-item>
                    </template>
                    <!-- 表节点 -->
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

    <div class="tree-empty" v-else>
      <p>暂无连接</p>
      <button class="btn-add" @click="handleAddConnection">+ 新建连接</button>
    </div>

    <ConnectionDialog
      v-model="showConnectionDialog"
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
import ConnectionDialog from './dialogs/ConnectionDialog.vue'
import CreateDatabaseDialog from './dialogs/CreateDatabaseDialog.vue'
import CreateTableDialog from './dialogs/CreateTableDialog.vue'
import TableStructureDialog from './dialogs/TableStructureDialog.vue'

const emit = defineEmits([
  'select-connection',
  'select-database',
  'select-table',
  'connection-changed'
])

const treeRef = ref(null)
const treeData = ref([])
const expandedKeys = ref([])
const activeConnectionIds = ref(new Set())
const activeConnectionMap = ref(new Map())

// 连接弹框
const showConnectionDialog = ref(false)
const editingConnection = ref(null)
const editingSavedId = ref(null)

// 建库弹框
const showCreateDatabaseDialog = ref(false)
const createDatabaseTarget = ref(null)

// 建表弹框
const showCreateTableDialog = ref(false)
const createTableTarget = ref(null)

// 表结构弹框
const showTableStructureDialog = ref(false)
const tableStructureTarget = ref(null)

const treeProps = { children: 'children', label: 'name' }

// ===== 下拉菜单操作分发 =====

function handleAction(command, data) {
  switch (command) {
    case 'createDatabase': handleCreateDatabase(data); break
    case 'connect': handleConnect(data); break
    case 'disconnect': handleDisconnect(data); break
    case 'editConnection': handleEditConnection(data); break
    case 'deleteConnection': handleDeleteConnection(data); break
    case 'createTable': handleCreateTable(data); break
    case 'refreshTables': handleRefreshTables(data); break
    case 'dropDatabase': handleDropDatabase(data); break
    case 'viewStructure': handleViewTableStructure(data); break
    case 'dropTable': handleDropTable(data); break
  }
}

onMounted(() => {
  loadConnections()
})

function addActiveConnection(savedId, runtimeId) {
  const newSet = new Set(activeConnectionIds.value)
  newSet.add(savedId)
  activeConnectionIds.value = newSet
  const newMap = new Map(activeConnectionMap.value)
  newMap.set(savedId, runtimeId)
  activeConnectionMap.value = newMap
}

function removeActiveConnection(savedId) {
  const newSet = new Set(activeConnectionIds.value)
  newSet.delete(savedId)
  activeConnectionIds.value = newSet
  const newMap = new Map(activeConnectionMap.value)
  newMap.delete(savedId)
  activeConnectionMap.value = newMap
}

async function loadConnections() {
  try {
    if (!window.electronAPI?.mysqlGetSavedConnections) return
    const connections = await window.electronAPI.mysqlGetSavedConnections()
    treeData.value = connections.map(c => ({
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
  if (data.type === 'connection') {
    emit('select-connection', data)
  } else if (data.type === 'database') {
    emit('select-database', data)
  } else if (data.type === 'table') {
    emit('select-table', data)
  }
}

function handleNodeCollapse(_data, node) {
  expandedKeys.value = expandedKeys.value.filter(k => k !== node.id)
}

function onNodeExpand(data, node) {
  if (!expandedKeys.value.includes(node.id)) {
    expandedKeys.value.push(node.id)
  }
  if (data.type === 'connection' && activeConnectionIds.value.has(data.id)) {
    loadDatabases(data)
  }
  if (data.type === 'database') {
    loadTables(data)
  }
}

// ===== 连接管理 =====

async function handleConnect(data) {
  try {
    if (!window.electronAPI?.mysqlConnect) return
    const cfg = data.config
    const result = await window.electronAPI.mysqlConnect({
      type: cfg.type || 'mysql',
      host: cfg.host,
      port: parseInt(cfg.port, 10),
      user: cfg.user,
      password: cfg.password
    })
    addActiveConnection(data.id, result.id)
    data.children = []
    expandedKeys.value.push(data.id)
    await loadDatabases(data)
    emit('connection-changed', { savedId: data.id, runtimeId: result.id, action: 'connect' })
  } catch (err) {
    alert('连接失败: ' + (err.message || '未知错误'))
  }
}

async function handleDisconnect(data) {
  const runtimeId = activeConnectionMap.value.get(data.id)
  try {
    if (runtimeId && window.electronAPI?.mysqlDisconnect) {
      await window.electronAPI.mysqlDisconnect(runtimeId)
    }
  } catch (err) {
    console.error('断开连接错误:', err)
  }
  removeActiveConnection(data.id)
  data.children = []
  expandedKeys.value = expandedKeys.value.filter(k => k !== data.id)
  emit('connection-changed', { savedId: data.id, runtimeId: null, action: 'disconnect' })
}

async function loadDatabases(connectionNode) {
  const runtimeId = activeConnectionMap.value.get(connectionNode.id)
  if (!runtimeId) return
  try {
    if (!window.electronAPI?.mysqlListDatabases) return
    const dbs = await window.electronAPI.mysqlListDatabases(runtimeId)
    connectionNode.children = dbs.map(db => ({
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
  const runtimeId = activeConnectionMap.value.get(dbNode.connectionId)
  if (!runtimeId) return
  try {
    if (!window.electronAPI?.mysqlListTables) return
    const tables = await window.electronAPI.mysqlListTables(runtimeId, dbNode.dbName)
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

// ===== 连接配置 CRUD =====

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
  if (activeConnectionIds.value.has(data.id)) {
    await handleDisconnect(data)
  }
  try {
    if (window.electronAPI?.mysqlDeleteSavedConnection) {
      await window.electronAPI.mysqlDeleteSavedConnection(data.id)
    }
    await loadConnections()
    emit('connection-changed', { savedId: data.id, runtimeId: null, action: 'delete' })
  } catch (err) {
    alert('删除失败: ' + (err.message || '未知错误'))
  }
}

async function handleSaveConnection(formData) {
  const isCreating = !editingSavedId.value
  try {
    if (window.electronAPI?.mysqlSaveConnection) {
      if (editingSavedId.value) {
        formData.id = editingSavedId.value
      }
      await window.electronAPI.mysqlSaveConnection(formData)
    }
    await loadConnections()
    if (isCreating && treeData.value.length > 0) {
      const newNode = treeData.value[treeData.value.length - 1]
      await handleConnect(newNode)
    }
  } catch (err) {
    alert('保存失败: ' + (err.message || '未知错误'))
  }
}

// ===== 数据库 CRUD =====

function handleCreateDatabase(data) {
  createDatabaseTarget.value = { id: data.id, name: data.name }
  showCreateDatabaseDialog.value = true
}

async function handleSaveCreateDatabase({ name, charset, collation }) {
  const runtimeId = activeConnectionMap.value.get(createDatabaseTarget.value.id)
  if (!runtimeId) return
  try {
    await window.electronAPI.mysqlCreateDatabase(runtimeId, name, charset, collation)
    const connNode = treeData.value.find(n => n.id === createDatabaseTarget.value.id)
    if (connNode) await loadDatabases(connNode)
  } catch (err) {
    alert('创建数据库失败: ' + (err.message || '未知错误'))
  }
}

async function handleDropDatabase(data) {
  if (!confirm(`确定删除数据库 "${data.dbName}" 吗？此操作不可恢复！`)) return
  const runtimeId = activeConnectionMap.value.get(data.connectionId)
  if (!runtimeId) return
  try {
    await window.electronAPI.mysqlDropDatabase(runtimeId, data.dbName)
    const connNode = treeData.value.find(n => n.id === data.connectionId)
    if (connNode) await loadDatabases(connNode)
  } catch (err) {
    alert('删除数据库失败: ' + (err.message || '未知错误'))
  }
}

// ===== 表 CRUD =====

function handleCreateTable(data) {
  createTableTarget.value = { connectionId: data.connectionId, dbName: data.dbName }
  showCreateTableDialog.value = true
}

async function handleSaveCreateTable({ tableName, columns }) {
  const runtimeId = activeConnectionMap.value.get(createTableTarget.value.connectionId)
  if (!runtimeId) return
  try {
    await window.electronAPI.mysqlCreateTable(runtimeId, createTableTarget.value.dbName, tableName, columns)
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
  const runtimeId = activeConnectionMap.value.get(data.connectionId)
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
  const runtimeId = activeConnectionMap.value.get(data.connectionId)
  if (!runtimeId) return
  try {
    await window.electronAPI.mysqlDropTable(runtimeId, data.dbName, data.tableName)
    const connNode = treeData.value.find(n => n.id === data.connectionId)
    if (connNode) {
      const dbNode = connNode.children?.find(n => n.dbName === data.dbName)
      if (dbNode) await loadTables(dbNode)
    }
  } catch (err) {
    alert('删除表失败: ' + (err.message || '未知错误'))
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

// ===== 暴露给父组件 =====

function getRuntimeId(savedId) {
  return activeConnectionMap.value.get(savedId)
}

function isConnected(savedId) {
  return activeConnectionIds.value.has(savedId)
}

defineExpose({ loadConnections, getRuntimeId, isConnected })
</script>

<style scoped>
.mysql-tree {
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--content-border);
  background: var(--content-bg-card);
  overflow: hidden;
}

.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--content-border);
  flex-shrink: 0;
}

.tree-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--accent);
}

.tree-actions {
  display: flex;
  gap: 4px;
}

.btn-icon {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(255, 144, 0, 0.1);
  color: var(--accent);
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
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
  overflow-y: auto;
}

.tree-body :deep(.el-tree) {
  background: transparent;
}

.tree-body :deep(.el-tree-node__content) {
  height: 32px;
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

/* 下拉菜单暗黑主题 */
.mysql-tree :deep(.el-dropdown-menu) {
  background: var(--content-bg-card);
  border: 1px solid var(--content-border);
  padding: 4px;
}

.mysql-tree :deep(.el-dropdown-menu__item) {
  color: var(--content-text);
  font-size: 12px;
  padding: 5px 12px;
  border-radius: 3px;
}

.mysql-tree :deep(.el-dropdown-menu__item:hover) {
  background: rgba(255, 144, 0, 0.1);
  color: var(--accent);
}

.mysql-tree :deep(.el-dropdown-menu__item.danger-item) {
  color: #ff3b30;
}

.mysql-tree :deep(.el-dropdown-menu__item.danger-item:hover) {
  background: rgba(255, 59, 48, 0.1);
  color: #ff3b30;
}

.mysql-tree :deep(.el-dropdown-menu__item--divided:before) {
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
  gap: 12px;
  color: var(--content-text-hint);
  font-size: 13px;
}

.btn-add {
  padding: 8px 20px;
  background: var(--accent);
  color: #FFFFFF;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  transition: background 0.2s;
}

.btn-add:hover {
  background: var(--accent-hover);
}

.tree-body::-webkit-scrollbar {
  width: 6px;
}

.tree-body::-webkit-scrollbar-track {
  background: #000000;
}

.tree-body::-webkit-scrollbar-thumb {
  background: var(--accent);
  border-radius: 3px;
}

.tree-body::-webkit-scrollbar-thumb:hover {
  background: var(--accent-hover);
}
</style>
