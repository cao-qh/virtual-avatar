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

  constructor(loadingManager?: THREE.LoadingManager) {
    this.gltfLoader = new GLTFLoader(loadingManager)
    this.dracoLoader = new DRACOLoader()
    this.dracoLoader.setDecoderPath(this.baseUrl + "/draco/")
    this.gltfLoader.setDRACOLoader(this.dracoLoader)
  }

  load(data: Record<string, string>) {
    Object.entries(data).forEach(([key, url]) => {
      if (this.models.has(key)) {
        return
      }

      this.gltfLoader.load(url, (gltf: GLTF) => {
        const animsByName: {
          [key: string]: THREE.AnimationClip
        } = {}
        if (gltf.animations) {
          gltf.animations.forEach((clip: THREE.AnimationClip) => {
            animsByName[clip.name] = clip
          })
        }
        this.models.set(key, {
          url,
          gltf,
          animations: animsByName,
        })
      })
    })
  }

  getModel(key: string): Model | undefined {
    return this.models.get(key)
  }
}

export default ModelManager
