<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <h2>导航菜单</h2>
    </div>
    <div class="sidebar-menu">
      <div class="menu-item">
        <span class="menu-icon">📋</span>
        <span class="menu-text">接口管理</span>
      </div>
      <div class="menu-item">
        <span class="menu-icon">📄</span>
        <span class="menu-text">技术文档</span>
      </div>
      <div class="menu-item">
        <span class="menu-icon">👁️</span>
        <span class="menu-text">文件预览</span>
      </div>
    </div>
  </div>
</template>

<script setup>
// 组件逻辑
</script>

<style scoped>
.sidebar {
  width: 240px;
  height: 100vh;
  background-color: #f5f5f5;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  padding: 20px 0;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
}

.sidebar-header {
  padding: 0 20px 20px;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 20px;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.sidebar-menu {
  flex: 1;
  padding: 0 10px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  margin-bottom: 5px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.menu-item:hover {
  background-color: #e3f2fd;
  color: #1976d2;
}

.menu-icon {
  font-size: 18px;
  margin-right: 12px;
  width: 24px;
  text-align: center;
}

.menu-text {
  font-size: 14px;
  font-weight: 500;
}
</style>