<template>
  <div style="width: 100%;height: 100%;">
    <MessageText />
    <ThreeView />
  </div>
</template>

<script setup lang='ts'>
import { onMounted, onUnmounted } from 'vue'
import MessageText from './components/2D/MessageText.vue';
import ThreeView from './components/2D/ThreeView.vue';
import { startAutoRecording, stopAutoRecording } from '@/utils/microphone';
import { createDefaultWebSocket, closeDefaultWebSocket } from '@/utils/wSocket';

onMounted(async () => {
  console.log("虚拟人应用启动，开始自动录音...");

  try {
    // 1. 创建WebSocket连接
    console.log("正在连接WebSocket服务器...");
    const wsManager = createDefaultWebSocket("ws://localhost:3000");

    // 等待WebSocket连接建立
    const waitForConnection = () => {
      return new Promise<void>((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (wsManager.getState() === 'open') {
            clearInterval(checkInterval);
            console.log("WebSocket连接已建立");
            resolve();
          } else if (wsManager.getState() === 'closed') {
            clearInterval(checkInterval);
            reject(new Error("WebSocket连接失败"));
          }
        }, 100);

        // 10秒超时
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error("WebSocket连接超时"));
        }, 10000);
      });
    };

    await waitForConnection();

    // 2. 开始自动录音
    console.log("正在获取麦克风权限并开始录音...");
    await startAutoRecording(
      // 音频数据回调：实时发送到服务器
      (audioChunk) => {
        wsManager.sendAudioData(audioChunk);
      },
      // 状态回调（可选，只记录日志）
      (status, message) => {
        if (status === 'started') {
          console.log("自动录音已开始，正在实时传输音频...");
        } else if (status === 'error') {
          console.error("录音错误:", message);
        }
      }
    );

  } catch (error: any) {
    console.error("应用初始化失败:", error.message);
    // 可以在这里添加错误处理，比如显示Toast通知
  }
});

// 组件卸载时清理资源
onUnmounted(() => {
  console.log("清理录音和WebSocket资源...");
  stopAutoRecording();
  closeDefaultWebSocket();
});
</script>

<style scoped>
#c {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
