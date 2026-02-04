import * as THREE from "three"
import { gsap } from "gsap"

const socialLinks = {
  Github: "https://github.com/",
  Blender: "https://blender.org/",
}

class RaycasterManager {
  private raycaster = new THREE.Raycaster()
  private pointer = new THREE.Vector2()
  private raycasterObjects: Array<THREE.Object3D> = []
  private camera: THREE.Camera

  private currentIntersects: THREE.Intersection[] = []
  private currentHoveredObject: THREE.Object3D | null = null

  constructor(camera: THREE.Camera, canvas: HTMLCanvasElement) {
    this.camera = camera
    // Raycaster
    canvas.addEventListener("mousemove", this.handleMouseMove.bind(this), {
      passive: true,
    })
    canvas.addEventListener("touchstart", this.handleTouchStart.bind(this), {
      passive: true,
    })
    canvas.addEventListener("click",this.handleRaycastIntersect.bind(this), {
      passive: true,
    })
     canvas.addEventListener("touchend",this.handleRaycastIntersect.bind(this), {
      passive: true,
    })
  }

  private handleMouseMove(event: any) {
    //  console.log('鼠标坐标：', event.clientX, event.clientY);
    this.pointer.x = (event.clientX / window.innerWidth) * 2 - 1
    this.pointer.y = -(event.clientY / window.innerHeight) * 2 + 1
  }

  private handleTouchStart(event: any) {
    // console.log('触摸坐标：', event.touches[0].clientX, event.touches[0].clientY);
    this.pointer.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1
    this.pointer.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1
  }

  private handleRaycastIntersect() {
    if (this.currentIntersects.length > 0) {
      const object3d = this.currentIntersects[0]?.object as THREE.Object3D

      Object.entries(socialLinks).forEach(([name, url]) => {
        if (object3d.name.includes(name)) {
          window.open(url, "_blank")
        }
      })

      if (object3d.name.includes("ButtenIntro")) {
        console.log("点击了介绍")
        // dialog.value.open("介绍")
      } else if (object3d.name.includes("ButtenAbout")) {
        // dialog.value.open("关于")
      } else if (object3d.name.includes("ButtenContact")) {
        // dialog.value.open("联系")
      }
    }
  }

  private playHoverAnimation(
    object: THREE.Object3D | null,
    isHovering: boolean,
  ) {
    if (object == null) return

    gsap.killTweensOf(object.scale)
    gsap.killTweensOf(object.rotation)
    gsap.killTweensOf(object.position)

    if (isHovering) {
      gsap.to(object.scale, {
        x: object.userData.initialScale.x * 1.2,
        y: object.userData.initialScale.y * 1.2,
        z: object.userData.initialScale.z * 1.2,
        duration: 0.5,
        ease: "bounce.out(1.8)",
      })

      gsap.to(object.rotation, {
        x: object.userData.initialRotation.x + Math.PI / 8,
        duration: 0.5,
        ease: "bounce.out(1.8)",
      })
    } else {
      gsap.to(object.scale, {
        x: object.userData.initialScale.x,
        y: object.userData.initialScale.y,
        z: object.userData.initialScale.z,
        duration: 0.3,
        ease: "bounce.out(1.8)",
      })

      gsap.to(object.rotation, {
        x: object.userData.initialRotation.x,
        duration: 0.3,
        ease: "bounce.out(1.8)",
      })
    }
  }

  addRaycasterObject(array: Array<THREE.Object3D>) {
    this.raycasterObjects.push(...array)
  }

  update() {
    this.raycaster.setFromCamera(this.pointer, this.camera)

    this.currentIntersects = this.raycaster.intersectObjects(
      this.raycasterObjects,
    )

    for (let i = 0; i < this.currentIntersects.length; i++) {
      // const intersect = currentIntersects[i]
      // if (intersect) {
      //   const mesh = intersect.object as THREE.Mesh
      //   const material = mesh.material as THREE.MeshPhysicalMaterial
      //   material.color.set(0xff0000)
      // }
    }

    if (this.currentIntersects.length > 0) {
      const object3d = this.currentIntersects[0]?.object as THREE.Object3D

      if (object3d.name.includes("hover")) {
        if (object3d !== this.currentHoveredObject) {
          if (this.currentHoveredObject) {
            this.playHoverAnimation(this.currentHoveredObject, false)
          }

          this.playHoverAnimation(object3d, true)
          this.currentHoveredObject = object3d
        }
      }

      if (object3d.name.includes("pointer")) {
        document.body.style.cursor = "pointer"
      } else {
        document.body.style.cursor = "default"
      }
    } else {
      if (this.currentHoveredObject) {
        this.playHoverAnimation(this.currentHoveredObject, false)
      }
      this.currentHoveredObject = null
      document.body.style.cursor = "default"
    }
  }
}

export default RaycasterManager
