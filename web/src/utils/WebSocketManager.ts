class WebSocketManager {
  private url: string
  private maxReconnectAttempts: number
  private reconnectInterval: number
  private socket: WebSocket | null = null
  private reconnectAttempts = 0
  private isManuallyClosed = false
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
  onReconnect?: (attempt: number) => void
  onAudioData?: (blob: Blob) => void // 新增：处理二进制音频数据

  constructor(
    url: string,
    maxReconnectAttempts: number = 5,
    reconnectInterval: number = 3000
  ) {
    this.url = url
    this.maxReconnectAttempts = maxReconnectAttempts
    this.reconnectInterval = reconnectInterval
    this.connect()
  }

  private connect(): void {
    if (this.isManuallyClosed) return

    try {
      this.socket = new WebSocket(this.url)

      this.socket.onopen = () => {
        console.log("WebSocket连接已建立")
        this.reconnectAttempts = 0
        this.onOpen?.()
      }

      this.socket.onmessage = (event) => {
        if (event.data instanceof Blob) {
          console.log("收到音频 Blob 数据:", event.data)
          this.onAudioData?.(event.data)
        } else {
          // 文本消息（目前服务器不再发送文本，但保留处理）
          console.log("收到服务器文本消息:", event.data)
        }
      }

      this.socket.onclose = () => {
        console.log("WebSocket连接已关闭")
        this.onClose?.()

        // 自动重连
        if (
          !this.isManuallyClosed &&
          this.reconnectAttempts < this.maxReconnectAttempts!
        ) {
          this.reconnectAttempts++
          console.log(
            `尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
          )

          this.onReconnect?.(this.reconnectAttempts)

          setTimeout(() => {
            this.connect()
          }, this.reconnectInterval)
        }
      }

      this.socket.onerror = (error) => {
        console.error("WebSocket错误:", error)
        this.onError?.(error)
      }
    } catch (error) {
      console.error("创建WebSocket连接失败:", error)
    }
  }

  /**
   * 等待连接建立
   * @param timeout 超时时间（毫秒）
   */
  waitForOpen(timeout: number = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
      // 如果已经连接，立即解决
      if (this.socket?.readyState === WebSocket.OPEN) {
        resolve()
        return
      }

      // 设置超时
      const timeoutId = setTimeout(() => {
        reject(new Error(`连接超时 (${timeout}ms)`))
      }, timeout)

      // 监听open事件
      const onOpen = () => {
        clearTimeout(timeoutId)
        resolve()
      }

      // 监听错误或关闭
      const onErrorOrClose = () => {
        clearTimeout(timeoutId)
        reject(new Error("连接失败"))
      }

      if (this.socket) {
        this.socket.addEventListener("open", onOpen)
        this.socket.addEventListener("error", onErrorOrClose)
        this.socket.addEventListener("close", onErrorOrClose)
      }
    })
  }

  /**
   * 发送音频数据
   */
  sendAudioData(data: Blob): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      // 转换为ArrayBuffer发送
      data
        .arrayBuffer()
        .then((buffer) => {
          console.log("buffer：", buffer)
          this.socket!.send(buffer)
          console.log("socket发送音频数据成功")
        })
        .catch((error) => {
          console.error("转换音频数据失败:", error)
        })
    } else {
      console.warn("WebSocket未连接，音频数据丢失")
    }
  }

  /**
   * 发送文本消息（用于控制命令或文本对话）
   */
  sendMessage(message: string | object): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const text =
        typeof message === "string" ? message : JSON.stringify(message)
      this.socket.send(text)
    }
  }

  /**
   * 关闭连接
   */
  close(): void {
    this.isManuallyClosed = true
    if (this.socket) {
      this.socket.close()
    }
  }

  /**
   * 获取连接状态
   */
  getState() {
    if (!this.socket) return "closed"

    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return "connecting"
      case WebSocket.OPEN:
        return "open"
      case WebSocket.CLOSING:
        return "closing"
      case WebSocket.CLOSED:
        return "closed"
      default:
        return "closed"
    }
  }
}

export default WebSocketManager
