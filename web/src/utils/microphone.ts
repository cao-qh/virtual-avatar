// 录音机
let mediaRecorder: MediaRecorder | null = null
// 音频流
let audioStream: MediaStream | null = null
// 是否在录音
let isRecording = false

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
  ) => void
): Promise<void> {
  try {
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
        if (shouldSendAudioChunk()) {
          onAudioData(event.data)
        }
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
 * 检测当前是否有足够音量（静音检测）
 */
function shouldSendAudioChunk(): boolean {
  if (!analyser) return true // 如果没有音量检测，始终发送

  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)
  analyser.getByteFrequencyData(dataArray)

  // 计算平均音量
  let sum = 0
  for (let i = 0; i < bufferLength; i++) {
    sum += dataArray[i] as number
  }
  const average = sum / bufferLength

  // 阈值可以根据实际情况调整
  const volumeThreshold = 20
  const isLoudEnough = average > volumeThreshold

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
 * 检查是否正在录音
 */
export function isAutoRecording(): boolean {
  return isRecording
}
