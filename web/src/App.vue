<template>
  <div style="width: 100%;height: 100%;">
    <span>当前音量：{{ volume }}</span>
  </div>
</template>

<script setup lang='ts'>
import { onMounted, ref, onUnmounted } from 'vue'
import { startRecording, getCurrentVolume, stopRecording } from '@/utils/microphone'
import { createDefaultWebSocket, closeDefaultWebSocket } from '@/utils/wSocket';


const volume = ref();

onMounted(async () => {

  console.log("等待WebSocket连接...");
  const wsManager = createDefaultWebSocket("ws://localhost:3000");
  await wsManager.waitForOpen(10000);
  console.log("WebSocket连接已建立");

  // 开启录音
  await startRecording((sentenceAudio) => {
     console.log("检测到一句话，发送完整音频到服务器");
     wsManager.sendAudioData(sentenceAudio);
  },) as MediaRecorder;


  setInterval(() => {
    volume.value = getCurrentVolume().toFixed(2);
  }, 100);
});

onUnmounted(() => {
  stopRecording()
})


</script>

<style scoped></style>
