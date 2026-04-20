<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import WindowControls from './components/WindowControls.vue'
import { HomeFilled, Document, Memo, Files } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

const activeMenu = ref('home')

const menuItems = [
  { id: 'home', title: '首页', icon: HomeFilled, path: '/' },
  { id: 'api', title: 'API管理', icon: Document, path: '/api' },
  { id: 'docs', title: '技术文档访问', icon: Memo, path: '/docs' },
  { id: 'office', title: '办公文件预览', icon: Files, path: '/office' }
]

const urlParams = new URLSearchParams(window.location.search)
const isTabView = urlParams.has('tab')
const isShellView = urlParams.has('shell')

const handleMenuClick = (menu) => {
  activeMenu.value = menu.id;
  if (menu) {
    router.push(menu.path)
  }
}

const updateActiveMenu = () => {
  const currentPath = route.path
  const menu = menuItems.find(item => item.path === currentPath)
  if (menu) {
    activeMenu.value = menu.id
  }
}

watch(() => route.path, updateActiveMenu, { immediate: true })
</script>

<template>
  <div class="app">
    <!-- 壳视图和完整视图显示头部栏 -->
    <header v-if="!isTabView" class="header">
      <!-- 右侧控制按钮 -->
      <WindowControls />
    </header>
    
    <!-- 使用 el-splitter 实现左右布局 -->
    <el-splitter mode="horizontal" class="splitter-container">
      <!-- 左侧菜单区 - 壳视图和完整视图都要显示 -->
      <el-splitter-panel size="60px">
        <div class="sidebar-container">
          <!-- 左侧菜单内容 -->
          <div class="sidebar-menu">
            <!-- 菜单图标 -->
            <template v-for="menu in menuItems" :key="menu.id">
              <el-tooltip :content="menu.title" placement="right" :show-after="300">
                <div class="menu-item" :class="{ active: activeMenu === menu.id }" @click="handleMenuClick(menu)">
                  <el-icon><component :is="menu.icon" /></el-icon>
                </div>
              </el-tooltip>
            </template>
          </div>
        </div>
      </el-splitter-panel>
      <el-splitter-panel>
        <main class="main" :class="{ 'full-height': isTabView }">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </main>
      </el-splitter-panel>
    </el-splitter>
  </div>
</template>

<style scoped>
.app {
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

.header {
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: saturate(180%) blur(20px);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 48px;
  padding: 0 16px;
  -webkit-app-region: drag; /* 允许拖动窗口 */
  cursor: grab;
}

.header:active {
  cursor: grabbing;
}

.splitter-container {
  height: calc(100vh - 48px);
}

.sidebar-container {
  width: 60px;
  background-color: #f0f0f0;
  border-right: 1px solid #dcdfe6;
  height: 100%;
}

.main {
  overflow: auto;
  background-color: var(--bg-secondary);
  height: 100%;
}

/* 左侧菜单栏样式 */
.sidebar-menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  gap: 20px;
  height: 100%;
}

.menu-item {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #606266;
  position: relative;
  overflow: hidden;
}

.menu-item:hover {
  background-color: #ecf5ff;
  color: #409eff;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.menu-item.active {
  background-color: #ecf5ff;
  color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
}

.menu-item.active::after {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background-color: #409eff;
  border-radius: 0 2px 2px 0;
}

.menu-item :deep(el-icon) {
  font-size: 20px;
  transition: all 0.3s ease;
}

.menu-item:hover :deep(el-icon) {
  transform: scale(1.1);
}
</style>
