@echo off
chcp 65001 > nul
echo 数字资源生成平台安装脚本
echo ===========================
echo.

echo [1/4] 安装后端依赖...
cd back
python -m pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo 后端依赖安装失败，请检查Python环境
    pause
    exit /b 1
)

echo.
echo [2/4] 安装关键库...
python -m pip install jieba numpy
echo.

echo [3/4] 安装前端依赖...
cd ../frontend
npm install
if %errorlevel% neq 0 (
    echo 前端依赖安装失败，请检查Node.js环境
    pause
    exit /b 1
)

echo.
echo [4/4] 安装完成！
echo.
echo 启动指南:
echo  - 启动后端: cd back ^&^& python run.py
echo  - 启动前端: cd frontend ^&^& npm run dev
echo.
echo 感谢使用数字资源生成平台！
pause 