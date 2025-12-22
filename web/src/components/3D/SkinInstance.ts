import * as THREE from "three"
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js"

import type { Model } from "./ModelLoader"
import Component from "./Component"
import Globals from "@/utils/Globals"
import GameObject from "./GameObject"

class SkinInstance extends Component {
  model: Model
  animRoot: THREE.Object3D
  mixer: THREE.AnimationMixer
  actions: Record<string, THREE.AnimationAction>
  constructor(gameObject: GameObject, model: Model) {
    super(gameObject)
    this.model = model
    this.actions = {}

    if (!this.model.gltf) {
      throw new Error("Model not loaded")
    }
    this.animRoot = SkeletonUtils.clone(this.model.gltf.scene)
    this.mixer = new THREE.AnimationMixer(this.animRoot)
    gameObject.transform.add(this.animRoot)
  }
  setAnimation(animName: string) {
    if (!this.model.animations) {
      throw new Error("Model animations not loaded")
    }

    const clip = this.model.animations[animName] as THREE.AnimationClip
    // turn off all current actions
    for (const action of Object.values(this.actions)) {
      action.enabled = false
    }
    // get or create existing action for clip
    const action = this.mixer.clipAction(clip)
    action.enabled = true
    action.reset()
    action.play()
    this.actions[animName] = action
  }
  update() {
    this.mixer.update(Globals.deltaTime)
  }
}

export default SkinInstance
