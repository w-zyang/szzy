#!/usr/bin/env python
"""
批量重新生成所有PPT模板的预览图
"""

import os
import sys
import glob
import logging
from generate_preview import generate_preview

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger("preview_regenerator")

def regenerate_all_previews(template_dir):
    """
    重新生成指定目录中所有PPT模板的预览图
    
    Args:
        template_dir: 模板目录路径
    """
    logger.info(f"开始重新生成所有模板预览图: {template_dir}")
    
    # 确保模板目录存在
    if not os.path.isdir(template_dir):
        logger.error(f"模板目录不存在: {template_dir}")
        return
    
    # 查找所有PPTX文件
    pptx_files = glob.glob(os.path.join(template_dir, "*.pptx"))
    
    if not pptx_files:
        logger.warning(f"未找到PPTX文件: {template_dir}")
        return
    
    logger.info(f"找到{len(pptx_files)}个PPTX文件")
    
    # 创建预览图目录
    preview_dir = os.path.join(template_dir, "previews")
    os.makedirs(preview_dir, exist_ok=True)
    
    # 重新生成每个模板的预览图
    success_count = 0
    for pptx_file in pptx_files:
        try:
            # 跳过临时文件
            if os.path.basename(pptx_file).startswith("~$"):
                continue
                
            logger.info(f"处理模板: {pptx_file}")
            preview_path = generate_preview(pptx_file)
            logger.info(f"生成预览图: {preview_path}")
            success_count += 1
        except Exception as e:
            logger.error(f"处理模板失败: {pptx_file}, 错误: {str(e)}")
    
    logger.info(f"预览图生成完成: 成功 {success_count}/{len(pptx_files)}")

def main():
    """命令行入口"""
    # 默认模板目录
    template_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ppt_templates")
    
    # 如果提供了命令行参数，使用指定的目录
    if len(sys.argv) > 1:
        template_dir = sys.argv[1]
    
    regenerate_all_previews(template_dir)

if __name__ == "__main__":
    main() 