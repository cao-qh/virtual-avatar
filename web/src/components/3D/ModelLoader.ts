import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js"

import * as THREE from "three"

export type Model = {
  url: string
  gltf: GLTF
  animations?: Record<string, THREE.AnimationClip>
}

class ModelLoader {
  onLoaded?: (model: Model) => void
  onProgress?: (progress: number) => void
  onError?: (error: any) => void
  private loader: GLTFLoader

  constructor() {
    this.loader = new GLTFLoader()
  }

  load(path: string) {
    this.loader.load(
      path,
      (gltf: GLTF) => {
        const animsByName: {
          [key: string]: THREE.AnimationClip
        } = {}
        if (gltf.animations) {
          gltf.animations.forEach((clip: THREE.AnimationClip) => {
            animsByName[clip.name] = clip
          })
        }
        this.onLoaded?.({
          url: path,
          gltf,
          animations: animsByName,
        })
      },
      (event: any) => {
        this.onProgress?.(event.loaded / event.total)
      },
      (error) => this.onError?.(error)
    )
  }
}

export default new ModelLoader()
