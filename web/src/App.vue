<template>
  <div style="width: 100%;height: 100%;">
    <ThreeView />
    <!-- <div style="position: fixed;top: 1rem;left: 1rem;">
      <span>当前音量：{{ volume }}</span>
      <div>回复音频播放状态：{{ isPlaying }}</div>
    </div> -->
  </div>
</template>

<script setup lang='ts'>
import { onMounted, ref, onUnmounted } from 'vue'
import { startRecording, getCurrentVolume, stopRecording } from '@/utils/microphone'
import { createDefaultWebSocket, closeDefaultWebSocket } from '@/utils/wSocket';
import ThreeView from '@/views/ThreeView.vue'

import { audioPlayer } from './utils/AudioPlayer';

const volume = ref()
const isPlaying = ref()

// 播放音频函数
const playAudio = (blob: Blob) => {

  audioPlayer.add(blob)
}

onMounted(async () => {
  return
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
    audioPlayer.update()
    isPlaying.value = audioPlayer.getState()
  }, 100)
})

onUnmounted(() => {
  stopRecording()
  closeDefaultWebSocket()
})
</script>

<style scoped></style>
