"""
幻灯片主题风格插件
提供各种预定义的主题风格
"""

import os
import logging
from pptx.dml.color import RGBColor

# 配置日志
logger = logging.getLogger("theme_styles_plugin")

# 预定义主题颜色
THEME_COLORS = {
    # 经典蓝色主题
    "classic_blue": {
        "theme_color": RGBColor(0, 102, 204),  # 主题色（深蓝色）
        "accent_color": RGBColor(51, 153, 255),  # 强调色（亮蓝色）
        "text_color": RGBColor(0, 0, 0),  # 文本颜色（黑色）
        "background_color": RGBColor(255, 255, 255),  # 背景色（白色）
        "title_font_size": 36,
        "subtitle_font_size": 24,
        "heading_font_size": 28,
        "content_font_size": 18
    },
    
    # 现代简约主题
    "modern_minimal": {
        "theme_color": RGBColor(50, 50, 50),  # 主题色（深灰色）
        "accent_color": RGBColor(240, 100, 0),  # 强调色（橙色）
        "text_color": RGBColor(50, 50, 50),  # 文本颜色（深灰色）
        "background_color": RGBColor(240, 240, 240),  # 背景色（浅灰色）
        "title_font_size": 40,
        "subtitle_font_size": 24,
        "heading_font_size": 28,
        "content_font_size": 18
    },
    
    # 科技主题
    "tech_theme": {
        "theme_color": RGBColor(0, 176, 240),  # 主题色（亮蓝色）
        "accent_color": RGBColor(0, 112, 192),  # 强调色（蓝色）
        "text_color": RGBColor(255, 255, 255),  # 文本颜色（白色）
        "background_color": RGBColor(32, 32, 32),  # 背景色（深灰色）
        "title_font_size": 38,
        "subtitle_font_size": 22,
        "heading_font_size": 26,
        "content_font_size": 17
    },
    
    # 自然绿色主题
    "nature_green": {
        "theme_color": RGBColor(46, 139, 87),  # 主题色（海绿色）
        "accent_color": RGBColor(144, 238, 144),  # 强调色（浅绿色）
        "text_color": RGBColor(0, 0, 0),  # 文本颜色（黑色）
        "background_color": RGBColor(240, 248, 240),  # 背景色（浅绿色）
        "title_font_size": 36,
        "subtitle_font_size": 22,
        "heading_font_size": 28,
        "content_font_size": 18
    },
    
    # 教育主题
    "education": {
        "theme_color": RGBColor(70, 32, 102),  # 主题色（深紫色）
        "accent_color": RGBColor(126, 87, 194),  # 强调色（亮紫色）
        "text_color": RGBColor(51, 51, 51),  # 文本颜色（深灰色）
        "background_color": RGBColor(248, 245, 250),  # 背景色（浅紫色）
        "title_font_size": 38,
        "subtitle_font_size": 24,
        "heading_font_size": 28,
        "content_font_size": 18
    },
    
    # 商务主题
    "business": {
        "theme_color": RGBColor(0, 51, 102),  # 主题色（深蓝色）
        "accent_color": RGBColor(192, 0, 0),  # 强调色（红色）
        "text_color": RGBColor(0, 0, 0),  # 文本颜色（黑色）
        "background_color": RGBColor(255, 255, 255),  # 背景色（白色）
        "title_font_size": 36,
        "subtitle_font_size": 22,
        "heading_font_size": 28,
        "content_font_size": 18
    },
    
    # 医疗主题
    "medical": {
        "theme_color": RGBColor(0, 128, 128),  # 主题色（墨绿色）
        "accent_color": RGBColor(0, 204, 204),  # 强调色（青色）
        "text_color": RGBColor(0, 0, 0),  # 文本颜色（黑色）
        "background_color": RGBColor(240, 248, 250),  # 背景色（浅青色）
        "title_font_size": 36,
        "subtitle_font_size": 22,
        "heading_font_size": 26,
        "content_font_size": 18
    },
    
    # 创意主题
    "creative": {
        "theme_color": RGBColor(204, 0, 102),  # 主题色（桃红色）
        "accent_color": RGBColor(255, 153, 0),  # 强调色（橙色）
        "text_color": RGBColor(51, 51, 51),  # 文本颜色（深灰色）
        "background_color": RGBColor(255, 248, 250),  # 背景色（浅粉色）
        "title_font_size": 42,
        "subtitle_font_size": 26,
        "heading_font_size": 30,
        "content_font_size": 18
    }
}

# 主题背景样式
THEME_BACKGROUNDS = {
    "classic_blue": {
        "type": "solid",
        "color": "#FFFFFF"
    },
    "modern_minimal": {
        "type": "solid",
        "color": "#F0F0F0"
    },
    "tech_theme": {
        "type": "solid",
        "color": "#202020"
    },
    "nature_green": {
        "type": "gradient",
        "direction": "vertical",
        "start_color": "#F0F8F0",
        "end_color": "#E0F0E0"
    },
    "education": {
        "type": "solid",
        "color": "#F8F5FA"
    },
    "business": {
        "type": "solid",
        "color": "#FFFFFF"
    },
    "medical": {
        "type": "gradient",
        "direction": "horizontal",
        "start_color": "#F0F8FA",
        "end_color": "#E0F0F0"
    },
    "creative": {
        "type": "gradient",
        "direction": "vertical",
        "start_color": "#FFF8FA",
        "end_color": "#FFF0E0"
    }
}

# 形状样式
SHAPE_STYLES = {
    "classic_blue": {
        "outline": {
            "color": "#0066CC",
            "width": 1
        },
        "fill": {
            "color": "#E6F0FF"
        },
        "text": {
            "color": "#000000",
            "align": "left"
        }
    },
    "modern_minimal": {
        "outline": {
            "color": "#323232",
            "width": 1
        },
        "fill": {
            "color": "#FFFFFF"
        },
        "text": {
            "color": "#323232",
            "align": "left"
        }
    },
    "tech_theme": {
        "outline": {
            "color": "#00B0F0",
            "width": 1
        },
        "fill": {
            "color": "#2A2A2A"
        },
        "text": {
            "color": "#FFFFFF",
            "align": "left"
        }
    }
}

# 页脚样式
FOOTER_STYLES = {
    "classic_blue": {
        "text": "演示文稿",
        "show_slide_number": True,
        "show_date": True
    },
    "modern_minimal": {
        "text": "",
        "show_slide_number": True,
        "show_date": False
    },
    "tech_theme": {
        "text": "技术演示",
        "show_slide_number": True,
        "show_date": True
    }
}

def get_theme_config(theme_name):
    """
    获取主题配置
    
    Args:
        theme_name: 主题名称
        
    Returns:
        主题配置字典
    """
    # 如果找不到指定主题，使用经典蓝色主题
    if theme_name not in THEME_COLORS:
        theme_name = "classic_blue"
        logger.warning(f"未找到主题: {theme_name}，使用经典蓝色主题")
        
    # 创建主题配置
    theme_config = {}
    
    # 添加颜色配置
    theme_config.update(THEME_COLORS[theme_name])
    
    # 添加背景样式
    if theme_name in THEME_BACKGROUNDS:
        theme_config["background_style"] = THEME_BACKGROUNDS[theme_name]
        
    # 添加形状样式
    if theme_name in SHAPE_STYLES:
        theme_config["shape_style"] = SHAPE_STYLES[theme_name]
        
    # 添加页脚样式
    if theme_name in FOOTER_STYLES:
        theme_config["footer"] = FOOTER_STYLES[theme_name]
        
    return theme_config
    
def apply_theme_to_slide_data(slides_data, theme_name):
    """
    将主题应用到幻灯片数据
    
    Args:
        slides_data: 幻灯片数据列表
        theme_name: 主题名称
        
    Returns:
        应用主题后的幻灯片数据
    """
    # 获取主题配置
    theme_config = get_theme_config(theme_name)
    
    # 应用主题到每张幻灯片
    for slide_data in slides_data:
        # 添加背景样式
        if "background_style" in theme_config:
            slide_data["background_style"] = theme_config["background_style"]
            
        # 添加形状样式
        if "shape_style" in theme_config:
            slide_data["shape_style"] = theme_config["shape_style"]
            
        # 添加页脚
        if "footer" in theme_config:
            slide_data["footer"] = theme_config["footer"]
            
    return slides_data, theme_config

def get_available_themes():
    """
    获取所有可用的主题
    
    Returns:
        主题名称列表
    """
    return list(THEME_COLORS.keys()) 