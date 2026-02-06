import Component from "../Component"
import GameObject from "../GameObject"
import eventBus from "@/utils/EventBus"

/**
 * 思维
 */
class Thought extends Component {
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
  onQuestionEnd?: (blob: Blob) => void // 新增：处理二进制音频数据

  constructor(
    gameObject: GameObject,
    url: string,
    maxReconnectAttempts: number = 5,
    reconnectInterval: number = 3000
  ) {
    super(gameObject)
    this.url = url
    this.maxReconnectAttempts = maxReconnectAttempts
    this.reconnectInterval = reconnectInterval
    this.connect()
  }

  private connect(): void {
    if (this.isManuallyClosed) return

    try {
      // 发送连接中状态
      eventBus.emit('server-status-changed', 'connecting')
      
      this.socket = new WebSocket(this.url)

      this.socket.onopen = () => {
        console.log("WebSocket连接已建立")
        this.reconnectAttempts = 0
        // 发送已连接状态
        eventBus.emit('server-status-changed', 'connected')
        this.onOpen?.()
      }

      this.socket.onmessage = (event) => {
        if (event.data instanceof Blob) {
          console.log("收到音频 Blob 数据:", event.data)
          this.onQuestionEnd?.(event.data)
        } else {
          // 文本消息（目前服务器不再发送文本，但保留处理）
          console.log("收到服务器文本消息:", event.data)
        }
      }

      this.socket.onclose = () => {
        console.log("WebSocket连接已关闭")
        // 发送断开连接状态
        eventBus.emit('server-status-changed', 'disconnected')
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
        // 发送连接错误状态
        eventBus.emit('server-status-changed', 'error')
        this.onError?.(error)
      }
    } catch (error) {
      console.error("创建WebSocket连接失败:", error)
      // 发送连接错误状态
      eventBus.emit('server-status-changed', 'error')
    }
  }

  /**
   * 发送音频数据
   */
  sendAudioData(data: Blob): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      // 发送思考中状态
      eventBus.emit('avatar-status-changed', 'thinking')
      
      // 设置超时机制（15秒后自动恢复待机状态）
      const timeoutId = setTimeout(() => {
        console.warn("服务器响应超时（15秒），恢复待机状态")
        eventBus.emit('avatar-status-changed', 'idle')
        // 重置回调，避免内存泄漏
        this.onQuestionEnd = undefined
      }, 15000)
      
      // 保存原始回调
      const originalOnQuestionEnd = this.onQuestionEnd
      
      // 设置临时回调，在收到响应时清除超时
      const tempOnQuestionEnd = (blob: Blob) => {
        clearTimeout(timeoutId)
        
        // 检查服务器返回的音频是否有效
        if (blob.size === 0) {
          console.warn("服务器返回空音频数据，恢复待机状态")
          eventBus.emit('avatar-status-changed', 'idle')
          // 恢复原始回调
          this.onQuestionEnd = originalOnQuestionEnd
          return
        }
        
        // 恢复原始回调并调用
        this.onQuestionEnd = originalOnQuestionEnd
        originalOnQuestionEnd?.(blob)
      }
      
      // 设置临时回调
      this.onQuestionEnd = tempOnQuestionEnd
      
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
          clearTimeout(timeoutId)
          eventBus.emit('avatar-status-changed', 'idle')
          // 恢复原始回调
          this.onQuestionEnd = originalOnQuestionEnd
        })
    } else {
      console.warn("WebSocket未连接，音频数据丢失")
      // WebSocket未连接，立即恢复待机状态
      eventBus.emit('avatar-status-changed', 'idle')
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

export default Thought
