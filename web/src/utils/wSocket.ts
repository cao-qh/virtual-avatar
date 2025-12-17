// web/src/utils/wSocket.ts

interface WebSocketManagerOptions {
  url: string
  onOpen?: () => void
  onClose?: () => void
  onError?: (error: Event) => void
  onReconnect?: (attempt: number) => void
  maxReconnectAttempts?: number
  reconnectInterval?: number
}

class WebSocketManager {
  private socket: WebSocket | null = null
  private options: WebSocketManagerOptions
  private reconnectAttempts = 0
  private isManuallyClosed = false

  constructor(options: WebSocketManagerOptions) {
    this.options = {
      maxReconnectAttempts: 5,
      reconnectInterval: 3000,
      ...options,
    }

    this.connect()
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

  private connect(): void {
    if (this.isManuallyClosed) return

    try {
      this.socket = new WebSocket(this.options.url)

      this.socket.onopen = () => {
        console.log("WebSocket连接已建立")
        this.reconnectAttempts = 0
        this.options.onOpen?.()
      }

      this.socket.onmessage = (event) => {
        console.log("收到服务器消息:", event.data)
        // 这里可以处理服务器响应，比如虚拟人的回复
      }

      this.socket.onclose = () => {
        console.log("WebSocket连接已关闭")
        this.options.onClose?.()

        // 自动重连
        if (
          !this.isManuallyClosed &&
          this.reconnectAttempts < this.options.maxReconnectAttempts!
        ) {
          this.reconnectAttempts++
          console.log(
            `尝试重连 (${this.reconnectAttempts}/${this.options.maxReconnectAttempts})...`
          )

          this.options.onReconnect?.(this.reconnectAttempts)

          setTimeout(() => {
            this.connect()
          }, this.options.reconnectInterval)
        }
      }

      this.socket.onerror = (error) => {
        console.error("WebSocket错误:", error)
        this.options.onError?.(error)
      }
    } catch (error) {
      console.error("创建WebSocket连接失败:", error)
    }
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
          this.socket!.send(buffer)
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
  getState(): "connecting" | "open" | "closing" | "closed" {
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

// 创建默认实例
let defaultManager: WebSocketManager | null = null

/**
 * 创建默认WebSocket连接
 */
export function createDefaultWebSocket(
  url: string = "ws://localhost:3000"
): WebSocketManager {
  if (defaultManager) {
    console.warn("WebSocket连接已存在，返回现有实例")
    return defaultManager
  }

  defaultManager = new WebSocketManager({
    url,
    onOpen: () => {
      console.log("默认WebSocket连接已就绪")
    },
    onReconnect: (attempt) => {
      console.log(`第${attempt}次重连尝试`)
    },
  })

  return defaultManager
}

/**
 * 获取默认WebSocket管理器
 */
export function getDefaultWebSocketManager(): WebSocketManager | null {
  return defaultManager
}

/**
 * 关闭默认WebSocket连接
 */
export function closeDefaultWebSocket(): void {
  if (defaultManager) {
    defaultManager.close()
    defaultManager = null
  }
}

export default WebSocketManager
