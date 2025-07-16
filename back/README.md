# PPT自动生成系统

本系统能够根据用户输入的主题或大纲，自动生成精美的PPT演示文稿。

## 新增功能: 增强型PPT生成

我们最近对PPT生成系统进行了重大升级，添加了以下核心功能：

1. **自定义模板支持**：现在系统可以使用位于`/back/ppt_templates`目录下的自定义PPT模板
2. **AI图片生成**：不再依赖网络搜索图片，而是使用AI根据内容生成符合主题的高质量图片
3. **HTML中间格式**：通过HTML中间格式实现更灵活的布局和内容展示

### 如何使用新功能

1. 将您的PPT模板文件(.pptx)和对应的JSON配置文件放在`/back/ppt_templates`目录下
2. 在`/back/config.json`中配置AI图片生成API的密钥和URL
3. 调用新的API端点：`/api/enhancedPpt/generate`

API请求示例：

```json
{
  "topic": "植物细胞结构",
  "subject": "生物学",
  "template": "绿色圆点",
  "theme": "edu"
}
```

也可以直接提供大纲：

```json
{
  "outline": [
    {
      "type": "title",
      "title": "植物细胞结构",
      "subtitle": "生物学基础知识"
    },
    {
      "type": "content",
      "title": "植物细胞的主要结构",
      "content": ["细胞壁", "细胞膜", "细胞质", "细胞核", "叶绿体"]
    }
  ],
  "template": "绿色圆点"
}
```

## 原有功能说明

系统支持以下功能:

1. 从主题生成完整PPT
2. 从详细大纲生成PPT
3. 支持多种模板
4. 整合知识库增强内容

## API接口

### 1. 从主题生成PPT

```
POST /api/aiPpt/generate-outline
Content-Type: application/json

{
    "topic": "人工智能发展历史",
    "subject": "计算机科学",
    "depth": "comprehensive",
    "style": "academic"
}
```

### 2. 根据大纲生成PPT

```
POST /api/aiPpt/gen-pptx-python
Content-Type: application/json

{
    "outline": [内容大纲],
    "template": "template_name"
}
```

## 环境配置

运行环境需要:

1. Python 3.8+
2. 必要的依赖库 (见requirements.txt)
3. PowerPoint (用于模板)
4. 网络连接 (用于API调用)

## 启动应用

```bash
# 安装依赖
pip install -r requirements.txt

# 运行应用
python app.py
```

或者使用提供的批处理脚本:

```bash
# Windows
start_app.bat

# Linux/Mac
./start.sh
```

## 常见问题

### Q: 如何添加新模板?
A: 将PowerPoint模板文件(.pptx)放在`ppt_templates`目录中，系统会自动识别。

### Q: 是否支持自定义主题?
A: 是的，新版本支持"green"、"blue"、"purple"、"dark"和"edu"等多种预设主题，您也可以在配置文件中自定义新主题。

### Q: 如何配置AI图片生成?
A: 在`config.json`文件中设置`AI_IMAGE_API_KEY`和`AI_IMAGE_API_URL`参数。

### 技术支持

如有问题或需要帮助，请创建issue或联系系统管理员。 

## PPT生成系统后端

### 功能特性

- 基于AI生成PPT内容和结构
- 支持使用模板生成精美PPT
- 整合知识库增强内容质量
- 自动生成相关图片
- 支持自定义PPT生成配置

### 系统改进

系统最近进行了多项改进：

1. 优化了HTML中间格式生成路径，解决了大块空白区域问题
2. 修复了模板应用逻辑，确保模板能正确被应用到生成的PPT中
3. 改进了图片生成集成，确保图片能正确生成并插入PPT
4. 增加了模板预处理功能，将PPT模板预先转换为HTML模板，提高生成效率和稳定性

### 快速开始

1. 安装依赖:
   ```
   pip install -r requirements.txt
   ```

2. 运行启动脚本:
   ```
   # Windows
   start_ppt_engine.bat
   
   # Linux/Mac
   ./start_ppt_engine.sh
   ```
   
   启动脚本会首先预处理所有PPT模板，将其转换为HTML模板，然后启动PPT引擎服务。

3. 访问API:
   ```
   http://localhost:5000/api/health
   ```

### 模板管理

系统支持使用PPT模板生成幻灯片:

1. 将PPTX模板文件放入 `ppt_templates` 目录
2. 模板会被自动预处理为HTML格式，存储在 `ppt_engine/html_templates/{template_name}` 目录下
3. 通过API指定模板名称即可使用模板生成PPT

### 模板预处理

系统通过预处理将PPT模板转换为HTML模板，提高生成效率:

```
python preprocess_templates.py [--force]
```

参数:
- `--force`: 强制重新生成已存在的模板

### API文档

主要API端点:

- `/api/aiPpt/generate-outline` - 生成PPT大纲
- `/api/aiPpt/gen-pptx-enhanced` - 生成增强版PPT
- `/api/aiPpt/ppt/templates` - 获取可用模板列表

详细API文档请参阅 [API文档](API_DOC.md)。 