<template>
  <div class="docs-view">
    <div class="docs-content">
      <!-- 左侧文档列表 -->
      <div class="docs-sidebar">
        <div class="sidebar-header">
          <h3>技术文档</h3>
        </div>
        <ul>
          <li v-if="loading">加载中...</li>
          <li v-else-if="error">{{ error }}</li>
          <li v-else-if="docsDirectories.length === 0">暂无文档目录</li>
          <li v-for="dir in docsDirectories" :key="dir">
            <button @click="openDocTab(dir)" class="doc-item">
              {{ dir.charAt(0).toUpperCase() + dir.slice(1) }} 文档
            </button>
          </li>
        </ul>
      </div>
      
      <!-- 右侧预览区域 -->
      <div class="docs-preview">
        <!-- Tab 头部 -->
        <div class="tab-header" v-if="tabs.length > 0">
          <div 
            v-for="tab in tabs" 
            :key="tab.id" 
            class="tab-item"
            :class="{ active: activeTabId === tab.id }"
          >
            <span @click="switchTab(tab.id)">{{ tab.title }}</span>
            <button @click="closeTab(tab.id)" class="tab-close">×</button>
          </div>
        </div>
        
        <!-- Tab 内容 -->
        <div class="tab-content">
          <template v-if="tabs.length > 0">
            <div 
              v-for="tab in tabs" 
              :key="tab.id" 
              class="tab-pane"
              :class="{ active: activeTabId === tab.id }"
            >
              <webview :src="`docs://${tab.doc}`" class="doc-viewer"></webview>
            </div>
          </template>
          <div v-else class="preview-placeholder">
            请从左侧选择文档目录查看详细内容
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const docsDirectories = ref([])
const tabs = ref([])
const activeTabId = ref(null)
const loading = ref(false)
const error = ref('')

async function loadDocsDirectories() {
  loading.value = true
  error.value = ''
  try {
    if (window.electronAPI && window.electronAPI.getDocsDirectories) {
      docsDirectories.value = await window.electronAPI.getDocsDirectories()
    } else {
      // 开发模式下的模拟数据
      docsDirectories.value = ['vue', 'vite']
    }
  } catch (err) {
    error.value = '获取文档目录失败'
    console.error('Error loading docs directories:', err)
  } finally {
    loading.value = false
  }
}

// 打开文档标签页
function openDocTab(dir) {
  // 检查是否已存在该文档的标签页
  const existingTab = tabs.value.find(tab => tab.doc === dir)
  if (existingTab) {
    activeTabId.value = existingTab.id
  } else {
    const newTab = {
      id: Date.now().toString(),
      title: dir.charAt(0).toUpperCase() + dir.slice(1) + ' 文档',
      doc: dir
    }
    tabs.value.push(newTab)
    activeTabId.value = newTab.id
  }
}

// 切换标签页
function switchTab(tabId) {
  activeTabId.value = tabId
}

// 关闭标签页
function closeTab(tabId) {
  tabs.value = tabs.value.filter(tab => tab.id !== tabId)
  if (activeTabId.value === tabId) {
    activeTabId.value = tabs.value.length > 0 ? tabs.value[0].id : null
  }
}

onMounted(() => {
  loadDocsDirectories()
})
</script>

<style scoped>
.docs-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.docs-content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 1px;
  flex: 1;
  overflow: hidden;
  background-color: var(--border);
}

/* 左侧文档列表 */
.docs-sidebar {
  background: var(--bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--border);
}

.sidebar-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--text);
}

.docs-sidebar ul {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
  overflow-y: auto;
}

.docs-sidebar li {
  margin: 0;
  border-bottom: 1px solid var(--border);
}

.doc-item {
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: var(--bg);
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  color: var(--text);
}

.doc-item:hover {
  background-color: var(--bg-secondary);
  color: var(--accent);
}

/* 右侧预览区域 */
.docs-preview {
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
  background-color: rgba(255, 144, 0, 0.15);
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

.doc-viewer {
  width: 100%;
  height: 100%;
  border: none;
}

/* 滚动条样式 */
.docs-sidebar ul::-webkit-scrollbar,
.tab-header::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.docs-sidebar ul::-webkit-scrollbar-track,
.tab-header::-webkit-scrollbar-track {
  background: var(--bg-secondary);
}

.docs-sidebar ul::-webkit-scrollbar-thumb,
.tab-header::-webkit-scrollbar-thumb {
  background: var(--bg-tertiary);
  border-radius: 3px;
}

.docs-sidebar ul::-webkit-scrollbar-thumb:hover,
.tab-header::-webkit-scrollbar-thumb:hover {
  background: #444444;
}
</style>