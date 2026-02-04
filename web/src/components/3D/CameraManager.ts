import * as THREE from "three"

class CameraManager {
  // 视野范围(field of view)的缩写。上述代码中是指垂直方向为75度
  private fov = 35
  // 画布的宽高比,相机默认值是2
  private aspect = window.innerWidth / window.innerHeight
  // 相机可绘制的近平面
  private near = 0.1
  // 相机可绘制的远平面，不在远近平面内的物体不会被相机看到，所以不绘制
  private far = 500
  // PerspectiveCamera透视相机
  private camera: THREE.PerspectiveCamera

  constructor() {
    this.camera = new THREE.PerspectiveCamera(
      this.fov,
      this.aspect,
      this.near,
      this.far,
    )
  }

  getCamera() {
    return this.camera
  }

  setCameraPosition(x: number, y: number, z: number) {
    this.camera.position.set(x, y, z)
  }
}

export default CameraManager
