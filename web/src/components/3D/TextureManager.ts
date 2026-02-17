import * as THREE from "three"

import type { TexturesConfig } from "@/Config/textureConfig"

class TextureManager {
  private textureLoader: THREE.TextureLoader
  private textures: Map<string, THREE.Texture | Map<string, THREE.Texture>> =
    new Map()
  private loadingPromises: Map<string, Promise<void>> = new Map()

  constructor(loadingManager?: THREE.LoadingManager) {
    this.textureLoader = new THREE.TextureLoader(loadingManager)
  }

  private async _load(url: string, maxRetries: number = 2): Promise<THREE.Texture> {
    let lastError: Error | undefined
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const texture = await this.textureLoader.loadAsync(url)
        texture.flipY = false
        texture.colorSpace = THREE.SRGBColorSpace
        texture.minFilter = THREE.LinearFilter
        
        // 确保纹理数据已完全加载
        if (texture.image && !texture.image.complete) {
          await new Promise<void>((resolve, reject) => {
            if (texture.image) {
              texture.image.onload = () => resolve()
              texture.image.onerror = (_err) => reject(new Error(`图片加载失败: ${url}`))
            } else {
              resolve() // 没有图片，直接继续
            }
          })
        }
        
        return texture
      } catch (error) {
        lastError = error as Error
        console.warn(`TextureManager: 纹理加载失败 ${url} (尝试 ${attempt + 1}/${maxRetries}):`, error)
        
        if (attempt < maxRetries - 1) {
          // 等待一段时间后重试
          await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)))
        }
      }
    }
    
    throw new Error(`TextureManager: 纹理 ${url} 加载失败，所有重试均失败: ${lastError?.message}`)
  }

  async load(data: TexturesConfig): Promise<void> {
    const loadPromises: Promise<void>[] = []
    
    for (const [key, value] of Object.entries(data)) {
      if (this.textures.has(key)) {
        continue
      }

      const loadPromise = (async () => {
        try {
          if (typeof value === "object") {
            const map = new Map<string, THREE.Texture>()
            
            const subLoadPromises = Object.entries(value).map(async ([subKey, url]) => {
              const texture = await this._load(url)
              map.set(subKey, texture)
            })
            
            await Promise.all(subLoadPromises)
            this.textures.set(key, map)
          } else {
            const texture = await this._load(value)
            this.textures.set(key, texture)
          }
        } catch (error) {
          console.error(`TextureManager: 加载纹理 ${key} 失败:`, error)
          throw error
        }
      })()
      
      this.loadingPromises.set(key, loadPromise)
      loadPromises.push(loadPromise)
    }
    
    await Promise.all(loadPromises)
  }

  getTexture(key: string): THREE.Texture | undefined|Map<string, THREE.Texture> {
    const texture = this.textures.get(key)
    if (!texture) {
      console.warn(`TextureManager: 纹理 ${key} 未找到或未加载完成`)
    }
    return texture
  }

  async waitForTexture(key: string): Promise<void> {
    const promise = this.loadingPromises.get(key)
    if (promise) {
      await promise
    }
  }

  isLoaded(key: string): boolean {
    return this.textures.has(key)
  }
}

export default TextureManager