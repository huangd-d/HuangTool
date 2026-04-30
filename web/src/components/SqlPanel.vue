<template>
  <div class="sql-panel">
    <!-- SQL 编辑器 -->
    <div class="sql-section">
      <div class="sql-toolbar">
        <span class="sql-db" v-if="currentDb">{{ currentDb }}</span>
        <span class="sql-db none" v-else>未选择数据库</span>
        <button class="btn btn-execute"
                @click="handleExecute"
                :disabled="!canExecute">
          {{ executing ? '执行中...' : '执行' }}
        </button>
      </div>
      <textarea
        v-model="sql"
        class="sql-editor"
        placeholder="输入 SQL 语句... (Ctrl+Enter 执行)"
        @keydown.ctrl.enter="handleExecute"
        spellcheck="false"
      ></textarea>
    </div>

    <!-- 结果区 -->
    <div class="result-section">
      <div class="result-toolbar">
        <span>查询结果</span>
        <span v-if="queryTime !== null" class="query-time">{{ queryTime }}ms</span>
        <span v-if="resultRows.length > 0" class="row-count">{{ resultRows.length }} 行</span>
      </div>
      <div class="result-content">
        <div v-if="queryError" class="result-error">{{ queryError }}</div>
        <div v-else-if="affectedInfo" class="result-info">{{ affectedInfo }}</div>
        <div v-else-if="resultColumns.length > 0" class="result-table-wrap">
          <table class="result-table">
            <thead>
              <tr>
                <th class="row-num">#</th>
                <th v-for="col in resultColumns" :key="col">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in resultRows" :key="idx">
                <td class="row-num">{{ idx + 1 }}</td>
                <td v-for="col in resultColumns" :key="col" :title="String(row[col] ?? 'NULL')">{{ row[col] ?? 'NULL' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-else class="result-placeholder">执行 SQL 查询查看结果</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  runtimeId: { type: String, default: null },
  currentDb: { type: String, default: '' }
})

const emit = defineEmits(['query-executed'])

const sql = ref('')
const resultColumns = ref([])
const resultRows = ref([])
const affectedInfo = ref('')
const queryTime = ref(null)
const queryError = ref('')
const executing = ref(false)

const canExecute = computed(() => props.runtimeId && sql.value.trim() && !executing.value)

function resetResult() {
  resultColumns.value = []
  resultRows.value = []
  affectedInfo.value = ''
  queryTime.value = null
  queryError.value = ''
}

async function handleExecute() {
  if (!canExecute.value) return
  executing.value = true
  resetResult()
  try {
    if (!window.electronAPI?.mysqlExecuteQuery) throw new Error('electronAPI 不可用')
    const result = await window.electronAPI.mysqlExecuteQuery(
      props.runtimeId,
      props.currentDb || '',
      sql.value
    )
    queryTime.value = result.time
    if (result.columns.length > 0) {
      resultColumns.value = result.columns
      resultRows.value = result.rows
    } else if (result.affectedRows !== undefined) {
      affectedInfo.value = `影响行数: ${result.affectedRows}`
      if (result.insertId) affectedInfo.value += ` | 自增ID: ${result.insertId}`
    }
    emit('query-executed', { sql: sql.value, result })
  } catch (err) {
    queryError.value = err.message || '查询执行失败'
  } finally {
    executing.value = false
  }
}

function setSql(value) {
  sql.value = value
}

defineExpose({ setSql, resetResult })
</script>

<style scoped>
.sql-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* SQL 编辑区 */
.sql-section {
  border-bottom: 1px solid var(--content-border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sql-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid var(--content-border);
  background: var(--content-bg);
}

.sql-db {
  font-size: 12px;
  font-weight: 700;
  color: var(--accent);
}

.sql-db.none {
  color: var(--content-text-hint);
}

.btn {
  padding: 5px 16px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-execute {
  background-color: var(--accent);
  color: #FFFFFF;
}

.btn-execute:hover:not(:disabled) {
  background-color: var(--accent-hover);
}

.sql-editor {
  width: 100%;
  min-height: 120px;
  max-height: 240px;
  padding: 12px 16px;
  border: none;
  resize: vertical;
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.5;
  color: var(--content-text);
  background: var(--content-bg-card);
  outline: none;
}

/* 结果区 */
.result-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.result-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--content-border);
  background: var(--content-bg);
  font-size: 12px;
  font-weight: 700;
  color: var(--content-text-secondary);
  flex-shrink: 0;
}

.query-time {
  color: var(--accent);
}

.row-count {
  color: var(--content-text-hint);
}

.result-content {
  flex: 1;
  overflow: auto;
}

.result-error {
  padding: 16px;
  color: var(--error);
  font-size: 13px;
  font-family: var(--mono);
}

.result-info {
  padding: 16px;
  color: var(--content-text-secondary);
  font-size: 13px;
}

.result-table-wrap {
  overflow: auto;
  height: 100%;
}

.result-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.result-table th {
  position: sticky;
  top: 0;
  padding: 8px 12px;
  text-align: left;
  background: var(--content-bg);
  color: var(--content-text-secondary);
  font-weight: 700;
  border-bottom: 2px solid var(--content-border);
  white-space: nowrap;
}

.result-table td {
  padding: 6px 12px;
  border-bottom: 1px solid var(--content-border);
  color: var(--content-text);
  white-space: nowrap;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.result-table tbody tr:hover {
  background-color: var(--content-bg);
}

.row-num {
  width: 40px;
  text-align: center;
  color: var(--content-text-hint) !important;
  font-size: 11px;
}

.result-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--content-text-hint);
  font-size: 13px;
}

/* 滚动条 */
.result-content::-webkit-scrollbar,
.result-table-wrap::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.result-content::-webkit-scrollbar-track,
.result-table-wrap::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

.result-content::-webkit-scrollbar-thumb,
.result-table-wrap::-webkit-scrollbar-thumb {
  background: var(--bg-tertiary);
  border-radius: 3px;
}

.result-content::-webkit-scrollbar-thumb:hover,
.result-table-wrap::-webkit-scrollbar-thumb:hover {
  background: #444444;
}
</style>
