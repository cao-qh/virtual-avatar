// server/src/app.ts
import WebSocket from "ws"
import fs from "fs"
import path from "path"
import { Logger } from "./utils/logger"
import { ClientManager } from "./clientManager"

// 确保录音目录存在
const recordingsDir = path.join(__dirname, "recordings")
if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir, { recursive: true })
  Logger.info(`创建录音目录`, { path: recordingsDir })
}

// 初始化客户端管理器
const clientManager = new ClientManager()

// 创建WebSocket服务器
const wss = new WebSocket.Server({
  port: 3000,
  perMessageDeflate: false, // 禁用压缩，避免音频数据损坏
})

Logger.info("🎤 虚拟人音频服务器启动", {
  port: 3000,
  recordingsDir,
  mode: "纯音频模式（无控制消息）",
})

wss.on("connection", (ws, req) => {
  // 生成客户端ID
  const clientId = `client_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2, 11)}`
  const clientIp = req.socket.remoteAddress || "unknown"

  // 创建客户端会话
  const session = clientManager.createClient(clientId, clientIp)

  Logger.info("🔌 新客户端连接", {
    clientId: clientId.substring(0, 12) + "...",
    ip: clientIp,
    time: new Date().toLocaleTimeString(),
  })

  // 发送简单的连接确认（可选）
  ws.send(Buffer.from([0x01])) // 发送单个字节作为确认

  // 处理消息 - 只处理二进制音频数据
  ws.on("message", (data) => {
    try {
      // 更新最后活动时间
      session.lastActivity = new Date()

      // 只处理二进制数据
      if (data instanceof Buffer || data instanceof ArrayBuffer) {
        handleAudioData(session, data)
      }
    } catch (error: any) {
      Logger.error("处理音频数据时出错", {
        clientId: session.id.substring(0, 12) + "...",
        error: error.message,
      })
    }
  })

  // 连接关闭
  ws.on("close", () => {
    clientManager.removeClient(clientId)
  })

  // 错误处理
  ws.on("error", (error) => {
    Logger.error("WebSocket连接错误", {
      clientId: session.id.substring(0, 12) + "...",
      error: error.message,
    })
  })
})

/**
 * 处理音频数据 - 简化版
 */
function handleAudioData(session: any, data: Buffer | ArrayBuffer): void {
  const buffer = data instanceof ArrayBuffer ? Buffer.from(data) : data
  const chunkSize = buffer.length

  // 更新统计信息
  clientManager.updateAudioStats(session.id, chunkSize)

  const totalMB = (session.audioStats.totalBytes / 1024 / 1024).toFixed(2)
  const avgKB = (session.audioStats.averageChunkSize / 1024).toFixed(2)

  Logger.info("🎵 音频数据统计", {
    clientId: session.id.substring(0, 12) + "...",
    数据块数: session.audioStats.totalChunks,
    总数据量: `${totalMB} MB`,
    平均块大小: `${avgKB} KB`,
    频率: `${session.audioStats.chunksPerSecond.toFixed(1)} 块/秒`,
    运行时间: `${Math.round(
      (Date.now() - session.connectedAt.getTime()) / 1000
    )} 秒`,
  })

  // 保存音频数据（可选，根据需求开启）
   saveAudioChunk(session, buffer);
}

/**
 * 保存音频数据块（可选功能）
 */
function saveAudioChunk(session: any, chunk: Buffer): void {
  try {
    // 为每个客户端按日期分目录保存
    const dateStr = new Date().toISOString().split("T")[0]
    const clientDir = path.join(
      recordingsDir,
      session.id.substring(0, 8),
      dateStr
    )

    if (!fs.existsSync(clientDir)) {
      fs.mkdirSync(clientDir, { recursive: true })
    }

    const filename = `${Date.now()}_${session.audioStats.totalChunks}.webm`
    const filepath = path.join(clientDir, filename)

    fs.writeFile(filepath, chunk, (err) => {
      if (err) {
        Logger.error("保存音频文件失败", {
          clientId: session.id.substring(0, 8) + "...",
          error: err.message,
        })
      }
    })
  } catch (error: any) {
    Logger.error("保存音频数据块失败", {
      clientId: session.id.substring(0, 8) + "...",
      error: error.message,
    })
  }
}

/**
 * 优雅关闭处理
 */
process.on("SIGINT", () => {
  Logger.info("🛑 收到关闭信号，正在清理...")

  const activeClients = clientManager.getActiveClientCount()
  const allClients = clientManager.getAllClients()
  const totalChunks = allClients.reduce(
    (sum, c) => sum + c.audioStats.totalChunks,
    0
  )
  const totalBytes = allClients.reduce(
    (sum, c) => sum + c.audioStats.totalBytes,
    0
  )

  Logger.info("服务器关闭摘要", {
    活跃客户端数: activeClients,
    总数据块数: totalChunks,
    总数据量: `${(totalBytes / 1024 / 1024).toFixed(2)} MB`,
    运行时长: `${Math.round(process.uptime())} 秒`,
  })

  clientManager.cleanup()

  setTimeout(() => {
    Logger.info("👋 服务器关闭完成")
    process.exit(0)
  }, 1000)
})

// 服务器启动完成
Logger.info("✅ WebSocket服务器运行中", {
  url: "ws://localhost:3000",
  模式: "纯音频接收模式",
  说明: "只接收二进制音频数据，忽略所有文本消息",
})
