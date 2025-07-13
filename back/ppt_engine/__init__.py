#!/usr/bin/env python
"""
PPT引擎 - 基于HTML中间格式的PPT生成系统
支持多种模板和内容类型的通用PPT生成
"""

__version__ = '1.0.0'

import os
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("ppt_generation.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("ppt_engine")

# 确定基础路径
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_DIR = os.path.join(BASE_DIR, "templates")
HTML_TEMPLATE_DIR = os.path.join(BASE_DIR, "html_templates")

# 创建必要的目录
os.makedirs(TEMPLATE_DIR, exist_ok=True)
os.makedirs(HTML_TEMPLATE_DIR, exist_ok=True)

# 导出模块
from .template_converter import PPTTemplateConverter
from .content_filler import ContentFiller
from .html_to_ppt import HTMLToPPTConverter
from .unified_generator import UnifiedPPTGenerator, generate_ppt_from_outline 