<script setup>
import { ref, onMounted } from 'vue'
import WindowControls from './components/WindowControls.vue'

// App.vue 现在只负责布局和导航
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>综合工具平台</h1>
      <div class="nav-controls">
        <nav class="main-nav">
          <router-link to="/api" class="nav-item">接口调用</router-link>
          <router-link to="/office" class="nav-item">Office 预览</router-link>
          <router-link to="/docs" class="nav-item">技术文档</router-link>
        </nav>
        <WindowControls />
      </div>
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
  background-color: #42b883;
  color: white;
  padding: 0.5rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header h1 {
  margin: 0;
  font-size: 1.5rem;
}

.nav-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.main-nav {
  display: flex;
  gap: 1rem;
}

.nav-item {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.nav-item.router-link-active {
  background-color: rgba(255, 255, 255, 0.3);
  font-weight: bold;
}

.main {
  flex: 1;
  overflow: auto;
  background-color: #f9f9f9;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
