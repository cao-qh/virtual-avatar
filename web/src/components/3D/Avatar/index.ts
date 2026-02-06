import * as THREE from "three"
import Component from "@/components/3D/Component"
import GameObject from "@/components/3D/GameObject"
import SkinInstance from "@/components/3D/SkinInstance"
import { type Model } from "@/components/3D/ModelManager"
import Mouth from "@/components/3D/Avatar/Mouth"
import Ear from "@/components/3D/Avatar/Ear"
import Thought from "@/components/3D/Avatar/Thought"
import eventBus from "@/utils/EventBus"

class Avatar extends Component {
  // 玩家皮肤实例
  private skinInstance: SkinInstance
  // 角色状态（扩展为四种状态）
  private state: "idel" | "talking" | "listening" | "thinking"
  // 嘴巴
  private mouth: Mouth
  // 耳朵
  private ear: Ear
  // 思考
  private thought: Thought
  // 动画过渡时间（秒）
  private animationFadeDuration: number = 0.3

  constructor(
    gameObject: GameObject,
    model: Model,
    texture: THREE.Texture,
    postion: THREE.Object3D,
    environmentMap: THREE.CubeTexture,
  ) {
    super(gameObject)
    this.addMaterial(model, texture, environmentMap)
    this.state = "idel"
    this.gameObject.transform.position.copy(postion.position)
    this.gameObject.transform.rotation.copy(postion.rotation)
    this.skinInstance = gameObject.addComponent(SkinInstance, model)
    this.skinInstance.setAnimation(this.state)
    this.mouth = gameObject.addComponent(Mouth)
    this.ear = gameObject.addComponent(Ear)
    this.ear.listen().catch((e) => {
      console.error(e)
    })
    this.thought = gameObject.addComponent(Thought, "ws://127.0.0.1:3000")

    this.mouth.onEnded = () => {
      this.setState("idel")
    }

    // 当听到问题，进行撕开
    this.ear.onAudioData = (blob) => {
      this.thought.sendAudioData(blob)
    }

    // 当思考结束
    this.thought.onQuestionEnd = (blob) => {
      console.log("思考结束")
      this.talk(blob)
    }
    this.thought.onError = (error) => {
      console.log(error)
      if (error.code === 401) {
        // 音频不是一句话
        this.setState("idel")
      }
    }

    // 监听状态变化事件，保持内部状态同步
    eventBus.on("avatar-status-changed", (status: string) => {
      if (this.state === status) return

      // 只处理 thinking 状态，其他状态由 Avatar 自己管理
      if (status === "thinking" || status === "idel") {
        console.log(`收到思考状态事件，更新内部状态为: ${status}`)
        this.setState(status as any)
      }
    })
  }

  // 添加材质
  addMaterial(
    model: Model,
    texture: THREE.Texture,
    environmentMap: THREE.CubeTexture,
  ) {
    model.gltf.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // 创建材质并应用烘焙贴图
        const material = new THREE.MeshBasicMaterial({
          map: texture,
        })

        child.material = material

        // 特殊处理：眼镜材质
        if (child.name.includes("glasses")) {
          // console.log(`检测到眼镜材质: ${child.name}`)
          child.material = new THREE.MeshPhysicalMaterial({
            transmission: 1,
            opacity: 1,
            metalness: 0,
            roughness: 0,
            ior: 1.5,
            thickness: 0.01,
            specularIntensity: 1,
            envMap: environmentMap,
            envMapIntensity: 1,
            depthWrite: false,
          })
        }
      }
    })
  }

  /**
   * 设置角色状态（使用平滑动画过渡）
   * @param state 新状态
   */
  private setState(state: "idel" | "talking" | "listening" | "thinking") {
    // 如果状态没有变化，直接返回
    if (this.state === state) {
      return
    }

    this.state = state

    // 映射状态到实际动画
    // 注意：模型可能没有所有状态的动画
    let animState = state
    if (state === "listening") {
      // 聆听状态使用待机动画（模型没有 listening 动画）
      animState = "idel"
      console.log(`状态映射：${state} → ${animState}（使用待机动画）`)
    } else if (state === "thinking") {
      // 思考状态使用思考动画（用户已添加）
      animState = "thinking"
      console.log(`状态切换：${state}（使用思考动画）`)
    } else {
      console.log(`状态切换：${state}`)
    }

    // 使用平滑过渡切换动画
    this.skinInstance.crossfadeTo(animState, this.animationFadeDuration)

    // 发送角色状态事件
    eventBus.emit("avatar-status-changed", state)
  }

  /**
   * 获取当前状态
   */
  getState() {
    return this.state
  }

  /**
   * 设置动画过渡时间
   * @param duration 过渡时间（秒）
   */
  setAnimationFadeDuration(duration: number) {
    this.animationFadeDuration = duration
  }

  /**
   * 开始说话
   * @param blob 音频数据
   */
  talk(blob: Blob) {
    console.log("开始说话")
    this.mouth.speak(blob)
    this.setState("talking")
  }

  update() {
    this.ear.update()

    // 如果当前是 thinking 状态，不更新聆听/待机状态
    // thinking 状态由 Thought.ts 专门管理
    if (this.state === "thinking") {
      return
    }

    // 检测用户是否在说话（聆听状态）
    // 如果正在录音，说明用户在说话，角色处于聆听状态
    if (this.state !== "talking" && this.ear.isRecording()) {
      this.setState("listening")
    } else if (this.state !== "talking" && !this.ear.isRecording()) {
      // 当不在录音且不在说话状态时，确保角色状态为待机
      this.setState("idel")
    }
  }
}

export default Avatar
