import dayjs from "dayjs"

/**
 * 保存音频到文件
 * @param audioBlob 音频数据（Blob格式）
 */
export  function saveAudioToFile(audioBlob: Blob): void {
  try {
    // 生成文件名：录音_YYYY-MM-DD_HH-mm-ss.webm
    const filename = `录音_${dayjs().format("YYYY-MM-DD_HH-mm-ss")}.webm`

    // 创建下载链接
    const url = URL.createObjectURL(audioBlob)
    const a = document.createElement("a")
    a.style.display = "none"
    a.href = url
    a.download = filename

    // 添加到文档并触发点击
    document.body.appendChild(a)
    a.click()

    // 清理
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 100)
    console.log("保存音频文件成功:", filename)
  } catch (error) {
    console.error("保存音频文件失败:", error)
  }
}
