import * as THREE from "three/webgpu"

let renderer: THREE.WebGPURenderer | null = null

export async  function createRenderer(options: any) {
  renderer = new THREE.WebGPURenderer(options)
  await renderer.init()
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
