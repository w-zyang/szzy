#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
测试语音识别服务
使用方法：python test_speech_recognition.py audio_file.wav
"""

import os
import sys
import json
from speech_recognition_service import SpeechRecognitionService

def main():
    # 检查命令行参数
    if len(sys.argv) < 2:
        print("用法: python test_speech_recognition.py <音频文件路径>")
        print("例如: python test_speech_recognition.py test.wav")
        sys.exit(1)
    
    audio_file_path = sys.argv[1]
    
    # 检查文件是否存在
    if not os.path.exists(audio_file_path):
        print(f"错误: 文件不存在: {audio_file_path}")
        sys.exit(1)
    
    # 检查文件类型
    file_extension = os.path.splitext(audio_file_path)[1].lower()
    if file_extension not in ['.wav', '.mp3', '.pcm', '.m4a', '.amr']:
        print(f"警告: 不支持的文件类型: {file_extension}")
        print("支持的文件类型: .wav, .mp3, .pcm, .m4a, .amr")
        print("继续测试，但可能会失败...")
    
    print(f"正在测试语音识别，文件: {audio_file_path}")
    
    # 加载配置
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.json')
    if os.path.exists(config_path):
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        api_key = config.get('BAIDU_API_KEY', '')
        secret_key = config.get('BAIDU_SECRET_KEY', '')
        
        print(f"配置文件中的API密钥: {api_key[:10]}{'*' * 10}")
        print(f"配置文件中的SECRET密钥: {secret_key[:5]}{'*' * 10}" if secret_key else "未配置SECRET密钥")
    else:
        print("警告: 配置文件不存在，将使用默认配置")
    
    # 创建语音识别服务实例
    service = SpeechRecognitionService()
    
    # 获取访问令牌测试
    print("\n正在测试获取百度访问令牌...")
    token = service.get_baidu_access_token()
    if token:
        print(f"✅ 成功获取访问令牌: {token[:10]}{'*' * 10}")
    else:
        print("❌ 获取访问令牌失败")
        print("请确保您已正确配置百度API密钥")
        print("语音识别测试可能会失败")
    
    # 测试语音识别
    print("\n正在进行语音识别...")
    result = service.recognize_speech(audio_file_path)
    
    # 输出结果
    print("\n语音识别结果:")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    
    if result.get('success'):
        print("\n✅ 语音识别成功!")
        print(f"识别的文本: {result.get('text')}")
    else:
        print("\n❌ 语音识别失败")
        print(f"错误信息: {result.get('error')}")
        print("\n请检查以下可能的问题:")
        print("1. 百度API密钥是否正确配置")
        print("2. 音频文件格式和质量")
        print("3. 网络连接是否正常")
        print("4. 百度语音识别服务是否已开通")

if __name__ == "__main__":
    main() 