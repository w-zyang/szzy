@echo off
chcp 65001 > nul
echo 启动PPT引擎服务...

REM 检查Python是否安装
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo Python未安装，请先安装Python 3.8或更高版本。
    pause
    exit /b
)

REM 创建虚拟环境(如果不存在)
if not exist venv (
    echo 创建虚拟环境...
    python -m venv venv
)

REM 激活虚拟环境
call venv\Scripts\activate.bat

REM 安装依赖
echo 安装依赖...
pip install -r requirements.txt

REM 运行PPT引擎设置脚本
python setup_ppt_engine.py

echo PPT引擎服务已启动!
pause 