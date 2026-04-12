<template>
  <div class="api-view">
    <div class="api-container">
      <!-- 左侧导航 -->
      <ApiSidebar
        :projects="projects"
        :categories="categories"
        :endpoints="endpoints"
        :selected-project="selectedProject"
        :selected-category="selectedCategory"
        @add-project="showProjectDialog = true"
        @edit-project="editProject"
        @delete-project="deleteProject"
        @select-project="selectProject"
        @add-category="showCategoryDialog = true"
        @edit-category="editCategory"
        @delete-category="deleteCategory"
        @select-category="selectCategory"
        @add-endpoint="addEndpoint"
        @edit-endpoint="editEndpoint"
        @delete-endpoint="deleteEndpoint"
        @open-endpoint-tab="openEndpointTab"
      />

      <!-- 右侧内容 -->
      <div class="api-content">
        <!-- 通用配置 -->
        <div class="config-panel" v-if="selectedProject">
          <h3>通用配置</h3>
          <div class="config-item">
            <label>基础 URL:</label>
            <input v-model="selectedProject.config.baseUrl" type="text" placeholder="https://api.example.com">
          </div>
          <div class="config-item">
            <label>代理地址:</label>
            <input v-model="selectedProject.config.proxy" type="text" placeholder="http://proxy.example.com:8080">
          </div>
          <div class="config-item">
            <label>超时时间 (ms):</label>
            <input v-model.number="selectedProject.config.timeout" type="number" placeholder="30000">
          </div>
          <div class="config-item">
            <label>共用 Header (JSON):</label>
            <textarea v-model="configHeaders" placeholder='{"Authorization": "Bearer token"}'></textarea>
          </div>
          <button @click="saveProjectConfig" class="save-btn">保存配置</button>
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
              <EndpointView 
                :endpoint="tab.endpoint" 
                :project-config="selectedProject?.config"
                @send-request="handleSendRequest"
              />
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

    <!-- 项目对话框 -->
    <ProjectDialog 
      v-model="showProjectDialog" 
      :project="editingProject"
      @save="handleSaveProject"
    />

    <!-- 分类对话框 -->
    <CategoryDialog 
      v-model="showCategoryDialog" 
      :category="editingCategory"
      @save="handleSaveCategory"
    />

    <!-- 接口对话框 -->
    <EndpointDialog 
      v-model="showEndpointDialog" 
      :endpoint="editingEndpoint"
      @save="handleSaveEndpoint"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ApiSidebar from '../components/ApiSidebar.vue'
import ProjectDialog from '../components/dialogs/ProjectDialog.vue'
import CategoryDialog from '../components/dialogs/CategoryDialog.vue'
import EndpointDialog from '../components/dialogs/EndpointDialog.vue'

// 状态管理
const projects = ref([])
const categories = ref([])
const endpoints = ref([])
const selectedProject = ref(null)
const selectedCategory = ref(null)
const tabs = ref([])
const activeTabId = ref(null)

// 对话框状态
const showProjectDialog = ref(false)
const showCategoryDialog = ref(false)
const showEndpointDialog = ref(false)

// 编辑状态
const editingProject = ref(null)
const editingCategory = ref(null)
const editingEndpoint = ref(null)

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

// 生命周期
onMounted(() => {
  loadProjects()
})

// 加载项目
async function loadProjects() {
  if (window.electronAPI && window.electronAPI.getApiProjects) {
    try {
      projects.value = await window.electronAPI.getApiProjects()
      console.log('Loaded projects:', projects.value)
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }
}

// 选择项目
async function selectProject(project) {
  console.log('Selecting project:', project)
  selectedProject.value = project
  selectedCategory.value = null
  endpoints.value = []
  
  // 直接使用项目数据中的分类
  categories.value = project.categories || []
  console.log('Categories:', categories.value)
}

// 选择分类
async function selectCategory(category) {
  console.log('Selecting category:', category)
  selectedCategory.value = category
  
  // 直接使用分类数据中的接口
  endpoints.value = category.endpoints || []
  console.log('Endpoints:', endpoints.value)
}

// 打开项目对话框
function editProject(project) {
  editingProject.value = project
  showProjectDialog.value = true
}

// 处理保存项目
async function handleSaveProject(projectData) {
  try {
    if (editingProject.value) {
      // 更新项目
      await window.electronAPI.updateApiProject(projectData)
    } else {
      // 创建项目
      await window.electronAPI.createApiProject(projectData)
    }
    await loadProjects()
  } catch (error) {
    console.error('Error saving project:', error)
    alert('保存项目失败: ' + error.message)
  }
}

// 删除项目
async function deleteProject(project) {
  if (confirm(`确定要删除项目 ${project.name} 吗？`)) {
    try {
      await window.electronAPI.deleteApiProject(project.name)
      await loadProjects()
      if (selectedProject.value?.id === project.id) {
        selectedProject.value = null
        selectedCategory.value = null
        endpoints.value = []
        tabs.value = []
        activeTabId.value = null
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('删除项目失败')
    }
  }
}

// 打开分类对话框
function editCategory(category) {
  editingCategory.value = category
  showCategoryDialog.value = true
}

// 处理保存分类
async function handleSaveCategory(categoryData) {
  try {
    if (editingCategory.value) {
      // 更新分类
      await window.electronAPI.updateApiCategory(selectedProject.value.name, { ...categoryData, id: editingCategory.value.id })
    } else {
      // 创建分类
      await window.electronAPI.createApiCategory(selectedProject.value.name, categoryData)
    }
    // 重新加载项目以获取最新数据
    await loadProjects()
    // 重新选择当前项目以更新分类列表
    const updatedProject = projects.value.find(p => p.id === selectedProject.value.id)
    if (updatedProject) {
      await selectProject(updatedProject)
    }
  } catch (error) {
    console.error('Error saving category:', error)
    alert('保存分类失败: ' + error.message)
  }
}

// 删除分类
async function deleteCategory(category) {
  if (confirm(`确定要删除分类 ${category.name} 吗？`)) {
    try {
      await window.electronAPI.deleteApiCategory(selectedProject.value.name, category.id)
      // 重新加载项目以获取最新数据
      await loadProjects()
      // 重新选择当前项目以更新分类列表
      const updatedProject = projects.value.find(p => p.id === selectedProject.value.id)
      if (updatedProject) {
        await selectProject(updatedProject)
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('删除分类失败: ' + error.message)
    }
  }
}

// 打开接口对话框
function addEndpoint() {
  console.log('Adding new endpoint')
  editingEndpoint.value = null
  showEndpointDialog.value = true
}

// 打开接口对话框
function editEndpoint(endpoint) {
  console.log('Editing endpoint:', endpoint)
  editingEndpoint.value = endpoint
  showEndpointDialog.value = true
}

// 处理保存接口
async function handleSaveEndpoint(endpointData) {
  try {
    if (editingEndpoint.value) {
      // 更新接口
      await window.electronAPI.updateApiEndpoint(
        selectedProject.value.name, 
        selectedCategory.value.id, 
        { ...endpointData, id: editingEndpoint.value.id }
      )
    } else {
      // 创建接口
      await window.electronAPI.createApiEndpoint(
        selectedProject.value.name, 
        selectedCategory.value.id, 
        endpointData
      )
    }
    // 重新加载项目以获取最新数据
    await loadProjects()
    // 重新选择当前项目和分类以更新接口列表
    const updatedProject = projects.value.find(p => p.id === selectedProject.value.id)
    if (updatedProject) {
      await selectProject(updatedProject)
      const updatedCategory = updatedProject.categories.find(c => c.id === selectedCategory.value.id)
      if (updatedCategory) {
        await selectCategory(updatedCategory)
      }
    }
  } catch (error) {
    console.error('Error saving endpoint:', error)
    alert('保存接口失败: ' + error.message)
  }
}

// 删除接口
async function deleteEndpoint(endpoint) {
  if (confirm(`确定要删除接口 ${endpoint.name} 吗？`)) {
    try {
      await window.electronAPI.deleteApiEndpoint(selectedProject.value.name, selectedCategory.value.id, endpoint.id)
      // 重新加载项目以获取最新数据
      await loadProjects()
      // 重新选择当前项目和分类以更新接口列表
      const updatedProject = projects.value.find(p => p.id === selectedProject.value.id)
      if (updatedProject) {
        await selectProject(updatedProject)
        const updatedCategory = updatedProject.categories.find(c => c.id === selectedCategory.value.id)
        if (updatedCategory) {
          await selectCategory(updatedCategory)
        }
      }
      // 关闭相关的 tab
      tabs.value = tabs.value.filter(tab => tab.endpoint.id !== endpoint.id)
      if (activeTabId.value && !tabs.value.find(tab => tab.id === activeTabId.value)) {
        activeTabId.value = tabs.value.length > 0 ? tabs.value[0].id : null
      }
    } catch (error) {
      console.error('Error deleting endpoint:', error)
      alert('删除接口失败: ' + error.message)
    }
  }
}

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
.api-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.api-container {
  display: flex;
  flex: 1;
  overflow: hidden;
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
  padding: 15px;
}

.config-panel h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.config-item {
  margin-bottom: 15px;
}

.config-item label {
  display: block;
  margin-bottom: 5px;
  font-size: 12px;
  font-weight: 500;
  color: #666;
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
  background: #42b883;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
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