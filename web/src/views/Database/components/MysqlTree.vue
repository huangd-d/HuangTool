<template>
  <BaseConnectionTree
    :connection="connection"
    :is-connected="connManager.isConnected(connection.id)"
    type-icon="🔗"
    @connect="handleConnect"
    @disconnect="handleDisconnect"
    @edit="handleEditConnection"
    @delete="handleDeleteConnection"
    @header-click="handleHeaderClick"
  >
    <template #header-extra>
      <el-dropdown-item v-if="connManager.isConnected(connection.id)" command="createDatabase">新建数据库</el-dropdown-item>
    </template>

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
            <template v-else-if="data.type === 'table'">⊞</template>
          </span>
          <span class="node-label">{{ data.name }}</span>
          <span v-if="data.type === 'table' && data.rowCount !== undefined" class="node-hint">{{ data.rowCount }}行</span>
          <span class="node-actions">
            <span v-if="data.type === 'database'" class="action-btn refresh-btn" @click.stop="handleRefreshTables(data)" title="刷新表">↻</span>
            <el-dropdown trigger="click" @command="(cmd) => handleAction(cmd, data)" @click.stop>
              <span class="action-trigger">⋮</span>
              <template #dropdown>
                <el-dropdown-menu>
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

    <ConnectionDialog
      v-model="showConnectionDialog"
      db-type="mysql"
      :connection="editingConnection"
      @save="handleSaveConnection"
    />

    <CreateDatabaseDialog
      v-model="showCreateDatabaseDialog"
      :connection-name="connection.name || ''"
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
  </BaseConnectionTree>
</template>

<script setup>
import { ref } from 'vue'
import BaseConnectionTree from './BaseConnectionTree.vue'
import ConnectionDialog from './dialogs/ConnectionDialog.vue'
import CreateDatabaseDialog from './dialogs/mysql/CreateDatabaseDialog.vue'
import CreateTableDialog from './dialogs/mysql/CreateTableDialog.vue'
import TableStructureDialog from './dialogs/mysql/TableStructureDialog.vue'

const props = defineProps({
  connection: { type: Object, required: true },
  connManager: { type: Object, required: true }
})

const emit = defineEmits([
  'select-connection',
  'select-database',
  'select-table',
  'connection-changed',
  'connection-updated',
  'connection-deleted'
])

const treeRef = ref(null)
const treeData = ref([])
const expandedKeys = ref([])
const treeProps = { children: 'children', label: 'name' }

const showConnectionDialog = ref(false)
const editingConnection = ref(null)

const showCreateDatabaseDialog = ref(false)
const showCreateTableDialog = ref(false)
const createTableTarget = ref(null)
const showTableStructureDialog = ref(false)
const tableStructureTarget = ref(null)

function handleAction(command, data) {
  const actions = {
    createDatabase: () => handleCreateDatabase(),
    createTable: () => handleCreateTable(data),
    dropDatabase: () => handleDropDatabase(data),
    viewStructure: () => handleViewTableStructure(data),
    dropTable: () => handleDropTable(data)
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
  else if (data.type === 'table') emit('select-table', data)
}

function handleNodeCollapse(_data, node) {
  expandedKeys.value = expandedKeys.value.filter(k => k !== node.id)
}

function onNodeExpand(data) {
  if (!expandedKeys.value.includes(data.id)) {
    expandedKeys.value.push(data.id)
  }
  if (data.type === 'database' && !data.children.length) {
    loadTables(data)
  }
}

async function handleConnect() {
  try {
    const cfg = {
      type: props.connection.type || 'mysql',
      host: props.connection.host,
      port: parseInt(props.connection.port, 10),
      user: props.connection.user,
      password: props.connection.password
    }
    const result = await window.electronAPI.dbConnect(cfg)
    props.connManager.add(props.connection.id, result.id, 'mysql')
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
}

async function loadDatabases() {
  const runtimeId = props.connManager.getRuntimeId(props.connection.id)
  if (!runtimeId) return
  try {
    const result = await window.electronAPI.dbCall(runtimeId, 'listDatabases')
    treeData.value = result.map(db => ({
      id: `${props.connection.id}::${db}`,
      name: db,
      type: 'database',
      connectionId: props.connection.id,
      dbName: db,
      children: []
    }))
  } catch (err) {
    console.error('加载数据库列表失败:', err)
    treeData.value = []
  }
}

async function loadTables(dbNode) {
  const runtimeId = props.connManager.getRuntimeId(props.connection.id)
  if (!runtimeId) return
  try {
    const tables = await window.electronAPI.dbCall(runtimeId, 'listTables', dbNode.dbName)
    dbNode.children = tables.map(t => ({
      id: `${dbNode.id}::${t.name}`,
      name: t.name,
      type: 'table',
      connectionId: props.connection.id,
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

function handleCreateDatabase() {
  showCreateDatabaseDialog.value = true
}

async function handleSaveCreateDatabase({ name, charset, collation }) {
  const runtimeId = props.connManager.getRuntimeId(props.connection.id)
  if (!runtimeId) return
  try {
    await window.electronAPI.dbCall(runtimeId, 'createDatabase', name, charset, collation)
    await loadDatabases()
  } catch (err) {
    alert('创建数据库失败: ' + (err.message || '未知错误'))
  }
}

async function handleDropDatabase(data) {
  if (!confirm(`确定删除数据库 "${data.dbName}" 吗？此操作不可恢复！`)) return
  const runtimeId = props.connManager.getRuntimeId(props.connection.id)
  if (!runtimeId) return
  try {
    await window.electronAPI.dbCall(runtimeId, 'dropDatabase', data.dbName)
    await loadDatabases()
  } catch (err) {
    alert('删除数据库失败: ' + (err.message || '未知错误'))
  }
}

function handleCreateTable(data) {
  createTableTarget.value = { connectionId: props.connection.id, dbName: data.dbName }
  showCreateTableDialog.value = true
}

async function handleSaveCreateTable({ tableName, columns }) {
  if (!createTableTarget.value) return
  const runtimeId = props.connManager.getRuntimeId(props.connection.id)
  if (!runtimeId) return
  try {
    await window.electronAPI.dbCall(runtimeId, 'createTable', createTableTarget.value.dbName, tableName, columns)
    const dbNode = treeData.value.find(n => n.dbName === createTableTarget.value.dbName)
    if (dbNode) await loadTables(dbNode)
  } catch (err) {
    alert('创建表失败: ' + (err.message || '未知错误'))
  }
}

function handleViewTableStructure(data) {
  const runtimeId = props.connManager.getRuntimeId(props.connection.id)
  tableStructureTarget.value = {
    connectionId: props.connection.id,
    runtimeId: runtimeId,
    dbName: data.dbName,
    tableName: data.tableName
  }
  showTableStructureDialog.value = true
}

async function handleDropTable(data) {
  if (!confirm(`确定删除表 "${data.tableName}" 吗？此操作不可恢复！`)) return
  const runtimeId = props.connManager.getRuntimeId(props.connection.id)
  if (!runtimeId) return
  try {
    await window.electronAPI.dbCall(runtimeId, 'dropTable', data.dbName, data.tableName)
    const dbNode = treeData.value.find(n => n.dbName === data.dbName)
    if (dbNode) await loadTables(dbNode)
  } catch (err) {
    alert('删除表失败: ' + (err.message || '未知错误'))
  }
}

async function handleRefreshTables(data) {
  await loadTables(data)
  if (!expandedKeys.value.includes(data.id)) {
    expandedKeys.value.push(data.id)
  }
}

function handleStructureChanged() {
  if (!tableStructureTarget.value) return
  const { dbName } = tableStructureTarget.value
  const dbNode = treeData.value.find(n => n.dbName === dbName)
  if (dbNode) loadTables(dbNode)
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
.table-node .node-label {
  font-size: 12px;
}
</style>
