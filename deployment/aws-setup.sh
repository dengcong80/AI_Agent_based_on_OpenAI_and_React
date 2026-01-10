#!/bin/bash

# AWS 部署配置脚本
# 用途：在 AWS 上部署 AI Agent 系统

set -e

echo "🚀 开始 AWS 部署配置..."

# 配置变量
PROJECT_NAME="ai-agent-system"
REGION="us-east-1"
EC2_INSTANCE_TYPE="t3.micro"
ROOT_VOLUME_SIZE=16
KEY_NAME="ai-agent-key"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 AWS CLI 是否安装
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI 未安装${NC}"
    echo "请访问: https://aws.amazon.com/cli/"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI 已安装${NC}"

# 检查 AWS 凭证
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS 凭证未配置${NC}"
    echo "请运行: aws configure"
    exit 1
fi

echo -e "${GREEN}✅ AWS 凭证已配置${NC}"

# 1. 创建 EC2 密钥对
echo -e "\n${YELLOW}📝 步骤 1: 创建 EC2 密钥对${NC}"
if ! aws ec2 describe-key-pairs --key-names $KEY_NAME --region $REGION &> /dev/null; then
    aws ec2 create-key-pair \
        --key-name $KEY_NAME \
        --region $REGION \
        --query 'KeyMaterial' \
        --output text > ${KEY_NAME}.pem
    chmod 400 ${KEY_NAME}.pem
    echo -e "${GREEN}✅ 密钥对创建成功: ${KEY_NAME}.pem${NC}"
else
    echo -e "${YELLOW}ℹ️  密钥对已存在${NC}"
fi

# 2. 创建安全组
echo -e "\n${YELLOW}📝 步骤 2: 创建安全组${NC}"
SECURITY_GROUP_NAME="${PROJECT_NAME}-sg"
VPC_ID=$(aws ec2 describe-vpcs --region $REGION --query 'Vpcs[0].VpcId' --output text)

if ! aws ec2 describe-security-groups --group-names $SECURITY_GROUP_NAME --region $REGION &> /dev/null 2>&1; then
    SECURITY_GROUP_ID=$(aws ec2 create-security-group \
        --group-name $SECURITY_GROUP_NAME \
        --description "Security group for AI Agent System" \
        --vpc-id $VPC_ID \
        --region $REGION \
        --query 'GroupId' \
        --output text)
    
    # 添加入站规则
    aws ec2 authorize-security-group-ingress \
        --group-id $SECURITY_GROUP_ID \
        --protocol tcp --port 22 --cidr 0.0.0.0/0 \
        --region $REGION  # SSH
    
    aws ec2 authorize-security-group-ingress \
        --group-id $SECURITY_GROUP_ID \
        --protocol tcp --port 80 --cidr 0.0.0.0/0 \
        --region $REGION  # HTTP
    
    aws ec2 authorize-security-group-ingress \
        --group-id $SECURITY_GROUP_ID \
        --protocol tcp --port 443 --cidr 0.0.0.0/0 \
        --region $REGION  # HTTPS
    
    aws ec2 authorize-security-group-ingress \
        --group-id $SECURITY_GROUP_ID \
        --protocol tcp --port 5000 --cidr 0.0.0.0/0 \
        --region $REGION  # Backend API
    
    aws ec2 authorize-security-group-ingress \
        --group-id $SECURITY_GROUP_ID \
        --protocol tcp --port 3000 --cidr 0.0.0.0/0 \
        --region $REGION  # Frontend
    
    echo -e "${GREEN}✅ 安全组创建成功: $SECURITY_GROUP_ID${NC}"
else
    SECURITY_GROUP_ID=$(aws ec2 describe-security-groups \
        --group-names $SECURITY_GROUP_NAME \
        --region $REGION \
        --query 'SecurityGroups[0].GroupId' \
        --output text)
    echo -e "${YELLOW}ℹ️  安全组已存在: $SECURITY_GROUP_ID${NC}"
fi

# 3. 获取最新的 Amazon Linux 2023 AMI
echo -e "\n${YELLOW}📝 步骤 3: 获取 AMI${NC}"
AMI_ID=$(aws ec2 describe-images \
    --owners amazon \
    --filters "Name=name,Values=al2023-ami-*-x86_64" \
    --query 'sort_by(Images, &CreationDate)[-1].ImageId' \
    --output text \
    --region $REGION)

echo -e "${GREEN}✅ AMI ID: $AMI_ID${NC}"

# 4. 创建用户数据脚本（自动安装软件）
echo -e "\n${YELLOW}📝 步骤 4: 准备用户数据脚本${NC}"

USER_DATA_SCRIPT=$(cat <<'EOF'
#!/bin/bash
# 更新系统
yum update -y

# 安装 Node.js 18
curl -sL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# 安装 Git
yum install -y git

# 安装 PM2 (进程管理器)
npm install -g pm2

# 安装 Nginx
amazon-linux-extras install nginx1 -y
systemctl start nginx
systemctl enable nginx

# 创建应用目录
mkdir -p /opt/ai-agent-system
cd /opt/ai-agent-system

echo "✅ 服务器初始化完成"
EOF
)

# 5. 启动 EC2 实例
echo -e "\n${YELLOW}📝 步骤 5: 启动 EC2 实例${NC}"
echo "实例类型: $EC2_INSTANCE_TYPE"

INSTANCE_ID=$(aws ec2 run-instances \
    --image-id $AMI_ID \
    --instance-type $EC2_INSTANCE_TYPE \
    --key-name $KEY_NAME \
    --security-group-ids $SECURITY_GROUP_ID \
    --user-data "$USER_DATA_SCRIPT" \
    --monitoring Enabled=false \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$PROJECT_NAME}]" \
    --region $REGION \
    --query 'Instances[0].InstanceId' \
    --output text)

echo -e "${GREEN}✅ EC2 实例已启动: $INSTANCE_ID${NC}"
echo -e "${YELLOW}⏳ 等待实例准备就绪...${NC}"

# 等待实例运行
aws ec2 wait instance-running --instance-ids $INSTANCE_ID --region $REGION

# 设置 AWS 预算告警（可选）
# aws budgets create-budget \
#   --account-id $(aws sts get-caller-identity --query Account --output text) \
#   --budget file:///dev/stdin << 'BUDGET_EOF'
# {
#   "BudgetName": "MonthlyBudget",
#   "BudgetLimit": {
#     "Amount": "10",
#     "Unit": "USD"
#   },
#   "TimeUnit": "MONTHLY",
#   "BudgetType": "COST"
# }
# BUDGET_EOF


# 获取公网 IP
PUBLIC_IP=$(aws ec2 describe-instances \
    --instance-ids $INSTANCE_ID \
    --region $REGION \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text)

echo -e "${GREEN}✅ 实例已准备就绪${NC}"
echo -e "${GREEN}🌐 公网 IP: $PUBLIC_IP${NC}"

# 6. 保存配置信息
cat > deployment-info.txt << EOF
======================================
AI Agent System - AWS 部署信息
======================================

实例 ID: $INSTANCE_ID
公网 IP: $PUBLIC_IP
区域: $REGION
密钥文件: ${KEY_NAME}.pem
安全组 ID: $SECURITY_GROUP_ID

SSH 连接命令:
ssh -i ${KEY_NAME}.pem ec2-user@$PUBLIC_IP

前端访问地址:
http://$PUBLIC_IP:3000

后端 API 地址:
http://$PUBLIC_IP:5000/api

部署应用命令:
scp -i ${KEY_NAME}.pem -r ../backend ec2-user@$PUBLIC_IP:/opt/ai-agent-system/
scp -i ${KEY_NAME}.pem -r ../frontend ec2-user@$PUBLIC_IP:/opt/ai-agent-system/

======================================
EOF

cat deployment-info.txt

echo -e "\n${GREEN}🎉 AWS 基础设施部署完成！${NC}"
echo -e "${YELLOW}⚠️  注意: 请等待 3-5 分钟让实例完成初始化${NC}"
echo -e "${YELLOW}📝 部署信息已保存到: deployment-info.txt${NC}"