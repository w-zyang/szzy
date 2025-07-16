# HTML中间格式PPT引擎

本文档描述了基于HTML中间格式的PPT生成引擎的工作原理和使用方法。

## 核心工作流程

1. 将PPT模板转换为HTML模板
2. 将大纲内容填充到HTML模板中
3. 将HTML转换为PPT

## 目录结构

```
ppt_engine/
  - __init__.py
  - template_converter.py  # 模板转换器
  - content_filler.py      # 内容填充器
  - html_to_ppt.py         # HTML转PPT转换器
  - unified_generator.py   # 统一生成器
  - core.py                # 引擎核心
  - content_generator.py   # 内容生成器
  - style_manager.py       # 样式管理器
  - layout_manager.py      # 布局管理器
  - ai_outline_generator.py # AI大纲生成器
  - renderer.py            # 渲染器
  - template_manager.py    # 模板管理器
  - html_templates/        # HTML模板目录
```

## 重要修复

### 解决PPT生成空白、没有应用模板、没有图片的问题

我们修复了以下几个重要问题：

1. **图片生成问题**：
   - 修复了图片生成服务的整合问题
   - 确保每张幻灯片都能根据其内容生成相关图片
   - 添加了详细日志记录用于调试图片生成过程
   - 支持使用百度文心大模型和阿里云百炼API生成图片

2. **模板应用问题**：
   - 修复了模板解析和应用流程
   - 确保HTML模板能正确转换为PPT布局
   - 优化了布局选择逻辑，确保内容正确放置

3. **内容空白问题**：
   - 加强了内容填充的逻辑
   - 为空白内容添加默认值
   - 确保关键部分总是有内容显示

### 图片生成功能的改进

图片生成现在支持多种方式：

1. **AI模型生成**：使用百度文心或阿里云API生成高质量图片
2. **图片搜索**：搜索与内容相关的图片
3. **默认图片**：针对特定主题提供相关的默认图片
4. **智能缓存**：避免重复请求相同图片

### 使用方法

要生成带有自动图片的PPT，请使用增强版API：

```python
from ppt_engine.core import PPTEngineCore

# 初始化引擎
engine = PPTEngineCore()

# 从主题直接生成
output_path = engine.generate_from_topic("细胞的结构与功能", subject="生物")

# 或者从大纲生成
slides_data = [...]  # 幻灯片数据
output_path = engine.create_presentation(slides_data, template_path, theme="edu")
```

## 后续改进方向

1. 进一步优化图片生成质量
2. 提高模板适配的智能性
3. 添加更多专业领域的内容生成支持
4. 优化生成速度和性能 