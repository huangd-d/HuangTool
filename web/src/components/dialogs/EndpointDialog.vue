<template>
  <div class="dialog-overlay" v-if="modelValue">
    <div class="dialog">
      <h3>{{ isEdit ? '编辑接口' : '创建接口' }}</h3>
      <div class="dialog-content">
        <div class="form-item">
          <label>接口名称:</label>
          <input v-model="form.name" type="text" placeholder="输入接口名称">
        </div>
        <div class="form-item">
          <label>接口 URL:</label>
          <input v-model="form.url" type="text" placeholder="输入接口 URL">
        </div>
        <div class="form-item">
          <label>接口描述:</label>
          <textarea v-model="form.description" placeholder="输入接口描述"></textarea>
        </div>
        <div class="form-item">
          <label>请求方法:</label>
          <select v-model="form.method">
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
            <option value="PATCH">PATCH</option>
          </select>
        </div>
        <div class="form-item">
          <label>请求体类型:</label>
          <select v-model="form.config.bodyType">
            <option value="none">none</option>
            <option value="json">JSON</option>
            <option value="form">x-www-form-urlencoded</option>
            <option value="raw">raw</option>
          </select>
        </div>
        <div class="form-item" v-if="form.config.bodyType !== 'none'">
          <label>请求体:</label>
          <textarea v-model="form.config.body" placeholder="输入请求体" rows="6"></textarea>
        </div>
        <div class="form-item">
          <label>超时时间 (ms):</label>
          <input v-model.number="form.config.timeout" type="number" placeholder="30000">
        </div>
      </div>
      <div class="dialog-actions">
        <button @click="close">取消</button>
        <button @click="handleSave" class="primary">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  endpoint: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'save'])

const form = ref({
  name: '',
  url: '',
  method: 'GET',
  description: '',
  config: {
    headers: {},
    params: [],
    bodyType: 'none',
    body: '',
    timeout: 30000,
    followRedirect: true
  }
})

const isEdit = computed(() => !!props.endpoint)

// 监听 endpoint 变化，更新表单
watch(() => props.endpoint, (newEndpoint) => {
  if (newEndpoint) {
    form.value = {
      name: newEndpoint.name || '',
      url: newEndpoint.url || '',
      method: newEndpoint.method || 'GET',
      description: newEndpoint.description || '',
      config: {
        headers: newEndpoint.config?.headers || {},
        params: newEndpoint.config?.params || [],
        bodyType: newEndpoint.config?.bodyType || 'none',
        body: newEndpoint.config?.body || '',
        timeout: newEndpoint.config?.timeout || 30000,
        followRedirect: newEndpoint.config?.followRedirect !== false
      }
    }
  } else {
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  form.value = {
    name: '',
    url: '',
    method: 'GET',
    description: '',
    config: {
      headers: {},
      params: [],
      bodyType: 'none',
      body: '',
      timeout: 30000,
      followRedirect: true
    }
  }
}

function close() {
  emit('update:modelValue', false)
  resetForm()
}

function handleSave() {
  if (!form.value.name || !form.value.url) {
    alert('请输入接口名称和 URL')
    return
  }
  
  emit('save', { ...form.value, id: props.endpoint?.id })
  close()
}
</script>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: var(--bg-secondary);
  border-radius: 8px;
  padding: 20px;
  width: 500px;
  max-width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.dialog h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: var(--text);
}

.dialog-content {
  margin-bottom: 20px;
}

.form-item {
  margin-bottom: 15px;
}

.form-item label {
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}

.form-item input,
.form-item select,
.form-item textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 12px;
}

.form-item textarea {
  resize: vertical;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.dialog-actions button {
  padding: 8px 16px;
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.dialog-actions button.primary {
  background: #42b883;
  color: white;
  border-color: #42b883;
}

.dialog-actions button.primary:hover {
  background: #35495e;
  border-color: #35495e;
}
</style>
