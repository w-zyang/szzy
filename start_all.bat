@echo off
chcp 65001 > nul
echo 数字资源生成平台启动脚本
echo ===========================
echo.

echo [1/2] 启动后端服务...
start cmd /k "cd back && python run.py"

echo [2/2] 启动前端服务...
start cmd /k "cd frontend && npm run dev"

echo.
echo 服务启动中，请稍候...
echo 后端服务地址: http://127.0.0.1:5000
echo 前端服务地址: http://localhost:3000
echo.
echo 请不要关闭弹出的命令行窗口，关闭将终止相应服务
echo. 