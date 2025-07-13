#!/usr/bin/env python
"""
PPT引擎安装脚本
安装所需的Python库和依赖
"""

import os
import sys
import subprocess
import logging
import argparse

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger("setup_ppt_engine")

def create_directory_structure():
    """创建必要的目录结构"""
    dirs = [
        "ppt_engine",
        "ppt_engine/templates",
        "ppt_engine/html_templates",
    ]
    
    for directory in dirs:
        os.makedirs(directory, exist_ok=True)
        logger.info(f"创建目录: {directory}")

def install_dependencies(upgrade=False):
    """安装所需的Python依赖库"""
    dependencies = [
        "python-pptx",
        "jinja2",
        "beautifulsoup4",
        "markdown",
        "selenium",
        "pillow",
    ]
    
    optional_deps = [
        "webdriver-manager",
    ]
    
    logger.info("开始安装必要依赖...")
    try:
        cmd = [sys.executable, "-m", "pip", "install"]
        if upgrade:
            cmd.append("--upgrade")
        cmd.extend(dependencies)
        
        logger.info(f"运行命令: {' '.join(cmd)}")
        subprocess.check_call(cmd)
        logger.info("必要依赖安装完成")
        
        # 尝试安装可选依赖
        logger.info("开始安装可选依赖...")
        cmd = [sys.executable, "-m", "pip", "install"]
        if upgrade:
            cmd.append("--upgrade")
        cmd.extend(optional_deps)
        
        try:
            subprocess.check_call(cmd)
            logger.info("可选依赖安装完成")
        except subprocess.CalledProcessError:
            logger.warning("安装可选依赖时出现错误，但这不影响基本功能")
    except subprocess.CalledProcessError as e:
        logger.error(f"安装依赖失败: {str(e)}")
        return False
        
    return True

def setup_webdriver():
    """设置WebDriver"""
    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.service import Service
        from webdriver_manager.chrome import ChromeDriverManager
        
        logger.info("正在设置WebDriver...")
        webdriver_path = ChromeDriverManager().install()
        logger.info(f"WebDriver已安装: {webdriver_path}")
        
        return True
    except ImportError:
        logger.warning("未找到selenium或webdriver_manager模块，跳过WebDriver设置")
        return False
    except Exception as e:
        logger.warning(f"设置WebDriver失败: {str(e)}")
        return False

def create_init_files():
    """创建__init__.py文件"""
    init_files = [
        "ppt_engine/__init__.py",
    ]
    
    for init_file in init_files:
        if not os.path.exists(init_file):
            with open(init_file, 'w', encoding='utf-8') as f:
                f.write('"""\nPPT引擎模块\n"""\n\n')
            logger.info(f"创建初始化文件: {init_file}")

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="PPT引擎安装脚本")
    parser.add_argument("--upgrade", action="store_true", help="升级依赖库")
    
    args = parser.parse_args()
    
    try:
        logger.info("开始设置PPT引擎...")
        
        # 创建目录结构
        create_directory_structure()
        
        # 创建初始化文件
        create_init_files()
        
        # 安装依赖
        if install_dependencies(args.upgrade):
            logger.info("依赖安装成功")
        else:
            logger.error("依赖安装失败")
            return 1
            
        # 设置WebDriver
        setup_webdriver()
        
        logger.info("PPT引擎设置完成")
        return 0
    except Exception as e:
        logger.error(f"设置PPT引擎时出错: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        return 1

if __name__ == "__main__":
    sys.exit(main()) 