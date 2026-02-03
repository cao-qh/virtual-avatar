import * as THREE from 'three'

export class TextureManager {
  private textureLoader: THREE.TextureLoader
  private loadingManager: THREE.LoadingManager
  private textures: Map<string, THREE.Texture> = new Map()
  private loadingPromises: Map<string, Promise<THREE.Texture>> = new Map()
  
  constructor(loadingManager?: THREE.LoadingManager) {
    this.loadingManager = loadingManager || new THREE.LoadingManager()
    this.textureLoader = new THREE.TextureLoader(this.loadingManager)
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
    const promises = Object.entries(textureMap).map(([key, url]) => 
      this.preloadTexture(key, url)
    )
    await Promise.all(promises)
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