#!/bin/bash

# 应用部署脚本
# 用途：将应用部署到 EC2 实例

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查参数
if [ $# -eq 0 ]; then
    echo -e "${RED}❌ 请提供服务器 IP 地址${NC}"
    echo "用法: ./deploy-app.sh <SERVER_IP=$1
KEY_FILE=${2:-"ai-agent-key.pem"}
SSH_USER="ec2-user"
DEPLOY_PATH="/opt/ai-agent-system"

echo -e "${GREEN}🚀 开始部署应用到: $SERVER_IP${NC}"

# 1. 测试 SSH 连接
echo -e "\n${YELLOW}📝 步骤 1: 测试 SSH 连接${NC}"
if ssh -i $KEY_FILE -o StrictHostKeyChecking=no $SSH_USER@$SERVER_IP "echo '连接成功'" &> /dev/null; then
    echo -e "${GREEN}✅ SSH 连接成功${NC}"
else
    echo -e "${RED}❌ SSH 连接失败${NC}"
    exit 1
fi

# 2. 准备部署包
echo -e "\n${YELLOW}📝 步骤 2: 准备部署包${NC}"
cd ..
tar -czf deployment-package.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='*.log' \
    backend/ frontend/ package*.json

echo -e "${GREEN}✅ 部署包创建完成${NC}"

# 3. 上传到服务器
echo -e "\n${YELLOW}📝 步骤 3: 上传应用文件${NC}"
scp -i deployment/$KEY_FILE deployment-package.tar.gz $SSH_USER@$SERVER_IP:$DEPLOY_PATH/
rm deployment-package.tar.gz

echo -e "${GREEN}✅ 文件上传完成${NC}"

# 4. 在服务器上部署
echo -e "\n${YELLOW}📝 步骤 4: 在服务器上配置应用${NC}"
ssh -i deployment/$KEY_FILE $SSH_USER@$SERVER_IP << 'ENDSSH'
set -e

DEPLOY_PATH="/opt/ai-agent-system"
cd $DEPLOY_PATH

echo "📦 解压部署包..."
tar -xzf deployment-package.tar.gz
rm deployment-package.tar.gz

# 后端部署
echo "🔧 配置后端..."
cd backend

# 创建 .env 文件（用户需要手动填写 API keys）
cat > .env << 'EOF'
# OpenAI Configuration
OPENAI_API_KEY=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
OPENAI_MODEL=llama-3.3-70b-versatile

# Pinecone Configuration
PINECONE_API_KEY=pcsk_tg5rZ_2p5fYxYcFDzhrch4di7tprYe5WdHcRE4vi8pMqufRmPuG227CRCQQRmofvgPxpx
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=ai-agent-knowledge

# Server Configuration
PORT=5000
NODE_ENV=production

# CORS Configuration
FRONTEND_URL=http://localhost:3000
EOF

echo "📦 安装后端依赖..."
npm install --production

# 前端部署
echo "🔧 配置前端..."
cd ../frontend

# 创建 .env 文件
cat > .env << 'EOF'
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_NAME=AI Agent System
EOF

echo "📦 安装前端依赖..."
npm install

echo "🏗️  构建前端..."
npm run build

# 配置 PM2 启动后端
cd ../backend
echo "⚙️  配置 PM2..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'ai-agent-backend',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
EOF

# 启动后端
pm2 delete ai-agent-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# 配置 Nginx
echo "🌐 配置 Nginx..."
sudo tee /etc/nginx/conf.d/ai-agent.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    # 前端
    location / {
        root /opt/ai-agent-system/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # 健康检查
    location /health {
        proxy_pass http://localhost:5000/health;
    }
}
EOF

# 测试并重启 Nginx
sudo nginx -t
sudo systemctl restart nginx

echo "✅ 部署完成！"
echo ""
echo "⚠️  重要提醒："
echo "1. 请编辑 /opt/ai-agent-system/backend/.env 文件，填写您的 API keys"
echo "2. 填写完成后运行: pm2 restart ai-agent-backend"
echo "3. 确保防火墙允许 80 和 443 端口访问"
ENDSSH

echo -e "\n${GREEN}🎉 应用部署完成！${NC}"
echo -e "\n${YELLOW}⚠️  下一步操作：${NC}"
echo -e "1. SSH 到服务器: ssh -i deployment/$KEY_FILE $SSH_USER@$SERVER_IP"
echo -e "2. 编辑配置: sudo nano /opt/ai-agent-system/backend/.env"
echo -e "3. 填写 OpenAI 和 Pinecone API keys"
echo -e "4. 重启后端: pm2 restart ai-agent-backend"
echo -e "5. 访问应用: http://$SERVER_IP"> <KEY_FILE>"
    exit 1
fi

SERVER_IP