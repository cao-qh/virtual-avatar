# 技术上下文

## 技术栈概览

### 前端技术栈
- **框架**：Vue 3 + TypeScript + Vite
- **3D 引擎**：Three.js (v0.181.2)
- **UI 库**：原生 Vue 组件
- **动画**：GSAP (v3.14.2)
- **工具库**：Day.js (v1.11.19)
- **构建工具**：Vite (v7.2.4)
- **包管理**：npm / pnpm

### 后端技术栈
- **运行时**：Node.js + TypeScript
- **WebSocket**：ws (v8.18.3)
- **HTTP 客户端**：axios (v1.13.2)
- **音频处理**：fluent-ffmpeg + ffmpeg-static
- **开发工具**：nodemon + ts-node
- **包管理**：npm

### 外部服务
- **AI 服务**：SiliconFlow API
  - 语音识别：FunAudioLLM/SenseVoiceSmall
  - 语言模型：Qwen/Qwen3-Next-80B-A3B-Instruct
  - 语音合成：FunAudioLLM/CosyVoice2-0.5B
- **部署**：Docker + Docker Compose

### 开发工具
- **IDE**：Visual Studio Code
- **版本控制**：Git
- **代码质量**：TypeScript 类型检查
- **调试工具**：浏览器开发者工具

## 开发环境设置

### 系统要求
- **Node.js**：>= 18.x
- **npm**：>= 9.x 或 pnpm >= 8.x
- **Docker**：>= 20.x (可选，用于容器化部署)
- **Git**：>= 2.x

### 环境变量
#### 前端环境变量
```bash
VITE_WS_HOST=ws://localhost:3000  # WebSocket 服务器地址
BASE_URL=/                         # 应用基础路径
NODE_ENV=development              # 环境模式
```

#### 后端环境变量
```bash
API_KEY=your_siliconflow_api_key  # SiliconFlow API 密钥
PORT=3000                         # 服务器端口
```

### 配置文件
#### 前端配置
- `web/package.json` - 依赖和脚本
- `web/vite.config.ts` - 构建配置
- `web/tsconfig.json` - TypeScript 配置
- `web/src/Config/textureConfig.ts` - 纹理配置

#### 后端配置
- `server/package.json` - 依赖和脚本
- `server/tsconfig.json` - TypeScript 配置
- `server/ApIConfig.json` - API 密钥配置
- `server/src/ApIConfig.json.example` - 配置示例

#### 部署配置
- `compose.yaml` - Docker Compose 配置
- `Dockerfile.frontend` - 前端 Dockerfile
- `Dockerfile.server` - 后端 Dockerfile

## 项目结构详解

### 前端目录结构
```
web/
├── src/
│   ├── App.vue                    # 根组件
│   ├── main.ts                    # 应用入口
│   ├── style.css                  # 全局样式
│   ├── assets/                    # 静态资源
│   ├── components/                # 组件目录
│   │   ├── 2D/                    # 2D UI 组件
│   │   │   ├── Dialog.vue         # 对话框组件
│   │   │   ├── Loading.vue        # 加载组件
│   │   │   ├── MessageText.vue    # 消息文本组件
│   │   │   └── Status.vue         # 状态组件
│   │   └── 3D/                    # 3D 组件
│   │       ├── Avatar/            # 虚拟角色组件
│   │       │   ├── Ear.ts         # 耳朵组件
│   │       │   ├── index.ts       # 角色主组件
│   │       │   ├── Mouth.ts       # 嘴巴组件
│   │       │   └── Thought.ts     # 思考组件
│   │       ├── CameraManager.ts   # 相机管理器
│   │       ├── Component.ts       # 组件基类
│   │       ├── GameManager.ts     # 游戏管理器
│   │       ├── GameObject.ts      # 游戏对象
│   │       ├── GameObjectManager.ts # 游戏对象管理器
│   │       ├── Home.ts            # 房间组件
│   │       ├── Light.ts           # 光照组件
│   │       ├── ModelManager.ts    # 模型管理器
│   │       ├── RaycasterManager.ts # 射线检测管理器
│   │       ├── Renderer.ts        # 渲染器
│   │       ├── SceneManager.ts    # 场景管理器
│   │       ├── SkinInstance.ts    # 皮肤实例
│   │       └── TextureManager.ts  # 纹理管理器
│   ├── Config/                    # 配置文件
│   │   └── textureConfig.ts       # 纹理配置
│   ├── utils/                     # 工具函数
│   │   ├── EventBus.ts            # 事件总线
│   │   ├── Globals.ts             # 全局变量
│   │   ├── OrbitControls.d.ts     # OrbitControls 类型定义
│   │   ├── OrbitControls.js       # OrbitControls 实现
│   │   ├── rand.ts                # 随机数工具
│   │   ├── SafeArray.ts           # 安全数组
│   │   └── saveAudioToFile.ts     # 音频保存工具
│   └── views/                     # 页面视图
│       └── ThreeView.vue          # 3D 视图
├── public/                        # 公共资源
│   ├── draco/                     # Draco 压缩库
│   ├── models/                    # 3D 模型
│   │   ├── avatar.glb             # 角色模型
│   │   └── home.glb               # 房间模型
│   ├── textures/                  # 纹理贴图
│   │   ├── avatar/                # 角色纹理
│   │   ├── room/                  # 房间纹理
│   │   └── skybox/                # 天空盒纹理
│   └── videos/                    # 视频资源
│       └── bizhi.mp4              # 背景视频
└── index.html                     # HTML 入口
```

### 后端目录结构
```
server/
├── src/
│   ├── app.ts                     # 应用入口
│   ├── clientManager.ts           # 客户端管理器
│   └── utils/
│       └── logger.ts              # 日志工具
├── ApIConfig.json                 # API 配置
├── ApIConfig.json.example         # API 配置示例
├── package.json                   # 依赖配置
└── tsconfig.json                  # TypeScript 配置
```

## 依赖关系

### 前端关键依赖
```json
{
  "dependencies": {
    "vue": "^3.5.24",           // Vue 3 框架
    "three": "^0.181.2",        // 3D 图形库
    "gsap": "^3.14.2",          // 动画库
    "dayjs": "^1.11.19"         // 日期处理
  },
  "devDependencies": {
    "@types/three": "^0.181.0", // Three.js 类型定义
    "typescript": "~5.9.3",     // TypeScript
    "vite": "^7.2.4",           // 构建工具
    "vue-tsc": "^3.1.4"         // Vue TypeScript 编译器
  }
}
```

### 后端关键依赖
```json
{
  "dependencies": {
    "ws": "^8.18.3",            // WebSocket 服务器
    "axios": "^1.13.2",         // HTTP 客户端
    "fluent-ffmpeg": "^2.1.3",  // FFmpeg 包装器
    "ffmpeg-static": "^5.3.0"   // FFmpeg 静态二进制
  },
  "devDependencies": {
    "@types/ws": "^8.18.1",     // WebSocket 类型定义
    "typescript": "^5.9.3",     // TypeScript
    "nodemon": "^3.1.11",       // 开发热重载
    "ts-node": "^10.9.2"        // TypeScript 运行时
  }
}
```

## 构建和部署

### 开发模式
```bash
# 前端开发
cd web
npm install
npm run dev

# 后端开发
cd server
npm install
npm run dev
```

### 生产构建
```bash
# 前端构建
cd web
npm run build

# 后端构建
cd server
npm run start
```

### Docker 部署
```bash
# 使用 Docker Compose
docker-compose up -d

# 构建特定服务
docker-compose build virtual-avatar-server
docker-compose build virtual-avatar-frontend
```

## API 集成

### SiliconFlow API 配置
1. **获取 API 密钥**：注册 SiliconFlow 账户并获取 API 密钥
2. **配置 API 密钥**：复制 `ApIConfig.json.example` 为 `ApIConfig.json`，填入密钥
3. **API 端点**：
   - 语音识别：`https://api.siliconflow.cn/v1/audio/transcriptions`
   - 语言模型：`https://api.siliconflow.cn/v1/chat/completions`
   - 语音合成：`https://api.siliconflow.cn/v1/audio/speech`

### WebSocket API
- **连接地址**：`ws://localhost:3000` (开发) 或 `ws://your-domain.com:3000` (生产)
- **消息格式**：二进制音频数据
- **响应格式**：二进制音频数据或 JSON 错误信息

## 开发工作流

### 代码规范
- **TypeScript**：严格类型检查
- **ESLint**：代码质量检查（建议添加）
- **Prettier**：代码格式化（建议添加）
- **Git Hooks**：提交前检查（建议添加）

### 测试策略
- **单元测试**：Jest 或 Vitest（建议添加）
- **组件测试**：Vue Test Utils（建议添加）
- **集成测试**：Cypress 或 Playwright（建议添加）
- **性能测试**：Lighthouse 或 WebPageTest（建议添加）

### 版本控制
- **分支策略**：Git Flow 或 GitHub Flow
- **提交信息**：Conventional Commits
- **代码审查**：Pull Request 流程
- **版本发布**：语义化版本控制

## 性能优化

### 前端优化
1. **代码分割**：Vite 自动代码分割
2. **资源压缩**：Three.js 模型使用 Draco 压缩
3. **懒加载**：按需加载 3D 资源
4. **缓存策略**：Service Worker 缓存（建议添加）

### 后端优化
1. **连接池**：HTTP 连接复用
2. **内存管理**：及时清理临时文件
3. **错误重试**：API 调用失败重试机制
4. **日志优化**：结构化日志，避免性能影响

### 网络优化
1. **CDN**：静态资源使用 CDN（建议添加）
2. **压缩**：Gzip/Brotli 压缩
3. **HTTP/2**：启用 HTTP/2 协议
4. **WebSocket**：保持连接复用

## 监控和日志

### 前端监控
- **错误跟踪**：Sentry 或类似工具（建议添加）
- **性能监控**：Web Vitals 监控
- **用户行为**：Google Analytics（建议添加）
- **实时日志**：Console 日志分级

### 后端监控
- **请求日志**：结构化请求日志
- **错误日志**：错误堆栈和上下文
- **性能指标**：响应时间、内存使用
- **健康检查**：`/health` 端点监控

### 日志级别
```typescript
// server/src/utils/logger.ts
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}
```

## 安全考虑

### 前端安全
- **CSP**：内容安全策略（建议添加）
- **XSS 防护**：Vue 自动转义
- **CSRF 防护**：WebSocket 不需要 CSRF 令牌
- **依赖安全**：定期更新依赖，检查漏洞

### 后端安全
- **输入验证**：验证音频数据格式
- **API 密钥保护**：环境变量或配置文件
- **速率限制**：防止 API 滥用（建议添加）
- **数据清理**：及时删除临时文件

### 数据隐私
- **语音数据**：临时处理，不永久存储
- **用户信息**：不收集个人身份信息
- **合规性**：符合 GDPR/CCPA 要求（如适用）
- **加密传输**：WebSocket over WSS（生产环境）

## 故障排除

### 常见问题
1. **3D 模型不显示**：检查模型路径和格式
2. **音频无法播放**：检查 WebSocket 连接和音频格式
3. **AI 无响应**：检查 API 密钥和网络连接
4. **性能问题**：检查浏览器控制台和网络面板

### 调试工具
- **浏览器 DevTools**：Console、Network、Performance
- **Node.js 调试**：`node --inspect` 或 VS Code 调试器
- **网络分析**：Wireshark 或浏览器网络面板
- **性能分析**：Chrome Performance 或 Lighthouse

### 日志查看
```bash
# 查看 Docker 日志
docker-compose logs -f virtual-avatar-server
docker-compose logs -f virtual-avatar-frontend

# 查看特定服务日志
docker logs virtual-avatar-server
```

## 扩展和定制

### 自定义 3D 模型
1. **模型格式**：支持 GLTF/GLB 格式
2. **纹理要求**：WebP 或 PNG 格式，适当分辨率
3. **优化建议**：使用 Draco 压缩，减少多边形数量
4. **放置位置**：`web/public/models/` 目录

### 自定义 AI 行为
1. **系统提示**：修改 `server/src/app.ts` 中的 system prompt
2. **模型选择**：更换 SiliconFlow 模型 ID
3. **语音风格**：调整 TTS 参数（音色、语速等）
4. **对话逻辑**：添加自定义对话处理逻辑

### 主题定制
1. **UI 样式**：修改 `web/src/style.css` 和组件样式
2. **3D 场景**：更换模型和纹理
3. **颜色方案**：调整材质和光照颜色
4. **交互效果**：修改动画和过渡效果