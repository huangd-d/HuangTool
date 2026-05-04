<template>
  <div class="mysql-container">
    <MysqlTree
      ref="mysqlTreeRef"
      @select-connection="handleSelectConnection"
      @select-database="handleSelectDatabase"
      @select-table="handleSelectTable"
      @connection-changed="handleConnectionChanged"
    />

    <div class="mysql-content">
      <template v-if="activeRuntimeId">
        <SqlPanel
          ref="sqlPanelRef"
          :runtime-id="activeRuntimeId"
          :current-db="activeDb"
          @query-executed="handleQueryExecuted"
        />
      </template>

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
import SqlPanel from './components/SqlPanel.vue'

const mysqlTreeRef = ref(null)
const sqlPanelRef = ref(null)

const activeRuntimeId = ref(null)
const activeDb = ref('')

function handleSelectConnection(data) {
  if (mysqlTreeRef.value?.isConnected(data.id)) {
    const runtimeId = mysqlTreeRef.value.getRuntimeId(data.id)
    if (runtimeId) {
      activeRuntimeId.value = runtimeId
      activeDb.value = ''
    }
  }
}

function handleSelectDatabase(data) {
  const runtimeId = mysqlTreeRef.value?.getRuntimeId(data.connectionId)
  if (runtimeId) {
    activeRuntimeId.value = runtimeId
    activeDb.value = data.dbName
  }
}

function handleSelectTable(data) {
  const runtimeId = mysqlTreeRef.value?.getRuntimeId(data.connectionId)
  if (runtimeId) {
    activeRuntimeId.value = runtimeId
    activeDb.value = data.dbName
    sqlPanelRef.value?.setSql(`SELECT * FROM ${data.tableName} LIMIT 100;`)
  }
}

function handleConnectionChanged({ savedId, runtimeId, action }) {
  if (action === 'connect' && runtimeId) {
    activeRuntimeId.value = runtimeId
    activeDb.value = ''
  } else if (action === 'disconnect' || action === 'delete') {
    if (activeRuntimeId.value === mysqlTreeRef.value?.getRuntimeId(savedId)) {
      activeRuntimeId.value = null
      activeDb.value = ''
    }
  }
}

function handleQueryExecuted({ sql, result }) {
  const upper = sql.trim().toUpperCase()
  if (upper.startsWith('CREATE DATABASE') || upper.startsWith('DROP DATABASE')) {
    activeDb.value = ''
  }
}
</script>

<style scoped>
.mysql-container {
  height: 100%;
  width: 100%;
  display: grid;
  grid-template-columns: 260px 1fr;
  overflow: hidden;
}

.mysql-content {
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
