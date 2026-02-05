# 虚拟头像项目配置指南

## API 配置说明

本项目使用 SiliconFlow API 进行语音识别、文本生成和语音合成。为了保护你的 API key 安全，请按照以下步骤配置：

### 方法一：使用配置文件（推荐）

1. **复制配置文件模板**：
   ```bash
   cp server/src/ApIConfig.json.example server/src/ApIConfig.json
   ```

2. **编辑配置文件**：
   打开 `server/src/ApIConfig.json` 文件，将 `YOUR_API_KEY_HERE` 替换为你的真实 API key：
   ```json
   {
     "APIKey": "你的_API_Key_在这里"
   }
   ```

### 方法二：使用环境变量

1. **设置环境变量**：
   ```bash
   # Linux/macOS
   export API_KEY=你的_API_Key_在这里
   
   # Windows (PowerShell)
   $env:API_KEY="你的_API_Key_在这里"
   ```

2. **在启动脚本中设置**：
   或者，你可以在启动服务器时设置环境变量：
   ```bash
   API_KEY=你的_API_Key_在这里 npm start
   ```

### 获取 API Key

1. 访问 [SiliconFlow](https://siliconflow.cn/)
2. 注册账号并登录
3. 在控制台中获取你的 API key

## 配置优先级

系统按以下顺序查找 API key：
1. **环境变量** `API_KEY`（最高优先级）
2. **配置文件** `server/src/ApIConfig.json`
3. 如果两者都未设置，服务器将无法启动

## 安全注意事项

⚠️ **重要安全提示**：

1. **不要提交敏感信息**：
   - `ApIConfig.json` 文件已被添加到 `.gitignore`，不会被提交到 Git
   - 确保你的 API key 不会出现在 Git 历史记录中

2. **撤销泄露的 Key**：
   如果你意外提交了 API key，请立即：
   - 在 SiliconFlow 控制台中撤销该 key
   - 生成新的 API key
   - 更新你的配置文件或环境变量

3. **使用环境变量的优势**：
   - 更安全：不会在文件中留下痕迹
   - 更灵活：可以在不同环境使用不同的 key
   - 便于自动化部署

## 验证配置

启动服务器时，观察日志输出：
- 如果使用环境变量：`使用环境变量中的 API key`
- 如果使用配置文件：`使用配置文件中的 API key`
- 如果配置无效：`无效的 API key`，服务器将退出

## 故障排除

### 问题：服务器启动失败，提示 "无效的 API key"
**解决方案**：
1. 检查 `ApIConfig.json` 文件中的 API key 是否正确
2. 确保 API key 不是 `YOUR_API_KEY_HERE`
3. 验证环境变量是否设置正确：`echo $API_KEY`

### 问题：配置文件不存在
**解决方案**：
```bash
# 创建配置文件
cp server/src/ApIConfig.json.example server/src/ApIConfig.json
# 编辑配置文件，填入你的 API key
```

### 问题：环境变量不生效
**解决方案**：
1. 确认环境变量在当前终端会话中设置
2. 重启终端或重新加载 shell 配置
3. 使用 `printenv API_KEY` 验证环境变量

## 开发建议

1. **为不同环境使用不同的 Key**：
   - 开发环境：使用测试 API key
   - 生产环境：使用正式 API key

2. **使用 .env 文件（可选）**：
   创建 `.env` 文件（添加到 `.gitignore`）：
   ```
   API_KEY=你的_开发_API_Key
   ```
   然后在启动脚本中加载：`source .env`

3. **定期轮换 Key**：
   建议每 3-6 个月更换一次 API key 以增强安全性