import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js"

import * as THREE from "three"

export type Model = {
  url: string
  gltf: GLTF
  animations?: Record<string, THREE.AnimationClip>
}

class ModelLoader {
  private loader: GLTFLoader

  constructor() {
    this.loader = new GLTFLoader()
  }

  async load(path: string, onProgress?: (progress: number) => void) {
    try {
      const gltf = await this.loader.loadAsync(path, (event: any) => {
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
