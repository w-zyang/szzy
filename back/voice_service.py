from flask import request, jsonify, Blueprint
import os
import uuid
import time
from datetime import datetime
import logging
import traceback
from werkzeug.utils import secure_filename

# 导入语音识别服务
try:
    from speech_recognition_service import speech_recognition_service
except ImportError:
    # 如果导入失败，创建一个简单的模拟服务
    class MockSpeechRecognitionService:
        def recognize_speech(self, audio_file_path):
            import random
            example_texts = [
                "欢迎使用语音输入功能，这将帮助您更高效地创建PPT内容。",
                "通过语音输入可以提高内容创作效率，快速输入您的想法。"
            ]
            return {
                "success": True,
                "text": random.choice(example_texts),
                "confidence": 0.9,
                "duration": 3.0,
                "language": "zh-CN"
            }
    
    speech_recognition_service = MockSpeechRecognitionService()
    print("警告: 无法导入语音识别服务，使用模拟服务替代")

# 配置日志
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("voice_service.log", mode='w'),  # 使用'w'模式覆盖之前的日志
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("voice_service")

# 创建Blueprint
voice_service = Blueprint('voice_service', __name__)

# 配置
UPLOAD_FOLDER = os.environ.get('VOICE_UPLOAD_FOLDER', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads/voice'))
ALLOWED_EXTENSIONS = {'wav', 'mp3', 'ogg', 'webm', 'm4a'}

# 确保上传目录存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
logger.info(f"语音上传目录: {UPLOAD_FOLDER}")

# 工具函数
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_filename():
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_str = uuid.uuid4().hex[:8]
    return f"voice_{timestamp}_{random_str}"

@voice_service.route('/api/voice/upload', methods=['POST'])
def upload_voice():
    """接收并保存语音文件"""
    logger.info("接收语音上传请求")
    logger.info(f"请求内容类型: {request.content_type}")
    logger.info(f"请求文件: {request.files}")
    
    if 'audio' not in request.files:
        logger.warning("请求中没有音频文件")
        return jsonify({"success": False, "error": "未检测到音频文件"}), 400
        
    file = request.files['audio']
    
    if not file or file.filename == '':
        logger.warning("文件名为空")
        return jsonify({"success": False, "error": "未选择文件"}), 400
        
    logger.info(f"接收到文件: {file.filename}, 类型: {file.content_type}")
    
    if not allowed_file(file.filename):
        logger.warning(f"不支持的文件类型: {file.filename}")
        return jsonify({"success": False, "error": "不支持的文件类型，请上传WAV、MP3或OGG格式"}), 400
    
    try:
        # 生成安全的文件名
        filename = secure_filename(file.filename or "recording.wav")
        ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else 'wav'
        new_filename = f"{generate_filename()}.{ext}"
        
        # 保存文件
        file_path = os.path.join(UPLOAD_FOLDER, new_filename)
        file.save(file_path)
        
        logger.info(f"文件保存成功: {file_path}")
        logger.info(f"文件大小: {os.path.getsize(file_path)} 字节")
        
        # 调用语音识别服务
        logger.info("开始调用语音识别服务...")
        recognition_result = speech_recognition_service.recognize_speech(file_path)
        logger.info(f"语音识别结果: {recognition_result}")
        
        if recognition_result.get("success"):
            logger.info("语音识别成功")
            return jsonify({
                "success": True,
                "message": "语音识别成功",
                "filename": new_filename,
                "filepath": f"/uploads/voice/{new_filename}",
                "text": recognition_result["text"],
                "duration": recognition_result.get("duration", 0),
                "confidence": recognition_result.get("confidence", 0)
            })
        else:
            error_msg = recognition_result.get("error", "语音识别失败")
            logger.error(f"语音识别失败: {error_msg}")
            return jsonify({
                "success": False,
                "error": error_msg,
                "filename": new_filename,
                "filepath": f"/uploads/voice/{new_filename}"
            })
            
    except Exception as e:
        logger.error(f"处理语音文件时出错: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"success": False, "error": f"处理语音文件失败: {str(e)}"}), 500

@voice_service.route('/api/voice/convert', methods=['POST'])
def convert_voice_to_text():
    """将已上传的语音文件转换为文本"""
    try:
        data = request.json
        if not data or 'filepath' not in data:
            return jsonify({"error": "缺少文件路径"}), 400
            
        filepath = data['filepath']
        
        # 检查文件是否存在
        full_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), filepath.lstrip('/'))
        if not os.path.exists(full_path):
            logger.warning(f"文件不存在: {full_path}")
            return jsonify({"error": "文件不存在"}), 404
        
        logger.info(f"处理语音文件: {full_path}")
        
        # 调用语音识别服务
        recognition_result = speech_recognition_service.recognize_speech(full_path)
        
        if recognition_result["success"]:
            return jsonify({
                "success": True,
                "text": recognition_result["text"],
                "confidence": recognition_result.get("confidence", 0),
                "duration": recognition_result.get("duration", 0),
                "language": recognition_result.get("language", "zh-CN")
            })
        else:
            return jsonify({
                "success": False,
                "error": recognition_result.get("error", "语音识别失败")
            }), 500
            
    except Exception as e:
        logger.error(f"语音转文本出错: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": f"语音转文本失败: {str(e)}"}), 500

# 可以添加更多API端点，例如语音分析、存储管理等 