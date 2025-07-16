#!/bin/bash
echo "正在启动PPT生成引擎..."

# 切换到脚本所在目录
cd "$(dirname "$0")"

# 检查虚拟环境
if [ -f "venv/bin/activate" ]; then
    echo "使用虚拟环境"
    source venv/bin/activate
else
    echo "未找到虚拟环境，使用系统Python"
fi

# 预处理所有模板
echo "预处理PPT模板..."
python preprocess_templates.py
if [ $? -ne 0 ]; then
    echo "模板预处理失败，但仍将尝试启动应用"
fi

# 启动Flask应用
echo "启动Web服务..."
python app.py

# 检查退出状态
if [ $? -eq 0 ]; then
    echo "PPT引擎已正常关闭"
else
    echo "PPT引擎异常退出，错误代码: $?"
fi 