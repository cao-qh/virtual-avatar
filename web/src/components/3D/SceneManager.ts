import * as THREE from "three"

class SceneManager {
  private scene: THREE.Scene
  private cubeTextureLoader: THREE.CubeTextureLoader
  private environmentMap: THREE.CubeTexture | null = null
  constructor(loadingManager?: THREE.LoadingManager, cubeTexturePath?: string) {
    this.scene = new THREE.Scene()
    this.cubeTextureLoader = new THREE.CubeTextureLoader(loadingManager)
    if (cubeTexturePath) {
      this.cubeTextureLoader.setPath(cubeTexturePath)
    }
  }

  async loadEnvironmentTexture(urls: string[]): Promise<void> {
    this.environmentMap = await this.cubeTextureLoader.loadAsync(urls)
    this.scene.background = this.environmentMap
  }

	getScene() {
		return this.scene
	}

	getEnvironmentMap() {
		return this.environmentMap
	}
}

export default SceneManager