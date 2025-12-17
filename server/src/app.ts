import WebSocket from "ws"
import fs from "fs"
import path from "path"

// 创建 WebSocket 服务器，监听 3000 端口
const wss = new WebSocket.Server({ port: 3000 })

wss.on("connection", (ws) => {
  console.log("客户端已连接")

  // 接收客户端消息
  ws.on("message", (message) => {
    // 检查是否是二进制数据（音频）
    if (message instanceof Buffer) {
      console.log("收到音频数据，大小:", message.length, "字节")

      // 保存为文件
      const timestamp = Date.now()
      const filename = `audio_${timestamp}.webm`
      const filepath = path.join(__dirname, "recordings", filename)

      fs.writeFile(filepath, message, (err) => {
        if (err) console.error("保存音频文件失败:", err)
        else console.log("音频文件已保存:", filename)
      })

      // 或者实时处理音频
      // processAudioData(message);
    } else {
      console.log("收到文本消息:", message.toString())
      ws.send(`服务器收到: ${message}`)
    }
  })

  // 连接关闭
  ws.on("close", () => {
    console.log("客户端已断开连接")
  })

  // 错误处理
  ws.on("error", (err) => {
    console.error("WebSocket 错误:", err.message)
  })
})

console.log("WebSocket 服务器运行在 ws://localhost:3000")
