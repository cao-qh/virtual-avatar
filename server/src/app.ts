// server/src/app.ts
import WebSocket from "ws"
import fs from "fs"
import path from "path"
import os from "os"
import ffmpeg from "fluent-ffmpeg"
import ffmpegStatic from "ffmpeg-static"
import axios from "axios"
import FormData from "form-data"
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
  // 将 WebSocket 连接附加到会话
  ;(session as any).ws = ws

  Logger.info("🔌 新客户端连接", {
    clientId: clientId.substring(0, 12) + "...",
    ip: clientIp,
    time: new Date().toLocaleTimeString(),
  })

  // 发送简单的连接确认（可选）
  //ws.send(Buffer.from([0x01])) // 发送单个字节作为确认

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
async function handleAudioData(session: any, data: Buffer | ArrayBuffer) {
  const buffer = data instanceof ArrayBuffer ? Buffer.from(data) : data
  const chunkSize = buffer.length

  // 更新统计信息
  clientManager.updateAudioStats(session.id, chunkSize)


  Logger.info("🎵 音频数据统计", {
    clientId: session.id.substring(0, 12) + "...",
    运行时间: `${Math.round(
      (Date.now() - session.connectedAt.getTime()) / 1000
    )} 秒`,
  })

  try {
    // 转换音频为 MP3 Buffer
    const mp3Buffer = await convertAudioChunkToMp3(session, buffer)
    if (mp3Buffer && session.ws) {
      // 处理音频：TTS 识别 → LLM 生成 → 发送给客户端
      processAudioWithTTSAndLLM(mp3Buffer, session.id, session.ws).catch(err => {
        Logger.error("处理音频失败", {
          clientId: session.id.substring(0, 12) + "...",
          error: err.message,
        })
      })
    }
  } catch (err) {
    Logger.error("处理音频数据块时发生错误", {
      clientId: session.id.substring(0, 12) + "...",
      error: err.message,
    })
  }
}

/**
 * 将 WebM 音频 Buffer 转换为 MP3 Buffer
 */
async function convertWebmToMp3Buffer(inputBuffer: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const tempDir = os.tmpdir()
    const tempWebmPath = path.join(
      tempDir,
      `temp_${Date.now()}_${Math.random().toString(36).substring(2)}.webm`
    )
    const tempMp3Path = path.join(
      tempDir,
      `temp_${Date.now()}_${Math.random().toString(36).substring(2)}.mp3`
    )

    // 写入临时 WebM 文件
    fs.writeFile(tempWebmPath, inputBuffer, (err) => {
      if (err) {
        return reject(err)
      }

      // 使用 ffmpeg 转换
      ffmpeg(tempWebmPath)
        .audioCodec("libmp3lame")
        .audioBitrate(128)
        .audioChannels(1)
        .audioFrequency(44100)
        .format("mp3")
        .on("end", () => {
          // 读取 MP3 文件内容
          fs.readFile(tempMp3Path, (readErr, mp3Buffer) => {
            // 清理临时文件
            fs.unlink(tempWebmPath, (unlinkErr) => {
              if (unlinkErr) {
                Logger.warn("删除临时 WebM 文件失败", {
                  path: tempWebmPath,
                  error: unlinkErr.message,
                })
              }
            })
            fs.unlink(tempMp3Path, (unlinkErr) => {
              if (unlinkErr) {
                Logger.warn("删除临时 MP3 文件失败", {
                  path: tempMp3Path,
                  error: unlinkErr.message,
                })
              }
            })

            if (readErr) {
              reject(readErr)
            } else {
              resolve(mp3Buffer)
            }
          })
        })
        .on("error", (ffmpegErr) => {
          // 清理临时文件
          fs.unlink(tempWebmPath, (unlinkErr) => {
            if (unlinkErr) {
              Logger.warn("删除临时 WebM 文件失败", {
                path: tempWebmPath,
                error: unlinkErr.message,
              })
            }
          })
          reject(ffmpegErr)
        })
        .save(tempMp3Path)
    })
  })
}

/**
 * 转换音频数据块为 MP3 Buffer
 */
async function convertAudioChunkToMp3(session: any, chunk: Buffer): Promise<Buffer | null> {
  try {
    const mp3Buffer = await convertWebmToMp3Buffer(chunk)
    Logger.debug("音频数据转换为 MP3 Buffer", {
      clientId: session.id.substring(0, 8) + "...",
      size: mp3Buffer.length,
    })
    return mp3Buffer
  } catch (error: any) {
    Logger.error("转换音频数据块失败", {
      clientId: session.id.substring(0, 8) + "...",
      error: error.message,
    })
    return null
  }
}

/**
 * 处理音频：TTS 识别 → LLM 生成 → 发送给客户端
 */
async function processAudioWithTTSAndLLM(mp3Buffer: Buffer, clientId: string, ws: WebSocket): Promise<void> {
  let ttsText = ''
  try {
    // 1. TTS 识别
    const form = new FormData()
    form.append('file', mp3Buffer, {
      filename: 'audio.mp3',
      contentType: 'audio/mpeg'
    })
    form.append('model', 'FunAudioLLM/SenseVoiceSmall')

    const ttsResponse = await axios.post(
      'https://api.siliconflow.cn/v1/audio/transcriptions',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': 'Bearer sk-lmtnyslrfqrrcwkadnrbhhfopohuevcgaeyjmcqrvneouqxn'
        }
      }
    )

    ttsText = ttsResponse.data?.text || ''
    Logger.info('TTS 识别结果', { clientId: clientId.substring(0, 8) + '...', text: ttsText })

    if (!ttsText.trim()) {
      // 如果识别结果为空，直接返回
      // if (ws.readyState === WebSocket.OPEN) {
      //   ws.send(JSON.stringify({ type: 'transcription', text: '' }))
      // }
      return
    }

    // 2. LLM 处理
    const llmResponse = await axios.post(
      'https://api.siliconflow.cn/v1/chat/completions',
      {
        model: 'THUDM/glm-4-9b-chat',
        messages: [
          {
            role: 'system',
            content: '你是一个知心好友，虽然话不多，但是充满了温暖。'
          },
          {
            role: 'user',
            content: ttsText
          }
        ],
        stream: false,
        max_tokens: 4096,
        temperature: 0.7,
        top_p: 0.7,
        top_k: 50,
        frequency_penalty: 0.5,
        n: 1,
        response_format: { type: 'text' },
        enable_thinking: false,
        thinking_budget: 4096,
        min_p: 0.05,
        stop: null,
        tools: []
      },
      {
        headers: {
          'Authorization': 'Bearer sk-lmtnyslrfqrrcwkadnrbhhfopohuevcgaeyjmcqrvneouqxn',
          'Content-Type': 'application/json'
        }
      }
    )

    const llmText = llmResponse.data?.choices?.[0]?.message?.content || ''
    Logger.info('LLM 回复', { clientId: clientId.substring(0, 8) + '...', text: llmText })

    if (!llmText.trim()) {
      // 如果 LLM 回复为空，直接返回
      return
    }

    // 3. TTS 合成：将 LLM 文本转换为语音
    const ttsSpeechResponse = await axios.post(
      'https://api.siliconflow.cn/v1/audio/speech',
      {
        model: 'FunAudioLLM/CosyVoice2-0.5B',
        input: llmText,
        voice: 'FunAudioLLM/CosyVoice2-0.5B:claire',
        response_format: 'mp3',
        sample_rate: 32000,
        stream: false,
        speed: 1,
        gain: 0,
        max_tokens: 4096,
        references: []
      },
      {
        headers: {
          'Authorization': 'Bearer sk-lmtnyslrfqrrcwkadnrbhhfopohuevcgaeyjmcqrvneouqxn',
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    )
  
    Logger.info('TTS 合成完成')

    // 4. 发送音频二进制数据给客户端
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(ttsSpeechResponse.data)
    }
  } catch (error: any) {
    Logger.error('处理音频失败', {
      clientId: clientId.substring(0, 8) + '...',
      error: error.message,
    })
    // 如果失败，尝试发送原始 TTS 文本作为回退
    if (ttsText && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'transcription', text: ttsText }))
    }
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
