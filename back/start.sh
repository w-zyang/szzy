#!/bin/bash
echo "正在启动PPT生成服务 - Flask后端..."

# 检查Python是否安装
if ! command -v python3 &> /dev/null; then
    echo "Python未安装，请先安装Python 3.8或更高版本。"
    exit 1
fi

# 检查虚拟环境是否存在，如果不存在则创建
if [ ! -d "venv" ]; then
    echo "正在创建虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
echo "正在安装依赖..."
pip install -r requirements.txt

# 设置百度API密钥
export BAIDU_API_KEY="bce-v3/ALTAK-Pn2ZJoOSPteqL1Lz76w6p/8968c88fc79f367ed266bccca3baa34643381e6f"
echo "已设置百度API密钥"

# 启动Flask应用
echo "正在启动服务..."
python run.py 