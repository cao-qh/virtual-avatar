import WebSocket from 'ws';

// 创建 WebSocket 服务器，监听 3000 端口
const wss = new WebSocket.Server({ port: 3000 });

wss.on('connection', (ws) => {
    console.log('客户端已连接');

    // 接收客户端消息
    ws.on('message', (message) => {
        console.log('收到客户端消息:', message.toString());
        ws.send(`服务器收到: ${message}`);
    });

    // 连接关闭
    ws.on('close', () => {
        console.log('客户端已断开连接');
    });

    // 错误处理
    ws.on('error', (err) => {
        console.error('WebSocket 错误:', err.message);
    });
});

console.log('WebSocket 服务器运行在 ws://localhost:3000');
