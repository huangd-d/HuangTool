<template>
  <div class="redis-panel">
    <!-- Command input -->
    <div class="command-section">
      <div class="command-toolbar">
        <span class="current-db" v-if="currentDb !== ''">db{{ currentDb }}</span>
        <span class="current-db none" v-else>未选择DB</span>
        <button class="btn btn-execute" @click="handleExecute" :disabled="!canExecute">
          {{ executing ? '执行中...' : '执行' }}
        </button>
      </div>
      <textarea
        v-model="command"
        class="command-editor"
        placeholder="输入 Redis 命令... (Ctrl+Enter 执行)"
        @keydown.ctrl.enter="handleExecute"
        spellcheck="false"
      ></textarea>
      <div v-if="resultText || queryError" class="result-inline">
        <span v-if="queryTime !== null" class="query-time">{{ queryTime }}ms</span>
        <span v-if="queryError" class="result-error">{{ queryError }}</span>
        <span v-else class="result-text">{{ resultText }}</span>
      </div>
    </div>

    <!-- Key-Value Editor -->
    <div v-if="keyName" class="key-value-editor">
      <div class="editor-header">
        <div class="key-info">
          <span class="key-name">{{ keyName }}</span>
          <span class="key-type-badge">{{ keyType }}</span>
          <span class="key-ttl" :class="{ persistent: currentTTL === -1 }">
            TTL: {{ currentTTL === -1 ? '持久' : currentTTL + 's' }}
          </span>
        </div>
        <div class="key-actions">
          <button class="btn-sm" @click="loadValue" title="刷新">↻</button>
          <button class="btn-sm danger" @click="handleDelete" title="删除">✕</button>
          <button class="btn-sm primary" @click="handleSave" :disabled="saving">保存</button>
        </div>
      </div>

      <div v-if="loading" class="editor-loading">加载中...</div>

      <div v-else-if="keyType === 'string'" class="editor-body">
        <textarea v-model="stringValue" class="value-textarea" placeholder="输入字符串值..." spellcheck="false"></textarea>
      </div>

      <div v-else-if="keyType === 'hash'" class="editor-body">
        <table class="kv-table">
          <thead><tr><th>Field</th><th>Value</th><th class="action-col"></th></tr></thead>
          <tbody>
            <tr v-for="(item, idx) in hashValue" :key="idx">
              <td><input v-model="item.field" class="cell-input" /></td>
              <td><input v-model="item.value" class="cell-input" /></td>
              <td class="action-col"><button class="btn-row del" @click="hashValue.splice(idx, 1)">✕</button></td>
            </tr>
          </tbody>
        </table>
        <button class="btn-add-row" @click="hashValue.push({ field: '', value: '' })">+ 添加字段</button>
      </div>

      <div v-else-if="keyType === 'list'" class="editor-body">
        <table class="kv-table">
          <thead><tr><th class="num-col">#</th><th>Value</th><th class="action-col"></th></tr></thead>
          <tbody>
            <tr v-for="(item, idx) in listValue" :key="idx">
              <td class="num-col">{{ idx }}</td>
              <td><input v-model="listValue[idx]" class="cell-input" /></td>
              <td class="action-col"><button class="btn-row del" @click="listValue.splice(idx, 1)">✕</button></td>
            </tr>
          </tbody>
        </table>
        <button class="btn-add-row" @click="listValue.push('')">+ 添加项</button>
      </div>

      <div v-else-if="keyType === 'set'" class="editor-body">
        <table class="kv-table">
          <thead><tr><th>Member</th><th class="action-col"></th></tr></thead>
          <tbody>
            <tr v-for="(item, idx) in setValue" :key="idx">
              <td><input v-model="setValue[idx]" class="cell-input" /></td>
              <td class="action-col"><button class="btn-row del" @click="setValue.splice(idx, 1)">✕</button></td>
            </tr>
          </tbody>
        </table>
        <button class="btn-add-row" @click="setValue.push('')">+ 添加成员</button>
      </div>

      <div v-else-if="keyType === 'zset'" class="editor-body">
        <table class="kv-table">
          <thead><tr><th>Score</th><th>Member</th><th class="action-col"></th></tr></thead>
          <tbody>
            <tr v-for="(item, idx) in zsetValue" :key="idx">
              <td><input v-model.number="item.score" type="number" class="cell-input" /></td>
              <td><input v-model="item.member" class="cell-input" /></td>
              <td class="action-col"><button class="btn-row del" @click="zsetValue.splice(idx, 1)">✕</button></td>
            </tr>
          </tbody>
        </table>
        <button class="btn-add-row" @click="zsetValue.push({ score: 0, member: '' })">+ 添加成员</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  runtimeId: { type: String, default: null },
  currentDb: { type: String, default: '' },
  keyName: { type: String, default: '' },
  keyType: { type: String, default: 'string' }
})

const emit = defineEmits(['command-executed', 'key-deleted', 'key-saved'])

// ===== Command section =====
const command = ref('')
const resultText = ref('')
const queryTime = ref(null)
const queryError = ref('')
const executing = ref(false)

const canExecute = computed(() => props.runtimeId && command.value.trim() && !executing.value)

async function handleExecute() {
  if (!canExecute.value) return
  executing.value = true
  resultText.value = ''
  queryTime.value = null
  queryError.value = ''
  try {
    if (!window.electronAPI?.dbCall) throw new Error('electronAPI 不可用')
    const result = await window.electronAPI.dbCall(
      props.runtimeId, 'executeCommand', props.currentDb || '0', command.value
    )
    queryTime.value = result.time
    if (Array.isArray(result.result)) {
      resultText.value = result.result.map((v, i) => `${i + 1}) ${v}`).join('\n')
    } else if (result.result !== null && result.result !== undefined) {
      resultText.value = String(result.result)
    } else {
      resultText.value = '(nil)'
    }
    emit('command-executed', { command: command.value, result })
  } catch (err) {
    queryError.value = err.message || '命令执行失败'
  } finally {
    executing.value = false
  }
}

// ===== Key-Value Editor section =====
const loading = ref(false)
const saving = ref(false)
const currentTTL = ref(-1)

const stringValue = ref('')
const hashValue = ref([])
const listValue = ref([])
const setValue = ref([])
const zsetValue = ref([])

watch(() => props.keyName, () => {
  if (props.keyName) loadValue()
  else {
    stringValue.value = ''
    hashValue.value = []
    listValue.value = []
    setValue.value = []
    zsetValue.value = []
    currentTTL.value = -1
  }
}, { immediate: true })

async function loadValue() {
  if (!props.runtimeId || !props.keyName) return
  loading.value = true
  try {
    if (!window.electronAPI?.dbCall) return
    const result = await window.electronAPI.dbCall(
      props.runtimeId, 'getKeyValue', props.currentDb || '0', props.keyName, props.keyType
    )
    currentTTL.value = result.ttl
    switch (props.keyType) {
      case 'string':
        stringValue.value = result.value || ''
        break
      case 'hash':
        hashValue.value = Object.entries(result.value || {}).map(([field, value]) => ({ field, value }))
        break
      case 'list':
        listValue.value = [...(result.value || [])]
        break
      case 'set':
        setValue.value = [...(result.value || [])]
        break
      case 'zset': {
        const raw = result.value || []
        const items = []
        for (let i = 0; i < raw.length; i += 2) {
          items.push({ member: raw[i], score: Number(raw[i + 1]) || 0 })
        }
        zsetValue.value = items
        break
      }
    }
  } catch (err) {
    ElMessage.error('加载失败: ' + (err.message || '未知错误'))
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  if (!props.runtimeId || !props.keyName) return
  saving.value = true
  try {
    let value
    switch (props.keyType) {
      case 'string':
        value = stringValue.value
        break
      case 'hash': {
        const obj = {}
        for (const item of hashValue.value) {
          if (item.field) obj[item.field] = item.value
        }
        value = obj
        break
      }
      case 'list':
        value = listValue.value.filter(v => v !== '')
        break
      case 'set':
        value = setValue.value.filter(v => v !== '')
        break
      case 'zset':
        value = zsetValue.value.filter(v => v.member)
        break
    }
    await window.electronAPI.dbCall(
      props.runtimeId, 'setKeyValue', props.currentDb || '0', props.keyName, props.keyType, value, currentTTL.value
    )
    emit('key-saved')
    ElMessage.success('保存成功')
  } catch (err) {
    ElMessage.error('保存失败: ' + (err.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!confirm(`确定删除Key "${props.keyName}" 吗？`)) return
  try {
    await window.electronAPI.dbCall(
      props.runtimeId, 'deleteKey', props.currentDb || '0', props.keyName
    )
    emit('key-deleted')
    ElMessage.success('删除成功')
  } catch (err) {
    ElMessage.error('删除失败: ' + (err.message || '未知错误'))
  }
}
</script>

<style scoped>
.redis-panel {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  gap: 10px;
}

/* Command section */
.command-section {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--content-bg-card);
  border-radius: 6px;
  flex-shrink: 0;
}

.command-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid var(--content-border);
  background: var(--content-bg);
}

.current-db {
  font-size: 12px;
  font-weight: 700;
  color: var(--accent);
}

.current-db.none {
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

.command-editor {
  width: 100%;
  min-height: 80px;
  max-height: 160px;
  padding: 10px 16px;
  border: none;
  resize: vertical;
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.5;
  color: var(--content-text);
  background: var(--content-bg-card);
  outline: none;
  box-sizing: border-box;
}

.result-inline {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 6px 16px;
  border-top: 1px solid var(--content-border);
  font-family: var(--mono);
  font-size: 12px;
  max-height: 80px;
  overflow: auto;
}

.query-time {
  color: var(--accent);
  font-weight: 700;
  flex-shrink: 0;
}

.result-error {
  color: var(--error);
}

.result-text {
  color: var(--content-text);
  white-space: pre-wrap;
  word-break: break-all;
}

/* Key-Value Editor section */
.key-value-editor {
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--content-bg-card);
  border-radius: 6px;
  flex-shrink: 0;
  flex-grow: 1;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  border-bottom: 1px solid var(--content-border);
  background: var(--content-bg);
  flex-shrink: 0;
}

.key-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.key-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--content-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--mono);
}

.key-type-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 3px;
  background: rgba(255, 144, 0, 0.15);
  color: var(--accent);
  text-transform: uppercase;
  flex-shrink: 0;
}

.key-ttl {
  font-size: 11px;
  color: var(--accent);
  flex-shrink: 0;
}

.key-ttl.persistent {
  color: var(--content-text-hint);
}

.key-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.btn-sm {
  padding: 4px 10px;
  border: 1px solid var(--content-border);
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  background: #FFFFFF;
  color: var(--content-text-secondary);
  transition: all 0.15s;
}

.btn-sm:hover {
  border-color: #999;
}

.btn-sm.primary {
  background: var(--accent);
  color: #FFFFFF;
  border-color: var(--accent);
}

.btn-sm.primary:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-sm.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-sm.danger {
  color: #ff3b30;
  border-color: #ff3b30;
}

.btn-sm.danger:hover {
  background: rgba(255, 59, 48, 0.1);
}

.editor-loading {
  padding: 24px;
  text-align: center;
  color: var(--content-text-hint);
  font-size: 13px;
}

.editor-body {
  flex: 1;
  overflow: auto;
  padding: 12px;
}

.value-textarea {
  width: 100%;
  min-height: 240px;
  padding: 10px;
  border: 1px solid var(--content-border);
  border-radius: 4px;
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.5;
  color: var(--content-text);
  background: #FFFFFF;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
}

.value-textarea:focus {
  border-color: var(--accent);
}

.kv-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.kv-table th {
  padding: 6px 8px;
  text-align: left;
  background: var(--content-bg);
  color: var(--content-text-secondary);
  font-weight: 700;
  border-bottom: 1px solid var(--content-border);
  white-space: nowrap;
}

.kv-table td {
  padding: 4px 4px;
  border-bottom: 1px solid var(--content-border);
}

.num-col {
  width: 36px;
  text-align: center;
  color: var(--content-text-hint);
  font-size: 11px;
}

.action-col {
  width: 30px;
  text-align: center;
}

.cell-input {
  width: 100%;
  padding: 4px 6px;
  border: 1px solid var(--content-border);
  border-radius: 3px;
  font-size: 12px;
  font-family: var(--mono);
  color: var(--content-text);
  background: #FFFFFF;
  outline: none;
  box-sizing: border-box;
}

.cell-input:focus {
  border-color: var(--accent);
}

.btn-row {
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 11px;
  color: var(--content-text-hint);
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.btn-row.del:hover {
  color: #ff3b30;
  background: rgba(255, 59, 48, 0.1);
}

.btn-add-row {
  margin-top: 8px;
  padding: 6px 12px;
  border: 1px dashed var(--content-border);
  border-radius: 4px;
  background: none;
  color: var(--accent);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-add-row:hover {
  border-color: var(--accent);
  background: rgba(255, 144, 0, 0.05);
}

.editor-body::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.editor-body::-webkit-scrollbar-track {
  background: #000000;
}

.editor-body::-webkit-scrollbar-thumb {
  background: var(--accent);
  border-radius: 3px;
}

.editor-body::-webkit-scrollbar-thumb:hover {
  background: var(--accent-hover);
}
</style>
