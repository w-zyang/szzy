# PPT模板预览图

此目录包含PPT模板的预览图，用于在前端界面展示模板的第一页幻灯片效果。

## 预览图生成方法

预览图由`generate_preview.py`脚本自动生成，该脚本使用多种方法尝试捕获PPT模板第一页幻灯片的真实外观：

1. **PowerPoint COM对象**（仅Windows平台）：使用PowerPoint应用程序导出第一页为PNG图片，效果最佳但需要Windows系统和权限。

2. **LibreOffice**（跨平台）：使用LibreOffice的命令行功能将PPT转换为PNG图片，可在多种操作系统上工作。

3. **python-pptx**（跨平台）：使用python-pptx库提取幻灯片内容并创建预览图，适用于所有平台但效果相对较差。

4. **备选方法**：如果以上方法都失败，创建一个基本预览图，显示模板名称和简单背景。

## 预览图缓存机制

系统会缓存生成的预览图，只有在以下情况下才会重新生成：

- 模板文件被修改（基于文件修改时间）
- 预览图文件不存在

## 手动生成预览图

可以使用以下命令手动生成预览图：

```bash
python generate_preview.py <template_path> [output_path]
```

例如：

```bash
python generate_preview.py ppt_templates/绿色圆点.pptx
```

## 注意事项

- 预览图的默认尺寸为1024x768像素
- 文件名格式为`{template_name}_preview.png`
- 需要安装相关依赖（见requirements.txt） 