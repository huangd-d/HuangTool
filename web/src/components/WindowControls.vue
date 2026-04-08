<template>
  <div class="window-controls">
    <button class="control-btn minimize" @click="minimizeWindow">
      <span class="btn-icon">−</span>
    </button>
    <button class="control-btn maximize" @click="maximizeWindow">
      <span class="btn-icon">□</span>
    </button>
    <button class="control-btn close" @click="closeWindow">
      <span class="btn-icon">×</span>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

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
  transition: all 0.3s ease;
  font-size: 16px;
}

.control-btn:hover {
  opacity: 0.8;
}

.control-btn:active {
  transform: scale(0.95);
}

.minimize {
  background-color: #f39c12;
  color: white;
}

.maximize {
  background-color: #27ae60;
  color: white;
}

.close {
  background-color: #e74c3c;
  color: white;
}

.btn-icon {
  font-weight: bold;
  font-size: 14px;
}
</style>