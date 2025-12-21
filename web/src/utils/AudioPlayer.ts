/**
 * 音频播放器
 * 优化版本：重用 Audio 实例，避免重复创建
 */
class AudioPlayer {
  private audio: HTMLAudioElement
  private currentUrl: string | null = null
  state: "idle" | "playing" = "idle"
  queue: Blob[] = []

  constructor() {
    // 只创建一个 Audio 实例
    this.audio = new Audio()

    // 一次性添加事件监听器
    this.audio.addEventListener("error", (e) => {
      console.error("音频播放错误:", e, this.audio.error)
      this.cleanupCurrentUrl()
      this.state = "idle"
    })

    this.audio.addEventListener("ended", () => {
      console.log("音频播放结束")
      this.cleanupCurrentUrl()
      this.state = "idle"
    })

    // 可选：添加 canplaythrough 事件监听
    // this.audio.addEventListener("canplaythrough", () => {
    //   console.log("音频可以播放");
    // });
  }

  /**
   * 清理当前的 ObjectURL
   */
  private cleanupCurrentUrl() {
    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl)
      this.currentUrl = null
    }
  }

  /**
   * 播放指定的音频 Blob
   */
  private play(blob: Blob) {
    // 清理之前的 URL
    this.cleanupCurrentUrl()

    // 创建新的 URL
    this.currentUrl = URL.createObjectURL(blob)
    this.audio.src = this.currentUrl

    // 尝试播放
    this.audio.play().catch((error) => {
      console.error("播放失败:", error)
      this.cleanupCurrentUrl()
      this.state = "idle"
    })

    this.state = "playing"
  }

   /**
   * 添加音频到播放队列
   */
  add(audio: Blob) {
    this.queue.push(audio)
  }

  getState() {
    return this.state
  }

  /**
   * 更新播放器状态，播放下一个队列中的音频
   */
  update() {
    if (this.state === "idle" && this.queue.length > 0) {
      const blob = this.queue.shift()
      if (blob) {
        this.play(blob)
      }
    }
  }
}

export const audioPlayer = new AudioPlayer()
