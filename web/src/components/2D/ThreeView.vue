<template>
  <canvas id="c" ref="c"></canvas>
</template>

<script setup lang='ts'>
import { ref, onMounted } from 'vue'
import * as THREE from 'three';

import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createRenderer, resizeRendererToDisplaySize } from '@/components/3D/Renderer.ts'
import scene from '@/components/3D/Scene.ts'
import camera from '@/components/3D/Camera.ts'
import light from '@/components/3D/Light.ts'
import globals from "@/utils/globals.js";

const c = ref()
let mixer: THREE.AnimationMixer | null = null

onMounted(async () => {
  const renderer = await createRenderer({
    antialias: true,
    canvas: c.value
  })

  // 给场景添加灯光
  scene.add(light)

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.8, 0);
  controls.enablePan = false
  controls.update();

  const gltfLoader = new GLTFLoader();
  // gltfLoader.load("/shijianzhou_donghua.glb", (gltf: GLTF) => {
  gltfLoader.load("/girl.glb", (gltf: GLTF) => {
    const root = gltf.scene;
    console.log("gltf:", gltf)
    scene.add(root);

    mixer = new THREE.AnimationMixer(root);
    const clip = gltf.animations[0]
    if (clip) {
      mixer.clipAction(clip).play();
    }
  });

  /*
    const boxWidth = 3;
    const boxDepth = 3;
    const geometry = new THREE.PlaneGeometry(boxWidth, boxDepth);
    const material = new THREE.MeshPhongMaterial({color: 0x44aa88});
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2;
    scene.add(plane);
    */

  renderer.setAnimationLoop(function () {
    mixer?.update(globals.deltaTime)
  });


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
})
</script>

<style scoped>
#c {
  width: 100%;
  height: 100%;
  display: block;
}
</style>