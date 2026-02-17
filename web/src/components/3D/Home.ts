import * as THREE from "three"

import Component from "@/components/3D/Component"
import GameObject from "@/components/3D/GameObject"
import { type Model } from "@/components/3D/ModelManager"
import { gsap } from "gsap"

class Home extends Component {
  private textures: Map<string, THREE.Texture>
  private environmentMap: THREE.CubeTexture
  private introAnimaObj: Record<string, THREE.Object3D> = {}
  private fans: Array<THREE.Object3D> = []
  private raycasterObjects: Array<THREE.Object3D> = []
  private avatarPosition: THREE.Object3D | null = null

  constructor(
    gameObject: GameObject,
    model: Model,
    textures: Map<string, THREE.Texture>,
    environmentMap: THREE.CubeTexture,
  ) {
    super(gameObject)
    this.textures = textures
    this.environmentMap = environmentMap
    
    // 添加模型检查
    if (!model || !model.gltf) {
      console.error('Home组件: 模型加载失败，model或model.gltf为undefined')
      return
    }
    
    this.addMaterial(model)
    this.gameObject.transform.add(model.gltf.scene)
    this.playIntroAnimation()
  }

  private addMaterial(model: Model) {
    model.gltf.scene.traverse((child: THREE.Object3D) => {
      if (child.name.includes("avatar_position")) {
        this.avatarPosition = child
      }
      if (child.name.includes("Fan")) {
        this.fans.push(child)
      }
      if (child.name.includes("raycast")) {
        this.raycasterObjects.push(child)
      }

      if (child.name.includes("hover")) {
        child.userData.initialScale = new THREE.Vector3().copy(child.scale)
        child.userData.initialPosition = new THREE.Vector3().copy(
          child.position,
        )
        child.userData.initialRotation = new THREE.Euler().copy(child.rotation)
      }

      if (child instanceof THREE.Mesh) {
        if (child.name.includes("Wood01")) {
          this.introAnimaObj["Wood01"] = child
          child.scale.set(0, 1, 0)
        }
        if (child.name.includes("Wood02")) {
          this.introAnimaObj["Wood02"] = child
          child.scale.set(0, 0, 0)
        }
        if (child.name.includes("ButtenAbout")) {
          this.introAnimaObj["ButtenAbout"] = child
          child.scale.set(0, 0, 0)
        }
        if (child.name.includes("ButtenContact")) {
          this.introAnimaObj["ButtenContact"] = child
          child.scale.set(0, 0, 0)
        }
        if (child.name.includes("ButtenIntro")) {
          this.introAnimaObj["ButtenIntro"] = child
          child.scale.set(0, 0, 0)
        }
        if (child.name.includes("MilkTea")) {
          this.introAnimaObj["MilkTea"] = child
          child.scale.set(0, 0, 0)
        }
        if (child.name.includes("Github")) {
          this.introAnimaObj["Github"] = child
          child.scale.set(0, 0, 0)
        }
        if (child.name.includes("Blender")) {
          this.introAnimaObj["Blender"] = child
          child.scale.set(0, 0, 0)
        }

        if (child.name.includes("Water")) {
          child.material = new THREE.MeshBasicMaterial({
            color: 0x558bc8,
            transparent: true,
            opacity: 0.66,
            depthWrite: false,
          })
        } else if (child.name.includes("Glass")) {
          child.material = new THREE.MeshPhysicalMaterial({
            transmission: 1,
            opacity: 1,
            metalness: 0,
            roughness: 0,
            ior: 1.5,
            thickness: 0.01,
            specularIntensity: 1,
            envMap: this.environmentMap,
            envMapIntensity: 1,
            depthWrite: false,
          })
        } else if (child.name.includes("Screen")) {
          const videoElement = document.createElement("video")
          videoElement.src = import.meta.env.BASE_URL + "videos/bizhi.mp4"
          videoElement.loop = true
          videoElement.muted = true
          videoElement.playsInline = true
          videoElement.autoplay = true
          videoElement.play()
          const videoTexture = new THREE.VideoTexture(videoElement)
          videoTexture.colorSpace = THREE.SRGBColorSpace
          videoTexture.flipY = false
          child.material = new THREE.MeshBasicMaterial({
            map: videoTexture,
          })
        } else {
          let materialApplied = false
          
          this.textures.forEach((value, key) => {
            if (child.name.includes(key)) {
              try {
                // 检查纹理是否有效且已加载
                if (value && value instanceof THREE.Texture) {
                  // 检查纹理图片是否完全加载
                  const textureImage = value.image as HTMLImageElement | undefined
                  if (textureImage && textureImage.complete) {
                    child.material = new THREE.MeshBasicMaterial({
                      map: value,
                    })

                    if (child.material.map) {
                      child.material.map.minFilter = THREE.LinearFilter
                    }
                    materialApplied = true
                  } else {
                    // 如果图片未加载完成，设置一个回调
                    if (textureImage) {
                      textureImage.onload = () => {
                        child.material = new THREE.MeshBasicMaterial({
                          map: value,
                        })
                        if (child.material.map) {
                          child.material.map.minFilter = THREE.LinearFilter
                        }
                        child.material.needsUpdate = true
                      }
                      textureImage.onerror = () => {
                        this.applyPlaceholderMaterial(child)
                      }
                    }
                    // 暂时使用占位材质
                    this.applyPlaceholderMaterial(child)
                  }
                } else {
                  this.applyPlaceholderMaterial(child)
                }
              } catch (error) {
                console.error(`Home: 为 ${child.name} 创建材质失败:`, error)
                this.applyPlaceholderMaterial(child)
              }
            }
          })
          
          // 如果没有应用任何材质，使用占位材质
          if (!materialApplied) {
            this.applyPlaceholderMaterial(child)
          }
        }
      }
    })
  }

  private applyPlaceholderMaterial(mesh: THREE.Mesh) {
    // 创建唯一的占位颜色基于网格名称的hash
    let hash = 0
    for (let i = 0; i < mesh.name.length; i++) {
      hash = mesh.name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const hue = Math.abs(hash % 360)
    const color = new THREE.Color(`hsl(${hue}, 50%, 50%)`)
    
    mesh.material = new THREE.MeshBasicMaterial({
      color: color,
      name: `placeholder_${mesh.name}`
    })
    mesh.material.needsUpdate = true
  }

  private playIntroAnimation() {
    const t1 = gsap.timeline({
      defaults: {
        duration: 0.8,
        ease: "back.out(1.8)",
      },
    })

    if (
      this.introAnimaObj.Wood01 &&
      this.introAnimaObj.Wood02 &&
      this.introAnimaObj.ButtenAbout &&
      this.introAnimaObj.ButtenContact &&
      this.introAnimaObj.ButtenIntro
    ) {
      t1.to(this.introAnimaObj.Wood01.scale, {
        x: 1,
        z: 1,
      })
        .to(
          this.introAnimaObj.Wood02.scale,
          {
            x: 1,
            y: 1,
            z: 1,
          },
          "-=0.6",
        )
        .to(
          this.introAnimaObj.ButtenIntro.scale,
          {
            x: 1,
            y: 1,
            z: 1,
          },
          "-=0.6",
        )
        .to(
          this.introAnimaObj.ButtenAbout.scale,
          {
            x: 1,
            y: 1,
            z: 1,
          },
          "-=0.6",
        )
        .to(
          this.introAnimaObj.ButtenContact.scale,
          {
            x: 1,
            y: 1,
            z: 1,
          },
          "-=0.6",
        )
    }

    const t2 = gsap.timeline({
      defaults: {
        duration: 0.8,
        ease: "back.out(1.8)",
      },
    })

    t2.timeScale(0.8)

    if (
      this.introAnimaObj.MilkTea &&
      this.introAnimaObj.Github &&
      this.introAnimaObj.Blender
    ) {
      t1.to(this.introAnimaObj.MilkTea.scale, {
        x: 1,
        y: 1,
        z: 1,
      })
        .to(
          this.introAnimaObj.Github.scale,
          {
            x: 1,
            y: 1,
            z: 1,
          },
          "-=0.6",
        )
        .to(
          this.introAnimaObj.Blender.scale,
          {
            x: 1,
            y: 1,
            z: 1,
          },
          "-=0.6",
        )
    }
  }

  getRaycasterObjects() {
    return this.raycasterObjects
  }

  // 获取角色位置
  getAvatarPosition() {
    return this.avatarPosition
  }

  update() {
    // Animate Fans
    this.fans.forEach((fan) => {
      fan.rotation.z += 0.01
    })
  }
}

export default Home