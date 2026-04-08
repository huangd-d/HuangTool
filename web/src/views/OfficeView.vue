<template>
  <div class="office-view">
    <h2>Office 文档预览</h2>
    <div class="office-content">
      <div class="file-selector">
        <h3>选择文档</h3>
        <input type="file" @change="handleFileSelect" accept=".docx,.xlsx,.pptx">
        <button @click="openFileDialog">浏览文件</button>
      </div>
      <div class="document-preview" v-if="selectedFile">
        <h3>预览</h3>
        <div class="preview-container">
          <div v-if="loading">加载中...</div>
          <div v-else-if="error" class="error">{{ error }}</div>
          <div v-else class="jit-viewer" ref="viewerContainer"></div>
        </div>
      </div>
      <div class="document-preview" v-else>
        <h3>预览</h3>
        <div class="preview-placeholder">
          请选择一个 Office 文档进行预览
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { createViewer } from 'jit-viewer'

const selectedFile = ref(null)
const loading = ref(false)
const error = ref('')
const viewerContainer = ref(null)
let jitViewer = null

function openFileDialog() {
  // 触发文件选择对话框
  document.querySelector('input[type="file"]').click()
}

async function handleFileSelect(event) {
  const file = event.target.files[0]
  if (file) {
    selectedFile.value = file
    await previewDocument(file)
  }
}

async function previewDocument(file) {
  loading.value = true
  error.value = ''
  
  try {
    await loadJitViewer(file)
  } catch (err) {
    error.value = `预览失败: ${err.message}`
    console.error('预览错误:', err)
  } finally {
    loading.value = false
  }
}

async function loadJitViewer(file) {
  if (jitViewer) {
    jitViewer.destroy()
  }
  
  // 使用 JIT Viewer SDK 预览文档
  jitViewer = createViewer({
    container: viewerContainer.value,
    documentType: getDocumentType(file.name),
    documentUrl: URL.createObjectURL(file),
    config: {
      showToolbar: true,
      showSearch: true,
      showThumbnails: true
    }
  })
  
  await jitViewer.load()
}

function getDocumentType(fileName) {
  const extension = fileName.toLowerCase().split('.').pop()
  switch (extension) {
    case 'docx':
      return 'word'
    case 'xlsx':
      return 'excel'
    case 'pptx':
      return 'powerpoint'
    default:
      return 'word'
  }
}

onUnmounted(() => {
  if (jitViewer) {
    jitViewer.destroy()
  }
})
</script>

<style scoped>
.office-view {
  padding: 20px;
}

.office-content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 20px;
  margin-top: 20px;
}

.file-selector {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
}

.document-preview {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
}

h3 {
  margin-top: 0;
  color: #333;
}

input[type="file"] {
  display: none;
}

button {
  background: #42b883;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 10px;
}

button:hover {
  background: #35495e;
}

.preview-container {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.preview-placeholder {
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

.jit-viewer {
  width: 100%;
  height: 500px;
}

.error {
  color: #e74c3c;
  text-align: center;
  padding: 20px;
}
</style>