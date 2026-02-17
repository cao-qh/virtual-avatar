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
  private loadingPromises: Map<string, Promise<void>> = new Map()

  constructor(loadingManager: THREE.LoadingManager) {
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

  async loadMore(data: Record<string, string>): Promise<void> {
    const loadPromises: Promise<void>[] = []
    
    for (const [key, url] of Object.entries(data)) {
      if (this.models.has(key)) {
        continue
      }

      const loadPromise = new Promise<void>((resolve, reject) => {
        this.gltfLoader.load(
          url,
          (gltf: GLTF) => {
            this.models.set(key, {
              url,
              gltf,
              animations: this.formatAnimations(gltf),
            })
            resolve()
          },
          undefined,
          (error: unknown) => {
            const errorMessage = error instanceof ErrorEvent ? error.message : 
                               error instanceof Error ? error.message : 
                               String(error)
            console.error(`ModelManager: 加载模型 ${key} (${url}) 失败:`, error)
            reject(new Error(`模型 ${key} 加载失败: ${errorMessage}`))
          }
        )
      })
      
      this.loadingPromises.set(key, loadPromise)
      loadPromises.push(loadPromise)
    }
    
    await Promise.all(loadPromises)
  }

  loadSingle(name: string, path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        path,
        (gltf: GLTF) => {
          this.models.set(name, {
            url: path,
            gltf,
            animations: this.formatAnimations(gltf),
          })
          resolve()
        },
        undefined,
        (error: unknown) => {
          const errorMessage = error instanceof ErrorEvent ? error.message : 
                             error instanceof Error ? error.message : 
                             String(error)
          console.error(`加载模型 ${name} (${path}) 失败:`, error)
          reject(new Error(`模型 ${name} 加载失败: ${errorMessage}`))
        }
      )
    })
  }

  getModel(key: string): Model | undefined {
    const model = this.models.get(key)
    if (!model) {
      console.warn(`ModelManager: 模型 ${key} 未找到或未加载完成`)
    }
    return model
  }

  async waitForModel(key: string): Promise<void> {
    const promise = this.loadingPromises.get(key)
    if (promise) {
      await promise
    }
  }

  isLoaded(key: string): boolean {
    return this.models.has(key)
  }
}

export default ModelManager