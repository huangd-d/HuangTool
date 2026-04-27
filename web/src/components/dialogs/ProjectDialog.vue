<template>
  <div class="dialog-overlay" v-if="modelValue">
    <div class="dialog">
      <h3>{{ isEdit ? '编辑项目' : '创建项目' }}</h3>
      <div class="dialog-content">
        <div class="form-item">
          <label>项目名称:</label>
          <input v-model="form.name" type="text" placeholder="输入项目名称">
        </div>
        <div class="form-item">
          <label>项目文件名:</label>
          <input v-model="form.config.fileName" type="text" placeholder="请输入数字、字母、下划线，不能包含中文">
        </div>
        <div class="form-item">
          <label>项目描述:</label>
          <textarea v-model="form.description" placeholder="输入项目描述"></textarea>
        </div>
        <div class="form-item">
          <label>基础 URL:</label>
          <input v-model="form.config.baseUrl" type="text" placeholder="https://api.example.com">
        </div>
        <div class="form-item">
          <label>代理地址:</label>
          <input v-model="form.config.proxy" type="text" placeholder="http://proxy.example.com:8080">
        </div>
        <div class="form-item">
          <label>超时时间 (ms):</label>
          <input v-model.number="form.config.timeout" type="number" placeholder="30000">
        </div>
        <div class="form-item">
          <label>共用 Header (JSON):</label>
          <textarea v-model="headersText" placeholder='{"Authorization": "Bearer token"}'></textarea>
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
  project: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'save'])

const form = ref({
  name: '',
  description: '',
  config: {
    fileName: '',
    baseUrl: '',
    proxy: '',
    headers: {},
    timeout: 30000
  }
})

const isEdit = computed(() => !!props.project)

const headersText = computed({
  get: () => {
    return JSON.stringify(form.value.config.headers, null, 2)
  },
  set: (value) => {
    try {
      form.value.config.headers = JSON.parse(value)
    } catch (e) {
      console.error('Invalid JSON:', e)
    }
  }
})

// 生成当前时间格式化字符串
function getCurrentTimeString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${year}${month}${day}_${hours}${minutes}${seconds}`
}

// 去掉 .json 后缀用于表单显示
function stripJsonExtension(fileName) {
  if (!fileName) return ''
  return fileName.endsWith('.json') ? fileName.slice(0, -5) : fileName
}

// 监听 project 变化，更新表单
watch(() => props.project, (newProject) => {
  if (newProject) {
    form.value = {
      name: newProject.name || '',
      description: newProject.description || '',
      config: {
        fileName: stripJsonExtension(newProject.config?.fileName || ''),
        baseUrl: newProject.config?.baseUrl || '',
        proxy: newProject.config?.proxy || '',
        headers: newProject.config?.headers || {},
        timeout: newProject.config?.timeout || 30000
      }
    }
  } else {
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  form.value = {
    name: '',
    description: '',
    config: {
      fileName: getCurrentTimeString(),
      baseUrl: '',
      proxy: '',
      headers: {},
      timeout: 30000
    }
  }
}

function close() {
  emit('update:modelValue', false)
  resetForm()
}

function handleSave() {
  if (!form.value.name || !form.value.config.fileName) {
    alert('请输入项目名称和文件名')
    return
  }
  // 数字、字母、下划线，不能包含中文
  if (!form.value.config.fileName.match(/^[a-zA-Z0-9][a-zA-Z0-9_]+$/)) {
    alert('请输入正确的文件名格式')
    return
  }

  emit('save', {
    id: props.project?.id,
    name: form.value.name,
    description: form.value.description,
    type: 'project',
    config: {
      fileName: form.value.config.fileName,
      baseUrl: form.value.config.baseUrl,
      proxy: form.value.config.proxy,
      headers: form.value.config.headers,
      timeout: form.value.config.timeout
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
  height: 100px;
  resize: vertical;
  font-family: 'Courier New', monospace;
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
