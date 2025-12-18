// server/src/app.ts
import WebSocket from "ws"
import fs from "fs"
import path from "path"
import os from "os"
import ffmpeg from "fluent-ffmpeg"
import ffmpegStatic from "ffmpeg-static"
import { Logger } from "./utils/logger"
import { ClientManager } from "./clientManager"

// 确保录音目录存在
const recordingsDir = path.join(__dirname, "recordings")
if (!fs.existsSync(recordingsDir)) {
  fs.mkdirSync(recordingsDir, { recursive: true })
  Logger.info(`创建录音目录`, { path: recordingsDir })
}

// 设置 ffmpeg 路径
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic as string)
  Logger.debug("FFmpeg 路径已设置", { path: ffmpegStatic })
} else {
  Logger.warn("ffmpeg-static 未找到，将使用系统 ffmpeg")
}

// 初始化客户端管理器
const clientManager = new ClientManager()

// 创建WebSocket服务器
const wss = new WebSocket.Server({
  port: 3000,
  perMessageDeflate: false, // 禁用压缩，避免音频数据损坏
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
  saveAudioChunk(session, buffer).catch((err) => {
    Logger.error("保存音频数据块时发生错误", {
      clientId: session.id.substring(0, 12) + "...",
      error: err.message,
    })
  })
}

/**
 * 将 WebM 音频 Buffer 转换为 MP3 文件
 */
async function convertToMp3(
  inputBuffer: Buffer,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    // 创建临时文件
    const tempDir = os.tmpdir()
    const tempFilePath = path.join(
      tempDir,
      `temp_${Date.now()}_${Math.random().toString(36).substring(2)}.webm`
    )

    fs.writeFile(tempFilePath, inputBuffer, (err) => {
      if (err) {
        return reject(err)
      }

      // 使用 ffmpeg 转换
      ffmpeg(tempFilePath)
        .audioCodec("libmp3lame")
        .audioBitrate(128)
        .audioChannels(1)
        .audioFrequency(44100)
        .format("mp3")
        .on("end", () => {
          // 删除临时文件
          fs.unlink(tempFilePath, (unlinkErr) => {
            if (unlinkErr) {
              Logger.warn("删除临时文件失败", {
                path: tempFilePath,
                error: unlinkErr.message,
              })
            }
            resolve()
          })
        })
        .on("error", (ffmpegErr) => {
          // 删除临时文件
          fs.unlink(tempFilePath, (unlinkErr) => {
            if (unlinkErr) {
              Logger.warn("删除临时文件失败", {
                path: tempFilePath,
                error: unlinkErr.message,
              })
            }
          })
          reject(ffmpegErr)
        })
        .save(outputPath)
    })
  })
}

/**
 * 保存音频数据块为 MP3 格式
 */
async function saveAudioChunk(session: any, chunk: Buffer): Promise<void> {
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

    const filename = `${Date.now()}_${session.audioStats.totalChunks}.mp3`
    const filepath = path.join(clientDir, filename)

    // 转换为 MP3
    await convertToMp3(chunk, filepath)

    Logger.debug("音频文件保存为 MP3", {
      clientId: session.id.substring(0, 8) + "...",
      filepath,
      size: chunk.length,
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

  Logger.info("服务器关闭摘要", {
    活跃客户端数: activeClients,
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
