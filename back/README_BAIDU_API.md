# 百度图片搜索API集成指南

本文档将指导您如何在PPT生成系统中设置和使用百度图片搜索API。

## 1. 申请百度AI开放平台账号

1. 访问[百度AI开放平台](https://ai.baidu.com/)
2. 注册/登录账号
3. 创建应用，获取API Key和Secret Key
4. 开通图像搜索服务

## 2. 配置环境变量

在项目的`.env`文件中添加以下配置:

```
# 百度图片搜索API配置
BAIDU_API_KEY=your_baidu_api_key_here
BAIDU_SECRET_KEY=your_baidu_secret_key_here
```

## 3. 测试百度API

您可以使用提供的测试脚本验证百度API是否工作正常:

```bash
python baidu_api_test.py "测试关键词"
```

如果配置正确，您将看到一些与"测试关键词"相关的图片URL。

## 4. 功能说明

添加百度图片搜索API后，系统将尝试从以下来源获取图片(按优先级排序):

1. Unsplash API (如果配置了)
2. Bing图片搜索 (如果配置了)
3. 百度图片搜索 (如果配置了) - 新增
4. Pixabay API
5. Pexels API

系统会并行查询这些来源，优先使用最先返回结果的API。这提高了图片获取的成功率和多样性。

## 5. 故障排除

如果遇到问题，请检查:

1. API密钥是否正确配置
2. 网络连接是否正常
3. 查看日志文件`ppt_generation.log`中的详细错误信息

## 6. 注意事项

- 百度API有调用频率限制，请合理使用
- 图片使用需遵守百度AI开放平台的服务条款
- 确保添加了必要的依赖库：`pip install baidu-aip retry`

## 7. 相关文件

- `image_service.py`: 包含图片搜索和生成功能
- `baidu_api_test.py`: 百度API测试脚本
- `requirements.txt`: 项目依赖清单，已更新 