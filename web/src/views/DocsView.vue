<template>
  <div class="docs-view">
    <h2>技术文档预览</h2>
    <div class="docs-content">
      <div class="docs-sidebar">
        <h3>文档目录</h3>
        <ul>
          <li v-if="loading">加载中...</li>
          <li v-else-if="error">{{ error }}</li>
          <li v-else-if="docsDirectories.length === 0">暂无文档目录</li>
          <li v-for="dir in docsDirectories" :key="dir">
            <button @click="selectDoc(dir)" class="doc-item">
              {{ dir.charAt(0).toUpperCase() + dir.slice(1) }} 文档
            </button>
          </li>
        </ul>
      </div>
      <div class="docs-preview">
        <h3>预览</h3>
        <div class="preview-container">
          <webview v-if="selectedDoc" :src="`app://${selectedDoc}`" class="doc-viewer"></webview>
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
const selectedDoc = ref('')
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

function selectDoc(dir) {
  selectedDoc.value = dir
}

onMounted(() => {
  loadDocsDirectories()
})
</script>

<style scoped>
.docs-view {
  padding: 20px;
}

.docs-content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  margin-top: 20px;
}

.docs-sidebar {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
}

.docs-preview {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
}

h3 {
  margin-top: 0;
  color: #333;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  margin-bottom: 10px;
}

.doc-item {
  width: 100%;
  padding: 10px;
  border: none;
  border-radius: 4px;
  background: white;
  text-align: left;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.doc-item:hover {
  background: #e0e0e0;
}

.preview-container {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-height: 500px;
  overflow: hidden;
}

.preview-placeholder {
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

.doc-viewer {
  width: 100%;
  height: 500px;
  border: none;
}
</style>