import * as THREE from "three"
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js"

import  { type Model } from "@/components/3D/ModelManager"
import Component from "./Component"
import Globals from "@/utils/Globals"
import GameObject from "./GameObject"

class SkinInstance extends Component {
  model: Model
  animRoot: THREE.Object3D
  mixer: THREE.AnimationMixer
  actions: Record<string, THREE.AnimationAction>
  currentAction: THREE.AnimationAction | null = null
  previousAction: THREE.AnimationAction | null = null
  
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
  
  /**
   * 设置动画（立即切换，无过渡）
   */
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
    this.previousAction = this.currentAction
    this.currentAction = action
  }
  
  /**
   * 平滑过渡到指定动画
   * @param animName 动画名称
   * @param fadeDuration 过渡时间（秒），默认0.3秒
   */
  crossfadeTo(animName: string, fadeDuration: number = 0.3) {
    if (!this.model.animations) {
      throw new Error("Model animations not loaded")
    }

    const clip = this.model.animations[animName] as THREE.AnimationClip
    let action = this.actions[animName]
    
    // 如果动作不存在，创建它
    if (!action) {
      action = this.mixer.clipAction(clip)
      this.actions[animName] = action
    }
    
    // 如果当前没有动作在播放，直接播放新动作
    if (!this.currentAction) {
      action.reset()
      action.play()
      this.currentAction = action
      return
    }
    
    // 如果已经是当前动作，不做任何事
    if (this.currentAction === action) {
      return
    }
    
    // 保存之前的动作
    this.previousAction = this.currentAction
    
    // 启用新动作
    action.enabled = true
    action.reset()
    action.play()
    
    // 如果之前有动作，进行交叉淡入淡出
    if (this.previousAction) {
      action.crossFadeFrom(this.previousAction, fadeDuration, true)
    }
    
    this.currentAction = action
  }
  
  /**
   * 淡入指定动画
   * @param animName 动画名称
   * @param fadeDuration 淡入时间（秒），默认0.3秒
   */
  fadeIn(animName: string, fadeDuration: number = 0.3) {
    if (!this.model.animations) {
      throw new Error("Model animations not loaded")
    }

    const clip = this.model.animations[animName] as THREE.AnimationClip
    let action = this.actions[animName]
    
    // 如果动作不存在，创建它
    if (!action) {
      action = this.mixer.clipAction(clip)
      this.actions[animName] = action
    }
    
    // 启用并播放动作
    action.enabled = true
    action.reset()
    action.fadeIn(fadeDuration)
    action.play()
    
    this.previousAction = this.currentAction
    this.currentAction = action
  }
  
  /**
   * 淡出当前动画
   * @param fadeDuration 淡出时间（秒），默认0.3秒
   */
  fadeOut(fadeDuration: number = 0.3) {
    if (this.currentAction) {
      this.currentAction.fadeOut(fadeDuration)
      this.previousAction = this.currentAction
      this.currentAction = null
    }
  }
  
  update() {
    this.mixer.update(Globals.deltaTime)
  }
}

export default SkinInstance
