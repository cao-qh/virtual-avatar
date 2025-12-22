import Component from "../Component"
import GameObject from "../GameObject"
import SkinInstance from "../SkinInstance"
import type { Model } from "../ModelLoader"
import Mouth from "./Mouth"
import Ear from "./Ear"
import Thought from "./Thought"

class Player extends Component {
  // 玩家角色模型
  private model: Model
  // 玩家皮肤实例
  private skinInstance: SkinInstance
  // 角色状态
  private state: "idle" | "talking"
  // 嘴巴
  private mouth: Mouth
  // 耳朵
  private ear: Ear
  // 思考
  private thought: Thought

  constructor(gameObject: GameObject, model: Model) {
    super(gameObject)
    this.state = "idle"
    this.model = model
    this.skinInstance = gameObject.addComponent(SkinInstance, this.model)
    this.skinInstance.setAnimation(this.state)
    this.mouth = gameObject.addComponent(Mouth)
    this.ear = gameObject.addComponent(Ear)
    this.ear.listen().catch((e) => {
      console.error(e)
    })
    this.thought = gameObject.addComponent(Thought,"ws://127.0.0.1:3000")

    this.mouth.onEnded = () => {
      this.setState("idle")
    }

    // 当听到问题，进行撕开
    this.ear.onAudioData = (blob)=>{
      this.thought.sendAudioData(blob)
    }

    // 当思考结束
    this.thought.onQuestionEnd = (blob)=>{
      this.talk(blob)
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
    this.mouth.speak(blob)
    this.setState("talking")
  }
  update() {
    this.ear.update()
  }
}

export default Player
