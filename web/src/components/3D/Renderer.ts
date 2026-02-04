import * as THREE from "three"


let renderer: THREE.WebGLRenderer | null = null

export function createRenderer(options: any) {
  renderer = new THREE.WebGLRenderer(options)
  // 自动适应高DPI屏幕
  const pixelRatio = Math.min(window.devicePixelRatio, 2) // 限制最大2倍
  renderer.setPixelRatio(pixelRatio)
  return renderer
}

export function resizeRendererToDisplaySize() {
  if (!renderer) {
    throw new Error("renderer is null")
  }

  const canvas = renderer.domElement
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  const needResize = canvas.width !== width || canvas.height !== height
  if (needResize) {
    renderer.setSize(width, height, false)
  }
  return needResize
}
