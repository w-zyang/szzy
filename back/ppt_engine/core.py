import os
import sys
import logging
import datetime
import json
from pathlib import Path

# 配置日志
logger = logging.getLogger("ppt_engine.core")

class PPTEngineCore:
    """PPT引擎核心类，统一管理PPT生成流程"""
    
    def __init__(self, config=None):
        """
        初始化PPT引擎核心
        
        Args:
            config: 配置参数字典
        """
        self.config = config or {}
        self.base_path = Path(os.path.dirname(os.path.abspath(__file__)))
        self.output_dir = self.config.get('output_dir', 
                                         os.path.join(self.base_path.parent, "uploads"))
        
        # 确保输出目录存在
        os.makedirs(self.output_dir, exist_ok=True)
        
        # 初始化子系统
        self._init_subsystems()
        
    def _init_subsystems(self):
        """初始化各个子系统"""
        # 导入管理器类
        from .template_manager import TemplateManager
        from .content_generator import ContentGenerator
        from .style_manager import StyleManager
        from .renderer import Renderer
        
        # 实例化子系统
        self.template_manager = TemplateManager()
        self.content_generator = ContentGenerator()
        self.style_manager = StyleManager()
        self.renderer = Renderer(output_dir=self.output_dir)
        
    def create_presentation(self, content_data, template=None, theme=None):
        """
        创建完整演示文稿的主流程
        
        Args:
            content_data: 幻灯片内容数据
            template: 模板名称或路径
            theme: 主题配置
            
        Returns:
            output_path: 生成的PPT文件路径
        """
        try:
            logger.info(f"开始创建演示文稿，模板: {template}")
            
            # 1. 加载或创建模板
            template_data = self.template_manager.get_template(template)
            logger.info(f"模板加载完成: {template}")
            
            # 2. 应用主题样式
            styled_template = self.style_manager.apply_theme(template_data, theme)
            logger.info("主题样式应用完成")
            
            # 3. 内容填充和智能增强
            enhanced_content = self.content_generator.enhance_content(content_data)
            logger.info(f"内容增强完成，共 {len(enhanced_content)} 张幻灯片")
            
            filled_slides = self.content_generator.fill_template(styled_template, enhanced_content)
            logger.info("模板填充完成")
            
            # 4. 渲染最终PPT
            output_path = self.renderer.render(filled_slides)
            logger.info(f"PPT渲染完成，保存至: {output_path}")
            
            return output_path
            
        except Exception as e:
            logger.error(f"创建演示文稿失败: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            raise
    
    def generate_from_topic(self, topic, subject=None, template=None, theme=None):
        """
        从主题直接生成演示文稿
        
        Args:
            topic: 演示文稿主题
            subject: 学科领域
            template: 模板名称或路径
            theme: 主题配置
            
        Returns:
            output_path: 生成的PPT文件路径
        """
        try:
            logger.info(f"从主题生成演示文稿: {topic}, 学科: {subject}")
            
            # 使用AI生成大纲
            from .ai_outline_generator import AIOutlineGenerator
            outline_generator = AIOutlineGenerator()
            slides_data = outline_generator.generate(topic, subject)
            
            # 创建演示文稿
            return self.create_presentation(slides_data, template, theme)
            
        except Exception as e:
            logger.error(f"从主题生成演示文稿失败: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            raise 