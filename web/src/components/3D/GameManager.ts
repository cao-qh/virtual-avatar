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

  init(onLoad: () => void, onProgress?: (progress: number) => void) {
    this.loadingManager.onLoad = onLoad
    this.loadingManager.onProgress = (_, itemsLoaded, itemsTotal) => {
      //  console.log(`Loading file: ${url}`)
      onProgress?.(itemsLoaded / itemsTotal)
    }

    // 加载纹理贴图
    this.textureManager.load(textureConfig)
    // 加载模型
    this.modelManager.loadMore(modles)
    // 加载环境贴图
    this.sceneManager.loadEnvironmentTexture(cubeTexturePath)
  }

  start() {
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

    // 创建home
    const homeObject = this.gameObjectManager.createGameObject(
      this.sceneManager.getScene(),
      Home.name,
    )
    const homeComponent = homeObject.addComponent(Home, this.modelManager.getModel(Home.name),this.textureManager.getTexture(Home.name),this.sceneManager.getEnvironmentMap()) as Home

    // 创建角色
    const avatarObject = this.gameObjectManager.createGameObject(
      this.sceneManager.getScene(),
      Avatar.name,
    )
    avatarObject.addComponent(Avatar, this.modelManager.getModel(Avatar.name),this.textureManager.getTexture(Avatar.name),homeComponent.getAvatarPosition(),this.sceneManager.getEnvironmentMap())

    // 给射线管理器添加可被射线检测的物体
    this.raycasterManager.addRaycasterObject(homeComponent.getRaycasterObjects())
  }

  update() {
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
