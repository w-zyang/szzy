import logging
import traceback

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_jieba")

try:
    logger.info("尝试导入jieba...")
    import jieba
    logger.info(f"jieba成功导入，版本: {jieba.__version__}")
    
    logger.info("尝试导入jieba.analyse...")
    import jieba.analyse
    logger.info("jieba.analyse成功导入")
    
    logger.info("尝试初始化jieba...")
    jieba.initialize()
    logger.info("jieba初始化成功")
    
    # 测试分词功能
    text = "我想测试一下jieba分词库的功能"
    logger.info(f"测试分词: {text}")
    words = jieba.cut(text)
    logger.info(f"分词结果: {' / '.join(words)}")
    
    # 测试关键词提取
    logger.info("测试关键词提取...")
    keywords_textrank = jieba.analyse.textrank(text, topK=5)
    logger.info(f"TextRank关键词: {keywords_textrank}")
    
    keywords_tfidf = jieba.analyse.extract_tags(text, topK=5)
    logger.info(f"TF-IDF关键词: {keywords_tfidf}")
    
    print("jieba测试成功!")
except Exception as e:
    logger.error(f"jieba测试失败: {str(e)}")
    logger.error(traceback.format_exc())
    print(f"错误: {str(e)}") 