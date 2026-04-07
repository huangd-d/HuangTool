<script setup>
import { ref, onMounted } from 'vue'

const docsDirectories = ref([])
const loading = ref(false)
const error = ref('')
const selectedDoc = ref('')

async function loadDocsDirectories() {
  if (window.electronAPI) {
    loading.value = true
    error.value = ''
    try {
      docsDirectories.value = await window.electronAPI.getDocsDirectories()
    } catch (err) {
      error.value = '获取文档目录失败'
      console.error('Error loading docs directories:', err)
    } finally {
      loading.value = false
    }
  } else {
    // 开发模式下的模拟数据
    // docsDirectories.value = ['vue', 'vite']
  }
}

function openDocWindow(dir) {
  console.log('openDocWindow---', dir);
  selectedDoc.value = dir
  // debugger
  // if (window.electronAPI && window.electronAPI.openDocWindow) {
  //   window.electronAPI.openDocWindow(dir)
  // } else {
  //   // 开发模式下的模拟行为
  //   // window.open(`/docs/${dir}`, '_blank')
  // }
}

onMounted(() => {
  loadDocsDirectories()
})
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>文档管理系统</h1>
    </header>
    <main class="main">
      <nav class="sidebar">
        <h2>文档目录</h2>
        <ul>
          <li v-if="loading">加载中...</li>
          <li v-else-if="error">{{ error }}</li>
          <li v-else-if="docsDirectories.length === 0">暂无文档目录</li>
          <li v-for="dir in docsDirectories" :key="dir">
            <button @click="openDocWindow(dir)" class="doc-item">
              {{ dir.charAt(0).toUpperCase() + dir.slice(1) }} 文
            </button>
          </li>
        </ul>
      </nav>
      <div class="content">
        <webview v-if="selectedDoc" :src="`app://${selectedDoc}`" class="doc-viewer"></webview>
        <div v-else class="welcome">
          <h2>欢迎使用文档管理系统</h2>
          <p>请从左侧选择文档目录查看详细内容</p>
        </div>
      </div>
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
  padding: 1rem;
  text-align: center;
}

.main {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.sidebar {
  width: 200px;
  background-color: #f5f5f5;
  padding: 1rem;
  border-right: 1px solid #ddd;
  overflow-y: auto;
}

.sidebar h2 {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #333;
}

.sidebar ul {
  list-style: none;
  padding: 0;
}

.sidebar li {
  margin-bottom: 0.5rem;
}

.doc-item {
  width: 100%;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  background-color: white;
  text-align: left;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.2s;
}

.doc-item:hover {
  background-color: #e0e0e0;
}

.content {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

.content h2 {
  color: #333;
  margin-bottom: 1rem;
}

.content p {
  color: #666;
  line-height: 1.6;
}
</style>
