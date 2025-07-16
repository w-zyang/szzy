import os
import requests
import logging
import traceback
import json
import base64
import time
import random
from io import BytesIO
from PIL import Image, ImageEnhance, ImageFilter
from dotenv import load_dotenv
from urllib.parse import quote_plus
from functools import lru_cache
import re # Added missing import for re

# 配置日志
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("ppt_generation.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("image_service")

# 尝试导入jieba，如果不可用则使用简单的分词方法
try:
    import jieba
    import jieba.analyse
    jieba.initialize()
    HAS_JIEBA = True
    logger.info("成功导入jieba分词库")
except ImportError:
    HAS_JIEBA = False
    logger.warning("未找到jieba分词库，将使用简单的分词方法")

# 尝试导入numpy
try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False
    logger.warning("未找到numpy库，部分高级功能可能不可用")

# 添加一些常用的中文停用词
STOPWORDS = set([
    "的", "了", "和", "是", "在", "有", "与", "这", "那", "个", "们", "中", "to", "the", "and", "in", "of", "a", "for",
    "我", "你", "他", "她", "它", "我们", "你们", "他们", "她们", "它们", "自己", "什么", "哪些", "怎么", "怎样", "如何",
    "因为", "所以", "但是", "可是", "然而", "而且", "并且", "或者", "如果", "虽然", "就是", "只是", "还是", "也是", 
    "不是", "没有", "可以", "应该", "需要", "一个", "一种", "一些", "这个", "这些", "那个", "那些", "以及", "或者"
])

# 简单的中文分词函数
def simple_chinese_tokenize(text):
    """简单的中文分词函数，不依赖jieba"""
    if not text:
        return []
    
    # 标点符号和空格
    punctuations = set('''，。！？；：""''（）【】《》、…—·,.!?;:()[]<>"\'/\\''')
    
    # 存储分词结果
    tokens = []
    current_token = ""
    
    for char in text:
        if char in punctuations or char.isspace():
            if current_token:
                tokens.append(current_token)
                current_token = ""
        else:
            # 中文字符单独成词
            if ord(char) > 127:
                if current_token:
                    tokens.append(current_token)
                    current_token = ""
                tokens.append(char)
            else:
                # 英文和数字连续成词
                current_token += char
    
    # 处理最后一个token
    if current_token:
        tokens.append(current_token)
    
    return tokens

# 加载环境变量
load_dotenv()

# 配置
API_KEY = os.environ.get('ALIYUN_API_KEY', 'sk-676f45b6cbd54100ae82656f9ac596d3')
BAIDU_API_KEY = os.environ.get('BAIDU_API_KEY', '')  # 百度API密钥
BAIDU_SECRET_KEY = os.environ.get('BAIDU_SECRET_KEY', '')  # 百度Secret Key
IMAGE_CACHE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'image_cache')
DEFAULT_IMAGES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'default_images')

# 确保缓存目录存在
os.makedirs(IMAGE_CACHE_DIR, exist_ok=True)
os.makedirs(DEFAULT_IMAGES_DIR, exist_ok=True)

# 预定义的默认图片映射
DEFAULT_IMAGES = {
    "cover": "cover.jpg",
    "biology": "biology.jpg",
    "cell": "cell.jpg",
    "plant": "plant_cell.jpg",
    "animal": "animal_cell.jpg",
    "summary": "summary.jpg",
    "conclusion": "conclusion.jpg",
    "default": "default.jpg"
}

# 添加常见的分类主题关键词映射
TOPIC_KEYWORDS = {
    "生物": ["biology", "biological", "生物", "自然", "nature"],
    "植物": ["plant", "botanical", "plants", "flora", "植物"],
    "动物": ["animal", "wildlife", "fauna", "动物"],
    "细胞": ["cell", "cellular", "microscopic", "细胞", "微观"],
    "物理": ["physics", "physical", "物理", "力学"],
    "化学": ["chemistry", "chemical", "化学", "分子"],
    "数学": ["mathematics", "math", "数学", "公式"],
    "历史": ["history", "historical", "历史", "古代"],
    "地理": ["geography", "geographical", "地理", "地图"],
    "艺术": ["art", "artistic", "艺术", "美术"],
    "科技": ["technology", "tech", "科技", "创新"],
    "医学": ["medicine", "medical", "医学", "健康"],
    "教育": ["education", "educational", "教育", "学习"],
    "环境": ["environment", "environmental", "环境", "生态"],
    "经济": ["economy", "economic", "经济", "金融"]
}

class ImageService:
    """图片生成服务"""
    
    def __init__(self):
        """初始化图片服务"""
        self.aliyun_api_key = API_KEY
        self.baidu_api_key = BAIDU_API_KEY
        self.baidu_secret_key = BAIDU_SECRET_KEY
        self.baidu_access_token = None
        self.baidu_token_expire_time = 0
        self.image_cache = {}  # 内存缓存，避免重复请求
        
        # 初始化默认图片库
        self._initialize_default_images()
    
    def generate_image(self, prompt, slide_data=None):
        """
        生成图片

        Args:
            prompt: 图片描述
            slide_data: 幻灯片数据，用于提取更多上下文
            
        Returns:
            图片文件路径或数据URI
        """
        logger.info(f"开始生成图片，提示词: {prompt}")
        
        # 增强提示词
        enhanced_prompt = self._enhance_prompt_from_slide_data(prompt, slide_data)
        logger.info(f"增强后的提示词: {enhanced_prompt}")
        
        # 检查是否有缓存
        cache_key = f"gen_{enhanced_prompt}"
        if cache_key in self.image_cache:
            logger.info(f"使用缓存的图片结果")
            return self.image_cache[cache_key]
        
        # 尝试使用阿里云API生成图片
        try:
            image_path = self._generate_with_aliyun(enhanced_prompt)
            if image_path:
                self.image_cache[cache_key] = image_path
                return image_path
        except Exception as e:
            logger.error(f"阿里云图片生成API请求失败: {str(e)}")
        
        # 尝试使用百度API生成图片
        try:
            image_path = self._generate_with_baidu(enhanced_prompt)
            if image_path:
                self.image_cache[cache_key] = image_path
                return image_path
        except Exception as e:
            logger.error(f"百度图片生成API请求失败: {str(e)}")
        
        # 尝试使用备用方法生成图片
        try:
            image_path = self._generate_with_backup_service(enhanced_prompt)
            if image_path:
                self.image_cache[cache_key] = image_path
                return image_path
        except Exception as e:
            logger.error(f"备用图片生成服务请求失败: {str(e)}")
        
        # 如果生成失败，使用默认图片
        default_image = self._get_default_image_for_prompt(prompt, slide_data)
        logger.info(f"生成失败，使用默认图片: {default_image}")
        self.image_cache[cache_key] = default_image
        return default_image
    
    def _enhance_prompt_from_slide_data(self, prompt, slide_data):
        """
        从幻灯片数据中提取关键信息来增强提示词
        
        Args:
            prompt: 原始提示词
            slide_data: 幻灯片数据
            
        Returns:
            增强后的提示词
        """
        if not slide_data:
            return prompt
            
        # 提取标题和内容
        title = slide_data.get('title', '')
        content = slide_data.get('content', '')
        keypoints = slide_data.get('keypoints', [])
        
        # 构建增强提示词
        enhanced_parts = [prompt]
        
        if title and title not in prompt:
            enhanced_parts.append(title)
            
        # 提取内容中的关键信息
        if content and len(content) > 10:
            # 使用jieba提取关键词
            if HAS_JIEBA:
                try:
                    keywords = jieba.analyse.extract_tags(content, topK=5)
                    if keywords:
                        enhanced_parts.append(" ".join(keywords))
                except:
                    pass
            
        # 添加要点
        if keypoints and len(keypoints) > 0:
            # 只使用前2-3个要点
            short_points = keypoints[:min(3, len(keypoints))]
            enhanced_parts.append(" ".join(short_points))
            
        # 组合提示词，添加图像质量要求
        combined_prompt = " - ".join([p for p in enhanced_parts if p])
        enhanced_prompt = f"{combined_prompt}，高清，专业，适合PPT演示，简洁背景"
        
        return enhanced_prompt
    
    def _get_default_image_for_prompt(self, prompt, slide_data=None):
        """
        根据提示词选择合适的默认图片
        
        Args:
            prompt: 图片提示词
            slide_data: 幻灯片数据
            
        Returns:
            默认图片的文件路径
        """
        # 根据提示词和幻灯片数据确定图片类型
        image_type = "default"
        
        if slide_data:
            # 判断是否是封面页
            if slide_data.get('type', '') == 'cover' or slide_data.get('layout', '') == 'cover':
                image_type = "cover"
            # 判断是否是总结页
            elif slide_data.get('type', '') == 'conclusion' or slide_data.get('layout', '') == 'conclusion':
                image_type = "conclusion"
                
        # 根据提示词查找主题
        lower_prompt = prompt.lower()
        for topic, keywords in TOPIC_KEYWORDS.items():
            for keyword in keywords:
                if keyword in lower_prompt:
                    # 优先使用生物相关图片
                    if topic == "生物":
                        image_type = "biology"
                    elif topic == "动物" or "动物" in lower_prompt:
                        image_type = "animal"
                    elif topic == "植物" or "植物" in lower_prompt:
                        image_type = "plant"
                    elif topic == "细胞" or "细胞" in lower_prompt:
                        image_type = "cell"
                        
        # 获取默认图片路径
        default_image_name = DEFAULT_IMAGES.get(image_type, DEFAULT_IMAGES["default"])
        image_path = os.path.join(DEFAULT_IMAGES_DIR, default_image_name)
        
        # 使用file://前缀
        return f"file://{os.path.abspath(image_path)}"
    
    def _initialize_default_images(self):
        """初始化默认图片库"""
        # 检查默认图片是否存在
        missing_images = []
        for image_name in DEFAULT_IMAGES.values():
            image_path = os.path.join(DEFAULT_IMAGES_DIR, image_name)
            if not os.path.exists(image_path):
                missing_images.append(image_name)
        
        if missing_images:
            logger.warning(f"缺少 {len(missing_images)} 张默认图片: {', '.join(missing_images)}")
        
        logger.info(f"默认图片库初始化完成，共 {len(DEFAULT_IMAGES) - len(missing_images)} 张图片")
    
    def _get_color_for_key(self, key):
        """为关键词生成一致的颜色"""
        if not HAS_NUMPY:
            return (200, 200, 200)
            
        # 使用关键词的哈希值作为随机种子
        hash_value = hash(key) % 1000
        np.random.seed(hash_value)
        
        # 生成明亮的颜色
        hue = np.random.rand() * 360  # 0-360
        saturation = 0.7 + np.random.rand() * 0.3  # 0.7-1.0
        value = 0.8 + np.random.rand() * 0.2  # 0.8-1.0
        
        # HSV转RGB
        h = hue / 60
        i = int(h)
        f = h - i
        p = value * (1 - saturation)
        q = value * (1 - saturation * f)
        t = value * (1 - saturation * (1 - f))
        
        if i == 0:
            r, g, b = value, t, p
        elif i == 1:
            r, g, b = q, value, p
        elif i == 2:
            r, g, b = p, value, t
        elif i == 3:
            r, g, b = p, q, value
        elif i == 4:
            r, g, b = t, p, value
        else:
            r, g, b = value, p, q
            
        return (int(r * 255), int(g * 255), int(b * 255))
    
    def _generate_with_aliyun(self, prompt):
        """
        使用阿里云通义万相API生成图片
        
        Args:
            prompt: 图片描述
            
        Returns:
            图片文件路径
        """
        if not self.aliyun_api_key:
            logger.warning("未配置阿里云API密钥")
            return None
            
        logger.info(f"尝试使用阿里云API生成图片")
            
        # API端点
        api_url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis"
        
        # 请求头
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.aliyun_api_key}"
        }
        
        # 请求参数
        data = {
            "model": "wanx-v1",
            "input": {
                "prompt": f"{prompt}，高清，专业，适合PPT演示，简洁背景"
            },
            "parameters": {
                "style": "photo",
                "size": "1024*1024",
                "n": 1,
                "seed": random.randint(1, 10000)
            }
        }
        
        try:
            # 发送请求
            response = requests.post(api_url, headers=headers, json=data, timeout=30)
            response.raise_for_status()
            
            # 解析响应
            result = response.json()
            
            # 提取图片URL
            if "output" in result and "results" in result["output"]:
                image_url = result["output"]["results"][0].get("url")
                if image_url:
                    # 下载并缓存图片
                    image_path = self._download_and_cache_image(image_url, prompt)
                    logger.info(f"成功生成图片: {image_path}")
                    return image_path
                    
            logger.warning(f"阿里云API返回数据格式不正确: {result}")
            return None
        except Exception as e:
            logger.error(f"阿里云图片生成API请求失败: {str(e)}")
            return None
    
    def _generate_with_backup_service(self, prompt):
        """
        使用备用服务生成图片
        
        Args:
            prompt: 图片描述
            
        Returns:
            图片文件路径
        """
        logger.info(f"尝试使用备用图片生成服务: {prompt}")
        
        # 备用API端点 (这里使用Stable Diffusion API作为示例)
        api_url = "https://api.stability.ai/v1/generation/stable-diffusion-v1-5/text-to-image"
        
        # 请求头 (需要API密钥)
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Api-Key": os.environ.get("STABILITY_API_KEY", "")
        }
        
        # 请求参数
        data = {
            "text_prompts": [
                {
                    "text": f"{prompt}，高质量，适合PPT展示",
                    "weight": 1.0
                }
            ],
            "cfg_scale": 7,
            "height": 768,
            "width": 1024,
            "samples": 1,
            "steps": 30
        }
        
        try:
            # 发送请求
            response = requests.post(api_url, headers=headers, json=data, timeout=60)
            response.raise_for_status()
            
            # 解析响应
            result = response.json()
            
            # 提取图片数据
            if "artifacts" in result and len(result["artifacts"]) > 0:
                # 获取Base64编码的图片数据
                base64_image = result["artifacts"][0]["base64"]
                
                # 解码图片数据
                image_data = base64.b64decode(base64_image)
                
                # 保存到文件
                timestamp = int(time.time())
                image_filename = f"generated_{timestamp}.png"
                image_path = os.path.join(IMAGE_CACHE_DIR, image_filename)
                
                with open(image_path, "wb") as f:
                    f.write(image_data)
                    
                logger.info(f"成功生成图片: {image_path}")
                return f"file://{os.path.abspath(image_path)}"
                
            logger.warning(f"备用API返回数据格式不正确: {result}")
            return None
        except Exception as e:
            logger.error(f"备用图片生成服务请求失败: {str(e)}")
            return None
    
    def _enhance_image(self, image_path):
        """
        增强图片质量
        
        Args:
            image_path: 图片路径
            
        Returns:
            增强后的图片路径
        """
        try:
            # 打开图片
            if image_path.startswith("file://"):
                image_path = image_path[7:]
                
            image = Image.open(image_path)
            
            # 调整大小以确保不超过PPT幻灯片大小(1920x1080)
            max_size = (1920, 1080)
            image.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # 增加锐度
            enhancer = ImageEnhance.Sharpness(image)
            image = enhancer.enhance(1.5)
            
            # 增加对比度
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(1.2)
            
            # 保存增强后的图片
            output_path = f"{os.path.splitext(image_path)[0]}_enhanced{os.path.splitext(image_path)[1]}"
            image.save(output_path, quality=95)
            
            return f"file://{os.path.abspath(output_path)}"
        except Exception as e:
            logger.warning(f"图片增强失败: {str(e)}")
            return image_path
    
    def _get_baidu_access_token(self):
        """获取百度AI平台的访问令牌"""
        # 如果已经有有效的token，直接返回
        if self.baidu_access_token and time.time() < self.baidu_token_expire_time:
            return self.baidu_access_token
            
        # 验证API密钥是否配置
        if not self.baidu_api_key or not self.baidu_secret_key:
            logger.warning("未配置百度API密钥或Secret Key")
            return None
            
        # 请求URL
        token_url = f"https://aip.baidubce.com/oauth/2.0/token"
        
        # 请求参数
        params = {
            'grant_type': 'client_credentials',
            'client_id': self.baidu_api_key,
            'client_secret': self.baidu_secret_key
        }
        
        try:
            response = requests.post(token_url, params=params)
            response.raise_for_status()
            
            result = response.json()
            self.baidu_access_token = result.get('access_token')
            
            # 设置过期时间（提前5分钟）
            if 'expires_in' in result:
                self.baidu_token_expire_time = time.time() + result.get('expires_in') - 300
                
            return self.baidu_access_token
        except Exception as e:
            logger.error(f"获取百度访问令牌失败: {str(e)}")
            return None
    
    def _generate_with_baidu(self, prompt):
        """
        使用百度文心一言API生成图片
        
        Args:
            prompt: 图片描述
            
        Returns:
            图片文件路径
        """
        # 获取访问令牌
        access_token = self._get_baidu_access_token()
        if not access_token:
            logger.warning("未能获取百度访问令牌")
            return None
            
        # API端点
        api_url = f"https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/text2image/sd_xl"
        
        # 构建请求
        headers = {
            'Content-Type': 'application/json'
        }
        
        # 请求参数
        data = {
            'prompt': f"{prompt}，高清，适合PPT演示，专业",
            'negative_prompt': "低质量，模糊，变形",
            'size': '1024x1024',  # 可选 768x768, 1024x1024
            'n': 1,
            'steps': 20,
            'sampler': 'DPM++ 2M Karras',
            'seed': random.randint(1, 10000)
        }
        
        # 添加访问令牌
        params = {
            'access_token': access_token
        }
        
        try:
            # 发送请求
            response = requests.post(api_url, headers=headers, params=params, json=data)
            response.raise_for_status()
            
            # 解析响应
            result = response.json()
            
            # 检查是否有错误
            if 'error_code' in result:
                logger.error(f"百度API错误: {result.get('error_code')}, {result.get('error_msg')}")
                return None
                
            # 提取图片数据
            if 'data' in result and 'img' in result['data']:
                # 获取Base64编码的图片数据
                base64_image = result['data']['img']
                
                # 解码图片数据
                image_data = base64.b64decode(base64_image)
                
                # 保存到文件
                timestamp = int(time.time())
                image_filename = f"baidu_generated_{timestamp}.png"
                image_path = os.path.join(IMAGE_CACHE_DIR, image_filename)
                
                with open(image_path, "wb") as f:
                    f.write(image_data)
                    
                logger.info(f"成功使用百度API生成图片: {image_path}")
                return f"file://{os.path.abspath(image_path)}"
                
            logger.warning(f"百度API返回数据格式不正确: {result}")
            return None
        except Exception as e:
            logger.error(f"百度图片生成API请求失败: {str(e)}")
            return None
    
    def _download_and_cache_image(self, image_url, prompt):
        """
        下载并缓存图片
        
        Args:
            image_url: 图片URL
            prompt: 提示词，用于文件名
            
        Returns:
            本地图片文件路径
        """
        try:
            # 下载图片
            response = requests.get(image_url, timeout=15)
            response.raise_for_status()
            
            # 生成文件名
            timestamp = int(time.time())
            # 使用提示词的前20个字符作为文件名，去除特殊字符
            safe_prompt = re.sub(r'[^a-zA-Z0-9\u4e00-\u9fa5]', '_', prompt)[:20]
            image_filename = f"{safe_prompt}_{timestamp}.jpg"
            image_path = os.path.join(IMAGE_CACHE_DIR, image_filename)
            
            # 保存图片
            with open(image_path, "wb") as f:
                f.write(response.content)
                
            logger.info(f"图片已下载并缓存: {image_path}")
            
            # 增强图片
            enhanced_path = self._enhance_image(image_path)
            
            return f"file://{os.path.abspath(enhanced_path or image_path)}"
        except Exception as e:
            logger.error(f"下载图片失败: {str(e)}")
            return None

def extract_keywords(text, top_k=5):
    """
    从文本中提取关键词
    
    Args:
        text: 输入文本
        top_k: 返回的关键词数量
        
    Returns:
        关键词列表
    """
    if not text:
        return []
        
    # 使用jieba提取关键词
    if HAS_JIEBA:
        try:
            return jieba.analyse.extract_tags(text, topK=top_k)
        except Exception as e:
            logger.warning(f"使用jieba提取关键词失败: {str(e)}")
    
    # 如果jieba失败或不可用，使用简单的词频统计
    words = simple_chinese_tokenize(text)
    word_freq = {}
    
    for word in words:
        if len(word) > 1 and word.lower() not in STOPWORDS:
            word = word.lower()
            if word in word_freq:
                word_freq[word] += 1
            else:
                word_freq[word] = 1
                
    # 按词频排序
    sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
    
    # 返回top_k个关键词
    return [word for word, _ in sorted_words[:top_k]]

def get_image_for_slide(slide_data):
    """
    为幻灯片获取合适的图片
    
    Args:
        slide_data: 幻灯片数据
        
    Returns:
        图片URL或文件路径
    """
    logger.info(f"为幻灯片获取图片: {slide_data.get('title', '')}")
    
    # 初始化图片服务
    image_service = ImageService()
    
    # 从幻灯片数据构建图片描述
    image_prompt = _build_image_prompt(slide_data)
    
    # 生成图片
    image_url = image_service.generate_image(image_prompt, slide_data)
    
    if not image_url:
        # 如果生成失败，使用默认图片
        image_url = _get_default_image_bytes(slide_data)
        logger.info(f"图片生成失败，使用默认图片")
    
    return image_url

def _build_image_prompt(slide_data):
    """
    构建图片生成的提示词
    
    Args:
        slide_data: 幻灯片数据
        
    Returns:
        图片提示词
    """
    # 提取标题和内容
    title = slide_data.get('title', '')
    content = slide_data.get('content', '')
    
    # 构建提示词
    if title and content:
        # 组合标题和内容
        prompt = f"{title} - {content}"
    elif title:
        prompt = title
    elif content:
        prompt = content
    else:
        # 如果没有标题和内容，尝试使用要点
        keypoints = slide_data.get('keypoints', [])
        if keypoints and len(keypoints) > 0:
            prompt = " - ".join(keypoints[:3])  # 最多使用前3个要点
        else:
            # 默认提示词
            prompt = "幻灯片插图"
    
    # 提取关键词
    combined_text = f"{title} {content}"
    keywords = extract_keywords(combined_text, top_k=5)
    
    # 增强提示词
    if keywords:
        prompt = f"{prompt} - {', '.join(keywords)}"
    
    return prompt

def _get_default_image_bytes(slide_data):
    """
    获取默认图片数据
    
    Args:
        slide_data: 幻灯片数据
        
    Returns:
        默认图片的数据URI或文件路径
    """
    # 初始化图片服务
    image_service = ImageService()
    
    # 构建默认图片描述
    image_prompt = _build_image_prompt(slide_data)
    
    # 获取默认图片
    default_image = image_service._get_default_image_for_prompt(image_prompt, slide_data)
    
    return default_image 