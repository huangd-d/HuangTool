<template>
  <div class="window-controls">
    <button class="control-btn minimize" @click="minimizeWindow">
      <el-icon><Minus /></el-icon>
    </button>
    <button class="control-btn maximize" @click="maximizeWindow">
      <el-icon><FullScreen /></el-icon>
    </button>
    <button class="control-btn close" @click="closeWindow">
      <el-icon><Close /></el-icon>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Minus, FullScreen, Close } from '@element-plus/icons-vue';

// 检测是否在 Electron 环境
const isElectron = ref(typeof window !== 'undefined' && window.electronAPI);

// 最小化窗口
const minimizeWindow = () => {
  if (isElectron.value && window.electronAPI) {
    window.electronAPI.minimizeWindow();
  } else {
    // Web 环境下的处理
    console.log('Minimize window');
  }
};

// 最大化窗口
const maximizeWindow = () => {
  if (isElectron.value && window.electronAPI) {
    window.electronAPI.maximizeWindow();
  } else {
    // Web 环境下的处理
    if (window.innerHeight === window.screen.height) {
      window.resizeTo(1200, 800);
    } else {
      window.resizeTo(window.screen.width, window.screen.height);
    }
  }
};

// 关闭窗口
const closeWindow = () => {
  if (isElectron.value && window.electronAPI) {
    window.electronAPI.closeWindow();
  } else {
    // Web 环境下的处理
    console.log('Close window');
  }
};
</script>

<style scoped>
.window-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px;
  -webkit-app-region: no-drag; /* 窗口控制按钮区域不可拖动 */
}

.control-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  background-color: transparent;
  color: #ffffff;
}

.control-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.control-btn:active {
  transform: scale(0.95);
}

.control-btn el-icon {
  font-size: 16px;
}

.minimize:hover {
  background-color: rgba(255, 204, 0, 0.2);
}

.maximize:hover {
  background-color: rgba(52, 199, 89, 0.2);
}

.close:hover {
  background-color: rgba(255, 59, 48, 0.2);
}
</style>