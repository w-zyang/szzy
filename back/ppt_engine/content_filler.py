#!/usr/bin/env python
"""
内容填充器
将大纲内容填充到HTML模板中
"""

import os
import re
import json
import logging
import jinja2
from bs4 import BeautifulSoup
from markdown import markdown

# 获取模块日志记录器
logger = logging.getLogger("ppt_engine.content_filler")

class ContentFiller:
    """内容填充器，将大纲内容填充到HTML模板中"""
    
    def __init__(self, templates_dir):
        """
        初始化内容填充器
        
        Args:
            templates_dir: HTML模板目录
        """
        self.templates_dir = templates_dir
        
        # 创建Jinja2环境
        self.template_env = jinja2.Environment(
            loader=jinja2.FileSystemLoader(templates_dir),
            autoescape=jinja2.select_autoescape(['html', 'xml'])
        )
        
        # 扫描可用模板
        self.available_templates = self._scan_templates()
    
    def _scan_templates(self):
        """
        扫描可用的HTML模板
        
        Returns:
            按用途分类的模板字典
        """
        templates = {}
        
        # 检查目录是否存在
        if not os.path.exists(self.templates_dir):
            logger.warning(f"模板目录不存在: {self.templates_dir}")
            return templates
        
        # 加载模板信息
        info_path = os.path.join(self.templates_dir, "template_info.json")
        if os.path.exists(info_path):
            try:
                with open(info_path, 'r', encoding='utf-8') as f:
                    template_info = json.load(f)
                    
                # 从模板信息中提取幻灯片用途
                for slide_info in template_info.get("slides", []):
                    for purpose in slide_info.get("suitable_for", []):
                        if purpose not in templates:
                            templates[purpose] = []
                            
                        # 确定模板文件名
                        if purpose == "cover":
                            filename = "cover.html"
                        elif purpose == "conclusion":
                            filename = "conclusion.html"
                        else:
                            purpose_str = "_".join(slide_info.get("suitable_for", []))
                            filename = f"{purpose_str}.html"
                            
                        if os.path.exists(os.path.join(self.templates_dir, filename)):
                            templates[purpose].append(filename)
                            
            except Exception as e:
                logger.warning(f"加载模板信息失败: {str(e)}")
        
        # 如果没有找到模板信息，直接扫描HTML文件
        if not templates:
            html_files = [f for f in os.listdir(self.templates_dir) if f.endswith('.html')]
            
            for html_file in html_files:
                purpose = self._determine_template_purpose(os.path.join(self.templates_dir, html_file))
                
                if purpose not in templates:
                    templates[purpose] = []
                    
                templates[purpose].append(html_file)
                
        logger.info(f"找到{sum(len(templates[purpose]) for purpose in templates)}个HTML模板")
        return templates
    
    def _determine_template_purpose(self, html_path):
        """
        确定HTML模板的用途
        
        Args:
            html_path: HTML文件路径
            
        Returns:
            用途字符串
        """
        # 从文件名中提取用途
        filename = os.path.basename(html_path)
        
        if filename == "cover.html":
            return "cover"
        elif filename == "conclusion.html":
            return "conclusion"
            
        # 从文件名中提取用途信息
        purpose_match = re.search(r'(cover|content|image|table|conclusion)\.html$', filename)
        if purpose_match:
            return purpose_match.group(1)
            
        # 从文件名中提取组合用途
        if "_" in filename:
            parts = filename.split('_')
            if len(parts) > 0:
                return parts[0]
        
        # 尝试从HTML内容中提取用途
        try:
            with open(html_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
                
            soup = BeautifulSoup(html_content, 'html.parser')
            container = soup.select_one('.slide-container')
            
            if container and container.has_attr('data-purpose'):
                purposes = container['data-purpose'].split(',')
                return purposes[0]
        except Exception as e:
            logger.warning(f"从HTML内容中提取用途信息失败: {str(e)}")
            
        # 默认为通用内容
        return "content"
    
    def get_template_for_slide(self, slide_data):
        """
        为幻灯片内容选择合适的模板
        
        Args:
            slide_data: 幻灯片数据
            
        Returns:
            模板文件名
        """
        # 确定幻灯片类型
        slide_type = slide_data.get('type', '').lower()
        if not slide_type:
            # 尝试根据内容判断类型
            if 'image' in slide_data:
                if 'content' in slide_data or 'title' in slide_data:
                    slide_type = 'image_content'
                else:
                    slide_type = 'image'
            elif 'table' in slide_data:
                slide_type = 'table'
            elif 'keypoints' in slide_data or 'bullet_points' in slide_data:
                slide_type = 'bullet'
            else:
                slide_type = 'content'
        
        # 特殊处理封面和结论
        index = slide_data.get('index', 0)
        if index == 0:
            slide_type = 'cover'
        
        # 查找匹配的模板
        if slide_type in self.available_templates and self.available_templates[slide_type]:
            return self.available_templates[slide_type][0]
            
        # 查找通用模板
        if 'content' in self.available_templates and self.available_templates['content']:
            return self.available_templates['content'][0]
            
        # 找不到合适的模板，返回第一个可用模板
        for templates in self.available_templates.values():
            if templates:
                return templates[0]
                
        # 找不到任何模板
        logger.error(f"找不到任何可用的模板")
        return None
    
    def fill_slide_content(self, slide_data):
        """
        填充幻灯片内容到HTML模板
        
        Args:
            slide_data: 幻灯片数据
            
        Returns:
            填充好内容的HTML字符串
        """
        # 获取合适的模板
        template_file = self.get_template_for_slide(slide_data)
        
        if not template_file:
            logger.error(f"没有找到适合的模板")
            return None
            
        try:
            # 加载模板
            template = self.template_env.get_template(template_file)
            
            # 准备填充数据
            fill_data = self._prepare_template_data(slide_data)
            
            # 渲染模板
            html = template.render(**fill_data)
            
            return html
        except Exception as e:
            logger.error(f"填充内容失败: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return None
    
    def _prepare_template_data(self, slide_data):
        """
        准备模板填充数据
        
        Args:
            slide_data: 幻灯片数据
            
        Returns:
            用于模板渲染的数据字典
        """
        data = {
            # 基本字段
            "title": slide_data.get("title", ""),
            "content": "",
            "image_url": "",
            "table_html": "",
            "bullet_points": "",
            # 添加原始数据，以便高级模板可以访问
            "slide_data": slide_data
        }
        
        # 处理内容（支持Markdown）
        content = slide_data.get("content", "")
        if content:
            data["content"] = markdown(content)
            
        # 处理项目符号列表
        keypoints = []
        
        # 从不同可能的字段中获取要点
        for field in ["keypoints", "bullet_points", "points"]:
            points = slide_data.get(field, [])
            if points:
                # 处理不同格式的要点
                for point in points:
                    if isinstance(point, dict):
                        point_text = point.get("text", "") or point.get("content", "")
                        keypoints.append(point_text)
                    elif isinstance(point, str):
                        keypoints.append(point)
                
                # 只使用一个字段的要点，避免重复
                if keypoints:
                    break
                    
        data["keypoints"] = keypoints
        
        # 处理图片URL
        image_url = None
        # 优先检查image_url字段
        if "image_url" in slide_data:
            image_url = slide_data["image_url"]
        # 其次检查image字段
        elif "image" in slide_data:
            image = slide_data["image"]
            if isinstance(image, str):
                # 如果image字段是字符串，可能是URL或文件路径
                image_url = image
            elif isinstance(image, dict) and "url" in image:
                # 如果image字段是字典，尝试获取url字段
                image_url = image["url"]
            elif isinstance(image, dict) and "data" in image:
                # 如果包含data字段（可能是base64编码的数据URL）
                image_url = image["data"]
                
        if image_url:
            # 处理不同类型的图片源
            if isinstance(image_url, str):
                if image_url.startswith("data:"):
                    # 数据URL，直接使用
                    data["image_url"] = image_url
                elif image_url.startswith("file://"):
                    # 确保file://路径格式正确，移除多余的斜杠
                    file_path = image_url.replace("file:///", "file://")
                    data["image_url"] = file_path
                elif image_url.startswith(("/", "\\")) or ":" in image_url:
                    # 绝对路径，转换为file://格式
                    abs_path = os.path.abspath(image_url)
                    data["image_url"] = f"file://{abs_path}"
                else:
                    # 相对路径、URL或其他格式，直接使用
                    data["image_url"] = image_url
                    
            logger.info(f"处理图片URL: {data['image_url']}")
                
        # 处理表格
        table_data = slide_data.get("table", None)
        if table_data:
            if isinstance(table_data, str):
                # 如果表格数据是HTML字符串，直接使用
                data["table_html"] = table_data
            elif isinstance(table_data, (list, tuple)):
                # 如果表格数据是列表或元组，构造HTML表格
                table_html = "<table border='1' cellpadding='4'>"
                
                # 添加表头（第一行）
                if len(table_data) > 0:
                    table_html += "<thead><tr>"
                    for cell in table_data[0]:
                        table_html += f"<th>{cell}</th>"
                    table_html += "</tr></thead>"
                    
                # 添加表格内容（剩余行）
                if len(table_data) > 1:
                    table_html += "<tbody>"
                    for row in table_data[1:]:
                        table_html += "<tr>"
                        for cell in row:
                            table_html += f"<td>{cell}</td>"
                        table_html += "</tr>"
                    table_html += "</tbody>"
                    
                table_html += "</table>"
                data["table_html"] = table_html
                
        # 添加布局信息
        data["layout"] = slide_data.get("layout", "")
        data["type"] = slide_data.get("type", "")
                
        return data
        
def fill_outline_content(outline, templates_dir):
    """
    将大纲内容填充到HTML模板中
    
    Args:
        outline: 大纲数据（列表或字典）
        templates_dir: HTML模板目录
        
    Returns:
        填充好内容的HTML列表
    """
    # 确保模板目录存在
    if not os.path.exists(templates_dir):
        logger.error(f"模板目录不存在: {templates_dir}")
        return []
        
    # 初始化填充器
    filler = ContentFiller(templates_dir)
    
    # 处理大纲格式
    slides = []
    if isinstance(outline, dict) and "slides" in outline:
        slides = outline["slides"]
    elif isinstance(outline, list):
        slides = outline
    else:
        logger.error("无效的大纲格式")
        return []
    
    # 提取所有幻灯片标题用于导航栏
    slide_titles = []
    for i, slide_data in enumerate(slides):
        title = slide_data.get("title", f"幻灯片 {i+1}")
        slide_titles.append({"index": i, "title": title})
    
    # 填充每个幻灯片
    filled_slides = []
    for i, slide_data in enumerate(slides):
        # 添加索引信息
        if "index" not in slide_data:
            slide_data["index"] = i
            
        # 添加导航信息
        slide_data["navigation"] = slide_titles
        slide_data["current_index"] = i
        slide_data["total_slides"] = len(slides)
            
        # 填充内容
        html = filler.fill_slide_content(slide_data)
        if html:
            # 添加导航栏
            html = _add_navigation_to_html(html, slide_titles, i)
            
            # 添加幻灯片编号
            html = _add_slide_number(html, i+1, len(slides))
            
            filled_slides.append(html)
            
    logger.info(f"成功填充了 {len(filled_slides)} 张幻灯片")
    return filled_slides

def _add_navigation_to_html(html, slide_titles, current_index):
    """
    向HTML添加导航栏
    
    Args:
        html: HTML内容
        slide_titles: 幻灯片标题列表
        current_index: 当前幻灯片索引
        
    Returns:
        添加导航栏后的HTML
    """
    # 创建导航HTML
    nav_html = '<div class="slide-nav">\n'
    for i, slide in enumerate(slide_titles):
        active_class = ' class="active"' if i == current_index else ''
        nav_html += f'  <div class="slide-nav-item"{active_class}>{i+1}. {slide["title"]}</div>\n'
    nav_html += '</div>\n'
    
    # 查找插入位置
    if '<div class="slide-nav">' in html:
        # 已有导航栏占位符，替换它
        html = re.sub(r'<div class="slide-nav">.*?</div>\s*', nav_html, html, flags=re.DOTALL)
    else:
        # 没有导航栏占位符，在slide-container后插入
        html = html.replace('<div class="slide', '<div class="slide-with-nav slide', 1)
        
    return html

def _add_slide_number(html, current, total):
    """
    向HTML添加幻灯片编号
    
    Args:
        html: HTML内容
        current: 当前幻灯片编号
        total: 总幻灯片数
        
    Returns:
        添加编号后的HTML
    """
    # 创建幻灯片编号HTML
    number_html = f'<div class="slide-number">{current}/{total}</div>'
    
    # 在</body>前插入
    if '</body>' in html:
        html = html.replace('</body>', f'{number_html}</body>')
    else:
        html += number_html
        
    # 添加样式
    style_html = """
<style>
.slide-number {
    position: absolute;
    right: 20px;
    bottom: 20px;
    font-size: 14px;
    color: #666;
}
.slide-with-nav {
    position: relative;
}
.slide-with-nav .slide-content {
    margin-left: 150px;
}
.slide-nav {
    position: absolute;
    left: 0;
    top: 0;
    width: 150px;
    height: 100%;
    background-color: #f0f0f0;
    border-right: 1px solid #ddd;
    padding: 20px 0;
    overflow-y: auto;
}
.slide-nav-item {
    padding: 8px 15px;
    cursor: pointer;
    font-size: 14px;
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.slide-nav-item.active {
    background-color: #2E7D32;
    color: white;
}
</style>
"""
    
    # 在</head>前插入
    if '</head>' in html:
        html = html.replace('</head>', f'{style_html}</head>')
    
    return html
    
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 3:
        print("用法: python content_filler.py <大纲JSON文件路径> <模板目录路径>")
        sys.exit(1)
        
    outline_path = sys.argv[1]
    templates_dir = sys.argv[2]
    
    # 加载大纲数据
    with open(outline_path, 'r', encoding='utf-8') as f:
        outline = json.load(f)
        
    # 填充内容
    filled_slides = fill_outline_content(outline, templates_dir)
    
    # 保存填充后的HTML
    for i, html in enumerate(filled_slides):
        output_path = f"slide_{i+1}.html"
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html)
            
        print(f"已保存第 {i+1} 张幻灯片: {output_path}") 