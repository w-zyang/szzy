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
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache

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
UNSPLASH_API_KEY = os.environ.get('UNSPLASH_API_KEY', '')
BING_SEARCH_API_KEY = os.environ.get('BING_SEARCH_API_KEY', '')
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
    """图片搜索和生成服务"""
    
    def __init__(self):
        """初始化图片服务"""
        self.unsplash_api_key = UNSPLASH_API_KEY
        self.bing_search_api_key = BING_SEARCH_API_KEY
        self.aliyun_api_key = API_KEY
        self.baidu_api_key = BAIDU_API_KEY
        self.baidu_secret_key = BAIDU_SECRET_KEY
        self.baidu_access_token = None
        self.baidu_token_expire_time = 0
        self.executor = ThreadPoolExecutor(max_workers=5)
        self.image_cache = {}  # 内存缓存，避免重复请求
        
        # 初始化默认图片库
        self._initialize_default_images()
    
    def search_image(self, query, max_results=5):
        """
        搜索与查询相关的图片
        
        Args:
            query: 搜索关键词
            max_results: 最大结果数量
            
        Returns:
            图片URL列表
        """
        logger.info(f"搜索图片: {query}")
        
        # 检查是否有缓存
        cache_key = f"{query}_{max_results}"
        if cache_key in self.image_cache:
            logger.info(f"使用缓存的图片结果")
            return self.image_cache[cache_key]
        
        # 尝试使用不同的图片搜索API
        image_urls = []
        
        # 生成多个查询变体，增加找到相关图片的概率
        query_variants = self._generate_query_variants(query)
        logger.info(f"生成的查询变体: {query_variants}")
        
        # 并行搜索多个来源和查询变体
        futures = []
        
        # 对每个查询变体使用不同的搜索API
        for variant in query_variants:
            # 首先尝试Unsplash API
            if self.unsplash_api_key:
                futures.append(self.executor.submit(self._search_unsplash, variant, max_results))
            
            # 尝试Bing图片搜索
            if self.bing_search_api_key:
                futures.append(self.executor.submit(self._search_bing_images, variant, max_results))
            
            # 尝试使用百度图片搜索
            if self.baidu_api_key:
                futures.append(self.executor.submit(self._search_baidu, variant, max_results))
            
            # 尝试使用免费的Pixabay API
            futures.append(self.executor.submit(self._search_pixabay, variant, max_results))
            
            # 尝试使用Pexels API
            futures.append(self.executor.submit(self._search_pexels, variant, max_results))
            
            # 添加备用搜索方法
            futures.append(self.executor.submit(self._search_google_images, variant, max_results))
            futures.append(self.executor.submit(self._search_flickr, variant, max_results))
        
        # 收集结果
        for future in futures:
            try:
                urls = future.result()
                if urls:  # 确保只添加非空结果
                    image_urls.extend(urls)
                    if len(image_urls) >= max_results * 2:  # 收集更多结果以便后续筛选
                        break
            except Exception as e:
                logger.error(f"图片搜索失败: {str(e)}")
        
        # 去重
        image_urls = list(dict.fromkeys(image_urls))
        
        # 过滤和排序结果
        image_urls = self._filter_and_rank_images(image_urls, query)
        
        # 限制数量
        image_urls = image_urls[:max_results]
        
        logger.info(f"总共找到 {len(image_urls)} 张相关图片")
        
        # 检查结果是否为空，如果为空则使用默认图片
        if not image_urls:
            default_image = self._get_default_image_for_query(query)
            if default_image:
                image_urls = [default_image]
                logger.info(f"未找到相关图片，使用默认图片: {default_image}")
        
        # 缓存结果
        self.image_cache[cache_key] = image_urls
        
        return image_urls
    
    def _generate_query_variants(self, query):
        """
        生成多个查询变体以增加找到相关图片的概率
        
        Args:
            query: 原始查询关键词
            
        Returns:
            查询变体列表
        """
        variants = [query]  # 原始查询
        
        # 提取关键词
        keywords = extract_keywords(query, top_k=5)
        
        # 检测可能的主题分类
        detected_topics = []
        for keyword in keywords:
            for topic, topic_keywords in TOPIC_KEYWORDS.items():
                for tk in topic_keywords:
                    if keyword.lower() in tk.lower() or tk.lower() in keyword.lower():
                        detected_topics.append(topic)
                        break
        
        detected_topics = list(set(detected_topics))  # 去重
        
        # 为每个检测到的主题添加变体
        for topic in detected_topics:
            variants.append(f"{topic} {' '.join(keywords[:3])}")
            variants.append(f"{keywords[0]} {topic}")
        
        # 添加英文变体（对中文查询）
        if any(ord(c) > 127 for c in query):
            # 尝试将中文查询翻译为英文
            try:
                en_query = self._translate_to_english(query)
                if en_query and en_query != query:
                    variants.append(en_query)
                    logger.info(f"添加英文查询变体: {en_query}")
            except Exception as e:
                logger.warning(f"翻译查询失败: {str(e)}")
        
        # 添加更具体的查询
        if len(keywords) >= 2:
            variants.append(f"{keywords[0]} {keywords[1]}")
        
        if len(keywords) >= 3:
            variants.append(f"{keywords[0]} {keywords[1]} {keywords[2]}")
        
        # 添加高质量图片、高分辨率等修饰词
        variants.append(f"{query} high quality")
        variants.append(f"{query} high resolution")
        
        if detected_topics:
            main_topic = detected_topics[0]
            variants.append(f"{main_topic} illustration")
            variants.append(f"{main_topic} diagram")
        
        # 去重
        return list(dict.fromkeys(variants))
    
    def _translate_to_english(self, text):
        """
        将文本翻译为英文（简单实现）
        
        Args:
            text: 要翻译的文本
            
        Returns:
            翻译后的文本
        """
        # 简单的中英文关键词映射
        translations = {
            "细胞": "cell",
            "植物": "plant",
            "动物": "animal",
            "生物": "biology",
            "物理": "physics",
            "化学": "chemistry",
            "数学": "mathematics",
            "历史": "history",
            "地理": "geography",
            "艺术": "art",
            "科技": "technology",
            "医学": "medicine",
            "教育": "education",
            "环境": "environment",
            "经济": "economy",
            "结构": "structure",
            "功能": "function",
            "特点": "characteristics",
            "分类": "classification",
            "过程": "process",
            "系统": "system",
            "机制": "mechanism",
            "原理": "principle",
            "组成": "composition",
            "层次": "hierarchy"
        }
        
        # 词并翻译
        result = []
        if HAS_JIEBA:
            words = jieba.cut(text)
            for word in words:
                if word in translations:
                    result.append(translations[word])
                elif len(word.strip()) > 0:
                    result.append(word)
        else:
            # 如果没有jieba，尝试直接匹配
            for cn, en in translations.items():
                if cn in text:
                    text = text.replace(cn, en)
            result.append(text)
            
        return " ".join(result)
    
    def _filter_and_rank_images(self, image_urls, query):
        """
        过滤和排序图片结果
        
        Args:
            image_urls: 图片URL列表
            query: 原始查询关键词
            
        Returns:
            过滤和排序后的图片URL列表
        """
        # 如果没有足够的图片，直接返回
        if len(image_urls) <= 3:
            return image_urls
            
        # 简单的排序：优先考虑包含关键词的URL
        keywords = extract_keywords(query, top_k=3)
        
        # 创建得分映射
        scores = {}
        for url in image_urls:
            score = 0
            
            # 检查URL是否包含关键词
            for keyword in keywords:
                if keyword.lower() in url.lower():
                    score += 2
            
            # 优先选择来自可靠域名的图片
            reliable_domains = ["unsplash.com", "pixabay.com", "pexels.com", "flickr.com", "bing.com"]
            for domain in reliable_domains:
                if domain in url:
                    score += 1
            
            # 避免可能的低质量或缩略图
            if "thumb" in url.lower() or "small" in url.lower():
                score -= 1
            
            # 避免可能有水印的图片
            if "watermark" in url.lower():
                score -= 2
                
            scores[url] = score
        
        # 根据得分排序
        return sorted(image_urls, key=lambda url: scores.get(url, 0), reverse=True)
    
    def _get_default_image_for_query(self, query):
        """
        根据查询获取最相关的默认图片
        
        Args:
            query: 查询关键词
            
        Returns:
            默认图片的URL或路径
        """
        # 从查询中提取关键词
        keywords = extract_keywords(query.lower(), top_k=5)
        
        # 首先检查是否有直接匹配的默认图片
        for keyword in keywords:
            for key, image_name in DEFAULT_IMAGES.items():
                if keyword in key or key in keyword:
                    image_path = os.path.join(DEFAULT_IMAGES_DIR, image_name)
                    if os.path.exists(image_path):
                        return f"file://{os.path.abspath(image_path)}"
        
        # 如果没有直接匹配，检查是否有主题匹配
        detected_topics = []
        for keyword in keywords:
            for topic, topic_keywords in TOPIC_KEYWORDS.items():
                for tk in topic_keywords:
                    if keyword in tk or tk in keyword:
                        detected_topics.append(topic)
                        break
        
        # 根据检测到的主题选择默认图片
        for topic in detected_topics:
            if topic == "生物" or topic == "细胞":
                return f"file://{os.path.abspath(os.path.join(DEFAULT_IMAGES_DIR, 'biology.jpg'))}"
            elif topic == "植物":
                return f"file://{os.path.abspath(os.path.join(DEFAULT_IMAGES_DIR, 'plant_cell.jpg'))}"
            elif topic == "动物":
                return f"file://{os.path.abspath(os.path.join(DEFAULT_IMAGES_DIR, 'animal_cell.jpg'))}"
        
        # 如果仍然没有匹配，返回默认图片
        return f"file://{os.path.abspath(os.path.join(DEFAULT_IMAGES_DIR, 'default.jpg'))}"

    def generate_image(self, prompt):
        """
        根据提示词生成图片
        
        Args:
            prompt: 图片生成提示词
            
        Returns:
            生成的图片URL或本地路径
        """
        logger.info(f"生成图片: {prompt}")
        
        try:
            # 首先尝试使用阿里云百炼通义万相API生成图片
            image_url = self._generate_with_aliyun(prompt)
            if image_url:
                logger.info(f"成功生成图片: {image_url}")
                return image_url
        except Exception as e:
            logger.error(f"阿里云图片生成失败: {str(e)}")
            logger.error(traceback.format_exc())
        
        # 如果阿里云生成失败，尝试使用备用的图片生成服务
        try:
            image_url = self._generate_with_backup_service(prompt)
            if image_url:
                logger.info(f"使用备用服务成功生成图片: {image_url}")
                return image_url
        except Exception as e:
            logger.error(f"备用图片生成服务失败: {str(e)}")
            logger.error(traceback.format_exc())
        
        # 如果生成失败，尝试搜索相关图片
        try:
            # 从提示词中提取关键词
            keywords = extract_keywords(prompt, top_k=5)
            query = " ".join(keywords)
            
            logger.info(f"图片生成失败，尝试使用关键词搜索图片: {query}")
            image_urls = self.search_image(query, max_results=3)
            
            if image_urls and len(image_urls) > 0:
                # 随机选择一张图片
                selected_url = random.choice(image_urls)
                logger.info(f"通过搜索找到替代图片: {selected_url}")
                return selected_url
        except Exception as e:
            logger.error(f"搜索替代图片失败: {str(e)}")
        
        # 如果所有在线方法都失败，尝试使用本地默认图片
        try:
            default_image = self._get_default_image_for_query(prompt)
            if default_image:
                logger.info(f"使用本地默认图片: {default_image}")
                return default_image
        except Exception as e:
            logger.error(f"获取默认图片失败: {str(e)}")
        
        # 如果所有方法都失败，返回None
        logger.warning("图片生成失败，返回None")
        return None
        
    def _initialize_default_images(self):
        """初始化默认图片库"""
        try:
            # 检查默认图片是否存在，如果不存在则创建示例图片
            for key, filename in DEFAULT_IMAGES.items():
                file_path = os.path.join(DEFAULT_IMAGES_DIR, filename)
                if not os.path.exists(file_path):
                    # 创建一个简单的纯色图片作为默认图片
                    img = Image.new('RGB', (800, 600), color = self._get_color_for_key(key))
                    img.save(file_path)
                    logger.info(f"创建默认图片: {file_path}")
            
            logger.info(f"默认图片库初始化完成，共 {len(DEFAULT_IMAGES)} 张图片")
        except Exception as e:
            logger.error(f"初始化默认图片库失败: {str(e)}")
            
    def _get_color_for_key(self, key):
        """根据关键词获取颜色"""
        color_map = {
            "cover": (53, 152, 219),      # 蓝色
            "biology": (46, 204, 113),    # 绿色
            "cell": (155, 89, 182),       # 紫色
            "plant": (39, 174, 96),       # 深绿色
            "animal": (231, 76, 60),      # 红色
            "summary": (241, 196, 15),    # 黄色
            "conclusion": (230, 126, 34), # 橙色
            "default": (189, 195, 199)    # 灰色
        }
        return color_map.get(key, (189, 195, 199))
        
    def _get_default_image(self, prompt):
        """根据提示词获取默认图片"""
        prompt_lower = prompt.lower()
        
        # 检查是否是封面图片
        if any(keyword in prompt_lower for keyword in ["封面", "cover", "title"]):
            return f"/default_images/{DEFAULT_IMAGES['cover']}"
        
        # 检查是否是生物相关
        if any(keyword in prompt_lower for keyword in ["生物", "biology"]):
            return f"/default_images/{DEFAULT_IMAGES['biology']}"
        
        # 检查是否是细胞相关
        if any(keyword in prompt_lower for keyword in ["细胞", "cell"]):
            # 进一步区分植物细胞和动物细胞
            if any(keyword in prompt_lower for keyword in ["植物", "plant"]):
                return f"/default_images/{DEFAULT_IMAGES['plant']}"
            elif any(keyword in prompt_lower for keyword in ["动物", "animal"]):
                return f"/default_images/{DEFAULT_IMAGES['animal']}"
            return f"/default_images/{DEFAULT_IMAGES['cell']}"
        
        # 检查是否是总结或结论
        if any(keyword in prompt_lower for keyword in ["总结", "summary", "结论", "conclusion"]):
            if "conclusion" in prompt_lower:
                return f"/default_images/{DEFAULT_IMAGES['conclusion']}"
            return f"/default_images/{DEFAULT_IMAGES['summary']}"
        
        # 默认图片
        return f"/default_images/{DEFAULT_IMAGES['default']}"
    
    @lru_cache(maxsize=100)
    def _search_unsplash(self, query, max_results=5):
        """使用Unsplash API搜索图片"""
        if not self.unsplash_api_key:
            return []
            
        url = "https://api.unsplash.com/search/photos"
        params = {
            "query": query,
            "per_page": max_results,
            "client_id": self.unsplash_api_key,
            "orientation": "landscape"  # 优先横向图片，适合PPT
        }
        
        try:
            response = requests.get(url, params=params, timeout=5)
            if response.status_code != 200:
                logger.error(f"Unsplash API请求失败: {response.status_code}")
                return []
                
            data = response.json()
            urls = [photo["urls"]["regular"] for photo in data.get("results", [])]
            logger.info(f"从Unsplash获取了 {len(urls)} 张图片")
            return urls
        except Exception as e:
            logger.error(f"Unsplash搜索失败: {str(e)}")
            return []
    
    @lru_cache(maxsize=100)
    def _search_bing_images(self, query, max_results=5):
        """使用Bing图片搜索API搜索图片"""
        if not self.bing_search_api_key:
            return []
            
        url = "https://api.bing.microsoft.com/v7.0/images/search"
        headers = {"Ocp-Apim-Subscription-Key": self.bing_search_api_key}
        params = {
            "q": query, 
            "count": max_results, 
            "safeSearch": "Moderate",
            "imageType": "Photo",  # 只返回照片
            "aspect": "Wide"  # 宽屏图片，适合PPT
        }
        
        try:
            response = requests.get(url, headers=headers, params=params, timeout=5)
            if response.status_code != 200:
                logger.error(f"Bing API请求失败: {response.status_code}")
                return []
                
            data = response.json()
            urls = [image["contentUrl"] for image in data.get("value", [])]
            logger.info(f"从Bing获取了 {len(urls)} 张图片")
            return urls
        except Exception as e:
            logger.error(f"Bing搜索失败: {str(e)}")
            return []
    
    @lru_cache(maxsize=100)
    def _search_pixabay(self, query, max_results=5):
        """使用Pixabay API搜索免费图片"""
        url = "https://pixabay.com/api/"
        params = {
            "key": os.environ.get('PIXABAY_API_KEY', ''),  # 可选，如果有API密钥
            "q": query,
            "per_page": max_results,
            "image_type": "photo",
            "orientation": "horizontal"  # 横向图片，适合PPT
        }
        
        try:
            # 如果没有API密钥，使用公共访问模式
            if not params["key"]:
                # 使用网页搜索作为后备方案
                return self._search_pixabay_web(query, max_results)
            
            response = requests.get(url, params=params, timeout=5)
            if response.status_code != 200:
                logger.error(f"Pixabay API请求失败: {response.status_code}")
                return []
                
            data = response.json()
            urls = [hit["largeImageURL"] for hit in data.get("hits", [])]
            logger.info(f"从Pixabay获取了 {len(urls)} 张图片")
            return urls
        except Exception as e:
            logger.error(f"Pixabay搜索失败: {str(e)}")
            return []
    
    @lru_cache(maxsize=100)
    def _search_pixabay_web(self, query, max_results=5):
        """使用Pixabay网页搜索图片"""
        try:
            # 这里只是一个示例，实际上不进行网页抓取
            return []
        except Exception as e:
            logger.error(f"Pixabay网页搜索失败: {str(e)}")
            return []
    
    @lru_cache(maxsize=100)
    def _search_pexels(self, query, max_results=5):
        """使用Pexels API搜索免费图片"""
        api_key = os.environ.get('PEXELS_API_KEY', '')
        if not api_key:
            return []
            
        url = f"https://api.pexels.com/v1/search?query={quote_plus(query)}&per_page={max_results}&orientation=landscape"
        headers = {"Authorization": api_key}
        
        try:
            response = requests.get(url, headers=headers, timeout=5)
            if response.status_code != 200:
                logger.error(f"Pexels API请求失败: {response.status_code}")
                return []
                
            data = response.json()
            urls = [photo["src"]["large"] for photo in data.get("photos", [])]
            logger.info(f"从Pexels获取了 {len(urls)} 张图片")
            return urls
        except Exception as e:
            logger.error(f"Pexels搜索失败: {str(e)}")
            return []
    
    def _get_baidu_access_token(self):
        """获取百度API访问令牌"""
        # 检查现有token是否有效
        current_time = time.time()
        if self.baidu_access_token and current_time < self.baidu_token_expire_time:
            return self.baidu_access_token
            
        # 如果没有有效的token，请求新的
        if not self.baidu_api_key:
            logger.error("百度API密钥未设置")
            return None
            
        try:
            # 处理bce-v3格式的密钥
            is_bce_v3 = self.baidu_api_key.startswith('bce-v3/')
            
            if is_bce_v3:
                # bce-v3格式的密钥不需要secret_key
                token_url = f"https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id={self.baidu_api_key}"
            else:
                # 传统格式的密钥需要secret_key
                if not self.baidu_secret_key:
                    logger.error("百度Secret Key未设置")
                    return None
                token_url = f"https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id={self.baidu_api_key}&client_secret={self.baidu_secret_key}"
            
            response = requests.get(token_url, timeout=10)
            if response.status_code != 200:
                logger.error(f"百度访问令牌请求失败: {response.status_code}, {response.text}")
                return None
                
            data = response.json()
            self.baidu_access_token = data.get("access_token")
            # 设置过期时间（提前5分钟过期）
            expires_in = data.get("expires_in", 2592000)  # 默认30天
            self.baidu_token_expire_time = current_time + expires_in - 300
            
            logger.info("成功获取百度API访问令牌")
            return self.baidu_access_token
        except Exception as e:
            logger.error(f"获取百度访问令牌失败: {str(e)}")
            logger.error(traceback.format_exc())
            return None
    
    @lru_cache(maxsize=100)
    def _search_baidu(self, query, max_results=5):
        """使用百度图像搜索API搜索图片"""
        access_token = self._get_baidu_access_token()
        if not access_token:
            return []
            
        try:
            # 百度图像搜索API接口 - 使用百度图像搜索服务
            # 对于bce-v3格式的密钥，我们使用百度智能云搜索服务
            if self.baidu_api_key.startswith('bce-v3/'):
                # 使用百度图片搜索服务
                url = "https://aip.baidubce.com/rest/2.0/image-search/v1/similar_search"
                if access_token:
                    url = f"{url}?access_token={access_token}"
                
                headers = {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
                
                # 使用关键词搜索
                params = {
                    "query": query,
                    "page_num": 0,  # 起始页码
                    "rn": max_results  # 返回数量
                }
                
                # 尝试另一种搜索方式 - 网页图片搜索
                try:
                    # 使用百度网页搜索API获取图片
                    search_url = f"https://image.baidu.com/search/acjson?tn=resultjson_com&word={quote_plus(query)}&pn=0&rn={max_results}"
                    search_headers = {
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
                    }
                    
                    logger.info(f"尝试使用百度网页图片搜索: {search_url}")
                    search_response = requests.get(search_url, headers=search_headers, timeout=10)
                    
                    if search_response.status_code == 200:
                        try:
                            search_data = search_response.json()
                            urls = []
                            for item in search_data.get("data", []):
                                if isinstance(item, dict) and "middleURL" in item:
                                    urls.append(item["middleURL"])
                            
                            if urls:
                                logger.info(f"从百度网页搜索获取了 {len(urls)} 张图片")
                                return urls
                        except Exception as e:
                            logger.error(f"解析百度网页搜索结果失败: {str(e)}")
                except Exception as e:
                    logger.error(f"百度网页图片搜索失败: {str(e)}")
                
                # 如果网页搜索失败，尝试使用API
                logger.info(f"尝试使用百度图像搜索API: {url}")
                response = requests.post(url, headers=headers, data=params, timeout=10)
            else:
                # 传统API密钥方式
                url = f"https://aip.baidubce.com/rest/2.0/image-search/v1/search?access_token={access_token}"
                
                params = {
                    "keyword": query,
                    "rn": max_results,  # 返回数量
                    "pn": 0,  # 起始位置
                    "baike_num": 0  # 不需要百科信息
                }
                
                # 发送POST请求
                logger.info(f"尝试使用传统百度图像搜索API: {url}")
                response = requests.post(url, data=params, timeout=10)
            
            if response.status_code != 200:
                logger.error(f"百度图片搜索请求失败: {response.status_code}, {response.text}")
                return []
                
            data = response.json()
            logger.debug(f"百度API响应: {json.dumps(data, ensure_ascii=False)[:500]}...")
            
            # 从结果中提取图片URL
            urls = []
            for item in data.get("result", []):
                # 优先使用高清图片URL
                image_url = item.get("hq_url") or item.get("url")
                if image_url:
                    urls.append(image_url)
            
            logger.info(f"从百度获取了 {len(urls)} 张图片")
            return urls
        except Exception as e:
            logger.error(f"百度图片搜索失败: {str(e)}")
            logger.error(traceback.format_exc())
            return []

    def _generate_with_aliyun(self, prompt):
        """使用阿里云百炼通义万相API生成图片"""
        url = "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-generation"
        headers = {
            "Authorization": f"Bearer {self.aliyun_api_key}",
            "Content-Type": "application/json"
        }
        
        # 增强提示词，使生成的图片更适合PPT
        enhanced_prompt = f"{prompt}，高清，专业，适合PPT演示，简洁背景"
        
        payload = {
            "model": "wanx-v1",
            "input": {
                "prompt": enhanced_prompt
            },
            "parameters": {
                "style": "photographic",  # 摄影风格
                "n": 1,  # 生成1张图片
                "size": "1024*1024",  # 图片尺寸
                "seed": random.randint(1, 10000)  # 随机种子
            }
        }
        
        try:
            logger.info(f"发送阿里云图片生成请求: {enhanced_prompt}")
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            
            if response.status_code != 200:
                logger.error(f"阿里云图片生成API请求失败: {response.status_code}, {response.text}")
                return None
                
            data = response.json()
            logger.debug(f"阿里云API响应: {json.dumps(data, ensure_ascii=False)[:500]}...")
            
            # 检查API响应格式
            if "output" in data and "results" in data["output"] and len(data["output"]["results"]) > 0:
                image_url = data["output"]["results"][0].get("url")
                if image_url:
                    # 下载并缓存图片
                    try:
                        img_response = requests.get(image_url, timeout=10)
                        if img_response.status_code == 200:
                            # 生成唯一文件名
                            timestamp = int(time.time())
                            filename = f"ai_generated_{timestamp}.jpg"
                            file_path = os.path.join(IMAGE_CACHE_DIR, filename)
                            
                            # 保存原始图片
                            with open(file_path, "wb") as f:
                                f.write(img_response.content)
                            
                            # 优化图片
                            self._enhance_image(file_path)
                                
                            # 返回相对路径
                            return f"/image_cache/{filename}"
                    except Exception as e:
                        logger.error(f"图片下载缓存失败: {str(e)}")
                        # 如果缓存失败，返回原始URL
                        return image_url
                        
                return image_url
            
            logger.error(f"无法从API响应中提取图片URL: {data}")
            return None
        except Exception as e:
            logger.error(f"阿里云图片生成请求失败: {str(e)}")
            logger.error(traceback.format_exc())
            return None
            
    def _generate_with_backup_service(self, prompt):
        """使用备用的图片生成服务"""
        try:
            # 使用公共API服务生成图片
            url = "https://api.deepai.org/api/text2img"
            headers = {
                "api-key": "quickstart-QUdJIGlzIGNvbWluZy4uLi4K"  # 使用公共API密钥
            }
            data = {
                "text": prompt,
                "grid_size": "1"
            }
            
            logger.info(f"尝试使用备用图片生成服务: {prompt}")
            response = requests.post(url, headers=headers, data=data, timeout=30)
            
            if response.status_code != 200:
                logger.error(f"备用图片生成服务请求失败: {response.status_code}, {response.text}")
                return None
                
            data = response.json()
            logger.debug(f"备用服务API响应: {json.dumps(data, ensure_ascii=False)[:500]}...")
            
            if "output_url" in data:
                image_url = data["output_url"]
                
                # 下载并缓存图片
                try:
                    img_response = requests.get(image_url, timeout=10)
                    if img_response.status_code == 200:
                        # 生成唯一文件名
                        timestamp = int(time.time())
                        filename = f"backup_generated_{timestamp}.jpg"
                        file_path = os.path.join(IMAGE_CACHE_DIR, filename)
                        
                        # 保存原始图片
                        with open(file_path, "wb") as f:
                            f.write(img_response.content)
                        
                        # 优化图片
                        self._enhance_image(file_path)
                            
                        # 返回相对路径
                        return f"/image_cache/{filename}"
                except Exception as e:
                    logger.error(f"备用服务图片下载缓存失败: {str(e)}")
                    # 如果缓存失败，返回原始URL
                    return image_url
            
            logger.error(f"无法从备用服务API响应中提取图片URL: {data}")
            return None
        except Exception as e:
            logger.error(f"备用图片生成服务请求失败: {str(e)}")
            logger.error(traceback.format_exc())
            return None
    
    def _enhance_image(self, image_path):
        """增强图片质量，使其更适合PPT展示"""
        try:
            # 打开图片
            img = Image.open(image_path)
            
            # 调整对比度
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.2)  # 增加对比度
            
            # 调整亮度
            enhancer = ImageEnhance.Brightness(img)
            img = enhancer.enhance(1.1)  # 略微增加亮度
            
            # 调整饱和度
            enhancer = ImageEnhance.Color(img)
            img = enhancer.enhance(1.2)  # 增加饱和度
            
            # 轻微锐化
            img = img.filter(ImageFilter.SHARPEN)
            
            # 保存增强后的图片
            img.save(image_path, quality=95)
            logger.info(f"图片增强成功: {image_path}")
        except Exception as e:
            logger.error(f"图片增强失败: {str(e)}")

    @lru_cache(maxsize=100)
    def _search_google_images(self, query, max_results=5):
        """使用Google自定义搜索API搜索图片（免费版每天限制100次查询）"""
        try:
            # 使用免费的搜索引擎API
            search_url = f"https://serpapi.com/search.json?q={quote_plus(query)}&tbm=isch&ijn=0&api_key=demo"
            logger.info(f"尝试使用备用图片搜索API: {search_url}")
            
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            }
            
            response = requests.get(search_url, headers=headers, timeout=10)
            if response.status_code != 200:
                logger.error(f"备用图片搜索API请求失败: {response.status_code}")
                return []
                
            data = response.json()
            
            # 提取图片URL
            urls = []
            if "images_results" in data:
                for item in data["images_results"][:max_results]:
                    if "original" in item:
                        urls.append(item["original"])
                    elif "thumbnail" in item:
                        urls.append(item["thumbnail"])
            
            logger.info(f"从备用搜索API获取了 {len(urls)} 张图片")
            return urls
        except Exception as e:
            logger.error(f"备用图片搜索API失败: {str(e)}")
            return []
            
    @lru_cache(maxsize=100)
    def _search_flickr(self, query, max_results=5):
        """使用Flickr API搜索免费图片"""
        try:
            # 使用Flickr公共API
            api_key = os.environ.get('FLICKR_API_KEY', '9c5a288116c34c40f348f679d9369ee5') # 使用公共API密钥
            
            search_url = f"https://www.flickr.com/services/rest/?method=flickr.photos.search&api_key={api_key}&text={quote_plus(query)}&format=json&nojsoncallback=1&per_page={max_results}&sort=relevance&media=photos&extras=url_m"
            
            logger.info(f"尝试使用Flickr API搜索图片")
            response = requests.get(search_url, timeout=10)
            
            if response.status_code != 200:
                logger.error(f"Flickr API请求失败: {response.status_code}")
                return []
                
            data = response.json()
            
            urls = []
            if "photos" in data and "photo" in data["photos"]:
                for photo in data["photos"]["photo"]:
                    if "url_m" in photo:
                        urls.append(photo["url_m"])
            
            logger.info(f"从Flickr获取了 {len(urls)} 张图片")
            return urls
        except Exception as e:
            logger.error(f"Flickr搜索失败: {str(e)}")
            return []

# 关键词提取函数增强版
def extract_keywords(text, top_k=5):
    """
    从文本中提取关键词
    
    Args:
        text: 输入文本
        top_k: 返回的关键词数量
        
    Returns:
        关键词列表
    """
    if not text or not isinstance(text, str):
        return []
        
    # 使用jieba进行关键词提取
    if HAS_JIEBA:
        try:
            # 使用TextRank算法提取关键词
            keywords_textrank = jieba.analyse.textrank(text, topK=top_k * 2)
            
            # 使用TF-IDF算法提取关键词
            keywords_tfidf = jieba.analyse.extract_tags(text, topK=top_k * 2)
            
            # 合并两种算法的结果
            all_keywords = list(set(keywords_textrank + keywords_tfidf))
            
            # 过滤掉数字和标点符号
            filtered_keywords = [k for k in all_keywords if not k.isdigit() and len(k) > 1]
            
            # 限制关键词数量
            return filtered_keywords[:top_k]
        except Exception as e:
            logger.error(f"使用jieba提取关键词失败: {str(e)}")
    
    # 使用简单的分词和词频统计方法提取关键词
    try:
        # 使用我们的简单分词函数
        tokens = simple_chinese_tokenize(text)
        
        # 过滤停用词和单字词
        filtered_tokens = [
            token.lower() for token in tokens 
            if len(token) > 1 and token.lower() not in STOPWORDS and not token.isdigit()
        ]
        
        # 统计词频
        word_freq = {}
        for token in filtered_tokens:
            word_freq[token] = word_freq.get(token, 0) + 1
        
        # 按词频排序
        sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
        
        # 提取前top_k个关键词
        keywords = [word for word, freq in sorted_words[:top_k]]
        
        logger.info(f"使用简单分词提取关键词: {keywords}")
        return keywords
        
    except Exception as e:
        logger.error(f"使用简单分词提取关键词失败: {str(e)}")
    
    # 如果前面的方法都失败了，使用最简单的方法
    words = text.split()
    filtered_words = [
        word.strip(",.?!;:\"'()[]{}").lower() 
        for word in words 
        if len(word) > 1 and word.strip(",.?!;:\"'()[]{}").lower() not in STOPWORDS
    ]
    
    # 统计词频
    word_freq = {}
    for word in filtered_words:
        word_freq[word] = word_freq.get(word, 0) + 1
    
    # 按词频排序并返回top_k个关键词
    keywords = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
    return [k for k, v in keywords[:top_k]]

def get_image_for_slide(slide_data):
    """
    为幻灯片获取相关图片
    
    Args:
        slide_data: 幻灯片数据
        
    Returns:
        图片二进制数据或None
    """
    try:
        # 如果幻灯片已经有图片URL，下载并返回
        if slide_data.get('image'):
            image_url = slide_data['image']
            if isinstance(image_url, str) and (image_url.startswith('http://') or image_url.startswith('https://')):
                try:
                    response = requests.get(image_url, timeout=10)
                    if response.status_code == 200:
                        return response.content
                except Exception as e:
                    logger.error(f"下载指定图片失败: {str(e)}")
    
        # 构建搜索关键词
        keywords = []
        
        # 添加标题关键词（最重要）
        if slide_data.get('title'):
            title_keywords = extract_keywords(slide_data['title'], top_k=5)
            keywords.extend(title_keywords)
        
        # 添加类型关键词
        if slide_data.get('type'):
            slide_type = slide_data.get('type').lower()
            if slide_type == "cover":
                keywords.append("cover")
            elif slide_type == "summary" or slide_type == "conclusion":
                keywords.append("summary")
        
            # 添加布局关键词
            if slide_data.get('layout'):
                slide_layout = slide_data.get('layout').lower()
                if slide_layout == "image":
                    keywords.append("illustration")
                    keywords.append("diagram")
                    # 如果是图片布局，增加标题相关的图示关键词
                    if slide_data.get('title'):
                        keywords.append(f"{slide_data['title']} diagram")
                        keywords.append(f"{slide_data['title']} illustration")
            
        # 添加内容关键词
        if slide_data.get('content'):
            content_keywords = extract_keywords(slide_data['content'], top_k=5)
            keywords.extend(content_keywords)
        
        # 添加要点关键词
        if slide_data.get('keypoints') and isinstance(slide_data['keypoints'], list):
            all_keypoints_text = " ".join([
                point[0] if isinstance(point, list) and len(point) > 0 
                else str(point) for point in slide_data['keypoints'][:3]
            ])
            keypoint_keywords = extract_keywords(all_keypoints_text, top_k=5)
            keywords.extend(keypoint_keywords)
        
        # 去重
        keywords = list(dict.fromkeys(keywords))
        
        # 如果没有足够的关键词，使用默认图片
        if len(keywords) < 1:
            logger.warning(f"关键词不足，尝试使用默认图片")
            return _get_default_image_bytes(slide_data)
        
        # 构建搜索查询
        query = " ".join(keywords[:7])  # 使用前7个关键词
        logger.info(f"图片搜索查询: {query}")
        
        # 创建ImageService实例（如果尚未创建）
        global image_service
        if 'image_service' not in globals() or image_service is None:
            image_service = ImageService()
        
        # 搜索图片
        image_urls = image_service.search_image(query, max_results=3)
        if image_urls and len(image_urls) > 0:
            # 随机选择一张图片，增加多样性
            selected_url = random.choice(image_urls)
            logger.info(f"找到图片: {selected_url}")
                
            # 下载图片数据
            try:
                response = requests.get(selected_url, timeout=10)
                if response.status_code == 200:
                    return response.content
            except Exception as e:
                logger.error(f"下载图片失败: {str(e)}")
        
        # 如果搜索或下载失败，尝试使用默认图片
        logger.info(f"搜索或下载图片失败，尝试使用默认图片")
        return _get_default_image_bytes(slide_data)
        
    except Exception as e:
        logger.error(f"获取幻灯片图片失败: {str(e)}")
        logger.error(traceback.format_exc())
        # 出错时尝试返回默认图片
        return _get_default_image_bytes(slide_data)

def _get_default_image_bytes(slide_data):
    """获取默认图片的二进制数据"""
    try:
        # 根据幻灯片类型选择默认图片
        slide_type = slide_data.get('type', '').lower()
        slide_layout = slide_data.get('layout', '').lower()
        slide_title = slide_data.get('title', '').lower()
        
        default_image_name = 'default.jpg'
        
        if slide_type == 'cover' or slide_layout == 'cover':
            default_image_name = 'cover.jpg'
        elif slide_type == 'summary' or slide_type == 'conclusion' or slide_layout == 'summary':
            default_image_name = 'summary.jpg'
        elif 'cell' in slide_title:
            if 'plant' in slide_title:
                default_image_name = 'plant_cell.jpg'
            elif 'animal' in slide_title:
                default_image_name = 'animal_cell.jpg'
            else:
                default_image_name = 'cell.jpg'
        elif 'biology' in slide_title:
            default_image_name = 'biology.jpg'
        
        # 构建默认图片路径
        default_image_path = os.path.join(DEFAULT_IMAGES_DIR, default_image_name)
        
        # 读取默认图片
        if os.path.exists(default_image_path):
            with open(default_image_path, 'rb') as f:
                return f.read()
    except Exception as e:
        logger.error(f"获取默认图片失败: {str(e)}")
        
    return None

# 初始化图片服务
image_service = ImageService()

# 测试代码
if __name__ == "__main__":
    # 测试图片搜索
    test_query = "人工智能技术应用"
    urls = image_service.search_image(test_query, max_results=2)
    print(f"搜索结果: {urls}")
    
    # 测试图片生成
    test_prompt = "一张展示人工智能与人类协作的未来场景的图片"
    img_url = image_service.generate_image(test_prompt)
    print(f"生成图片: {img_url}")
    
    # 测试关键词提取
    test_text = "人工智能技术正在各行各业广泛应用，包括医疗、金融、教育和制造业等领域"
    keywords = extract_keywords(test_text)
    print(f"关键词: {keywords}") 