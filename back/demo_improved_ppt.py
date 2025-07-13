#!/usr/bin/env python
"""
改进版PPT生成器演示脚本
展示如何使用改进的PPT生成器
"""

import os
import sys
import json
import logging
import argparse
from pptx.dml.color import RGBColor
from improved_ppt_generator import generate_ppt, PPTGenerator
from image_service import ImageService
from ppt_plugins.theme_styles import get_available_themes, apply_theme_to_slide_data

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("demo_improved_ppt")

def generate_demo_slides():
    """生成演示用的幻灯片数据"""
    # 创建示例幻灯片数据
    slides_data = [
        {
            "type": "cover",
            "title": "改进版PPT生成器演示",
            "content": "基于组件化架构的PPT生成系统",
            "image": os.path.join("default_images", "cover.jpg")
        },
        {
            "type": "content",
            "title": "项目介绍",
            "content": "本项目是一个基于Python的PPT生成系统，使用组件化架构，具有以下特点：\n\n" +
                      "1. 灵活的组件化架构\n" +
                      "2. 丰富的主题和风格\n" +
                      "3. 强大的图表和图像处理能力\n" +
                      "4. 可通过插件扩展功能"
        },
        {
            "type": "bullet",
            "title": "主要功能",
            "bullet_points": [
                "自动生成精美PPT",
                "支持多种主题和风格",
                "智能图文排版",
                "丰富的图表类型",
                "自动获取相关图片"
            ]
        },
        {
            "type": "image",
            "title": "图片演示",
            "content": "系统可以根据内容自动获取相关图片，并进行优化处理",
            "image": os.path.join("default_images", "default.jpg")
        },
        {
            "type": "chart",
            "title": "图表演示",
            "content": "支持多种类型的图表",
            "chart": {
                "type": "bar",
                "title": "功能满意度评分",
                "labels": ["UI界面", "生成速度", "图片质量", "内容准确性", "总体体验"],
                "values": [4.5, 4.2, 4.7, 4.3, 4.6]
            }
        },
        {
            "type": "table",
            "title": "表格演示",
            "content": "系统可以生成格式化的表格",
            "table": [
                ["功能", "满意度", "使用频率"],
                ["UI界面", "高", "很高"],
                ["生成速度", "中", "高"],
                ["图片质量", "高", "中"],
                ["内容准确性", "高", "高"]
            ]
        },
        {
            "type": "advanced_chart",
            "title": "高级图表演示",
            "content": "通过插件提供更丰富的图表类型",
            "advanced_chart": {
                "type": "radar",
                "title": "产品特性评分",
                "categories": ["易用性", "性能", "可靠性", "功能丰富度", "美观度"],
                "values": [90, 75, 85, 95, 80]
            }
        },
        {
            "type": "content",
            "title": "自定义主题",
            "content": "系统提供多种预定义主题，也可以创建自定义主题",
            "background_style": {
                "type": "gradient",
                "direction": "horizontal",
                "start_color": "#E0F0FF",
                "end_color": "#FFFFFF"
            }
        },
        {
            "type": "content",
            "title": "总结",
            "content": "改进版PPT生成器提供了更灵活、更强大的功能，可以生成更精美的演示文稿",
            "footer": {
                "text": "演示文稿",
                "show_slide_number": True,
                "show_date": True
            },
            "watermark": {
                "text": "演示版本",
                "color": "#DDDDDD",
                "size": 48
            }
        }
    ]
    
    return slides_data

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='改进版PPT生成器演示')
    parser.add_argument('-t', '--theme', default='classic_blue',
                        help='PPT主题 (默认: classic_blue)')
    parser.add_argument('-o', '--output', default='demo_improved.pptx',
                        help='输出文件路径 (默认: demo_improved.pptx)')
    parser.add_argument('-l', '--list-themes', action='store_true',
                        help='列出所有可用的主题')
    
    args = parser.parse_args()
    
    # 如果只是列出主题
    if args.list_themes:
        themes = get_available_themes()
        print("可用主题列表:")
        for theme in themes:
            print(f"  - {theme}")
        return
    
    # 生成演示幻灯片数据
    slides_data = generate_demo_slides()
    
    # 应用主题
    slides_data, theme_config = apply_theme_to_slide_data(slides_data, args.theme)
    
    # 初始化图片服务
    image_service = ImageService()
    
    # 生成PPT
    print(f"正在使用主题 '{args.theme}' 生成PPT...")
    success = generate_ppt(
        slides_data=slides_data,
        output_path=args.output,
        theme=theme_config,
        image_service=image_service
    )
    
    if success:
        print(f"PPT已成功生成: {os.path.abspath(args.output)}")
    else:
        print("PPT生成失败")
        sys.exit(1)

if __name__ == "__main__":
    main() 