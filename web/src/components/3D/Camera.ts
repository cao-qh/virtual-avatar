import * as THREE from "three"

// 视野范围(field of view)的缩写。上述代码中是指垂直方向为75度
const fov = 35
// 画布的宽高比,相机默认值是2
const aspect = window.innerWidth / window.innerHeight
// 相机可绘制的近平面
const near = 0.1
// 相机可绘制的远平面，不在远近平面内的物体不会被相机看到，所以不绘制
const far = 500
// PerspectiveCamera透视相机
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
camera.position.set( 0, 3, 5 );
// camera.rotation.set(3, 3, 3)
//  camera.lookAt(0, 10, 0)

export default camera
