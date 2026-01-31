import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js"
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js"
import * as THREE from "three"

import { environmentMap } from "./Scene"
import Globals from "@/utils/Globals"

export type Model = {
  url: string
  gltf: GLTF
  animations?: Record<string, THREE.AnimationClip>
}

class ModelLoader {
  private gltfLoader: GLTFLoader
  private textureLoader: THREE.TextureLoader
  private dracoLoader: DRACOLoader
  private glassMaterial: THREE.MeshPhysicalMaterial
  private videoTexture: THREE.VideoTexture
  private baseUrl = import.meta.env.BASE_URL

  constructor() {
    this.gltfLoader = new GLTFLoader()
    this.textureLoader = new THREE.TextureLoader()
    this.dracoLoader = new DRACOLoader()
    this.dracoLoader.setDecoderPath(this.baseUrl+"/draco/")
    this.gltfLoader.setDRACOLoader(this.dracoLoader)
    this.glassMaterial = new THREE.MeshPhysicalMaterial({
      transmission: 1,
      opacity: 1,
      metalness: 0,
      roughness: 0,
      ior: 1.5,
      thickness: 0.01,
      specularIntensity: 1,
      envMap: environmentMap,
      envMapIntensity: 1,
      depthWrite: false,
    })

    const videoElement = document.createElement("video")
    videoElement.src = this.baseUrl+"/videos/bizhi.mp4"
    videoElement.loop = true
    videoElement.muted = true
    videoElement.playsInline = true
    videoElement.autoplay = true
    videoElement.play()
    this.videoTexture = new THREE.VideoTexture(videoElement)
    this.videoTexture.colorSpace = THREE.SRGBColorSpace
    this.videoTexture.flipY = false
  }

  async load(
    path: string,
    onProgress?: (progress: number) => void,
    textures?: Record<string, string>,
  ) {
    try {
      const gltf = await this.gltfLoader.loadAsync(path, (event: any) => {
        onProgress?.(event.loaded / event.total)
      })

      // 加载纹理贴图
      if (textures) {
        gltf.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            console.log(child.name)

            if (child.name.includes("hover")) {
              child.userData.initialScale = new THREE.Vector3().copy(
                child.scale,
              )
              child.userData.initialPosition = new THREE.Vector3().copy(
                child.position,
              )
              child.userData.initialRotation = new THREE.Euler().copy(
                child.rotation,
              )
            }

            if (child.name.includes("Water")) {
              child.material = new THREE.MeshBasicMaterial({
                color: 0x558bc8,
                transparent: true,
                opacity: 0.66,
                depthWrite: false,
              })
            } else if (child.name.includes("Glass")) {
              child.material = this.glassMaterial
            } else if (child.name.includes("Screen")) {
              child.material = new THREE.MeshBasicMaterial({
                map: this.videoTexture,
              })
            } else {
              Object.keys(textures).forEach((key) => {
                //console.log('key:',key)
                if (child.name.includes(key)) {
                  const texturePath = textures[key]
                  if (texturePath) {
                    const texture = this.textureLoader.load(texturePath)
                    texture.flipY = false
                    texture.colorSpace = THREE.SRGBColorSpace
                    const material = new THREE.MeshBasicMaterial({
                      map: texture,
                    })
                    child.material = material

                    if (child.name.includes("Fan")) {
                      console.log("fan:", child)
                      Globals.fans.push(child)
                    }
                    if (child.name.includes("raycast")) {
                      Globals.raycasterObjects.push(child)
                    }

                    if (child.material.map) {
                      child.material.map.minFilter = THREE.LinearFilter
                    }
                  }
                }
              })
            }
          }
        })
      }

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
