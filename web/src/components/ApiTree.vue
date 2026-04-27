<template>
  <div class="api-tree">
    <!-- 工具栏 -->
    <div class="tree-toolbar">
      <span class="toolbar-title">API 项目</span>
      <button @click="openCreateProject" class="add-btn" title="新建项目">+</button>
    </div>

    <!-- 树结构 -->
    <el-tree
      ref="treeRef"
      :data="treeData"
      :props="treeProps"
      node-key="id"
      :default-expanded-keys="expandedKeys"
      highlight-current
      @node-click="handleNodeClick"
    >
      <template #default="{ node, data }">
        <span class="tree-node" :class="data.type + '-node'">
          <span v-if="data.type === 'project'" class="node-icon">📁</span>
          <span v-else-if="data.type === 'category'" class="node-icon">📂</span>
          <span v-if="data.type === 'endpoint'" class="method-badge" :class="data.config.method?.toLowerCase()">
            {{ data.config.method }}
          </span>
          <span class="node-label">{{ data.name }}</span>
          <span class="node-actions">
            <button v-if="data.type === 'project'" @click.stop="openCreateCategory(data)" class="action-icon" title="新建分类">+</button>
            <button v-if="data.type === 'category'" @click.stop="openCreateEndpoint(data)" class="action-icon" title="新建接口">+</button>
            <button @click.stop="openEditNode(data)" class="action-icon edit-icon" title="编辑">✎</button>
            <button @click.stop="handleDeleteNode(data)" class="action-icon delete-icon" title="删除">×</button>
          </span>
        </span>
      </template>
    </el-tree>

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
import { ref, onMounted, nextTick } from 'vue'
import ProjectDialog from './dialogs/ProjectDialog.vue'
import CategoryDialog from './dialogs/CategoryDialog.vue'
import EndpointDialog from './dialogs/EndpointDialog.vue'

const emit = defineEmits(['select-project', 'select-endpoint'])

// 树结构
const treeRef = ref(null)
const treeData = ref([])
const expandedKeys = ref([])

const treeProps = {
  children: 'children',
  label: 'name'
}

// 对话框状态
const showProjectDialog = ref(false)
const showCategoryDialog = ref(false)
const showEndpointDialog = ref(false)

const editingProject = ref(null)
const editingCategory = ref(null)
const editingEndpoint = ref(null)

// CRUD 定位信息
const targetProjectFileName = ref('')
const targetCategoryId = ref('')

// 当前选中的项目（供接口点击时获取 projectConfig）
const currentProjectNode = ref(null)

// 加载项目
async function loadProjects() {
  if (window.electronAPI && window.electronAPI.getApiProjects) {
    try {
      const projects = await window.electronAPI.getApiProjects()
      treeData.value = projects
      // 默认展开第一个项目节点
      if (projects.length > 0) {
        expandedKeys.value = [projects[0].id]
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }
}

// 暴露给父组件
defineExpose({ loadProjects, currentProjectNode })

// 节点点击
function handleNodeClick(data) {
  if (data.type === 'project') {
    currentProjectNode.value = data
    // 展开项目节点
    // const node = treeRef.value?.store?.getNode(data.id)
    // if (node && !node.expanded) {
    //   node.expanded = true
    // }
    emit('select-project', data)
  } else if (data.type === 'category') {
    // 找到父级项目
    const project = findParentProject(data.id)
    if (project) {
      currentProjectNode.value = project
    }
  } else if (data.type === 'endpoint') {
    const project = findParentProject(data.id)
    if (project) {
      currentProjectNode.value = project
    }
    emit('select-endpoint', {
      endpoint: data,
      projectConfig: project?.config || {}
    })
  }
}

// 查找节点所属的项目
function findParentProject(nodeId) {
  for (const project of treeData.value) {
    if (project.id === nodeId) return project
    for (const category of (project.children || [])) {
      if (category.id === nodeId) return project
      for (const endpoint of (category.children || [])) {
        if (endpoint.id === nodeId) return project
      }
    }
  }
  return null
}

// 查找节点所属的分类
function findParentCategory(nodeId) {
  for (const project of treeData.value) {
    for (const category of (project.children || [])) {
      if (category.id === nodeId) return category
      for (const endpoint of (category.children || [])) {
        if (endpoint.id === nodeId) return category
      }
    }
  }
  return null
}

// ===== 项目 CRUD =====

function openCreateProject() {
  editingProject.value = null
  showProjectDialog.value = true
}

async function handleSaveProject(data) {
  try {
    const payload = JSON.parse(JSON.stringify(data))
    if (payload.id) {
      // 编辑：附带旧 fileName 用于重命名检测
      const oldProject = treeData.value.find(p => p.id === payload.id)
      if (oldProject) {
        payload._oldFileName = oldProject.config?.fileName
      }
      await window.electronAPI.updateApiProject(payload)
    } else {
      await window.electronAPI.createApiProject(payload)
    }
    await loadProjects()
  } catch (error) {
    console.error('Error saving project:', error)
    alert('保存项目失败: ' + error.message)
  }
}

async function handleDeleteProject(data) {
  if (!confirm(`确定删除项目 "${data.name}" 吗？`)) return
  try {
    await window.electronAPI.deleteApiProject(data.config.fileName)
    await loadProjects()
    // 通知父组件项目已删除
    emit('select-project', null)
  } catch (error) {
    console.error('Error deleting project:', error)
    alert('删除项目失败: ' + error.message)
  }
}

// ===== 分类 CRUD =====

function openCreateCategory(projectNode) {
  targetProjectFileName.value = projectNode.config.fileName
  editingCategory.value = null
  showCategoryDialog.value = true
}

async function handleSaveCategory(data) {
  try {
    const payload = JSON.parse(JSON.stringify(data))
    if (payload.id) {
      // 编辑
      const project = findParentProject(payload.id)
      const fileName = project?.config?.fileName
      await window.electronAPI.updateApiCategory(fileName, payload)
    } else {
      // 创建
      await window.electronAPI.createApiCategory(targetProjectFileName.value, payload)
    }
    await loadProjects()
  } catch (error) {
    console.error('Error saving category:', error)
    alert('保存分类失败: ' + error.message)
  }
}

async function handleDeleteCategory(data) {
  if (!confirm(`确定删除分类 "${data.name}" 吗？`)) return
  try {
    const project = findParentProject(data.id)
    const fileName = project?.config?.fileName
    await window.electronAPI.deleteApiCategory(fileName, data.id)
    await loadProjects()
  } catch (error) {
    console.error('Error deleting category:', error)
    alert('删除分类失败: ' + error.message)
  }
}

// ===== 接口 CRUD =====

function openCreateEndpoint(categoryNode) {
  const project = findParentProject(categoryNode.id)
  targetProjectFileName.value = project?.config?.fileName || ''
  targetCategoryId.value = categoryNode.id
  editingEndpoint.value = null
  showEndpointDialog.value = true
}

async function handleSaveEndpoint(data) {
  try {
    const payload = JSON.parse(JSON.stringify(data))
    if (payload.id) {
      // 编辑
      const category = findParentCategory(payload.id)
      const project = findParentProject(payload.id)
      const fileName = project?.config?.fileName
      const categoryId = category?.id
      await window.electronAPI.updateApiEndpoint(fileName, categoryId, payload)
    } else {
      // 创建
      await window.electronAPI.createApiEndpoint(targetProjectFileName.value, targetCategoryId.value, payload)
    }
    await loadProjects()
  } catch (error) {
    console.error('Error saving endpoint:', error)
    alert('保存接口失败: ' + error.message)
  }
}

async function handleDeleteEndpoint(data) {
  if (!confirm(`确定删除接口 "${data.name}" 吗？`)) return
  try {
    const category = findParentCategory(data.id)
    const project = findParentProject(data.id)
    const fileName = project?.config?.fileName
    const categoryId = category?.id
    await window.electronAPI.deleteApiEndpoint(fileName, categoryId, data.id)
    await loadProjects()
  } catch (error) {
    console.error('Error deleting endpoint:', error)
    alert('删除接口失败: ' + error.message)
  }
}

// ===== 通用编辑/删除入口 =====

function openEditNode(data) {
  if (data.type === 'project') {
    editingProject.value = data
    showProjectDialog.value = true
  } else if (data.type === 'category') {
    editingCategory.value = data
    showCategoryDialog.value = true
  } else if (data.type === 'endpoint') {
    editingEndpoint.value = data
    showEndpointDialog.value = true
  }
}

function handleDeleteNode(data) {
  if (data.type === 'project') {
    handleDeleteProject(data)
  } else if (data.type === 'category') {
    handleDeleteCategory(data)
  } else if (data.type === 'endpoint') {
    handleDeleteEndpoint(data)
  }
}

onMounted(() => {
  loadProjects()
})
</script>

<style scoped>
.api-tree {
  width: 260px;
  min-width: 260px;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border);
  overflow: hidden;
}

.tree-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  border-bottom: 1px solid var(--border);
}

.toolbar-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.tree-toolbar .add-btn {
  width: 24px;
  height: 24px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: transparent;
  color: var(--accent);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.tree-toolbar .add-btn:hover {
  background: rgba(255, 144, 0, 0.1);
  border-color: var(--accent);
}

/* 树结构 */
.api-tree :deep(.el-tree) {
  background: transparent;
  flex: 1;
  overflow-y: auto;
}

.api-tree :deep(.el-tree-node) {
  padding: 2px 0;
}

.api-tree :deep(.el-tree-node__content) {
  height: 30px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.api-tree :deep(.el-tree-node__content:hover) {
  background-color: rgba(255, 144, 0, 0.08);
}

.api-tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background-color: rgba(255, 144, 0, 0.1);
  font-weight: 500;
}

/* 自定义节点 */
.tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  overflow: hidden;
  font-size: 13px;
}

.node-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.tree-node .node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-node {
  font-weight: 600;
}

.category-node {
  font-size: 12px;
  color: var(--text-secondary);
}

.endpoint-node {
  font-size: 12px;
  color: var(--text-secondary);
}

/* 方法徽标 */
.method-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
  flex-shrink: 0;
  text-transform: uppercase;
  line-height: 1.4;
}

.method-badge.get { background: rgba(52, 199, 89, 0.15); color: #34c759; }
.method-badge.post { background: rgba(0, 113, 227, 0.15); color: #0071e3; }
.method-badge.put { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
.method-badge.delete { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
.method-badge.patch { background: rgba(88, 86, 214, 0.15); color: #5856d6; }

/* 悬停操作 */
.node-actions {
  display: none;
  gap: 2px;
  flex-shrink: 0;
}

.api-tree :deep(.el-tree-node__content:hover) .node-actions {
  display: flex;
}

.action-icon {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--text-hint);
  font-size: 14px;
  cursor: pointer;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-icon:hover {
  background: var(--border);
  color: var(--text);
}

.action-icon.delete-icon:hover {
  background: #ff3b30;
  color: white;
}

.action-icon.edit-icon:hover {
  color: var(--accent);
}

/* 深色区域滚动条 */
.api-tree :deep(.el-tree)::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

.api-tree :deep(.el-tree)::-webkit-scrollbar-thumb {
  background: #444444;
  border-radius: 3px;
}

.api-tree :deep(.el-tree)::-webkit-scrollbar-thumb:hover {
  background: #666666;
}
</style>
