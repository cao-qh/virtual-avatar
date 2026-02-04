<template>
  <canvas id="c" ref="c" @mousemove.stop="handleMouseMove" @touchstart.passive="handleTouchStart"
    @touchend.passive="handleRaycastIntersect" @click.passive="handleRaycastIntersect"></canvas>
  <Loading v-if="!loaded" :progress="loadingProgress" />
  <Teleport to="body">
    <Dialog ref="dialog"></Dialog>
  </Teleport>
  <Status v-if="loaded" />

</template>

<script setup lang='ts'>
import { ref, onMounted } from 'vue'
import * as THREE from "three"
import { gsap } from 'gsap'

import GameManager from '@/components/3D/GameManager';
import Avatar from '@/components/3D/Avatar'

// import light from '@/components/3D/Light.ts'
import Globals from "@/utils/Globals.js";


import Loading from '@/components/2D/Loading.vue'
import Dialog from '@/components/2D/Dialog.vue';
import Status from '@/components/2D/Status.vue'

const c = ref()
const loaded = ref(false)
const loadingProgress = ref(0)
const dialog = ref()
const baseUrl = import.meta.env.BASE_URL

onMounted(() => {

  // 创建纹理管理器并预加载所有纹理
  // textureManager = new TextureManager()

  // 设置纹理加载进度回调
  // textureManager.setProgressCallback((progress: number) => {
  //   textureProgress.value = progress
  //   console.log(`纹理加载进度: ${(progress * 100).toFixed(1)}%`)
  // })

  // console.log('开始预加载纹理...')
  // await textureManager.preloadTextures(textures)
  // console.log('纹理预加载完成')


  // onModelLoaded(model)

  const gameManager = new GameManager(c.value)

  gameManager.init(() => {
    console.log('资源加载完成')
    loaded.value = true
    gameManager.start()
  }, (progress: number) => {
    loadingProgress.value = progress
  })


  function render(){
    gameManager.update()
    requestAnimationFrame(render)
  }

  requestAnimationFrame(render)
})




const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let currentIntersects: THREE.Intersection[] = []
let currentHoveredObject: THREE.Object3D | null = null;



const socialLinks = {
  Github: 'https://github.com/',
  Blender: 'https://blender.org/',
}

const introAnimaObj: Record<string, THREE.Object3D> = {}
// let textureManager: TextureManager


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


const onModelLoaded = async (model: Model) => {



  // 加载纹理贴图
  model.gltf.scene.traverse((child) => {
    // console.log(child.name)


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


    }

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
      // console.log('找到avatar_position:', child.position, child.rotation, child.scale)
    }
  })

  // 添加入场动画
  playIntroAnimation()

  // 加载角色模型
  // loadAvatarModel(avatarPosition)

  // 创建人物
  // const gameObject = GameObjectManager.createGameObject(scene, 'avatar');
  // Globals.avatar = gameObject.addComponent(Avatar, model);

  


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
      }, "-=0.6").to(introAnimaObj.ButtenAbout.scale, {
        x: 1,
        y: 1,
        z: 1,
      }, "-=0.6").to(introAnimaObj.ButtenContact.scale, {
        x: 1,
        y: 1,
        z: 1,
      }, "-=0.6")
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
      }, "-=0.6")
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

    requestAnimationFrame(render)
  }

  requestAnimationFrame(render)

  // 关闭loading
  // loaded.value = true
  // console.log('加载完成:', model)
}

/**
 * 加载角色模型
 */
const loadAvatarModel = async (avatarPosition: THREE.Object3D | null) => {
  try {
    console.log('开始加载角色模型...')

    // 加载角色模型
    const avatarModel = await modelLoader.load(
      baseUrl + "/models/avatar.glb"
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
  // const avatarTexture = textureManager.getTexture('Avatar')
  // if (!avatarTexture) {
  //   console.error('角色纹理未加载')
  //   return
  // }

  // 遍历角色模型的所有网格
  avatarModel.gltf.scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      console.log(`处理角色网格: ${child.name}`)

      // 创建材质并应用烘焙贴图
      const material = new THREE.MeshBasicMaterial({
        // map: avatarTexture,
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


</script>

<style scoped>
#c {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
