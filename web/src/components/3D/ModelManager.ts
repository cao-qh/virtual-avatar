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
    this.gltfLoader = new GLTFLoader(loadingManager)
    this.dracoLoader = new DRACOLoader()
    this.dracoLoader.setDecoderPath(this.baseUrl + "/draco/")
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
    Object.entries(data).forEach(([key, url]) => {
      if (this.models.has(key)) {
        return
      }

      this.gltfLoader.load(url, (gltf: GLTF) => {
        this.models.set(key, {
          url,
          gltf,
          animations: this.formatAnimations(gltf),
        })
      })
    })
  }

  loadSingle(name: string, path: string) {
    this.gltfLoader.load(path, (gltf: GLTF) => {
      this.models.set(name, {
        url: path,
        gltf,
        animations: this.formatAnimations(gltf),
      })
    })
  }

  getModel(key: string): Model | undefined {
    return this.models.get(key)
  }
}

export default ModelManager
