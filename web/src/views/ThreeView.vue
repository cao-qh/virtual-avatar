<template>
  <canvas id="c" ref="c" @mousemove.stop="handleMouseMove" @touchstart.passive="handleTouchStart"
    @touchend.passive="handleRaycastIntersect" @click.passive="handleRaycastIntersect"></canvas>
  <Loading v-if="!loaded" :progress="loadingProgress" />
  <Teleport to="body">
    <Dialog ref="dialog"></Dialog>
  </Teleport>
</template>

<script setup lang='ts'>
import { ref, onMounted } from 'vue'
import * as THREE from "three"
import { gsap } from 'gsap'

import ModelLoader, { type Model } from '@/components/3D/ModelLoader';
import GameObjectManager from '@/components/3D/GameObjectManager';
// import Avatar from '@/components/3D/Avatar'
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OrbitControls } from '@/utils/OrbitControls.js';
import { createRenderer, resizeRendererToDisplaySize } from '@/components/3D/Renderer.ts'
import scene from '@/components/3D/Scene.ts'
import camera from '@/components/3D/Camera.ts'
// import light from '@/components/3D/Light.ts'
import Globals from "@/utils/Globals.js";

import Loading from '@/components/2D/Loading.vue'
import Dialog from '@/components/2D/Dialog.vue';

const c = ref()
const loaded = ref(false)
const loadingProgress = ref(0)
const dialog = ref()
const baseUrl= import.meta.env.BASE_URL

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let currentIntersects: THREE.Intersection[] = []
let currentHoveredObject: THREE.Object3D | null = null;

const socialLinks = {
  Github: 'https://github.com/',
  Blender: 'https://blender.org/',
}

const handleMouseMove = (event: any) => {
  // console.log('鼠标坐标：', event.clientX, event.clientY);
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
};

const handleTouchStart = (event: any) => {
  // console.log('触摸坐标：', event.touches[0].clientX, event.touches[0].clientY);
  pointer.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;
}

const handleRaycastIntersect = () => {
  if (currentIntersects.length > 0) {
    const object3d = currentIntersects[0]?.object as THREE.Object3D;

    Object.entries(socialLinks).forEach(([name, url]) => {
      if (object3d.name.includes(name)) {
        window.open(url, '_blank')
      }
    });

    if (object3d.name.includes('ButtenIntro')) {
      console.log('点击了介绍')
      dialog.value.open('介绍')
    } else if (
      object3d.name.includes('ButtenAbout')
    ) {
      dialog.value.open('关于')
    } else if (object3d.name.includes('ButtenContact')) {
      dialog.value.open('联系')
    }
  }
};

onMounted(async () => {
  try {
    const model = await ModelLoader.load(baseUrl+"/models/home.glb", onModelProgress, {
      Wrapper: baseUrl+'/textures/room/Wrapper Baking.webp',
      Wall: baseUrl+'/textures/room/Wall Baking.webp',
      TableCabinet: baseUrl+'/textures/room/Table Cabinet Baking.webp',
      OnWall: baseUrl+'/textures/room/On Wall Baking.webp',
      GroundObject: baseUrl+'/textures/room/Ground Obj Baking.webp',
    })
    onModelLoaded(model)
  } catch (err) {
    console.error('模型加载失败:', err)
  }
})

const onModelLoaded = async (model: Model) => {
  // 关闭loading
  loaded.value = true
  console.log('加载完成:', model)

  const renderer = createRenderer({
    antialias: true,
    canvas: c.value,
  })


  // 给场景添加灯光
  // scene.add(light)

  scene.add(model.gltf.scene)

  // 创建人物
  // const gameObject = GameObjectManager.createGameObject(scene, 'avatar');
  // Globals.avatar = gameObject.addComponent(Avatar, model);

  // const geometry = new THREE.BoxGeometry(1, 1, 1);
  // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  // const cube = new THREE.Mesh(geometry, material);
  // scene.add(cube);

  const controls = new OrbitControls(camera, renderer.domElement);
  // controls.maxTargetRadius =0.5
  controls.minDistance = 5;
  controls.maxDistance = 20;
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = Math.PI / 2;
  controls.minAzimuthAngle =0 ;
  controls.maxAzimuthAngle = Math.PI /2;
  controls.target.set(0, 3, 0);
  // controls.enablePan = false
  controls.enableDamping = true


  function playHoverAnimation(object: THREE.Object3D | null, isHovering: boolean) {

   

    if (object == null) return;
     
    gsap.killTweensOf(object.scale);
    gsap.killTweensOf(object.rotation);
    gsap.killTweensOf(object.position);

    if (isHovering) {
      gsap.to(object.scale, {
        x: object.userData.initialScale.x * 1.2,
        y: object.userData.initialScale.y * 1.2,
        z: object.userData.initialScale.z * 1.2,
        duration: 0.5,
        ease: "bounce.out(1.8)"
      })

      gsap.to(object.rotation, {
        x: object.userData.initialRotation.x + Math.PI / 8,
        duration: 0.5,
        ease: "bounce.out(1.8)",
      })
    } else {
      gsap.to(object.scale, {
        x: object.userData.initialScale.x,
        y: object.userData.initialScale.y,
        z: object.userData.initialScale.z,
        duration: 0.3,
        ease: "bounce.out(1.8)"
      })

      gsap.to(object.rotation, {
        x: object.userData.initialRotation.x,
        duration: 0.3,
        ease: "bounce.out(1.8)",
      })
    }

  }


  let then = 0;
  function render(now: number) {

    // convert to seconds
    Globals.time = now * 0.001;
    // make sure delta time isn't too big.
    Globals.deltaTime = Math.min(Globals.time - then, 1 / 20);
    then = Globals.time;

    //console.log("camer pos:",camera.position)
    //console.log("controls tar:",controls.target)


    if (resizeRendererToDisplaySize()) {
      const canvas = renderer.domElement;
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
    }

    GameObjectManager.update()
    controls.update();

    // Animate Fans
    Globals.fans.forEach(fan => {
      fan.rotation.z += 0.01
    })

    // Raycaster
    raycaster.setFromCamera(pointer, camera);
    currentIntersects = raycaster.intersectObjects(Globals.raycasterObjects);
    for (let i = 0; i < currentIntersects.length; i++) {
      // const intersect = currentIntersects[i];
      // if (intersect) {
      //   const mesh = intersect.object as THREE.Mesh;
      //   const material = mesh.material as THREE.MeshPhysicalMaterial;
      //   material.color.set(0xff0000);
      // }
    }

    if (currentIntersects.length > 0) {
      const object3d = currentIntersects[0]?.object as THREE.Object3D;

      if (object3d.name.includes('hover')) {
        if (object3d !== currentHoveredObject) {

          if (currentHoveredObject) {
            playHoverAnimation(currentHoveredObject, false)
          }

          playHoverAnimation(object3d, true)
          currentHoveredObject = object3d;
        }
      }

      if (object3d.name.includes('pointer')) {
        document.body.style.cursor = 'pointer';
      } else {
        document.body.style.cursor = 'default';
      }
    } else {
      if (currentHoveredObject) {
        playHoverAnimation(currentHoveredObject, false)
      }
      currentHoveredObject = null;
      document.body.style.cursor = 'default';
    }

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