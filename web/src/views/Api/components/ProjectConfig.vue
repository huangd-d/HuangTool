<template>
  <div class="config-panel">
    <div class="config-content">
      <div class="config-item">
        <label>基础 URL:</label>
        <input v-model="form.baseUrl" type="text" placeholder="https://api.example.com">
      </div>
      <div class="config-item">
        <label>代理地址:</label>
        <input v-model="form.proxy" type="text" placeholder="http://proxy.example.com:8080">
      </div>
      <div class="config-item">
        <label>共用 Header (JSON):</label>
        <textarea v-model="headersText" placeholder='{"Authorization": "Bearer token"}'></textarea>
      </div>
      <div class="config-item">
        <label>超时时间 (ms):</label>
        <input v-model.number="form.timeout" type="number" placeholder="30000">
        <button @click="handleSave" class="save-btn">保存通用配置</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch ,ref } from 'vue'

const props = defineProps({
  project: { type: Object, required: true }
})

const emit = defineEmits(['save'])

const form = reactive({
  baseUrl: '',
  proxy: '',
  timeout: 30000
})

const headersText = ref('{}')

watch(() => props.project, (proj) => {
  if (proj?.config) {
    form.baseUrl = proj.config.baseUrl || ''
    form.proxy = proj.config.proxy || ''
    form.timeout = proj.config.timeout ?? 30000
    headersText.value = proj.config.headers
      ? JSON.stringify(proj.config.headers, null, 2)
      : '{}'
  }
}, { immediate: true })

function handleSave() {
  let headers = {}
  try {
    headers = JSON.parse(headersText.value)
  } catch {
    alert('Header JSON 格式无效')
    return
  }

  emit('save', {
    ...props.project,
    config: {
      ...props.project.config,
      baseUrl: form.baseUrl,
      proxy: form.proxy,
      timeout: form.timeout,
      headers
    }
  })
}
</script>

<style scoped>
.config-panel {
  background: var(--content-bg);
  padding: 0;
}

.config-content {
  padding: 15px;
  background-color: var(--content-bg);
}

.config-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15px;
}

.config-item label {
  flex-basis: 140px;
  flex-shrink: 0;
  padding-right: 6px;
  height: 32px;
  line-height: 32px;
  font-size: 12px;
  color: var(--content-text-secondary);
  text-align: right;
}

.config-item input,
.config-item textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid var(--content-border);
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 12px;
  background: var(--content-bg-card);
  color: var(--content-text);
}

.config-item textarea {
  height: 100px;
  resize: vertical;
  font-family: 'Courier New', monospace;
}

.save-btn {
  margin-left: 6px;
  background: var(--accent);
  color: #FFFFFF;
  border: none;
  padding: 6px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
  transition: all 0.2s;
}

.save-btn:hover {
  background: var(--accent-hover);
}
</style>
