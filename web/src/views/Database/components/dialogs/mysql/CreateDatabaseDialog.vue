<template>
  <Teleport to="body">
  <div class="dialog-overlay" v-if="modelValue">
    <div class="dialog">
      <h3>创建数据库 {{ connectionName ? '- ' + connectionName : '' }}</h3>
      <div class="dialog-content">
        <div class="form-item">
          <label>数据库名称:</label>
          <input v-model="form.name" type="text" placeholder="输入数据库名称">
        </div>
        <div class="form-item">
          <label>字符集:</label>
          <select v-model="form.charset">
            <option value="utf8mb4">utf8mb4</option>
            <option value="utf8">utf8</option>
            <option value="latin1">latin1</option>
            <option value="gbk">gbk</option>
            <option value="gb2312">gb2312</option>
            <option value="big5">big5</option>
            <option value="ascii">ascii</option>
            <option value="gb18030">gb18030</option>
          </select>
        </div>
        <div class="form-item">
          <label>排序规则:</label>
          <select v-model="form.collation">
            <option v-for="c in collationsForCharset" :key="c" :value="c">{{ c }}</option>
          </select>
        </div>
      </div>
      <div class="dialog-actions">
        <button @click="close">取消</button>
        <button @click="handleSave" class="primary">创建</button>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  connectionName: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'save'])

const COLLATION_MAP = {
  utf8mb4: ['utf8mb4_general_ci', 'utf8mb4_unicode_ci', 'utf8mb4_bin', 'utf8mb4_0900_ai_ci'],
  utf8: ['utf8_general_ci', 'utf8_unicode_ci', 'utf8_bin'],
  latin1: ['latin1_swedish_ci', 'latin1_general_ci', 'latin1_bin'],
  gbk: ['gbk_chinese_ci', 'gbk_bin'],
  gb2312: ['gb2312_chinese_ci', 'gb2312_bin'],
  big5: ['big5_chinese_ci', 'big5_bin'],
  ascii: ['ascii_general_ci', 'ascii_bin'],
  gb18030: ['gb18030_chinese_ci', 'gb18030_bin', 'gb18030_unicode_520_ci']
}

const form = ref({ name: '', charset: 'utf8mb4', collation: 'utf8mb4_general_ci' })

const collationsForCharset = computed(() => COLLATION_MAP[form.value.charset] || [])

watch(() => form.value.charset, (charset) => {
  const list = COLLATION_MAP[charset]
  if (list && !list.includes(form.value.collation)) {
    form.value.collation = list[0]
  }
})

watch(() => props.modelValue, (visible) => {
  if (visible) resetForm()
})

function resetForm() {
  form.value = { name: '', charset: 'utf8mb4', collation: 'utf8mb4_general_ci' }
}

function close() {
  emit('update:modelValue', false)
  resetForm()
}

function handleSave() {
  if (!form.value.name.trim()) {
    alert('请输入数据库名称')
    return
  }
  emit('save', { name: form.value.name.trim(), charset: form.value.charset, collation: form.value.collation })
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
}

.form-item {
  margin-bottom: 15px;
}

.form-item label {
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
  font-weight: 500;
  color: var(--content-text-secondary);
}

.form-item input,
.form-item select {
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

.form-item input:focus,
.form-item select:focus {
  border-color: var(--accent);
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
