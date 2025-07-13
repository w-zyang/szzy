@echo off
echo === PPT引擎启动脚本 ===
echo.

rem 检查Python环境
python --version
if %ERRORLEVEL% neq 0 (
    echo 错误: Python未安装或不在PATH中
    exit /b 1
)

rem 检查是否需要安装依赖
if not exist ppt_engine (
    echo 未找到ppt_engine目录，开始安装...
    python setup_ppt_engine.py
    if %ERRORLEVEL% neq 0 (
        echo 安装依赖失败，请手动运行setup_ppt_engine.py
        exit /b 1
    )
)

echo.
echo === PPT引擎使用说明 ===
echo.
echo 命令行方式:
echo python -m ppt_engine.unified_generator -o 大纲.json -t 模板.pptx -p 输出.pptx
echo.
echo API方式:
echo POST /api/aiPpt/generate-html-ppt
echo.
echo 按任意键退出...
pause > nul 