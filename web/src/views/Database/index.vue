<template>
  <div class="database-container">
    <div class="database-sidebar">
      <div class="sidebar-header">
        <h3>连接</h3>
        <el-dropdown trigger="hover" @command="handleAddConnection">
          <button class="btn-icon" title="新建连接">+</button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="mysql">MySQL</el-dropdown-item>
              <el-dropdown-item command="redis">Redis</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>

      <div class="db-tree-area">
        <component
          v-for="conn in allConnections"
          :key="conn.id"
          :is="treeComponents[conn.type] || treeComponents.mysql"
          :connection="conn"
          :conn-manager="connManager"
          @select-connection="handleSelectConnection"
          @select-database="handleSelectDatabase"
          @select-table="handleSelectTable"
          @select-key="handleSelectKey"
          @connection-changed="handleConnectionChanged"
          @connection-updated="loadAllConnections"
          @connection-deleted="handleConnectionDeleted"
        />
      </div>
    </div>

    <div class="database-content">
      <component
        v-if="runtimeId"
        :is="panels[activePanel]"
        :runtime-id="runtimeId"
        :current-db="activeDb"
        :table-name="selectedTable"
        :key-name="selectedKey"
        :key-type="selectedKeyType"
        @query-executed="handleQueryExecuted"
        @command-executed="handleCommandExecuted"
        @key-deleted="handleKeyDeleted"
        @key-saved="handleKeySaved"
      />
      <div v-else class="empty-state">
        <h3>请连接数据库</h3>
        <p>从左侧树中点击 ▶ 连接数据库，或新建连接</p>
      </div>
    </div>
  </div>

  <ConnectionDialog
    v-model="showNewConnectionDialog"
    :db-type="newConnectionType"
    @save="handleSaveNewConnection"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useConnectionManager } from './composables/useConnectionManager.js'
import { treeComponents } from './components/treeRegistry.js'
import { panels } from './components/panels/index.js'
import ConnectionDialog from './components/dialogs/ConnectionDialog.vue'

const connManager = useConnectionManager()

const allConnections = ref([])
const activePanel = ref('mysql')
const runtimeId = ref(null)
const activeDb = ref('')
const selectedTable = ref('')
const selectedKey = ref('')
const selectedKeyType = ref('')

const showNewConnectionDialog = ref(false)
const newConnectionType = ref('mysql')

onMounted(() => {
  loadAllConnections()
})

async function loadAllConnections() {
  try {
    allConnections.value = await connManager.loadConnections()
  } catch (err) {
    console.error('加载连接列表失败:', err)
  }
}

function getPanelType(savedId) {
  const type = connManager.getConnectionType(savedId)
  if (type === 'redis') return 'redis'
  return 'mysql'
}

function handleSelectConnection(data) {
  const rid = connManager.getRuntimeId(data.id)
  if (rid) {
    const panel = getPanelType(data.id)
    activePanel.value = panel
    runtimeId.value = rid
    activeDb.value = panel === 'redis' ? '0' : ''
    selectedTable.value = ''
    selectedKey.value = ''
  }
}

function handleSelectDatabase(data) {
  const rid = connManager.getRuntimeId(data.connectionId)
  if (rid) {
    const panel = getPanelType(data.connectionId)
    activePanel.value = panel
    runtimeId.value = rid
    activeDb.value = panel === 'redis' ? String(data.dbNumber) : data.dbName
    selectedTable.value = ''
    selectedKey.value = ''
  }
}

function handleSelectTable(data) {
  const rid = connManager.getRuntimeId(data.connectionId)
  if (rid) {
    activePanel.value = 'mysql'
    runtimeId.value = rid
    activeDb.value = data.dbName
    selectedTable.value = data.tableName
  }
}

function handleSelectKey(data) {
  const rid = connManager.getRuntimeId(data.connectionId)
  if (rid) {
    activePanel.value = 'redis'
    runtimeId.value = rid
    activeDb.value = String(data.dbNumber)
    selectedKey.value = data.name
    selectedKeyType.value = data.keyType
  }
}

function handleConnectionChanged({ savedId, runtimeId: rid, action }) {
  if (action === 'connect' && rid) {
    const panel = getPanelType(savedId)
    activePanel.value = panel
    runtimeId.value = rid
    activeDb.value = panel === 'redis' ? '0' : ''
    selectedTable.value = ''
    selectedKey.value = ''
  } else if (action === 'disconnect' || action === 'delete') {
    if (runtimeId.value === rid) {
      runtimeId.value = null
      activeDb.value = ''
      selectedTable.value = ''
      selectedKey.value = ''
    }
  }
}

function handleConnectionDeleted(savedId) {
  // If disconnect already cleared the panel, getRuntimeId returns undefined
  // For non-connected deletions, check and clear if needed
  const rid = connManager.getRuntimeId(savedId)
  if (rid && runtimeId.value === rid) {
    runtimeId.value = null
    activeDb.value = ''
    selectedTable.value = ''
    selectedKey.value = ''
  }
  loadAllConnections()
}

function handleAddConnection(dbType) {
  newConnectionType.value = dbType
  showNewConnectionDialog.value = true
}

async function handleSaveNewConnection(formData) {
  try {
    await window.electronAPI.dbSaveConnection(formData)
    await loadAllConnections()
  } catch (err) {
    alert('保存失败: ' + (err.message || '未知错误'))
  }
}

function handleQueryExecuted() {}
function handleCommandExecuted() {}

function handleKeyDeleted() {
  selectedKey.value = ''
  selectedKeyType.value = ''
}

function handleKeySaved() {}
</script>

<style scoped>
.database-container {
  height: 100%;
  width: 100%;
  display: grid;
  grid-template-columns: 260px 1fr;
  overflow: hidden;
}

.database-sidebar {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid var(--content-border);
  background: var(--content-bg);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid var(--content-border);
  flex-shrink: 0;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--accent);
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

.db-tree-area {
  flex: 1;
  overflow-y: auto;
}

.db-tree-area::-webkit-scrollbar {
  width: 6px;
}

.db-tree-area::-webkit-scrollbar-track {
  background: #000000;
}

.db-tree-area::-webkit-scrollbar-thumb {
  background: var(--accent);
  border-radius: 3px;
}

.db-tree-area::-webkit-scrollbar-thumb:hover {
  background: var(--accent-hover);
}

.database-content {
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 10px;
  overflow: hidden;
  background: var(--content-bg);
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--content-bg-card);
  border-radius: 6px;
  color: var(--content-text-hint);
}

.empty-state h3 {
  margin-bottom: 10px;
  color: var(--content-text-secondary);
}
</style>
