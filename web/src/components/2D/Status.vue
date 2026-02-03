<template>
  <!-- 语音状态指示器 -->
  <div class="voice-status-indicator">
    <div class="status-item">
      <span class="status-label">麦克风:</span>
      <span class="status-value" :class="microphoneStatusClass">{{ microphoneStatusText }}</span>
    </div>
    <div class="status-item">
      <span class="status-label">服务器:</span>
      <span class="status-value" :class="serverStatusClass">{{ serverStatusText }}</span>
    </div>
    <div class="status-item">
      <span class="status-label">角色状态:</span>
      <span class="status-value" :class="avatarStatusClass">{{ avatarStatusText }}</span>
    </div>
    <div v-if="isRecording" class="recording-indicator">
      <div class="pulse"></div>
      <span>正在录音...</span>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { ref, computed } from 'vue'


// 语音状态管理
const microphoneStatus = ref<'idle' | 'requesting' | 'granted' | 'denied'>('idle')
const serverStatus = ref<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
const avatarStatus = ref<'idle' | 'talking' | 'listening'>('idle')
const isRecording = ref(false)

// 计算状态文本和类
const microphoneStatusText = computed(() => {
  switch (microphoneStatus.value) {
    case 'idle': return '待机'
    case 'requesting': return '请求中...'
    case 'granted': return '已授权'
    case 'denied': return '已拒绝'
    default: return '未知'
  }
})

const microphoneStatusClass = computed(() => {
  switch (microphoneStatus.value) {
    case 'granted': return 'status-granted'
    case 'denied': return 'status-denied'
    case 'requesting': return 'status-requesting'
    default: return 'status-idle'
  }
})

const serverStatusText = computed(() => {
  switch (serverStatus.value) {
    case 'disconnected': return '未连接'
    case 'connecting': return '连接中...'
    case 'connected': return '已连接'
    case 'error': return '连接错误'
    default: return '未知'
  }
})

const serverStatusClass = computed(() => {
  switch (serverStatus.value) {
    case 'connected': return 'status-connected'
    case 'error': return 'status-error'
    case 'connecting': return 'status-connecting'
    default: return 'status-disconnected'
  }
})

const avatarStatusText = computed(() => {
  switch (avatarStatus.value) {
    case 'idle': return '待机'
    case 'talking': return '说话中'
    case 'listening': return '聆听中'
    default: return '未知'
  }
})

const avatarStatusClass = computed(() => {
  switch (avatarStatus.value) {
    case 'talking': return 'status-talking'
    case 'listening': return 'status-listening'
    default: return 'status-idle'
  }
})
</script>

<style scoped>
/* 语音状态指示器样式 */
.voice-status-indicator {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 15px;
  border-radius: 10px;
  font-family: Arial, sans-serif;
  font-size: 14px;
  z-index: 1000;
  min-width: 200px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.status-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  align-items: center;
}

.status-item:last-child {
  margin-bottom: 0;
}

.status-label {
  font-weight: bold;
  margin-right: 10px;
  color: #ccc;
}

.status-value {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

/* 状态颜色 */
.status-granted, .status-connected {
  background-color: #4CAF50;
  color: white;
}

.status-denied, .status-error {
  background-color: #f44336;
  color: white;
}

.status-requesting, .status-connecting {
  background-color: #FF9800;
  color: white;
}

.status-idle, .status-disconnected {
  background-color: #9E9E9E;
  color: white;
}

.status-talking {
  background-color: #2196F3;
  color: white;
  animation: pulse 1.5s infinite;
}

.status-listening {
  background-color: #FF9800;
  color: white;
  animation: pulse 1s infinite;
}

/* 录音指示器 */
.recording-indicator {
  display: flex;
  align-items: center;
  margin-top: 10px;
  padding: 8px;
  background: rgba(244, 67, 54, 0.2);
  border-radius: 6px;
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.recording-indicator span {
  margin-left: 8px;
  font-weight: bold;
  color: #ff6b6b;
}

.pulse {
  width: 12px;
  height: 12px;
  background-color: #f44336;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0.7;
  }
}
</style>