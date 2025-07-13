# 改进版PPT生成器使用指南

## 概述

改进版PPT生成器是一个基于Python的演示文稿自动生成系统，采用组件化和插件式架构设计，具有以下特点：

1. **组件化架构**：将幻灯片元素拆分为独立组件，如标题、内容、图片、图表等，便于扩展和定制
2. **插件式设计**：通过插件机制扩展功能，无需修改核心代码
3. **主题风格系统**：提供多种预定义主题，可以快速应用统一风格
4. **增强的可视化**：支持多种图表类型和数据可视化方式
5. **美化功能**：提供背景、水印、页脚等美化选项

## 安装和依赖

### 安装依赖

```bash
pip install -r requirements.txt
```

主要依赖库：
- python-pptx：PowerPoint文件操作
- pillow：图像处理
- matplotlib：图表生成
- numpy：数值计算
- requests：网络请求

## 基本使用

### 1. 使用演示脚本

```bash
python demo_improved_ppt.py
```

可选参数：
- `-t, --theme`：指定PPT主题，默认为'classic_blue'
- `-o, --output`：指定输出文件路径，默认为'demo_improved.pptx'
- `-l, --list-themes`：列出所有可用主题

示例：
```bash
python demo_improved_ppt.py --theme education --output my_presentation.pptx
```

### 2. 在代码中使用

```python
from improved_ppt_generator import generate_ppt
from image_service import ImageService
from ppt_plugins.theme_styles import apply_theme_to_slide_data

# 准备幻灯片数据
slides_data = [
    {
        "type": "cover",
        "title": "演示文稿标题",
        "content": "副标题内容"
    },
    {
        "type": "content",
        "title": "内容页",
        "content": "这是内容页的文本"
    },
    # ... 更多幻灯片
]

# 应用主题
slides_data, theme_config = apply_theme_to_slide_data(slides_data, "classic_blue")

# 初始化图片服务
image_service = ImageService()

# 生成PPT
success = generate_ppt(
    slides_data=slides_data,
    output_path="output.pptx",
    theme=theme_config,
    image_service=image_service
)
```

## 幻灯片数据格式

每张幻灯片都使用一个JSON对象表示，包含不同的属性：

### 通用属性

所有幻灯片可以包含以下通用属性：

- `type`：幻灯片类型，如"cover"、"content"、"bullet"等
- `title`：幻灯片标题
- `content`：幻灯片内容文本
- `footer`：页脚配置
- `background_style`：背景样式
- `shape_style`：形状样式
- `watermark`：水印配置

### 特殊属性

不同类型的幻灯片可能有特殊属性：

#### 封面幻灯片 (cover)
```json
{
    "type": "cover",
    "title": "演示文稿标题",
    "content": "副标题文本",
    "image": "path/to/cover_image.jpg"
}
```

#### 内容幻灯片 (content)
```json
{
    "type": "content",
    "title": "内容标题",
    "content": "内容详细文本，支持换行符\n可以有多行文本"
}
```

#### 项目符号幻灯片 (bullet)
```json
{
    "type": "bullet",
    "title": "要点列表",
    "bullet_points": [
        "要点1",
        "要点2",
        {"text": "子要点", "level": 1},
        "要点3"
    ]
}
```

#### 图片幻灯片 (image)
```json
{
    "type": "image",
    "title": "图片标题",
    "content": "图片说明文本",
    "image": "path/to/image.jpg"  // 可以是路径、URL或图片数据
}
```

#### 表格幻灯片 (table)
```json
{
    "type": "table",
    "title": "表格标题",
    "content": "表格说明文本",
    "table": [
        ["表头1", "表头2", "表头3"],
        ["单元格1", "单元格2", "单元格3"],
        ["单元格4", "单元格5", "单元格6"]
    ]
}
```

#### 图表幻灯片 (chart)
```json
{
    "type": "chart",
    "title": "图表标题",
    "content": "图表说明文本",
    "chart": {
        "type": "bar",  // 可选：bar, line, pie
        "title": "图表标题",
        "labels": ["类别1", "类别2", "类别3"],
        "values": [10, 20, 15]
    }
}
```

#### 高级图表 (advanced_chart)
```json
{
    "type": "advanced_chart",
    "title": "高级图表",
    "content": "图表说明",
    "advanced_chart": {
        "type": "radar",  // 可选：radar, bubble, histogram, stacked_bar, scatter, boxplot, heatmap
        "title": "雷达图",
        "categories": ["指标1", "指标2", "指标3", "指标4", "指标5"],
        "values": [80, 90, 70, 85, 75]
    }
}
```

### 样式配置

#### 背景样式

```json
"background_style": {
    "type": "solid",  // 可选：solid, gradient, pattern, image
    "color": "#FFFFFF"  // 纯色背景
}
```

```json
"background_style": {
    "type": "gradient",
    "direction": "horizontal",  // 可选：horizontal, vertical
    "start_color": "#E0F0FF",
    "end_color": "#FFFFFF"
}
```

```json
"background_style": {
    "type": "image",
    "image_path": "path/to/background.jpg",
    "process_image": true,
    "opacity": 0.5,
    "brightness": 1.2,
    "blur": 2
}
```

#### 页脚配置

```json
"footer": {
    "text": "公司名称",
    "show_slide_number": true,
    "show_date": true
}
```

#### 水印配置

```json
"watermark": {
    "text": "机密文件",
    "color": "#DDDDDD",
    "size": 48
}
```

## 主题系统

### 可用主题

- `classic_blue`: 经典蓝色主题
- `modern_minimal`: 现代简约主题
- `tech_theme`: 科技主题
- `nature_green`: 自然绿色主题
- `education`: 教育主题
- `business`: 商务主题
- `medical`: 医疗主题
- `creative`: 创意主题

### 自定义主题

您可以通过扩展`ppt_plugins/theme_styles.py`文件添加新的主题。

## 插件系统

### 现有插件

1. **高级图表插件** (advanced_charts.py)
   - 提供更丰富的图表类型：雷达图、气泡图、直方图等

2. **幻灯片美化插件** (slide_beautifier.py)
   - 提供背景样式、形状样式、页脚、水印等美化功能

3. **主题风格插件** (theme_styles.py)
   - 提供预定义主题和主题应用功能

### 创建自定义插件

1. 在`ppt_plugins`目录下创建新的Python文件
2. 定义继承自`SlideComponentBase`的组件类
3. 实现`apply`方法
4. 在`ppt_plugins/__init__.py`中导入新组件

示例：
```python
from improved_ppt_generator import SlideComponentBase

class MyCustomComponent(SlideComponentBase):
    def apply(self, slide, data, context=None):
        # 实现组件逻辑
        # ...
        return slide
```

## Web服务集成

可以通过`app.py`中的API端点使用改进版PPT生成器：

```
POST /api/aiPpt/gen-pptx-improved
```

请求体：
```json
{
    "outline": [...],  // 幻灯片数据
    "template": "template_name",  // 可选，模板名称
    "topic": "主题"  // 可选，演示文稿主题
}
```

## 扩展功能

### 1. 集成AI生成内容

可以将系统与ChatGPT等AI服务集成，自动生成幻灯片内容。

### 2. 添加更多图表类型

扩展高级图表插件，添加更多数据可视化类型。

### 3. 实现实时预览

添加预览功能，在生成最终PPT前查看效果。

## 常见问题

### Q: 为什么某些高级图表无法显示？
A: 请确保已安装matplotlib和numpy库。某些特殊图表可能需要额外的依赖。

### Q: 如何添加自定义字体？
A: 目前Python-PPTX对字体支持有限，只能使用系统安装的字体。

### Q: 如何处理大量数据的表格？
A: 对于大型表格，建议使用分页显示或者缩小字体，避免内容溢出。 