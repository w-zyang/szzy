@echo off
echo 正在启动PPT生成引擎...

:: 检查虚拟环境
if exist venv\Scripts\activate.bat (
    echo 使用虚拟环境
    call venv\Scripts\activate
) else (
    echo 未找到虚拟环境，使用系统Python
)

:: 预处理所有模板
echo 预处理PPT模板...
python preprocess_templates.py
if %ERRORLEVEL% NEQ 0 (
    echo 模板预处理失败，但仍将尝试启动应用
)

:: 启动Flask应用
echo 启动Web服务...
python app.py

:: 如果正常退出，提示完成
if %ERRORLEVEL% EQU 0 (
    echo PPT引擎已关闭
) else (
    echo PPT引擎异常退出，错误代码: %ERRORLEVEL%
    pause
) 