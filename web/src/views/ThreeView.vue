<template>
  <canvas id="c" ref="c"></canvas>
  <Loading v-if="!loaded" :progress="loadingProgress" />
</template>

<script setup lang='ts'>
import { ref, onMounted } from 'vue'

import ModelLoader, { type Model } from '@/components/3D/ModelLoader';
import GameObjectManager from '@/components/3D/GameObjectManager';
import Avatar from '@/components/3D/Avatar'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createRenderer, resizeRendererToDisplaySize } from '@/components/3D/Renderer.ts'
import scene from '@/components/3D/Scene.ts'
import camera from '@/components/3D/Camera.ts'
import light from '@/components/3D/Light.ts'
import Globals from "@/utils/Globals.js";

import Loading from '@/components/2D/Loading.vue'

const c = ref()
const loaded = ref(false)
const loadingProgress = ref(0)

onMounted(async () => {
  try {
    const model = await ModelLoader.load("/girl.glb", onModelProgress)
    onModelLoaded(model)
  } catch (err) {
    console.error('模型加载失败:', err)
  }
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
  const gameObject = GameObjectManager.createGameObject(scene, 'avatar');
  Globals.avatar = gameObject.addComponent(Avatar, model);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.8, 0);
  controls.enablePan = false
  controls.update();

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

    renderer.render(scene, camera)
    requestAnimationFrame(render)
  }

  requestAnimationFrame(render)
}
const onModelProgress = (progress: number) => {
  loadingProgress.value = progress
}

</script>

<style scoped>
#c {
  width: 100%;
  height: 100%;
  display: block;
}
</style>