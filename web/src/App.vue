<template>
  <div style="width: 100%;height: 100%;">
    <MessageText />
    <ThreeView />
  </div>
</template>

<script setup lang='ts'>
import { onMounted } from 'vue'
import MessageText from './components/2D/MessageText.vue';
import ThreeView from './components/2D/ThreeView.vue';
import requestMicrophonePermission from './utils/microphone';
import createSocket from '@/utils/wSocket';


onMounted(async () => {

  // 创建socket
  createSocket("ws://localhost:3000")

  try {
    // 请求麦克风权限
   const res=  await requestMicrophonePermission()
   console.log(res)
  } catch (e: any) {
    console.log("请求麦克风权限失败:", e.message)
  }
})
</script>

<style scoped>
#c {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
