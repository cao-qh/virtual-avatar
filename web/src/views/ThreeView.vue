<template>
  <canvas id="c" ref="c" @mousemove.stop="handleMouseMove" @touchstart.passive="handleTouchStart"
    @touchend.passive="handleRaycastIntersect" @click.passive="handleRaycastIntersect"></canvas>
  <Loading v-if="!loaded" :progress="loadingProgress" />
  <Teleport to="body">
    <Dialog ref="dialog"></Dialog>
  </Teleport>
  
  <!-- 语音状态指示器 -->
  <div v-if="loaded" class="voice-status-indicator">
    <div class="status-item">
      <span class="status-label">麦克风:</span>
      <span class="status-value" :class="microphoneStatusClass">{{ microphoneStatusText }}</span>
    </div>
    <div class="status-item">
      <span class="status-label">服务器:</span>
      <span class="status-value" :class="serverStatusClass">{{ serverStatusText }}</span>
    </div>
    <div class="status-item">
      <span class="status-label">角色状态:</span>
      <span class="status-value" :class="avatarStatusClass">{{ avatarStatusText }}</span>
    </div>
    <div v-if="isRecording" class="recording-indicator">
      <div class="pulse"></div>
      <span>正在录音...</span>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { ref, onMounted, computed, watch } from 'vue'
import * as THREE from "three"
import { gsap } from 'gsap'

import ModelLoader, { type Model } from '@/components/3D/ModelLoader';
import GameObjectManager from '@/components/3D/GameObjectManager';
import Avatar from '@/components/3D/Avatar'
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OrbitControls } from '@/utils/OrbitControls.js';
import { createRenderer, resizeRendererToDisplaySize } from '@/components/3D/Renderer.ts'
import scene, { environmentMap } from '@/components/3D/Scene.ts'
import camera from '@/components/3D/Camera.ts'
// import light from '@/components/3D/Light.ts'
import Globals from "@/utils/Globals.js";
import { TextureManager } from '@/components/3D/TextureManager.ts';

import Loading from '@/components/2D/Loading.vue'
import Dialog from '@/components/2D/Dialog.vue';

const c = ref()
const loaded = ref(false)
const loadingProgress = ref(0)
const dialog = ref()
const baseUrl = import.meta.env.BASE_URL

// 语音状态管理
const microphoneStatus = ref<'idle' | 'requesting' | 'granted' | 'denied'>('idle')
const serverStatus = ref<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
const avatarStatus = ref<'idle' | 'talking' | 'listening'>('idle')
const isRecording = ref(false)

// 进度管理
const textureProgress = ref(0)  // 纹理加载进度 0-1
const modelProgress = ref(0)    // 模型加载进度 0-1

// 计算状态文本和类
const microphoneStatusText = computed(() => {
  switch (microphoneStatus.value) {
    case 'idle': return '待机'
    case 'requesting': return '请求中...'
    case 'granted': return '已授权'
    case 'denied': return '已拒绝'
    default: return '未知'
  }
})

const microphoneStatusClass = computed(() => {
  switch (microphoneStatus.value) {
    case 'granted': return 'status-granted'
    case 'denied': return 'status-denied'
    case 'requesting': return 'status-requesting'
    default: return 'status-idle'
  }
})

const serverStatusText = computed(() => {
  switch (serverStatus.value) {
    case 'disconnected': return '未连接'
    case 'connecting': return '连接中...'
    case 'connected': return '已连接'
    case 'error': return '连接错误'
    default: return '未知'
  }
})

const serverStatusClass = computed(() => {
  switch (serverStatus.value) {
    case 'connected': return 'status-connected'
    case 'error': return 'status-error'
    case 'connecting': return 'status-connecting'
    default: return 'status-disconnected'
  }
})

const avatarStatusText = computed(() => {
  switch (avatarStatus.value) {
    case 'idle': return '待机'
    case 'talking': return '说话中'
    case 'listening': return '聆听中'
    default: return '未知'
  }
})

const avatarStatusClass = computed(() => {
  switch (avatarStatus.value) {
    case 'talking': return 'status-talking'
    case 'listening': return 'status-listening'
    default: return 'status-idle'
  }
})

// 计算总进度：纹理占40%，模型占60%
const totalProgress = computed(() => {
  return textureProgress.value * 0.4 + modelProgress.value * 0.6
})

// 监听总进度变化，更新 loadingProgress
watch(totalProgress, (newProgress) => {
  loadingProgress.value = newProgress
})

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let currentIntersects: THREE.Intersection[] = []
let currentHoveredObject: THREE.Object3D | null = null;

const textures: Record<string, string> = {
  Wrapper: baseUrl + '/textures/room/Wrapper Baking.webp',
  Wall: baseUrl + '/textures/room/Wall Baking.webp',
  TableCabinet: baseUrl + '/textures/room/Table Cabinet Baking.webp',
  OnWall: baseUrl + '/textures/room/On Wall Baking.webp',
  GroundObject: baseUrl + '/textures/room/Ground Obj Baking.webp',
  Photo: baseUrl + '/textures/room/Photo.webp',
  Avatar: baseUrl + '/textures/avatar/Avatar_Baking.webp',
}

const socialLinks = {
  Github: 'https://github.com/',
  Blender: 'https://blender.org/',
}

const introAnimaObj: Record<string, THREE.Object3D> = {}
let textureManager: TextureManager


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
    // 创建纹理管理器并预加载所有纹理
    textureManager = new TextureManager()
    
    // 设置纹理加载进度回调
    textureManager.setProgressCallback((progress: number) => {
      textureProgress.value = progress
      console.log(`纹理加载进度: ${(progress * 100).toFixed(1)}%`)
    })
    
    // console.log('开始预加载纹理...')
    await textureManager.preloadTextures(textures)
    // console.log('纹理预加载完成')
    
    // 加载模型
    const model = await ModelLoader.load(baseUrl + "/models/home.glb", onModelProgress)
    onModelLoaded(model)
  } catch (err) {
    console.error('加载失败:', err)
  }
})

const onModelLoaded = async (model: Model) => {
  
  const videoElement = document.createElement("video")
  videoElement.src = baseUrl + "/videos/bizhi.mp4"
  videoElement.loop = true
  videoElement.muted = true
  videoElement.playsInline = true
  videoElement.autoplay = true
  videoElement.play()
  const videoTexture = new THREE.VideoTexture(videoElement)
  videoTexture.colorSpace = THREE.SRGBColorSpace
  videoTexture.flipY = false

  // 加载纹理贴图
  model.gltf.scene.traverse((child) => {
      console.log(child.name)


    if (child.name.includes("hover")) {
      child.userData.initialScale = new THREE.Vector3().copy(
        child.scale,
      )
      child.userData.initialPosition = new THREE.Vector3().copy(
        child.position,
      )
      child.userData.initialRotation = new THREE.Euler().copy(
        child.rotation,
      )
    }

    if (child instanceof THREE.Mesh) {

      if (child.name.includes("Wood01")) {
        introAnimaObj['Wood01'] = child
        child.scale.set(0, 1, 0)
      }
      if (child.name.includes("Wood02")) {
        introAnimaObj['Wood02'] = child
        child.scale.set(0, 0, 0)
      }
      if (child.name.includes("ButtenAbout")) {
        introAnimaObj['ButtenAbout'] = child
        child.scale.set(0, 0, 0)
      }
      if (child.name.includes("ButtenContact")) {
        introAnimaObj['ButtenContact'] = child
        child.scale.set(0, 0, 0)
      }
      if (child.name.includes("ButtenIntro")) {
        introAnimaObj['ButtenIntro'] = child
        child.scale.set(0, 0, 0)
      }
      if (child.name.includes("MilkTea")) {
        introAnimaObj['MilkTea'] = child
        child.scale.set(0, 0, 0)
      }
      if (child.name.includes("Github")) {
        introAnimaObj['Github'] = child
        child.scale.set(0, 0, 0)
      }
      if (child.name.includes("Blender")) {
        introAnimaObj['Blender'] = child
        child.scale.set(0, 0, 0)
      }

      if (child.name.includes("Water")) {
        child.material = new THREE.MeshBasicMaterial({
          color: 0x558bc8,
          transparent: true,
          opacity: 0.66,
          depthWrite: false,
        })
      } else if (child.name.includes("Glass")) {
        child.material = new THREE.MeshPhysicalMaterial({
          transmission: 1,
          opacity: 1,
          metalness: 0,
          roughness: 0,
          ior: 1.5,
          thickness: 0.01,
          specularIntensity: 1,
          envMap: environmentMap,
          envMapIntensity: 1,
          depthWrite: false,
        })
      } else if (child.name.includes("Screen")) {
        child.material = new THREE.MeshBasicMaterial({
          map: videoTexture,
        })
      } else {
        Object.keys(textures).forEach((key) => {
          //console.log('key:',key)
          if (child.name.includes(key)) {
            try {
              const material = textureManager.createMaterial(key)
              child.material = material
              // console.log(`${child.name} 已创建纹理材质`)

              if (child.name.includes("Fan")) {
                Globals.fans.push(child)
              }
              if (child.name.includes("raycast")) {
                Globals.raycasterObjects.push(child)
              }

              if (child.material.map) {
                child.material.map.minFilter = THREE.LinearFilter
              }
            } catch (error) {
              console.error(`为 ${child.name} 创建材质失败:`, error)
            }
          }
        })
      }
    }

  })


  const renderer = createRenderer({
    antialias: true,
    canvas: c.value,
  })


  // 给场景添加灯光
  // scene.add(light)

   scene.add(model.gltf.scene)
  //  console.log('已经加载了模型')

  // 查找avatar_position空物体
  let avatarPosition: THREE.Object3D | null = null
  model.gltf.scene.traverse((child) => {
    if (child.name === 'avatar_position') {
      avatarPosition = child
      console.log('找到avatar_position:', child.position, child.rotation, child.scale)
    }
  })

  // 添加入场动画
  playIntroAnimation()

  // 加载角色模型
  loadAvatarModel(avatarPosition)

  // 创建人物
  // const gameObject = GameObjectManager.createGameObject(scene, 'avatar');
  // Globals.avatar = gameObject.addComponent(Avatar, model);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.minDistance = 5;
  controls.maxDistance = 20;
  controls.minPolarAngle = 0;
  controls.maxPolarAngle = Math.PI / 2;
  controls.minAzimuthAngle = 0;
  controls.maxAzimuthAngle = Math.PI / 2;
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

  function playIntroAnimation() {
    const t1 = gsap.timeline({
      defaults: {
        duration: 0.8,
        ease: "back.out(1.8)"
      }
    })


    if (introAnimaObj.Wood01
      && introAnimaObj.Wood02
      && introAnimaObj.ButtenAbout
      && introAnimaObj.ButtenContact
      && introAnimaObj.ButtenIntro) {
      t1.to(introAnimaObj.Wood01.scale, {
        x: 1,
        z: 1,
      }).to(introAnimaObj.Wood02.scale, {
        x: 1,
        y: 1,
        z: 1,
      }, "-=0.6").to(introAnimaObj.ButtenIntro.scale, {
        x: 1,
        y: 1,
        z: 1,
      },"-=0.6").to(introAnimaObj.ButtenAbout.scale, {
        x: 1,
        y: 1,
        z: 1,
      },"-=0.6").to(introAnimaObj.ButtenContact.scale, {
        x: 1,
        y: 1,
        z: 1,
      },"-=0.6")
    }

    const t2 = gsap.timeline({
      defaults: {
        duration: 0.8,
        ease: "back.out(1.8)"
      }
    })

    t2.timeScale(0.8)


    if (introAnimaObj.MilkTea
      && introAnimaObj.Github
      && introAnimaObj.Blender
     ) {
      t1.to(introAnimaObj.MilkTea.scale, {
        x: 1,
        y: 1,
        z: 1,
      }).to(introAnimaObj.Github.scale, {
        x: 1,
        y: 1,
        z: 1,
      }, "-=0.6").to(introAnimaObj.Blender.scale, {
        x: 1,
        y: 1,
        z: 1,
      },"-=0.6")
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

  // 关闭loading
  loaded.value = true
  console.log('加载完成:', model)
}

/**
 * 加载角色模型
 */
const loadAvatarModel = async (avatarPosition: THREE.Object3D | null) => {
  try {
    console.log('开始加载角色模型...')
    
    // 加载角色模型
    const avatarModel = await ModelLoader.load(
      baseUrl + "/models/avatar.glb",
      (progress) => {
        console.log(`角色模型加载进度: ${(progress * 100).toFixed(1)}%`)
      }
    )
    
    console.log('角色模型加载完成，开始应用材质...', avatarModel)
    
    // 应用烘焙贴图到角色
    applyAvatarTextures(avatarModel)
    
    // 创建Avatar游戏对象
    const avatarGameObject = GameObjectManager.createGameObject(scene, 'avatar')
    Globals.avatar = avatarGameObject.addComponent(Avatar, avatarModel)
    
    // 放置角色到指定位置
    if (avatarPosition) {
      avatarGameObject.transform.position.copy(avatarPosition.position)
      avatarGameObject.transform.rotation.copy(avatarPosition.rotation)
      console.log('角色已放置在avatar_position位置')
    } else {
      // 如果没有找到avatar_position，使用默认位置
      avatarGameObject.transform.position.set(0, 0, 0)
      console.log('未找到avatar_position，使用默认位置(0,0,0)')
    }
    
    console.log('Avatar组件创建完成')
    
  } catch (error) {
    console.error('角色加载失败:', error)
  }
}

/**
 * 应用烘焙贴图材质到角色模型
 */
const applyAvatarTextures = (avatarModel: Model) => {
  // 获取角色纹理
  const avatarTexture = textureManager.getTexture('Avatar')
  if (!avatarTexture) {
    console.error('角色纹理未加载')
    return
  }
  
  // 遍历角色模型的所有网格
  avatarModel.gltf.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      console.log(`处理角色网格: ${child.name}`)
      
      // 创建材质并应用烘焙贴图
      const material = new THREE.MeshBasicMaterial({
        map: avatarTexture,
        //side: THREE.DoubleSide, // 确保两面都渲染
      })
      
      child.material = material
      
      // 特殊处理：眼镜材质
      if (child.name.includes('Glass') || child.name.includes('glasses')) {
        console.log(`检测到眼镜材质: ${child.name}`)
        child.material = new THREE.MeshPhysicalMaterial({
          transmission: 1,
          opacity: 1,
          metalness: 0,
          roughness: 0,
          ior: 1.5,
          thickness: 0.01,
          specularIntensity: 1,
          envMap: environmentMap,
          envMapIntensity: 1,
          depthWrite: false,
        })
      }
    }
  })
}

const onModelProgress = (progress: number) => {
  modelProgress.value = progress
  console.log(`模型加载进度: ${(progress * 100).toFixed(1)}%`)
}

</script>

<style scoped>
#c {
  width: 100%;
  height: 100%;
  display: block;
}

/* 语音状态指示器样式 */
.voice-status-indicator {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 15px;
  border-radius: 10px;
  font-family: Arial, sans-serif;
  font-size: 14px;
  z-index: 1000;
  min-width: 200px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.status-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  align-items: center;
}

.status-item:last-child {
  margin-bottom: 0;
}

.status-label {
  font-weight: bold;
  margin-right: 10px;
  color: #ccc;
}

.status-value {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

/* 状态颜色 */
.status-granted, .status-connected {
  background-color: #4CAF50;
  color: white;
}

.status-denied, .status-error {
  background-color: #f44336;
  color: white;
}

.status-requesting, .status-connecting {
  background-color: #FF9800;
  color: white;
}

.status-idle, .status-disconnected {
  background-color: #9E9E9E;
  color: white;
}

.status-talking {
  background-color: #2196F3;
  color: white;
  animation: pulse 1.5s infinite;
}

.status-listening {
  background-color: #FF9800;
  color: white;
  animation: pulse 1s infinite;
}

/* 录音指示器 */
.recording-indicator {
  display: flex;
  align-items: center;
  margin-top: 10px;
  padding: 8px;
  background: rgba(244, 67, 54, 0.2);
  border-radius: 6px;
  border: 1px solid rgba(244, 67, 54, 0.3);
}

.recording-indicator span {
  margin-left: 8px;
  font-weight: bold;
  color: #ff6b6b;
}

.pulse {
  width: 12px;
  height: 12px;
  background-color: #f44336;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0.7;
  }
}
</style>
