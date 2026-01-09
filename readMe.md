The application and development of large language models are the hottest entrepreneurial trends this year. Through this project, I will practically design and develop an AI Agent system based on OpenAI and React, gaining knowledge of various large language models and architectures (OpenAI GPT-3.5 / GPT-4, Langchain). I will also deploy a reliable React frontend and NodeJS backend service with a vector database on Amazon Web Services, and learn how to test and maintain them.

By completing this project, I will acquire fundamental knowledge and stay updated with the latest trends in large language models. I will also be able to demonstrate its performance in real-time during interviews. This project will enhance my chances of getting interviews at top AI technology companies like Google, LinkedIn, Meta, Amazon, and more.



# 🤖 AI Agent System

基于 OpenAI GPT-4、LangChain 和 React 的完整 AI Agent 系统，支持知识库管理、智能对话和多步推理。

## 📋 项目概述

本项目实现了一个完整的 AI Agent 系统，具备以下核心功能：

- ✨ **智能对话**：基于 GPT-4 的自然语言对话
- 📚 **知识库管理**：使用 Pinecone 向量数据库存储和检索知识
- 🎯 **AI Agent**：支持多种场景的智能代理（通用、技术、创意、分析）
- 🔍 **语义搜索**：基于向量嵌入的相似度搜索
- 💬 **RAG 技术**：检索增强生成，提供更准确的答案
- 🌐 **全栈应用**：React 前端 + Node.js 后端 + 向量数据库

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                     前端 (React)                         │
│  - 聊天界面                                              │
│  - 知识库管理                                            │
│  - Agent 控制面板                                        │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST API
┌────────────────────▼────────────────────────────────────┐
│                  后端 (Node.js/Express)                  │
│  - OpenAI GPT-4 集成                                     │
│  - LangChain 框架                                        │
│  - Agent 服务                                            │
└────────────────────┬────────────────────────────────────┘
                     │
           ┌─────────┴──────────┐
           │                    │
┌──────────▼──────────┐  ┌──────▼──────────┐
│   OpenAI API        │  │  Pinecone       │
│  - GPT-4            │  │  向量数据库      │
│  - Embeddings       │  │  - 语义搜索      │
└─────────────────────┘  └─────────────────┘
```

## 🚀 快速开始

### 前置要求

- Node.js 18+ 
- npm 或 yarn
- OpenAI API Key ([获取地址](https://platform.openai.com/api-keys))
- Pinecone API Key ([获取地址](https://www.pinecone.io/))

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd ai-agent-system
```

### 2. 配置后端

```bash
cd backend
npm install

# 创建 .env 文件
cp .env.example .env

# 编辑 .env，填写您的 API keys
nano .env
```

**.env 配置示例：**

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4

# Pinecone Configuration
PINECONE_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=ai-agent-knowledge

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### 3. 配置前端

```bash
cd ../frontend
npm install

# 创建 .env 文件
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env
```

### 4. 初始化数据库和测试

```bash
cd ../backend

# 运行测试脚本（会自动创建索引并上传示例数据）
npm run test
```

### 5. 启动应用

**终端 1 - 启动后端：**
```bash
cd backend
npm run dev
```

**终端 2 - 启动前端：**
```bash
cd frontend
npm start
```

**访问应用：**
- 前端：http://localhost:3000
- 后端 API：http://localhost:5000/api
- 健康检查：http://localhost:5000/health

## 📚 核心功能详解

### 1. 智能对话 (Chat)

基于 GPT-4 的实时对话系统，支持：
- 多轮对话上下文管理
- 会话历史保存
- Token 使用统计
- Markdown 格式响应

**API 示例：**
```javascript
POST /api/chat/message
{
  "message": "你好，请介绍一下 AI Agent",
  "sessionId": "session_123",
  "model": "gpt-4",
  "temperature": 0.7
}
```

### 2. 知识库管理 (Knowledge Base)

使用向量数据库存储和检索知识：
- 文档上传和向量化
- 语义搜索
- 元数据过滤
- 批量处理

**API 示例：**
```javascript
// 上传文档
POST /api/knowledge/upload
{
  "documents": [
    {
      "id": "doc_1",
      "text": "文档内容...",
      "metadata": { "category": "技术" }
    }
  ]
}

// 搜索
POST /api/knowledge/search
{
  "query": "什么是 RAG？",
  "topK": 5
}
```

### 3. AI Agent

智能代理系统，支持多种模式：
- **default**：通用助手
- **technical**：技术专家
- **creative**：创意助手
- **analytical**：数据分析

**特性：**
- RAG 增强回答
- 意图分析
- 多步推理
- 知识来源追踪

**API 示例：**
```javascript
POST /api/agent/query
{
  "query": "解释机器学习的基本概念",
  "agentId": "agent_123",
  "agentType": "technical",
  "useKnowledgeBase": true
}
```

## 🎯 参数调优指南

### OpenAI 参数

| 参数 | 范围 | 默认值 | 说明 |
|------|------|--------|------|
| temperature | 0-2 | 0.7 | 控制随机性，越高越随机 |
| max_tokens | 1-4096 | 2000 | 最大生成 token 数 |
| top_p | 0-1 | 0.9 | 核采样参数 |
| frequency_penalty | -2 to 2 | 0.0 | 降低重复词频率 |
| presence_penalty | -2 to 2 | 0.6 | 鼓励新话题 |

### 调优建议

**创意写作：**
```javascript
{
  temperature: 0.8-1.0,
  top_p: 0.95,
  presence_penalty: 0.6
}
```

**技术问答：**
```javascript
{
  temperature: 0.3-0.5,
  top_p: 0.9,
  frequency_penalty: 0.0
}
```

**代码生成：**
```javascript
{
  temperature: 0.2,
  max_tokens: 2000,
  top_p: 0.95
}
```

### 向量搜索参数

| 参数 | 说明 | 推荐值 |
|------|------|--------|
| topK | 返回结果数量 | 3-5 |
| similarity_threshold | 相似度阈值 | 0.7+ |
| chunk_size | 文本分块大小 | 500-1500 字符 |

## 🔧 开发指南

### 项目结构

```
ai-agent-system/
├── backend/
│   ├── config/              # 配置文件
│   │   ├── openai.js        # OpenAI 配置
│   │   └── pinecone.js      # Pinecone 配置
│   ├── routes/              # API 路由
│   │   ├── chat.js
│   │   ├── knowledge.js
│   │   └── agent.js
│   ├── services/            # 业务逻辑
│   │   └── agentService.js
│   ├── server.js            # 主服务器
│   ├── test.js              # 测试脚本
│   └── .env                 # 环境变量
├── frontend/
│   ├── src/
│   │   ├── components/      # React 组件
│   │   │   ├── ChatInterface.js
│   │   │   ├── KnowledgeManager.js
│   │   │   └── AgentDashboard.js
│   │   ├── services/
│   │   │   └── api.js       # API 客户端
│   │   ├── App.js
│   │   └── App.css
│   └── public/
└── deployment/              # 部署脚本
    ├── aws-setup.sh
    └── deploy-app.sh
```

### 添加新的 Agent 类型

1. **修改 `backend/services/agentService.js`：**

```javascript
const SYSTEM_PROMPTS = {
  // ... 现有类型
  custom: `你是一个自定义 AI 助手，专注于...`
};
```

2. **更新前端 `AgentDashboard.js`：**

```javascript
const AGENT_TYPES = {
  // ... 现有类型
  custom: { label: '自定义助手', icon: '🌟', color: '#e91e63' }
};
```

### 添加新的 API 端点

1. **创建路由文件 `backend/routes/custom.js`**
2. **在 `server.js` 中注册路由**
3. **在前端 `api.js` 中添加对应的客户端方法**

## 🚀 AWS 部署

### 自动部署

```bash
cd deployment

# 1. 配置 AWS 基础设施
chmod +x aws-setup.sh
./aws-setup.sh

# 2. 部署应用
chmod +x deploy-app.sh
./deploy-app.sh <SERVER_IP> <KEY_FILE>
```

### 手动部署步骤

1. **创建 EC2 实例**（推荐 t3.medium）
2. **安装 Node.js 18+**
3. **上传代码并安装依赖**
4. **配置环境变量**
5. **使用 PM2 管理后端进程**
6. **配置 Nginx 反向代理**

详细步骤见 [部署文档](docs/DEPLOYMENT.md)

## 🧪 测试

```bash
# 后端测试
cd backend
npm test

# 测试覆盖范围：
# ✅ OpenAI 连接
# ✅ Embedding 生成
# ✅ Pinecone 连接
# ✅ 知识库上传
# ✅ 语义搜索
# ✅ Agent 查询
```

## 📊 性能优化

### 后端优化

1. **使用连接池**：复用 Pinecone 连接
2. **缓存策略**：缓存常见查询的嵌入向量
3. **批量处理**：批量上传文档（50 个/批次）
4. **请求限流**：防止 API 滥用

### 前端优化

1. **懒加载**：按需加载组件
2. **虚拟滚动**：处理大量消息
3. **防抖节流**：优化输入事件
4. **Service Worker**：离线支持

## 🔒 安全建议

- ✅ 使用环境变量存储敏感信息
- ✅ 启用 HTTPS（生产环境）
- ✅ 实现用户认证和授权
- ✅ 配置 CORS 白名单
- ✅ 添加请求限流
- ✅ 验证和清理用户输入
- ✅ 定期更新依赖包

## 📈 监控和日志

```bash
# PM2 监控
pm2 monit

# 查看日志
pm2 logs ai-agent-backend

# 查看状态
pm2 status
```

## 🐛 故障排除

### 常见问题

**Q: OpenAI API 调用失败**
```
A: 检查 API Key 是否正确，账户是否有余额
```

**Q: Pinecone 连接超时**
```
A: 检查 API Key 和 Environment 配置，确保索引已创建
```

**Q: 前端无法连接后端**
```
A: 检查 CORS 配置和 API_BASE_URL
```

**Q: 向量搜索没有结果**
```
A: 确保文档已上传，等待索引更新（约10秒）
```

## 🌐 AWS 部署指南

本项目可以部署到 Amazon Web Services (AWS)，使用 EC2 实例托管前后端应用。

### 部署架构

```
┌─────────────────────────────────────┐
│         公网访问                     │
│  前端: http://[IP]:3000             │
│  后端: http://[IP]:5000/api         │
└────────────────┬────────────────────┘
                 │ HTTP/HTTPS
┌────────────────▼────────────────────┐
│     AWS EC2 实例 (t3.micro)         │
│  ├─ Node.js 18                      │
│  ├─ Nginx 反向代理                  │
│  ├─ PM2 进程管理                    │
│  └─ 应用代码                        │
└─────────────────────────────────────┘
```

### 前置要求

- ✅ AWS 账户（需要有效的信用卡用于验证）
- ✅ AWS CLI 已安装和配置
- ✅ SSH 客户端（Windows 内置 OpenSSH 或使用 Git Bash）
- ✅ 项目代码本地完整

### 部署步骤

#### 1. 安装 AWS CLI

**Windows 用户 - 使用 Conda（推荐）：**
```bash
conda install -c conda-forge awscli -y
aws --version
```

或下载 MSI 安装程序：https://awscli.amazonaws.com/AWSCLIV2.msi

#### 2. 配置 AWS 凭证

```bash
aws configure
```

按提示输入：
```
AWS Access Key ID: [你的 Access Key ID]
AWS Secret Access Key: [你的 Secret Access Key]
Default region name: us-east-1
Default output format: json
```

**获取 AWS 凭证：**
1. 登录 [AWS 控制台](https://console.aws.amazon.com)
2. 进入 IAM → Users → 你的用户名
3. Security credentials → Create access key
4. 复制 Access Key ID 和 Secret Access Key

验证配置成功：
```bash
aws sts get-caller-identity
```

#### 3. 运行部署脚本

```bash
# 进入项目目录
cd C:\Users\dengc\Desktop\cs\AI_Agent_based_on_OpenAI_and_React

# 运行部署脚本
bash deployment/aws-setup.sh
```

脚本会自动执行：
- ✅ 创建 EC2 密钥对
- ✅ 创建安全组（开放端口 22, 80, 443, 3000, 5000）
- ✅ 获取最新 Amazon Linux 2 AMI
- ✅ 启动 t3.micro EC2 实例
- ✅ 生成部署信息文件

#### 4. 获取实例信息

部署完成后，查询实例公网 IP：

```bash
aws ec2 describe-instances --region us-east-1 \
  --query 'Reservations[0].Instances[0].[InstanceId,PublicIpAddress,InstanceType,State.Name]' \
  --output table
```

或从 [AWS EC2 控制台](https://console.aws.amazon.com/ec2/) 查看。

**记下公网 IP（如：34.203.13.220）**

#### 5. 上传应用代码

在**本地计算机**运行（确保 ai-agent-key.pem 在项目根目录）：

```bash
# 上传后端代码
scp -i ai-agent-key.pem -r backend ec2-user@[公网IP]:~

# 上传前端代码
scp -i ai-agent-key.pem -r frontend ec2-user@[公网IP]:~
```

#### 6. 连接并启动应用

```bash
# SSH 连接到实例
ssh -i ai-agent-key.pem ec2-user@[公网IP]

# 在远程服务器上启动后端
cd ~/backend
npm install
node server.js &

# 新开终端窗口启动前端（或使用 screen/tmux）
cd ~/frontend
npm install
npm start &

# 检查运行状态
ps aux | grep node
```

#### 7. 访问应用

- **前端**：http://[公网IP]:3000
- **后端 API**：http://[公网IP]:5000/api

### 成本说明

| 项目 | 免费套餐 | 费用 |
|------|--------|------|
| EC2 t3.micro | 750 小时/月 | ¥0/月 |
| 数据传输 | 100 GB/月 | ¥0/月 |
| 总计（12个月） | | ¥0 |
| 超期后 | | ¥110/月 |

⚠️ **注意**：AWS 注册需要有效信用卡验证（验证费用 $1，后会退款）

### 常见部署问题

**Q: 脚本错误 "not eligible for Free Tier"**
```
A: 说明账户免费套餐不可用，会产生费用
   解决：删除资源或使用 Render/Vercel 免费部署
```

**Q: SSH 连接超时**
```
A: 检查安全组是否开放了 22 端口
   在 EC2 控制台修改入站规则
```

**Q: npm 安装缓慢**
```
A: 可在实例初始化时提前安装 Node.js 和依赖
   编辑 aws-setup.sh 中的 USER_DATA_SCRIPT
```

**Q: 实例公网 IP 为空**
```
A: 实例可能还未完全启动，等待 30 秒后重试查询
```

### 清理资源

**删除实例（停止扣费）：**
```bash
aws ec2 terminate-instances --instance-ids i-xxxxxxx --region us-east-1
```

**删除安全组：**
```bash
aws ec2 delete-security-group --group-id sg-xxxxxxx --region us-east-1
```

**删除密钥对：**
```bash
aws ec2 delete-key-pair --key-name ai-agent-key --region us-east-1
```

### 免费替代方案

如果 AWS 不可用，可使用以下完全免费的服务：

| 平台 | 后端 | 前端 | 成本 |
|------|------|------|------|
| Render | ✅ | ✅ | 免费 |
| Vercel | ❌ | ✅ | 免费 |
| Railway | ✅ | ✅ | $5/月 |

**Render 部署：**
```
1. 访问 https://render.com
2. 用 GitHub 账户登录
3. 创建 Web Service（后端）
4. 创建 Static Site（前端）
5. 自动部署
```
