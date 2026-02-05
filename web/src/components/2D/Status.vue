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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import eventBus from '@/utils/EventBus'

// 语音状态管理
const microphoneStatus = ref<'idle' | 'requesting' | 'granted' | 'denied'>('idle')
const serverStatus = ref<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
const avatarStatus = ref<'idle' | 'talking' | 'listening' | 'thinking'>('idle')
const isRecording = ref(false)

// 事件处理函数
const handleMicrophoneStatusChanged = (status: 'idle' | 'requesting' | 'granted' | 'denied') => {
  microphoneStatus.value = status
}

const handleServerStatusChanged = (status: 'disconnected' | 'connecting' | 'connected' | 'error') => {
  serverStatus.value = status
}

const handleAvatarStatusChanged = (status: 'idle' | 'talking' | 'listening' | 'thinking') => {
  avatarStatus.value = status
}

const handleRecordingStatusChanged = (recording: boolean) => {
  // 立即更新状态，不使用防抖
  isRecording.value = recording
}

// 初始化事件监听
onMounted(() => {
  eventBus.on('microphone-status-changed', handleMicrophoneStatusChanged)
  eventBus.on('server-status-changed', handleServerStatusChanged)
  eventBus.on('avatar-status-changed', handleAvatarStatusChanged)
  eventBus.on('recording-status-changed', handleRecordingStatusChanged)
})

// 清理事件监听
onUnmounted(() => {
  eventBus.off('microphone-status-changed', handleMicrophoneStatusChanged)
  eventBus.off('server-status-changed', handleServerStatusChanged)
  eventBus.off('avatar-status-changed', handleAvatarStatusChanged)
  eventBus.off('recording-status-changed', handleRecordingStatusChanged)
})

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
    case 'thinking': return '思考中'
    default: return '未知'
  }
})

const avatarStatusClass = computed(() => {
  switch (avatarStatus.value) {
    case 'talking': return 'status-talking'
    case 'listening': return 'status-listening'
    case 'thinking': return 'status-thinking'
    default: return 'status-idle'
  }
})
</script>

<style scoped>
/* 语音状态指示器样式 - 浅色简约版 */
.voice-status-indicator {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.95);
  color: #333333;
  padding: 16px;
  border-radius: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  font-size: 12px;
  z-index: 1000;
  min-width: 200px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.08),
    0 1px 4px rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.voice-status-indicator:hover {
  box-shadow: 
    0 6px 24px rgba(0, 0, 0, 0.12),
    0 2px 6px rgba(0, 0, 0, 0.06);
  border-color: rgba(0, 0, 0, 0.12);
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.status-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.status-label {
  font-weight: 500;
  margin-right: 10px;
  color: #666666;
  font-size: 12px;
}

.status-value {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

/* 状态颜色 - 浅色简约版 */
.status-granted, .status-connected {
  background: #e8f5e9;
  color: #2e7d32;
  border-color: #c8e6c9;
}

.status-denied, .status-error {
  background: #ffebee;
  color: #c62828;
  border-color: #ffcdd2;
}

.status-requesting, .status-connecting {
  background: #fff3e0;
  color: #ef6c00;
  border-color: #ffe0b2;
}

.status-idle, .status-disconnected {
  background: #f5f5f5;
  color: #757575;
  border-color: #e0e0e0;
}

.status-talking {
  background: #e3f2fd;
  color: #1565c0;
  border-color: #bbdefb;
}

.status-listening {
  background: #fff3e0;
  color: #ef6c00;
  border-color: #ffe0b2;
}

.status-thinking {
  background: #f3e5f5;
  color: #7b1fa2;
  border-color: #e1bee7;
}

/* 录音指示器 - 带过渡效果 */
.recording-indicator {
  display: flex;
  align-items: center;
  margin-top: 12px;
  padding: 8px 12px;
  background: #ffebee;
  border-radius: 8px;
  border: 1px solid #ffcdd2;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.recording-indicator span {
  margin-left: 8px;
  font-weight: 600;
  color: #c62828;
  font-size: 12px;
}

.pulse {
  width: 8px;
  height: 8px;
  background: #f44336;
  border-radius: 50%;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .voice-status-indicator {
    top: 12px;
    right: 12px;
    padding: 12px;
    min-width: 180px;
    font-size: 11px;
  }
  
  .status-label {
    font-size: 11px;
  }
  
  .status-value {
    padding: 3px 8px;
    font-size: 10px;
  }
}
</style>
