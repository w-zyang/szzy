#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
百度API图片搜索功能测试脚本
使用方法：
1. 设置环境变量或在.env文件中配置BAIDU_API_KEY
2. 运行此脚本: python baidu_api_test.py "搜索关键词"
"""

import os
import sys
import requests
import json
import time
import traceback
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

# 获取百度API密钥
BAIDU_API_KEY = os.environ.get('BAIDU_API_KEY', '')
BAIDU_SECRET_KEY = os.environ.get('BAIDU_SECRET_KEY', '')

# 检查密钥是否配置
if not BAIDU_API_KEY:
    print("错误: 未设置百度API密钥")
    print("请设置环境变量BAIDU_API_KEY，或在.env文件中配置")
    print("获取百度API密钥的方法:")
    print("1. 访问百度AI开放平台: https://ai.baidu.com/")
    print("2. 注册/登录账号")
    print("3. 创建应用，获取API Key")
    print("4. 开通图像搜索服务")
    sys.exit(1)

def get_baidu_access_token():
    """获取百度API访问令牌"""
    try:
        # 检查是否是bce-v3格式的密钥
        is_bce_v3 = BAIDU_API_KEY.startswith('bce-v3/')
        
        if is_bce_v3:
            # bce-v3格式的密钥不需要secret_key
            token_url = f"https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id={BAIDU_API_KEY}"
        else:
            # 传统格式的密钥需要secret_key
            if not BAIDU_SECRET_KEY:
                print("错误: 使用传统格式的API密钥时，需要设置BAIDU_SECRET_KEY")
                sys.exit(1)
            token_url = f"https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id={BAIDU_API_KEY}&client_secret={BAIDU_SECRET_KEY}"
        
        print(f"正在获取百度访问令牌，使用的API密钥类型: {'bce-v3' if is_bce_v3 else '传统'}")
        response = requests.get(token_url, timeout=10)
        if response.status_code != 200:
            print(f"百度访问令牌请求失败: {response.status_code}, {response.text}")
            return None
            
        data = response.json()
        access_token = data.get("access_token")
        expires_in = data.get("expires_in", 2592000)  # 默认30天
        
        print(f"成功获取百度API访问令牌，有效期: {expires_in}秒")
        return access_token
    except Exception as e:
        print(f"获取百度访问令牌失败: {str(e)}")
        print(traceback.format_exc())
        return None

def search_baidu_images(query, max_results=5):
    """使用百度图像搜索API搜索图片"""
    access_token = get_baidu_access_token()
    if not access_token:
        return []
        
    try:
        # 百度图像搜索API接口
        url = f"https://aip.baidubce.com/rest/2.0/image-search/v1/search?access_token={access_token}"
        
        params = {
            "keyword": query,
            "rn": max_results,  # 返回数量
            "pn": 0,  # 起始位置
            "baike_num": 0  # 不需要百科信息
        }
        
        # 发送POST请求
        print(f"开始搜索图片: {query}")
        response = requests.post(url, data=params, timeout=10)
        if response.status_code != 200:
            print(f"百度图片搜索请求失败: {response.status_code}, {response.text}")
            return []
            
        data = response.json()
        print(f"API响应: {json.dumps(data, ensure_ascii=False, indent=2)}")
        
        # 从结果中提取图片URL
        urls = []
        for item in data.get("result", []):
            # 优先使用高清图片URL
            image_url = item.get("hq_url") or item.get("url")
            if image_url:
                urls.append(image_url)
        
        print(f"从百度获取了 {len(urls)} 张图片")
        return urls
    except Exception as e:
        print(f"百度图片搜索失败: {str(e)}")
        print(traceback.format_exc())
        return []

def main():
    # 从命令行参数获取搜索关键词
    if len(sys.argv) < 2:
        print("使用方法: python baidu_api_test.py \"搜索关键词\"")
        sys.exit(1)
        
    query = sys.argv[1]
    print(f"使用关键词 '{query}' 搜索图片...")
    
    # 搜索图片
    urls = search_baidu_images(query, max_results=5)
    
    if not urls:
        print("未找到图片")
        return
    
    # 打印结果
    print("\n找到以下图片URL:")
    for i, url in enumerate(urls, 1):
        print(f"{i}. {url}")
    
    print("\n可以通过以下方法在Python中使用这些图片:")
    print("1. 使用PIL库显示图片:")
    print("   from PIL import Image")
    print("   from io import BytesIO")
    print("   import requests")
    print("   response = requests.get(url)")
    print("   img = Image.open(BytesIO(response.content))")
    print("   img.show()")
    print("\n2. 保存图片:")
    print("   with open('image.jpg', 'wb') as f:")
    print("       f.write(response.content)")

if __name__ == "__main__":
    main() 