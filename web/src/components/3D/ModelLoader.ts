import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js"
import * as THREE from "three"


export type Model = {
  url: string
  gltf: GLTF
  animations?: Record<string, THREE.AnimationClip>
}

class ModelLoader {
  private gltfLoader: GLTFLoader
  private dracoLoader: DRACOLoader
  private baseUrl = import.meta.env.BASE_URL

  constructor() {
    this.gltfLoader = new GLTFLoader()
    this.dracoLoader = new DRACOLoader()
    this.dracoLoader.setDecoderPath(this.baseUrl+"/draco/")
    this.gltfLoader.setDRACOLoader(this.dracoLoader)
  }

  async load(
    path: string,
    onProgress?: (progress: number) => void,
  ) {
    try {
      const gltf = await this.gltfLoader.loadAsync(path, (event: any) => {
        onProgress?.(event.loaded / event.total)
      })

      const animsByName: {
        [key: string]: THREE.AnimationClip
      } = {}
      if (gltf.animations) {
        gltf.animations.forEach((clip: THREE.AnimationClip) => {
          animsByName[clip.name] = clip
        })
      }
      return {
        url: path,
        gltf,
        animations: animsByName,
      }
    } catch (error) {
      throw error
    }
  }
}

export default new ModelLoader()
