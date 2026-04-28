<template>
  <div class="api-container">
    <!-- 左侧树结构 -->
    <ApiTree
      ref="apiTreeRef"
      @select-project="handleSelectProject"
      @select-endpoint="handleSelectEndpoint"
      @data-updated="handleDataUpdated"
    />

    <!-- 右侧内容 -->
    <div class="api-content">
      <template v-if="selectedProject">
        <!-- 通用配置（可折叠） -->
        <div class="section project-config-section">
          <div class="section-header" @click="configExpanded = !configExpanded">
            <span class="section-title">{{ selectedProject.name }} - 通用配置</span>
            <span class="collapse-icon" :class="{ expanded: configExpanded }">▶</span>
          </div>
          <div v-show="configExpanded" class="section-body">
            <ProjectConfig
              :project="selectedProject"
              @save="handleSaveConfig"
            />
          </div>
        </div>

        <!-- Tab 容器 -->
        <div class="tab-container" v-if="tabs.length > 0">
          <div class="tab-header">
            <div v-for="tab in tabs" :key="tab.id" class="tab-item" :class="{ active: activeTabId === tab.id }">
              <span v-if="tab.method" class="tab-method" :class="tab.method.toLowerCase()">{{ tab.method }}</span>
              <span @click="switchTab(tab.id)" class="tab-name">{{ tab.name }}</span>
              <button @click="closeTab(tab.id)" class="tab-close">×</button>
            </div>
          </div>
          <div class="tab-content">
            <div v-for="tab in tabs" :key="tab.id" class="tab-pane" :class="{ active: activeTabId === tab.id }">
              <EndpointView :endpoint="tab.endpoint" :project-config="tab.projectConfig" />
            </div>
          </div>
        </div>

        <!-- 空状态：已选项目但无 tab -->
        <div class="empty-state-subtle" v-if="tabs.length === 0">
          <p>点击左侧接口查看详情</p>
        </div>
      </template>

      <!-- 空状态 -->
      <div class="empty-state" v-if="!selectedProject">
        <h3>请选择或创建项目</h3>
        <p>从左侧列表中选择项目或创建新项目</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import ApiTree from '../components/ApiTree.vue'
import EndpointView from '../components/EndpointView.vue'
import ProjectConfig from '../components/ProjectConfig.vue'

const apiTreeRef = ref(null)
const selectedProject = ref(null)
const configExpanded = ref(false)
const tabs = ref([])
const activeTabId = ref(null)

// 处理项目选择
function handleSelectProject(project) {
  selectedProject.value = project
  configExpanded.value = false
  if (!project) {
    tabs.value = []
    activeTabId.value = null
  }
}

// 处理接口选择
function handleSelectEndpoint({ endpoint, projectConfig }) {
  const project = apiTreeRef.value?.currentProjectNode
  if (project && (!selectedProject.value || selectedProject.value.id !== project.id)) {
    selectedProject.value = project
  }

  // 检查是否已存在该接口的 tab
  const existingTab = tabs.value.find(tab => tab.endpoint.id === endpoint.id)
  if (existingTab) {
    activeTabId.value = existingTab.id
  } else {
    const newTab = {
      id: endpoint.id,
      name: endpoint.name,
      method: endpoint.config?.method,
      endpoint: endpoint,
      projectConfig: selectedProject.value?.config || projectConfig
    }
    tabs.value.push(newTab)
    activeTabId.value = newTab.id
  }
}

// 数据更新后刷新右侧项目数据
function handleDataUpdated(updatedProject) {
  if (updatedProject && selectedProject.value && selectedProject.value.id === updatedProject.id) {
    selectedProject.value = updatedProject
    // 同步 tab 中的 projectConfig
    tabs.value.forEach(tab => {
      tab.projectConfig = updatedProject.config
    })
  }
}

// 保存项目配置
async function handleSaveConfig(projectData) {
  try {
    const payload = JSON.parse(JSON.stringify(projectData))
    await window.electronAPI.updateApiProject(payload)
    alert('配置已保存')
    await apiTreeRef.value?.loadProjects()
  } catch (error) {
    console.error('Error saving project config:', error)
    alert('保存配置失败: ' + error.message)
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
</script>

<style scoped>
.api-container {
  height: 100%;
  display: flex;
  flex: 1;
  overflow-y: auto;
}

/* 右侧内容 */
.api-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--content-bg);
}

/* 通用配置区 */
.project-config-section {
  border-bottom: 1px solid var(--content-border);
  flex-shrink: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: var(--content-bg-card);
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid var(--content-border);
  transition: background 0.15s;
}

.section-header:hover {
  background: var(--content-bg);
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--content-text);
}

.collapse-icon {
  font-size: 10px;
  color: var(--content-text-hint);
  transition: transform 0.2s;
  flex-shrink: 0;
}

.collapse-icon.expanded {
  transform: rotate(90deg);
}

.section-body {
  padding: 0;
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
  background: var(--content-bg-card);
  border-bottom: 1px solid var(--content-border);
  overflow-x: auto;
  flex-shrink: 0;
}

.tab-item {
  padding: 10px 15px;
  cursor: pointer;
  border-right: 1px solid var(--content-border);
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  font-size: 13px;
  color: var(--content-text-secondary);
}

.tab-item:hover {
  background: var(--content-bg);
}

.tab-item.active {
  background: var(--content-bg-card);
  border-bottom: 2px solid var(--accent);
  color: var(--content-text);
}

.tab-method {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
  text-transform: uppercase;
}

.tab-method.get { background: rgba(52, 199, 89, 0.15); color: #34c759; }
.tab-method.post { background: rgba(0, 113, 227, 0.15); color: #0071e3; }
.tab-method.put { background: rgba(255, 149, 0, 0.15); color: #ff9500; }
.tab-method.delete { background: rgba(255, 59, 48, 0.15); color: #ff3b30; }
.tab-method.patch { background: rgba(88, 86, 214, 0.15); color: #5856d6; }

.tab-name {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
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
  background: #ff3b30;
  color: white;
}

.tab-content {
  flex: 1;
  overflow: auto;
  background: var(--content-bg);
}

.tab-pane {
  display: none;
  height: 100%;
}

.tab-pane.active {
  display: block;
}

/* 轻量空状态 */
.empty-state-subtle {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--content-text-hint);
  font-size: 13px;
}

/* 空状态 */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--content-text-hint);
}

.empty-state h3 {
  margin-bottom: 10px;
  color: var(--content-text-secondary);
}
</style>
