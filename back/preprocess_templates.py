#!/usr/bin/env python
"""
模板预处理脚本
在应用启动前预先将所有PPT模板转换为HTML格式
"""

import os
import sys
import logging
import argparse
import glob
import time
from concurrent.futures import ThreadPoolExecutor

# 确保ppt_engine在Python路径中
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(script_dir)

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("template_preprocess.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("template_preprocess")

def preprocess_template(template_path, output_dir):
    """
    预处理单个模板，将PPT转换为HTML
    
    Args:
        template_path: PPT模板文件路径
        output_dir: HTML模板输出目录
        
    Returns:
        是否成功转换
    """
    try:
        # 导入转换器
        from ppt_engine.template_converter import PPTTemplateConverter
        
        # 获取模板名称
        template_name = os.path.splitext(os.path.basename(template_path))[0]
        html_output_dir = os.path.join(output_dir, template_name)
        
        logger.info(f"开始处理模板: {template_name}")
        
        # 检查模板文件是否存在
        if not os.path.exists(template_path):
            logger.error(f"模板文件不存在: {template_path}")
            return False
            
        # 确保输出目录存在
        os.makedirs(output_dir, exist_ok=True)
        
        # 检查是否已经存在转换好的模板
        if os.path.exists(html_output_dir) and os.path.exists(os.path.join(html_output_dir, "template_info.json")):
            # 检查模板修改时间是否比HTML更早
            if os.path.getmtime(template_path) <= os.path.getmtime(os.path.join(html_output_dir, "template_info.json")):
                logger.info(f"模板 {template_name} 已经转换，跳过处理")
                return True
            else:
                logger.info(f"模板文件已更新，重新处理: {template_name}")
        
        # 创建转换器
        converter = PPTTemplateConverter(os.path.dirname(template_path), output_dir)
        
        # 进行转换
        result = converter.convert_to_html_template(template_path, html_output_dir)
        
        if result:
            logger.info(f"模板 {template_name} 转换成功: {html_output_dir}")
            return True
        else:
            logger.error(f"模板 {template_name} 转换失败")
            return False
            
    except Exception as e:
        logger.error(f"处理模板 {template_path} 时出错: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return False

def prepare_default_templates(html_templates_dir):
    """
    准备默认HTML模板
    
    Args:
        html_templates_dir: HTML模板目录
    """
    # 创建默认模板目录
    default_dir = os.path.join(html_templates_dir, "default")
    os.makedirs(default_dir, exist_ok=True)
    
    # 默认模板信息
    template_info = {
        "name": "默认模板",
        "description": "系统默认HTML模板",
        "version": "1.0",
        "author": "系统",
        "slides": [
            {
                "name": "封面",
                "suitable_for": ["cover"],
                "elements": ["title", "subtitle"]
            },
            {
                "name": "内容",
                "suitable_for": ["content", "text"],
                "elements": ["title", "content"]
            },
            {
                "name": "要点",
                "suitable_for": ["bullet", "keypoints"],
                "elements": ["title", "bullet_points"]
            },
            {
                "name": "图片",
                "suitable_for": ["image", "picture"],
                "elements": ["title", "content", "image"]
            },
            {
                "name": "表格",
                "suitable_for": ["table", "data"],
                "elements": ["title", "table"]
            },
            {
                "name": "总结",
                "suitable_for": ["conclusion", "summary"],
                "elements": ["title", "content"]
            }
        ]
    }
    
    # 保存模板信息
    import json
    with open(os.path.join(default_dir, "template_info.json"), 'w', encoding='utf-8') as f:
        json.dump(template_info, f, ensure_ascii=False, indent=2)
    
    # 创建默认HTML模板文件
    templates = {
        "cover.html": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>封面</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Microsoft YaHei', Arial, sans-serif; }
        .slide-container { width: 100vw; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); }
        .title { font-size: 48px; font-weight: bold; color: #333; margin-bottom: 20px; text-align: center; }
        .subtitle { font-size: 24px; color: #666; text-align: center; }
    </style>
</head>
<body>
    <div class="slide-container" data-purpose="cover">
        <h1 class="title">{{ title }}</h1>
        <div class="subtitle">{{ content }}</div>
    </div>
</body>
</html>
        """,
        
        "content.html": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>内容</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Microsoft YaHei', Arial, sans-serif; }
        .slide-container { width: 100vw; height: 100vh; display: flex; flex-direction: column; padding: 40px; box-sizing: border-box; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); }
        .title { font-size: 36px; font-weight: bold; color: #333; margin-bottom: 20px; }
        .content { font-size: 24px; color: #333; line-height: 1.5; }
    </style>
</head>
<body>
    <div class="slide-container" data-purpose="content,text">
        <h1 class="title">{{ title }}</h1>
        <div class="content">{{ content }}</div>
    </div>
</body>
</html>
        """,
        
        "keypoints.html": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>要点</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Microsoft YaHei', Arial, sans-serif; }
        .slide-container { width: 100vw; height: 100vh; display: flex; flex-direction: column; padding: 40px; box-sizing: border-box; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); }
        .title { font-size: 36px; font-weight: bold; color: #333; margin-bottom: 20px; }
        .bullet-points { font-size: 24px; color: #333; }
        .bullet-point { margin-bottom: 15px; position: relative; padding-left: 30px; }
        .bullet-point:before { content: '•'; position: absolute; left: 0; color: #0066cc; }
    </style>
</head>
<body>
    <div class="slide-container" data-purpose="bullet,keypoints">
        <h1 class="title">{{ title }}</h1>
        <div class="bullet-points">
            {% for point in keypoints %}
            <div class="bullet-point">{{ point }}</div>
            {% endfor %}
        </div>
    </div>
</body>
</html>
        """,
        
        "image.html": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>图片</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Microsoft YaHei', Arial, sans-serif; }
        .slide-container { width: 100vw; height: 100vh; display: grid; grid-template-rows: auto 1fr auto; padding: 40px; box-sizing: border-box; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); }
        .title { font-size: 36px; font-weight: bold; color: #333; margin-bottom: 20px; }
        .content { font-size: 20px; color: #333; margin-top: 20px; }
        .image-container { display: flex; justify-content: center; align-items: center; margin: 20px 0; max-height: 60vh; }
        .slide-image { max-width: 100%; max-height: 100%; object-fit: contain; }
    </style>
</head>
<body>
    <div class="slide-container" data-purpose="image,picture">
        <h1 class="title">{{ title }}</h1>
        <div class="image-container">
            <img src="{{ image_url }}" alt="{{ title }}" class="slide-image">
        </div>
        <div class="content">{{ content }}</div>
    </div>
</body>
</html>
        """,
        
        "table.html": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>表格</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Microsoft YaHei', Arial, sans-serif; }
        .slide-container { width: 100vw; height: 100vh; display: flex; flex-direction: column; padding: 40px; box-sizing: border-box; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); }
        .title { font-size: 36px; font-weight: bold; color: #333; margin-bottom: 20px; }
        .table-container { margin: 20px 0; overflow: auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px; text-align: left; border: 1px solid #ddd; }
        th { background-color: #0066cc; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="slide-container" data-purpose="table,data">
        <h1 class="title">{{ title }}</h1>
        <div class="table-container">
            {{ table_html }}
        </div>
    </div>
</body>
</html>
        """,
        
        "conclusion.html": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>总结</title>
    <style>
        body { margin: 0; padding: 0; font-family: 'Microsoft YaHei', Arial, sans-serif; }
        .slide-container { width: 100vw; height: 100vh; display: flex; flex-direction: column; padding: 40px; box-sizing: border-box; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); }
        .title { font-size: 40px; font-weight: bold; color: #333; margin-bottom: 20px; text-align: center; }
        .content { font-size: 28px; color: #333; line-height: 1.5; text-align: center; }
    </style>
</head>
<body>
    <div class="slide-container" data-purpose="conclusion,summary">
        <h1 class="title">{{ title }}</h1>
        <div class="content">{{ content }}</div>
    </div>
</body>
</html>
        """
    }
    
    # 保存模板文件
    for filename, content in templates.items():
        with open(os.path.join(default_dir, filename), 'w', encoding='utf-8') as f:
            f.write(content.strip())
            
    logger.info("默认HTML模板已创建")

def preprocess_all_templates():
    """预处理所有PPT模板，转换为HTML格式"""
    logger.info("开始预处理所有PPT模板...")
    
    # 确定模板目录
    templates_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ppt_templates")
    html_templates_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ppt_engine", "html_templates")
    
    # 确保目录存在
    os.makedirs(templates_dir, exist_ok=True)
    os.makedirs(html_templates_dir, exist_ok=True)
    
    # 获取所有PPTX文件
    pptx_files = glob.glob(os.path.join(templates_dir, "*.pptx"))
    
    if not pptx_files:
        logger.warning("未找到任何PPTX模板文件")
        # 准备默认模板
        prepare_default_templates(html_templates_dir)
        return
        
    logger.info(f"找到 {len(pptx_files)} 个PPTX模板文件")
    
    # 使用线程池并行处理
    successful = 0
    failed = 0
    
    with ThreadPoolExecutor(max_workers=min(4, len(pptx_files))) as executor:
        # 提交所有任务
        future_to_template = {
            executor.submit(preprocess_template, template_path, html_templates_dir): template_path
            for template_path in pptx_files
        }
        
        # 获取结果
        for future in future_to_template:
            template_path = future_to_template[future]
            template_name = os.path.basename(template_path)
            try:
                result = future.result()
                if result:
                    successful += 1
                    logger.info(f"成功处理模板: {template_name}")
                else:
                    failed += 1
                    logger.error(f"处理模板失败: {template_name}")
            except Exception as e:
                failed += 1
                logger.error(f"处理模板 {template_name} 时出错: {str(e)}")
                
    # 准备默认模板
    prepare_default_templates(html_templates_dir)
    
    # 总结
    logger.info(f"模板预处理完成: {successful} 个成功, {failed} 个失败")
    
    # 检查是否至少有一个模板成功处理
    if successful == 0:
        logger.warning("没有成功处理任何模板，将使用默认模板")

if __name__ == "__main__":
    # 配置命令行参数
    parser = argparse.ArgumentParser(description="预处理PPT模板")
    parser.add_argument("-t", "--template", help="单个模板文件路径")
    parser.add_argument("-a", "--all", action="store_true", help="处理所有模板")
    parser.add_argument("-v", "--verbose", action="store_true", help="显示详细日志")
    
    args = parser.parse_args()
    
    # 设置日志级别
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
        
    # 处理模板
    if args.template:
        # 处理单个模板
        template_path = args.template
        output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ppt_engine", "html_templates")
        
        if not os.path.exists(template_path):
            logger.error(f"模板文件不存在: {template_path}")
            sys.exit(1)
            
        logger.info(f"开始处理模板: {template_path}")
        result = preprocess_template(template_path, output_dir)
        
        if result:
            logger.info(f"模板处理成功: {template_path}")
            sys.exit(0)
        else:
            logger.error(f"模板处理失败: {template_path}")
            sys.exit(1)
    elif args.all:
        # 处理所有模板
        preprocess_all_templates()
    else:
        # 默认处理所有模板
        logger.info("未指定参数，将处理所有模板")
        preprocess_all_templates() 