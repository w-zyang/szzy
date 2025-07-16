import os
import sys
import logging
import json
import random
import requests
import re
from pathlib import Path
import datetime

# 配置日志
logger = logging.getLogger("ppt_engine.content_generator")

class ContentGenerator:
    """内容生成器，负责填充和增强PPT内容"""
    
    def __init__(self, config=None):
        """
        初始化内容生成器
        
        Args:
            config: 配置参数字典
        """
        self.config = config or {}
        self.base_path = Path(os.path.dirname(os.path.abspath(__file__)))
        
        # 设置AI图片生成API配置
        self.image_api_key = os.environ.get("AI_IMAGE_API_KEY", "")
        self.image_api_url = os.environ.get("AI_IMAGE_API_URL", "")
        
        # 如果环境变量中没有配置，尝试从配置文件加载
        if not self.image_api_key or not self.image_api_url:
            try:
                config_path = os.path.join(self.base_path.parent, "config.json")
                if os.path.exists(config_path):
                    with open(config_path, 'r', encoding='utf-8') as f:
                        config_data = json.load(f)
                        self.image_api_key = config_data.get("AI_IMAGE_API_KEY", "")
                        self.image_api_url = config_data.get("AI_IMAGE_API_URL", "")
            except Exception as e:
                logger.warning(f"加载配置文件失败: {str(e)}")
        
        # 创建图片缓存目录
        self.image_cache_dir = os.path.join(self.base_path.parent, "image_cache")
        os.makedirs(self.image_cache_dir, exist_ok=True)
        
    def enhance_content(self, content_data):
        """
        增强PPT内容
        
        Args:
            content_data: 原始内容数据
            
        Returns:
            enhanced_content: 增强后的内容
        """
        logger.info("开始增强PPT内容")
        
        if not content_data:
            logger.warning("没有提供内容数据，无法增强")
            return content_data
            
        enhanced_content = []
        
        for i, slide in enumerate(content_data):
            # 确保slide是字典格式
            if not isinstance(slide, dict):
                logger.warning(f"第{i+1}页内容格式不正确，跳过增强")
                enhanced_content.append(slide)
                continue
                
            # 复制原始数据，避免修改原始数据
            enhanced_slide = slide.copy()
            
            try:
                # 1. 标题增强
                if 'title' in enhanced_slide:
                    enhanced_slide['title'] = self._enhance_title(enhanced_slide['title'])
                
                # 2. 内容增强
                if 'content' in enhanced_slide:
                    enhanced_slide['content'] = self._enhance_content_text(enhanced_slide['content'])
                
                # 3. 图片增强 - 如果需要图片但没有提供URL，则生成图片
                if 'image' in enhanced_slide and isinstance(enhanced_slide['image'], str):
                    # 如果是图片描述而非URL，则生成图片
                    if not enhanced_slide['image'].startswith(('http', '/')):
                        # 构建图片生成提示词
                        prompt = self._create_image_prompt(enhanced_slide)
                        # 生成图片
                        image_path = self._generate_ai_image(prompt)
                        if image_path:
                            enhanced_slide['image'] = image_path
                
                # 4. 其他属性处理
                # 添加适当的转场效果
                if i == 0:
                    # 第一页使用淡入效果
                    enhanced_slide['transition'] = enhanced_slide.get('transition', 'fade')
                elif i == len(content_data) - 1:
                    # 最后一页使用总结性效果
                    enhanced_slide['transition'] = enhanced_slide.get('transition', 'zoom')
                else:
                    # 中间页面使用随机效果
                    transitions = ['push', 'fade', 'wipe', 'split', 'reveal']
                    enhanced_slide['transition'] = enhanced_slide.get('transition', random.choice(transitions))
                
            except Exception as e:
                logger.error(f"增强第{i+1}页时发生错误: {str(e)}")
                # 保留原始数据
                enhanced_content.append(slide)
                continue
                
            enhanced_content.append(enhanced_slide)
            
        logger.info(f"内容增强完成，共处理 {len(enhanced_content)} 张幻灯片")
        return enhanced_content
        
    def fill_template(self, template_data, content_data):
        """
        将内容填充到模板中
        
        Args:
            template_data: 模板数据
            content_data: 内容数据
            
        Returns:
            filled_slides: 填充后的幻灯片数据
        """
        logger.info(f"开始填充模板，内容包含 {len(content_data)} 页")
        
        if not template_data or not content_data:
            logger.warning("模板或内容数据为空，无法填充")
            return []
            
        filled_slides = []
        
        # 获取可用的布局
        layouts = template_data.get('layouts', [])
        if not layouts:
            logger.warning("模板未定义布局，无法填充内容")
            return []
            
        # 为每个内容项选择合适的布局并填充
        for i, slide_content in enumerate(content_data):
            # 确保slide_content是字典格式
            if not isinstance(slide_content, dict):
                logger.warning(f"第{i+1}页内容格式不正确，跳过填充")
                continue
                
            try:
                # 根据内容类型选择合适的布局
                layout = self._select_layout_for_content(layouts, slide_content, i, len(content_data))
                
                # 填充布局
                filled_slide = self._fill_layout(layout, slide_content)
                
                filled_slides.append(filled_slide)
                
            except Exception as e:
                logger.error(f"填充第{i+1}页时发生错误: {str(e)}")
                import traceback
                logger.error(traceback.format_exc())
                continue
                
        logger.info(f"模板填充完成，生成了 {len(filled_slides)} 张幻灯片")
        return filled_slides
        
    def _enhance_title(self, title):
        """增强标题文本"""
        # 简单的增强，未来可以接入更复杂的AI增强
        if not title:
            return title
            
        # 移除多余空格
        title = re.sub(r'\s+', ' ', title).strip()
        
        # 标题首字母大写
        if title and len(title) > 0:
            title = title[0].upper() + title[1:]
            
        return title
        
    def _enhance_content_text(self, content):
        """增强内容文本"""
        if not content:
            return content
            
        # 如果是字符串，进行基本处理
        if isinstance(content, str):
            # 移除多余空格
            content = re.sub(r'\s+', ' ', content).strip()
            return content
            
        # 如果是列表，递归处理每个项目
        elif isinstance(content, list):
            return [self._enhance_content_text(item) for item in content]
            
        return content
        
    def _create_image_prompt(self, slide):
        """
        根据幻灯片内容创建图片生成提示词
        
        Args:
            slide: 幻灯片数据
            
        Returns:
            prompt: 图片生成提示词
        """
        title = slide.get('title', '')
        content = slide.get('content', '')
        image_desc = slide.get('image', '')
        
        # 如果已经提供了图片描述，直接使用
        if image_desc and not image_desc.startswith(('http', '/')):
            base_prompt = image_desc
        else:
            # 从标题和内容中提取关键信息创建提示词
            base_prompt = title
            
            # 从内容中提取补充信息
            if isinstance(content, str) and content:
                content_summary = content[:200]  # 限制长度
                base_prompt += f", {content_summary}"
            elif isinstance(content, list) and content:
                content_summary = ", ".join(content[:3])  # 仅使用前3个点
                base_prompt += f", {content_summary}"
        
        # 添加图片质量和样式修饰词
        style_prompts = [
            "高质量", "高分辨率", "专业", "清晰", "适合PPT使用",
            "简洁背景", "干净构图", "教育风格", "无文字", "插图风格"
        ]
        
        # 随机选择2-3个样式修饰词添加
        selected_styles = random.sample(style_prompts, k=min(3, len(style_prompts)))
        
        # 组合最终提示词
        final_prompt = f"{base_prompt}, {', '.join(selected_styles)}"
        
        logger.info(f"生成的图片提示词: {final_prompt}")
        return final_prompt
        
    def _generate_ai_image(self, prompt):
        """
        使用AI生成图片
        
        Args:
            prompt: 图片生成提示词
            
        Returns:
            image_path: 生成的图片路径
        """
        logger.info(f"开始AI生成图片: {prompt}")
        
        try:
            # 尝试使用已配置的AI图片生成API
            if self.image_api_key and self.image_api_url:
                # 调用API生成图片
                image_path = self._call_ai_image_api(prompt)
                if image_path:
                    return image_path
                    
            # 如果没有API配置或API调用失败，尝试使用备用服务
            image_path = self._generate_with_backup_service(prompt)
            if image_path:
                return image_path
                
            # 如果所有方法都失败，返回默认图片
            return self._get_default_image()
            
        except Exception as e:
            logger.error(f"AI图片生成失败: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return self._get_default_image()
            
    def _call_ai_image_api(self, prompt):
        """调用配置的AI图片生成API"""
        if not self.image_api_key or not self.image_api_url:
            logger.warning("未配置AI图片生成API")
            return None
            
        try:
            headers = {
                "Authorization": f"Bearer {self.image_api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "prompt": prompt,
                "n": 1,
                "size": "1024x1024"
            }
            
            logger.info(f"调用AI图片生成API: {self.image_api_url}")
            response = requests.post(self.image_api_url, headers=headers, json=payload, timeout=30)
            
            if response.status_code != 200:
                logger.error(f"API请求失败: {response.status_code}, {response.text}")
                return None
                
            data = response.json()
            
            # 解析响应获取图片URL（具体结构取决于API）
            image_url = self._extract_image_url_from_response(data)
            
            if image_url:
                # 下载并缓存图片
                return self._download_and_cache_image(image_url)
                
            return None
        except Exception as e:
            logger.error(f"调用AI图片API异常: {str(e)}")
            return None
            
    def _extract_image_url_from_response(self, response_data):
        """从API响应中提取图片URL（具体实现取决于使用的API）"""
        try:
            # 这里需要根据实际使用的API调整解析逻辑
            # 示例: DALL-E风格的响应
            if "data" in response_data and len(response_data["data"]) > 0:
                return response_data["data"][0].get("url")
                
            # 示例: 通用格式
            if "url" in response_data:
                return response_data["url"]
                
            # 示例: 嵌套结构
            if "output" in response_data and "images" in response_data["output"]:
                return response_data["output"]["images"][0]
                
            logger.warning(f"无法从响应中提取图片URL: {json.dumps(response_data, ensure_ascii=False)[:200]}...")
            return None
        except Exception as e:
            logger.error(f"提取图片URL异常: {str(e)}")
            return None
            
    def _generate_with_backup_service(self, prompt):
        """使用备用的图片生成服务"""
        try:
            # 这里实现备用的图片生成逻辑
            # 例如调用其他开源模型或公开API
            logger.info("使用备用图片生成服务")
            
            # 这只是一个示例实现，实际项目中应替换为真实的服务调用
            # 模拟生成一个随机默认图片
            return self._get_default_image()
        except Exception as e:
            logger.error(f"备用图片生成失败: {str(e)}")
            return None
            
    def _download_and_cache_image(self, image_url):
        """
        下载并缓存图片
        
        Args:
            image_url: 图片URL
            
        Returns:
            local_path: 本地缓存路径
        """
        try:
            logger.info(f"下载图片: {image_url}")
            response = requests.get(image_url, timeout=10)
            if response.status_code != 200:
                logger.error(f"下载图片失败: {response.status_code}")
                return None
                
            # 生成唯一文件名
            timestamp = int(datetime.datetime.now().timestamp())
            filename = f"ai_generated_{timestamp}.jpg"
            file_path = os.path.join(self.image_cache_dir, filename)
            
            # 保存图片
            with open(file_path, 'wb') as f:
                f.write(response.content)
                
            logger.info(f"图片已保存: {file_path}")
            
            # 返回相对路径
            return f"/image_cache/{filename}"
        except Exception as e:
            logger.error(f"下载缓存图片失败: {str(e)}")
            return None
            
    def _get_default_image(self):
        """获取默认图片路径"""
        # 默认图片目录
        default_images_dir = os.path.join(self.base_path.parent, "default_images")
        
        if os.path.exists(default_images_dir):
            # 获取目录中所有jpg和png文件
            images = [f for f in os.listdir(default_images_dir) 
                     if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
            
            if images:
                # 随机选择一张图片
                selected_image = random.choice(images)
                return f"/default_images/{selected_image}"
        
        # 如果没有默认图片，返回固定的默认图片路径
        return "/default_images/default.jpg"
        
    def _select_layout_for_content(self, layouts, content, index, total_slides):
        """
        为内容选择合适的布局
        
        Args:
            layouts: 可用布局列表
            content: 幻灯片内容
            index: 幻灯片索引
            total_slides: 幻灯片总数
            
        Returns:
            selected_layout: 选择的布局
        """
        # 根据幻灯片位置和内容特点选择布局
        
        # 处理首页
        if index == 0:
            # 寻找标题页布局
            title_layouts = [l for l in layouts if 'title' in l.get('suitable_for', [])]
            if title_layouts:
                return random.choice(title_layouts)
        
        # 处理尾页
        if index == total_slides - 1:
            # 寻找结束页布局
            ending_layouts = [l for l in layouts if 'conclusion' in l.get('suitable_for', [])]
            if ending_layouts:
                return random.choice(ending_layouts)
        
        # 根据内容类型选择布局
        has_image = 'image' in content and content['image']
        has_table = 'table' in content and content['table']
        has_chart = 'chart' in content and content['chart']
        has_list = isinstance(content.get('content', ''), list)
        
        if has_table:
            table_layouts = [l for l in layouts if 'table' in l.get('suitable_for', [])]
            if table_layouts:
                return random.choice(table_layouts)
        
        if has_chart:
            chart_layouts = [l for l in layouts if 'chart' in l.get('suitable_for', [])]
            if chart_layouts:
                return random.choice(chart_layouts)
        
        if has_image:
            image_layouts = [l for l in layouts if 'image' in l.get('suitable_for', [])]
            if image_layouts:
                return random.choice(image_layouts)
        
        if has_list:
            list_layouts = [l for l in layouts if 'list' in l.get('suitable_for', [])]
            if list_layouts:
                return random.choice(list_layouts)
        
        # 默认使用内容布局
        content_layouts = [l for l in layouts if 'content' in l.get('suitable_for', [])]
        if content_layouts:
            return random.choice(content_layouts)
            
        # 如果没有匹配的布局，返回第一个布局
        return layouts[0]
        
    def _fill_layout(self, layout, content):
        """
        将内容填充到布局中
        
        Args:
            layout: 布局数据
            content: 内容数据
            
        Returns:
            filled_slide: 填充后的幻灯片数据
        """
        # 复制布局模板，避免修改原始数据
        filled_slide = layout.copy()
        
        # 填充内容字段
        for field in ['title', 'subtitle', 'content', 'image', 'footer', 'date']:
            if field in content and field in filled_slide:
                filled_slide[field] = content[field]
        
        # 处理特殊内容类型
        if 'table' in content and content['table']:
            filled_slide['table'] = content['table']
        
        if 'chart' in content and content['chart']:
            filled_slide['chart'] = content['chart']
            
        # 添加额外的元数据
        filled_slide['content_type'] = content.get('type', 'content')
        
        return filled_slide 