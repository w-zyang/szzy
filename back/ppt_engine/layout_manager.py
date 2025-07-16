import os
import sys
import logging
import json
from pathlib import Path

# 配置日志
logger = logging.getLogger("ppt_engine.layout_manager")

class Layout:
    """布局基类"""
    
    def __init__(self, template, layout_type):
        """
        初始化布局
        
        Args:
            template: 模板数据
            layout_type: 布局类型
        """
        self.template = template
        self.layout_type = layout_type
        self.html_template = self._load_html_template()
        self.css_template = self._load_css_template()
        
    def _load_html_template(self):
        """加载HTML模板"""
        template_dir = self.template.get('dir')
        if not template_dir:
            logger.warning(f"模板目录未指定，使用默认模板")
            return self._get_default_html()
            
        html_file = os.path.join(template_dir, f"{self.layout_type}.html")
        if not os.path.exists(html_file):
            logger.warning(f"找不到HTML模板文件: {html_file}，使用默认模板")
            return self._get_default_html()
            
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            logger.error(f"读取HTML模板失败: {str(e)}")
            return self._get_default_html()
            
    def _load_css_template(self):
        """加载CSS模板"""
        template_dir = self.template.get('dir')
        if not template_dir:
            logger.warning(f"模板目录未指定，使用默认CSS")
            return self._get_default_css()
            
        css_file = os.path.join(template_dir, f"{self.layout_type}.css")
        if not os.path.exists(css_file):
            logger.warning(f"找不到CSS模板文件: {css_file}，使用默认CSS")
            return self._get_default_css()
            
        try:
            with open(css_file, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            logger.error(f"读取CSS模板失败: {str(e)}")
            return self._get_default_css()
            
    def _get_default_html(self):
        """获取默认HTML模板"""
        if self.layout_type == 'title':
            return """<div class="slide-content title-content">
    <h1 class="main-title">{{title}}</h1>
    <h2 class="subtitle">{{subtitle}}</h2>
</div>"""
        elif self.layout_type == 'content' or self.layout_type == 'bullet_points':
            return """<div class="slide-header">
    <h1 class="slide-title">{{title}}</h1>
</div>
<div class="slide-content">
    <div class="content-text">{{content}}</div>
    <div class="bullet-list">
        {{#each bullet_points}}
        <div class="bullet-item">
            <div class="bullet-marker"></div>
            <div class="bullet-text">{{this}}</div>
        </div>
        {{/each}}
    </div>
</div>"""
        elif self.layout_type == 'image_text':
            return """<div class="slide-header">
    <h1 class="slide-title">{{title}}</h1>
</div>
<div class="slide-content">
    <div class="image-text-container">
        <div class="image-container">
            <img src="{{image_url}}" alt="{{title}}">
        </div>
        <div class="text-container">
            <div class="content-text">{{content}}</div>
            <div class="bullet-list">
                {{#each bullet_points}}
                <div class="bullet-item">
                    <div class="bullet-marker"></div>
                    <div class="bullet-text">{{this}}</div>
                </div>
                {{/each}}
            </div>
        </div>
    </div>
</div>"""
        else:
            return """<div class="slide-header">
    <h1 class="slide-title">{{title}}</h1>
</div>
<div class="slide-content">
    {{content}}
</div>"""
            
    def _get_default_css(self):
        """获取默认CSS样式"""
        if self.layout_type == 'title':
            return """
.title-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 80%;
    text-align: center;
}

.main-title {
    font-size: 60px;
    font-weight: 700;
    color: var(--primary-color);
    margin-bottom: 30px;
}

.subtitle {
    font-size: 32px;
    font-weight: 500;
    color: var(--secondary-color);
}
"""
        elif self.layout_type == 'content' or self.layout_type == 'bullet_points':
            return """
.content-text {
    font-size: 24px;
    line-height: 1.6;
    color: var(--text-color);
    margin-bottom: 20px;
}

.bullet-list {
    margin-top: 20px;
}

.bullet-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 16px;
}

.bullet-marker {
    width: 12px;
    height: 12px;
    background-color: var(--primary-color);
    border-radius: 50%;
    margin-top: 8px;
    margin-right: 16px;
    flex-shrink: 0;
}

.bullet-text {
    font-size: 24px;
    line-height: 1.5;
    color: var(--text-color);
}
"""
        elif self.layout_type == 'image_text':
            return """
.image-text-container {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 40px;
    height: 100%;
}

.image-container {
    display: flex;
    align-items: center;
    justify-content: center;
}

.image-container img {
    max-width: 100%;
    max-height: 500px;
    object-fit: contain;
}

.text-container {
    padding: 20px 0;
}

.content-text {
    font-size: 22px;
    line-height: 1.6;
    color: var(--text-color);
    margin-bottom: 20px;
}

.bullet-list {
    margin-top: 0;
}

.bullet-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 16px;
}

.bullet-marker {
    width: 12px;
    height: 12px;
    background-color: var(--primary-color);
    border-radius: 50%;
    margin-top: 8px;
    margin-right: 16px;
    flex-shrink: 0;
}

.bullet-text {
    font-size: 22px;
    line-height: 1.5;
    color: var(--text-color);
}
"""
        else:
            return """
.slide-content {
    font-size: 24px;
    line-height: 1.6;
    color: var(--text-color);
}
"""
            
    def render(self, variables):
        """
        渲染模板
        
        Args:
            variables: 变量字典
            
        Returns:
            html: 渲染后的HTML
        """
        html = self.html_template
        
        # 简单的模板变量替换
        for key, value in variables.items():
            if isinstance(value, str):
                placeholder = "{{" + key + "}}"
                html = html.replace(placeholder, value)
                
        # 处理列表类型的变量
        for key, value in variables.items():
            if isinstance(value, list):
                self._render_list(html, key, value)
                
        return html
        
    def _render_list(self, html, key, items):
        """
        渲染列表类型的变量
        
        Args:
            html: HTML模板
            key: 变量名
            items: 列表数据
            
        Returns:
            rendered_html: 渲染后的HTML
        """
        # TODO: 实现列表渲染逻辑
        # 这里需要处理{{#each xxx}}...{{/each}}格式的模板
        pass
        
    def get_css(self):
        """获取CSS样式"""
        return self.css_template
        

class LayoutManager:
    """布局管理器"""
    
    def __init__(self):
        """初始化布局管理器"""
        self.layouts = {}
        
    def get_layout(self, layout_type, template):
        """
        获取布局
        
        Args:
            layout_type: 布局类型
            template: 模板数据
            
        Returns:
            layout: 布局对象
        """
        # 创建布局缓存键
        cache_key = f"{template.get('name', 'default')}_{layout_type}"
        
        # 如果布局已缓存，直接返回
        if cache_key in self.layouts:
            return self.layouts[cache_key]
            
        # 创建新布局
        layout = Layout(template, layout_type)
        
        # 缓存布局
        self.layouts[cache_key] = layout
        
        return layout 