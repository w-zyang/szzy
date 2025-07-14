# 数字资源生成平台     南北猫到此一游

基于AI的数字教学资源生成系统，支持PPT、教案等资源的自动生成。

## 系统需求

- Python 3.8+
- Node.js 14+
- npm 6+

## 快速开始

### 后端安装

1. 进入后端目录：
   ```
   cd back
   ```

2. 创建虚拟环境（可选但推荐）：
   ```
   python -m venv venv
   ```

3. 激活虚拟环境：
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

4. 安装依赖：
   ```
   pip install -r requirements.txt
   ```

5. 启动后端服务：
   ```
   python run.py
   ```
   或使用批处理文件：
   ```
   start.bat
   ```
   
   服务将在 http://127.0.0.1:5000 运行

### 前端安装

1. 进入前端目录：
   ```
   cd frontend
   ```

2. 安装依赖：
   ```
   npm install
   ```

3. 启动开发服务器：
   ```
   npm run dev
   ```
   
   前端将在 http://localhost:3000 运行

## 主要功能

- PPT自动生成
- 数字资源管理
- 基于AI的内容生成
- 知识库检索增强

## 常见问题

- 如遇到jieba分词库警告，请安装：`pip install jieba`
- 如遇到numpy相关警告，请安装：`pip install numpy`
- 如遇到API 404错误，请检查后端服务是否正常运行

## 许可证

MIT