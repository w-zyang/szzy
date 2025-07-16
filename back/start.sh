#!/bin/bash

echo "==========================================="
echo "           PPT生成系统启动脚本"
echo "==========================================="

# 切换到脚本所在目录
cd "$(dirname "$0")"

# 检查虚拟环境
if [ -f "venv/bin/activate" ]; then
    echo "[信息] 使用虚拟环境..."
    source venv/bin/activate
else
    echo "[警告] 未找到虚拟环境，使用系统Python..."
fi

# 检查Python是否可用
if ! command -v python &> /dev/null; then
    echo "[错误] 未找到Python，请确保已安装Python并添加到系统路径"
    exit 1
fi

# 检查依赖
echo "[信息] 检查依赖项..."
pip install -q -r requirements.txt
if [ $? -ne 0 ]; then
    echo "[警告] 部分依赖安装可能失败，但将继续启动..."
fi

# 预处理所有模板
echo "[信息] 预处理PPT模板..."
python preprocess_templates.py
if [ $? -ne 0 ]; then
    echo "[警告] 模板预处理失败，但仍将尝试启动应用..."
fi

# 创建必要目录
echo "[信息] 确保必要目录存在..."
mkdir -p uploads
mkdir -p image_cache

# 启动应用
echo "[信息] 启动Web服务..."
echo "==========================================="
echo "PPT生成系统已启动，按Ctrl+C终止服务"
echo "==========================================="
python app.py

# 捕获退出代码
if [ $? -eq 0 ]; then
    echo "[信息] 服务正常关闭"
else
    echo "[错误] 服务异常退出，错误代码: $?"
fi 