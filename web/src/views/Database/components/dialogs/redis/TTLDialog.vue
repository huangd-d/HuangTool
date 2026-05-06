<template>
  <Teleport to="body">
  <div class="dialog-overlay" v-if="modelValue">
    <div class="dialog">
      <h3>编辑 TTL</h3>
      <div class="dialog-content">
        <div class="key-display">{{ keyName }}</div>
        <div class="form-item">
          <label>当前 TTL:</label>
          <span class="current-ttl">{{ currentTtl === -1 ? '持久（无过期）' : currentTtl + ' 秒' }}</span>
        </div>
        <div class="form-item">
          <label>新 TTL (秒):</label>
          <input v-model.number="form.ttl" type="number" placeholder="-1 = 永久">
          <span class="ttl-hint">{{ form.ttl === -1 ? '设为永久' : form.ttl > 0 ? form.ttl + ' 秒后过期' : '' }}</span>
        </div>
      </div>
      <div class="dialog-actions">
        <button @click="close">取消</button>
        <button @click="handlePersist" class="test-btn" v-if="currentTtl !== -1">设为永久</button>
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
  keyName: { type: String, default: '' },
  currentTtl: { type: Number, default: -1 }
})

const emit = defineEmits(['update:modelValue', 'save'])

const form = ref({ ttl: -1 })

watch(() => props.modelValue, (visible) => {
  if (visible) {
    form.value.ttl = props.currentTtl
  }
})

function close() {
  emit('update:modelValue', false)
}

function handlePersist() {
  emit('save', { keyName: props.keyName, ttl: -1 })
  close()
}

function handleSave() {
  emit('save', { keyName: props.keyName, ttl: form.value.ttl })
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

.key-display {
  font-family: var(--mono);
  font-size: 13px;
  font-weight: 700;
  color: var(--content-text);
  margin-bottom: 16px;
  padding: 8px 12px;
  background: var(--content-bg);
  border-radius: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.form-item {
  margin-bottom: 12px;
}

.form-item label {
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
  font-weight: 500;
  color: var(--content-text-secondary);
}

.current-ttl {
  font-size: 13px;
  color: var(--accent);
  font-weight: 600;
}

.form-item input {
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

.form-item input:focus {
  border-color: var(--accent);
}

.ttl-hint {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: var(--content-text-hint);
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

.dialog-actions button.test-btn {
  color: var(--accent);
  border-color: var(--accent);
}
</style>
