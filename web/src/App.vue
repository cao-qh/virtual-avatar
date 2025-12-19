<template>
  <div style="width: 100%;height: 100%;">
    <ThreeView />
    <div style="position: fixed;top: 1rem;left: 1rem;">
      <span>当前音量：{{ volume }}</span>
    <div v-if="isPlaying">正在播放回复音频...</div>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { onMounted, ref, onUnmounted } from 'vue'
import { startRecording, getCurrentVolume, stopRecording } from '@/utils/microphone'
import { createDefaultWebSocket, closeDefaultWebSocket } from '@/utils/wSocket';
import ThreeView from '@/components/2D/ThreeView.vue'

const volume = ref()
const isPlaying = ref(false)

// 播放音频函数
const playAudio = (audioBuffer: ArrayBuffer) => {
  console.log('开始播放音频，数据大小:', audioBuffer.byteLength)
  isPlaying.value = true
  const blob = new Blob([audioBuffer], { type: 'audio/mpeg' })
  const url = URL.createObjectURL(blob)
  const audio = new Audio(url)
  
  // 添加事件监听器
  audio.addEventListener('canplaythrough', () => {
    console.log('音频可以播放')
  })
  
  audio.addEventListener('error', (e) => {
    console.error('音频播放错误:', e, audio.error)
    URL.revokeObjectURL(url)
    isPlaying.value = false
  })
  
  audio.addEventListener('ended', () => {
    console.log('音频播放结束')
    URL.revokeObjectURL(url)
    isPlaying.value = false
  })
  
  const playPromise = audio.play()
  if (playPromise !== undefined) {
    playPromise.catch(error => {
      console.error('播放失败:', error)
      // 可能是自动播放被阻止，尝试用户交互后播放
      // 这里我们可以显示一个按钮让用户手动播放
      isPlaying.value = false
    })
  }
}

onMounted(async () => {
  console.log("等待WebSocket连接...")
  const wsManager = createDefaultWebSocket("ws://localhost:3000", {
    onAudioData: playAudio
  })

  await wsManager.waitForOpen(10000)
  console.log("WebSocket连接已建立")

  // 开启录音
  await startRecording((sentenceAudio) => {
    console.log("检测到一句话，发送完整音频到服务器")
    wsManager.sendAudioData(sentenceAudio)
  }) as MediaRecorder

  setInterval(() => {
    volume.value = getCurrentVolume().toFixed(2)
  }, 100)
})

onUnmounted(() => {
  stopRecording()
  closeDefaultWebSocket()
})
</script>

<style scoped></style>
