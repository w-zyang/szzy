#!/bin/bash

echo "=== PPT引擎启动脚本 ==="
echo

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "错误: Python3未安装或不在PATH中"
    exit 1
fi

# 检查是否需要安装依赖
if [ ! -d "ppt_engine" ]; then
    echo "未找到ppt_engine目录，开始安装..."
    python3 setup_ppt_engine.py
    if [ $? -ne 0 ]; then
        echo "安装依赖失败，请手动运行setup_ppt_engine.py"
        exit 1
    fi
fi

echo
echo "=== PPT引擎使用说明 ==="
echo
echo "命令行方式:"
echo "python3 -m ppt_engine.unified_generator -o 大纲.json -t 模板.pptx -p 输出.pptx"
echo
echo "API方式:"
echo "POST /api/aiPpt/generate-html-ppt"
echo
echo "按Ctrl+C退出..."

# 保持脚本运行
while true; do
    sleep 1
done 