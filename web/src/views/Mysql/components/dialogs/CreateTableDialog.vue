<template>
  <div class="dialog-overlay" v-if="modelValue">
    <div class="dialog wide">
      <h3>创建表 {{ dbName ? '- ' + dbName : '' }}</h3>
      <div class="dialog-content">
        <div class="form-item">
          <label>表名称:</label>
          <input v-model="tableName" type="text" placeholder="输入表名称">
        </div>
        <div class="form-item">
          <label>列定义:</label>
          <div class="column-editor">
            <div class="column-header">
              <span class="col-name">列名</span>
              <span class="col-type">类型</span>
              <span class="col-null">可空</span>
              <span class="col-default">默认值</span>
              <span class="col-pk">主键</span>
              <span class="col-ai">自增</span>
              <span class="col-action"></span>
            </div>
            <div v-for="(col, idx) in columns" :key="idx" class="column-row">
              <input class="col-name" v-model="col.name" placeholder="列名" />
              <select class="col-type" v-model="col.type">
                <option v-for="t in columnTypes" :key="t" :value="t">{{ t }}</option>
              </select>
              <input class="col-null" type="checkbox" v-model="col.nullable" />
              <input class="col-default" v-model="col.defaultValue" placeholder="默认值" />
              <input class="col-pk" type="checkbox" v-model="col.isPrimaryKey" />
              <input class="col-ai" type="checkbox" v-model="col.isAutoIncrement" :disabled="!col.isPrimaryKey" />
              <button class="col-action remove-btn" @click="removeColumn(idx)" title="删除列">✕</button>
            </div>
            <button class="add-column-btn" @click="addColumn">+ 添加列</button>
          </div>
        </div>
      </div>
      <div class="dialog-actions">
        <button @click="close">取消</button>
        <button @click="handleSave" class="primary">创建</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  dbName: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'save'])

const columnTypes = [
  'INT', 'BIGINT', 'TINYINT', 'SMALLINT', 'MEDIUMINT',
  'VARCHAR(255)', 'VARCHAR(100)', 'VARCHAR(50)', 'CHAR(36)',
  'TEXT', 'MEDIUMTEXT', 'LONGTEXT',
  'DATETIME', 'DATE', 'TIMESTAMP', 'TIME',
  'DECIMAL(10,2)', 'FLOAT', 'DOUBLE',
  'BOOLEAN', 'BLOB', 'JSON', 'ENUM'
]

const tableName = ref('')
const columns = ref([])

watch(() => props.modelValue, (visible) => {
  if (visible) resetForm()
})

function createColumn() {
  return { name: '', type: 'VARCHAR(255)', nullable: true, defaultValue: '', isPrimaryKey: false, isAutoIncrement: false }
}

function resetForm() {
  tableName.value = ''
  columns.value = [createColumn()]
}

function addColumn() {
  columns.value.push(createColumn())
}

function removeColumn(idx) {
  columns.value.splice(idx, 1)
}

function close() {
  emit('update:modelValue', false)
  resetForm()
}

function handleSave() {
  if (!tableName.value.trim()) {
    alert('请输入表名称')
    return
  }
  const valid = columns.value.filter(c => c.name.trim())
  if (valid.length === 0) {
    alert('至少需要定义一个列')
    return
  }
  emit('save', {
    tableName: tableName.value.trim(),
    columns: valid.map(c => ({
      name: c.name.trim(),
      type: c.type,
      nullable: c.nullable,
      defaultValue: c.defaultValue,
      isPrimaryKey: c.isPrimaryKey,
      isAutoIncrement: c.isAutoIncrement
    }))
  })
  close()
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
  width: 660px;
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

.form-item {
  margin-bottom: 15px;
}

.form-item > label {
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
  font-weight: 500;
  color: var(--content-text-secondary);
}

.form-item > input {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--content-border);
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 12px;
  background: #FFFFFF;
  color: var(--content-text);
  outline: none;
  transition: border-color 0.2s;
}

.form-item > input:focus {
  border-color: var(--accent);
}

.column-editor {
  border: 1px solid var(--content-border);
  border-radius: 4px;
  overflow: hidden;
}

.column-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: var(--content-bg);
  font-size: 11px;
  font-weight: 700;
  color: var(--content-text-secondary);
  border-bottom: 1px solid var(--content-border);
}

.column-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-bottom: 1px solid var(--content-border);
}

.column-row:last-of-type {
  border-bottom: none;
}

.col-name { width: 110px; }
.col-type { width: 120px; }
.col-null { width: 36px; }
.col-default { width: 80px; }
.col-pk { width: 36px; }
.col-ai { width: 36px; }
.col-action { width: 24px; }

.column-row input[type="text"],
.column-row select {
  width: 100%;
  padding: 4px 6px;
  border: 1px solid var(--content-border);
  border-radius: 3px;
  font-size: 11px;
  background: #FFFFFF;
  color: var(--content-text);
  outline: none;
}

.column-row input[type="text"]:focus,
.column-row select:focus {
  border-color: var(--accent);
}

.column-row input[type="checkbox"] {
  margin: 0 auto;
  display: block;
}

.remove-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  color: var(--content-text-hint);
  cursor: pointer;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  transition: all 0.15s;
}

.remove-btn:hover {
  color: var(--error);
  background: rgba(217, 48, 37, 0.1);
}

.add-column-btn {
  width: 100%;
  padding: 8px;
  border: none;
  background: var(--content-bg);
  color: var(--accent);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: background 0.2s;
}

.add-column-btn:hover {
  background: var(--content-bg-card);
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

.dialog-actions button.primary {
  background: var(--accent);
  color: #FFFFFF;
  border-color: var(--accent);
  font-weight: 700;
}

.dialog-actions button.primary:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}
</style>
