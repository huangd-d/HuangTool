<template>
  <Teleport to="body">
  <div class="dialog-overlay" v-if="modelValue">
    <div class="dialog wide">
      <h3>表结构 {{ tableName ? '- ' + dbName + '.' + tableName : '' }}</h3>
      <div class="dialog-content">
        <div v-if="loading" class="loading-state">加载中...</div>
        <div v-else-if="loadError" class="error-state">{{ loadError }}</div>
        <template v-else>
          <table class="structure-table" v-if="structure.length > 0">
            <thead>
              <tr>
                <th>字段</th>
                <th>类型</th>
                <th>可空</th>
                <th>键</th>
                <th>默认值</th>
                <th>额外</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in structure" :key="idx">
                <td>{{ row.Field }}</td>
                <td>{{ row.Type }}</td>
                <td>{{ row.Null }}</td>
                <td>{{ row.Key }}</td>
                <td>{{ row.Default ?? 'NULL' }}</td>
                <td>{{ row.Extra }}</td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">无结构信息</div>

          <div class="add-column-section">
            <button class="toggle-add-btn" @click="showAddColumn = !showAddColumn">
              {{ showAddColumn ? '取消添加' : '+ 添加列' }}
            </button>
            <div v-if="showAddColumn" class="add-column-form">
              <div class="add-row">
                <input v-model="newColumn.name" placeholder="列名" class="col-input" />
                <select v-model="newColumn.type" class="col-select">
                  <option v-for="t in columnTypes" :key="t" :value="t">{{ t }}</option>
                </select>
                <label class="col-checkbox"><input type="checkbox" v-model="newColumn.nullable" /> 可空</label>
                <input v-model="newColumn.defaultValue" placeholder="默认值" class="col-input small" />
                <button class="add-btn" @click="handleAddColumn" :disabled="addingColumn">
                  {{ addingColumn ? '添加中...' : '添加' }}
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>
      <div class="dialog-actions">
        <button @click="close">关闭</button>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  tableName: { type: String, default: '' },
  dbName: { type: String, default: '' },
  connectionId: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'structure-changed'])

const columnTypes = [
  'INT', 'BIGINT', 'TINYINT', 'SMALLINT',
  'VARCHAR(255)', 'VARCHAR(100)', 'VARCHAR(50)',
  'TEXT', 'MEDIUMTEXT', 'LONGTEXT',
  'DATETIME', 'DATE', 'TIMESTAMP',
  'DECIMAL(10,2)', 'FLOAT', 'DOUBLE',
  'BOOLEAN', 'JSON'
]

const structure = ref([])
const loading = ref(false)
const loadError = ref('')
const showAddColumn = ref(false)
const addingColumn = ref(false)
const newColumn = ref({ name: '', type: 'VARCHAR(255)', nullable: true, defaultValue: '' })

watch(() => props.modelValue, async (visible) => {
  if (visible) {
    showAddColumn.value = false
    newColumn.value = { name: '', type: 'VARCHAR(255)', nullable: true, defaultValue: '' }
    await loadStructure()
  }
})

async function loadStructure() {
  if (!props.connectionId || !props.dbName || !props.tableName) return
  loading.value = true
  loadError.value = ''
  try {
    if (!window.electronAPI?.dbCall) throw new Error('electronAPI 不可用')
    structure.value = await window.electronAPI.dbCall(
      props.connectionId, 'getTableStructure', props.dbName, props.tableName
    )
  } catch (err) {
    loadError.value = err.message || '加载表结构失败'
    structure.value = []
  } finally {
    loading.value = false
  }
}

async function handleAddColumn() {
  if (!newColumn.value.name.trim()) {
    alert('请输入列名')
    return
  }
  addingColumn.value = true
  try {
    if (!window.electronAPI?.dbCall) throw new Error('electronAPI 不可用')
    await window.electronAPI.dbCall(
      props.connectionId, 'alterTableAddColumn', props.dbName, props.tableName,
      {
        name: newColumn.value.name.trim(),
        type: newColumn.value.type,
        nullable: newColumn.value.nullable,
        defaultValue: newColumn.value.defaultValue
      }
    )
    newColumn.value = { name: '', type: 'VARCHAR(255)', nullable: true, defaultValue: '' }
    await loadStructure()
    emit('structure-changed')
  } catch (err) {
    alert('添加列失败: ' + (err.message || '未知错误'))
  } finally {
    addingColumn.value = false
  }
}

function close() {
  emit('update:modelValue', false)
  structure.value = []
  loadError.value = ''
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 0;
  width: 400px;
  max-width: 90%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}

.dialog.wide {
  width: 700px;
}

.dialog h3 {
  margin: 0;
  padding: 16px 24px;
  font-size: 16px;
  font-weight: 700;
  color: #FFFFFF;
  background: #1B1B1B;
  border-radius: 12px 12px 0 0;
  flex-shrink: 0;
}

.dialog-content {
  padding: 20px 24px;
  overflow-y: auto;
  max-height: 60vh;
}

.structure-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.structure-table th {
  text-align: left;
  padding: 8px 10px;
  background: var(--content-bg);
  color: var(--content-text-secondary);
  font-weight: 700;
  border-bottom: 2px solid var(--content-border);
  white-space: nowrap;
}

.structure-table td {
  padding: 6px 10px;
  border-bottom: 1px solid var(--content-border);
  color: var(--content-text);
  white-space: nowrap;
}

.structure-table tbody tr:hover {
  background-color: var(--content-bg);
}

.add-column-section {
  margin-top: 16px;
  border-top: 1px solid var(--content-border);
  padding-top: 12px;
}

.toggle-add-btn {
  padding: 6px 14px;
  border: 1px solid var(--content-border);
  border-radius: 4px;
  background: #FFFFFF;
  color: var(--accent);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all 0.2s;
}

.toggle-add-btn:hover {
  border-color: var(--accent);
}

.add-column-form {
  margin-top: 12px;
}

.add-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.col-input {
  padding: 6px 8px;
  border: 1px solid var(--content-border);
  border-radius: 4px;
  font-size: 12px;
  outline: none;
}

.col-input:focus {
  border-color: var(--accent);
}

.col-input.small {
  width: 80px;
}

.col-select {
  padding: 6px 8px;
  border: 1px solid var(--content-border);
  border-radius: 4px;
  font-size: 12px;
  outline: none;
}

.col-checkbox {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--content-text-secondary);
  white-space: nowrap;
  cursor: pointer;
}

.add-btn {
  padding: 6px 14px;
  border: none;
  border-radius: 4px;
  background: var(--accent);
  color: #FFFFFF;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  transition: background 0.2s;
  white-space: nowrap;
}

.add-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state,
.error-state,
.empty-state {
  padding: 20px;
  text-align: center;
  color: var(--content-text-hint);
  font-size: 13px;
}

.error-state {
  color: var(--error);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--content-border);
  flex-shrink: 0;
}

.dialog-actions button {
  padding: 8px 20px;
  border: 1px solid var(--content-border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: var(--content-text-secondary);
  background: #FFFFFF;
  transition: all 0.2s;
}

.dialog-actions button:hover {
  border-color: #999;
}
</style>
