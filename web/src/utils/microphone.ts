// 请求麦克风权限
function requestMicrophonePermission() {
  return new Promise((resolve, reject) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      reject(new Error("浏览器不支持获取媒体设备"))
      return
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        console.log("stream:",stream.getAudioTracks())
        // 权限获取成功，停止流（我们只需要权限）
        // stream.getTracks().forEach((track) => track.stop())
        resolve("麦克风权限已获取")
      })
      .catch(reject)
  })
}

export default requestMicrophonePermission
