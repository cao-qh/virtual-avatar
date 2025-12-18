interface SentenceDetectionConfig {
  silenceThreshold: number // 静音音量阈值（0-255）
  silenceDuration: number // 静音持续时间阈值（ms）
  minSpeechDuration: number // 最小语音持续时间（ms）
  maxSentenceDuration: number // 最大句子持续时间（ms）
}

// 一句话检测状态（使用字符串常量代替枚举，因为TypeScript配置了erasableSyntaxOnly）
type SentenceDetectionState = "idle" | "recording" | "silence_detected"

// 默认配置
const DEFAULT_CONFIG: SentenceDetectionConfig = {
  silenceThreshold: 18, // 提高阈值，避免环境噪音误判（基于日志分析）
  silenceDuration: 800, // 适当减少静音时间，提高响应速度
  minSpeechDuration: 300,
  maxSentenceDuration: 8000, // 减少最大句子时长，避免过长等待
}

// 录音机
let mediaRecorder: MediaRecorder | null = null
// 音频流
let audioStream: MediaStream | null = null
// 是否在录音
let isRecording = false

// 一句话检测相关
let sentenceDetectionState: SentenceDetectionState = "idle"
let sentenceAudioChunks: Blob[] = []
let silenceStartTime: number = 0
let speechStartTime: number = 0
let volumePeak: number = 0 // 记录当前句子中的音量峰值
let currentConfig: SentenceDetectionConfig = DEFAULT_CONFIG
let onSentenceAudioData: ((chunk: Blob) => void) | null = null
let onSentenceStart: (() => void) | null = null
let onSentenceEnd: (() => void) | null = null

// 音量检测相关
// 音频上下文
let audioContext: AudioContext | null = null
// 分析器
let analyser: AnalyserNode | null = null
// 音频接口
let source: MediaStreamAudioSourceNode | null = null

/**
 * 自动初始化麦克风并开始录音
 */
export async function startAutoRecording(
  onAudioData: (chunk: Blob) => void,
  onStatusChange?: (
    status: "started" | "stopped" | "error",
    message?: string
  ) => void,
  config?: SentenceDetectionConfig
): Promise<void> {
  try {
    // 更新配置（如果提供了）
    if (config) {
      currentConfig = { ...DEFAULT_CONFIG, ...config }
    }

    // 1. 获取麦克风权限
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("浏览器不支持获取媒体设备")
    }

    console.log("正在请求麦克风权限...")

    audioStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1, // 单声道
        sampleRate: 16000, // 语音识别常用采样率
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })

    console.log("麦克风权限获取成功，开始初始化录音...")

    // 2. 设置音量检测（用于静音检测）
    setupVolumeDetection(audioStream)

    // 3. 初始化MediaRecorder
    const options = {
      mimeType: "audio/webm; codecs=opus",
      audioBitsPerSecond: 32000, // 32kbps，语音足够
    }

    try {
      mediaRecorder = new MediaRecorder(audioStream, options)
    } catch (e) {
      console.warn("opus编码不支持，使用默认编码")
      mediaRecorder = new MediaRecorder(audioStream)
    }

    // 4. 设置数据回调 - 使用较小的时间片（200ms）实现低延迟
    const timeslice = 200 // 200ms一个数据块

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        // 检查音量，如果太安静可能不发送（可选）
     
          // console.log("event.data:", event.data)
          onAudioData(event.data)
        
      }
    }

    mediaRecorder.onstart = () => {
      isRecording = true
      console.log("自动录音已开始")
      onStatusChange?.("started", "录音已开始")
    }

    mediaRecorder.onstop = () => {
      isRecording = false
      console.log("录音已停止")
      onStatusChange?.("stopped", "录音已停止")
    }

    mediaRecorder.onerror = (event) => {
      console.error("录音错误:", event)
      onStatusChange?.("error", "录音发生错误")
    }

    // 5. 开始录音
    mediaRecorder.start(timeslice)
  } catch (error: any) {
    console.error("自动录音初始化失败:", error.message)
    onStatusChange?.("error", error.message)
    throw error
  }
}

/**
 * 设置音量检测
 */
function setupVolumeDetection(stream: MediaStream): void {
  try {
    audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)()
    analyser = audioContext.createAnalyser()
    source = audioContext.createMediaStreamSource(stream)

    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.3
    source.connect(analyser)

    console.log("音量检测已初始化")
  } catch (e) {
    console.warn("音量检测初始化失败，将继续录音:", e)
  }
}

/**
 * 获取当前音量水平（0-255）
 */
export function getCurrentVolume(): number {
  if (!analyser) return 0

  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  analyser.getByteFrequencyData(dataArray)

  // 计算平均音量
  let sum = 0
  for (let i = 0; i < bufferLength; i++) {
    sum += dataArray[i] as number
  }
  return sum / bufferLength
}

/**
 * 检测当前是否有足够音量（静音检测）
 */
function shouldSendAudioChunk(): boolean {
  if (!analyser) return true // 如果没有音量检测，始终发送

  const currentVolume = getCurrentVolume()
  const isLoudEnough = currentVolume > currentConfig.silenceThreshold

  // 音量不够时可以选择不发送此数据块
  return isLoudEnough
}

/**
 * 停止录音
 */
export function stopAutoRecording(): void {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop()
  }

  if (audioStream) {
    audioStream.getTracks().forEach((track) => track.stop())
    audioStream = null
  }

  if (audioContext) {
    audioContext.close()
    audioContext = null
  }

  isRecording = false
  console.log("录音已完全停止")
}

/**
 * 处理音频数据块（一句话检测逻辑）
 */
function processAudioChunk(chunk: Blob): void {
  const currentTime = Date.now()
  const currentVolume = getCurrentVolume()
  const isLoud = currentVolume > currentConfig.silenceThreshold

  // 调试信息：每5个数据块输出一次音量信息
  // if (sentenceAudioChunks.length % 5 === 0) {
  //   console.log(
  //     `[DEBUG] 音量: ${currentVolume.toFixed(1)}, 阈值: ${
  //       currentConfig.silenceThreshold
  //     }, 大声: ${isLoud}, 状态: ${sentenceDetectionState}, 静音计时: ${
  //       silenceStartTime > 0 ? currentTime - silenceStartTime + "ms" : "未开始"
  //     }, 峰值: ${volumePeak.toFixed(1)}`
  //   )
  // }

  switch (sentenceDetectionState) {
    case "idle":
      // 等待语音开始
      if (isLoud) {
        // 检测到语音，开始录制
        sentenceDetectionState = "recording"
        speechStartTime = currentTime
        silenceStartTime = 0
        volumePeak = currentVolume // 初始化音量峰值
        sentenceAudioChunks = [chunk]

        console.log(
          `检测到语音开始，音量: ${currentVolume.toFixed(1)}，开始录制一句话`
        )
        onSentenceStart?.()
      }
      break

    case "recording":
      // 正在录制一句话
      sentenceAudioChunks.push(chunk)

      // 更新音量峰值
      if (currentVolume > volumePeak) {
        volumePeak = currentVolume
      }

      // 检查是否超时（句子太长）
      const recordingDuration = currentTime - speechStartTime
      if (recordingDuration > currentConfig.maxSentenceDuration) {
        console.log(
          `句子超时 (${recordingDuration}ms > ${currentConfig.maxSentenceDuration}ms)，强制结束并发送`
        )
        sendSentenceAudio()
        sentenceDetectionState = "idle"
        volumePeak = 0
        break
      }

      // 智能静音检测：结合绝对阈值和相对音量下降
      const isVolumeSignificantlyDropped =
        volumePeak > 0 && currentVolume < volumePeak * 0.4 // 音量下降到峰值的40%
      const shouldConsiderSilence = !isLoud || isVolumeSignificantlyDropped

      console.log(`智能静音检测: ${shouldConsiderSilence}`)

      if (shouldConsiderSilence) {
        // 检测到可能静音（绝对静音或音量显著下降）
        if (silenceStartTime === 0) {
          silenceStartTime = currentTime
          console.log(
            `检测到可能静音，音量: ${currentVolume.toFixed(
              1
            )} (峰值: ${volumePeak.toFixed(1)}), 开始静音计时`
          )
        } else {
          const silenceDuration = currentTime - silenceStartTime
          if (silenceDuration >= currentConfig.silenceDuration) {
            // 静音时间足够长，句子结束
            const speechDuration = silenceStartTime - speechStartTime
            if (speechDuration >= currentConfig.minSpeechDuration) {
              console.log(
                `句子结束，语音时长: ${speechDuration}ms，静音时长: ${silenceDuration}ms，峰值音量: ${volumePeak.toFixed(
                  1
                )}`
              )
              sendSentenceAudio()
            } else {
              console.log(
                `语音太短 (${speechDuration}ms < ${currentConfig.minSpeechDuration}ms)，忽略`
              )
              sentenceAudioChunks = []
            }
            sentenceDetectionState = "idle"
            volumePeak = 0
          } else if (silenceDuration % 500 === 0) {
            // 每500ms输出一次静音计时信息
            console.log(
              `静音计时: ${silenceDuration}ms / ${currentConfig.silenceDuration}ms`
            )
          }
        }
      } else {
        // 音量恢复或保持高位
        if (silenceStartTime > 0) {
          const silenceDuration = currentTime - silenceStartTime
          // 如果静音时间很短（小于300ms），可能是说话中的停顿，不重置计时
          if (silenceDuration < 300) {
            console.log(`短暂停顿 (${silenceDuration}ms)，继续静音计时`)
          } else {
            // 较长的语音恢复，重置静音计时
            silenceStartTime = 0
            console.log(
              `语音恢复，音量: ${currentVolume.toFixed(1)}，重置静音计时`
            )
          }
        }
      }
      break

    case "silence_detected":
      // 这个状态暂时不用，可以合并到recording状态中
      break
  }
}

/**
 * 发送一句话的完整音频
 */
function sendSentenceAudio(): void {
  if (sentenceAudioChunks.length === 0) {
    console.warn("没有音频数据可发送")
    return
  }

  try {
    // 合并所有音频块
    const sentenceBlob = new Blob(sentenceAudioChunks, {
      type: "audio/webm; codecs=opus",
    })

    console.log(
      `发送一句话音频，大小: ${(sentenceBlob.size / 1024).toFixed(
        1
      )}KB, 块数: ${sentenceAudioChunks.length}`
    )

    // 发送给回调函数
    onSentenceAudioData?.(sentenceBlob)

    // 触发句子结束回调
    onSentenceEnd?.()

    // 重置缓冲
    sentenceAudioChunks = []
  } catch (error) {
    console.error("合并音频数据失败:", error)
  }
}

/**
 * 开始一句话检测录音
 */
export async function startSentenceRecording(
  onSentenceData: (sentenceAudio: Blob) => void,
  onStatusChange?: (
    status: "started" | "stopped" | "error",
    message?: string
  ) => void,
  config?: SentenceDetectionConfig,
  onStart?: () => void,
  onEnd?: () => void
): Promise<void> {
  // 保存回调函数
  onSentenceAudioData = onSentenceData
  onSentenceStart = onStart || null
  onSentenceEnd = onEnd || null

  // 更新配置
  if (config) {
    currentConfig = { ...DEFAULT_CONFIG, ...config }
  }

  // 重置状态
  sentenceDetectionState = "idle"
  sentenceAudioChunks = []
  silenceStartTime = 0
  speechStartTime = 0

  // 使用现有的startAutoRecording，但修改数据回调
  return startAutoRecording(
    (chunk) => {
      // 处理音频块（一句话检测逻辑）
      processAudioChunk(chunk)
    },
    onStatusChange,
    config
  )
}

/**
 * 检查是否正在录制一句话
 */
export function isSentenceRecording(): boolean {
  return sentenceDetectionState === "recording"
}

/**
 * 获取当前一句话检测状态
 */
export function getSentenceDetectionState(): SentenceDetectionState {
  return sentenceDetectionState
}

/**
 * 检查是否正在录音
 */
export function isAutoRecording(): boolean {
  return isRecording
}
