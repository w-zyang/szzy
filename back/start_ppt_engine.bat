@echo off
echo ===== 启动PPT生成引擎 =====

REM 设置环境变量
set PYTHONIOENCODING=utf-8
set PYTHONLEGACYWINDOWSSTDIO=utf-8

REM 检查Python环境
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [错误] 未找到Python，请安装Python 3.8或更高版本
    pause
    exit /b 1
)

REM 检查虚拟环境
if exist "venv\Scripts\activate.bat" (
    echo [信息] 使用虚拟环境
    call venv\Scripts\activate.bat
) else (
    echo [警告] 未找到虚拟环境，将使用系统Python
)

REM 检查依赖
echo [信息] 检查依赖...
python -c "import pptx" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [信息] 安装必要的依赖...
    pip install -r requirements.txt
    if %ERRORLEVEL% neq 0 (
        echo [错误] 安装依赖失败
        pause
        exit /b 1
    )
)

REM 确保目录存在
if not exist "ppt_templates" (
    echo [信息] 创建模板目录...
    mkdir ppt_templates
)

if not exist "image_cache" (
    echo [信息] 创建图片缓存目录...
    mkdir image_cache
)

if not exist "uploads" (
    echo [信息] 创建上传目录...
    mkdir uploads
)

REM 预处理模板
echo [信息] 预处理PPT模板...
python preprocess_templates.py
if %ERRORLEVEL% neq 0 (
    echo [警告] 模板预处理出现问题，将尝试继续启动
)

REM 启动服务
echo [信息] 启动PPT生成引擎...
python app.py
if %ERRORLEVEL% neq 0 (
    echo [错误] 启动失败，请检查日志
    pause
    exit /b 1
)

pause 