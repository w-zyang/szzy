# PPT生成服务 - Flask后端

这是一个基于Flask的PPT生成服务后端，提供与原Node.js/TypeScript后端相同的API功能。

## 功能特点

- 阿里云百炼AI生成PPT大纲
- PPT模板管理（上传、获取）
- 基于模板的PPT自动生成
- 静态文件服务
- 模板预览图自动生成

## 目录结构

```
back/
├── app.py              # Flask应用主文件
├── run.py              # 启动脚本
├── requirements.txt    # 依赖包列表
├── ppt_fill_template.py # PPT模板填充脚本
├── generate_preview.py  # 模板预览图生成脚本
├── regenerate_all_previews.py # 批量重新生成所有预览图
├── templates/          # Flask模板目录
├── static/             # 静态文件目录
├── uploads/            # 上传文件存储目录
└── ppt_templates/      # PPT模板存储目录
    └── previews/       # 模板预览图存储目录
```

## 安装依赖

```bash
pip install -r requirements.txt
```

## 环境变量配置

创建一个`.env`文件，包含以下配置：

```
PORT=5000
DEBUG=True
ALIYUN_API_KEY=your-api-key-here
```

## 启动服务

```bash
python run.py
```

默认情况下，服务将在 http://localhost:5000 上运行。

## API接口

### 健康检查
- GET `/api/health`

### PPT模板管理
- GET `/api/aiPpt/ppt/templates` - 获取所有可用模板
- POST `/api/aiPpt/ppt/upload-template` - 上传新模板
- GET `/api/aiPpt/ppt/template-preview/<template_name>` - 获取模板预览图

### PPT生成
- POST `/api/aiPpt/generate-outline` - 生成PPT大纲
- POST `/api/aiPpt/gen-pptx-python` - 生成PPT文件

### 文件访问
- GET `/uploads/<filename>` - 访问生成的PPT文件
- GET `/ppt_templates/<filename>` - 访问模板文件
- GET `/ppt_templates/previews/<filename>` - 访问模板预览图

## 模板预览图生成

系统会自动为上传的PPT模板生成预览图，显示模板第一页的实际效果。预览图生成支持多种方法：

1. **PowerPoint COM对象**（仅Windows平台）
2. **LibreOffice**（跨平台）
3. **python-pptx**（跨平台，效果较差）

可以使用以下命令手动生成预览图：

```bash
# 生成单个模板预览图
python generate_preview.py ppt_templates/模板文件.pptx

# 重新生成所有模板预览图
python regenerate_all_previews.py
```

## 模板元数据功能

系统会分析PPT模板并生成JSON元数据文件，用于智能填充模板。元数据包含模板的结构信息、布局特性、占位符位置等关键信息，帮助AI系统更准确地理解和使用模板。

### 生成模板元数据

```bash
# 分析单个模板
python ppt_template_analyzer.py ppt_templates/模板文件.pptx

# 分析目录中的所有模板
python ppt_template_analyzer.py ppt_templates/
```

### 元数据功能特点

1. **自动分析模板结构**：识别标题、内容、图片、表格等元素的位置和属性
2. **智能布局匹配**：根据内容类型自动选择最合适的模板幻灯片
3. **元素智能定位**：准确放置文本、图片、表格等内容
4. **模板适用性评估**：分析模板适合哪些类型的内容

详细说明请参考 [TEMPLATE_METADATA.md](TEMPLATE_METADATA.md)

## 与原Node.js后端的兼容性

本Flask后端完全兼容原有Node.js/TypeScript后端的API接口，可以无缝替换。 