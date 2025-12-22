<template>
  <canvas id="c" ref="c"></canvas>
  <Loading v-if="!loaded" :progress="loadingProgress" />
</template>

<script setup lang='ts'>
import { ref, onMounted, onUnmounted } from 'vue'

import ModelLoader, { type Model } from '@/components/3D/ModelLoader';
import GameObjectManager from '@/components/3D/GameObjectManager';
import Player from '@/components/3D/Player.ts'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createRenderer, resizeRendererToDisplaySize } from '@/components/3D/Renderer.ts'
import scene from '@/components/3D/Scene.ts'
import camera from '@/components/3D/Camera.ts'
import light from '@/components/3D/Light.ts'
import Globals from "@/utils/Globals.js";
import WebSocketManager from '@/utils/WebSocketManager';
import Microphone from '@/utils/Microphone';

import Loading from '@/components/2D/Loading.vue'

const c = ref()
const loaded = ref(false)
const loadingProgress = ref(0)

onMounted(async () => {
  await ModelLoader.load("/girl.glb")
  ModelLoader.onLoaded = onModelLoaded
  ModelLoader.onProgress = onModelProgress
  ModelLoader.onError = onModelError

})

onUnmounted(() => {
  WebSocketManager.close()
  Microphone.stop()
})

const onModelLoaded = async (model: Model) => {
  // 关闭loading
  loaded.value = true
  console.log('加载完成:', model)

  const renderer = await createRenderer({
    antialias: true,
    canvas: c.value
  })

  // 给场景添加灯光
  scene.add(light)

  // 创建人物
  const gameObject = GameObjectManager.createGameObject(scene, 'player');
  Globals.player = gameObject.addComponent(Player, model);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.8, 0);
  controls.enablePan = false
  controls.update();

  // 创建webSocket连接
  await WebSocketManager.waitForOpen();
  WebSocketManager.onAudioData = (blob) => {
    Globals.player?.talk(blob)
  }
  // 创建麦克风
  Microphone.init()
  Microphone.onAudioData = (blob) => {
    WebSocketManager.sendAudioData(blob)
  }


  let then = 0;
  function render(now: number) {
    // convert to seconds
    Globals.time = now * 0.001;
    // make sure delta time isn't too big.
    Globals.deltaTime = Math.min(Globals.time - then, 1 / 20);
    then = Globals.time;

    // console.log(now)
    if (resizeRendererToDisplaySize()) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    GameObjectManager.update()
    Microphone.update()

    renderer.render(scene, camera)
    requestAnimationFrame(render)
  }

  requestAnimationFrame(render)
}
const onModelProgress = (progress: number) => {
  loadingProgress.value = progress
}
const onModelError = (error: any) => {
  console.error('模型加载失败:', error)
}

</script>

<style scoped>
#c {
  width: 100%;
  height: 100%;
  display: block;
}
</style>