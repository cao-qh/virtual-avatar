<template>
  <Transition name="dialog">
    <div class="dialog-mask" v-if="isShow" @click.self="handleMaskClick">
      <div class="dialog-wrapper">
        <div class="dialog-container">
          <!-- 标题栏 -->
          <div class="dialog-header">
            <h2 class="dialog-title">{{ title }}</h2>
            <button class="dialog-close" @click="close">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          
          <!-- 内容区域 -->
          <div class="dialog-content">
            <div v-if="title === '介绍'" class="content-intro">
              <h3>虚拟形象交互系统</h3>
              <p>这是一个基于 Three.js 和 Vue 3 构建的虚拟形象交互系统，具有以下特点：</p>
              <ul>
                <li>🎯 实时 3D 渲染的虚拟形象</li>
                <li>🔊 语音交互功能</li>
                <li>👆 交互式点击检测</li>
                <li>🎨 精美的场景设计</li>
                <li>📱 响应式界面适配</li>
              </ul>
              <p>系统采用现代 Web 技术栈，提供沉浸式的交互体验。</p>
            </div>
            
            <div v-else-if="title === '关于'" class="content-about">
              <div class="about-avatar">
                <div class="avatar-placeholder">👨‍💻</div>
              </div>
              <h3>关于项目</h3>
              <p>这个项目展示了现代 Web 3D 技术的应用，结合了：</p>
              <div class="tech-stack">
                <span class="tech-tag">Vue 3</span>
                <span class="tech-tag">TypeScript</span>
                <span class="tech-tag">Three.js</span>
                <span class="tech-tag">GSAP</span>
                <span class="tech-tag">Vite</span>
              </div>
              <p>项目旨在探索虚拟形象与用户的自然交互方式，为未来的虚拟助手和数字人技术提供参考。</p>
            </div>
            
            <div v-else-if="title === '联系'" class="content-contact">
              <h3>联系我们</h3>
              <p>如果您对这个项目感兴趣，或者有任何建议，欢迎通过以下方式联系：</p>
              <div class="contact-methods">
                <div class="contact-item">
                  <span class="contact-icon">📧</span>
                  <span>邮箱: contact@example.com</span>
                </div>
                <div class="contact-item">
                  <span class="contact-icon">🐙</span>
                  <span>GitHub: github.com/virtual-avatar</span>
                </div>
                <div class="contact-item">
                  <span class="contact-icon">💬</span>
                  <span>Discord: discord.gg/virtual-avatar</span>
                </div>
              </div>
              <p class="contact-note">我们欢迎技术交流、合作建议和反馈意见！</p>
            </div>
            
            <div v-else class="content-default">
              <p>这是一个对话框示例，标题为: <strong>{{ title }}</strong></p>
              <p>对话框内容可以根据不同的标题显示不同的信息。</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang='ts'>
import { ref, onMounted, onUnmounted } from 'vue'

const isShow = ref(false)
const title = ref('')

const open = (tit: string) => {
  title.value = tit
  isShow.value = true
}

const close = () => {
  isShow.value = false
}

const handleMaskClick = () => {
  close()
}

// 键盘事件支持
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && isShow.value) {
    close()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

defineExpose({
  open
})
</script>

<style scoped>
/* 对话框过渡动画 - 纯淡入淡出效果 */
.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.3s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

/* 遮罩层 - 透明黑色，降低不透明度 */
.dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3); /* 透明黑色，不透明度降低 */
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(4px); /* 轻微模糊效果 */
}

/* 对话框包装器 */
.dialog-wrapper {
  max-width: 90%;
  max-height: 90%;
  width: 420px;
}

/* 对话框容器 - 粉色紫色主题 */
.dialog-container {
  background: linear-gradient(135deg, #ffd6e7 0%, #e6d6ff 100%); /* 浅粉色到浅紫色渐变 */
  border-radius: 20px; /* 更圆润的边框 */
  box-shadow: 0 15px 50px rgba(255, 105, 180, 0.3), 
              0 5px 20px rgba(147, 112, 219, 0.2),
              0 0 0 1px rgba(255, 255, 255, 0.3); /* 粉色紫色阴影 */
  overflow: hidden;
  color: #5a3d5c; /* 深紫色文字 */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  border: 1px solid rgba(255, 255, 255, 0.5); /* 白色半透明边框 */
}

/* 标题栏 - 粉色主题 */
.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 22px;
  background: linear-gradient(90deg, #ffb6c1 0%, #d8bfd8 100%); /* 粉色到淡紫色渐变 */
  border-bottom: 2px solid rgba(255, 255, 255, 0.4);
}

.dialog-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #8b008b; /* 深紫色 */
  letter-spacing: 0.5px;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
}

.dialog-close {
  background: rgba(255, 255, 255, 0.7);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #ff69b4; /* 热粉色 */
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(255, 105, 180, 0.3);
}

.dialog-close:hover {
  background: rgba(255, 255, 255, 0.9);
  color: #ff1493; /* 深粉色 */
  transform: rotate(90deg) scale(1.1);
  box-shadow: 0 4px 12px rgba(255, 20, 147, 0.4);
}

/* 内容区域 */
.dialog-content {
  padding: 22px;
  max-height: 350px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.7); /* 半透明白色背景 */
}

.dialog-content h3 {
  margin-top: 0;
  margin-bottom: 14px;
  color: #da70d6; /* 兰花紫 */
  font-size: 17px;
  font-weight: 700;
  border-bottom: 2px solid rgba(218, 112, 214, 0.3);
  padding-bottom: 6px;
}

.dialog-content p {
  margin: 0 0 14px 0;
  line-height: 1.6;
  color: #6a5acd; /* 板岩蓝紫色 */
  font-size: 14px;
}

.dialog-content ul {
  margin: 14px 0;
  padding-left: 20px;
}

.dialog-content li {
  margin-bottom: 8px;
  color: #9370db; /* 中紫色 */
  line-height: 1.5;
  font-size: 14px;
}

/* 介绍内容样式 */
.content-intro ul {
  list-style: none;
  padding-left: 0;
}

.content-intro li {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: rgba(255, 182, 193, 0.2); /* 浅粉色背景 */
  border-radius: 10px;
  border-left: 4px solid #ff69b4; /* 热粉色边框 */
  font-size: 13px;
  transition: all 0.2s ease;
}

.content-intro li:hover {
  background: rgba(255, 182, 193, 0.3);
  transform: translateX(4px);
}

.content-intro li::before {
  margin-right: 10px;
  font-size: 18px;
}

/* 关于内容样式 */
.about-avatar {
  display: flex;
  justify-content: center;
  margin-bottom: 18px;
}

.avatar-placeholder {
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #ff69b4 0%, #9370db 100%); /* 粉色到紫色渐变 */
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  box-shadow: 0 8px 25px rgba(255, 105, 180, 0.4);
  border: 3px solid rgba(255, 255, 255, 0.8);
}

.tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 14px 0;
}

.tech-tag {
  background: linear-gradient(135deg, #ffb6c1 0%, #d8bfd8 100%);
  color: #8b008b;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 8px rgba(139, 0, 139, 0.1);
  transition: all 0.2s ease;
}

.tech-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 0, 139, 0.2);
}

/* 联系内容样式 */
.contact-methods {
  margin: 18px 0;
}

.contact-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 10px;
  transition: all 0.3s ease;
  font-size: 13px;
  border: 1px solid rgba(255, 182, 193, 0.5);
}

.contact-item:hover {
  background: rgba(255, 255, 255, 0.95);
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(255, 182, 193, 0.3);
  border-color: #ff69b4;
}

.contact-icon {
  margin-right: 12px;
  font-size: 20px;
  color: #da70d6;
}

.contact-note {
  margin-top: 18px;
  padding: 12px;
  background: linear-gradient(135deg, rgba(255, 182, 193, 0.3) 0%, rgba(216, 191, 216, 0.3) 100%);
  border-radius: 10px;
  border-left: 4px solid #ff69b4;
  color: #8b008b;
  font-size: 13px;
  font-weight: 500;
}


/* 滚动条样式 - 粉色主题 */
.dialog-content::-webkit-scrollbar {
  width: 6px;
}

.dialog-content::-webkit-scrollbar-track {
  background: rgba(255, 182, 193, 0.2);
  border-radius: 10px;
}

.dialog-content::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #ff69b4 0%, #da70d6 100%);
  border-radius: 10px;
}

.dialog-content::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #ff1493 0%, #c71585 100%);
}

/* 响应式设计 */
@media (max-width: 600px) {
  .dialog-wrapper {
    width: 95%;
    margin: 16px;
  }
  
  .dialog-header,
  .dialog-content {
    padding: 16px;
  }
  
  .dialog-title {
    font-size: 16px;
  }
  
  .tech-stack {
    justify-content: center;
  }
  
  .dialog-content h3 {
    font-size: 16px;
  }
  
  .dialog-content p,
  .dialog-content li,
  .contact-item,
  .contact-note {
    font-size: 13px;
  }
  
  .avatar-placeholder {
    width: 60px;
    height: 60px;
    font-size: 30px;
  }
}
</style>

