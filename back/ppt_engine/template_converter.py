#!/usr/bin/env python
"""
PPT模板转换器
将PowerPoint模板转换为HTML模板格式，便于内容填充
"""

import os
import json
import logging
import sys
from pptx import Presentation
from pptx.enum.shapes import MSO_SHAPE_TYPE

# 获取模块日志记录器
logger = logging.getLogger("ppt_engine.template_converter")

class PPTTemplateConverter:
    """PPT模板转换器，将PPT模板转换为HTML模板"""
    
    def __init__(self, templates_dir=None, html_templates_dir=None):
        """
        初始化转换器
        
        Args:
            templates_dir: PPT模板目录
            html_templates_dir: HTML模板输出目录
        """
        # 获取模块的基础路径
        if templates_dir is None:
            templates_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ppt_templates")
        
        if html_templates_dir is None:
            html_templates_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "html_templates")
            
        self.templates_dir = templates_dir
        self.html_templates_dir = html_templates_dir
        
        # 确保目录存在
        os.makedirs(self.templates_dir, exist_ok=True)
        os.makedirs(self.html_templates_dir, exist_ok=True)
    
    def analyze_ppt_template(self, template_path):
        """
        分析PPT模板，提取结构和元素信息
        
        Args:
            template_path: PPT模板文件路径
            
        Returns:
            模板结构信息字典
        """
        logger.info(f"分析PPT模板: {template_path}")
        
        # 加载PPT文件
        prs = Presentation(template_path)
        
        # 提取模板信息
        template_info = {
            "name": os.path.basename(template_path),
            "slide_count": len(prs.slides),
            "slide_width": prs.slide_width,
            "slide_height": prs.slide_height,
            "slides": []
        }
        
        # 分析每个幻灯片
        for i, slide in enumerate(prs.slides):
            slide_data = {
                "index": i,
                "layout_name": slide.slide_layout.name if hasattr(slide.slide_layout, 'name') else f"Layout {i}",
                "elements": [],
                "suitable_for": self._determine_slide_purpose(slide, i, len(prs.slides))
            }
            
            # 分析幻灯片中的所有形状
            for shape in slide.shapes:
                element = self._analyze_shape(shape)
                if element:
                    slide_data["elements"].append(element)
                    
            template_info["slides"].append(slide_data)
        
        return template_info
    
    def _analyze_shape(self, shape):
        """
        分析PPT中的形状元素
        
        Args:
            shape: 形状对象
            
        Returns:
            元素信息字典
        """
        # 基本信息
        element = {
            "id": getattr(shape, "shape_id", 0),
            "name": shape.name,
            "type": str(shape.shape_type),
            "left": shape.left,
            "top": shape.top,
            "width": shape.width,
            "height": shape.height
        }
        
        # 分析文本框
        if shape.has_text_frame:
            element["content_type"] = "text"
            element["text"] = shape.text
            
            # 检查是否为占位符
            if hasattr(shape, "is_placeholder") and shape.is_placeholder:
                placeholder_type = shape.placeholder_format.type
                if placeholder_type == 1:  # 标题
                    element["role"] = "title"
                elif placeholder_type == 2:  # 正文
                    element["role"] = "content"
                else:
                    element["role"] = f"placeholder_{placeholder_type}"
            
            # 提取文本样式
            element["text_style"] = self._extract_text_style(shape.text_frame)
        
        # 分析图片
        elif shape.shape_type == MSO_SHAPE_TYPE.PICTURE:
            element["content_type"] = "image"
        
        # 分析表格
        elif hasattr(shape, "has_table") and shape.has_table:
            element["content_type"] = "table"
            element["rows"] = shape.table.rows._length
            element["columns"] = shape.table.columns._length
        
        # 其他形状类型
        else:
            element["content_type"] = "shape"
        
        return element
    
    def _extract_text_style(self, text_frame):
        """
        提取文本框的样式信息
        
        Args:
            text_frame: 文本框对象
            
        Returns:
            样式信息字典
        """
        style = {}
        
        # 检查是否有段落
        if not text_frame.paragraphs:
            return style
            
        # 从第一段文本获取样式信息
        p = text_frame.paragraphs[0]
        
        style["alignment"] = str(p.alignment) if hasattr(p, "alignment") else None
        style["level"] = p.level
        
        # 检查是否有文本运行
        if not p.runs:
            return style
            
        # 从第一个运行获取字体信息
        r = p.runs[0]
        if hasattr(r, "font"):
            font = r.font
            style["font_name"] = font.name
            style["font_size"] = font.size.pt if hasattr(font, "size") and font.size else None
            style["bold"] = font.bold
            style["italic"] = font.italic
            
            # 获取颜色信息
            if hasattr(font, "color") and hasattr(font.color, "rgb"):
                rgb = font.color.rgb
                if rgb:
                    style["color"] = f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"
        
        return style
    
    def _determine_slide_purpose(self, slide, index, total_slides):
        """
        确定幻灯片的用途
        
        Args:
            slide: 幻灯片对象
            index: 幻灯片索引
            total_slides: 幻灯片总数
            
        Returns:
            用途列表
        """
        purposes = []
        
        # 根据位置判断
        if index == 0:
            purposes.append("cover")
        elif index == total_slides - 1:
            purposes.append("conclusion")
        else:
            # 检查是否包含特定元素
            has_title = False
            has_content = False
            has_image = False
            has_table = False
            
            # 分析形状
            for shape in slide.shapes:
                # 检查是否为标题
                if hasattr(shape, "is_placeholder") and shape.is_placeholder:
                    if shape.placeholder_format.type == 1:
                        has_title = True
                    elif shape.placeholder_format.type == 2:
                        has_content = True
                
                # 检查是否为图片
                if shape.shape_type == MSO_SHAPE_TYPE.PICTURE:
                    has_image = True
                
                # 检查是否为表格
                if hasattr(shape, "has_table") and shape.has_table:
                    has_table = True
            
            # 根据元素组合确定用途
            if has_title and has_content:
                purposes.append("content")
            if has_image:
                if has_title or has_content:
                    purposes.append("image_content")
                else:
                    purposes.append("image")
            if has_table:
                purposes.append("table")
            
            # 如果没有明确用途，标记为通用内容
            if not purposes:
                purposes.append("general")
        
        return purposes
    
    def convert_to_html_template(self, template_path, output_dir=None):
        """
        将PPT模板转换为HTML模板
        
        Args:
            template_path: PPT模板文件路径
            output_dir: 输出目录路径，如果为None则使用默认目录
            
        Returns:
            HTML模板目录路径
        """
        # 分析模板
        template_info = self.analyze_ppt_template(template_path)
        
        # 确定输出目录
        if output_dir is None:
            template_name = os.path.splitext(os.path.basename(template_path))[0]
            output_dir = os.path.join(self.html_templates_dir, template_name)
            
        # 确保输出目录存在
        os.makedirs(output_dir, exist_ok=True)
        
        # 保存模板信息
        info_path = os.path.join(output_dir, "template_info.json")
        with open(info_path, 'w', encoding='utf-8') as f:
            json.dump(template_info, f, ensure_ascii=False, indent=2)
        
        # 为每个幻灯片生成HTML模板
        html_templates = {}
        for slide_info in template_info["slides"]:
            slide_index = slide_info["index"]
            purposes = slide_info["suitable_for"]
            
            # 创建HTML内容
            html_content = self._create_html_template(slide_info, template_info)
            
            # 确定文件名
            if "cover" in purposes:
                filename = "cover.html"
            elif "conclusion" in purposes:
                filename = "conclusion.html"
            else:
                purpose_str = "_".join(purposes) if purposes else f"slide_{slide_index}"
                filename = f"{purpose_str}.html"
                
            # 保存HTML模板
            file_path = os.path.join(output_dir, filename)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            # 记录模板路径
            for purpose in purposes:
                if purpose not in html_templates:
                    html_templates[purpose] = []
                html_templates[purpose].append(file_path)
                
            logger.info(f"已生成HTML模板: {file_path}")
        
        # 生成主样式表
        css_content = self._generate_css(template_info)
        css_path = os.path.join(output_dir, "style.css")
        with open(css_path, 'w', encoding='utf-8') as f:
            f.write(css_content)
        
        logger.info(f"模板转换完成，输出目录: {output_dir}")
        return output_dir
    
    def _create_html_template(self, slide_info, template_info):
        """
        为幻灯片创建HTML模板
        
        Args:
            slide_info: 幻灯片信息
            template_info: 模板信息
            
        Returns:
            HTML模板内容
        """
        template_name = template_info["name"]
        slide_width = template_info["slide_width"] / 914400  # 转换为像素
        slide_height = template_info["slide_height"] / 914400
        
        # 创建HTML头部
        html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>{slide_info["layout_name"]}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="slide-container" data-purpose="{','.join(slide_info["suitable_for"])}">
"""
        
        # 添加元素
        for element in slide_info["elements"]:
            element_html = self._create_element_html(element)
            html += f"    {element_html}\n"
            
        # 添加HTML尾部
        html += """  </div>
</body>
</html>"""
        
        return html
    
    def _create_element_html(self, element):
        """
        为元素创建HTML代码
        
        Args:
            element: 元素信息
            
        Returns:
            HTML代码
        """
        element_id = f"element_{element['id']}"
        content_type = element.get("content_type", "shape")
        role = element.get("role", "")
        
        # 计算位置和大小（转换为像素）
        left = element["left"] / 914400
        top = element["top"] / 914400
        width = element["width"] / 914400
        height = element["height"] / 914400
        
        # 基本样式
        style = f"style=\"position:absolute; left:{left}px; top:{top}px; width:{width}px; height:{height}px;\""
        
        # 根据元素类型创建HTML
        if content_type == "text":
            classes = f"element text {role}"
            
            if role == "title":
                return f'<h1 id="{element_id}" class="{classes}" {style}>{{{{title}}}}</h1>'
            elif role == "content":
                return f'<div id="{element_id}" class="{classes}" {style}>{{{{content}}}}</div>'
            elif "placeholder" in role:
                return f'<div id="{element_id}" class="{classes}" {style}>{{{{placeholder_{element_id}}}}}</div>'
            else:
                return f'<div id="{element_id}" class="{classes}" {style}>{element.get("text", "")}</div>'
                
        elif content_type == "image":
            classes = f"element image {role}"
            return f'<div id="{element_id}" class="{classes}" {style}><img src="{{{{image_url}}}}" alt="幻灯片图片" style="width:100%; height:100%; object-fit:contain;"></div>'
            
        elif content_type == "table":
            classes = f"element table {role}"
            return f'<div id="{element_id}" class="{classes}" {style}>{{{{table_html}}}}</div>'
            
        else:
            classes = f"element {content_type} {role}"
            return f'<div id="{element_id}" class="{classes}" {style}></div>'
    
    def _generate_css(self, template_info):
        """
        生成CSS样式表
        
        Args:
            template_info: 模板信息
            
        Returns:
            CSS内容
        """
        css = """/* PPT模板自动生成的样式表 */
body {
  margin: 0;
  padding: 0;
  font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
}

.slide-container {
  position: relative;
  width: 1280px;
  height: 720px;
  margin: 0 auto;
  overflow: hidden;
  background: #ffffff;
}

.element {
  position: absolute;
  box-sizing: border-box;
}

h1, h2, h3, h4, h5, h6 {
  margin: 0;
  padding: 0;
}

.text {
  overflow: hidden;
  line-height: 1.5;
}

.title {
  font-weight: bold;
  font-size: 36px;
}

.content {
  font-size: 18px;
}

/* 幻灯片类型特定样式 */
[data-purpose*="cover"] .title {
  font-size: 42px;
  text-align: center;
}

[data-purpose*="conclusion"] .title {
  font-size: 36px;
}

/* 表格样式 */
table.slide-table {
  width: 100%;
  border-collapse: collapse;
}

table.slide-table th {
  background-color: #f0f0f0;
  font-weight: bold;
  text-align: center;
}

table.slide-table th, table.slide-table td {
  border: 1px solid #ddd;
  padding: 8px;
}

/* 列表样式 */
ul.slide-list {
  margin: 0;
  padding: 0 0 0 20px;
}

ul.slide-list li {
  margin-bottom: 10px;
}
"""
        return css

def convert_template(template_path, output_dir=None):
    """
    转换PPT模板为HTML模板的便捷函数
    
    Args:
        template_path: PPT模板文件路径
        output_dir: 输出目录路径
        
    Returns:
        HTML模板目录路径
    """
    converter = PPTTemplateConverter()
    return converter.convert_to_html_template(template_path, output_dir)

if __name__ == "__main__":
    # 命令行接口
    if len(sys.argv) < 2:
        print("用法: python template_converter.py <模板路径> [输出目录]")
        sys.exit(1)
        
    template_path = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else None
    
    convert_template(template_path, output_dir) 