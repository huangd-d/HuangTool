<template>
  <div class="endpoint-view">
    <!-- 接口信息 -->
    <div class="endpoint-info">
      <h3>{{ endpoint.name }}</h3>
      <div class="info-row">
        <span class="method-badge" :class="endpoint.method.toLowerCase()">
          {{ endpoint.method }}
        </span>
        <span class="url">{{ endpoint.url }}</span>
      </div>
    </div>

    <!-- 标签页 -->
    <div class="endpoint-tabs">
      <div class="tab-header">
        <div 
          v-for="tab in tabs" 
          :key="tab.id" 
          class="tab-item" 
          :class="{ active: activeTabId === tab.id }"
          @click="switchTab(tab.id)"
        >
          {{ tab.name }}
        </div>
      </div>
      <div class="tab-content">
        <!-- 请求标签页 -->
        <div v-if="activeTabId === 'request'" class="request-tab">
          <!-- 请求参数 -->
          <div class="param-section">
            <h4>请求参数</h4>
            <div class="param-table">
              <div class="param-header">
                <div class="param-name">参数名</div>
                <div class="param-value">值</div>
                <div class="param-action">操作</div>
              </div>
              <div v-for="(param, index) in endpoint.params" :key="index" class="param-row">
                <div class="param-name">
                  <input v-model="param.name" type="text" placeholder="参数名">
                </div>
                <div class="param-value">
                  <input v-model="param.value" type="text" placeholder="参数值">
                </div>
                <div class="param-action">
                  <button @click="removeParam(index)" class="remove-btn">删除</button>
                </div>
              </div>
              <div class="param-row add-param">
                <button @click="addParam" class="add-param-btn">+ 添加参数</button>
              </div>
            </div>
          </div>

          <!-- 请求头 -->
          <div class="header-section">
            <h4>请求头</h4>
            <div class="header-table">
              <div class="header-header">
                <div class="header-name">Header 名</div>
                <div class="header-value">值</div>
                <div class="header-action">操作</div>
              </div>
              <div v-for="(header, key) in endpoint.headers" :key="key" class="header-row">
                <div class="header-name">
                  <input v-model="headerKeys[key]" type="text" placeholder="Header 名" @input="updateHeaderKey(key, $event)">
                </div>
                <div class="header-value">
                  <input v-model="header" type="text" placeholder="Header 值">
                </div>
                <div class="header-action">
                  <button @click="removeHeader(key)" class="remove-btn">删除</button>
                </div>
              </div>
              <div class="header-row add-header">
                <button @click="addHeader" class="add-header-btn">+ 添加 Header</button>
              </div>
            </div>
          </div>

          <!-- 请求体 -->
          <div class="body-section">
            <h4>请求体</h4>
            <div class="body-content">
              <div class="body-type">
                <label>类型:</label>
                <select v-model="endpoint.bodyType">
                  <option value="json">JSON</option>
                  <option value="form">Form</option>
                  <option value="raw">Raw</option>
                </select>
              </div>
              <div class="body-editor">
                <textarea v-model="endpoint.body" placeholder="输入请求体"></textarea>
              </div>
            </div>
          </div>

          <!-- 发送按钮 -->
          <div class="action-section">
            <button @click="sendRequest" class="send-btn">发送请求</button>
          </div>
        </div>

        <!-- 响应标签页 -->
        <div v-if="activeTabId === 'response'" class="response-tab">
          <div v-if="loading" class="loading">发送中...</div>
          <div v-else-if="response" class="response-content">
            <div class="response-header">
              <span class="status-code" :class="getStatusClass(response.status)">
                {{ response.status }}
              </span>
              <span class="status-text">{{ response.statusText }}</span>
            </div>
            <div class="response-body">
              <pre>{{ formattedResponse }}</pre>
            </div>
          </div>
          <div v-else class="empty-response">
            响应将显示在这里
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// Props
const props = defineProps({
  endpoint: {
    type: Object,
    required: true
  },
  projectConfig: {
    type: Object,
    default: () => ({})
  }
})

// Emits
const emit = defineEmits(['send-request'])

// 状态
const activeTabId = ref('request')
const loading = ref(false)
const response = ref(null)
const headerKeys = ref({})

// 标签页配置
const tabs = [
  { id: 'request', name: '请求' },
  { id: 'response', name: '响应' }
]

// 计算属性
const formattedResponse = computed(() => {
  if (response.value?.data) {
    try {
      return JSON.stringify(response.value.data, null, 2)
    } catch (e) {
      return response.value.data
    }
  }
  return ''
})

// 生命周期
watch(() => props.endpoint.headers, (newHeaders) => {
  // 初始化 headerKeys
  const keys = {}
  for (const key in newHeaders) {
    keys[key] = key
  }
  headerKeys.value = keys
}, { deep: true, immediate: true })

// 切换标签页
function switchTab(tabId) {
  activeTabId.value = tabId
}

// 添加参数
function addParam() {
  if (!props.endpoint.params) {
    props.endpoint.params = []
  }
  props.endpoint.params.push({ name: '', value: '' })
}

// 删除参数
function removeParam(index) {
  if (props.endpoint.params) {
    props.endpoint.params.splice(index, 1)
  }
}

// 添加 Header
function addHeader() {
  if (!props.endpoint.headers) {
    props.endpoint.headers = {}
  }
  const newKey = `header_${Date.now()}`
  props.endpoint.headers[newKey] = ''
  headerKeys.value[newKey] = ''
}

// 删除 Header
function removeHeader(key) {
  if (props.endpoint.headers) {
    delete props.endpoint.headers[key]
    delete headerKeys.value[key]
  }
}

// 更新 Header 键
function updateHeaderKey(oldKey, event) {
  const newKey = event.target.value
  if (newKey && oldKey !== newKey && props.endpoint.headers) {
    props.endpoint.headers[newKey] = props.endpoint.headers[oldKey]
    delete props.endpoint.headers[oldKey]
    headerKeys.value[newKey] = newKey
    delete headerKeys.value[oldKey]
  }
}

// 发送请求
async function sendRequest() {
  loading.value = true
  response.value = null

  try {
    // 合并项目配置的 header
    const headers = { ...props.projectConfig.headers, ...props.endpoint.headers }

    // 构建请求选项
    const options = {
      method: props.endpoint.method,
      url: props.endpoint.url,
      headers: headers,
      params: props.endpoint.params,
      body: props.endpoint.body,
      proxy: props.projectConfig.proxy
    }

    // 使用 electronAPI 发送请求
    if (window.electronAPI && window.electronAPI.sendApiRequest) {
      const result = await window.electronAPI.sendApiRequest(options)
      response.value = result
    } else {
      // 模拟响应
      response.value = {
        status: 200,
        statusText: 'OK',
        data: { message: '模拟响应', data: { test: 'data' } }
      }
    }

    // 触发发送请求事件
    emit('send-request', props.endpoint, props.projectConfig)
  } catch (error) {
    response.value = {
      status: 500,
      statusText: 'Error',
      data: { error: error.message }
    }
  } finally {
    loading.value = false
  }
}

// 获取状态码样式类
function getStatusClass(status) {
  if (status >= 200 && status < 300) {
    return 'success'
  } else if (status >= 300 && status < 400) {
    return 'redirect'
  } else if (status >= 400 && status < 500) {
    return 'error'
  } else if (status >= 500) {
    return 'server-error'
  }
  return ''
}
</script>

<style scoped>
.endpoint-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

/* 接口信息 */
.endpoint-info {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ddd;
}

.endpoint-info h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.method-badge {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 12px;
  color: white;
  font-weight: 500;
}

.method-badge.get {
  background: #5cb85c;
}

.method-badge.post {
  background: #337ab7;
}

.method-badge.put {
  background: #f0ad4e;
}

.method-badge.delete {
  background: #d9534f;
}

.url {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: #666;
}

/* 标签页 */
.endpoint-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.tab-header {
  display: flex;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.tab-item {
  padding: 10px 20px;
  cursor: pointer;
  border-right: 1px solid #ddd;
}

.tab-item:hover {
  background: #e0e0e0;
}

.tab-item.active {
  background: white;
  border-bottom: 2px solid #42b883;
  font-weight: 500;
}

.tab-content {
  flex: 1;
  overflow: auto;
  padding: 20px;
}

/* 请求标签页 */
.request-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.param-section,
.header-section,
.body-section {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 4px;
}

.param-section h4,
.header-section h4,
.body-section h4 {
  margin: 0 0 15px 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

/* 参数表格 */
.param-table,
.header-table {
  width: 100%;
  border-collapse: collapse;
}

.param-header,
.header-header {
  display: grid;
  grid-template-columns: 1fr 1fr 100px;
  gap: 10px;
  padding: 10px;
  background: #e9e9e9;
  font-weight: 500;
  border-radius: 4px 4px 0 0;
}

.param-row,
.header-row {
  display: grid;
  grid-template-columns: 1fr 1fr 100px;
  gap: 10px;
  padding: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.param-row:last-child,
.header-row:last-child {
  border-bottom: none;
}

.param-row input,
.header-row input {
  width: 100%;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 12px;
}

.remove-btn {
  background: #d9534f;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
}

.remove-btn:hover {
  background: #c9302c;
}

.add-param,
.add-header {
  justify-content: center;
  padding: 15px;
  background: #f0f0f0;
  border-radius: 0 0 4px 4px;
}

.add-param-btn,
.add-header-btn {
  background: #42b883;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.add-param-btn:hover,
.add-header-btn:hover {
  background: #35495e;
}

/* 请求体 */
.body-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.body-type {
  display: flex;
  align-items: center;
  gap: 10px;
}

.body-type label {
  font-size: 12px;
  font-weight: 500;
  color: #666;
}

.body-type select {
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 12px;
}

.body-editor textarea {
  width: 100%;
  height: 200px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  resize: vertical;
}

/* 操作区域 */
.action-section {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

.send-btn {
  background: #42b883;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.send-btn:hover {
  background: #35495e;
}

/* 响应标签页 */
.response-tab {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.response-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.response-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: #f0f0f0;
  border-radius: 4px;
}

.status-code {
  font-size: 14px;
  padding: 4px 8px;
  border-radius: 12px;
  color: white;
  font-weight: 500;
}

.status-code.success {
  background: #5cb85c;
}

.status-code.redirect {
  background: #f0ad4e;
}

.status-code.error {
  background: #d9534f;
}

.status-code.server-error {
  background: #777;
}

.status-text {
  font-size: 14px;
  color: #666;
}

.response-body {
  flex: 1;
  background: #f9f9f9;
  padding: 15px;
  border-radius: 4px;
  overflow: auto;
}

.response-body pre {
  margin: 0;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  white-space: pre-wrap;
}

.empty-response {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}
</style>