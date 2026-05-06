<template>
  <Teleport to="body">
  <div class="dialog-overlay" v-if="modelValue">
    <div class="dialog">
      <h3>重命名 Key</h3>
      <div class="dialog-content">
        <div class="form-item">
          <label>当前名称:</label>
          <span class="key-display">{{ keyName }}</span>
        </div>
        <div class="form-item">
          <label>新名称:</label>
          <input v-model="form.newKey" type="text" placeholder="输入新的 Key 名称">
        </div>
      </div>
      <div class="dialog-actions">
        <button @click="close">取消</button>
        <button @click="handleSave" class="primary">确定</button>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  keyName: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue', 'save'])

const form = ref({ newKey: '' })

watch(() => props.modelValue, (visible) => {
  if (visible) {
    form.value.newKey = ''
  }
})

function close() {
  emit('update:modelValue', false)
}

function handleSave() {
  if (!form.value.newKey) {
    alert('请输入新名称')
    return
  }
  if (form.value.newKey === props.keyName) {
    alert('新名称与当前名称相同')
    return
  }
  emit('save', { oldKey: props.keyName, newKey: form.value.newKey })
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
  width: 380px;
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

.key-display {
  font-family: var(--mono);
  font-size: 13px;
  font-weight: 700;
  color: var(--content-text);
  display: block;
  padding: 8px 12px;
  background: var(--content-bg);
  border-radius: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.form-item input {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--content-border);
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 12px;
  font-family: var(--mono);
  background: #FFFFFF;
  color: var(--content-text);
  outline: none;
  transition: border-color 0.2s;
}

.form-item input:focus {
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
