<template>
  <canvas id="c" ref="c"></canvas>
  <Loading v-if="!loaded" :progress="loadingProgress" />
  <Teleport to="body">
    <Dialog ref="dialog"></Dialog>
  </Teleport>
  <Status v-if="loaded" />

</template>

<script setup lang='ts'>
import { ref, onMounted, onUnmounted } from 'vue'

import GameManager from '@/components/3D/GameManager';
import Globals from "@/utils/Globals.js";

import Loading from '@/components/2D/Loading.vue'
import Dialog from '@/components/2D/Dialog.vue';
import Status from '@/components/2D/Status.vue'
import eventBus from '@/utils/EventBus'

const c = ref()
const loaded = ref(false)
const loadingProgress = ref(0)
const dialog = ref<InstanceType<typeof Dialog> | null>(null)

// 监听打开对话框事件
const handleOpenDialog = (title: string) => {
  if (dialog.value) {
    dialog.value.open(title)
  }
}

onMounted(() => {
  // 监听打开对话框事件
  eventBus.on('open-dialog', handleOpenDialog)

  const gameManager = new GameManager(c.value)

  gameManager.init(() => {
    console.log('资源加载完成')
    loaded.value = true
    gameManager.start()
  }, (progress: number) => {
    loadingProgress.value = progress
  })


  let then = 0;
  function render(now:number) {
    // convert to seconds
    Globals.time = now * 0.001;
    // make sure delta time isn't too big.
    Globals.deltaTime = Math.min(Globals.time - then, 1 / 20);
    then = Globals.time;

    gameManager.update()
    requestAnimationFrame(render)
  }

  requestAnimationFrame(render)
})

onUnmounted(() => {
  // 清理事件监听
  eventBus.off('open-dialog', handleOpenDialog)
})

</script>

<style scoped>
#c {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
