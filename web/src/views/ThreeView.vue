<template>
  <canvas id="c" ref="c"></canvas>
  <Loading v-if="!loaded" :progress="loadingProgress" />
  <!-- <Teleport to="body">
    <Dialog ref="dialog"></Dialog>
  </Teleport> -->
  <Status v-if="loaded" />

</template>

<script setup lang='ts'>
import { ref, onMounted } from 'vue'
import * as THREE from "three"

import GameManager from '@/components/3D/GameManager';
import Globals from "@/utils/Globals.js";

import Loading from '@/components/2D/Loading.vue'
// import Dialog from '@/components/2D/Dialog.vue';
import Status from '@/components/2D/Status.vue'

const c = ref()
const loaded = ref(false)
const loadingProgress = ref(0)
// const dialog = ref()
const baseUrl = import.meta.env.BASE_URL

onMounted(() => {

  const gameManager = new GameManager(c.value)

  gameManager.init(() => {
    console.log('资源加载完成')
    loaded.value = true
    gameManager.start()
  }, (progress: number) => {
    loadingProgress.value = progress
  })


  function render() {
    gameManager.update()
    requestAnimationFrame(render)
  }

  requestAnimationFrame(render)
})



const onModelLoaded = async (model: Model) => {




  // 加载角色模型
  // loadAvatarModel(avatarPosition)

  // 创建人物
  // const gameObject = GameObjectManager.createGameObject(scene, 'avatar');
  // Globals.avatar = gameObject.addComponent(Avatar, model);





  let then = 0;
  function render(now: number) {

    // convert to seconds
    Globals.time = now * 0.001;
    // make sure delta time isn't too big.
    Globals.deltaTime = Math.min(Globals.time - then, 1 / 20);
    then = Globals.time;
  }
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
