<template>
  <div class="office-view">
    <div class="office-content">
      <!-- 左侧文件选择 -->
      <div class="file-selector">
        <div class="selector-header">
          <h3>文件选择</h3>
        </div>
        <div class="select-button">
          <input type="file" @change="handleFileSelect" accept=".docx,.xlsx,.pptx">
          <button @click="openFileDialog">+ 浏览文件</button>
        </div>
        <div class="recent-files" v-if="tabs.length > 0">
          <h4>最近打开</h4>
          <ul>
            <li v-for="tab in tabs" :key="tab.id" @click="switchTab(tab.id)">
              {{ tab.file.name }}
            </li>
          </ul>
        </div>
      </div>
      
      <!-- 右侧预览区域 -->
      <div class="document-preview">
        <!-- Tab 头部 -->
        <div class="tab-header" v-if="tabs.length > 0">
          <div 
            v-for="tab in tabs" 
            :key="tab.id" 
            class="tab-item"
            :class="{ active: activeTabId === tab.id }"
          >
            <span @click="switchTab(tab.id)">{{ tab.file.name }}</span>
            <button @click="closeTab(tab.id)" class="tab-close">×</button>
          </div>
        </div>
        
        <!-- Tab 内容 -->
        <div class="tab-content">
          <div v-if="tabs.length > 0">
            <div 
              v-for="tab in tabs" 
              :key="tab.id" 
              class="tab-pane"
              :class="{ active: activeTabId === tab.id }"
            >
              <div v-if="tab.loading" class="loading">加载中...</div>
              <div v-else-if="tab.error" class="error">{{ tab.error }}</div>
              <div v-else class="jit-viewer" :ref="el => setViewerRef(el, tab.id)"></div>
            </div>
          </div>
          <div v-else class="preview-placeholder">
            请选择一个 Office 文档进行预览
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'

const tabs = ref([])
const activeTabId = ref(null)
const viewerRefs = ref({})
const jitViewers = ref({})

function openFileDialog() {
  // 触发文件选择对话框
  document.querySelector('input[type="file"]').click()
}

async function handleFileSelect(event) {
  const file = event.target.files[0]
  if (file) {
    await openFileTab(file)
  }
}

async function openFileTab(file) {
  const newTab = {
    id: Date.now().toString(),
    file: file,
    loading: true,
    error: ''
  }
  
  tabs.value.push(newTab)
  activeTabId.value = newTab.id
  
  try {
    await loadJitViewer(newTab)
  } catch (err) {
    newTab.error = `预览失败: ${err.message}`
    console.error('预览错误:', err)
  } finally {
    newTab.loading = false
  }
}

function setViewerRef(el, tabId) {
  if (el) {
    viewerRefs.value[tabId] = el
  }
}

async function loadJitViewer(tab) {
  // 模拟 JIT Viewer 加载，实际项目中应使用真实的 SDK
  // 这里我们只做占位处理
  setTimeout(() => {
    console.log('加载文件:', tab.file.name)
  }, 1000)
}

function switchTab(tabId) {
  activeTabId.value = tabId
}

function closeTab(tabId) {
  // 销毁对应的 viewer
  if (jitViewers.value[tabId]) {
    jitViewers.value[tabId].destroy()
    delete jitViewers.value[tabId]
  }
  
  // 移除标签
  tabs.value = tabs.value.filter(tab => tab.id !== tabId)
  
  // 切换到其他标签
  if (activeTabId.value === tabId) {
    activeTabId.value = tabs.value.length > 0 ? tabs.value[0].id : null
  }
}

onUnmounted(() => {
  // 销毁所有 viewers
  Object.values(jitViewers.value).forEach(viewer => {
    if (viewer && viewer.destroy) {
      viewer.destroy()
    }
  })
})
</script>

<style scoped>
.office-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.office-content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1px;
  flex: 1;
  overflow: hidden;
  background-color: var(--border);
}

/* 左侧文件选择 */
.file-selector {
  background: var(--bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.selector-header {
  padding: 16px;
  border-bottom: 1px solid var(--border);
}

.selector-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--text);
}

.select-button {
  padding: 16px;
  border-bottom: 1px solid var(--border);
}

.select-button input[type="file"] {
  display: none;
}

.select-button button {
  width: 100%;
  padding: 10px 16px;
  background-color: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--accent);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.select-button button:hover {
  background-color: #e8f0fe;
  border-color: var(--accent);
}

.recent-files {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.recent-files h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

.recent-files ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.recent-files li {
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text);
  transition: background-color 0.2s ease;
  margin-bottom: 4px;
}

.recent-files li:hover {
  background-color: var(--bg-secondary);
  color: var(--accent);
}

/* 右侧预览区域 */
.document-preview {
  background: var(--bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Tab 头部 */
.tab-header {
  display: flex;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  overflow-x: auto;
  min-height: 48px;
  align-items: center;
}

.tab-item {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 48px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-secondary);
  border-right: 1px solid var(--border);
  white-space: nowrap;
  transition: all 0.2s ease;
}

.tab-item:hover {
  background-color: var(--bg-tertiary);
}

.tab-item.active {
  background-color: var(--bg);
  color: var(--accent);
  border-bottom: 2px solid var(--accent);
}

.tab-close {
  width: 20px;
  height: 20px;
  border: none;
  background: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--text-secondary);
  margin-left: 8px;
  transition: all 0.2s ease;
}

.tab-close:hover {
  background-color: rgba(60, 64, 67, 0.1);
  color: var(--text);
}

/* Tab 内容 */
.tab-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.tab-pane {
  display: none;
  height: 100%;
  position: relative;
}

.tab-pane.active {
  display: block;
}

.preview-placeholder {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-hint);
  font-size: 14px;
}

.loading {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 14px;
}

.error {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--error);
  font-size: 14px;
  padding: 20px;
  text-align: center;
}

.jit-viewer {
  width: 100%;
  height: 100%;
  background-color: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 14px;
  border: 1px solid var(--border);
  border-radius: 4px;
}

/* 滚动条样式 */
.recent-files::-webkit-scrollbar,
.tab-header::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.recent-files::-webkit-scrollbar-track,
.tab-header::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

.recent-files::-webkit-scrollbar-thumb,
.tab-header::-webkit-scrollbar-thumb {
  background: var(--bg-tertiary);
  border-radius: 3px;
}

.recent-files::-webkit-scrollbar-thumb:hover,
.tab-header::-webkit-scrollbar-thumb:hover {
  background: #c1c1c1;
}
</style>