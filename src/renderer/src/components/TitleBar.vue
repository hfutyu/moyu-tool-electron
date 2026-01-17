<template>
  <el-header class="title-bar">
    <div class="title-content">
      <img src="../assets/icon.ico" alt="Logo" class="logo"/>
      <span class="app-title">猫鱼工具</span>
    </div>
    <div class="window-controls">
      <button class="control-btn minimize-btn" @click="windowMinimize">
        <svg class="icon" viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M20 14H4v-4h16v4z"/>
        </svg>
      </button>
      <button class="control-btn maximize-btn" @click="windowMaximize">
        <svg v-if="!isMaximized" class="icon" viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M4 4h16v16H4V4zm2 2v12h12V6H6z"/>
        </svg>
        <svg v-else class="icon" viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M4 4h12v12H4V4zm2 2v8h8V6H6z"/>
        </svg>
      </button>
      <button class="control-btn close-btn" @click="windowClose">
        <svg class="icon" viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>
    </div>
  </el-header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
// 用于跟踪窗口是否最大化
const isMaximized = ref(false)

const windowMinimize = async () => {
  if (window && (window as any).electron) {
    (window as any).electron.ipcRenderer.invoke('window-minimize')
  }
}
const windowMaximize = async () => {
  if (window && (window as any).electron) {
    isMaximized.value = await (window as any).electron.ipcRenderer.invoke('window-maximize')
  }
}

const windowClose = () => {
  if (window && (window as any).electron) {
    (window as any).electron.ipcRenderer.invoke('window-close')
  }
}
</script>

<style scoped>
.title-bar {
  height: 50px;
  background: linear-gradient(135deg, #2c3e50 0%, #4a6491 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px;
  color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  user-select: none;
  -webkit-app-region: drag;
  -webkit-user-select: none;
}

.title-content {
  display: flex;
  align-items: center;
  flex: 1;
}

.logo {
  width: 24px;
  height: 24px;
  margin-right: 8px;
  border-radius: 3px;
}

.app-title {
  font-size: 16px;
  font-weight: 500;
  letter-spacing: 0.5px;
  margin-left: 4px;
}

.window-controls {
  -webkit-app-region: no-drag;
  display: flex;
  height: 30px;
  margin-right: 2px;
}

.control-btn {
  width: 46px;
  height: 30px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  -webkit-app-region: no-drag;
  border-radius: 4px;
}

.control-btn:hover .icon {
  opacity: 1;
}

.minimize-btn:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.maximize-btn:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

.close-btn:hover {
  background-color: #e8104c;
}

.close-btn:active {
  background-color: #c20f41;
}

.icon {
  color: white;
  opacity: 0.85;
  transition: opacity 0.2s ease;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
}

.close-btn .icon {
  opacity: 0.9;
}

.close-btn:hover .icon {
  fill: white;
}
</style>
