<template>
  <div class="api-container">
    <!-- 左侧树结构 -->
    <div class="api-sidebar">
      <el-tree
        :data="treeData"
        :props="treeProps"
        node-key="id"
        @node-click="handleNodeClick"
        default-expand-all
      />
    </div>

    <!-- 右侧内容 -->
    <div class="api-content">
      <!-- 通用配置 -->
      <div class="config-panel" v-if="selectedProject">
        <div class="config-header" @click="toggleConfig">
          <h3>通用配置</h3>
          <span class="toggle-icon">{{ configExpanded ? '▼' : '▶' }}</span>
        </div>
        <div class="config-content" v-show="configExpanded">
          <div class="config-item">
            <label>基础 URL:</label>
            <input v-model="selectedProject.config.baseUrl" type="text" placeholder="https://api.example.com">
          </div>
          <div class="config-item">
            <label>代理地址:</label>
            <input v-model="selectedProject.config.proxy" type="text" placeholder="http://proxy.example.com:8080">
          </div>
          <div class="config-item">
            <label>共用 Header (JSON):</label>
            <textarea v-model="configHeaders" placeholder='{"Authorization": "Bearer token"}'></textarea>
          </div>
          <div class="config-item">
            <label>超时时间 (ms):</label>
            <input v-model.number="selectedProject.config.timeout" type="number" placeholder="30000">
            <button @click="saveProjectConfig" class="save-btn">保存通用配置</button>
          </div>
        </div>
      </div>

      <!-- Tab 容器 -->
      <div class="tab-container" v-if="tabs.length > 0">
        <div class="tab-header">
          <div v-for="tab in tabs" :key="tab.id" class="tab-item" :class="{ active: activeTabId === tab.id }">
            <span @click="switchTab(tab.id)">{{ tab.name }}</span>
            <button @click="closeTab(tab.id)" class="tab-close">×</button>
          </div>
        </div>
        <div class="tab-content">
          <div v-for="tab in tabs" :key="tab.id" class="tab-pane" :class="{ active: activeTabId === tab.id }">
            <EndpointView :endpoint="tab.endpoint" :project-config="selectedProject?.config"
              @send-request="handleSendRequest" />
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="empty-state" v-if="tabs.length === 0 && selectedProject">
        <h3>请选择一个接口</h3>
        <p>从左侧列表中选择接口或创建新接口</p>
      </div>
      <div class="empty-state" v-if="!selectedProject">
        <h3>请选择或创建项目</h3>
        <p>从左侧列表中选择项目或创建新项目</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import EndpointView from '../components/EndpointView.vue'
// 状态管理
const selectedProject = ref(null)
const selectedCategory = ref(null)
const tabs = ref([])
const activeTabId = ref(null)
const configExpanded = ref(false)

// 树结构数据
const treeData = ref([])

// 树结构属性配置
const treeProps = reactive({
  children: 'children',
  label: 'name'
})

// 加载项目数据
async function loadProjects() {
  if (window.electronAPI && window.electronAPI.getApiProjects) {
    try {
      const projects = await window.electronAPI.getApiProjects()
      // 转换为树结构数据
      treeData.value = projects.map(project => {
        return {
          id: project.id,
          name: project.name,
          type: 'project',
          class: 'project-node',
          children: (project.categories || []).map(category => {
            return {
              id: category.id,
              name: category.name,
              type: 'category',
              class: 'category-node',
              children: (category.endpoints || []).map(endpoint => {
                return {
                  id: endpoint.id,
                  name: endpoint.name,
                  type: 'endpoint',
                  class: 'endpoint-node',
                  endpoint: endpoint
                }
              })
            }
          })
        }
      })
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }
}

// 处理节点点击
function handleNodeClick(node) {
  if (node.type === 'project') {
    // 选择项目
    selectedProject.value = node
    selectedCategory.value = null
    // 清空相关的 tab
    tabs.value = []
    activeTabId.value = null
  } else if (node.type === 'category') {
    // 选择分类
    selectedCategory.value = node
  } else if (node.type === 'endpoint') {
    // 打开接口 tab
    openEndpointTab(node.endpoint)
  }
}

// 切换配置面板展开/折叠
function toggleConfig() {
  configExpanded.value = !configExpanded.value
}

// 计算属性 - 配置 Headers 显示
const configHeaders = computed({
  get: () => {
    if (selectedProject.value?.config?.headers) {
      return JSON.stringify(selectedProject.value.config.headers, null, 2)
    }
    return '{}'
  },
  set: (value) => {
    try {
      if (selectedProject.value) {
        selectedProject.value.config.headers = JSON.parse(value)
      }
    } catch (e) {
      console.error('Invalid JSON:', e)
    }
  }
})

// 处理项目选择
function handleSelectProject(project) {
  selectedProject.value = project
  selectedCategory.value = null
  // 清空相关的 tab
  tabs.value = []
  activeTabId.value = null
}

// 处理分类选择
function handleSelectCategory(category) {
  selectedCategory.value = category
}

// 生命周期
onMounted(() => {
  loadProjects()
})

// 保存项目配置
async function saveProjectConfig() {
  if (selectedProject.value) {
    try {
      // 确保 config 结构完整
      const projectData = {
        ...selectedProject.value,
        config: {
          baseUrl: selectedProject.value.config?.baseUrl || '',
          proxy: selectedProject.value.config?.proxy || '',
          headers: selectedProject.value.config?.headers || {},
          timeout: selectedProject.value.config?.timeout || 30000
        }
      }

      await window.electronAPI.updateApiProject(projectData)
      alert('配置已保存')
      // 重新加载项目列表
      await loadProjects()
    } catch (error) {
      console.error('Error saving project config:', error)
      alert('保存配置失败: ' + error.message)
    }
  }
}

// 打开接口 Tab
function openEndpointTab(endpoint) {
  console.log('Opening endpoint tab:', endpoint)

  // 确保 endpoint 有完整的 config 结构
  const endpointData = {
    ...endpoint,
    config: {
      headers: endpoint.config?.headers || {},
      params: endpoint.config?.params || [],
      bodyType: endpoint.config?.bodyType || 'none',
      body: endpoint.config?.body || '',
      timeout: endpoint.config?.timeout || 30000,
      followRedirect: endpoint.config?.followRedirect !== false,
      ...endpoint.config
    }
  }

  // 检查是否已存在该接口的 tab
  const existingTab = tabs.value.find(tab => tab.endpoint.id === endpoint.id)
  if (existingTab) {
    activeTabId.value = existingTab.id
  } else {
    const newTab = {
      id: Date.now().toString(),
      name: endpoint.name,
      endpoint: endpointData
    }
    tabs.value.push(newTab)
    activeTabId.value = newTab.id
  }
}

// 切换 Tab
function switchTab(tabId) {
  activeTabId.value = tabId
}

// 关闭 Tab
function closeTab(tabId) {
  tabs.value = tabs.value.filter(tab => tab.id !== tabId)
  if (activeTabId.value === tabId) {
    activeTabId.value = tabs.value.length > 0 ? tabs.value[0].id : null
  }
}

// 处理请求发送
async function handleSendRequest(endpoint, projectConfig) {
  try {
    // 合并配置
    const headers = {
      ...(projectConfig?.headers || {}),
      ...(endpoint.config?.headers || {})
    }

    const options = {
      baseUrl: projectConfig?.baseUrl || '',
      url: endpoint.url,
      method: endpoint.method,
      headers: headers,
      params: endpoint.config?.params || [],
      body: endpoint.config?.body || '',
      bodyType: endpoint.config?.bodyType || 'none',
      proxy: endpoint.config?.proxy || projectConfig?.proxy || '',
      timeout: endpoint.config?.timeout || projectConfig?.timeout || 30000
    }

    // 使用 electronAPI 发送请求
    if (window.electronAPI && window.electronAPI.sendApiRequest) {
      const result = await window.electronAPI.sendApiRequest(options)
      return result
    } else {
      throw new Error('API 不可用')
    }
  } catch (error) {
    console.error('Request error:', error)
    throw error
  }
}
</script>

<style scoped>
.api-container {
  height: 100%;
  display: flex;
  flex: 1;
  overflow-y: auto;
}

/* 左侧树结构 */
.api-sidebar {
  width: 300px;
  background: #f5f5f5;
  border-right: 1px solid #ddd;
  overflow-y: auto;
  padding: 15px;
}

/* 树结构样式 */
.api-sidebar :deep(.el-tree) {
  background: transparent;
}

.api-sidebar :deep(.el-tree-node) {
  padding: 4px 0;
}

.api-sidebar :deep(.el-tree-node__content) {
  height: 32px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.api-sidebar :deep(.el-tree-node__content:hover) {
  background-color: rgba(64, 158, 255, 0.1);
}

.api-sidebar :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: rgba(64, 158, 255, 0.1);
  font-weight: 500;
}

.api-sidebar :deep(.el-tree-node.is-current > .el-tree-node__content .el-tree-node__label) {
  color: #409eff;
}

.api-sidebar :deep(.el-tree-node__expand-icon) {
  font-size: 12px;
  transition: transform 0.3s ease;
}

.api-sidebar :deep(.el-tree-node__expand-icon.is-expanded) {
  transform: rotate(90deg);
}

/* 树节点图标 */
.api-sidebar :deep(.el-tree-node__label) {
  font-size: 13px;
  transition: all 0.3s ease;
}

/* 项目节点 */
.api-sidebar :deep(.project-node) {
  font-weight: 500;
}

/* 分类节点 */
.api-sidebar :deep(.category-node) {
  font-size: 12px;
}

/* 接口节点 */
.api-sidebar :deep(.endpoint-node) {
  font-size: 12px;
  color: #606266;
}

/* 右侧内容 */
.api-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 配置面板 */
.config-panel {
  background: #f9f9f9;
  border-bottom: 1px solid #ddd;
  padding: 10px 15px;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding: 10px 15px;
  border-radius: 8px;
  transition: all 0.3s ease;
  background-color: #f0f0f0;
}

.config-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  transition: all 0.3s ease;
}

.toggle-icon {
  font-size: 12px;
  color: #666;
  transition: transform 0.3s ease;
}

.config-header:hover {
  background-color: #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.config-content {
  padding: 15px;
  background-color: #ffffff;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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
  color: #666;
  text-align: right;
}

.config-item input,
.config-item textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
  font-size: 12px;
}

.config-item textarea {
  height: 100px;
  resize: vertical;
  font-family: 'Courier New', monospace;
}

.save-btn {
  margin-left: 6px;
  background: #42b883;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  flex-shrink: 0;
}

.save-btn:hover {
  background: #35495e;
}

/* Tab 容器 */
.tab-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tab-header {
  display: flex;
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
  overflow-x: auto;
}

.tab-item {
  padding: 10px 15px;
  cursor: pointer;
  border-right: 1px solid #ddd;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.tab-item:hover {
  background: #e0e0e0;
}

.tab-item.active {
  background: white;
  border-bottom: 2px solid #42b883;
}

.tab-close {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
}

.tab-close:hover {
  background: #d9534f;
  color: white;
}

.tab-content {
  flex: 1;
  overflow: auto;
  background: white;
}

.tab-pane {
  display: none;
  height: 100%;
}

.tab-pane.active {
  display: block;
}

/* 空状态 */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
}

.empty-state h3 {
  margin-bottom: 10px;
}
</style>