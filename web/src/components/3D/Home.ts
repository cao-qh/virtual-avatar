import * as THREE from "three"

import Component from "@/components/3D/Component"
import GameObject from "@/components/3D/GameObject"
import { type Model } from "@/components/3D/ModelManager"

class Home extends Component {
  private textures: Map<string, THREE.Texture>
  private environmentMap: THREE.CubeTexture

  constructor(
    gameObject: GameObject,
    model: Model,
    textures: Map<string, THREE.Texture>,
    environmentMap: THREE.CubeTexture
  ) {
    super(gameObject)
    console.log("model:", model)
    console.log("textures:", textures)
    this.textures = textures
    this.environmentMap = environmentMap
    this.addMaterial(model)
    this.gameObject.transform.add(model.gltf.scene)
  }

  private addMaterial(model: Model) {
    model.gltf.scene.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
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
          // const videoElement = document.createElement("video")
          // videoElement.src = baseUrl + "/videos/bizhi.mp4"
          // videoElement.loop = true
          // videoElement.muted = true
          // videoElement.playsInline = true
          // videoElement.autoplay = true
          // videoElement.play()
          // const videoTexture = new THREE.VideoTexture(videoElement)
          // videoTexture.colorSpace = THREE.SRGBColorSpace
          // videoTexture.flipY = false

          // child.material = new THREE.MeshBasicMaterial({
          //   map: videoTexture,
          // })
        } else {
          this.textures.forEach((value, key) => {
            //  console.log('child.name:',child.name)
            //  console.log('key:',key)

            if (child.name.includes(key)) {
              try {
                child.material = new THREE.MeshBasicMaterial({
                  map: value,
                })

                // if (child.name.includes("Fan")) {
                //   Globals.fans.push(child)
                // }
                // if (child.name.includes("raycast")) {
                //   Globals.raycasterObjects.push(child)
                // }

                if (child.material.map) {
                  child.material.map.minFilter = THREE.LinearFilter
                }
              } catch (error) {
                console.error(`为 ${child.name} 创建材质失败:`, error)
              }
            }
          })
        }
      }
    })
  }
}

export default Home
