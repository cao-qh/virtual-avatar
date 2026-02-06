import Component from "@/components/3D/Component"
import GameObject from "@/components/3D/GameObject"
import eventBus from "@/utils/EventBus"

// 一句话检测状态（使用字符串常量代替枚举，因为TypeScript配置了erasableSyntaxOnly）
type SentenceDetectionState = "idle" | "recording" | "silence_detected"

interface SentenceDetectionConfig {
  silenceThreshold: number // 静音音量阈值（0-255）
  silenceDuration: number // 静音持续时间阈值（ms）
  minSpeechDuration: number // 最小语音持续时间（ms）
  maxSentenceDuration: number // 最大句子持续时间（ms）
}

class Ear extends Component {
  // 录音器
  private recorder: MediaRecorder | null = null
  // 音频分析器
  private analyser: AnalyserNode | null = null
  // 开始静音的时间
  private silenceStartTime: number = 0
  private speechStartTime: number = 0
  private sentenceDetectionState: SentenceDetectionState = "idle"

  // 配置参数
  private sentenceDetectionConfig: SentenceDetectionConfig = {
    silenceThreshold: 20, // 提高阈值，避免环境噪音误判（基于日志分析）
    silenceDuration: 400, // 适当减少静音时间，提高响应速度
    minSpeechDuration: 300, // 减少最小语音时长，避免过短的录音
    maxSentenceDuration: 8000, // 减少最大句子时长，避免过长等待
  }
  // 当获取到音频文件数据时调用
  onAudioData?: (blob: Blob) => void

  constructor(gameObject: GameObject) {
    super(gameObject)
  }

  /**
   * 请求录音权限
   * @returns 返回媒体流对象
   */
  private async requestMicrophonePermission(): Promise<MediaStream> {
    // 1. 获取麦克风权限
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("浏览器不支持获取媒体设备")
    }

    const audioStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1, // 单声道
        sampleRate: 16000, // 语音识别常用采样率
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })
    console.log("已获取麦克风权限...")
    return audioStream
  }

  /**
   * 初始化音量检测
   * @param stream 媒体流对象
   */
  private setupVolumeDetection(stream: MediaStream): void {
    try {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)()
      this.analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)

      this.analyser.fftSize = 256
      this.analyser.smoothingTimeConstant = 0.3
      source.connect(this.analyser)

      console.log("音量检测已初始化...")
    } catch (e) {
      console.warn("音量检测初始化失败，将继续录音:", e)
    }
  }

  /**
   * 检测当前是否有足够音量（静音检测）
   */
  private isMute(): boolean {
    if (!this.analyser) return true // 如果没有音量检测，始终发送
    const currentVolume = this.getCurrentVolume()
    // 音量不够时可以选择不发送此数据块
    return currentVolume < this.sentenceDetectionConfig.silenceThreshold
  }

  /**
   * 开始倾听
   * @returns 返回录音对象
   */
  async listen() {
    try {
      // 发送麦克风请求中状态
      eventBus.emit('microphone-status-changed', 'requesting')
      
      // 请求麦克风权限
      const audioStream = await this.requestMicrophonePermission()
      
      // 发送麦克风已授权状态
      eventBus.emit('microphone-status-changed', 'granted')
      
      // 初始化音量检测
      this.setupVolumeDetection(audioStream)
      // 创建录音对象
      this.recorder = new MediaRecorder(audioStream, {
        mimeType: "audio/webm; codecs=opus",
        audioBitsPerSecond: 32000, // 32kbps，语音足够
      })

      this.recorder.ondataavailable = (event) => {
        const now = Date.now()
        const audioDuration = now - this.speechStartTime

        // 检查音频是否有效：有数据且持续时间足够长
        if (event.data.size > 0 && audioDuration > 900) {
          // 添加音频长度检测：过滤掉过短的音频（小于1秒）
          if (audioDuration < 1000) {
            console.log(`音频过短（${audioDuration}ms），忽略发送`)
            return
          }
          
          console.log(`发送音频数据，时长：${audioDuration}ms，大小：${event.data.size}字节`)
          this.onAudioData?.(event.data)
          // console.log("event.data:", event.data)
          // saveAudioToFile(event.data)
          // 发送录音数据
          // ...
        } else if (event.data.size > 0) {
          console.log(`音频数据被忽略：时长${audioDuration}ms < 900ms 或数据为空`)
        }
      }

      console.log("已创建录音对象...")
    } catch (error) {
      console.error("初始化录音失败:", error)
      // 发送麦克风被拒绝状态
      eventBus.emit('microphone-status-changed', 'denied')
      throw error
    }
  }

  /**
   * 获取当前音量水平（0-255）
   */
  getCurrentVolume(): number {
    if (!this.analyser) return 0

    const bufferLength = this.analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    this.analyser.getByteFrequencyData(dataArray)

    // 计算平均音量
    let sum = 0
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i] as number
    }
    return sum / bufferLength
  }

  /**
   * 获取当前录音状态
   */
  isRecording(): boolean {
    return this.sentenceDetectionState === "recording"
  }

  stop() {
    if (this.recorder && this.recorder.state !== "inactive") {
      this.recorder.stop()
    }

    const audioStream = this.recorder?.stream
    if (audioStream) {
      audioStream.getTracks().forEach((track) => track.stop())
    }
    console.log("已停止录音...")
  }

  update() {
    // 发送录音状态
    const isCurrentlyRecording = this.sentenceDetectionState === "recording"
    eventBus.emit('recording-status-changed', isCurrentlyRecording)
    
    if (this.isMute()) {
      // silenceStartTime = Date.now()
      // console.log("mute...")
      if (this.sentenceDetectionState === "recording") {
        // 正在录音
        const now = Date.now()
        // 开始说话的时间和当前时间差
        const itvl = now - this.speechStartTime
        // 如果大于阈值，则认为已结束说话
        if (itvl < this.sentenceDetectionConfig.minSpeechDuration) {
          // 说明是说话间的正常沉默间隔不用理会
          return
        } else {
          // 怀疑可能一句话说完了
          this.sentenceDetectionState = "silence_detected"
          this.silenceStartTime = now
        }
      } else if (this.sentenceDetectionState === "silence_detected") {
        // 检查是否一句话说完了
        const now = Date.now()
        if (
          now - this.silenceStartTime >
          this.sentenceDetectionConfig.silenceDuration
        ) {
          // 静音时间超过阈值，认为已结束说话
          this.sentenceDetectionState = "idle"
          console.log("idle...")
          this.recorder?.stop()
        }
      }
    } else {
      // 检测到说话了，开始录音
      if (this.sentenceDetectionState === "idle") {
        console.log("recording...")
        this.sentenceDetectionState = "recording"
        this.speechStartTime = Date.now()
        this.recorder?.start()
      } else if (this.sentenceDetectionState === "silence_detected") {
        // 意思说话正常间隔
        this.sentenceDetectionState = "recording"
        this.silenceStartTime = Date.now()
      }
    }
  }
}

export default Ear
