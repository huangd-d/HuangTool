<script setup>
import { menuItems } from 'config/menuConfig.js'

// 过滤出首页需要展示的功能项（排除首页本身）
const features = menuItems.filter(item => item.id !== 'home')

// 导航到功能页面，通过 IPC 通知主进程
const handleFeatureClick = (feature) => {
    if (window.electronAPI) {
      const {icon, ...other} = feature;
        window.electronAPI.navigateTo(other)
    }
}
</script>

<template>
  <div class="home-container">
    <div class="hero-section">
      <h1>综合工具平台</h1>
      <p>一站式开发工具解决方案</p>
    </div>
    
    <div class="features-grid">
      <div 
        v-for="feature in features" 
        :key="feature.id"
        class="feature-card"
        @click="handleFeatureClick(feature)"
      >
        <div class="feature-icon">{{ feature.hIcon }}</div>
        <h2 class="feature-title">{{ feature.title }}</h2>
        <p class="feature-description">{{ feature.desc }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  background-color: var(--bg-secondary);
}

.hero-section {
  text-align: center;
  margin-bottom: 3rem;
}

.hero-section h1 {
  font-size: 2.5rem;
  color: var(--accent);
  margin-bottom: 1rem;
  font-weight: 700;
}

.hero-section p {
  font-size: 1.2rem;
  color: var(--text-secondary);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  width: 100%;
  max-width: 1000px;
}

.feature-card {
  background-color: var(--bg);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  box-shadow: var(--shadow);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid var(--border);
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-hover);
  border-color: var(--accent);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.feature-title {
  font-size: 1.5rem;
  color: var(--text);
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.feature-description {
  color: var(--text-secondary);
  font-size: 1rem;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .hero-section h1 {
    font-size: 2rem;
  }
  
  .hero-section p {
    font-size: 1rem;
  }
}
</style>