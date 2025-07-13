#!/usr/bin/env python
"""
统一PPT生成器
整合模板转换、内容填充和HTML转PPT功能
"""

import os
import sys
import json
import logging
import argparse
import tempfile
import shutil
import time
from .template_converter import PPTTemplateConverter
from .content_filler import fill_outline_content
from .html_to_ppt import convert_html_to_ppt

# 获取模块日志记录器
logger = logging.getLogger("ppt_engine.unified_generator")

class UnifiedPPTGenerator:
    """统一PPT生成器，整合所有功能"""
    
    def __init__(self, templates_dir=None):
        """
        初始化生成器
        
        Args:
            templates_dir: PPT模板目录
        """
        # 确定模板目录
        if templates_dir is None:
            templates_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ppt_templates")
            
        self.templates_dir = templates_dir
        
        # HTML模板缓存目录
        self.html_templates_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "html_templates")
        
        # 初始化组件
        self.template_converter = PPTTemplateConverter(templates_dir, self.html_templates_dir)
        
        # 创建目录
        os.makedirs(self.templates_dir, exist_ok=True)
        os.makedirs(self.html_templates_dir, exist_ok=True)
    
    def prepare_template(self, template_path):
        """
        准备模板，转换PPT模板为HTML模板
        
        Args:
            template_path: PPT模板文件路径
            
        Returns:
            HTML模板目录路径
        """
        # 检查模板路径
        if not os.path.exists(template_path):
            logger.error(f"模板文件不存在: {template_path}")
            return None
            
        # 获取模板名称
        template_name = os.path.splitext(os.path.basename(template_path))[0]
        
        # 确定HTML模板输出目录
        html_template_dir = os.path.join(self.html_templates_dir, template_name)
        
        # 检查是否已经存在转换好的HTML模板
        if os.path.exists(html_template_dir) and os.path.exists(os.path.join(html_template_dir, "template_info.json")):
            logger.info(f"使用已有的HTML模板: {html_template_dir}")
            return html_template_dir
            
        # 转换模板
        logger.info(f"开始转换PPT模板为HTML模板: {template_path}")
        return self.template_converter.convert_to_html_template(template_path, html_template_dir)
    
    def generate_ppt(self, outline, template_path, output_path):
        """
        生成PPT
        
        Args:
            outline: 大纲数据（字典或列表）
            template_path: PPT模板文件路径
            output_path: 输出的PPT文件路径
            
        Returns:
            生成的PPT文件路径
        """
        start_time = time.time()
        logger.info(f"开始生成PPT，使用模板: {template_path}")
        
        try:
            # 准备HTML模板
            html_template_dir = self.prepare_template(template_path)
            if not html_template_dir:
                logger.error("准备HTML模板失败")
                return None
                
            logger.info(f"HTML模板准备完成: {html_template_dir}")
            
            # 填充内容
            html_slides = fill_outline_content(outline, html_template_dir)
            if not html_slides:
                logger.error("填充内容失败")
                return None
                
            logger.info(f"内容填充完成，生成了 {len(html_slides)} 张幻灯片")
            
            # 保存调试用的HTML文件
            debug_dir = os.path.join(os.path.dirname(output_path), "debug_html")
            os.makedirs(debug_dir, exist_ok=True)
            for i, html in enumerate(html_slides):
                debug_path = os.path.join(debug_dir, f"slide_{i+1}.html")
                with open(debug_path, 'w', encoding='utf-8') as f:
                    f.write(html)
                    
            logger.info(f"HTML文件已保存到: {debug_dir}")
            
            # 转换为PPT
            ppt_path = convert_html_to_ppt(html_slides, output_path)
            
            # 计算耗时
            elapsed_time = time.time() - start_time
            logger.info(f"PPT生成完成: {ppt_path}, 耗时: {elapsed_time:.2f}秒")
            
            return ppt_path
        except Exception as e:
            logger.error(f"生成PPT失败: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return None

def generate_ppt_from_outline(outline, template_path, output_path):
    """
    从大纲生成PPT的便捷函数
    
    Args:
        outline: 大纲数据（字典、列表或JSON字符串）
        template_path: PPT模板文件路径
        output_path: 输出的PPT文件路径
        
    Returns:
        生成的PPT文件路径
    """
    # 处理大纲格式
    if isinstance(outline, str):
        try:
            outline_data = json.loads(outline)
        except:
            logger.error("无效的JSON字符串")
            return None
    else:
        outline_data = outline
        
    # 初始化生成器
    generator = UnifiedPPTGenerator()
    
    # 生成PPT
    return generator.generate_ppt(outline_data, template_path, output_path)

def main():
    """命令行入口"""
    parser = argparse.ArgumentParser(description="基于HTML中间格式的PPT生成工具")
    parser.add_argument("-o", "--outline", required=True, help="大纲JSON文件路径")
    parser.add_argument("-t", "--template", required=True, help="PPT模板文件路径")
    parser.add_argument("-p", "--output", required=True, help="输出PPT文件路径")
    
    args = parser.parse_args()
    
    # 检查文件是否存在
    if not os.path.exists(args.outline):
        logger.error(f"大纲文件不存在: {args.outline}")
        return 1
        
    if not os.path.exists(args.template):
        logger.error(f"模板文件不存在: {args.template}")
        return 1
        
    # 加载大纲
    try:
        with open(args.outline, 'r', encoding='utf-8') as f:
            outline_data = json.load(f)
    except Exception as e:
        logger.error(f"加载大纲失败: {str(e)}")
        return 1
        
    # 生成PPT
    result = generate_ppt_from_outline(outline_data, args.template, args.output)
    
    if result:
        print(f"PPT生成成功: {result}")
        return 0
    else:
        print("PPT生成失败")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 