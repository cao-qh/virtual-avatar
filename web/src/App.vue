<template>
  <div style="width: 100%;height: 100%;position: relative;">
    <!-- 状态显示面板 -->
    <div style="position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.7); color: white; padding: 10px; border-radius: 5px; z-index: 1000; font-size: 14px;">
      <div>录音状态: {{ sentenceState }}</div>
      <div>当前音量: {{ volume.toFixed(1) }}</div>
      <div>阈值: {{ config.silenceThreshold }}</div>
      <div>静音时间: {{ config.silenceDuration }}ms</div>
    </div>
    
    <MessageText />
    <!-- <ThreeView /> -->
  </div>
</template>

<script setup lang='ts'>
import { onMounted, onUnmounted, ref } from 'vue'
import MessageText from './components/2D/MessageText.vue';
// import ThreeView from './components/2D/ThreeView.vue';
import { startSentenceRecording, stopAutoRecording,getCurrentVolume } from '@/utils/microphone';
import { createDefaultWebSocket, closeDefaultWebSocket } from '@/utils/wSocket';

// 状态显示
const sentenceState = ref<string>('等待语音...');
const volume = ref<number>(0);
const config = ref({
  silenceThreshold: 18,
  silenceDuration: 800,
  minSpeechDuration: 300,
  maxSentenceDuration: 8000
});

// 定时更新音量显示
let volumeInterval: number | null = null;

onMounted(async () => {
  console.log("虚拟人应用启动，开始一句话检测录音...");
  
  try {
    // 1. 创建WebSocket连接
    console.log("正在连接WebSocket服务器...");
    const wsManager = createDefaultWebSocket("ws://localhost:3000");
    
    // 2. 等待连接建立（简洁版）
    console.log("等待WebSocket连接...");
    await wsManager.waitForOpen(10000);
    console.log("WebSocket连接已建立");
    
    // 3. 开始一句话检测录音
    await startSentenceRecording(
      // 一句话音频数据回调：发送完整句子到服务器
      (sentenceAudio) => {
        console.log("检测到一句话，发送完整音频到服务器");
        wsManager.sendAudioData(sentenceAudio);
      },
      // 状态回调（可选）
      (status, message) => {
        if (status === 'started') {
          console.log("一句话检测录音已开始，等待语音...");
          sentenceState.value = '等待语音...';
          // 开始更新音量显示
          startVolumeMonitoring();
        } else if (status === 'error') {
          console.error("录音错误:", message);
          sentenceState.value = '错误: ' + message;
          stopVolumeMonitoring();
        }
      },
      // 配置（使用优化后的值）
      config.value,
      // 句子开始回调
      () => {
        console.log("检测到语音开始，正在录制...");
        sentenceState.value = '正在录制...';
      },
      // 句子结束回调
      () => {
        console.log("句子结束，等待下一句话...");
        sentenceState.value = '等待下一句话...';
      }
    );
    
  } catch (error: any) {
    console.error("应用初始化失败:", error.message);
    sentenceState.value = '初始化失败: ' + error.message;
  }
});

/**
 * 开始音量监控（用于UI显示）
 */
function startVolumeMonitoring(): void {
  if (volumeInterval) {
    clearInterval(volumeInterval);
  }
  
  volumeInterval = window.setInterval(() => {
    // 这里我们无法直接获取音量，因为getCurrentVolume不是导出的
    // 在实际应用中，可能需要修改microphone.ts来导出音量信息
    // 暂时使用0
    volume.value = getCurrentVolume();
  }, 200);
}

/**
 * 停止音量监控
 */
function stopVolumeMonitoring(): void {
  if (volumeInterval) {
    clearInterval(volumeInterval);
    volumeInterval = null;
  }
}

// 组件卸载时清理资源
onUnmounted(() => {
  console.log("清理录音和WebSocket资源...");
  stopAutoRecording();
  closeDefaultWebSocket();
  stopVolumeMonitoring();
});
</script>

<style scoped>
#c {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
