<script setup>
import { ref, computed, onMounted } from 'vue'
import WindowControls from './components/WindowControls.vue'

// 检测 URL 参数
const urlParams = new URLSearchParams(window.location.search)
const isTabView = urlParams.has('tab')  // 页签视图：无头部栏，有内容
const isShellView = urlParams.has('shell')  // 壳视图：有头部栏，无内容

// 页签列表（初始为空，由后端控制）
const tabs = ref([])

// 当前激活的页签（初始为 null，由后端控制）
const activeTabId = ref(null)

// 拖拽相关状态
const draggedTabId = ref(null)
const dragOverTabId = ref(null)

// 切换页签
const switchTab = (tab) => {
  if (window.electronAPI) {
    window.electronAPI.switchTab(tab.id)
  }
}

// 关闭页签
const closeTab = (event, tabId) => {
  event.stopPropagation()
  // 禁止关闭首页页签
  const tab = tabs.value.find(t => t.id === tabId)
  if (tab && tab.path === '/') {
    return
  }
  if (window.electronAPI) {
    window.electronAPI.closeTab(tabId)
  }
}

// 新建标签页
const addNewTab = () => {
  if (window.electronAPI) {
    window.electronAPI.createTab('新标签页', '/' + Date.now())
  }
}

// 创建指定页面的新页签
const createTab = (title, path) => {
  if (window.electronAPI) {
    window.electronAPI.createTab(title, path)
  }
}

// 监听页签创建事件
const handleTabCreated = (tab) => {
  tabs.value.push(tab)
}

// 监听页签切换事件
const handleTabSwitched = (tabId) => {
  activeTabId.value = tabId
}

// 监听页签关闭事件
const handleTabClosed = (tabId) => {
  tabs.value = tabs.value.filter(t => t.id !== tabId)
}

// 组件挂载时设置事件监听
onMounted(() => {
  if (window.electronAPI) {
    // 监听页签事件
    window.electronAPI.onTabCreated(handleTabCreated)
    window.electronAPI.onTabSwitched(handleTabSwitched)
    window.electronAPI.onTabClosed(handleTabClosed)
  }
})

// 提供创建页签的方法给子组件
import { provide } from 'vue'
provide('createTab', createTab)

// 页签拖拽相关函数
const handleDragStart = (event, tabId) => {
  draggedTabId.value = tabId
  event.dataTransfer.effectAllowed = 'move'
  event.dataTransfer.setData('text/plain', tabId)
  // 添加拖拽样式
  event.target.classList.add('dragging')
}

const handleDragEnd = (event) => {
  event.target.classList.remove('dragging')
  draggedTabId.value = null
  dragOverTabId.value = null
}

const handleDragOver = (event, tabId) => {
  event.preventDefault()
  event.dataTransfer.dropEffect = 'move'
  if (tabId !== draggedTabId.value) {
    dragOverTabId.value = tabId
  }
}

const handleDragLeave = (event) => {
  dragOverTabId.value = null
}

const handleDrop = (event, targetTabId) => {
  event.preventDefault()
  
  if (!draggedTabId.value || draggedTabId.value === targetTabId) {
    return
  }
  
  // 获取拖拽源和目标索引
  const dragIndex = tabs.value.findIndex(t => t.id === draggedTabId.value)
  const dropIndex = tabs.value.findIndex(t => t.id === targetTabId)
  
  if (dragIndex === -1 || dropIndex === -1) {
    return
  }
  
  // 重新排列页签
  const draggedTab = tabs.value[dragIndex]
  tabs.value.splice(dragIndex, 1)
  tabs.value.splice(dropIndex, 0, draggedTab)
  
  // 清理状态
  draggedTabId.value = null
  dragOverTabId.value = null
}
</script>

<template>
  <div class="app">
    <!-- 壳视图和完整视图显示头部栏 -->
    <header v-if="!isTabView" class="header">
      <!-- 左侧页签区域 -->
      <div class="tabs-container">
        <div 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab"
          :class="{ 
            active: tab.id === activeTabId,
            'drag-over': dragOverTabId === tab.id
          }"
          @click="switchTab(tab)"
          draggable="true"
          @dragstart="handleDragStart($event, tab.id)"
          @dragend="handleDragEnd($event)"
          @dragover="handleDragOver($event, tab.id)"
          @dragleave="handleDragLeave($event)"
          @drop="handleDrop($event, tab.id)"
        >
          <span class="tab-title">{{ tab.title }}</span>
          <button v-if="tab.path !== '/'" class="tab-close" @click="closeTab($event, tab.id)">×</button>
        </div>
        <div class="new-tab" @click="addNewTab">+</div>
      </div>
      
      <!-- 右侧控制按钮 -->
      <WindowControls />
    </header>
    <!-- 页签视图占满全屏，壳视图不需要内容区 -->
    <main v-if="!isShellView" class="main" :class="{ 'full-height': isTabView }">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.header {
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: saturate(180%) blur(20px);
  border-bottom: none;
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 8px;
  box-shadow: none;
  -webkit-app-region: drag; /* 允许拖动窗口 */
  cursor: grab;
}

.header:active {
  cursor: grabbing;
}

.tabs-container {
  display: flex;
  align-items: center;
  flex: 1;
  overflow-x: auto;
  gap: 8px;
}

.tab {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 36px;
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 400;
  color: #ffffff;
  transition: all 0.2s ease;
  position: relative;
  white-space: nowrap;
  -webkit-app-region: no-drag; /* 页签本身不可拖动窗口 */
  user-select: none;
}

.tab.dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

.tab.drag-over {
  border-left: 3px solid var(--accent);
  background-color: rgba(255, 255, 255, 0.2);
  position: relative;
}

.tab.drag-over::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background-color: var(--accent);
  border-radius: 2px;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.tab:hover {
  background-color: rgba(255, 255, 255, 0.15);
  text-decoration: underline;
}

.tab.active {
  background-color: var(--accent);
  border: 1px solid var(--accent);
  color: #ffffff;
  font-weight: 400;
}

.tab-title {
  margin-right: 8px;
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
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
}

.tab-close:hover {
  background-color: rgba(255, 255, 255, 0.32);
  color: #ffffff;
}

.new-tab {
  width: 36px;
  height: 36px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.8);
  transition: all 0.2s ease;
  background-color: rgba(255, 255, 255, 0.1);
  -webkit-app-region: no-drag; /* 新页签按钮不可拖动窗口 */
}

.new-tab:hover {
  background-color: rgba(255, 255, 255, 0.15);
  color: #ffffff;
}

.main {
  flex: 1;
  overflow: auto;
  background-color: var(--bg-secondary);
}

.main.full-height {
  height: 100vh;
}

/* 滚动条样式 */
.tabs-container::-webkit-scrollbar {
  height: 6px;
}

.tabs-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.tabs-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.tabs-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
