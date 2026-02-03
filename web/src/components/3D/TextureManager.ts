import * as THREE from 'three'

export class TextureManager {
  private textureLoader: THREE.TextureLoader
  private loadingManager: THREE.LoadingManager
  private textures: Map<string, THREE.Texture> = new Map()
  private loadingPromises: Map<string, Promise<THREE.Texture>> = new Map()
  private onProgress?: (progress: number) => void
  
  constructor(loadingManager?: THREE.LoadingManager) {
    this.loadingManager = loadingManager || new THREE.LoadingManager()
    this.textureLoader = new THREE.TextureLoader(this.loadingManager)
  }
  
  setProgressCallback(callback: (progress: number) => void): void {
    this.onProgress = callback
  }
  
  async preloadTexture(key: string, url: string): Promise<THREE.Texture> {
    if (this.textures.has(key)) {
      return this.textures.get(key)!
    }
    
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key)!
    }
    
    const promise = new Promise<THREE.Texture>((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => {
          texture.flipY = false
          texture.colorSpace = THREE.SRGBColorSpace
          texture.minFilter = THREE.LinearFilter
          this.textures.set(key, texture)
          this.loadingPromises.delete(key)
          resolve(texture)
        },
        undefined,
        (error) => {
          this.loadingPromises.delete(key)
          reject(error)
        }
      )
    })
    
    this.loadingPromises.set(key, promise)
    return promise
  }
  
  async preloadTextures(textureMap: Record<string, string>): Promise<void> {
    const entries = Object.entries(textureMap)
    const total = entries.length
    
    for (let i = 0; i < total; i++) {
      const entry = entries[i]
      if (!entry) continue
      
      const [key, url] = entry
      await this.preloadTexture(key, url)
      
      // 报告进度
      if (this.onProgress) {
        this.onProgress((i + 1) / total)
      }
    }
  }
  
  getTexture(key: string): THREE.Texture | undefined {
    return this.textures.get(key)
  }
  
  createMaterial(key: string): THREE.MeshBasicMaterial {
    const texture = this.getTexture(key)
    if (!texture) {
      throw new Error(`Texture "${key}" not loaded`)
    }
    return new THREE.MeshBasicMaterial({ map: texture })
  }
  
  dispose(): void {
    this.textures.forEach(texture => {
      texture.dispose()
    })
    this.textures.clear()
    this.loadingPromises.clear()
  }
}