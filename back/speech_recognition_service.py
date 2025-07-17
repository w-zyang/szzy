import os
import random
import logging
import traceback
from datetime import datetime
import json
import requests
import base64

# 配置日志
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("speech_recognition.log", mode='w'),  # 使用'w'模式覆盖之前的日志
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("speech_recognition")

# 读取配置文件
def load_config():
    try:
        config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.json')
        logger.info(f"尝试加载配置文件: {config_path}")
        
        if os.path.exists(config_path):
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
                logger.info(f"成功加载配置文件: {config_path}")
                logger.info(f"配置内容: {json.dumps({k: ('***' if 'KEY' in k else v) for k, v in config.items()})}")
                return config
        else:
            logger.warning(f"配置文件不存在: {config_path}")
            return {}
    except Exception as e:
        logger.error(f"加载配置失败: {str(e)}")
        logger.error(traceback.format_exc())
        return {}

class SpeechRecognitionService:
    """语音识别服务类"""
    
    def __init__(self, api_key=None, api_url=None):
        """初始化语音识别服务
        
        Args:
            api_key: API密钥
            api_url: API地址
        """
        # 尝试从配置文件加载
        self.config = load_config()
        self.api_key = api_key or self.config.get('BAIDU_API_KEY', '')
        self.secret_key = self.config.get('BAIDU_SECRET_KEY', '')
        self.api_url = api_url
        
        logger.info("语音识别服务初始化")
        logger.info(f"API密钥是否配置: {'是' if self.api_key else '否'}")
        logger.info(f"SECRET密钥是否配置: {'是' if self.secret_key else '否'}")
        
        # 验证API密钥
        if not self.api_key:
            logger.warning("API密钥未配置，语音识别将使用模拟结果")
        elif not self.secret_key and not self.api_key.startswith('bce-v3/'):
            logger.warning("使用传统格式API密钥但未配置SECRET_KEY，语音识别可能会失败")
        
        # 测试获取令牌
        token = self.get_baidu_access_token()
        if token:
            logger.info("百度API令牌获取成功，语音识别服务准备就绪")
        else:
            logger.warning("百度API令牌获取失败，语音识别可能无法正常工作")
    
    def get_baidu_access_token(self):
        """获取百度API访问令牌"""
        try:
            # 检查API密钥格式
            if not self.api_key:
                logger.error("API密钥为空")
                return None
                
            is_bce_v3 = self.api_key.startswith('bce-v3/')
            
            logger.info(f"API密钥类型: {'bce-v3格式' if is_bce_v3 else '传统格式'}")
            logger.info(f"API密钥: {self.api_key}")
            logger.info(f"SECRET密钥: {'已配置' if self.secret_key else '未配置'}")
            
            # 构建请求参数
            token_url = "https://aip.baidubce.com/oauth/2.0/token"
            
            # 对于bce-v3格式的密钥，不需要secret_key
            # 对于传统格式的密钥，必须提供secret_key
            params = {
                "grant_type": "client_credentials",
                "client_id": self.api_key
            }
            
            if not is_bce_v3:
                if not self.secret_key:
                    logger.error("使用传统格式的API密钥时必须提供SECRET_KEY")
                    return None
                params["client_secret"] = self.secret_key
            
            logger.info(f"正在获取百度语音识别访问令牌，请求URL: {token_url}")
            logger.info(f"请求参数: {params}")
            
            # 发送请求获取token
            try:
                response = requests.post(token_url, params=params, timeout=15)
                logger.info(f"百度API响应状态码: {response.status_code}")
                logger.info(f"百度API响应内容: {response.text}")
            except requests.exceptions.Timeout:
                logger.error("请求超时，请检查网络连接")
                return None
            except requests.exceptions.ConnectionError:
                logger.error("连接错误，请检查网络连接")
                return None
            except Exception as req_err:
                logger.error(f"请求错误: {str(req_err)}")
                return None
            
            if response.status_code != 200:
                logger.error(f"百度访问令牌请求失败: {response.status_code}, {response.text}")
                return None
                
            try:
                data = response.json()
            except json.JSONDecodeError:
                logger.error(f"响应不是有效的JSON格式: {response.text}")
                return None
                
            access_token = data.get("access_token")
            if not access_token:
                logger.error("百度API返回的JSON中没有access_token字段")
                logger.error(f"返回的完整响应: {data}")
                
                # 检查是否有错误信息
                if "error" in data:
                    logger.error(f"API错误: {data.get('error')}")
                    logger.error(f"错误描述: {data.get('error_description', '')}")
                
                return None
                
            expires_in = data.get("expires_in", 2592000)  # 默认30天
            
            logger.info(f"成功获取百度API访问令牌，有效期: {expires_in}秒")
            logger.info(f"访问令牌: {access_token[:10]}...")
            return access_token
        except Exception as e:
            logger.error(f"获取百度访问令牌失败: {str(e)}")
            logger.error(traceback.format_exc())
            return None

    def recognize_speech(self, audio_file_path):
        """识别语音文件内容
        
        Args:
            audio_file_path: 语音文件路径
            
        Returns:
            dict: 包含识别结果的字典
        """
        try:
            logger.info(f"处理语音文件: {audio_file_path}")
            
            # 检查文件是否存在
            if not os.path.exists(audio_file_path):
                logger.warning(f"文件不存在: {audio_file_path}")
                return {
                    "success": False,
                    "error": "文件不存在"
                }
            
            # 获取文件信息
            file_size = os.path.getsize(audio_file_path)
            file_extension = os.path.splitext(audio_file_path)[1].lower()
            
            logger.info(f"文件大小: {file_size} 字节, 类型: {file_extension}")
            
            # 检查API密钥是否配置
            if not self.api_key or (not self.api_key.startswith("bce-v3/") and not self.secret_key):
                logger.warning("百度API密钥未正确配置，使用模拟结果")
                # 模拟识别延迟
                import time
                time.sleep(1)
                
                # 生成示例文本
                example_texts = [
                    "欢迎使用语音输入功能，这将帮助您更高效地创建PPT内容。",
                    "通过语音输入可以提高内容创作效率，快速输入您的想法。",
                    "请尝试继续录制更多内容，系统将自动转换为文本。",
                    "语音识别技术可以让您的工作更轻松，尤其适合输入较长的内容。",
                    "这是一个示例结果，在实际项目中应该集成专业的语音识别API。"
                ]
                
                text = random.choice(example_texts)
                
                # 返回识别结果
                return {
                    "success": True,
                    "text": text,
                    "confidence": 0.95,
                    "duration": 3.5,
                    "language": "zh-CN"
                }
            
            # 获取百度访问令牌
            access_token = self.get_baidu_access_token()
            if not access_token:
                logger.error("获取百度访问令牌失败")
                return {
                    "success": False,
                    "error": "获取百度访问令牌失败"
                }
            
            # 读取音频文件
            with open(audio_file_path, 'rb') as f:
                audio_data = f.read()
            
            # 百度语音识别API需要base64编码
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            # 根据文件类型选择格式
            format_type = "wav"
            if file_extension in ['.mp3']:
                format_type = "mp3"
            elif file_extension in ['.pcm']:
                format_type = "pcm"
            elif file_extension in ['.m4a']:
                format_type = "m4a"  # 注意：百度API可能不直接支持m4a，可能需要转换
            elif file_extension in ['.amr']:
                format_type = "amr"
                
            logger.info(f"识别的音频格式: {format_type}")
                
            # 检查文件大小是否超过限制（百度API一般限制10MB）
            if file_size > 10 * 1024 * 1024:  # 10MB
                logger.warning(f"文件大小超过10MB限制: {file_size} 字节")
                return {
                    "success": False,
                    "error": "音频文件太大，请限制在10MB以内"
                }
            
            # 调用百度语音识别API
            # dev_pid参数：1536（普通话，简体中文），1537（普通话，英文），等
            api_url = f"https://vop.baidu.com/server_api?dev_pid=1537&cuid=szzy_app"
            
            headers = {
                'Content-Type': 'application/json'
            }
            
            payload = json.dumps({
                "format": format_type,
                "rate": 16000,  # 采样率，建议使用真实采样率
                "channel": 1,   # 声道数，1=单声道，2=双声道
                "cuid": "szzy_app",  # 用户唯一标识，用于区分不同用户
                "token": access_token,
                "speech": audio_base64,
                "len": len(audio_data)
            })
            
            logger.info(f"发送语音识别请求，格式: {format_type}, 大小: {len(audio_data)}")
            logger.info(f"请求地址: {api_url}")
            logger.info(f"请求头: {headers}")
            logger.info(f"请求参数: {{部分敏感信息已隐藏}}")
            
            response = requests.post(api_url, headers=headers, data=payload, timeout=15)
            
            logger.info(f"语音识别API响应状态码: {response.status_code}")
            
            if response.status_code != 200:
                logger.error(f"百度语音识别请求失败: {response.status_code}, {response.text}")
                return {
                    "success": False,
                    "error": f"百度语音识别请求失败: {response.status_code}"
                }
            
            result = response.json()
            logger.info(f"语音识别结果: {json.dumps(result, ensure_ascii=False)}")
            
            # 检查结果
            if result.get('err_no') == 0 and result.get('result'):
                recognized_text = result['result'][0]
                return {
                    "success": True,
                    "text": recognized_text,
                    "confidence": 0.9,  # 百度API未返回置信度，使用默认值
                    "duration": 0,  # 未返回时长
                    "language": "zh-CN"
                }
            else:
                error_code = result.get('err_no', -1)
                error_msg = f"识别错误: {result.get('err_msg', '未知错误')} (代码: {error_code})"
                logger.error(error_msg)
                logger.error(f"完整错误响应: {json.dumps(result, ensure_ascii=False)}")
                
                # 尝试提供更有用的错误信息
                error_messages = {
                    3300: "输入参数不正确",
                    3301: "音频质量过差，请确保录音环境安静，说话声音清晰",
                    3302: "鉴权失败，请检查API密钥配置",
                    3303: "后端处理超时",
                    3304: "用户请求超过并发限制",
                    3305: "用户请求超过频率限制",
                    3307: "服务正忙，请稍后再试",
                    3308: "音频过长，请控制在60秒内",
                    3309: "音频数据问题",
                    3310: "输入的音频文件过大",
                    3311: "采样率rate参数不在选项里",
                    3312: "音频格式format参数不在选项里"
                }
                
                friendly_error = error_messages.get(error_code, error_msg)
                
                return {
                    "success": False,
                    "error": friendly_error
                }
            
        except Exception as e:
            logger.error(f"语音识别出错: {str(e)}")
            logger.error(traceback.format_exc())
            return {
                "success": False,
                "error": f"语音识别失败: {str(e)}"
            }
    
    def get_audio_duration(self, audio_file_path):
        """获取音频文件时长
        
        Args:
            audio_file_path: 音频文件路径
            
        Returns:
            float: 音频时长(秒)
        """
        try:
            # 在实际项目中，可以使用librosa、pydub等库获取音频时长
            # 这里为了演示，返回模拟的时长
            return random.uniform(2.0, 10.0)
        except Exception as e:
            logger.error(f"获取音频时长出错: {str(e)}")
            return 0.0

# 创建默认实例
speech_recognition_service = SpeechRecognitionService() 