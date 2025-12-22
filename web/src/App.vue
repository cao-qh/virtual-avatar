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
import { ref } from 'vue'
import ThreeView from '@/views/ThreeView.vue'
import Globals from './utils/Globals';

const volume = ref()
const isPlaying = ref()

</script>

<style scoped></style>
