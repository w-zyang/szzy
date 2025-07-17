# 语音录制功能实现指南

本文档介绍了基于MediaRecorder API实现的语音录制功能，包括前端组件和后端服务。

## 功能概述

该功能允许用户：
1. 录制语音
2. 预览和播放录音
3. 提交录音到服务器
4. 将语音转换为文本（语音识别）

## 前端组件

### VoiceRecorder 组件 (VoiceRecorder.tsx)

这个核心组件封装了语音录制功能，具有以下特点：

- 使用浏览器原生的MediaRecorder API实现录音
- 支持开始/停止录音
- 显示录音时间
- 支持播放/停止录音预览
- 提供删除和提交功能
- 提供语音文件的基本信息

### 使用方法

```tsx
import VoiceRecorder from './components/VoiceRecorder';

// 在您的组件中使用
const MyComponent = () => {
  const handleSubmit = (audioFile: File) => {
    // 处理提交的音频文件
    console.log('收到音频文件:', audioFile);
  };

  return (
    <VoiceRecorder onSubmit={handleSubmit} buttonSize="large" />
  );
};
```

### 演示页面 (VoiceRecorderDemo.tsx)

提供了一个完整的演示页面，展示如何集成和使用VoiceRecorder组件：

- 展示录音信息（文件名、大小、类型）
- 提供音频预览播放
- 演示上传到服务器的流程
- 包含详细的使用说明

## 后端服务

### 语音服务 (voice_service.py)

这是一个Flask Blueprint，提供以下API端点：

- `/api/voice/upload` - 上传语音文件并进行识别
- `/api/voice/convert` - 对已上传的语音文件进行文本转换

### 语音识别服务 (speech_recognition_service.py)

提供语音识别功能：

- 支持多种音频格式 (wav, mp3, ogg, webm, m4a)
- 获取音频时长信息
- 生成识别结果

> 注意：当前实现为演示用途，返回模拟的识别结果。在实际项目中，您应该集成专业的语音识别API，如百度语音识别、阿里云语音识别、Google Speech-to-Text等。

## 集成到项目

### 前端集成

1. 将`VoiceRecorder.tsx`添加到您的components目录
2. 在需要语音输入的页面引入并使用此组件
3. 处理onSubmit事件以获取录音文件

### 后端集成

1. 将`voice_service.py`和`speech_recognition_service.py`添加到您的后端项目
2. 在主应用中注册Blueprint: `app.register_blueprint(voice_service)`
3. 确保上传目录存在并可写
4. 根据需要定制和扩展语音识别功能

## 应用场景

- PPT大纲语音输入
- 教学内容语音录制
- 音频笔记功能
- 语音评论和反馈
- 语音搜索功能

## 扩展方向

1. 集成专业语音识别API
2. 添加噪音消除功能
3. 支持多语言识别
4. 添加实时转写功能
5. 实现语音命令控制
6. 增加情感分析功能

## 注意事项

1. 使用前需获取用户麦克风权限
2. 支持的浏览器: Chrome, Firefox, Edge, Safari 14+
3. 在移动设备上可能需要额外适配
4. 大文件上传可能需要进度条和断点续传功能
5. 考虑添加音频压缩以减少传输数据量 