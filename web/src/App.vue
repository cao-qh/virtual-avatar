<template>
  <div style="width: 100%;height: 100%;">
    <button @click="startRecord">开始录音</button>
    <button @click="stopRecord">停止录音</button>
    <span>当前音量：{{ volume }}</span>
  </div>
</template>

<script setup lang='ts'>
import { onMounted, ref ,onUnmounted } from 'vue'
import { startRecording, getCurrentVolume,stopRecording } from '@/utils/microphone'
import { saveAudioToFile } from '@/utils/saveAudioToFile'

const recorder = ref<MediaRecorder | null>(null);
const volume = ref();

onMounted(async () => {
  // 开启录音
  recorder.value = await startRecording() as MediaRecorder;
  recorder.value.ondataavailable = (event) => {
    console.log('录音数据可用');
    console.log(event.data);
    saveAudioToFile(event.data)
  };

  setInterval(() => {
    volume.value = getCurrentVolume().toFixed(2);
  }, 100);
});

onUnmounted(()=>{
  stopRecording()
})

const startRecord = () => {
  console.log('开始录音');
  recorder.value?.start();
}

const stopRecord = () => {
  console.log('停止录音');
  recorder.value?.stop();
}


</script>

<style scoped></style>
