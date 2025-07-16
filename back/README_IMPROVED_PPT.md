# 增强版PPT生成系统 - 使用HTML中间格式方法

本文档介绍增强版PPT生成系统的使用方法和特点。

## 系统架构

增强版PPT生成系统采用全新设计架构，包括以下核心模块：

1. **PPTEngineCore** - 核心控制器
2. **TemplateManager** - 模板管理系统
3. **ContentGenerator** - 内容生成与增强器
4. **StyleManager** - 样式管理系统
5. **Renderer** - 渲染引擎

## 主要功能提升

相比旧版本，增强版PPT生成系统提供以下显著改进：

### 1. 自定义模板支持

系统可以使用位于`/back/ppt_templates`目录下的自定义PPT模板。用户只需将PowerPoint模板文件(.pptx)复制到此目录，系统会自动分析模板结构，生成中间格式以便灵活应用。

### 2. AI图片生成（新增）

系统现在采用全AI图片生成方案，不再依赖从网络搜索图片：

- 根据幻灯片内容自动生成合适的图片生成提示词
- 调用AI图像生成API创建高质量、主题相关的图片
- 支持自定义图片样式和风格
- 图片缓存机制提升性能

**配置方法：**

1. 在`/back/config.json`中设置以下参数：
   ```json
   {
     "AI_IMAGE_API_KEY": "您的API密钥",
     "AI_IMAGE_API_URL": "API终端点URL",
     "USE_AI_IMAGES": true
   }
   ```

2. 目前支持多种AI图片生成服务，如DALL-E、Stable Diffusion等，只需提供对应的API配置。

3. 如果未配置API，系统将使用默认图片库中的图片。

### 3. HTML中间格式

系统使用HTML作为中间格式，实现更灵活的布局和内容展示：

- 精确控制元素位置和样式
- 支持复杂的文本格式化
- 更好的图文混排效果
- 适配不同屏幕尺寸

### 4. 主题系统

内置多种预设主题，包括：

- **green** - 绿色商务主题
- **blue** - 蓝色专业主题
- **purple** - 紫色创意主题
- **dark** - 深色现代主题
- **edu** - 教育教学主题（特别适合课件制作）

### 5. 智能布局

根据内容特点自动选择最合适的布局：

- 标题页布局
- 内容页布局
- 图文混排布局
- 表格数据布局
- 图表数据布局
- 比较页布局
- 总结页布局

## API使用方法

### 从主题生成增强版PPT

```
POST /api/enhancedPpt/generate
Content-Type: application/json

{
    "topic": "植物细胞结构",
    "subject": "生物学",
    "template": "绿色圆点",  // 可选，指定模板
    "theme": "edu"         // 可选，指定主题
}
```

### 从大纲生成增强版PPT

```
POST /api/enhancedPpt/generate
Content-Type: application/json

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
        },
        {
            "type": "image",
            "title": "植物细胞结构图",
            "image": "一张详细标注的植物细胞结构图，清晰展示各个细胞器"  // AI将基于此描述生成图片
        }
    ],
    "template": "绿色圆点",
    "theme": "edu"
}
```

## 响应格式

```json
{
    "success": true,
    "message": "PPT生成成功",
    "file_path": "/uploads/enhanced_ppt_1720274561.pptx",
    "file_name": "enhanced_ppt_1720274561.pptx"
}
```

## 常见问题

1. **如何添加新模板？**
   将PowerPoint模板文件(.pptx)放在`ppt_templates`目录中，系统会自动识别。

2. **如何创建自定义主题？**
   在`style_manager.py`中添加新的主题配置，包括颜色、字体和样式规则。

3. **如何提升图片生成质量？**
   提供更详细的图片描述，或在`content_generator.py`中优化图片提示词生成逻辑。

4. **系统支持哪些类型的内容？**
   支持文本、列表、表格、图表、图片等各种常见演示文稿元素。 