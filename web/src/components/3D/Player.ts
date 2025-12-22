import Component from "./Component"
import GameObject from "./GameObject"
import SkinInstance from "./SkinInstance"
import type { Model } from "./ModelLoader"

class Player extends Component {
  // 玩家角色模型
  private model: Model 
  // 玩家皮肤实例
  private skinInstance: SkinInstance
  // 角色状态
  private state: "idle" | "talking"

  constructor(gameObject: GameObject, model: Model) {
    super(gameObject)
    this.state = "idle"
    this.model = model
    this.skinInstance = gameObject.addComponent(SkinInstance, this.model)
    this.skinInstance.setAnimation("idle")
  }
  update() {}
}

export default Player
