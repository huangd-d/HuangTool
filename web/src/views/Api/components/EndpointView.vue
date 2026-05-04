<template>
  <div class="endpoint-view">
    <!-- 顶部请求栏 -->
    <div class="request-bar">
      <select v-model="endpoint.config.method" class="method-select" :class="endpoint.config.method?.toLowerCase()">
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
        <option value="DELETE">DELETE</option>
        <option value="PATCH">PATCH</option>
      </select>
      <input v-model="endpoint.config.url" type="text" class="url-input" placeholder="输入请求 URL" />
      <button @click="sendRequest" class="send-btn" :disabled="loading">
        {{ loading ? '发送中...' : 'Send' }}
      </button>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <!-- 左侧请求区 -->
      <div class="request-panel">
        <!-- 标签页 -->
        <div class="tabs-header">
          <div v-for="tab in tabs" :key="tab.id" class="tab-item" :class="{ active: activeTabId === tab.id }"
            @click="switchTab(tab.id)">
            {{ tab.name }}
          </div>
        </div>

        <!-- 标签内容 -->
        <div class="tabs-content">
          <!-- Params 标签页 -->
          <div v-if="activeTabId === 'params'" class="tab-pane">
            <div class="param-table">
              <div class="table-header">
                <div class="col-enable"></div>
                <div class="col-key">参数名</div>
                <div class="col-value">值</div>
                <div class="col-action">操作</div>
              </div>
              <div v-for="(param, index) in endpoint.config.params" :key="index" class="table-row">
                <div class="col-enable">
                  <input type="checkbox" v-model="param.enabled" />
                </div>
                <div class="col-key">
                  <input v-model="param.name" type="text" placeholder="参数名">
                </div>
                <div class="col-value">
                  <input v-model="param.value" type="text" placeholder="参数值">
                </div>
                <div class="col-action">
                  <button @click="removeParam(index)" class="icon-btn">×</button>
                </div>
              </div>
              <div class="table-row add-row">
                <button @click="addParam" class="add-btn">+ 添加参数</button>
              </div>
            </div>
          </div>

          <!-- Headers 标签页 -->
          <div v-if="activeTabId === 'headers'" class="tab-pane">
            <div class="param-table">
              <div class="table-header">
                <div class="col-enable"></div>
                <div class="col-key">Header 名</div>
                <div class="col-value">值</div>
                <div class="col-action">操作</div>
              </div>
              <div v-for="(header, index) in headerList" :key="index" class="table-row">
                <div class="col-enable">
                  <input type="checkbox" v-model="header.enabled" />
                </div>
                <div class="col-key">
                  <input v-model="header.key" type="text" placeholder="Header 名">
                </div>
                <div class="col-value">
                  <input v-model="header.value" type="text" placeholder="Header 值">
                </div>
                <div class="col-action">
                  <button @click="removeHeader(index)" class="icon-btn">×</button>
                </div>
              </div>
              <div class="table-row add-row">
                <button @click="addHeader" class="add-btn">+ 添加 Header</button>
              </div>
            </div>
          </div>

          <!-- Body 标签页 -->
          <div v-if="activeTabId === 'body'" class="tab-pane">
            <div class="body-type-selector">
              <label>
                <input type="radio" v-model="endpoint.config.bodyType" value="none" />
                none
              </label>
              <label>
                <input type="radio" v-model="endpoint.config.bodyType" value="json" />
                JSON
              </label>
              <label>
                <input type="radio" v-model="endpoint.config.bodyType" value="form" />
                x-www-form-urlencoded
              </label>
              <label>
                <input type="radio" v-model="endpoint.config.bodyType" value="raw" />
                raw
              </label>
            </div>

            <div v-if="endpoint.config.bodyType !== 'none'" class="body-editor">
              <textarea v-model="endpoint.config.body" placeholder="输入请求体" class="body-textarea"></textarea>
              <div v-if="endpoint.config.bodyType === 'json'" class="body-actions">
                <button @click="formatJSON" class="action-btn">格式化</button>
                <button @click="compactJSON" class="action-btn">压缩</button>
              </div>
            </div>
          </div>

          <!-- Authorization 标签页 -->
          <div v-if="activeTabId === 'auth'" class="tab-pane">
            <div class="auth-selector">
              <select v-model="authType">
                <option value="none">No Auth</option>
                <option value="bearer">Bearer Token</option>
                <option value="basic">Basic Auth</option>
                <option value="apikey">API Key</option>
              </select>
            </div>

            <div v-if="authType === 'bearer'" class="auth-form">
              <div class="form-item">
                <label>Token:</label>
                <input v-model="authToken" type="text" placeholder="输入 Bearer Token">
              </div>
            </div>

            <div v-if="authType === 'basic'" class="auth-form">
              <div class="form-item">
                <label>Username:</label>
                <input v-model="authUsername" type="text" placeholder="用户名">
              </div>
              <div class="form-item">
                <label>Password:</label>
                <input v-model="authPassword" type="password" placeholder="密码">
              </div>
            </div>
          </div>
          <!-- responseType 标签页 -->
          <div v-if="activeTabId === 'response'" class="tab-pane">
            <div class="form-item">
              <label>responseType:</label>
              <input v-model="responseType" type="text" placeholder="json, text, stream, blob, arraybuffer, document">
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧响应区 -->
      <div class="response-panel" v-if="response">
        <div class="response-header">
          <div class="status-info">
            <span class="status-code" :class="getStatusClass(response.status)">
              {{ response.status }}
            </span>
            <span class="status-text">{{ response.statusText }}</span>
          </div>
          <div class="response-meta">
            <span class="meta-item">{{ response.time }}ms</span>
            <span class="meta-item">{{ formatSize(response.size) }}</span>
            <button @click="copyResponse" class="icon-btn" title="复制响应">📋</button>
          </div>
        </div>

        <div class="response-tabs">
          <div v-for="tab in responseTabs" :key="tab.id" class="response-tab"
            :class="{ active: activeResponseTab === tab.id }" @click="activeResponseTab = tab.id">
            {{ tab.name }}
          </div>
        </div>

        <div class="response-content">
          <div v-if="activeResponseTab === 'body'" class="response-body">
            <pre>{{ formattedResponse }}</pre>
          </div>
          <div v-if="activeResponseTab === 'headers'" class="response-headers">
            <div v-for="(value, key) in response.headers" :key="key" class="header-item">
              <span class="header-key">{{ key }}:</span>
              <span class="header-value">{{ value }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="response-empty">
        <p>点击 "Send" 按钮发送请求</p>
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
const emit = defineEmits([])

// 状态
const activeTabId = ref('params')
const activeResponseTab = ref('body')
const loading = ref(false)
const response = ref(null)

// 标签页配置
const tabs = [
  { id: 'params', name: 'Params' },
  { id: 'headers', name: 'Headers' },
  { id: 'body', name: 'Body' },
  { id: 'response', name: 'responseType' }
]

const responseTabs = [
  { id: 'body', name: 'Body' },
  { id: 'headers', name: 'Headers' }
]

// Auth 状态
const authType = ref('none')
const authToken = ref('')
const authUsername = ref('')
const authPassword = ref('')

// `responseType` 表示浏览器将要响应的数据类型
// 选项包括: 'arraybuffer', 'document', 'json', 'text', 'stream'
// 浏览器专属：'blob'
const responseType = ref('json')

// Header 列表（转换为数组形式）
const headerList = ref([])

// 初始化 headerList（仅首次，避免循环）
let headerListInitialized = false
watch(() => props.endpoint.config?.headers, (newHeaders) => {
  if (headerListInitialized) return
  if (newHeaders && typeof newHeaders === 'object') {
    headerList.value = Object.entries(newHeaders).map(([key, value]) => ({
      key,
      value,
      enabled: true
    }))
  } else {
    headerList.value = []
  }
  headerListInitialized = true
}, { deep: true, immediate: true })

// headerList 变更时写回 config.headers
watch(headerList, (newList) => {
  if (!props.endpoint.config) return
  const headers = {}
  newList.forEach(h => {
    if (h.key && h.enabled) {
      headers[h.key] = h.value
    }
  })
  props.endpoint.config.headers = headers
}, { deep: true })

// 计算属性
const formattedResponse = computed(() => {
  if (response.value?.data) {
    try {
      if (typeof response.value.data === 'object') {
        return JSON.stringify(response.value.data, null, 2)
      }
      return response.value.data
    } catch (e) {
      return response.value.data
    }
  }
  return ''
})

// 切换标签页
function switchTab(tabId) {
  activeTabId.value = tabId
}

// 添加参数
function addParam() {
  if (!props.endpoint.config.params) {
    props.endpoint.config.params = []
  }
  props.endpoint.config.params.push({ name: '', value: '', enabled: true })
}

// 删除参数
function removeParam(index) {
  if (props.endpoint.config.params) {
    props.endpoint.config.params.splice(index, 1)
  }
}

// 添加 Header
function addHeader() {
  headerList.value.push({ key: '', value: '', enabled: true })
}

// 删除 Header
function removeHeader(index) {
  headerList.value.splice(index, 1)
}

// 格式化 JSON
function formatJSON() {
  try {
    const body = props.endpoint.config.body
    if (body) {
      props.endpoint.config.body = JSON.stringify(JSON.parse(body), null, 2)
    }
  } catch (e) {
    alert('JSON 格式错误')
  }
}

// 压缩 JSON
function compactJSON() {
  try {
    const body = props.endpoint.config.body
    if (body) {
      props.endpoint.config.body = JSON.stringify(JSON.parse(body))
    }
  } catch (e) {
    alert('JSON 格式错误')
  }
}

// 发送请求
async function sendRequest() {
  loading.value = true
  response.value = null

  try {
    // 构建 headers
    const headers = { ...props.projectConfig.headers }

    // 添加 headerList 中的 headers
    headerList.value.forEach(header => {
      if (header.key && header.enabled) {
        headers[header.key] = header.value
      }
    })

    // 处理 Authorization
    // if (authType.value === 'bearer' && authToken.value) {
    //   headers['Authorization'] = `Bearer ${authToken.value}`
    // } else if (authType.value === 'basic' && authUsername.value) {
    //   const credentials = btoa(`${authUsername.value}:${authPassword.value}`)
    //   headers['Authorization'] = `Basic ${credentials}`
    // }

    const options = {
      baseUrl: props.projectConfig.baseUrl || '',
      url: props.endpoint.config.url,
      method: props.endpoint.config.method,
      headers: headers,
      params: props.endpoint.config.params || [],
      body: props.endpoint.config.body || '',
      bodyType: props.endpoint.config.bodyType || 'none',
      responseType: responseType.value || 'json',
      proxy: props.projectConfig.proxy || '',
      timeout: props.endpoint.config.timeout || props.projectConfig.timeout || 30000
    }

    // 使用 electronAPI 发送请求
    if (window.electronAPI && window.electronAPI.sendApiRequest) {
      // 确保 options 对象是可序列化的，避免 IPC 通信中的克隆错误
      const serializableOptions = JSON.parse(JSON.stringify(options))
      const result = await window.electronAPI.sendApiRequest(serializableOptions)
      response.value = result

      // 切换到响应标签页
      activeResponseTab.value = 'body'
    } else {
      throw new Error('API 不可用')
    }
  } catch (error) {
    console.log('error--web', error);
    
    response.value = {
      success: false,
      status: 0,
      statusText: 'Error',
      data: { error: error.message },
      time: 0,
      size: 0,
      headers: {}
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

// 格式化大小
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB'
}

// 复制响应
function copyResponse() {
  if (response.value?.data) {
    const text = typeof response.value.data === 'object'
      ? JSON.stringify(response.value.data, null, 2)
      : response.value.data
    navigator.clipboard.writeText(text)
  }
}
</script>

<style scoped>
.endpoint-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--content-bg);
}

/* 顶部请求栏 */
.request-bar {
  display: flex;
  gap: 10px;
  padding: 15px 20px;
  background: var(--content-bg-card);
  border-bottom: 1px solid var(--content-border);
  align-items: center;
}

.method-select {
  padding: 8px 12px;
  border: 1px solid var(--content-border);
  border-radius: 6px;
  background: #FFFFFF;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  min-width: 100px;
  transition: all 0.2s;
  color: var(--content-text);
}

.method-select:hover {
  border-color: var(--accent);
}

.method-select.get {
  color: #34c759;
}

.method-select.post {
  color: var(--accent);
}

.method-select.put {
  color: #ff9500;
}

.method-select.delete {
  color: #ff3b30;
}

.method-select.patch {
  color: #5856d6;
}

.url-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--content-border);
  border-radius: 6px;
  font-size: 13px;
  font-family: 'SF Mono', 'Courier New', monospace;
  transition: all 0.2s;
  background: #FFFFFF;
  color: var(--content-text);
}

.url-input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(255, 144, 0, 0.15);
}

.send-btn {
  padding: 8px 24px;
  background: var(--accent);
  color: #FFFFFF;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.send-btn:hover:not(:disabled) {
  background: var(--accent-hover);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 主内容区 */
.main-content {
  flex: 1;
  display: flex;
  gap: 1px;
  background: var(--content-border);
  overflow: hidden;
}

/* 请求面板 */
.request-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--content-bg-card);
  overflow: hidden;
}

/* 标签页头部 */
.tabs-header {
  display: flex;
  background: var(--content-bg-card);
  border-bottom: 1px solid var(--content-border);
}

.tab-item {
  padding: 10px 20px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: var(--content-text-secondary);
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-item:hover {
  color: var(--accent);
  background: var(--content-bg);
}

.tab-item.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
  background: var(--content-bg-card);
}

/* 标签内容 */
.tabs-content {
  flex: 1;
  overflow: auto;
  padding: 15px;
}

.tab-pane {
  height: 100%;
}

/* 参数表格 */
.param-table {
  background: var(--content-bg-card);
  border-radius: 8px;
  border: 1px solid var(--content-border);
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 40px 1fr 1fr 50px;
  gap: 10px;
  padding: 10px 15px;
  background: var(--content-bg);
  font-size: 12px;
  font-weight: 600;
  color: var(--content-text-secondary);
  border-bottom: 1px solid var(--content-border);
}

.table-row {
  display: grid;
  grid-template-columns: 40px 1fr 1fr 50px;
  gap: 10px;
  padding: 8px 15px;
  border-bottom: 1px solid var(--content-border);
  align-items: center;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row input[type="text"] {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--content-border);
  border-radius: 4px;
  font-size: 12px;
  transition: all 0.2s;
  background: #FFFFFF;
  color: var(--content-text);
}

.table-row input[type="text"]:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgba(255, 144, 0, 0.15);
}

.table-row input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.col-enable {
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-row {
  padding: 12px 15px;
  background: var(--content-bg-card);
}

.add-btn {
  width: 100%;
  padding: 8px;
  background: transparent;
  border: 1px dashed var(--content-border);
  border-radius: 4px;
  color: var(--accent);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.add-btn:hover {
  background: rgba(255, 144, 0, 0.1);
  border-color: var(--accent);
}

.icon-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: var(--text-hint);
  font-size: 18px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #ff3b30;
  color: white;
}

/* Body 编辑器 */
.body-type-selector {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  padding: 10px;
  background: var(--content-bg-card);
  border-radius: 6px;
}

.body-type-selector label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--content-text-secondary);
  cursor: pointer;
}

.body-type-selector input[type="radio"] {
  cursor: pointer;
}

.body-editor {
  position: relative;
}

.body-textarea {
  width: 100%;
  min-height: 300px;
  padding: 12px;
  border: 1px solid var(--content-border);
  border-radius: 6px;
  font-family: 'SF Mono', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  resize: vertical;
  transition: all 0.2s;
  background: #FFFFFF;
  color: var(--content-text);
}

.body-textarea:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(255, 144, 0, 0.15);
}

.body-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.action-btn {
  padding: 6px 12px;
  background: #1B1B1B;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  color: #FFFFFF;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--accent);
  color: #FFFFFF;
}

/* Authorization */
.auth-selector {
  margin-bottom: 15px;
}

.auth-selector select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--content-border);
  border-radius: 6px;
  font-size: 13px;
  background: #FFFFFF;
  color: var(--content-text);
  cursor: pointer;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-item label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--content-text-secondary);
}

.form-item input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--content-border);
  border-radius: 6px;
  font-size: 13px;
  transition: all 0.2s;
  background: #FFFFFF;
  color: var(--content-text);
}

.form-item input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(255, 144, 0, 0.15);
}

/* 响应面板 */
.response-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--content-bg-card);
  border-left: 1px solid var(--content-border);
  overflow: hidden;
}

.response-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: var(--content-bg-card);
  border-bottom: 1px solid var(--content-border);
}

.status-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-code {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: white;
}

.status-code.success {
  background: #34c759;
}

.status-code.redirect {
  background: #ff9500;
}

.status-code.error {
  background: #ff3b30;
}

.status-code.server-error {
  background: #8e8e93;
}

.status-text {
  font-size: 13px;
  color: var(--content-text-secondary);
}

.response-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.meta-item {
  font-size: 12px;
  color: var(--content-text-hint);
  font-family: 'SF Mono', 'Courier New', monospace;
}

.response-tabs {
  display: flex;
  background: var(--content-bg-card);
  border-bottom: 1px solid var(--content-border);
}

.response-tab {
  padding: 8px 16px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: var(--content-text-secondary);
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.response-tab:hover {
  color: var(--accent);
}

.response-tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
  background: var(--content-bg-card);
}

.response-content {
  flex: 1;
  overflow: auto;
  padding: 15px;
}

.response-body pre {
  margin: 0;
  font-family: 'SF Mono', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  color: var(--content-text);
}

.response-headers {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header-item {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: var(--content-bg);
  border-radius: 4px;
  font-size: 12px;
}

.header-key {
  font-weight: 600;
  color: var(--accent);
  font-family: 'SF Mono', 'Courier New', monospace;
}

.header-value {
  color: var(--content-text-secondary);
  font-family: 'SF Mono', 'Courier New', monospace;
  word-break: break-all;
}

/* 空状态 */
.response-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--content-text-hint);
  font-size: 13px;
}
</style>