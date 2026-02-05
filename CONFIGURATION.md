# 虚拟头像项目配置指南

## 配置说明

本项目使用 SiliconFlow API 进行语音识别、文本生成和语音合成。请按照以下简单步骤配置：

### 配置步骤

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

### 获取 API Key

1. 访问 [SiliconFlow](https://siliconflow.cn/)
2. 注册账号并登录
3. 在控制台中获取你的 API key

## 安全注意事项

⚠️ **重要提示**：

1. **不要提交敏感信息**：
   - `ApIConfig.json` 文件已被添加到 `.gitignore`，不会被提交到 Git
   - 确保你的 API key 不会出现在 Git 历史记录中

2. **撤销泄露的 Key**：
   如果你意外提交了 API key，请立即：
   - 在 SiliconFlow 控制台中撤销该 key
   - 生成新的 API key
   - 更新你的配置文件

## 故障排除

### 问题：服务器启动失败，提示 "无效的 API key"
**解决方案**：
1. 检查 `ApIConfig.json` 文件中的 API key 是否正确
2. 确保 API key 不是 `YOUR_API_KEY_HERE`

### 问题：服务器启动失败，提示 "配置文件不存在或格式错误"
**解决方案**：
```bash
# 创建配置文件
cp server/src/ApIConfig.json.example server/src/ApIConfig.json
# 编辑配置文件，填入你的 API key
```

## 简单建议

1. **使用不同的 Key**：
   - 开发环境：使用测试 API key
   - 生产环境：使用正式 API key

2. **定期更换 Key**：
   建议每 3-6 个月更换一次 API key 以增强安全性
