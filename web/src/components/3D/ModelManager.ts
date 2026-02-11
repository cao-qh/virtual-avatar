import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js"
import * as THREE from "three"

export type Model = {
  url: string
  gltf: GLTF
  animations?: Record<string, THREE.AnimationClip>
}

class ModelManager {
  private gltfLoader: GLTFLoader
  private dracoLoader: DRACOLoader
  private baseUrl = import.meta.env.BASE_URL
  private models: Map<string, Model> = new Map()

  constructor(loadingManager: THREE.LoadingManager) {
    console.log('ModelManager: baseUrl =', this.baseUrl)
    console.log('ModelManager: DRACO解码器路径 =', this.baseUrl + "draco/")
    
    this.gltfLoader = new GLTFLoader(loadingManager)
    this.dracoLoader = new DRACOLoader()
    this.dracoLoader.setDecoderPath(this.baseUrl + "draco/")
    this.gltfLoader.setDRACOLoader(this.dracoLoader)
  }

  private formatAnimations(gltf: GLTF) {
    const animsByName: {
      [key: string]: THREE.AnimationClip
    } = {}
    if (gltf.animations) {
      gltf.animations.forEach((clip: THREE.AnimationClip) => {
        animsByName[clip.name] = clip
      })
    }
    return animsByName
  }

  loadMore(data: Record<string, string>) {
    console.log('ModelManager: 开始加载模型，数据:', data)
    
    Object.entries(data).forEach(([key, url]) => {
      if (this.models.has(key)) {
        return
      }

      console.log(`ModelManager: 加载模型 ${key}，URL: ${url}`)
      
      this.gltfLoader.load(
        url,
        (gltf: GLTF) => {
          console.log(`ModelManager: 模型 ${key} 加载成功`)
          this.models.set(key, {
            url,
            gltf,
            animations: this.formatAnimations(gltf),
          })
        },
        undefined,
        (error) => {
          console.error(`ModelManager: 加载模型 ${key} (${url}) 失败:`, error)
        }
      )
    })
  }

  loadSingle(name: string, path: string) {
    this.gltfLoader.load(
      path,
      (gltf: GLTF) => {
        this.models.set(name, {
          url: path,
          gltf,
          animations: this.formatAnimations(gltf),
        })
      },
      undefined,
      (error) => {
        console.error(`加载模型 ${name} (${path}) 失败:`, error)
      }
    )
  }

  getModel(key: string): Model | undefined {
    console.log(`ModelManager: getModel("${key}")`)
    console.log(`ModelManager: Map中的键:`, Array.from(this.models.keys()))
    const model = this.models.get(key)
    console.log(`ModelManager: 找到的模型:`, model ? '存在' : 'undefined')
    return model
  }
}

export default ModelManager
