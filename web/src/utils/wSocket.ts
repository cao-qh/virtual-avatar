function createWebSocket(url: string): WebSocket {
  // 连接 WebSocket 服务器 ws://localhost:3000
  const socket = new WebSocket(url)

  socket.onopen = () => {
    console.log("已连接到服务器")

    socket.send("ssss")
  }

  socket.onmessage = (event) => {
    console.log("收到服务器消息: " + event.data)
  }

  socket.onclose = () => {
    console.log("连接已关闭")
  }

  socket.onerror = (error) => {
    console.log("WebSocket 错误: " + error)
  }

  return socket
}

export default createWebSocket
