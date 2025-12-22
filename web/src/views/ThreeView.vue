<template>
  <canvas id="c" ref="c"></canvas>
  <Loading v-if="!loaded" :progress="loadingProgress" />
</template>

<script setup lang='ts'>
import { ref, onMounted } from 'vue'
import * as THREE from 'three';

import ModelLoader, { type Model } from '@/components/3D/ModelLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createRenderer, resizeRendererToDisplaySize } from '@/components/3D/Renderer.ts'
import scene from '@/components/3D/Scene.ts'
import camera from '@/components/3D/Camera.ts'
import light from '@/components/3D/Light.ts'
import globals from "@/utils/globals.js";

import Loading from '@/components/2D/Loading.vue'

const c = ref()
const loaded = ref(false)
const loadingProgress = ref(0)
// let mixer: THREE.AnimationMixer | null = null

onMounted(async () => {
  await ModelLoader.load("/girl.glb")
  ModelLoader.onLoaded = onModelLoaded
  ModelLoader.onProgress = onModelProgress
  ModelLoader.onError = onModelError

})

const onModelLoaded = async (model: Model) => {
  loaded.value = true
  console.log('加载完成:', model)

  const renderer = await createRenderer({
    antialias: true,
    canvas: c.value
  })

  scene.add(model.gltf.scene)
  // 给场景添加灯光
  scene.add(light)

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.8, 0);
  controls.enablePan = false
  controls.update();


  // renderer.setAnimationLoop(function () {
  //   mixer?.update(globals.deltaTime)
  // });


  let then = 0;
  function render(now: number) {
    // convert to seconds
    globals.time = now * 0.001;
    // make sure delta time isn't too big.
    globals.deltaTime = Math.min(globals.time - then, 1 / 20);
    then = globals.time;

    // console.log(now)
    if (resizeRendererToDisplaySize()) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }
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