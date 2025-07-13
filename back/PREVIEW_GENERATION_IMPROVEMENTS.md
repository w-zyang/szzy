# PPT模板预览图生成改进

## 问题背景

原有的PPT模板预览图生成方法存在以下问题：

1. 无法正确捕获PPT模板的实际视觉效果
2. 只能生成简单的颜色背景和文本
3. 在某些环境下依赖Windows COM对象，可能会失败
4. 缺乏跨平台支持

## 改进方案

我们实现了一个多方法、多平台的预览图生成解决方案，按优先级顺序尝试以下方法：

1. **PowerPoint COM对象**（仅Windows平台）：使用PowerPoint应用程序导出第一页为PNG图片，效果最佳但需要Windows系统和权限。

2. **LibreOffice**（跨平台）：使用LibreOffice的命令行功能将PPT转换为PNG图片，可在多种操作系统上工作，效果良好。

3. **python-pptx**（跨平台）：使用python-pptx库提取幻灯片内容并创建预览图，适用于所有平台但效果相对较差。

4. **备选方法**：如果以上方法都失败，创建一个基本预览图，显示模板名称和简单背景。

## 新增文件

1. `generate_preview.py` - 模板预览图生成脚本，支持多种方法
2. `regenerate_all_previews.py` - 批量重新生成所有模板预览图的脚本
3. `ppt_templates/previews/README.md` - 预览图目录说明文档

## 修改文件

1. `app.py` - 更新预览图生成逻辑，使用新的生成脚本
2. `requirements.txt` - 更新依赖，添加条件依赖
3. `README.md` - 更新文档，添加预览图生成相关说明

## 使用方法

### 自动生成

系统会在以下情况自动生成预览图：

1. 上传新模板时
2. 请求模板预览图但缓存中不存在时
3. 模板文件更新后再次请求预览图时

### 手动生成

可以使用以下命令手动生成预览图：

```bash
# 生成单个模板预览图
python generate_preview.py ppt_templates/模板文件.pptx

# 重新生成所有模板预览图
python regenerate_all_previews.py
```

## 效果对比

改进后的预览图能够正确显示模板的实际外观，包括背景、布局、颜色和文本样式，而不仅仅是简单的颜色块和文本。

## 注意事项

1. 在Windows环境中，PowerPoint COM对象方法可能需要管理员权限
2. 在Linux/Mac环境中，需要安装LibreOffice
3. 预览图生成可能需要一些时间，特别是对于复杂的模板 