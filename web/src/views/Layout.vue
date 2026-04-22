<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import WindowControls from 'components/WindowControls.vue'
import { menuItems, createTab } from 'config/menuConfig.js'

const router = useRouter()

const activeMenu = ref('home')

const handleMenuClick = (menu) => {
    activeMenu.value = menu.id;
    createTab(menu);
}

onMounted(() => {
    handleMenuClick(menuItems[0]);
    // 监听主进程发送的 navigate-to 事件，创建标签页
    if (window.electronAPI) {
        window.electronAPI.onNavigateTo((feature) => {
            console.log('feature---', feature);
            handleMenuClick(feature);
        });
    }
});
</script>

<template>
    <div class="app">
        <!-- 壳视图和完整视图显示头部栏 -->
        <header class="header">
            <span>Htool</span>
            <!-- 右侧控制按钮 -->
            <WindowControls />
        </header>

        <div class="sidebar-container">
            <!-- 左侧菜单内容 -->
            <div class="sidebar-menu">
                <!-- 菜单图标 -->
                <template v-for="menu in menuItems" :key="menu.id">
                    <el-tooltip :content="menu.title" placement="right" :show-after="300">
                        <div class="menu-item" :class="{ active: activeMenu === menu.id }"
                            @click="handleMenuClick(menu)">
                            <el-icon>
                                <component :is="menu.icon" />
                            </el-icon>
                        </div>
                    </el-tooltip>
                </template>
            </div>
        </div>
        <main class="main" id="main">
            <!-- <keep-alive>
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </keep-alive> -->
        </main>
    </div>
</template>

<style scoped>
.app {
    display: grid;
    grid-template-rows: 48px 1fr;
    grid-template-columns: 60px 1fr;
    grid-template-areas:
        "header header"
        "sidebar main";
    height: 100vh;
    width: 100vw;
    overflow: hidden;
}

.header {
    grid-area: header;
    background-color: rgba(0, 0, 0, 0.8);
    backdrop-filter: saturate(180%) blur(20px);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    -webkit-app-region: drag;
    cursor: grab;
}

.header:active {
    cursor: grabbing;
}

.header >span {
    font-size: 18px;
    font-weight: 600;
    color: #ffffff;
    font-family: 'Arial', sans-serif;
    letter-spacing: 1px;
    transition: all 0.3s ease;
}

.header >span:hover {
    color: #409eff;
    transform: scale(1.05);
}

.sidebar-container {
    grid-area: sidebar;
    background-color: #f0f0f0;
    border-right: 1px solid #dcdfe6;
    height: 100%;
}

.main {
    grid-area: main;
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
