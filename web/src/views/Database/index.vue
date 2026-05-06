<template>
  <div class="database-container">
    <div class="database-sidebar">
      <div class="db-tree-area">
        <MysqlTree
          ref="mysqlTreeRef"
          @select-connection="handleMysqlSelectConnection"
          @select-database="handleMysqlSelectDatabase"
          @select-table="handleSelectTable"
          @connection-changed="handleMysqlConnectionChanged"
        />
        <RedisTree
          ref="redisTreeRef"
          @select-connection="handleRedisSelectConnection"
          @select-database="handleRedisSelectDatabase"
          @select-key="handleSelectKey"
          @connection-changed="handleRedisConnectionChanged"
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
</template>

<script setup>
import { ref } from 'vue'
import MysqlTree from './components/MysqlTree.vue'
import RedisTree from './components/RedisTree.vue'
import { panels } from './components/panels/index.js'

const mysqlTreeRef = ref(null)
const redisTreeRef = ref(null)

const activePanel = ref('mysql')
const runtimeId = ref(null)
const activeDb = ref('')
const selectedTable = ref('')
const selectedKey = ref('')
const selectedKeyType = ref('')

// ===== MySQL events =====

function handleMysqlSelectConnection(data) {
  if (mysqlTreeRef.value?.isConnected(data.id)) {
    const rid = mysqlTreeRef.value.getRuntimeId(data.id)
    if (rid) {
      activePanel.value = 'mysql'
      runtimeId.value = rid
      activeDb.value = ''
      selectedTable.value = ''
      selectedKey.value = ''
    }
  }
}

function handleMysqlSelectDatabase(data) {
  const rid = mysqlTreeRef.value?.getRuntimeId(data.connectionId)
  if (rid) {
    activePanel.value = 'mysql'
    runtimeId.value = rid
    activeDb.value = data.dbName
    selectedTable.value = ''
    selectedKey.value = ''
  }
}

function handleSelectTable(data) {
  const rid = mysqlTreeRef.value?.getRuntimeId(data.connectionId)
  if (rid) {
    activePanel.value = 'mysql'
    runtimeId.value = rid
    activeDb.value = data.dbName
    selectedTable.value = data.tableName
  }
}

function handleMysqlConnectionChanged({ savedId, runtimeId: rid, action }) {
  if (action === 'connect' && rid) {
    activePanel.value = 'mysql'
    runtimeId.value = rid
    activeDb.value = ''
    selectedTable.value = ''
  } else if (action === 'disconnect' || action === 'delete') {
    if (runtimeId.value === mysqlTreeRef.value?.getRuntimeId(savedId)) {
      runtimeId.value = null
      activeDb.value = ''
      selectedTable.value = ''
    }
  }
}

// ===== Redis events =====

function handleRedisSelectConnection(data) {
  if (redisTreeRef.value?.isConnected(data.id)) {
    const rid = redisTreeRef.value.getRuntimeId(data.id)
    if (rid) {
      activePanel.value = 'redis'
      runtimeId.value = rid
      activeDb.value = '0'
      selectedKey.value = ''
    }
  }
}

function handleRedisSelectDatabase(data) {
  const rid = redisTreeRef.value?.getRuntimeId(data.connectionId)
  if (rid) {
    activePanel.value = 'redis'
    runtimeId.value = rid
    activeDb.value = String(data.dbNumber)
    selectedKey.value = ''
  }
}

function handleSelectKey(data) {
  const rid = redisTreeRef.value?.getRuntimeId(data.connectionId)
  if (rid) {
    activePanel.value = 'redis'
    runtimeId.value = rid
    activeDb.value = String(data.dbNumber)
    selectedKey.value = data.name
    selectedKeyType.value = data.keyType
  }
}

function handleRedisConnectionChanged({ savedId, runtimeId: rid, action }) {
  if (action === 'connect' && rid) {
    activePanel.value = 'redis'
    runtimeId.value = rid
    activeDb.value = '0'
    selectedKey.value = ''
  } else if (action === 'disconnect' || action === 'delete') {
    if (runtimeId.value === redisTreeRef.value?.getRuntimeId(savedId)) {
      runtimeId.value = null
      activeDb.value = ''
      selectedKey.value = ''
    }
  }
}

// ===== Panel events =====

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

.db-tree-area {
  flex: 1;
  overflow-y: auto;
  /* display: flex; */
  /* flex-direction: column; */
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
