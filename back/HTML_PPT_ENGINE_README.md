# HTML中间格式的PPT生成引擎

基于HTML中间格式的PPT自动生成引擎，可以更灵活地生成各种教学领域的PowerPoint演示文稿。

## 系统架构

该系统采用三阶段处理流程：

1. **模板转换**：将PPT模板转换为HTML模板
2. **内容填充**：将结构化的大纲内容填充到HTML模板中
3. **HTML转PPT**：将填充好内容的HTML渲染为最终的PPT文件

![系统流程图](https://mermaid.ink/img/eyJjb2RlIjoiZ3JhcGggVEQ7XG4gICAgQVtQUFTlhoXlrrnnmbvlhaVdIC0tPiBCW-Wkp-e6p-eUn-aIkF1cbiAgICBCIC0tPiBDW-aooeadvemAieaLqeS4jumAieaLqV1cbiAgICBDIC0tPiBEW-aooeadvuWFg-aVsOaNrue8k-WtmF1cbiAgICBEIC0tPiBFW-aooeadvuaZrumAmuWhq-WFhV1cbiAgICBFIC0tPiBGW1BQVO-8iOaWh-S7tu-8ieaWh-S7tuWHuuWOhl1cblxuICAgIHN1YmdyYXBoIOaooeadvuWkhOeQhuWtl-eOh1xuICAgICAgICBDMVvmqKHmnb7mlofku7bpooTlpITnkIZdIC0tPiBEMVvmj5Dlh7rmqKHmnb7nu5PmnoRdIFxuICAgICAgICBEMSAtLT4gRDJb55Sf5oiKSlNPTuWFg-aVsOaNrl1cbiAgICAgICAgRDIgLS0-IEQzW-eUn-aIiumihOimgeWbvl1cbiAgICBlbmRcblxuICAgIHN1YmdyYXBoIOWGheWuueeetuWFiOWtl-eOh1xuICAgICAgICBCMVvljp_lp4vlhoXlrrnovpPlhaVdIC0tPiBCMlvlhoXlrrnnlJ_lsJ5dXG4gICAgICAgIEIyIC0tPiBCM1vlsI_kuuTnlLPpnaLliIbphY1dXG4gICAgICAgIEIzIC0tPiBCNFvnibnlrprmlbDmja7nlJ_miJBdXG4gICAgZW5kXG5cbiAgICBzdWJncmFwaCDloavlhYXns7vnu59cbiAgICAgICAgRTFb5pm65oWn5biD5bGA5Yy56YWNXSA9PT4gRTJb5YaF5a655aGr5YWFXVxuICAgICAgICBFMiA9PT4gRTNb5Zu-54mH5aSE55CGXS1cbiAgICAgICAgRTMgPT0-IEU0W-agvOW8j-e6oOWTgV1cbiAgICBlbmRcblxuICAgIEIgLS3lhoXlrrnu5byP5qih5Z2XLS0-IEIxXG4gICAgQyAtLeaooeadvuaWh-S7ti0tPiBDMVxuICAgIEQzIC0t5YWD5pWw5o2uLS0-IEUxXG4gICAgQjQgLS3nu5PmnoTljJblhoXlrrktLT4gRTIiLCJtZXJtYWlkIjp7InRoZW1lIjoiZGVmYXVsdCJ9LCJ1cGRhdGVFZGl0b3IiOmZhbHNlLCJhdXRvU3luYyI6dHJ1ZSwidXBkYXRlRGlhZ3JhbSI6dHJ1ZX0)

## 安装与配置

### 安装依赖

```bash
# Windows
python back/setup_ppt_engine.py

# Linux/MacOS
python3 back/setup_ppt_engine.py
```

### 目录结构

```
back/
├── ppt_engine/                   # PPT生成引擎核心
│   ├── __init__.py               # 初始化文件
│   ├── template_converter.py     # PPT模板转HTML模板转换器
│   ├── content_filler.py         # 内容填充器
│   ├── html_to_ppt.py            # HTML转PPT转换器
│   ├── unified_generator.py      # 统一生成器
│   ├── templates/                # HTML模板目录
│   └── html_templates/           # 生成的HTML模板缓存目录
├── examples/                     # 示例文件
│   └── plant_cell_outline.json   # 植物细胞示例大纲
├── setup_ppt_engine.py           # 安装脚本
├── start_ppt_engine.bat          # Windows启动脚本
└── start_ppt_engine.sh           # Linux/MacOS启动脚本
```

## 使用方法

### 命令行使用

```bash
# 生成PPT
python -m ppt_engine.unified_generator -o examples/plant_cell_outline.json -t ppt_templates/绿色圆点.pptx -p 输出.pptx
```

### API使用

```
POST /api/aiPpt/generate-html-ppt
Content-Type: application/json

{
  "outline": {...},  # 大纲数据
  "template": "绿色圆点.pptx"  # 模板文件名
}
```

## 大纲格式

大纲是一个JSON格式的数据，包含多个幻灯片的结构化内容：

```json
{
  "slides": [
    {
      "type": "cover",           // 幻灯片类型：封面
      "title": "标题",           // 标题
      "content": "内容描述",      // 主要内容
      "image": "图片路径"        // 图片路径或URL
    },
    {
      "type": "content",         // 幻灯片类型：内容
      "title": "标题",
      "bullet_points": [         // 项目符号列表
        "第一点",
        "第二点",
        {
          "text": "带层级的点",
          "level": 1            // 层级，0为一级，1为二级，以此类推
        }
      ]
    },
    {
      "type": "image",           // 幻灯片类型：图片
      "title": "标题",
      "content": "内容描述",
      "image": "图片路径"
    },
    {
      "type": "table",           // 幻灯片类型：表格
      "title": "标题",
      "table": [                // 表格数据
        ["表头1", "表头2"],      // 第一行为表头
        ["单元格1", "单元格2"]   // 数据行
      ]
    }
  ]
}
```

## 模板支持

系统支持使用任何PPT模板文件(.pptx)，会自动分析模板结构并生成适配的HTML模板。

推荐的模板命名规范：

- `template_name.pptx`：原始PPT模板文件
- 模板转换后将生成对应的HTML模板，存放在`ppt_engine/html_templates/template_name/`目录下

## 常见问题

### 1. 如何为特定教学领域创建自定义模板？

可以使用PowerPoint创建符合特定教学领域风格的模板，并确保模板中包含各种类型的幻灯片布局（如标题页、内容页、图表页等）。将模板文件放入`ppt_templates`目录即可使用。

### 2. 如何确保图片正确显示？

图片路径可以是：
- 绝对路径：`C:/path/to/image.jpg`
- 相对路径：`images/image.jpg`（相对于工作目录）
- 网络URL：`https://example.com/image.jpg`
- 内置默认图片：`default_images/cover.jpg`

### 3. 系统依赖什么环境？

- Python 3.7+
- python-pptx：处理PowerPoint文件
- jinja2：模板引擎
- selenium：HTML渲染
- Chrome浏览器：用于渲染HTML

### 4. 渲染速度慢怎么办？

HTML渲染是最耗时的步骤，可以通过以下方法优化：
- 减少复杂的HTML/CSS效果
- 预先生成并缓存常用的HTML模板
- 考虑使用其他渲染方案，如wkhtmltopdf或puppeteer

## 许可证

本项目遵循MIT许可证开源。 