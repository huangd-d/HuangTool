<template>
  <div class="api-view">
    <div class="api-container">
      <!-- 左侧导航 -->
      <div class="api-sidebar">
        <!-- 项目管理 -->
        <div class="sidebar-section">
          <div class="section-header">
            <h3>项目</h3>
            <button @click="showProjectDialog = true" class="add-btn">+</button>
          </div>
          <ul class="project-list">
            <li v-for="project in projects" :key="project.id" 
                :class="{ active: selectedProject?.id === project.id }"
                @click="selectProject(project)">
              {{ project.name }}
              <div class="project-actions">
                <button @click.stop="editProject(project)" class="action-btn edit">✏️</button>
                <button @click.stop="deleteProject(project)" class="action-btn delete">🗑️</button>
              </div>
            </li>
          </ul>
        </div>

        <!-- 分类管理 -->
        <div class="sidebar-section" v-if="selectedProject">
          <div class="section-header">
            <h3>分类</h3>
            <button @click="showCategoryDialog = true" class="add-btn">+</button>
          </div>
          <ul class="category-list">
            <li v-for="category in categories" :key="category.id"
                :class="{ active: selectedCategory?.id === category.id }"
                @click="selectCategory(category)">
              {{ category.name }}
              <div class="category-actions">
                <button @click.stop="editCategory(category)" class="action-btn edit">✏️</button>
                <button @click.stop="deleteCategory(category)" class="action-btn delete">🗑️</button>
              </div>
            </li>
          </ul>
        </div>

        <!-- 接口管理 -->
        <div class="sidebar-section" v-if="selectedCategory">
          <div class="section-header">
            <h3>接口</h3>
            <button @click="showEndpointDialog = true" class="add-btn">+</button>
          </div>
          <ul class="endpoint-list">
            <li v-for="endpoint in endpoints" :key="endpoint.id"
                @click="openEndpointTab(endpoint)">
              {{ endpoint.name }}
              <span class="endpoint-method" :class="endpoint.method.toLowerCase()">
                {{ endpoint.method }}
              </span>
              <div class="endpoint-actions">
                <button @click.stop="editEndpoint(endpoint)" class="action-btn edit">✏️</button>
                <button @click.stop="deleteEndpoint(endpoint)" class="action-btn delete">🗑️</button>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- 右侧内容 -->
      <div class="api-content">
        <!-- 通用配置 -->
        <div class="config-panel" v-if="selectedProject">
          <h3>通用配置</h3>
          <div class="config-item">
            <label>代理地址:</label>
            <input v-model="selectedProject.config.proxy" type="text" placeholder="输入代理地址">
          </div>
          <div class="config-item">
            <label>共用 Header:</label>
            <textarea v-model="configHeaders" placeholder="输入 JSON 格式的 Header"></textarea>
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
    <div class="dialog-overlay" v-if="showProjectDialog">
      <div class="dialog">
        <h3>{{ editingProject ? '编辑项目' : '创建项目' }}</h3>
        <div class="dialog-content">
          <div class="form-item">
            <label>项目名称:</label>
            <input v-model="projectForm.name" type="text" placeholder="输入项目名称">
          </div>
          <div class="form-item">
            <label>项目描述:</label>
            <textarea v-model="projectForm.description" placeholder="输入项目描述"></textarea>
          </div>
        </div>
        <div class="dialog-actions">
          <button @click="showProjectDialog = false">取消</button>
          <button @click="saveProject" class="primary">保存</button>
        </div>
      </div>
    </div>

    <!-- 分类对话框 -->
    <div class="dialog-overlay" v-if="showCategoryDialog">
      <div class="dialog">
        <h3>{{ editingCategory ? '编辑分类' : '创建分类' }}</h3>
        <div class="dialog-content">
          <div class="form-item">
            <label>分类名称:</label>
            <input v-model="categoryForm.name" type="text" placeholder="输入分类名称">
          </div>
          <div class="form-item">
            <label>分类描述:</label>
            <textarea v-model="categoryForm.description" placeholder="输入分类描述"></textarea>
          </div>
        </div>
        <div class="dialog-actions">
          <button @click="showCategoryDialog = false">取消</button>
          <button @click="saveCategory" class="primary">保存</button>
        </div>
      </div>
    </div>

    <!-- 接口对话框 -->
    <div class="dialog-overlay" v-if="showEndpointDialog">
      <div class="dialog">
        <h3>{{ editingEndpoint ? '编辑接口' : '创建接口' }}</h3>
        <div class="dialog-content">
          <div class="form-item">
            <label>接口名称:</label>
            <input v-model="endpointForm.name" type="text" placeholder="输入接口名称">
          </div>
          <div class="form-item">
            <label>接口 URL:</label>
            <input v-model="endpointForm.url" type="text" placeholder="输入接口 URL">
          </div>
          <div class="form-item">
            <label>请求方法:</label>
            <select v-model="endpointForm.method">
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
          <div class="form-item">
            <label>请求体类型:</label>
            <select v-model="endpointForm.bodyType">
              <option value="json">JSON</option>
              <option value="form">Form</option>
              <option value="raw">Raw</option>
            </select>
          </div>
          <div class="form-item">
            <label>请求体:</label>
            <textarea v-model="endpointForm.body" placeholder="输入请求体"></textarea>
          </div>
        </div>
        <div class="dialog-actions">
          <button @click="showEndpointDialog = false">取消</button>
          <button @click="saveEndpoint" class="primary">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

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

// 表单数据
const projectForm = ref({ name: '', description: '' })
const categoryForm = ref({ name: '', description: '' })
const endpointForm = ref({ name: '', url: '', method: 'GET', bodyType: 'json', body: '' })

// 编辑状态
const editingProject = ref(null)
const editingCategory = ref(null)
const editingEndpoint = ref(null)

// 计算属性
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
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }
}

// 选择项目
async function selectProject(project) {
  selectedProject.value = project
  selectedCategory.value = null
  endpoints.value = []
  await loadCategories(project.name)
}

// 加载分类
async function loadCategories(projectName) {
  if (window.electronAPI && window.electronAPI.getApiCategories) {
    try {
      categories.value = await window.electronAPI.getApiCategories(projectName)
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }
}

// 选择分类
async function selectCategory(category) {
  selectedCategory.value = category
  await loadEndpoints(selectedProject.value.name, category.id)
}

// 加载接口
async function loadEndpoints(projectName, categoryId) {
  if (window.electronAPI && window.electronAPI.getApiEndpoints) {
    try {
      endpoints.value = await window.electronAPI.getApiEndpoints(projectName, categoryId)
    } catch (error) {
      console.error('Error loading endpoints:', error)
    }
  }
}

// 打开项目对话框
function editProject(project) {
  editingProject.value = project
  projectForm.value = { ...project }
  showProjectDialog.value = true
}

// 保存项目
async function saveProject() {
  if (!projectForm.value.name) {
    alert('请输入项目名称')
    return
  }

  try {
    if (editingProject.value) {
      // 更新项目
      await window.electronAPI.updateApiProject(projectForm.value)
    } else {
      // 创建项目
      await window.electronAPI.createApiProject(projectForm.value)
    }
    await loadProjects()
    showProjectDialog.value = false
    resetProjectForm()
  } catch (error) {
    console.error('Error saving project:', error)
    alert('保存项目失败')
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
  categoryForm.value = { ...category }
  showCategoryDialog.value = true
}

// 保存分类
async function saveCategory() {
  if (!categoryForm.value.name) {
    alert('请输入分类名称')
    return
  }

  try {
    if (editingCategory.value) {
      // 更新分类
      await window.electronAPI.updateApiCategory(selectedProject.value.name, categoryForm.value)
    } else {
      // 创建分类
      await window.electronAPI.createApiCategory(selectedProject.value.name, categoryForm.value)
    }
    await loadCategories(selectedProject.value.name)
    showCategoryDialog.value = false
    resetCategoryForm()
  } catch (error) {
    console.error('Error saving category:', error)
    alert('保存分类失败')
  }
}

// 删除分类
async function deleteCategory(category) {
  if (confirm(`确定要删除分类 ${category.name} 吗？`)) {
    try {
      await window.electronAPI.deleteApiCategory(selectedProject.value.name, category.id)
      await loadCategories(selectedProject.value.name)
      if (selectedCategory.value?.id === category.id) {
        selectedCategory.value = null
        endpoints.value = []
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('删除分类失败')
    }
  }
}

// 打开接口对话框
function editEndpoint(endpoint) {
  editingEndpoint.value = endpoint
  endpointForm.value = { ...endpoint }
  showEndpointDialog.value = true
}

// 保存接口
async function saveEndpoint() {
  if (!endpointForm.value.name || !endpointForm.value.url) {
    alert('请输入接口名称和 URL')
    return
  }

  try {
    if (editingEndpoint.value) {
      // 更新接口
      await window.electronAPI.updateApiEndpoint(selectedProject.value.name, selectedCategory.value.id, endpointForm.value)
    } else {
      // 创建接口
      await window.electronAPI.createApiEndpoint(selectedProject.value.name, selectedCategory.value.id, endpointForm.value)
    }
    await loadEndpoints(selectedProject.value.name, selectedCategory.value.id)
    showEndpointDialog.value = false
    resetEndpointForm()
  } catch (error) {
    console.error('Error saving endpoint:', error)
    alert('保存接口失败')
  }
}

// 删除接口
async function deleteEndpoint(endpoint) {
  if (confirm(`确定要删除接口 ${endpoint.name} 吗？`)) {
    try {
      await window.electronAPI.deleteApiEndpoint(selectedProject.value.name, selectedCategory.value.id, endpoint.id)
      await loadEndpoints(selectedProject.value.name, selectedCategory.value.id)
      // 关闭相关的 tab
      tabs.value = tabs.value.filter(tab => tab.endpoint.id !== endpoint.id)
      if (activeTabId.value === endpoint.id) {
        activeTabId.value = tabs.value.length > 0 ? tabs.value[0].id : null
      }
    } catch (error) {
      console.error('Error deleting endpoint:', error)
      alert('删除接口失败')
    }
  }
}

// 保存项目配置
async function saveProjectConfig() {
  if (selectedProject.value) {
    try {
      await window.electronAPI.updateApiProject(selectedProject.value)
      alert('配置已保存')
    } catch (error) {
      console.error('Error saving project config:', error)
      alert('保存配置失败')
    }
  }
}

// 打开接口 Tab
function openEndpointTab(endpoint) {
  // 检查是否已存在该接口的 tab
  const existingTab = tabs.value.find(tab => tab.endpoint.id === endpoint.id)
  if (existingTab) {
    activeTabId.value = existingTab.id
  } else {
    const newTab = {
      id: Date.now().toString(),
      name: endpoint.name,
      endpoint: endpoint
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
function handleSendRequest(endpoint, config) {
  // 这里可以添加请求发送的逻辑
  console.log('Send request:', endpoint, config)
}

// 重置表单
function resetProjectForm() {
  projectForm.value = { name: '', description: '' }
  editingProject.value = null
}

function resetCategoryForm() {
  categoryForm.value = { name: '', description: '' }
  editingCategory.value = null
}

function resetEndpointForm() {
  endpointForm.value = { name: '', url: '', method: 'GET', bodyType: 'json', body: '' }
  editingEndpoint.value = null
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

/* 左侧导航 */
.api-sidebar {
  width: 300px;
  background: #f5f5f5;
  border-right: 1px solid #ddd;
  overflow-y: auto;
  padding: 15px;
}

.sidebar-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.add-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: #42b883;
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-btn:hover {
  background: #35495e;
}

/* 项目列表 */
.project-list,
.category-list,
.endpoint-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.project-list li,
.category-list li,
.endpoint-list li {
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s;
}

.project-list li:hover,
.category-list li:hover,
.endpoint-list li:hover {
  background: #e0e0e0;
}

.project-list li.active,
.category-list li.active {
  background: #42b883;
  color: white;
}

/* 操作按钮 */
.project-actions,
.category-actions,
.endpoint-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.project-list li:hover .project-actions,
.category-list li:hover .category-actions,
.endpoint-list li:hover .endpoint-actions {
  opacity: 1;
}

.action-btn {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 3px;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn.edit:hover {
  background: #f0ad4e;
  color: white;
}

.action-btn.delete:hover {
  background: #d9534f;
  color: white;
}

/* 接口方法标签 */
.endpoint-method {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-right: 8px;
}

.endpoint-method.get {
  background: #5cb85c;
  color: white;
}

.endpoint-method.post {
  background: #337ab7;
  color: white;
}

.endpoint-method.put {
  background: #f0ad4e;
  color: white;
}

.endpoint-method.delete {
  background: #d9534f;
  color: white;
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

/* 对话框 */
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
  width: 400px;
  max-width: 90%;
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