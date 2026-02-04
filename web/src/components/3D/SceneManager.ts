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

  loadEnvironmentTexture(urls: string[]) {
    this.environmentMap = this.cubeTextureLoader.load(urls)
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
