<template>
  <div class="api-sidebar">
    <!-- 项目管理 -->
    <div class="sidebar-section">
      <div class="section-header">
        <h3>项目</h3>
        <button @click="showProjectDialog = true" class="add-btn">+</button>
      </div>
      <ul class="project-list">
        <li v-for="project in projects" :key="project.id" :class="{ active: selectedProject?.id === project.id }"
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
        <li v-for="category in categories" :key="category.id" :class="{ active: selectedCategory?.id === category.id }"
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
        <button @click="addEndpoint()" class="add-btn">+</button>
      </div>
      <ul class="endpoint-list">
        <li v-for="endpoint in endpoints" :key="endpoint.id" @click="$emit('open-endpoint-tab', endpoint)">
          <span class="endpoint-name">{{ endpoint.name }}</span>
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

    <!-- 项目对话框 -->
    <ProjectDialog v-model="showProjectDialog" :project="editingProject" @save="handleSaveProject" />

    <!-- 分类对话框 -->
    <CategoryDialog v-model="showCategoryDialog" :category="editingCategory" @save="handleSaveCategory" />

    <!-- 接口对话框 -->
    <EndpointDialog v-model="showEndpointDialog" :endpoint="editingEndpoint" @save="handleSaveEndpoint" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ProjectDialog from './dialogs/ProjectDialog.vue'
import CategoryDialog from './dialogs/CategoryDialog.vue'
import EndpointDialog from './dialogs/EndpointDialog.vue'

// 状态管理
const projects = ref([])
const categories = ref([])
const endpoints = ref([])
const selectedProject = ref(null)
const selectedCategory = ref(null)

const emit = defineEmits([
  'select-project',
  'select-category',
  'open-endpoint-tab',
  'refresh-data'
])

// 生命周期
onMounted(() => {
  loadProjects()
})

// 加载项目
async function loadProjects() {
  if (window.electronAPI && window.electronAPI.getApiProjects) {
    try {
      projects.value = await window.electronAPI.getApiProjects()
      console.log('Loaded projects:', projects.value);
      selectProject(projects.value[0] || null);
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

  // 通知父组件
  emit('select-project', project)
}

// 选择分类
async function selectCategory(category) {
  console.log('Selecting category:', category)
  selectedCategory.value = category

  // 直接使用分类数据中的接口
  endpoints.value = category.endpoints || []
  console.log('Endpoints:', endpoints.value)

  // 通知父组件
  emit('select-category', category)
}

// 对话框状态
const showProjectDialog = ref(false)
const showCategoryDialog = ref(false)
const showEndpointDialog = ref(false)

// 编辑状态
const editingProject = ref(null)
const editingCategory = ref(null)
const editingEndpoint = ref(null)

// 打开项目对话框
function editProject(project) {
  editingProject.value = project
  showProjectDialog.value = true
}

// 打开分类对话框
function editCategory(category) {
  editingCategory.value = category
  showCategoryDialog.value = true
}

// 打开接口对话框
function addEndpoint() {
  editingEndpoint.value = null
  showEndpointDialog.value = true
}

// 打开接口对话框
function editEndpoint(endpoint) {
  editingEndpoint.value = endpoint
  showEndpointDialog.value = true
}

// 处理保存项目
async function handleSaveProject(projectData) {
  try {
    const j = JSON.stringify(projectData)
    if (editingProject.value) {
      // 更新项目
      await window.electronAPI.updateApiProject(JSON.parse(j))
    } else {
      // 创建项目
      await window.electronAPI.createApiProject(JSON.parse(j))
    }
    loadProjects();
  } catch (error) {
    console.error('Error saving project:', error)
    alert('保存项目失败: ' + error.message)
  }
  showProjectDialog.value = false
  editingProject.value = null
}

// 处理保存分类
async function handleSaveCategory(categoryData) {
  try {
    if (editingCategory.value) {
      // 更新分类
      await window.electronAPI.updateApiCategory(props.selectedProject.name, { ...categoryData, id: editingCategory.value.id })
    } else {
      // 创建分类
      await window.electronAPI.createApiCategory(props.selectedProject.name, categoryData)
    }
    loadProjects();
  } catch (error) {
    console.error('Error saving category:', error)
    alert('保存分类失败: ' + error.message)
  }
  showCategoryDialog.value = false
  editingCategory.value = null
}

// 处理保存接口
async function handleSaveEndpoint(endpointData) {
  try {
    if (editingEndpoint.value) {
      // 更新接口
      await window.electronAPI.updateApiEndpoint(
        props.selectedProject.name,
        props.selectedCategory.id,
        { ...endpointData, id: editingEndpoint.value.id }
      )
    } else {
      // 创建接口
      await window.electronAPI.createApiEndpoint(
        props.selectedProject.name,
        props.selectedCategory.id,
        endpointData
      )
    }
    loadProjects();
  } catch (error) {
    console.error('Error saving endpoint:', error)
    alert('保存接口失败: ' + error.message)
  }
  showEndpointDialog.value = false
  editingEndpoint.value = null
}

// 删除项目
async function deleteProject(project) {
  if (confirm(`确定要删除项目 ${project.name} 吗？`)) {
    try {
      await window.electronAPI.deleteApiProject(project.name)
      loadProjects();
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('删除项目失败: ' + error.message)
    }
  }
}

// 删除分类
async function deleteCategory(category) {
  if (confirm(`确定要删除分类 ${category.name} 吗？`)) {
    try {
      await window.electronAPI.deleteApiCategory(props.selectedProject.name, category.id)
      loadProjects();
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('删除分类失败: ' + error.message)
    }
  }
}

// 删除接口
async function deleteEndpoint(endpoint) {
  if (confirm(`确定要删除接口 ${endpoint.name} 吗？`)) {
    try {
      await window.electronAPI.deleteApiEndpoint(props.selectedProject.name, props.selectedCategory.id, endpoint.id)
      loadProjects();
    } catch (error) {
      console.error('Error deleting endpoint:', error)
      alert('删除接口失败: ' + error.message)
    }
  }
}
</script>

<style scoped>
.api-sidebar {
  width: 300px;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
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
  color: var(--text);
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
  background: var(--border);
}

.project-list li.active,
.category-list li.active {
  background: #42b883;
  color: white;
}

.endpoint-list li {
  gap: 8px;
}

.endpoint-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

.endpoint-method.patch {
  background: #5856d6;
  color: white;
}
</style>
