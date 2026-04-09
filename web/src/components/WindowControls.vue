<template>
  <div class="window-controls">
    <button class="control-btn minimize" @click="minimizeWindow">
      <span class="btn-icon"></span>
    </button>
    <button class="control-btn maximize" @click="maximizeWindow">
      <span class="btn-icon"></span>
    </button>
    <button class="control-btn close" @click="closeWindow">
      <span class="btn-icon"></span>
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
  width: 12px;
  height: 12px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.control-btn:hover {
  opacity: 0.8;
}

.control-btn:active {
  transform: scale(0.9);
}

.minimize {
  background-color: #ffcc00;
}

.minimize .btn-icon {
  width: 8px;
  height: 1px;
  background-color: #000;
}

.maximize {
  background-color: #34c759;
}

.maximize .btn-icon {
  width: 8px;
  height: 8px;
  border: 1px solid #000;
}

.close {
  background-color: #ff3b30;
}

.close .btn-icon {
  width: 8px;
  height: 8px;
  position: relative;
}

.close .btn-icon::before,
.close .btn-icon::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 8px;
  height: 1px;
  background-color: #000;
}

.close .btn-icon::before {
  transform: rotate(45deg);
}

.close .btn-icon::after {
  transform: rotate(-45deg);
}
</style>