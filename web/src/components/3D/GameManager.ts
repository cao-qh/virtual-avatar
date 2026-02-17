import * as THREE from "three"

import ModelManager from "@/components/3D/ModelManager"
import TextureManager from "@/components/3D/TextureManager.ts"

import {
  createRenderer,
  resizeRendererToDisplaySize,
} from "@/components/3D/Renderer.ts"
import SceneManager from "@/components/3D/SceneManager.ts"
import CameraManager from "@/components/3D/CameraManager"
import GameObjectManager from "@/components/3D/GameObjectManager"
import RaycasterManager from "@/components/3D/RaycasterManager.ts"
import Home from "@/components/3D/Home.ts"
import Avatar from '@/components/3D/Avatar'


// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OrbitControls } from "@/utils/OrbitControls.js"

import textureConfig from "@/Config/textureConfig.ts"

const baseUrl = import.meta.env.BASE_URL

const modles: Record<string, string> = {
  Home: baseUrl + "models/home.glb",
  Avatar: baseUrl + "models/avatar.glb",
}

const cubeTexturePath: Array<string> = [
  "px.webp",
  "nx.webp",
  "py.webp",
  "ny.webp",
  "pz.webp",
  "nz.webp",
]

class GameManager {
  private loadingManager: THREE.LoadingManager
  private modelManager: ModelManager
  private textureManager: TextureManager
  private canvas: HTMLCanvasElement
  private renderer: THREE.WebGLRenderer
  private sceneManager: SceneManager
  private cameraManager: CameraManager
  private gameObjectManager: GameObjectManager
  private raycasterManager : RaycasterManager
  private controls: OrbitControls
  private resourcesLoaded: boolean = false

  constructor(c: HTMLCanvasElement) {
    this.loadingManager = new THREE.LoadingManager()
    this.modelManager = new ModelManager(this.loadingManager)
    this.textureManager = new TextureManager(this.loadingManager)

    this.canvas = c
    this.renderer = createRenderer({
      canvas: this.canvas,
      antialias: true,
    })
    this.sceneManager = new SceneManager(
      this.loadingManager,
      baseUrl + "textures/skybox/",
    )
    this.cameraManager = new CameraManager()
    this.gameObjectManager = new GameObjectManager()
    this.raycasterManager = new RaycasterManager(this.cameraManager.getCamera(),c)
    this.controls = new OrbitControls(this.cameraManager.getCamera(), this.canvas)
  }

  async init(onLoad: () => void, onProgress?: (progress: number) => void): Promise<void> {
    // 设置进度回调（可选）
    if (onProgress) {
      this.loadingManager.onProgress = (_, itemsLoaded, itemsTotal) => {
        onProgress(itemsLoaded / itemsTotal)
      }
    }

    try {
      // 按顺序加载所有资源，确保所有资源都加载完成
      await this.textureManager.load(textureConfig)
      await this.modelManager.loadMore(modles)
      
      // 使用异步加载环境贴图
      await this.sceneManager.loadEnvironmentTexture(cubeTexturePath)
      
      this.resourcesLoaded = true
      onLoad()
      
    } catch (error) {
      console.error('GameManager: 资源加载失败:', error)
      throw new Error(`资源加载失败: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  start() {
    if (!this.resourcesLoaded) {
      console.error('GameManager: 错误 - 在资源加载完成前调用了start()')
      throw new Error('资源尚未加载完成，请先等待init()完成')
    }
    
    this.cameraManager.setCameraPosition(
      12.432661101448488,
      5.11628329283235,
      7.516685478272871,
    )

    this.controls.minDistance = 5
    this.controls.maxDistance = 20
    this.controls.minPolarAngle = 0
    this.controls.maxPolarAngle = Math.PI / 2
    this.controls.minAzimuthAngle = 0
    this.controls.maxAzimuthAngle = Math.PI / 2
    this.controls.target.set(0, 3, 0)
    // controls.enablePan = false
    this.controls.enableDamping = true

    // 检查资源是否可用
    const homeModel = this.modelManager.getModel('Home')
    const homeTexture = this.textureManager.getTexture('Home')
    const avatarModel = this.modelManager.getModel('Avatar')
    const avatarTexture = this.textureManager.getTexture('Avatar')
    const environmentMap = this.sceneManager.getEnvironmentMap()

    if (!homeModel || !homeTexture) {
      console.error('GameManager: Home模型或纹理未加载')
      throw new Error('Home资源未加载完成')
    }

    if (!avatarModel || !avatarTexture) {
      console.error('GameManager: Avatar模型或纹理未加载')
      throw new Error('Avatar资源未加载完成')
    }

    if (!environmentMap) {
      console.warn('GameManager: 环境贴图未加载，但将继续')
    }

    // 创建home
    const homeObject = this.gameObjectManager.createGameObject(
      this.sceneManager.getScene(),
      'Home',  // 使用字符串'Home'
    )
    const homeComponent = homeObject.addComponent(Home, homeModel, homeTexture, environmentMap) as Home

    // 创建角色
    const avatarObject = this.gameObjectManager.createGameObject(
      this.sceneManager.getScene(),
      'Avatar',
    )
    avatarObject.addComponent(Avatar, avatarModel, avatarTexture, homeComponent.getAvatarPosition(), environmentMap)

    // 给射线管理器添加可被射线检测的物体
    this.raycasterManager.addRaycasterObject(homeComponent.getRaycasterObjects())
  }

  update() {
    if (!this.resourcesLoaded) {
      return // 资源未加载完成，跳过更新
    }

    if (resizeRendererToDisplaySize()) {
      this.cameraManager.getCamera().aspect =
        this.canvas.clientWidth / this.canvas.clientHeight
      this.cameraManager.getCamera().updateProjectionMatrix()
    }

    this.gameObjectManager.update()
    this.raycasterManager.update()
    this.controls.update();

    this.renderer.render(
      this.sceneManager.getScene(),
      this.cameraManager.getCamera(),
    )
  }
}

export default GameManager