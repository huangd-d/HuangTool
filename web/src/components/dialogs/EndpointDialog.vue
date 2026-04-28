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
          <input v-model="form.config.url" type="text" placeholder="输入接口 URL">
        </div>
        <div class="form-item">
          <label>接口描述:</label>
          <textarea v-model="form.description" placeholder="输入接口描述"></textarea>
        </div>
        <div class="form-item">
          <label>请求方法:</label>
          <select v-model="form.config.method">
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
  description: '',
  config: {
    url: '',
    method: 'GET',
    headers: {},
    params: [],
    bodyType: 'none',
    body: '',
    timeout: 30000,
    followRedirect: true
  }
})

const isEdit = computed(() => !!props.endpoint)

// 监听对话框打开和 endpoint 变化，更新表单
watch([() => props.modelValue, () => props.endpoint], ([visible, endpoint]) => {
  if (visible) {
    if (endpoint) {
      const raw = JSON.parse(JSON.stringify(endpoint))
      form.value = {
        name: raw.name || '',
        description: raw.description || '',
        config: {
          url: raw.config?.url || '',
          method: raw.config?.method || 'GET',
          headers: raw.config?.headers || {},
          params: raw.config?.params || [],
          bodyType: raw.config?.bodyType || 'none',
          body: raw.config?.body || '',
          timeout: raw.config?.timeout || 30000,
          followRedirect: raw.config?.followRedirect !== false
        }
      }
    } else {
      resetForm()
    }
  }
}, { immediate: true })

function resetForm() {
  form.value = {
    name: '',
    description: '',
    config: {
      url: '',
      method: 'GET',
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
  if (!form.value.name || !form.value.config.url) {
    alert('请输入接口名称和 URL')
    return
  }

  emit('save', {
    id: props.endpoint?.id,
    name: form.value.name,
    description: form.value.description,
    type: 'endpoint',
    config: {
      url: form.value.config.url,
      method: form.value.config.method,
      headers: form.value.config.headers,
      params: form.value.config.params,
      bodyType: form.value.config.bodyType,
      body: form.value.config.body,
      timeout: form.value.config.timeout,
      followRedirect: form.value.config.followRedirect
    }
  })
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
  background: #FFFFFF;
  border-radius: 12px;
  padding: 0;
  width: 500px;
  max-width: 90%;
  max-height: 90vh;
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
  margin-bottom: 0;
  min-height: 200px;
  max-height: 60vh;
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
.form-item select,
.form-item textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--content-border);
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 12px;
  background: #FFFFFF;
  color: var(--content-text);
}

.form-item textarea {
  resize: vertical;
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
