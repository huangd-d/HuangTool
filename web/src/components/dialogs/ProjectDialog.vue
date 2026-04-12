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

// 监听 project 变化，更新表单
watch(() => props.project, (newProject) => {
  if (newProject) {
    form.value = {
      ...newProject,
      config: {
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
  if (!form.value.name) {
    alert('请输入项目名称')
    return
  }
  
  emit('save', { ...form.value })
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
  background: white;
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
  color: #333;
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
  color: #666;
}

.form-item input,
.form-item select,
.form-item textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 12px;
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
}

.dialog-actions button {
  padding: 8px 16px;
  border: 1px solid #ddd;
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
