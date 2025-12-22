import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js"

// const gltfLoader = new GLTFLoader()
// gltfLoader.load(
//   "/girl.glb",
//   (gltf: GLTF) => {
//     loaded.value = true
//     const root = gltf.scene
//     console.log("gltf:", gltf)
//     scene.add(root)

//     mixer = new THREE.AnimationMixer(root)
//     const clip = gltf.animations[0]
//     if (clip) {
//       mixer.clipAction(clip).play()
//     }
//   },
//   (event) => {
//     // console.log("加载完成:",event)
//     loadingProgress.value = event.loaded / event.total
//   }
// )

import * as THREE from "three"

export type Model = {
  url: string
  gltf: GLTF
  animations?: Record<string, THREE.AnimationClip>
  size?: number
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
        this.onLoaded?.({
          url: path,
          gltf,
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
