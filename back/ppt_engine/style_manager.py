import os
import sys
import logging
import json
from pathlib import Path

# 配置日志
logger = logging.getLogger("ppt_engine.style_manager")

class StyleManager:
    """样式管理器，负责处理PPT的主题样式"""
    
    def __init__(self):
        """初始化样式管理器"""
        self.base_path = Path(os.path.dirname(os.path.abspath(__file__)))
        self.themes = self._load_builtin_themes()
        
    def _load_builtin_themes(self):
        """加载内置主题"""
        # 内置的预设主题
        builtin_themes = {
            'green': {
                'colors': {
                    'primary': '#2E7D32',
                    'secondary': '#4CAF50',
                    'background': '#FFFFFF',
                    'text': '#333333',
                    'accent1': '#8BC34A',
                    'accent2': '#F1F8E9'
                },
                'fonts': {
                    'heading': 'PingFang SC, Microsoft YaHei, sans-serif',
                    'body': 'PingFang SC, Microsoft YaHei, sans-serif'
                }
            },
            'blue': {
                'colors': {
                    'primary': '#1565C0',
                    'secondary': '#42A5F5',
                    'background': '#FFFFFF',
                    'text': '#333333',
                    'accent1': '#90CAF9',
                    'accent2': '#E3F2FD'
                },
                'fonts': {
                    'heading': 'PingFang SC, Microsoft YaHei, sans-serif',
                    'body': 'PingFang SC, Microsoft YaHei, sans-serif'
                }
            },
            'purple': {
                'colors': {
                    'primary': '#6A1B9A',
                    'secondary': '#9C27B0',
                    'background': '#FFFFFF',
                    'text': '#333333',
                    'accent1': '#CE93D8',
                    'accent2': '#F3E5F5'
                },
                'fonts': {
                    'heading': 'PingFang SC, Microsoft YaHei, sans-serif',
                    'body': 'PingFang SC, Microsoft YaHei, sans-serif'
                }
            },
            'dark': {
                'colors': {
                    'primary': '#455A64',
                    'secondary': '#607D8B',
                    'background': '#263238',
                    'text': '#ECEFF1',
                    'accent1': '#90A4AE',
                    'accent2': '#37474F'
                },
                'fonts': {
                    'heading': 'PingFang SC, Microsoft YaHei, sans-serif',
                    'body': 'PingFang SC, Microsoft YaHei, sans-serif'
                }
            },
            'edu': {
                'colors': {
                    'primary': '#00796B',
                    'secondary': '#26A69A',
                    'background': '#FFFFFF',
                    'text': '#37474F',
                    'accent1': '#80CBC4',
                    'accent2': '#E0F2F1'
                },
                'fonts': {
                    'heading': 'PingFang SC, Microsoft YaHei, sans-serif',
                    'body': 'PingFang SC, Microsoft YaHei, sans-serif'
                }
            }
        }
        
        # 尝试从文件加载其他主题
        themes_dir = os.path.join(self.base_path, "themes")
        if os.path.exists(themes_dir):
            for file in os.listdir(themes_dir):
                if file.endswith(".json"):
                    theme_name = os.path.splitext(file)[0]
                    try:
                        with open(os.path.join(themes_dir, file), 'r', encoding='utf-8') as f:
                            theme_data = json.load(f)
                            builtin_themes[theme_name] = theme_data
                    except Exception as e:
                        logger.error(f"加载主题文件失败: {file}, 错误: {str(e)}")
        
        return builtin_themes
        
    def apply_theme(self, template_data, theme=None):
        """
        应用主题样式到模板
        
        Args:
            template_data: 模板数据
            theme: 主题名称或配置
            
        Returns:
            styled_template: 应用样式后的模板数据
        """
        # 复制模板数据，避免修改原始数据
        styled_template = template_data.copy()
        
        # 获取当前模板的主题
        current_theme = styled_template.get('theme', {})
        
        # 如果提供了主题参数
        if theme:
            # 如果是字符串，尝试加载预设主题
            if isinstance(theme, str):
                if theme in self.themes:
                    new_theme = self.themes[theme]
                else:
                    logger.warning(f"找不到主题: {theme}，使用默认主题")
                    new_theme = {}
            # 如果是字典，直接使用
            elif isinstance(theme, dict):
                new_theme = theme
            else:
                logger.warning(f"无效的主题类型: {type(theme)}，使用默认主题")
                new_theme = {}
                
            # 合并主题
            self._merge_themes(current_theme, new_theme)
            
        # 更新模板数据
        styled_template['theme'] = current_theme
        
        return styled_template
        
    def _merge_themes(self, base_theme, new_theme):
        """
        合并主题
        
        Args:
            base_theme: 基础主题
            new_theme: 新主题
            
        Returns:
            None (修改base_theme)
        """
        # 合并颜色
        if 'colors' in new_theme:
            if 'colors' not in base_theme:
                base_theme['colors'] = {}
                
            for color_key, color_value in new_theme['colors'].items():
                base_theme['colors'][color_key] = color_value
                
        # 合并字体
        if 'fonts' in new_theme:
            if 'fonts' not in base_theme:
                base_theme['fonts'] = {}
                
            for font_key, font_value in new_theme['fonts'].items():
                base_theme['fonts'][font_key] = font_value
                
    def get_theme(self, theme_name):
        """
        获取指定名称的主题
        
        Args:
            theme_name: 主题名称
            
        Returns:
            theme: 主题数据，如果找不到则返回None
        """
        return self.themes.get(theme_name) 