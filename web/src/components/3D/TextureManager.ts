import * as THREE from "three"

import type { TexturesConfig } from "@/Config/textureConfig"

class TextureManager {
  private textureLoader: THREE.TextureLoader
  private textures: Map<string, THREE.Texture | Map<string, THREE.Texture>> =
    new Map()

  constructor(loadingManager?: THREE.LoadingManager) {
    this.textureLoader = new THREE.TextureLoader(loadingManager)
  }

  private async _load(url: string) {
    // this.textureLoader.load(url, (texture) => {
    //   texture.flipY = false
    //   texture.colorSpace = THREE.SRGBColorSpace
    //   texture.minFilter = THREE.LinearFilter
    //   this.textures.set(key, texture)
    // })
    const texture = await this.textureLoader.loadAsync(url)
    texture.flipY = false
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    return texture
  }

  load(data: TexturesConfig) {
    Object.entries(data).forEach(async ([key, value]) => {
      if (this.textures.has(key)) {
        return
      }

      if (typeof value === "object") {
        const map = new Map()
        Object.entries(value).forEach(async ([key, url]) => {
          const texture = await this._load(url)
          map.set(key, texture)
        })
        this.textures.set(key, map)
      } else {
        const texture = await this._load(value)
        this.textures.set(key, texture)
      }
    })
  }

  getTexture(key: string): THREE.Texture | undefined|Map<string, THREE.Texture> {
    return this.textures.get(key)
  }
}

export default TextureManager
