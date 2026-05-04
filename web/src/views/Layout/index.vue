<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import WindowControls from './components/WindowControls.vue'
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
            <div class="header-left">
                <span class="app-title">Htool</span>
                <!-- 菜单图标水平排列 -->
                <nav class="header-menu">
                    <template v-for="menu in menuItems" :key="menu.id">
                        <el-tooltip :content="menu.title" placement="bottom" :show-after="300">
                            <div class="menu-item" :class="{ active: activeMenu === menu.id }"
                                @click="handleMenuClick(menu)">
                                <el-icon>
                                    <component :is="menu.icon" />
                                </el-icon>
                            </div>
                        </el-tooltip>
                    </template>
                </nav>
            </div>
            <!-- 右侧控制按钮 -->
            <WindowControls />
        </header>

        <main class="main" id="main">
        </main>
    </div>
</template>

<style scoped>
.app {
    display: grid;
    grid-template-rows: 48px 1fr;
    grid-template-columns: 1fr;
    grid-template-areas:
        "header"
        "main";
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
    padding: 0 8px;
    -webkit-app-region: drag;
    cursor: grab;
}

.header:active {
    cursor: grabbing;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 16px;
    -webkit-app-region: drag;
}

.app-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--accent);
    font-family: 'Arial', sans-serif;
    letter-spacing: 1px;
    transition: all 0.3s ease;
}

.app-title:hover {
    color: var(--accent);
    transform: scale(1.05);
}

.header-menu {
    display: flex;
    align-items: center;
    gap: 4px;
    -webkit-app-region: no-drag;
}

.main {
    grid-area: main;
    overflow: auto;
    background-color: var(--content-bg);
    height: 100%;
}

/* 头部菜单项样式 */
.menu-item {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--text-secondary);
    position: relative;
    overflow: hidden;
}

.menu-item:hover {
    background-color: rgba(255, 144, 0, 0.15);
    color: var(--accent);
}

.menu-item.active {
    background-color: rgba(255, 144, 0, 0.2);
    color: var(--accent);
}

.menu-item.active::after {
    content: '';
    position: absolute;
    bottom: 2px;
    left: 50%;
    transform: translateX(-50%);
    width: 16px;
    height: 2px;
    background-color: var(--accent);
    border-radius: 1px;
}

.menu-item :deep(el-icon) {
    font-size: 18px;
    transition: all 0.2s ease;
}

.menu-item:hover :deep(el-icon) {
    transform: scale(1.1);
}
</style>
