<script setup>
import { ref, computed, watch, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WindowControls from './components/WindowControls.vue'

const route = useRoute()
const router = useRouter()

// 页签列表
const tabs = ref([
  { id: 1, title: '首页', path: '/' }
])

// 当前激活的页签
const activeTab = computed(() => {
  return tabs.value.find(tab => tab.path === route.path) || tabs.value[0]
})

// 切换页签
const switchTab = (tab) => {
  router.push(tab.path)
}

// 关闭页签
const closeTab = (event, tabId) => {
  event.stopPropagation()
  // 禁止关闭首页页签
  const tab = tabs.value.find(t => t.id === tabId)
  if (tab && tab.path === '/') {
    return
  }
  // 不能关闭当前激活的页签
  if (tab && tab.path === route.path) {
    // 切换到其他页签
    const currentIndex = tabs.value.findIndex(t => t.id === tabId)
    const newTab = currentIndex > 0 ? tabs.value[currentIndex - 1] : tabs.value[0]
    router.push(newTab.path)
  }
  // 从列表中移除页签
  tabs.value = tabs.value.filter(t => t.id !== tabId)
}

// 新建标签页
const addNewTab = () => {
  const newTab = {
    id: Date.now(),
    title: '新标签页',
    path: '/' + Date.now()
  }
  tabs.value.push(newTab)
  router.push(newTab.path)
}

// 创建指定页面的新页签
const createTab = (title, path) => {
  // 检查是否已经存在该路径的页签
  const existingTab = tabs.value.find(tab => tab.path === path)
  if (existingTab) {
    // 如果已存在，直接切换到该页签
    router.push(path)
  } else {
    // 如果不存在，创建新页签
    const newTab = {
      id: Date.now(),
      title: title,
      path: path
    }
    tabs.value.push(newTab)
    router.push(path)
  }
}

// 提供创建页签的方法给子组件
provide('createTab', createTab)
</script>

<template>
  <div class="app">
    <header class="header">
      <!-- 左侧页签区域 -->
      <div class="tabs-container">
        <div 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab"
          :class="{ active: tab.path === route.path }"
          @click="switchTab(tab)"
        >
          <span class="tab-title">{{ tab.title }}</span>
          <button v-if="tab.path !== '/'" class="tab-close" @click="closeTab($event, tab.id)">×</button>
        </div>
        <div class="new-tab" @click="addNewTab">+</div>
      </div>
      
      <!-- 右侧控制按钮 -->
      <WindowControls />
    </header>
    <main class="main">
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
