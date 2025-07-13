@echo off
echo 正在启动PPT生成服务 - Flask后端...

REM 检查Python是否安装
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo Python未安装，请先安装Python 3.8或更高版本。
    pause
    exit /b
)

REM 检查虚拟环境是否存在，如果不存在则创建
if not exist venv (
    echo 正在创建虚拟环境...
    python -m venv venv
)

REM 激活虚拟环境
call venv\Scripts\activate.bat

REM 安装依赖
echo 正在安装依赖...
pip install -r requirements.txt

REM 设置百度API密钥
set BAIDU_API_KEY=bce-v3/ALTAK-Pn2ZJoOSPteqL1Lz76w6p/8968c88fc79f367ed266bccca3baa34643381e6f
echo 已设置百度API密钥

REM 检查模板和默认图片目录
if not exist ppt_templates (
    echo 正在创建PPT模板目录...
    mkdir ppt_templates
)

if not exist default_images (
    echo 正在创建默认图片目录...
    mkdir default_images
)

REM 检查插件目录
if not exist ppt_plugins (
    echo 正在创建PPT插件目录...
    mkdir ppt_plugins
)

REM 询问用户是否要生成演示PPT
echo.
echo 选择操作:
echo 1. 启动Web服务
echo 2. 使用改进版PPT生成器生成演示PPT
echo 3. 查看可用主题列表
echo.
set /p choice="请输入选项 (默认 1): "

if "%choice%"=="2" (
    echo 正在生成演示PPT...
    python demo_improved_ppt.py
    echo.
    echo 演示PPT已生成，按任意键启动Web服务...
    pause >nul
    python run.py
) else if "%choice%"=="3" (
    echo 查看可用主题列表...
    python demo_improved_ppt.py --list-themes
    echo.
    echo 按任意键返回主菜单...
    pause >nul
    call %0
) else (
    REM 启动Flask应用
    echo 正在启动Web服务...
    python run.py
)

pause 