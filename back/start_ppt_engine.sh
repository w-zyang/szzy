#!/bin/bash

echo "===== 启动PPT生成引擎 ====="

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "[错误] 未找到Python，请安装Python 3.8或更高版本"
    exit 1
fi

# 检查虚拟环境
if [ -f "venv/bin/activate" ]; then
    echo "[信息] 使用虚拟环境"
    source venv/bin/activate
else
    echo "[警告] 未找到虚拟环境，将使用系统Python"
fi

# 检查依赖
echo "[信息] 检查依赖..."
python3 -c "import pptx" &> /dev/null
if [ $? -ne 0 ]; then
    echo "[信息] 安装必要的依赖..."
    pip3 install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "[错误] 安装依赖失败"
        exit 1
    fi
fi

# 确保目录存在
if [ ! -d "ppt_templates" ]; then
    echo "[信息] 创建模板目录..."
    mkdir -p ppt_templates
fi

if [ ! -d "image_cache" ]; then
    echo "[信息] 创建图片缓存目录..."
    mkdir -p image_cache
fi

if [ ! -d "uploads" ]; then
    echo "[信息] 创建上传目录..."
    mkdir -p uploads
fi

# 预处理模板
echo "[信息] 预处理PPT模板..."
python3 preprocess_templates.py
if [ $? -ne 0 ]; then
    echo "[警告] 模板预处理出现问题，将尝试继续启动"
fi

# 启动服务
echo "[信息] 启动PPT生成引擎..."
python3 app.py
if [ $? -ne 0 ]; then
    echo "[错误] 启动失败，请检查日志"
    exit 1
fi 