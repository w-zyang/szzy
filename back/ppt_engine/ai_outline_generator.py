import os
import sys
import logging
import json
import requests
import re
from pathlib import Path

# 配置日志
logger = logging.getLogger("ppt_engine.ai_outline_generator")

class AIOutlineGenerator:
    """AI大纲生成器，用于自动生成PPT大纲"""
    
    def __init__(self):
        """初始化AI大纲生成器"""
        self.api_key = os.environ.get('ALIYUN_API_KEY', '')
        self.api_url = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
        
    def generate(self, topic, subject=None, pages=8, style=None):
        """
        生成PPT大纲
        
        Args:
            topic: 主题
            subject: 学科
            pages: 页数
            style: 风格
            
        Returns:
            outline: 大纲数据
        """
        logger.info(f"为主题'{topic}'生成PPT大纲，学科: {subject}, 页数: {pages}")
        
        # 构建提示词
        prompt = self._build_prompt(topic, subject, pages, style)
        
        # 调用AI生成大纲
        outline_text = self._call_ai_service(prompt)
        
        # 解析大纲
        outline = self._parse_outline(outline_text)
        
        logger.info(f"大纲生成完成，共{len(outline)}张幻灯片")
        
        return outline
        
    def _build_prompt(self, topic, subject=None, pages=8, style=None):
        """构建提示词"""
        prompt = f"""请为以下主题创建一个包含{pages}张幻灯片的PPT大纲，并以JSON格式返回：

主题：{topic}
"""

        if subject:
            prompt += f"""
学科领域：{subject}
"""

        prompt += """
请确保大纲遵循以下要求：
1. 包含多种类型的幻灯片（封面、内容、图文、表格、对比等）
2. 内容专业、准确、有深度
3. 结构清晰、层次分明
4. 适合教育教学场景

请生成JSON格式的大纲，返回一个幻灯片对象数组。每个幻灯片对象应包含以下字段：
- title: 幻灯片标题
- type: 幻灯片类型（cover, content, image, table, comparison等）
- layout: 建议的布局（title, bullet_points, image_text, comparison, table等）
- content: 主要内容描述
- bullet_points: 要点列表（数组）

示例格式：
```json
[
  {
    "title": "主题标题",
    "type": "cover",
    "layout": "title",
    "content": "封面描述"
  },
  {
    "title": "内容页标题",
    "type": "content",
    "layout": "bullet_points",
    "content": "内容页描述",
    "bullet_points": ["要点1", "要点2", "要点3"]
  }
]
```

请确保返回有效的JSON数组，不要包含额外的文本或解释。
"""

        return prompt
        
    def _call_ai_service(self, prompt):
        """
        调用AI服务生成大纲
        
        Args:
            prompt: 提示词
            
        Returns:
            response_text: AI响应文本
        """
        if not self.api_key:
            logger.warning("未设置API密钥，使用演示数据")
            return self._get_demo_outline()
            
        try:
            headers = {
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'model': 'qwen-max',
                'parameters': {
                    'max_tokens': 4000,
                    'temperature': 0.7,
                    'top_p': 0.8,
                    'result_format': 'message'
                },
                'input': {
                    'messages': [
                        {"role": "system", "content": "你是一个专业的演示文稿设计专家。"},
                        {"role": "user", "content": prompt}
                    ]
                }
            }
            
            logger.info("调用AI服务生成大纲")
            response = requests.post(self.api_url, json=payload, headers=headers)
            
            if response.status_code != 200:
                logger.error(f"API请求失败: {response.status_code}, {response.text}")
                return self._get_demo_outline()
                
            result = response.json()
            
            # 提取内容
            try:
                content = result['output']['choices'][0]['message']['content']
                return content
            except (KeyError, IndexError):
                logger.error(f"无法从API响应中提取内容: {result}")
                return self._get_demo_outline()
                
        except Exception as e:
            logger.error(f"调用AI服务失败: {str(e)}")
            return self._get_demo_outline()
            
    def _parse_outline(self, outline_text):
        """
        解析大纲文本为结构化数据
        
        Args:
            outline_text: 大纲文本
            
        Returns:
            outline: 结构化大纲数据
        """
        try:
            # 尝试提取JSON
            json_match = re.search(r'```json\s*([\s\S]*?)\s*```|(\[[\s\S]*\])', outline_text)
            
            if json_match:
                # 提取匹配到的JSON内容
                json_text = json_match.group(1) or json_match.group(2)
                # 解析JSON
                outline = json.loads(json_text)
                return outline
            else:
                logger.warning("未找到JSON格式的大纲，尝试解析文本")
                return self._parse_text_outline(outline_text)
                
        except Exception as e:
            logger.error(f"解析大纲失败: {str(e)}")
            return self._get_fallback_outline()
            
    def _parse_text_outline(self, text):
        """
        解析文本格式的大纲
        
        Args:
            text: 大纲文本
            
        Returns:
            outline: 结构化大纲数据
        """
        outline = []
        current_slide = None
        
        # 简单的按行解析
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # 检查是否是新的幻灯片
            if line.startswith('# ') or line.startswith('## ') or re.match(r'^\d+\.\s+', line):
                # 保存之前的幻灯片（如果有）
                if current_slide and current_slide.get('title'):
                    outline.append(current_slide)
                    
                # 提取标题
                title = re.sub(r'^#+\s+|\d+\.\s+', '', line)
                
                # 创建新的幻灯片
                current_slide = {
                    "title": title,
                    "type": "content",
                    "layout": "bullet_points",
                    "content": "",
                    "bullet_points": []
                }
                
                # 检查是否是封面
                if len(outline) == 0:
                    current_slide["type"] = "cover"
                    current_slide["layout"] = "title"
            elif line.startswith('- ') or line.startswith('* ') or re.match(r'^\d+\)\s+', line):
                # 要点
                if current_slide:
                    bullet = re.sub(r'^[-*]\s+|\d+\)\s+', '', line)
                    current_slide["bullet_points"].append(bullet)
            else:
                # 内容
                if current_slide:
                    if current_slide["content"]:
                        current_slide["content"] += " " + line
                    else:
                        current_slide["content"] = line
                        
        # 添加最后一个幻灯片
        if current_slide and current_slide.get('title'):
            outline.append(current_slide)
            
        return outline
        
    def _get_demo_outline(self):
        """获取演示大纲数据"""
        return """```json
[
  {
    "title": "植物细胞的奥秘",
    "type": "cover",
    "layout": "title",
    "content": "探索植物生命的基本单位"
  },
  {
    "title": "什么是植物细胞？",
    "type": "content",
    "layout": "bullet_points",
    "content": "植物细胞是构成植物体的基本单位，具有特殊的结构和功能。",
    "bullet_points": [
      "是植物体的基本构成单位",
      "具有独特的结构特征",
      "是植物生命活动的场所"
    ]
  },
  {
    "title": "植物细胞的整体结构",
    "type": "image",
    "layout": "image_text",
    "content": "植物细胞由多种结构组成，每种结构都有特定功能。",
    "bullet_points": [
      "细胞壁 - 最外层保护结构",
      "细胞膜 - 物质交换的选择屏障",
      "细胞质 - 包含多种细胞器",
      "细胞核 - 遗传物质的存储中心",
      "液泡 - 储存物质的场所"
    ]
  },
  {
    "title": "植物细胞的独特结构",
    "type": "comparison",
    "layout": "comparison",
    "content": "植物细胞与动物细胞的主要区别",
    "columns": ["植物细胞", "动物细胞"],
    "rows": [
      {"name": "细胞壁", "values": ["存在", "不存在"]},
      {"name": "叶绿体", "values": ["存在", "不存在"]},
      {"name": "中央液泡", "values": ["大型单一", "小型多个"]},
      {"name": "形状", "values": ["规则", "不规则"]}
    ]
  },
  {
    "title": "细胞壁的结构与功能",
    "type": "content",
    "layout": "bullet_points",
    "content": "细胞壁是植物细胞特有的结构，为植物提供支持和保护。",
    "bullet_points": [
      "主要成分：纤维素、半纤维素和果胶",
      "提供机械支持和保护",
      "赋予植物细胞刚性和形状",
      "具有选择性通透性",
      "参与植物防御机制"
    ]
  },
  {
    "title": "叶绿体与线粒体比较",
    "type": "comparison",
    "layout": "comparison",
    "content": "这两种细胞器都与能量转换有关，但功能不同。",
    "columns": ["特征", "叶绿体", "线粒体"],
    "rows": [
      {"name": "主要功能", "values": ["光合作用", "细胞呼吸"]},
      {"name": "能量转换", "values": ["光能→化学能", "化学能→ATP"]},
      {"name": "存在位置", "values": ["仅植物绿色组织", "所有有氧生物"]},
      {"name": "特有结构", "values": ["类囊体", "嵴"]},
      {"name": "含有的DNA", "values": ["环状DNA", "环状DNA"]}
    ]
  },
  {
    "title": "植物细胞的生命活动",
    "type": "content",
    "layout": "bullet_points",
    "content": "植物细胞中进行着多种生命活动，支持植物的生长、发育和繁殖。",
    "bullet_points": [
      "光合作用 - 将光能转化为化学能",
      "细胞呼吸 - 分解有机物释放能量",
      "物质运输 - 通过主动和被动方式",
      "细胞分裂 - 植物生长和繁殖的基础",
      "细胞分化 - 形成不同功能的组织"
    ]
  },
  {
    "title": "植物细胞的研究意义",
    "type": "content",
    "layout": "bullet_points",
    "content": "研究植物细胞对科学和人类社会有重要意义。",
    "bullet_points": [
      "理解植物生命活动的基础",
      "农业生产的理论基础",
      "生物技术应用的关键",
      "新能源开发的潜在途径",
      "环境保护和生态平衡的科学依据"
    ]
  }
]```"""
        
    def _get_fallback_outline(self):
        """获取备用大纲数据"""
        return [
            {
                "title": "主题概述",
                "type": "cover",
                "layout": "title",
                "content": "内容概述"
            },
            {
                "title": "主要内容",
                "type": "content",
                "layout": "bullet_points",
                "content": "主要内容描述",
                "bullet_points": ["要点1", "要点2", "要点3"]
            },
            {
                "title": "详细说明",
                "type": "content",
                "layout": "bullet_points",
                "content": "详细内容描述",
                "bullet_points": ["说明1", "说明2", "说明3"]
            },
            {
                "title": "总结",
                "type": "content",
                "layout": "bullet_points",
                "content": "总结内容",
                "bullet_points": ["总结1", "总结2", "总结3"]
            }
        ] 