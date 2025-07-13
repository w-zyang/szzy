import os
import json
from typing import List, Dict, Any, Optional, Tuple
import re
import logging
import math

# 设置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("knowledge_retrieval")

class KnowledgeRetriever:
    def __init__(self, knowledge_base_dir: str = "knowledge_base"):
        """
        初始化知识库检索器
        
        Args:
            knowledge_base_dir: 知识库根目录
        """
        self.base_dir = knowledge_base_dir
        # 确保路径是绝对路径
        if not os.path.isabs(self.base_dir):
            self.base_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), self.base_dir)
        
        # 加载知识库索引
        self.knowledge_index = self._load_knowledge_index()
        logger.info(f"已加载知识库索引，包含{len(self.knowledge_index)}个主题")
    
    def _load_knowledge_index(self) -> Dict[str, Dict[str, Any]]:
        """
        加载知识库索引
        
        Returns:
            知识库索引字典，格式为{主题ID: {文件路径, 主题名称, 摘要}}
        """
        index = {}
        # 遍历知识库目录
        for subject_dir in os.listdir(self.base_dir):
            subject_path = os.path.join(self.base_dir, subject_dir)
            if os.path.isdir(subject_path):
                # 遍历学科目录下的所有JSON文件
                for filename in os.listdir(subject_path):
                    if filename.endswith('.json'):
                        file_path = os.path.join(subject_path, filename)
                        try:
                            with open(file_path, 'r', encoding='utf-8') as f:
                                data = json.load(f)
                                # 为每个主题创建索引
                                topic_id = f"{subject_dir}.{filename.replace('.json', '')}"
                                index[topic_id] = {
                                    "path": file_path,
                                    "topic": data.get("topic", ""),
                                    "subject": subject_dir,
                                    "summary": data.get("content", [])[0]["content"] if data.get("content") else ""
                                }
                        except Exception as e:
                            logger.error(f"加载知识库文件 {file_path} 时出错: {str(e)}")
        return index
    
    def search(self, query: str, subject: Optional[str] = None, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        搜索知识库
        
        Args:
            query: 搜索关键词
            subject: 限定学科范围，如biology, math等
            top_k: 返回结果数量
            
        Returns:
            匹配的知识条目列表
        """
        # 对查询词进行分词处理
        query_tokens = self._tokenize(query)
        
        # 计算每个主题的匹配分数
        scores = []
        for topic_id, topic_info in self.knowledge_index.items():
            # 如果指定了学科，只检索该学科的内容
            if subject and topic_info["subject"] != subject:
                continue
                
            # 计算标题与查询的相关度
            title_score = self._calculate_similarity(query_tokens, self._tokenize(topic_info["topic"]))
            
            # 计算摘要与查询的相关度
            summary_score = self._calculate_similarity(query_tokens, self._tokenize(topic_info["summary"]))
            
            # 综合分数，标题权重高
            total_score = title_score * 1.5 + summary_score
            
            scores.append((topic_id, total_score, topic_info))
        
        # 按分数排序并返回前top_k个结果
        scores.sort(key=lambda x: x[1], reverse=True)
        
        results = []
        for topic_id, score, topic_info in scores[:top_k]:
            # 为匹配的主题加载详细内容
            details = self._load_topic_content(topic_info["path"])
            results.append({
                "id": topic_id,
                "topic": topic_info["topic"],
                "subject": topic_info["subject"],
                "score": score,
                "content": details
            })
        
        return results
    
    def retrieve_by_id(self, topic_id: str) -> Dict[str, Any]:
        """
        通过ID检索特定主题的完整内容
        
        Args:
            topic_id: 主题ID
            
        Returns:
            主题完整内容
        """
        if topic_id in self.knowledge_index:
            topic_info = self.knowledge_index[topic_id]
            content = self._load_topic_content(topic_info["path"])
            return {
                "id": topic_id,
                "topic": topic_info["topic"],
                "subject": topic_info["subject"],
                "content": content
            }
        return {"error": f"未找到ID为{topic_id}的主题"}
    
    def _load_topic_content(self, file_path: str) -> List[Dict[str, Any]]:
        """
        加载特定文件的完整内容
        
        Args:
            file_path: 文件路径
            
        Returns:
            主题内容列表
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return data.get("content", [])
        except Exception as e:
            logger.error(f"加载文件 {file_path} 时出错: {str(e)}")
            return []
    
    def _tokenize(self, text: str) -> List[str]:
        """
        简单的中文分词，用于计算相似度
        
        Args:
            text: 文本字符串
            
        Returns:
            分词结果列表
        """
        # 移除标点和特殊字符
        text = re.sub(r'[^\w\s]', ' ', text)
        # 转为小写并分词
        tokens = []
        
        # 处理中文
        for char in text:
            if '\u4e00' <= char <= '\u9fff':  # 中文字符范围
                tokens.append(char)
            
        # 处理英文和数字
        for word in re.findall(r'\b\w+\b', text.lower()):
            tokens.append(word)
            
        return tokens
    
    def _calculate_similarity(self, query_tokens: List[str], doc_tokens: List[str]) -> float:
        """
        计算查询词与文档的相似度（简化的TF-IDF）
        
        Args:
            query_tokens: 查询词分词结果
            doc_tokens: 文档分词结果
            
        Returns:
            相似度分数
        """
        # 如果任一为空，返回0分
        if not query_tokens or not doc_tokens:
            return 0.0
            
        # 计算共现词数量
        common_tokens = set(query_tokens) & set(doc_tokens)
        if not common_tokens:
            return 0.0
            
        # 计算共现词在文档中的频率
        doc_freq = {}
        for token in doc_tokens:
            doc_freq[token] = doc_freq.get(token, 0) + 1
            
        # 计算加权分数，考虑词频和稀有度
        score = 0.0
        for token in common_tokens:
            # TF: 词在文档中出现的频率
            tf = doc_freq[token] / len(doc_tokens)
            # IDF: 反映词的稀有度，这里简化处理
            idf = 1.0
            score += tf * idf
            
        # 归一化，考虑文档长度
        score = score / math.sqrt(len(doc_tokens))
        return score
    
    def get_relevant_content(self, query: str, subject: Optional[str] = None, max_tokens: int = 2000) -> str:
        """
        获取与查询相关的知识库内容，用于增强提示词
        
        Args:
            query: 搜索关键词
            subject: 限定学科范围
            max_tokens: 最大返回标记数
            
        Returns:
            整合后的相关内容
        """
        results = self.search(query, subject, top_k=3)
        if not results:
            return ""
            
        # 整合结果
        relevant_content = []
        token_count = 0
        
        for result in results:
            # 添加主题标题
            topic_line = f"### {result['topic']}\n"
            relevant_content.append(topic_line)
            token_count += len(self._tokenize(topic_line))
            
            # 添加内容
            for item in result['content']:
                content_text = f"- {item['title']}: {item['content']}\n"
                # 估算标记数
                content_tokens = len(self._tokenize(content_text))
                if token_count + content_tokens <= max_tokens:
                    relevant_content.append(content_text)
                    token_count += content_tokens
                else:
                    # 达到最大标记数限制
                    break
            
            if token_count >= max_tokens:
                break
                
        return "".join(relevant_content)


# 单例实例
_retriever_instance = None

def get_retriever():
    """获取知识检索器的单例实例"""
    global _retriever_instance
    if _retriever_instance is None:
        _retriever_instance = KnowledgeRetriever()
    return _retriever_instance


# 测试函数
if __name__ == "__main__":
    retriever = KnowledgeRetriever()
    print(f"已加载知识库索引: {list(retriever.knowledge_index.keys())}")
    
    # 测试检索
    query = "植物细胞结构"
    results = retriever.search(query)
    print(f"查询'{query}'的结果:")
    for result in results:
        print(f"- {result['topic']} (得分: {result['score']:.4f})")
        
    # 测试获取相关内容
    content = retriever.get_relevant_content("微积分的应用")
    print("\n相关内容预览:")
    print(content[:300] + "...") 