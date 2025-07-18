from flask import Flask, request, jsonify, send_from_directory, render_template
import os
import json
import uuid
import time
import requests
import subprocess
import re
import logging
import traceback
from werkzeug.utils import secure_filename
from flask_cors import CORS
from datetime import datetime
from dotenv import load_dotenv
from knowledge_retrieval import get_retriever  # 导入知识库检索模块
from image_service import get_image_for_slide, ImageService  # 导入图片服务模块
from io import BytesIO
from PIL import Image
import tempfile
import shutil # Added for fallback generation
from pptx.dml.color import RGBColor # 修正导入路径
from flask import url_for # Added for improved_ppt_generator
import sys

# 导入语音服务蓝图，如果导入失败则创建一个模拟的蓝图
try:
    from voice_service import voice_service
except ImportError:
    from flask import Blueprint
    
    # 创建一个模拟的语音服务蓝图
    voice_service = Blueprint('voice_service', __name__)
    
    @voice_service.route('/api/voice/upload', methods=['POST'])
    def upload_voice():
        """接收并保存语音文件"""
        if 'audio' not in request.files:
            return jsonify({"error": "未检测到音频文件"}), 400
            
        file = request.files['audio']
        
        if not file or file.filename == '':
            return jsonify({"error": "未选择文件"}), 400
            
        # 返回模拟的语音识别结果
        example_texts = [
            "欢迎使用语音输入功能，这将帮助您更高效地创建PPT内容。",
            "通过语音输入可以提高内容创作效率，快速输入您的想法。",
            "请尝试继续录制更多内容，系统将自动转换为文本。",
            "语音识别技术可以让您的工作更轻松，尤其适合输入较长的内容。",
            "这是一个示例结果，在实际项目中应该集成专业的语音识别API。"
        ]
        import random
        
        return jsonify({
            "success": True,
            "message": "语音上传成功",
            "filename": "recording.wav",
            "filepath": "/uploads/voice/recording.wav",
            "text": random.choice(example_texts),
            "duration": 3.5
        })

    @voice_service.route('/api/voice/convert', methods=['POST'])
    def convert_voice_to_text():
        """将已上传的语音文件转换为文本"""
        example_texts = [
            "这是通过语音转文字API识别的内容示例。",
            "您可以使用语音输入来更快地创建PPT大纲和内容。",
            "语音识别可以提高教学资源创建的效率。",
            "通过语音输入可以帮助教师更快地完成课件制作。"
        ]
        import random
        
        return jsonify({
            "success": True,
            "text": random.choice(example_texts),
            "confidence": 0.95,
            "duration": 4.2,
            "language": "zh-CN"
        })

# 配置日志
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("ppt_generation.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("ppt_generation")

# 加载环境变量
load_dotenv()

# 配置文件路径
CONFIG_FILE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")

# 如果配置文件不存在，创建默认配置
if not os.path.exists(CONFIG_FILE_PATH):
    default_config = {
        "AI_IMAGE_API_KEY": "",  # 这里填入您的API密钥
        "AI_IMAGE_API_URL": "",  # 这里填入API URL
        "USE_AI_IMAGES": True,
        "TEMPLATE_DIR": os.path.join(os.path.dirname(os.path.abspath(__file__)), "ppt_templates")
    }
    
    try:
        with open(CONFIG_FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(default_config, f, indent=4, ensure_ascii=False)
        logger.info(f"创建了默认配置文件: {CONFIG_FILE_PATH}")
    except Exception as e:
        logger.error(f"创建配置文件失败: {str(e)}")

# 初始化应用
app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app, resources={
    r"/api/*": {"origins": "*"},
    r"/uploads/*": {"origins": "*"},
    r"/ppt_templates/*": {"origins": "*"}
})  # 启用跨域支持，特别是对uploads目录

# 注册语音服务蓝图
app.register_blueprint(voice_service)

# 配置
UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads'))
TEMPLATE_FOLDER = os.environ.get('TEMPLATE_FOLDER', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ppt_templates'))
TEMPLATE_PREVIEWS_FOLDER = os.path.join(TEMPLATE_FOLDER, 'previews')
IMAGE_CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'image_cache')
ALLOWED_EXTENSIONS = {'pptx', 'pdf', 'png', 'jpg', 'jpeg', 'gif'}

# 确保目录存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(TEMPLATE_FOLDER, exist_ok=True)
os.makedirs(TEMPLATE_PREVIEWS_FOLDER, exist_ok=True)
os.makedirs(IMAGE_CACHE_DIR, exist_ok=True)

# 创建README文件（如果不存在）
readme_path = os.path.join(TEMPLATE_FOLDER, 'README.md')
if not os.path.exists(readme_path):
    try:
        with open(readme_path, 'w', encoding='utf-8') as f:
            f.write("# PPT模板目录\n\n")
            f.write("本目录存放PPT模板文件和相关配置。\n\n")
            f.write("- *.pptx - PPT模板文件\n")
            f.write("- *.json - 模板配置文件（自动生成）\n")
            f.write("- previews/ - 模板预览图片目录\n\n")
            f.write("参考README.md文件了解如何添加和管理模板。\n")
        logger.info(f"创建了模板目录README文件: {readme_path}")
    except Exception as e:
        logger.warning(f"无法创建README文件: {str(e)}")

# 阿里云百炼API配置
API_KEY = os.environ.get('ALIYUN_API_KEY', 'sk-676f45b6cbd54100ae82656f9ac596d3')
API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'

# 工具函数
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_ppt_filename():
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    random_str = uuid.uuid4().hex[:8]
    return f"ppt_{timestamp}_{random_str}.pptx"

def filter_irrelevant(text):
    """过滤无关语句和无关内容"""
    patterns = [
        r"^根据.*?信息.*?[，,。]",
        r"^假设.*?[，,。]",
        r"^以下是.*?[，,。]",
        r"^---+$",
        r"^#+\s*",
        r"^\s*PPT大纲[:：]?",
        r"^\s*PPT标题[:：]?",
        r"^\s*扩写[:：]?",
        r"^\s*扩写完成[:：]?",
        r"^\s*AI生成进度[:：]?",
        r"^\s*图片检索失败",
        r"^\s*AI图片生成失败",
        r"^\s*图片获取失败",
        r"^\s*WebSocket.*?失败",
        r"^\s*未生成PPT",
        r"^\s*PPT生成完成",
        r"^\s*发送给PPT生成的outline",
        r"^\s*\d+\s*[:：]"
    ]
    lines = text.split('\n')
    filtered_lines = []
    for line in lines:
        skip = False
        for pattern in patterns:
            if re.match(pattern, line.strip()):
                skip = True
                break
        if not skip and line.strip():
            filtered_lines.append(line)
    return '\n'.join(filtered_lines)

def parse_outline(text):
    """解析大纲文本为分层结构"""
    if not text:
        return []
    
    lines = text.split('\n')
    lines = [l.strip() for l in lines if l.strip()]
    result = []
    current_chapter = None
    
    # 增强的文本解析，尝试识别更多结构
    for line in lines:
        # 检查是否是标题行
        if re.match(r"^(第[一二三四五六七八九十]+[章节]|章节[\d]+|[\d]+[\.、]|#{1,6}\s)", line):
            # 新章节
            current_chapter = { 
                "type": "keypoints",
                "title": re.sub(r"^#{1,6}\s", "", re.sub(r"^[\d]+[\.、]\s*", "", line)),
                "content": "",
                "keypoints": [],
                "difficulties": [],
                "objective": "掌握相关概念和应用",
                "layout": "keypoints",
                "color": "蓝色科技风"
            }
            result.append(current_chapter)
        elif re.match(r"^[\d]+[\.、]", line) or line.startswith('-') or line.startswith('•') or line.startswith('*'):
            # 要点
            clean_line = re.sub(r"^[\d]+[\.、]\s*", "", re.sub(r"^[-•*]\s*", "", line))
            if current_chapter:
                current_chapter["keypoints"].append(clean_line)
            else:
                # 如果没有当前章节，创建一个新的
                new_chapter = {
                    "type": "keypoints",
                    "title": f"要点 {len(result) + 1}",
                    "content": clean_line,
                    "keypoints": [clean_line],
                    "difficulties": [],
                    "objective": "理解要点内容",
                    "layout": "keypoints",
                    "color": "蓝色科技风"
                }
                result.append(new_chapter)
        elif len(line) > 10:
            # 较长的文本，可能是内容描述
            if current_chapter and not current_chapter["content"]:
                current_chapter["content"] = line
            else:
                # 创建新的内容页
                result.append({
                    "type": "keypoints",
                    "title": line[:20] + ("..." if len(line) > 20 else ""),
                    "content": line,
                    "keypoints": [line],
                    "difficulties": [],
                    "objective": "理解相关内容",
                    "layout": "keypoints",
                    "color": "蓝色科技风"
                })
    
    # 如果解析结果为空，创建一个默认结构
    if not result:
        result.append({
            "type": "cover",
            "title": "课件标题",
            "content": "课件内容描述",
            "keypoints": ["要点1", "要点2", "要点3"],
            "difficulties": ["重难点1"],
            "objective": "学习目标",
            "layout": "cover",
            "color": "蓝色科技风"
        })
    
    return result

# 添加RAG相关API端点

@app.route('/api/aiPpt/enhance-with-rag', methods=['POST'])
def enhance_with_rag():
    """使用知识库增强PPT生成"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "缺少请求数据"}), 400
            
        topic = data.get('topic', '')
        subject = data.get('subject', '')
        keywords = data.get('keywords', [])
        
        if not topic:
            return jsonify({"error": "缺少主题"}), 400
        
        # 将学科名称转换为对应的知识库目录名
        subject_mapping = {
            '生物': 'biology',
            '数学': 'math',
            '物理': 'physics',
            '化学': 'chemistry'
        }
        
        mapped_subject = subject_mapping.get(subject)
        
        # 获取知识库检索器
        retriever = get_retriever()
        
        # 构造搜索查询
        search_query = f"{topic} {' '.join(keywords)}"
        logger.info(f"RAG搜索查询: {search_query}, 学科: {mapped_subject}")
        
        # 获取相关知识
        relevant_content = retriever.get_relevant_content(
            search_query, 
            subject=mapped_subject,
            max_tokens=3000
        )
        
        # 记录检索结果
        content_preview = relevant_content[:200] + "..." if len(relevant_content) > 200 else relevant_content
        logger.info(f"知识库检索结果: {content_preview}")
        
        # 返回检索到的相关内容
        return jsonify({
            "success": True,
            "topic": topic,
            "subject": subject,
            "relevantContent": relevant_content,
            "hasContent": len(relevant_content) > 0
        })
        
    except Exception as e:
        logger.error(f"RAG增强过程中出错: {str(e)}\n{traceback.format_exc()}")
        return jsonify({"error": "处理请求时出错", "detail": str(e)}), 500

@app.route('/api/knowledge/search', methods=['POST'])
def search_knowledge():
    """搜索知识库"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "缺少请求数据"}), 400
            
        query = data.get('query', '')
        subject = data.get('subject', None)
        top_k = data.get('top_k', 3)
        
        if not query:
            return jsonify({"error": "缺少搜索关键词"}), 400
            
        # 获取知识库检索器
        retriever = get_retriever()
        
        # 进行检索
        results = retriever.search(query, subject=subject, top_k=top_k)
        
        # 返回检索结果
        return jsonify({
            "success": True,
            "query": query,
            "results": results
        })
        
    except Exception as e:
        logger.error(f"知识库搜索出错: {str(e)}\n{traceback.format_exc()}")
        return jsonify({"error": "处理搜索请求时出错", "detail": str(e)}), 500

@app.route('/api/knowledge/topic/<topic_id>', methods=['GET'])
def get_knowledge_topic(topic_id):
    """获取指定主题的详细内容"""
    try:
        # 获取知识库检索器
        retriever = get_retriever()
        
        # 获取主题详情
        topic_details = retriever.retrieve_by_id(topic_id)
        
        if "error" in topic_details:
            return jsonify({"error": topic_details["error"]}), 404
            
        return jsonify({
            "success": True,
            "topic": topic_details
        })
        
    except Exception as e:
        logger.error(f"获取知识主题出错: {str(e)}\n{traceback.format_exc()}")
        return jsonify({"error": "获取主题内容时出错", "detail": str(e)}), 500

# 路由
@app.route('/')
def index():
    """主页，提供API测试界面"""
    return render_template('index.html')

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

# PPT模板相关API
@app.route('/api/aiPpt/ppt/templates', methods=['GET'])
def get_templates():
    """获取所有PPT模板"""
    try:
        templates = [f for f in os.listdir(TEMPLATE_FOLDER) 
                    if f.endswith('.pptx') or f.endswith('.json') or f.endswith('.yaml')]
        
        # 筛选出实际的PPT模板文件
        pptx_templates = [t for t in templates if t.endswith('.pptx')]
        
        # 获取模板详细信息
        template_info = []
        for template in pptx_templates:
            template_name = os.path.splitext(template)[0]
            json_file = os.path.join(TEMPLATE_FOLDER, f"{template_name}.json")
            
            info = {
                'name': template,
                'description': '',
                'previewUrl': f"/api/aiPpt/ppt/template-preview/{template}"
            }
            
            # 尝试读取模板描述信息
            if os.path.exists(json_file):
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        json_data = json.load(f)
                        info['description'] = json_data.get('desc', '')
                except:
                    pass
                    
            template_info.append(info)
            
        return jsonify({
            "templates": pptx_templates,
            "templateInfo": template_info
        })
    except Exception as e:
        logger.error(f"获取模板列表失败: {str(e)}")
        return jsonify({"error": "无法读取模板目录", "detail": str(e)}), 500

@app.route('/api/aiPpt/ppt/template-preview/<path:template_name>', methods=['GET'])
def get_template_preview(template_name):
    """获取模板预览图（第一页幻灯片）"""
    logger.info(f"请求模板预览: {template_name}")
    
    try:
        template_path = os.path.join(TEMPLATE_FOLDER, template_name)
        if not os.path.exists(template_path):
            return jsonify({"error": "模板文件不存在"}), 404
        
        # 创建缓存目录
        preview_cache_dir = os.path.join(TEMPLATE_FOLDER, 'previews')
        os.makedirs(preview_cache_dir, exist_ok=True)
        
        # 检查缓存
        preview_filename = f"{os.path.splitext(template_name)[0]}_preview.png"
        preview_path = os.path.join(preview_cache_dir, preview_filename)
        
        # 如果预览图已存在且比模板文件新，则直接使用
        if os.path.exists(preview_path) and os.path.getmtime(preview_path) > os.path.getmtime(template_path):
            logger.info(f"使用缓存预览图: {preview_path}")
            return send_from_directory(preview_cache_dir, preview_filename)
        
        # 需要生成预览图
        logger.info("生成模板预览图")
        try:
            # 使用改进的预览生成器
            from generate_preview import generate_preview
            preview_path = generate_preview(template_path)
            
            if os.path.exists(preview_path):
                logger.info(f"预览图生成成功: {preview_path}")
                return send_from_directory(preview_cache_dir, preview_filename)
            else:
                logger.error("预览图生成失败")
                return jsonify({"error": "预览图生成失败"}), 500
                
        except Exception as e:
            logger.error(f"生成预览图失败: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({"error": f"生成预览图失败: {str(e)}"}), 500
            
    except Exception as e:
        logger.error(f"处理模板预览请求失败: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": f"处理请求失败: {str(e)}"}), 500

@app.route('/api/aiPpt/ppt/upload-template', methods=['POST'])
def upload_template():
    """上传PPT模板"""
    logger.info("=== 开始处理模板上传请求 ===")
    if 'file' not in request.files:
        return jsonify({"error": "未上传文件"}), 400
    
    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({"error": "未选择文件"}), 400
    
    # 检查文件类型
    if file and file.filename and file.filename.lower().endswith('.pptx'):
        # 保证文件名唯一性
        filename = secure_filename(file.filename) if file.filename else f"template_{int(time.time())}.pptx"
        base, ext = os.path.splitext(filename)
        unique_filename = f"{base}_{int(time.time())}{ext}"
        file_path = os.path.join(TEMPLATE_FOLDER, unique_filename)
        
        logger.info(f"准备保存模板文件: {unique_filename}")
        file.save(file_path)
        logger.info(f"模板已保存到: {file_path}")
        
        # 自动分析模板
        try:
            logger.info("自动分析上传的模板")
            # 导入模板分析器
            import sys
            sys.path.append(os.path.dirname(os.path.abspath(__file__)))
            from ppt_template_analyzer import analyze_template as analyze_ppt_template
            
            # 生成JSON文件路径
            json_path = os.path.join(TEMPLATE_FOLDER, f"{base}.json")
            
            # 分析模板
            template_info = analyze_ppt_template(file_path, json_path)
            logger.info(f"模板分析完成，信息已保存到: {json_path}")
            
            # 自动生成预览图
            logger.info("生成模板预览图")
            preview_url = f"/api/aiPpt/ppt/template-preview/{unique_filename}"
            
            # 触发预览生成（通过发送请求到预览API）
            try:
                preview_request_url = f"http://localhost:{request.environ.get('SERVER_PORT', 5000)}{preview_url}"
                requests.get(preview_request_url, timeout=2)
                logger.info("已触发模板预览生成")
            except:
                logger.warning("无法通过API触发预览生成，将在首次访问时生成")
            
            return jsonify({
                "success": True, 
                "template": unique_filename,
                "previewUrl": preview_url,
                "description": template_info.get("desc", f"{base}模板")
            })
        except Exception as e:
            logger.error(f"模板处理失败: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({"error": f"模板处理失败: {str(e)}"}), 500
    else:
        return jsonify({"error": "只支持PPTX文件上传"}), 400

@app.route('/api/aiPpt/ppt/analyze-template', methods=['POST'])
def analyze_template():
    """分析PPT模板结构"""
    logger.info("=== 开始分析PPT模板 ===")
    try:
        if 'file' in request.files:
            # 上传新模板并分析
            file = request.files['file']
            if not file or file.filename == '':
                return jsonify({"error": "未选择文件"}), 400
            
            if file and file.filename and file.filename.lower().endswith('.pptx'):
                # 保证文件名唯一性
                filename = secure_filename(file.filename) if file.filename else f"template_{int(time.time())}.pptx"
                base, ext = os.path.splitext(filename)
                unique_filename = f"{base}_{int(time.time())}{ext}"
                file_path = os.path.join(TEMPLATE_FOLDER, unique_filename)
                file.save(file_path)
                logger.info(f"模板已保存到: {file_path}")
            else:
                return jsonify({"error": "只支持PPTX文件上传"}), 400
        else:
            # 分析已有模板
            data = request.json
            if not data or not data.get('template'):
                return jsonify({"error": "缺少模板名称"}), 400
                
            template_name = data.get('template')
            file_path = os.path.join(TEMPLATE_FOLDER, template_name)
            
            if not os.path.exists(file_path):
                return jsonify({"error": f"模板文件不存在: {template_name}"}), 404
                
            logger.info(f"分析现有模板: {file_path}")
        
        # 分析模板
        try:
            # 导入模板分析器
            import sys
            sys.path.append(os.path.dirname(os.path.abspath(__file__)))
            from ppt_template_analyzer import analyze_template as analyze_ppt_template
            
            # 生成JSON文件路径
            base_name, _ = os.path.splitext(os.path.basename(file_path))
            json_path = os.path.join(TEMPLATE_FOLDER, f"{base_name}.json")
            
            # 分析模板
            template_info = analyze_ppt_template(file_path, json_path)
            logger.info(f"模板分析完成，信息已保存到: {json_path}")
            
            # 返回分析结果
            return jsonify({
                "success": True,
                "template": os.path.basename(file_path),
                "templateInfo": template_info,
                "jsonPath": f"/ppt_templates/{os.path.basename(json_path)}"
            })
        except Exception as e:
            logger.error(f"模板分析失败: {str(e)}")
            logger.error(f"异常详情: {traceback.format_exc()}")
            return jsonify({"error": f"模板分析失败: {str(e)}"}), 500
    except Exception as e:
        logger.error(f"处理请求时出错: {str(e)}")
        logger.error(f"异常详情: {traceback.format_exc()}")
        return jsonify({"error": f"处理请求时出错: {str(e)}"}), 500

# 修改generate_outline函数，支持知识增强
@app.route('/api/aiPpt/generate-outline', methods=['POST'])
def generate_outline():
    """生成PPT大纲，支持RAG增强"""
    logger.info("=== 开始生成大纲 ===")
    
    try:
        # 初始化data变量，避免未定义错误
        data = {}
        
        # 支持FormData和JSON两种格式
        if request.content_type and 'multipart/form-data' in request.content_type:
            # FormData格式
            logger.info("接收到FormData格式请求")
            topic = request.form.get('topic', '')
            background = request.form.get('background', '')
            pages = request.form.get('pages', '8')
            role = request.form.get('role', '')
            scene = request.form.get('scene', '')
            deep_think = request.form.get('deepThink') == 'true'
            web_search = request.form.get('webSearch') == 'true'
            template = request.form.get('template', '')
            subject = request.form.get('subject', '') # 新增学科参数
        else:
            # JSON格式
            logger.info("接收到JSON格式请求")
            data = request.json or {}
            topic = data.get('topic', '')
            background = data.get('background', '')
            pages = data.get('pages', 8)
            role = data.get('role', '')
            scene = data.get('scene', '')
            deep_think = data.get('deepThink', False)
            web_search = data.get('webSearch', False)
            template = data.get('template', '')
            subject = data.get('subject', '') # 新增学科参数
        
        logger.info(f"主题: {topic}")
        logger.info(f"背景: {background}")
        logger.info(f"页数: {pages}")
        logger.info(f"角色: {role}")
        logger.info(f"场景: {scene}")
        logger.info(f"深度思考: {deep_think}")
        logger.info(f"网络搜索: {web_search}")
        logger.info(f"模板: {template}")
        logger.info(f"学科: {subject}") # 新增学科信息
        
        # 解析页数，支持数字和文字描述
        target_pages = 8
        if isinstance(pages, str):
            if pages == '精简':
                target_pages = 5
            elif pages == '详细':
                target_pages = 12
            elif pages.isdigit():
                target_pages = max(3, min(20, int(pages)))
        elif isinstance(pages, int):
            target_pages = max(3, min(20, pages))
        
        logger.info(f"目标页数: {target_pages}")
        
        # 读取模板风格描述
        template_desc = ""
        if template:
            json_path = os.path.join(TEMPLATE_FOLDER, template.replace(os.path.splitext(template)[1], '.json'))
            logger.info(f"尝试读取模板描述文件: {json_path}")
            if os.path.exists(json_path):
                try:
                    with open(json_path, 'r', encoding='utf-8') as f:
                        template_data = json.load(f)
                        template_desc = template_data.get('desc', '')
                        logger.info(f"模板描述: {template_desc[:100]}...")
                except Exception as e:
                    logger.error(f"读取模板描述失败: {str(e)}")
        
        # 获取增强内容
        enhanced_context = request.form.get('enhancedContext', '') if request.content_type and 'multipart/form-data' in request.content_type else ''
        
        # 如果没有提供增强内容，尝试从知识库获取
        if not enhanced_context:
            try:
                # 将学科名称转换为对应的知识库目录名
                subject_mapping = {
                    '生物': 'biology',
                    '数学': 'math',
                    '物理': 'physics',
                    '化学': 'chemistry'
                }
                
                mapped_subject = subject_mapping.get(subject)
                
                retriever = get_retriever()
                enhanced_context = retriever.get_relevant_content(topic or "", subject=mapped_subject)
                logger.info(f"自动从知识库获取增强内容，长度: {len(enhanced_context)}")
            except Exception as e:
                logger.warning(f"获取知识库增强内容失败: {str(e)}")
                # 失败时继续，不中断流程

        # 构建提示词
        prompt = f"请为主题《{topic}》创建一个包含{target_pages}页的PPT大纲。"
        
        if background:
            prompt += f"\n\n背景信息：{background}"
        
        if role:
            prompt += f"\n\n演讲者角色：{role}"
            
        if scene:
            prompt += f"\n\n演讲场景：{scene}"
            
        # 添加增强内容
        enhanced_context_from_form = request.form.get('enhancedContext', '') if request.content_type and 'multipart/form-data' in request.content_type else ''
        enhanced_context_from_json = data.get('enhancedContext', '') if data else ''
        enhanced_context = enhanced_context or enhanced_context_from_form or enhanced_context_from_json or ''
        
        if enhanced_context:
            logger.info("使用RAG增强内容")
            prompt += f"\n\n以下是关于主题的参考资料，请在创建大纲时充分利用这些专业知识：\n{enhanced_context}\n\n"
            # 明确要求利用知识库内容
            prompt += "请务必将上述专业知识融入到PPT内容中，确保内容的准确性和专业性。"
        else:
            prompt += "\n不需要添加参考资料，请根据你已有的知识创建大纲。\n\n"
            
        # 添加布局多样化的要求
        prompt += "\n\n请使用多种幻灯片布局类型，包括：封面(cover)、要点(keypoints)、对比(compare)、图文(image)、总结(summary)、流程(flow)、图表(chart)、表格(table)和引用(quote)等。"
        prompt += "\n每个幻灯片应包含'layout'字段指定布局类型，合理分配不同布局以增强PPT的视觉多样性。"
        prompt += "\n\n请以JSON数组格式返回，每个幻灯片包含title(标题)、content(内容)、layout(布局类型)字段，根据布局类型可能还需要image(图片描述)、keypoints(要点列表)、table(表格数据)等字段。"
        prompt += "\n\n示例格式：\n[{\"title\":\"标题1\", \"content\":\"内容1\", \"layout\":\"cover\"}, {\"title\":\"标题2\", \"content\":\"内容2\", \"layout\":\"keypoints\", \"keypoints\":[\"要点1\", \"要点2\"]}, ...]"

        # 继续使用原有的百炼API调用
        headers = {
            'Authorization': f'Bearer {API_KEY}',
            'Content-Type': 'application/json'
        }
        
        payload = {
            'model': 'qwen-max',
            'parameters': {
                'max_tokens': 4000,
                'temperature': 0.7 if deep_think else 0.9,  # 非深度思考时使用更高温度
                'top_p': 0.8 if deep_think else 0.95,       # 非深度思考时使用更高top_p
                'result_format': 'message'
            },
            'input': {
                'messages': [
                    {"role": "system", "content": "你是一个专业的演示文稿设计专家。"},
                    {"role": "user", "content": prompt}
                ]
            }
        }

        # 使用知识增强的提示词方式生成大纲
        logger.info("使用知识增强的提示词方式生成大纲")
        
        # 调用百炼API生成大纲
        logger.info("调用百炼API生成大纲")
        response = requests.post(
            API_URL,
            json=payload,
            headers=headers
        )
        
        if response.status_code != 200:
            logger.error(f"大纲生成API调用失败: {response.status_code}, {response.text}")
            return jsonify({"error": f"API请求失败: {response.status_code}", "detail": response.text}), 500
            
        result = response.json()
        
        # 从API响应中提取内容
        try:
            # 尝试原有路径
            if 'output' in result and 'message' in result['output'] and 'content' in result['output']['message']:
                content = result['output']['message']['content']
            # 尝试其他可能的路径
            elif 'output' in result and 'content' in result['output']:
                content = result['output']['content']
            # 处理百炼API新格式
            elif 'output' in result and 'choices' in result['output'] and len(result['output']['choices']) > 0:
                if 'message' in result['output']['choices'][0] and 'content' in result['output']['choices'][0]['message']:
                    content = result['output']['choices'][0]['message']['content']
                elif 'content' in result['output']['choices'][0]:
                    content = result['output']['choices'][0]['content']
            elif 'response' in result:
                content = result['response']
            elif 'content' in result:
                content = result['content']
            elif 'text' in result:
                content = result['text']
            else:
                # 如果找不到内容，记录完整响应并使用备用方法
                logger.error(f"无法从API响应中提取内容，完整响应: {json.dumps(result, ensure_ascii=False)}")
                # 尝试直接使用整个结果
                content = json.dumps(result, ensure_ascii=False)
        except Exception as e:
            logger.error(f"提取API响应内容时出错: {str(e)}")
            logger.error(f"API响应: {json.dumps(result, ensure_ascii=False)[:1000]}")
            return jsonify({"error": f"处理API响应失败: {str(e)}"}), 500
            
        logger.info(f"大纲生成成功，内容长度: {len(content)}")
        logger.debug(f"大纲生成内容预览: {content[:500]}...")
        
        # 清理AI文本并解析JSON
        ai_text = filter_irrelevant(content)
        
        # 清理AI文本中的特殊字符，防止JSON解析失败
        def clean_json_text(text):
            # 先移除可能的前后缀文本，只保留JSON部分
            clean_text = text.strip()
            
            # 查找JSON数组的开始和结束
            array_start = clean_text.find('[')
            array_end = clean_text.rfind(']')
            
            if array_start != -1 and array_end != -1 and array_end > array_start:
                clean_text = clean_text[array_start:array_end + 1]
            
            # 替换特殊字符
            clean_text = (clean_text
                .replace("π", "pi")
                .replace("√", "sqrt")
                .replace("∞", "infinity")
                .replace("°", "度")
                .replace("\u2018", "'")  # 智能单引号
                .replace("\u2019", "'")  # 智能单引号
                .replace("\u201C", '"')  # 智能双引号
                .replace("\u201D", '"')  # 智能双引号
                .replace("\u2026", "...")  # 省略号
                # 移除控制字符
                .replace("\r\n", " ")  # Windows换行符
                .replace("\n", " ")  # Unix换行符
                .replace("\r", " ")  # Mac换行符
                .replace("\t", " ")  # 制表符
            )
            
            # 清理多余的空格
            clean_text = " ".join(clean_text.split())
            
            # 确保JSON格式正确
            clean_text = clean_text.replace(",}", "}").replace(",]", "]")
            
            return clean_text
        
        # 第三步：为每页内容搜索相关图片
        logger.info("第三步：解析JSON并为每页内容搜索相关图片")
        
        try:
            # 尝试解析JSON
            cleaned_text = clean_json_text(ai_text)
            parsed_outline = None
            
            # 尝试直接解析
            try:
                parsed_outline = json.loads(cleaned_text)
            except Exception as e:
                logger.warning(f"直接解析JSON失败: {str(e)}")
                
                # 尝试正则提取
                import re
                json_array_match = re.search(r'\[[\s\S]*\]', cleaned_text)
                if json_array_match:
                    try:
                        array_json = clean_json_text(json_array_match.group(0))
                        parsed_outline = json.loads(array_json)
                    except Exception as e:
                        logger.warning(f"正则提取JSON失败: {str(e)}")
                
                # 尝试提取单个对象
                if not parsed_outline:
                    json_objects = []
                    object_regex = r'\{(?:[^{}]|{[^{}]*})*\}'
                    for match in re.finditer(object_regex, cleaned_text):
                        try:
                            obj_str = clean_json_text(match.group(0))
                            obj = json.loads(obj_str)
                            if obj and isinstance(obj, dict):
                                json_objects.append(obj)
                        except Exception as e:
                            logger.warning(f"解析单个JSON对象失败: {str(e)}")
                    
                    if json_objects:
                        parsed_outline = json_objects
            
            # 如果所有方法都失败，使用文本解析
            if not parsed_outline:
                logger.warning("所有JSON解析方法都失败，使用文本解析")
                parsed_outline = parse_outline(ai_text)
            
            # 确保parsed_outline是列表
            if not isinstance(parsed_outline, list):
                parsed_outline = [parsed_outline]
            
            logger.info(f"成功解析出 {len(parsed_outline)} 页内容")
            
            # 为每页搜索相关图片
            if web_search:
                logger.info("开始为每页搜索相关图片")
                for i, slide in enumerate(parsed_outline):
                    if isinstance(slide, dict):
                        # 获取图片描述
                        image_desc = slide.get('image', '')
                        if image_desc and isinstance(image_desc, str) and not image_desc.startswith('http'):
                            logger.info(f"为第 {i+1} 页搜索图片: {image_desc[:50]}...")
                            
                            # 构建搜索查询
                            search_query = f"{topic} {slide.get('title', '')} {image_desc}"
                            
                            try:
                                # 这里可以接入图片搜索API，如Bing Image Search、Google Custom Search等
                                # 由于没有实际的API密钥，这里使用占位URL
                                # 实际实现时应替换为真实的图片搜索API调用
                                image_url = f"https://picsum.photos/800/600?random={i+1}"  # 占位图片
                                slide['image'] = image_url
                                logger.info(f"找到图片: {image_url}")
                            except Exception as e:
                                logger.error(f"图片搜索失败: {str(e)}")
                                # 保留原始描述
                                pass
            
            logger.info("内容处理完成，返回结果")
            return jsonify({"outline": parsed_outline})
            
        except Exception as e:
            logger.error(f"内容处理过程中发生异常: {str(e)}")
            logger.error(f"异常详情: {traceback.format_exc()}")
            return jsonify({"error": str(e)}), 500
    
    except Exception as e:
        logger.error(f"生成大纲过程中发生异常: {str(e)}")
        logger.error(f"异常详情: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500

def preprocess_outline_data(outline):
    """
    预处理大纲数据，确保其格式正确
    
    Args:
        outline: 原始大纲数据
        
    Returns:
        processed_outline: 处理后的大纲数据
    """
    logger.info("预处理大纲数据")
    
    if not outline:
        return []
        
    # 如果是字符串，尝试解析JSON
    if isinstance(outline, str):
        try:
            outline = json.loads(outline)
        except:
            logger.warning("解析大纲JSON失败，尝试作为纯文本处理")
            # 按行拆分，创建简单的幻灯片大纲
            lines = outline.strip().split('\n')
            outline = []
            for i, line in enumerate(lines):
                if i == 0:  # 第一行作为标题
                    outline.append({"type": "title", "title": line, "subtitle": ""})
                else:  # 其他行作为内容页
                    outline.append({"type": "content", "title": line, "content": ""})
                    
    # 确保是列表
    if not isinstance(outline, list):
        outline = [outline]
        
    # 处理每个幻灯片
    for i, slide in enumerate(outline):
        # 确保是字典
        if not isinstance(slide, dict):
            outline[i] = {"type": "content", "title": str(slide), "content": ""}
            continue
            
        # 添加默认类型
        if 'type' not in slide:
            # 判断幻灯片类型
            if i == 0:
                slide['type'] = 'title'  # 第一张默认为标题页
            elif i == len(outline) - 1:
                slide['type'] = 'conclusion'  # 最后一张默认为结论页
            else:
                slide['type'] = 'content'  # 其他默认为内容页
                
    logger.info(f"预处理完成，共 {len(outline)} 张幻灯片")
    return outline

# 修改gen_pptx_python函数，集成HTML中间格式方法
@app.route('/api/aiPpt/gen-pptx-python', methods=['POST'])
def gen_pptx_python():
    """使用模板生成PPTX"""
    logger.info("=== 开始生成PPT ===")
    try:
        data = request.json
        logger.info(f"接收到的请求数据: {json.dumps(data, ensure_ascii=False)[:200]}...")
        
        if not data:
            logger.error("请求数据为空")
            return jsonify({"error": "请求数据为空"}), 400
            
        if not data.get('outline'):
            logger.error("缺少大纲数据")
            return jsonify({"error": "缺少大纲数据"}), 400
        
        outline = data.get('outline')
        template_name = data.get('template')
        topic = data.get('topic', '')
        
        logger.info(f"主题: {topic}")
        logger.info(f"模板名称: {template_name}")
        logger.info(f"大纲页数: {len(outline)}")
        
        # 检查大纲数据，确保至少有一页有效内容
        valid_outline = []
        for slide in outline:
            # 确保每个幻灯片至少有标题或内容
            if not slide.get('title') and not slide.get('content'):
                # 如果既没有标题也没有内容，使用主题作为标题
                slide['title'] = topic or "未命名幻灯片"
            valid_outline.append(slide)
        
        # 使用有效的大纲
        outline = valid_outline
        
        # 预处理大纲数据，确保数据格式正确
        outline = preprocess_outline_data(outline)
        logger.info(f"处理后的大纲页数: {len(outline)}")
        
        # 生成唯一的文件名
        timestamp = int(time.time())
        filename = f"test_app_{timestamp}.pptx"
        output_path = os.path.join(UPLOAD_FOLDER, filename)
        
        # 确定模板路径
        template_path = None
        if template_name:
            template_path = os.path.join(TEMPLATE_FOLDER, f"{template_name}.pptx")
            if not os.path.exists(template_path):
                logger.warning(f"模板不存在: {template_path}")
                template_path = None

        # 尝试使用HTML中间格式生成PPT
        try:
            # 优先使用HTML中间格式方法
            logger.info("尝试使用HTML中间格式方法生成PPT")
            
            # 导入PPT引擎
            try:
                from ppt_engine.unified_generator import generate_ppt_from_outline
                html_ppt_success = generate_ppt_from_outline(outline, template_path, output_path)
                
                if html_ppt_success and os.path.exists(output_path):
                    logger.info(f"HTML中间格式方法生成PPT成功: {output_path}")
                    ppt_url = f"/uploads/{filename}"
                    logger.info(f"PPT URL: {ppt_url}")
                    logger.info("=== PPT生成完成 ===")
                    return jsonify({"pptUrl": ppt_url})
            except ImportError:
                logger.warning("未找到ppt_engine模块，将使用传统方法")
            except Exception as e:
                logger.warning(f"HTML中间格式方法生成PPT失败: {str(e)}")
                logger.warning(traceback.format_exc())
            
            # 如果HTML方法失败，回退到原始方法
            logger.info("回退到原始方法生成PPT")
        except Exception as e:
            logger.warning(f"HTML中间格式方法出错: {str(e)}")
            logger.warning(traceback.format_exc())
        
        # 回退方法：调用原有的PPT生成脚本
        try:
            # 将大纲数据写入临时文件
            temp_json_path = os.path.join(UPLOAD_FOLDER, f"outline_{timestamp}.json")
            with open(temp_json_path, 'w', encoding='utf-8') as f:
                json.dump(outline, f, ensure_ascii=False, indent=2)
            
            logger.info(f"大纲数据已写入临时文件: {temp_json_path}")
            
            if template_path and os.path.exists(template_path):
                # 导入模板填充脚本
                from ppt_fill_template import fill_ppt_template
                
                # 读取JSON数据
                with open(temp_json_path, 'r', encoding='utf-8') as f:
                    slides_data = json.load(f)
                
                # 直接调用函数
                success = fill_ppt_template(template_path, slides_data, output_path)
                if not success:
                    logger.error("PPT生成函数执行失败")
                    return jsonify({"error": "PPT生成失败"}), 500
            else:
                # 模板不存在，使用无模板生成方式
                logger.warning(f"模板不存在，使用无模板生成方式")
                
                # 导入无模板生成脚本
                from ppt_without_template import generate_ppt_without_template
                
                # 读取JSON数据
                with open(temp_json_path, 'r', encoding='utf-8') as f:
                    slides_data = json.load(f)
                
                # 直接调用函数
                success = generate_ppt_without_template(slides_data, output_path)
                if not success:
                    logger.error("PPT生成函数执行失败")
                    return jsonify({"error": "PPT生成失败"}), 500
                    
            logger.info("PPT生成函数执行成功")
                
            # 清理临时文件
            try:
                os.remove(temp_json_path)
                logger.info(f"临时文件已删除: {temp_json_path}")
            except Exception as e:
                logger.warning(f"临时文件删除失败: {str(e)}")
                
        except Exception as e:
            logger.error(f"PPT生成过程中发生异常: {str(e)}")
            logger.error(f"异常详情: {traceback.format_exc()}")
            return jsonify({"error": f"PPT生成失败: {str(e)}"}), 500
        
        # 确保文件已生成
        if not os.path.exists(output_path):
            logger.error(f"PPT文件未生成: {output_path}")
            return jsonify({"error": "PPT生成失败，文件未创建"}), 500
            
        file_size = os.path.getsize(output_path)
        logger.info(f"PPT文件已生成，大小: {file_size} 字节")
        
        ppt_url = f"/uploads/{filename}"
        logger.info(f"PPT URL: {ppt_url}")
        logger.info("=== PPT生成完成 ===")
        
        return jsonify({"pptUrl": ppt_url})
    except Exception as e:
        logger.error(f"PPT生成过程中发生异常: {str(e)}")
        logger.error(f"异常详情: {traceback.format_exc()}")
        return jsonify({"error": f"PPT生成失败: {str(e)}"}), 500

@app.route('/api/aiPpt/gen-pptx-without-template', methods=['POST'])
def gen_pptx_without_template():
    """不使用模板直接生成PPTX"""
    logger.info("=== 开始生成PPT(无模板) ===")
    try:
        data = request.json
        logger.info(f"接收到的请求数据: {json.dumps(data, ensure_ascii=False)[:200]}...")
        
        if not data:
            logger.error("请求数据为空")
            return jsonify({"error": "请求数据为空"}), 400
            
        if not data.get('outline'):
            logger.error("缺少大纲数据")
            return jsonify({"error": "缺少大纲数据"}), 400
        
        outline = data.get('outline')
        topic = data.get('topic', '')
        
        logger.info(f"主题: {topic}")
        logger.info(f"大纲页数: {len(outline)}")
        
        # 检查大纲数据，确保至少有一页有效内容
        valid_outline = []
        for slide in outline:
            # 确保每个幻灯片至少有标题或内容
            if not slide.get('title') and not slide.get('content'):
                # 如果既没有标题也没有内容，使用主题作为标题
                slide['title'] = topic or "未命名幻灯片"
            valid_outline.append(slide)
        
        # 使用有效的大纲
        outline = valid_outline
        
        # 预处理大纲数据，确保数据格式正确
        outline = preprocess_outline_data(outline)
        logger.info(f"处理后的大纲页数: {len(outline)}")
        
        # 生成唯一的文件名
        timestamp = int(time.time())
        filename = f"test_app_{timestamp}.pptx"
        output_path = os.path.join(UPLOAD_FOLDER, filename)
        
        # 尝试使用HTML中间格式生成PPT (无模板模式)
        try:
            # 优先使用HTML中间格式方法
            logger.info("尝试使用HTML中间格式方法生成PPT(无模板)")
            
            # 导入PPT引擎
            try:
                from ppt_engine.unified_generator import generate_ppt_from_outline
                html_ppt_success = generate_ppt_from_outline(outline, None, output_path)
                
                if html_ppt_success and os.path.exists(output_path):
                    logger.info(f"HTML中间格式方法生成PPT成功: {output_path}")
                    ppt_url = f"/uploads/{filename}"
                    logger.info(f"PPT URL: {ppt_url}")
                    logger.info("=== PPT生成完成 ===")
                    return jsonify({"pptUrl": ppt_url})
            except ImportError:
                logger.warning("未找到ppt_engine模块，将使用传统方法")
            except Exception as e:
                logger.warning(f"HTML中间格式方法生成PPT失败: {str(e)}")
                logger.warning(traceback.format_exc())
            
            # 如果HTML方法失败，回退到原始方法
            logger.info("回退到原始方法生成PPT")
        except Exception as e:
            logger.warning(f"HTML中间格式方法出错: {str(e)}")
            logger.warning(traceback.format_exc())
        
        # 调用无模板PPT生成脚本
        try:
            # 将大纲数据写入临时文件
            temp_json_path = os.path.join(UPLOAD_FOLDER, f"outline_{timestamp}.json")
            with open(temp_json_path, 'w', encoding='utf-8') as f:
                json.dump(outline, f, ensure_ascii=False, indent=2)
            
            logger.info(f"大纲数据已写入临时文件: {temp_json_path}")
            
            # 导入脚本
            from ppt_without_template import generate_ppt_without_template
            
            # 读取JSON数据
            with open(temp_json_path, 'r', encoding='utf-8') as f:
                slides_data = json.load(f)
            
            # 直接调用函数
            success = generate_ppt_without_template(slides_data, output_path)
            if not success:
                logger.error("PPT生成函数执行失败")
                return jsonify({"error": "PPT生成失败"}), 500
                
            logger.info("PPT生成函数执行成功")
                
            # 清理临时文件
            try:
                os.remove(temp_json_path)
                logger.info(f"临时文件已删除: {temp_json_path}")
            except Exception as e:
                logger.warning(f"临时文件删除失败: {str(e)}")
                
        except Exception as e:
            logger.error(f"PPT生成过程中发生异常: {str(e)}")
            logger.error(f"异常详情: {traceback.format_exc()}")
            return jsonify({"error": f"PPT生成失败: {str(e)}"}), 500
        
        # 确保文件已生成
        if not os.path.exists(output_path):
            logger.error(f"PPT文件未生成: {output_path}")
            return jsonify({"error": "PPT生成失败，文件未创建"}), 500
            
        file_size = os.path.getsize(output_path)
        logger.info(f"PPT文件已生成，大小: {file_size} 字节")
        
        ppt_url = f"/uploads/{filename}"
        logger.info(f"PPT URL: {ppt_url}")
        logger.info("=== PPT生成完成 ===")
        
        return jsonify({"pptUrl": ppt_url})
    except Exception as e:
        logger.error(f"PPT生成过程中发生异常: {str(e)}")
        logger.error(f"异常详情: {traceback.format_exc()}")
        return jsonify({"error": f"PPT生成失败: {str(e)}"}), 500

@app.route('/api/aiPpt/gen-pptx-enhanced', methods=['POST'])
def gen_pptx_enhanced():
    """生成增强版PPT（使用HTML中间格式）"""
    start_time = time.time()
    logger.info("=== 开始生成增强版PPT ===")
    
    try:
        # 解析请求数据
        data = request.get_json()
        if not data:
            return jsonify({"error": "请提供有效的大纲数据"}), 400
        
        # 提取主题和模板名称
        theme = data.get('theme', '')
        template_name = data.get('template_name', '')
        outline = data.get('outline', [])
        
        if not outline or not isinstance(outline, list):
            return jsonify({"error": "请提供有效的大纲数据"}), 400
            
        # 预处理大纲数据
        processed_outline = preprocess_outline_data_enhanced(outline)
        
        # 确定输出路径
        timestamp = int(time.time())
        output_filename = f"enhanced_{timestamp}.pptx"
        output_path = os.path.join(UPLOAD_FOLDER, output_filename)
        
        # 确定模板路径
        template_path = None
        if template_name:
            logger.info(f"请求使用模板: {template_name}")
            # 检查是否是完整路径
            if os.path.exists(template_name):
                template_path = template_name
                logger.info(f"使用完整路径的模板: {template_path}")
            else:
                # 尝试在模板目录中查找
                possible_template = os.path.join(TEMPLATE_FOLDER, template_name)
                if os.path.exists(possible_template):
                    template_path = possible_template
                    logger.info(f"在模板目录中找到模板: {template_path}")
                else:
                    # 尝试添加.pptx后缀查找
                    if not template_name.endswith('.pptx'):
                        possible_template = os.path.join(TEMPLATE_FOLDER, f"{template_name}.pptx")
                        if os.path.exists(possible_template):
                            template_path = possible_template
                            logger.info(f"添加.pptx后缀找到模板: {template_path}")
            
            if not template_path:
                logger.warning(f"找不到指定的模板: {template_name}，将使用默认模板或不使用模板")
                # 尝试使用默认模板
                default_template = os.path.join(TEMPLATE_FOLDER, "绿色圆点.pptx")
                if os.path.exists(default_template):
                    template_path = default_template
                    logger.info(f"使用默认模板: {template_path}")
        else:
            logger.info("未指定模板，尝试使用默认模板")
            # 尝试使用默认模板
            default_template = os.path.join(TEMPLATE_FOLDER, "绿色圆点.pptx")
            if os.path.exists(default_template):
                template_path = default_template
                logger.info(f"使用默认模板: {template_path}")
        
        # 使用统一生成器生成PPT
        try:
            # 检查必要的目录是否存在
            html_templates_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 
                                             "ppt_engine", "html_templates")
            os.makedirs(html_templates_dir, exist_ok=True)
            
            # 首先预处理模板，确保HTML模板已生成
            if template_path:
                from preprocess_templates import preprocess_template
                html_template_dir = os.path.join(html_templates_dir, 
                                               os.path.splitext(os.path.basename(template_path))[0])
                                               
                logger.info(f"预处理模板: {template_path} -> {html_template_dir}")
                success = preprocess_template(template_path, html_templates_dir)
                if not success:
                    logger.warning(f"模板预处理失败，可能会影响渲染效果")
            
            # 导入并使用统一生成器
            from ppt_engine.unified_generator import generate_ppt_from_outline
            logger.info(f"使用HTML中间格式生成PPT，模板: {template_path}")
            ppt_path = generate_ppt_from_outline(processed_outline, template_path, output_path)
            
            if not ppt_path or not os.path.exists(ppt_path):
                logger.error("HTML中间格式生成PPT失败，尝试使用备用方法")
                raise Exception("HTML中间格式生成失败")
                
            logger.info(f"成功使用HTML中间格式生成PPT: {ppt_path}")
        except Exception as e:
            # 如果HTML中间格式生成失败，回退到原始方法
            logger.error(f"HTML中间格式生成失败: {str(e)}")
            logger.error(traceback.format_exc())
            
            # 使用原始方法生成（不带模板）
            try:
                # 导入无模板生成函数
                from ppt_without_template import create_ppt_without_template
                logger.info("回退到原始方法生成PPT")
                ppt_path = create_ppt_without_template(processed_outline, output_path)
            except Exception as import_error:
                logger.error(f"导入或使用备用方法失败: {str(import_error)}")
                logger.error(traceback.format_exc())
                return jsonify({"error": "生成PPT失败，请重试"}), 500
        
        # 检查生成的PPT文件是否存在
        if not os.path.exists(ppt_path):
            logger.error(f"生成的PPT文件不存在: {ppt_path}")
            return jsonify({"error": "生成PPT失败，请重试"}), 500
            
        # 计算生成时间
        generation_time = time.time() - start_time
        
        # 构造响应数据
        file_url = f"/uploads/{os.path.basename(ppt_path)}"
        file_size = os.path.getsize(ppt_path)
        
        response_data = {
            "file_url": file_url,
            "file_name": os.path.basename(ppt_path),
            "file_size": file_size,
            "generation_time": generation_time,
            "status": "success",
            "template_used": os.path.basename(template_path) if template_path else "none"
        }
        
        logger.info(f"PPT生成成功: {ppt_path}, 大小: {file_size} 字节, 生成时间: {generation_time:.2f}秒")
        logger.info(f"使用的模板: {template_path if template_path else '无'}")
        logger.info("=== PPT生成完成 ===")
        
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error(f"PPT生成异常: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": f"生成PPT时发生错误: {str(e)}"}), 500

def preprocess_outline_data_enhanced(outline_data):
    """预处理增强版大纲数据，添加缺失的字段"""
    if not outline_data:
        return []

    # 确保数据是列表类型
    if not isinstance(outline_data, list):
        if isinstance(outline_data, dict):
            outline_data = [outline_data]
        else:
            logger.error(f"大纲数据格式不正确: {type(outline_data)}")
            return []

    # 处理每个幻灯片数据
    for slide in outline_data:
        # 确保基本字段存在
        if 'title' not in slide:
            slide['title'] = '未命名幻灯片'
            
        if 'content' not in slide:
            slide['content'] = ''

        # 处理要点列表
        if 'bullet_points' not in slide:
            slide['bullet_points'] = []

        # 添加类型字段
        if 'type' not in slide:
            # 尝试根据内容推断类型
            if slide.get('image') or slide.get('image_url'):
                slide['type'] = 'image'
            elif slide.get('table') or slide.get('chart'):
                slide['type'] = 'table'
            else:
                slide['type'] = 'content'
                
            # 特殊处理第一张幻灯片
            if outline_data.index(slide) == 0:
                slide['type'] = 'cover'

    return outline_data

# 保持原始的HTML中间格式API端点
@app.route('/api/aiPpt/generate-html-ppt', methods=['POST'])
def generate_html_ppt():
    """使用基于HTML中间格式的方法生成PPT"""
    logger.info("=== 开始使用HTML中间格式方法生成PPT ===")
    try:
        data = request.json
        if not data:
            return jsonify({"error": "请提供有效的JSON数据"}), 400
            
        # 提取参数
        outline = data.get('outline')
        template_name = data.get('template')
        
        if not outline:
            return jsonify({"error": "未提供大纲数据"}), 400
            
        # 生成唯一文件名
        timestamp = int(time.time())
        output_filename = f"html_ppt_{timestamp}.pptx"
        output_path = os.path.join(UPLOAD_FOLDER, output_filename)
        
        # 确定模板路径
        template_path = None
        if template_name:
            template_path = os.path.join(TEMPLATE_FOLDER, f"{template_name}.pptx")
            if not os.path.exists(template_path):
                return jsonify({"error": f"模板不存在: {template_name}"}), 404
        
        # 导入PPT引擎
        try:
            from ppt_engine.unified_generator import generate_ppt_from_outline
        except ImportError:
            logger.warning("未找到ppt_engine模块，尝试导入本地模块")
            # 本地ppt_engine目录的路径
            engine_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ppt_engine")
            if os.path.exists(engine_dir):
                sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
                from ppt_engine.unified_generator import generate_ppt_from_outline
            else:
                return jsonify({"error": "缺少PPT引擎模块"}), 500
        
        # 生成PPT
        generated_ppt = generate_ppt_from_outline(outline, template_path, output_path)
        
        if not generated_ppt or not os.path.exists(generated_ppt):
            return jsonify({"error": "生成PPT失败"}), 500
            
        # 返回结果
        ppt_url = f"/uploads/{output_filename}"
        logger.info(f"PPT URL: {ppt_url}")
        logger.info("=== HTML PPT生成完成 ===")
        
        return jsonify({"pptUrl": ppt_url})
    except Exception as e:
        logger.error(f"HTML PPT生成过程中发生异常: {str(e)}")
        logger.error(f"异常详情: {traceback.format_exc()}")
        return jsonify({"error": f"生成PPT失败: {str(e)}"}), 500

# 添加教学增强PPT生成API
@app.route('/api/aiPpt/gen-educational-ppt', methods=['POST'])
def gen_educational_ppt():
    """生成专注于教学效果的PPT"""
    logger.info("=== 开始生成教学增强PPT ===")
    try:
        data = request.json
        logger.info(f"接收到的请求数据: {json.dumps(data, ensure_ascii=False)[:200]}...")
        
        if not data:
            logger.error("请求数据为空")
            return jsonify({"error": "请求数据为空"}), 400
            
        if not data.get('outline'):
            logger.error("缺少大纲数据")
            return jsonify({"error": "缺少大纲数据"}), 400
        
        outline = data.get('outline')
        template_name = data.get('template')
        topic = data.get('topic', '')
        subject = data.get('subject', '')
        
        logger.info(f"主题: {topic}")
        logger.info(f"模板名称: {template_name}")
        logger.info(f"学科: {subject}")
        logger.info(f"大纲页数: {len(outline)}")
        
        # 优化大纲，针对教学效果
        enhanced_outline = enhance_outline_for_education(outline, topic, subject)
        
        # 生成唯一的文件名
        timestamp = int(time.time())
        filename = f"educational_{timestamp}.pptx"
        output_path = os.path.join(UPLOAD_FOLDER, filename)
        
        # 确定模板路径
        template_path = None
        if template_name:
            template_path = os.path.join(TEMPLATE_FOLDER, f"{template_name}.pptx")
            if not os.path.exists(template_path):
                logger.warning(f"模板不存在: {template_path}")
                template_path = None
        
        # 使用HTML中间格式方法生成PPT
        try:
            from ppt_engine.unified_generator import generate_ppt_from_outline
            generated_ppt = generate_ppt_from_outline(enhanced_outline, template_path, output_path)
            
            if not generated_ppt or not os.path.exists(generated_ppt):
                return jsonify({"error": "生成教学PPT失败"}), 500
                
            # 返回结果
            ppt_url = f"/uploads/{filename}"
            logger.info(f"教学PPT URL: {ppt_url}")
            logger.info("=== 教学PPT生成完成 ===")
            
            return jsonify({"pptUrl": ppt_url})
        except Exception as e:
            logger.error(f"教学PPT生成过程中发生异常: {str(e)}")
            logger.error(f"异常详情: {traceback.format_exc()}")
            return jsonify({"error": f"生成教学PPT失败: {str(e)}"}), 500
    except Exception as e:
        logger.error(f"教学PPT请求处理中发生异常: {str(e)}")
        logger.error(f"异常详情: {traceback.format_exc()}")
        return jsonify({"error": f"请求处理失败: {str(e)}"}), 500

# 辅助函数：预处理大纲数据（旧版）- 函数名已修改，使用新版本在上面定义
def preprocess_outline_data_legacy(outline):
    """
    预处理大纲数据，确保格式正确（旧版本，保留兼容）
    
    Args:
        outline: 原始大纲数据
        
    Returns:
        处理后的大纲数据
    """
    processed_outline = []
    
    for slide in outline:
        # 确保有基本字段
        processed_slide = {
            'title': slide.get('title', ''),
            'content': slide.get('content', ''),
            'layout': slide.get('layout', ''),
            'type': slide.get('type', '')
        }
        
        # 处理要点列表
        if 'keypoints' in slide and slide['keypoints']:
            processed_slide['keypoints'] = slide['keypoints']
            
        # 处理图片
        if 'image' in slide and slide['image']:
            processed_slide['image'] = slide['image']
            
        # 处理表格
        if 'table' in slide and slide['table']:
            processed_slide['table'] = slide['table']
            
        processed_outline.append(processed_slide)
        
    return processed_outline

# 辅助函数：增强教学大纲
def enhance_outline_for_education(outline, topic, subject):
    """
    增强大纲以提升教学效果
    
    Args:
        outline: 原始大纲数据
        topic: 主题
        subject: 学科
        
    Returns:
        增强后的大纲数据
    """
    if not outline:
        return []
        
    enhanced_outline = []
    
    # 确保有封面页
    has_cover = False
    for slide in outline:
        if slide and (slide.get('type') == 'cover' or slide.get('layout') == 'cover'):
            has_cover = True
            break
    
    if not has_cover:
        # 添加封面页
        cover_slide = {
            'title': topic,
            'content': f"教学课件 - {subject}",
            'type': 'cover',
            'layout': 'cover'
        }
        enhanced_outline.append(cover_slide)
    
    # 处理每一页幻灯片，优化教学效果
    for slide in outline:
        if not slide:
            continue
        enhanced_slide = slide.copy()
        
        # 根据内容类型进行教学优化
        if slide.get('keypoints'):
            # 为要点添加编号和强调
            enhanced_keypoints = []
            for i, point in enumerate(slide['keypoints']):
                enhanced_keypoints.append(f"<strong>{i+1}.</strong> {point}")
            enhanced_slide['keypoints'] = enhanced_keypoints
        
        # 添加教学提示（如果是内容页）
        if slide.get('type') != 'cover' and slide.get('type') != 'conclusion':
            if not enhanced_slide.get('note'):
                enhanced_slide['note'] = f"教学提示：引导学生理解{enhanced_slide.get('title', '知识点')}的关键概念，讨论相关应用。"
        
        enhanced_outline.append(enhanced_slide)
    
    # 确保有总结页
    has_summary = False
    for slide in outline:
        if slide and (slide.get('type') == 'conclusion' or slide.get('type') == 'summary'):
            has_summary = True
            break
    
    if not has_summary and len(outline) > 0:
        # 添加总结页
        summary_slide = {
            'title': f"{topic} - 总结",
            'content': "本节课程要点回顾",
            'type': 'conclusion',
            'layout': 'summary',
            'keypoints': ["掌握核心概念", "理解应用场景", "完成相关练习"]
        }
        enhanced_outline.append(summary_slide)
    
    return enhanced_outline

@app.route('/uploads/<path:filename>')
def uploaded_file(filename):
    """提供上传文件的访问"""
    logger.info(f"=== 请求访问文件: {filename} ===")
    
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    logger.info(f"文件完整路径: {file_path}")
    
    # 检查文件是否存在
    if not os.path.exists(file_path):
        logger.error(f"文件不存在: {file_path}")
        return jsonify({"error": "文件不存在"}), 404
        
    logger.info(f"文件存在，大小: {os.path.getsize(file_path)} 字节")
    
    try:
        # 添加必要的响应头，确保浏览器能正确处理文件
        response = send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True)
        
        # 对于pptx文件，设置正确的Content-Type
        if filename.endswith('.pptx'):
            logger.info("设置PPTX文件的Content-Type和Content-Disposition")
            response.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
            
        # 添加CORS头
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            
        logger.info(f"响应头: {dict(response.headers)}")
        logger.info(f"=== 文件访问成功 ===")
        return response
    except Exception as e:
        logger.error(f"文件访问异常: {str(e)}")
        logger.error(f"异常详情: {traceback.format_exc()}")
        return jsonify({"error": f"文件访问失败: {str(e)}"}), 500

@app.route('/ppt_templates/<path:filename>')
def template_file(filename):
    """提供模板文件的访问，包括预览图片"""
    logger.info(f"=== 请求访问模板文件: {filename} ===")
    
    # 检查是否是预览图片
    if 'previews/' in filename:
        # 处理预览图片请求
        preview_name = os.path.basename(filename)
        logger.info(f"请求访问模板预览图: {preview_name}")
        return send_from_directory(TEMPLATE_PREVIEWS_FOLDER, preview_name)
    
    # 处理普通模板文件
    file_path = os.path.join(TEMPLATE_FOLDER, filename)
    logger.info(f"文件完整路径: {file_path}")
    
    # 检查文件是否存在
    if not os.path.exists(file_path):
        logger.error(f"模板文件不存在: {file_path}")
        return jsonify({"error": "模板文件不存在"}), 404
        
    logger.info(f"模板文件存在，大小: {os.path.getsize(file_path)} 字节")
    
    try:
        # 对于不同类型的文件设置适当的响应头
        if filename.endswith('.pptx'):
            response = send_from_directory(TEMPLATE_FOLDER, filename, as_attachment=True)
            response.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
        elif filename.endswith('.json'):
            response = send_from_directory(TEMPLATE_FOLDER, filename)
            response.headers['Content-Type'] = 'application/json'
        else:
            response = send_from_directory(TEMPLATE_FOLDER, filename)
            
        # 添加CORS头
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            
        logger.info(f"响应头: {dict(response.headers)}")
        logger.info(f"=== 模板文件访问成功 ===")
        return response
    except Exception as e:
        logger.error(f"模板文件访问失败: {str(e)}")
        logger.error(f"异常详情: {traceback.format_exc()}")
        return jsonify({"error": f"模板文件访问失败: {str(e)}"}), 500

@app.route('/api/aiPpt/delete-file', methods=['POST'])
def delete_ppt_file():
    """删除生成的PPT文件"""
    logger.info("=== 请求删除文件 ===")
    try:
        data = request.json
        if not data or not data.get('filename'):
            logger.error("请求数据为空或缺少文件名")
            return jsonify({"error": "请求数据为空或缺少文件名"}), 400
            
        filename = data.get('filename')
        # 确保文件名不包含路径分隔符，防止目录遍历攻击
        if '/' in filename or '\\' in filename:
            logger.error(f"文件名包含非法字符: {filename}")
            return jsonify({"error": "文件名包含非法字符"}), 400
            
        # 构建文件路径
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        logger.info(f"待删除文件路径: {file_path}")
        
        # 检查文件是否存在
        if not os.path.exists(file_path):
            logger.warning(f"文件不存在，无需删除: {file_path}")
            return jsonify({"success": True, "message": "文件不存在，无需删除"}), 200
            
        # 删除文件
        os.remove(file_path)
        logger.info(f"文件已成功删除: {file_path}")
        
        return jsonify({"success": True, "message": "文件已成功删除"})
    except Exception as e:
        logger.error(f"删除文件过程中发生异常: {str(e)}")
        logger.error(f"异常详情: {traceback.format_exc()}")
        return jsonify({"error": f"删除文件失败: {str(e)}"}), 500

# 添加图片缓存目录路由
@app.route('/image_cache/<path:filename>')
def cached_image(filename):
    """提供缓存图片的访问"""
    logger.info(f"=== 请求访问缓存图片: {filename} ===")
    
    image_cache_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'image_cache')
    file_path = os.path.join(image_cache_dir, filename)
    logger.info(f"图片完整路径: {file_path}")
    
    # 检查文件是否存在
    if not os.path.exists(file_path):
        logger.error(f"缓存图片不存在: {file_path}")
        return jsonify({"error": "图片不存在"}), 404
        
    logger.info(f"图片存在，大小: {os.path.getsize(file_path)} 字节")
    
    try:
        # 添加必要的响应头，确保浏览器能正确处理文件
        response = send_from_directory(image_cache_dir, filename)
        
        # 添加CORS头
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            
        logger.info(f"=== 图片访问成功 ===")
        return response
    except Exception as e:
        logger.error(f"图片访问异常: {str(e)}")
        logger.error(f"异常详情: {traceback.format_exc()}")
        return jsonify({"error": "图片访问失败", "detail": str(e)}), 500

# 添加默认图片目录路由
@app.route('/default_images/<path:filename>')
def default_image(filename):
    """提供默认图片的访问"""
    logger.info(f"=== 请求访问默认图片: {filename} ===")
    
    default_images_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'default_images')
    file_path = os.path.join(default_images_dir, filename)
    logger.info(f"默认图片完整路径: {file_path}")
    
    # 检查文件是否存在
    if not os.path.exists(file_path):
        logger.error(f"默认图片不存在: {file_path}")
        return jsonify({"error": "图片不存在"}), 404
        
    logger.info(f"默认图片存在，大小: {os.path.getsize(file_path)} 字节")
    
    try:
        # 添加必要的响应头，确保浏览器能正确处理文件
        response = send_from_directory(default_images_dir, filename)
        
        # 添加CORS头
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
            
        logger.info(f"=== 默认图片访问成功 ===")
        return response
    except Exception as e:
        logger.error(f"默认图片访问异常: {str(e)}")
        logger.error(f"异常详情: {traceback.format_exc()}")
        return jsonify({"error": "图片访问失败", "detail": str(e)}), 500

# 导入改进的PPT生成器
from improved_ppt_generator import generate_ppt

# 添加资源API端点
@app.route('/api/resource', methods=['GET'])
def get_resources():
    resource_type = request.args.get('type', 'all')
    # 返回示例数据
    if resource_type == 'custom':
        return jsonify([
            {
                'id': 1,
                'title': '示例定制资源',
                'desc': '这是一个示例的定制资源',
                'cover': '/default_images/default.jpg',
                'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
        ])
    elif resource_type == 'undefined':
        # 处理前端可能发送的undefined类型请求
        return jsonify([])
    return jsonify([])  # 默认返回空数组

# 添加思维导图生成API端点
@app.route('/api/mindmap/generate', methods=['POST'])
@app.route('/api/resource/mindmap/generate', methods=['POST'])
def generate_mindmap():
    """生成思维导图"""
    logger.info("=== 请求生成思维导图 ===")
    try:
        data = request.json
        if not data:
            logger.error("请求数据为空")
            return jsonify({"success": False, "error": "请求数据为空"}), 400
            
        # 获取请求参数
        topic = data.get('topic', '') or data.get('content', '')
        depth = int(data.get('depth', 4))
        style = data.get('style', 'classic')
        language = data.get('language', 'zh')
        subject = data.get('subject', '')
        chapter = data.get('chapter', '')
        
        logger.info(f"生成思维导图参数: topic={topic}, depth={depth}, style={style}, language={language}")
        
        if not topic.strip():
            return jsonify({"success": False, "error": "主题内容不能为空"}), 400
        
        # 调用百炼API生成思维导图
        headers = {
            'Authorization': f'Bearer {API_KEY}',
            'Content-Type': 'application/json'
        }
        
        # 构造提示词
        prompt = f"""
请根据以下内容，生成一个思维导图的数据结构：

{topic}

如果内容涉及{subject}学科的{chapter}章节，请重点关注其中的知识结构。

请生成一个JSON格式的思维导图结构，深度为{depth}层，格式如下：
```json
[
  {{
    "id": "root",
    "title": "核心主题",
    "level": 0,
    "children": [
      {{
        "id": "branch-1",
        "title": "分支1",
        "level": 1,
        "children": [
          {{
            "id": "leaf-1",
            "title": "叶节点1",
            "level": 2
          }}
        ]
      }},
      {{
        "id": "branch-2",
        "title": "分支2",
        "level": 1
      }}
    ]
  }}
]
```

ONLY返回符合JSON格式的思维导图数据，不要有其他任何文本说明。每个节点必须包含id、title、level字段，子节点放在children数组中。
        """
        
        payload = {
            'model': 'qwen-max',
            'parameters': {
                'temperature': 0.5,
                'top_p': 0.8,
                'result_format': 'message'
            },
            'input': {
                'messages': [
                    {
                        'role': 'system',
                        'content': '你是一个专业的教育内容结构分析专家，擅长将复杂内容组织为清晰的思维导图。'
                    },
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ]
            }
        }
        
        logger.info("正在调用百炼API生成思维导图...")
        response = requests.post(API_URL, headers=headers, json=payload)
        
        if response.status_code != 200:
            logger.error(f"API请求失败: {response.status_code}, {response.text}")
            return jsonify({
                "success": False,
                "error": f"生成思维导图失败: API返回错误 {response.status_code}"
            }), 500
            
        result = response.json()
        logger.info("API请求成功，解析返回结果")
        
        # 解析返回的消息内容
        ai_message = ""
        try:
            ai_message = result.get('output', {}).get('choices', [{}])[0].get('message', {}).get('content', '')
        except (AttributeError, IndexError, TypeError):
            logger.error(f"解析API响应失败，响应结果: {result}")
            return jsonify({
                "success": False, 
                "error": "解析API响应失败"
            }), 500
        
        if not ai_message:
            return jsonify({
                "success": False,
                "error": "API响应为空"
            }), 500
        
        # 从返回的内容中提取JSON
        import re
        json_match = re.search(r'```json\s*([\s\S]*?)\s*```|(\[[\s\S]*\])', ai_message)
        
        if json_match:
            # 提取匹配到的JSON内容
            json_text = json_match.group(1) or json_match.group(2)
            try:
                mindmap_data = json.loads(json_text)
                
                # 计算统计数据
                def count_nodes(nodes):
                    if not nodes:
                        return 0
                    total = len(nodes)
                    for node in nodes:
                        if 'children' in node and node['children']:
                            total += count_nodes(node['children'])
                    return total
                
                def get_max_depth(nodes, current_depth=0):
                    if not nodes:
                        return current_depth
                    max_depth = current_depth
                    for node in nodes:
                        if 'children' in node and node['children']:
                            depth = get_max_depth(node['children'], current_depth + 1)
                            max_depth = max(max_depth, depth)
                    return max_depth
                
                total_nodes = count_nodes(mindmap_data)
                max_depth = get_max_depth(mindmap_data)
                branches = len(mindmap_data[0].get('children', [])) if mindmap_data and len(mindmap_data) > 0 else 0
                
                return jsonify({
                    "success": True,
                    "mindMap": mindmap_data,
                    "totalNodes": total_nodes,
                    "depth": max_depth,
                    "branches": branches
                })
            except json.JSONDecodeError as e:
                logger.error(f"JSON解析错误: {str(e)}, 原始内容: {json_text}")
                return jsonify({
                    "success": False,
                    "error": f"思维导图数据格式错误: {str(e)}",
                    "rawContent": ai_message
                }), 500
        else:
            logger.error(f"未找到有效的JSON内容: {ai_message}")
            return jsonify({
                "success": False,
                "error": "生成的内容格式不正确，未找到有效的思维导图数据",
                "rawContent": ai_message
            }), 500
    except Exception as e:
        logger.error(f"生成思维导图出错: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"success": False, "error": f"生成思维导图失败: {str(e)}"}), 500

def create_image_description(slide, topic):
    """为幻灯片创建图片描述"""
    title = slide.get('title', '')
    content = slide.get('content', '')
    slide_type = slide.get('type', '').lower()
    
    # 构建基础描述
    image_desc = f"{topic}：{title}" if topic else title
    
    # 添加内容摘要
    if content:
        # 限制长度
        content_summary = content[:100] + ("..." if len(content) > 100 else "")
        image_desc += f"，{content_summary}"
        
    # 添加要点关键词
    keypoints = slide.get('keypoints', slide.get('bullet_points', []))
    if keypoints and len(keypoints) > 0:
        # 最多使用3个要点
        points = []
        for i, point in enumerate(keypoints):
            if i >= 3:
                break
            if isinstance(point, dict):
                points.append(point.get('text', ''))
            else:
                points.append(str(point))
                
        if points:
            points_text = "，".join(points)
            image_desc += f"，要点：{points_text}"
    
    # 根据幻灯片类型添加关键词增强描述
    if slide_type == 'cover':
        image_desc += "，高清封面图，专业PPT"
    elif slide_type == 'conclusion':
        image_desc += "，总结图，专业PPT"
    elif 'compare' in slide.get('layout', '').lower():
        image_desc += "，对比图，专业PPT"
        
    # 增加通用质量描述
    image_desc += "，高质量，教育场景，专业插图"
    
    logger.info(f"创建图片描述: {image_desc}")
    return image_desc

# 添加增强版PPT生成API
@app.route('/api/enhancedPpt/generate', methods=['POST'])
def generate_enhanced_ppt():
    """新的增强型PPT生成API，使用自定义模板和AI生成图片"""
    logger.info("=== 开始使用增强型PPT生成 ===")
    try:
        data = request.json
        if not data:
            return jsonify({"error": "请提供有效的JSON数据"}), 400
            
        # 提取参数
        topic = data.get('topic')
        subject = data.get('subject', '')
        outline = data.get('outline')
        template_name = data.get('template')
        theme = data.get('theme', 'edu')  # 默认使用教育主题
        
        # 检查必要参数
        if not topic and not outline:
            return jsonify({"error": "必须提供主题或大纲"}), 400
        
        # 生成唯一文件名
        timestamp = int(time.time())
        output_filename = f"enhanced_ppt_{timestamp}.pptx"
        output_path = os.path.join(UPLOAD_FOLDER, output_filename)
        
        # 确定模板路径
        template_path = None
        if template_name:
            # 首先在用户自定义模板目录中查找模板
            user_template_path = os.path.join(app.root_path, "ppt_templates", f"{template_name}.pptx")
            if os.path.exists(user_template_path):
                template_path = user_template_path
                logger.info(f"使用自定义模板: {template_path}")
            else:
                # 如果在自定义目录中未找到，则在默认模板目录中查找
                default_template_path = os.path.join(app.root_path, "ppt_engine", "default_templates", f"{template_name}.pptx")
                if os.path.exists(default_template_path):
                    template_path = default_template_path
                    logger.info(f"使用默认模板: {template_path}")
                else:
                    return jsonify({"error": f"模板不存在: {template_name}"}), 404
        
        # 导入PPT引擎
        try:
            from ppt_engine.core import PPTEngineCore
        except ImportError:
            logger.warning("未找到ppt_engine模块，尝试导入本地模块")
            # 本地ppt_engine目录的路径
            engine_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "ppt_engine")
            if os.path.exists(engine_dir):
                sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
                from ppt_engine.core import PPTEngineCore
            else:
                return jsonify({"error": "缺少PPT引擎模块"}), 500
        
        # 初始化PPT引擎
        ppt_engine = PPTEngineCore({
            'output_dir': UPLOAD_FOLDER,
            'use_ai_images': True,  # 启用AI图像生成
            'template_dir': os.path.join(app.root_path, "ppt_templates")  # 指定用户自定义模板目录
        })
        
        # 生成PPT
        try:
            if outline:
                # 使用现有大纲
                logger.info("使用提供的大纲生成PPT")
                output_path = ppt_engine.create_presentation(outline, template_path, theme)
            else:
                # 使用主题自动生成
                logger.info(f"使用主题'{topic}'自动生成PPT")
                output_path = ppt_engine.generate_from_topic(topic, subject, template_path, theme)
                
            if not output_path or not os.path.exists(output_path):
                logger.error("PPT生成失败")
                return jsonify({"error": "PPT生成失败，请检查参数"}), 500
                
            logger.info(f"PPT生成成功: {output_path}")
            
            # 返回文件路径
            return jsonify({
                "success": True, 
                "message": "PPT生成成功",
                "file_path": f"/uploads/{os.path.basename(output_path)}",
                "file_name": os.path.basename(output_path)
            })
            
        except Exception as e:
            logger.error(f"PPT生成过程中发生异常: {str(e)}")
            logger.error(traceback.format_exc())
            return jsonify({"error": f"PPT生成失败: {str(e)}"}), 500
            
    except Exception as e:
        logger.error(f"处理请求过程中发生异常: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

# 如果直接运行此文件，则启动应用
if __name__ == '__main__':
    # 设置日志格式
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler("app.log"),
            logging.StreamHandler()
        ]
    )
    
    # 确保必要的目录存在
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(TEMPLATE_FOLDER, exist_ok=True)
    os.makedirs(IMAGE_CACHE_DIR, exist_ok=True)
    
    # 预处理所有模板
    logger.info("启动前预处理所有PPT模板...")
    try:
        from preprocess_templates import preprocess_all_templates
        preprocess_all_templates()
        logger.info("模板预处理完成")
    except Exception as e:
        logger.error(f"模板预处理失败: {str(e)}")
        logger.error(traceback.format_exc())
        logger.warning("将继续启动应用，但模板功能可能受影响")
    
    # 启动应用
    port = int(os.environ.get('PORT', 5000))
    logger.info(f"启动Web服务，端口: {port}")
    app.run(host='0.0.0.0', port=port, debug=True) 