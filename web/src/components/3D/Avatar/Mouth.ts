import Component from "../Component"
import GameObject from "../GameObject"

/**
 * 数字人的嘴巴
 */
class Mouth extends Component {
  private audio: HTMLAudioElement
  onEnded?: () => void

  constructor(gameObject: GameObject) {
    super(gameObject)
    // 只创建一个 Audio 实例
    this.audio = new Audio()
    this.audio.addEventListener("ended", () => {
      this.cleanupCurrentUrl()
      this.onEnded?.()
    })
  }

  /**
   * 清理当前的 ObjectURL
   */
  private cleanupCurrentUrl() {
    if (this.audio.src) {
      URL.revokeObjectURL(this.audio.src)
      this.audio.src = ""
    }
  }

  speak(audioData: Blob) {
    // 先释放
    this.cleanupCurrentUrl()
    // 创建新的 URL
    this.audio.src = URL.createObjectURL(audioData)
    try {
      this.audio.play()
    } catch (e) {
      throw e
    }
  }

  update() {}
}

export default Mouth
