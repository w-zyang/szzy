#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
测试百度API密钥配置
使用方法：python test_baidu_key.py
"""

import os
import sys
import requests
import json
import traceback

# 读取配置文件
def load_config():
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.json')
    if os.path.exists(config_path):
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

# 获取百度API密钥
config = load_config()
BAIDU_API_KEY = config.get('BAIDU_API_KEY', '')
BAIDU_SECRET_KEY = config.get('BAIDU_SECRET_KEY', '')

print(f"使用的百度API密钥: {BAIDU_API_KEY}")
print(f"使用的百度SECRET密钥: {BAIDU_SECRET_KEY}")

# 测试百度API密钥是否有效
def test_baidu_key():
    print("正在测试百度API密钥...")
    
    try:
        # 使用百度智能云API进行简单测试
        url = "https://aip.baidubce.com/oauth/2.0/token"
        params = {
            "grant_type": "client_credentials",
            "client_id": BAIDU_API_KEY,  # API Key
            "client_secret": BAIDU_SECRET_KEY  # Secret Key
        }
        
        print("正在获取访问令牌...")
        print(f"请求参数: {params}")
        
        response = requests.post(url, params=params)
        
        print(f"响应状态码: {response.status_code}")
        print(f"响应内容: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                print("\n✅ API密钥验证成功！")
                print(f"访问令牌: {data['access_token']}")
                print(f"有效期: {data.get('expires_in', '未知')}秒")
                return True
            else:
                print("\n❌ API响应格式不正确，未找到访问令牌")
        else:
            print(f"\n❌ API请求失败，状态码: {response.status_code}")
            
    except Exception as e:
        print(f"\n❌ 测试过程中发生错误: {str(e)}")
        print(traceback.format_exc())
    
    return False

if __name__ == "__main__":
    success = test_baidu_key()
    
    if success:
        print("\n您可以使用以下命令测试语音识别功能:")
        print("python test_speech_recognition.py test.wav")
    else:
        print("\n请检查API密钥是否正确，或者尝试以下操作:")
        print("1. 确认您的百度智能云账户已开通相关服务")
        print("2. 检查API密钥格式是否正确")
        print("3. 查看百度智能云控制台中的API调用配置")
        print("4. 确保网络连接正常") 