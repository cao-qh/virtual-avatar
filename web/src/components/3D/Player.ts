import Component from "./Component"
import GameObject from "./GameObject"
import SkinInstance from "./SkinInstance"
import type { Model } from "./ModelLoader"
import AudioPlayer from "../2D/AudioPlayer"

class Player extends Component {
  // 玩家角色模型
  private model: Model
  // 玩家皮肤实例
  private skinInstance: SkinInstance
  // 角色状态
  private state: "idle" | "talking"
  // 音频播放器
  private audioPlayer: AudioPlayer

  constructor(gameObject: GameObject, model: Model) {
    super(gameObject)
    this.state = "idle"
    this.model = model
    this.skinInstance = gameObject.addComponent(SkinInstance, this.model)
    this.skinInstance.setAnimation(this.state)
    this.audioPlayer = new AudioPlayer()

    this.audioPlayer.onEnded = () => {
      this.setState("idle")
    }
  }

  private setState(state: "idle" | "talking") {
    this.state = state
    this.skinInstance.setAnimation(this.state)
  }
  getState() {
    return this.state
  }

  talk(blob: Blob) {
    console.log("开始说话")
    this.audioPlayer.play(blob)
    this.setState("talking")
  }
  update() {}
}

export default Player
