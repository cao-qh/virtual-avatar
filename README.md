# Virtual Avatar - 3D 虚拟数字人交互系统

![Virtual Avatar](https://img.shields.io/badge/status-active-success.svg)
![Vue](https://img.shields.io/badge/Vue-3.5-green.svg)
![Three.js](https://img.shields.io/badge/Three.js-0.181-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![Docker](https://img.shields.io/badge/Docker-✓-blue.svg)

Virtual Avatar 是一个基于 Web 的 3D 虚拟数字人交互系统，结合了实时语音对话、3D 场景渲染和 AI 对话能力。用户可以通过语音与虚拟角色进行自然对话，系统会实时处理音频、生成响应并播放语音回复。

## 🌟 功能特性

### 3D 虚拟环境
- **沉浸式场景**：高质量的虚拟房间和角色渲染
- **交互式角色**：可对话的 3D 虚拟数字人
- **相机控制**：支持视角切换和缩放
- **动态光照**：真实的光照和环境效果

### 实时语音交互
- **语音输入**：浏览器麦克风实时录音
- **语音输出**：AI 生成的语音回复播放
- **低延迟**：优化的音频处理管道
- **多格式支持**：WebM/MP3 音频格式转换

### AI 智能对话
- **语音识别**：实时语音转文本（STT）
- **自然语言处理**：大型语言模型对话
- **语音合成**：文本转语音（TTS）
- **上下文感知**：保持对话连贯性

### 用户界面
- **加载状态**：资源加载进度显示
- **对话状态**：实时显示对话状态
- **交互提示**：用户操作引导
- **响应式设计**：适配不同设备

## 🛠 技术栈

### 前端技术
- **框架**：Vue 3 + TypeScript + Vite
- **3D 引擎**：Three.js (v0.181.2)
- **UI 组件**：原生 Vue 组件
- **动画库**：GSAP (v3.14.2)
- **构建工具**：Vite (v7.2.4)

### 后端技术
- **运行时**：Node.js + TypeScript
- **通信协议**：WebSocket (ws v8.18.3)
- **HTTP 客户端**：axios (v1.13.2)
- **音频处理**：fluent-ffmpeg + ffmpeg-static
- **开发工具**：nodemon + ts-node

### 外部服务
- **AI 服务**：SiliconFlow API
  - 语音识别：FunAudioLLM/SenseVoiceSmall
  - 语言模型：Qwen/Qwen3-Next-80B-A3B-Instruct
  - 语音合成：FunAudioLLM/CosyVoice2-0.5B

### 部署运维
- **容器化**：Docker + Docker Compose
- **反向代理**：Nginx (SSL/TLS 支持)
- **网络配置**：自定义 Docker 网络

## 📁 项目结构

```
virtual-avatar/
├── web/                    # 前端应用
│   ├── src/
│   │   ├── components/     # Vue 组件
│   │   │   ├── 2D/        # 2D UI 组件
│   │   │   └── 3D/        # 3D 游戏对象和管理器
│   │   ├── views/         # 页面视图
│   │   └── utils/         # 工具函数
│   └── public/            # 静态资源（模型、纹理、视频）
├── server/                 # 后端服务
│   └── src/               # 服务器源代码
├── memory-bank/           # 项目记忆库（开发文档）
├── compose.yaml           # Docker Compose 配置
├── Dockerfile.frontend    # 前端 Dockerfile
├── Dockerfile.server      # 后端 Dockerfile
└── README.md              # 项目说明文档（当前文件）
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18.x
- npm >= 9.x 或 pnpm >= 8.x
- Docker >= 20.x (可选，用于容器化部署)
- Git >= 2.x

### 本地开发

#### 1. 克隆项目
```bash
git clone <repository-url>
cd virtual-avatar
```

#### 2. 前端开发
```bash
cd web
npm install
npm run dev
```
前端将在 `http://localhost:5173` 运行

#### 3. 后端开发
```bash
cd server
npm install
npm run dev
```
后端 WebSocket 服务器将在 `ws://localhost:3000` 运行

### Docker 开发
```bash
# 构建并启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

## ⚙️ 配置说明

### API 密钥配置
1. 注册 [SiliconFlow](https://siliconflow.cn/) 账户并获取 API 密钥
2. 复制配置文件：
   ```bash
   cp server/src/ApIConfig.json.example server/ApIConfig.json
   ```
3. 编辑 `server/ApIConfig.json`，填入你的 API 密钥：
   ```json
   {
     "APIKey": "your_siliconflow_api_key_here"
   }
   ```

### 环境变量

#### 前端环境变量
```bash
VITE_WS_HOST=wss://caoqihao.com/virtual-avatar-server/  # WebSocket 服务器地址
BASE_URL=/virtual-avatar/                                # 应用基础路径
NODE_ENV=production                                      # 环境模式
```

#### 后端环境变量
```bash
API_KEY=your_siliconflow_api_key  # SiliconFlow API 密钥
PORT=3000                         # 服务器端口
```

### Nginx 配置（生产环境）
项目包含 Nginx 配置示例，支持：
- SSL/TLS 加密
- WebSocket 代理
- 静态文件服务
- 反向代理

## 🐳 部署指南

### Docker 部署
```bash
# 1. 构建镜像
docker-compose build

# 2. 启动服务
docker-compose up -d

# 3. 验证服务
docker-compose ps
docker-compose logs -f
```

### 生产环境部署
1. **配置域名和 SSL**：确保域名解析正确，配置 SSL 证书
2. **更新环境变量**：修改 `compose.yaml` 中的 `VITE_WS_HOST`
3. **构建生产镜像**：`docker-compose build --no-cache`
4. **启动服务**：`docker-compose up -d`
5. **配置 Nginx**：参考 `mynginx/nginx.conf` 示例配置

### 健康检查
- 前端：访问 `https://caoqihao.com/virtual-avatar/`
- 后端：`curl http://localhost:3000/health` (Docker 内部)
- WebSocket：浏览器控制台查看连接状态

## 🔌 API 文档

### WebSocket API
- **连接地址**：`wss://caoqihao.com/virtual-avatar-server/` (生产) 或 `ws://localhost:3000` (开发)
- **消息格式**：二进制音频数据
- **响应格式**：二进制音频数据或 JSON 错误信息

### 错误代码
- `401`：音频识别失败（非语音内容）
- `500`：服务器内部错误
- 连接错误：WebSocket 连接失败

## ❓ 常见问题

### Q: WebSocket 连接失败怎么办？
**A:** 检查以下配置：
1. 确保 `VITE_WS_HOST` 环境变量正确设置
2. 确认 Nginx 配置正确代理 WebSocket 连接
3. 检查防火墙和端口设置
4. 验证 SSL 证书配置

### Q: 音频无法录制或播放？
**A:** 
1. 检查浏览器麦克风权限
2. 确认 Web Audio API 支持
3. 查看浏览器控制台错误信息
4. 验证音频格式兼容性

### Q: AI 对话无响应？
**A:**
1. 确认 API 密钥有效且未过期
2. 检查网络连接和 API 服务状态
3. 查看服务器日志了解错误详情
4. 验证音频数据格式和质量

### Q: 3D 模型加载缓慢？
**A:**
1. 优化模型文件大小（使用 Draco 压缩）
2. 启用浏览器缓存
3. 使用 CDN 加速静态资源
4. 考虑模型 LOD（多层次细节）

## 🤝 贡献指南

我们欢迎社区贡献！请遵循以下步骤：

### 开发流程
1. **Fork 仓库**：创建个人分支
2. **创建分支**：`git checkout -b feature/your-feature`
3. **提交更改**：遵循 Conventional Commits 规范
4. **推送分支**：`git push origin feature/your-feature`
5. **创建 PR**：提交 Pull Request

### 代码规范
- 使用 TypeScript 严格模式
- 遵循 ESLint 代码规范
- 添加必要的代码注释
- 编写单元测试（如适用）

### 提交信息格式
```
feat: 添加新功能
fix: 修复 bug
docs: 更新文档
style: 代码格式调整
refactor: 代码重构
test: 添加测试
chore: 构建过程或辅助工具变动
```

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持与联系

- **问题报告**：[GitHub Issues](https://github.com/cao-qh/virtual-avatar/issues)
- **功能请求**：[GitHub Discussions](https://github.com/cao-qh/virtual-avatar/discussions)
- **文档**：[记忆库](./memory-bank/) 目录
- **演示地址**：`https://caoqihao.com/virtual-avatar/`

## 💝 捐赠支持

Virtual Avatar 是一个开源项目，开发和维护需要投入大量时间和资源。如果您觉得这个项目对您有帮助，欢迎通过以下方式支持项目的持续发展：

### 微信支付
![微信收款码](./img/微信收款码.jpg)

### 支付宝
![支付宝收款码](./img/支付宝收款码.jpg)

### 捐赠用途
- 服务器和域名费用
- AI API 服务费用
- 项目功能开发和优化
- 文档维护和社区支持

每一份支持都是对开源项目的鼓励，感谢您的慷慨！

## 🙏 致谢

- [Three.js](https://threejs.org/) - 强大的 Web 3D 库
- [Vue.js](https://vuejs.org/) - 渐进式 JavaScript 框架
- [SiliconFlow](https://siliconflow.cn/) - AI 模型服务平台
- 所有贡献者和用户的支持
- 特别感谢所有捐赠者的支持

---

**Virtual Avatar** - 让虚拟交互更真实，让数字对话更自然。 🎭✨
