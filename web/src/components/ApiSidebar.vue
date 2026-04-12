<template>
  <div class="api-sidebar">
    <!-- 项目管理 -->
    <div class="sidebar-section">
      <div class="section-header">
        <h3>项目</h3>
        <button @click="$emit('add-project')" class="add-btn">+</button>
      </div>
      <ul class="project-list">
        <li v-for="project in projects" 
            :key="project.id" 
            :class="{ active: selectedProject?.id === project.id }"
            @click="$emit('select-project', project)">
          {{ project.name }}
          <div class="project-actions">
            <button @click.stop="$emit('edit-project', project)" class="action-btn edit">✏️</button>
            <button @click.stop="$emit('delete-project', project)" class="action-btn delete">🗑️</button>
          </div>
        </li>
      </ul>
    </div>

    <!-- 分类管理 -->
    <div class="sidebar-section" v-if="selectedProject">
      <div class="section-header">
        <h3>分类</h3>
        <button @click="$emit('add-category')" class="add-btn">+</button>
      </div>
      <ul class="category-list">
        <li v-for="category in categories" 
            :key="category.id"
            :class="{ active: selectedCategory?.id === category.id }"
            @click="$emit('select-category', category)">
          {{ category.name }}
          <div class="category-actions">
            <button @click.stop="$emit('edit-category', category)" class="action-btn edit">✏️</button>
            <button @click.stop="$emit('delete-category', category)" class="action-btn delete">🗑️</button>
          </div>
        </li>
      </ul>
    </div>

    <!-- 接口管理 -->
    <div class="sidebar-section" v-if="selectedCategory">
      <div class="section-header">
        <h3>接口</h3>
        <button @click="$emit('add-endpoint')" class="add-btn">+</button>
      </div>
      <ul class="endpoint-list">
        <li v-for="endpoint in endpoints" 
            :key="endpoint.id"
            @click="$emit('open-endpoint-tab', endpoint)">
          <span class="endpoint-name">{{ endpoint.name }}</span>
          <span class="endpoint-method" :class="endpoint.method.toLowerCase()">
            {{ endpoint.method }}
          </span>
          <div class="endpoint-actions">
            <button @click.stop="$emit('edit-endpoint', endpoint)" class="action-btn edit">✏️</button>
            <button @click.stop="$emit('delete-endpoint', endpoint)" class="action-btn delete">🗑️</button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  projects: {
    type: Array,
    default: () => []
  },
  categories: {
    type: Array,
    default: () => []
  },
  endpoints: {
    type: Array,
    default: () => []
  },
  selectedProject: {
    type: Object,
    default: null
  },
  selectedCategory: {
    type: Object,
    default: null
  }
})

const emit = defineEmits([
  'add-project',
  'edit-project',
  'delete-project',
  'select-project',
  'add-category',
  'edit-category',
  'delete-category',
  'select-category',
  'add-endpoint',
  'edit-endpoint',
  'delete-endpoint',
  'open-endpoint-tab'
])
</script>

<style scoped>
.api-sidebar {
  width: 300px;
  background: #f5f5f5;
  border-right: 1px solid #ddd;
  overflow-y: auto;
  padding: 15px;
}

.sidebar-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.add-btn {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: #42b883;
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-btn:hover {
  background: #35495e;
}

/* 项目列表 */
.project-list,
.category-list,
.endpoint-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.project-list li,
.category-list li,
.endpoint-list li {
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: background-color 0.2s;
}

.project-list li:hover,
.category-list li:hover,
.endpoint-list li:hover {
  background: #e0e0e0;
}

.project-list li.active,
.category-list li.active {
  background: #42b883;
  color: white;
}

.endpoint-list li {
  gap: 8px;
}

.endpoint-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 操作按钮 */
.project-actions,
.category-actions,
.endpoint-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.project-list li:hover .project-actions,
.category-list li:hover .category-actions,
.endpoint-list li:hover .endpoint-actions {
  opacity: 1;
}

.action-btn {
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 3px;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn.edit:hover {
  background: #f0ad4e;
  color: white;
}

.action-btn.delete:hover {
  background: #d9534f;
  color: white;
}

/* 接口方法标签 */
.endpoint-method {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 10px;
  margin-right: 8px;
}

.endpoint-method.get {
  background: #5cb85c;
  color: white;
}

.endpoint-method.post {
  background: #337ab7;
  color: white;
}

.endpoint-method.put {
  background: #f0ad4e;
  color: white;
}

.endpoint-method.delete {
  background: #d9534f;
  color: white;
}

.endpoint-method.patch {
  background: #5856d6;
  color: white;
}
</style>
