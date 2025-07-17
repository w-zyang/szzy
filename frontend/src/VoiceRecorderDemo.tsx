import React, { useState } from 'react';
import { Card, Typography, Divider, message, Button, Alert, Space } from 'antd';
import VoiceRecorder from './components/VoiceRecorder';

const { Title, Paragraph } = Typography;

const VoiceRecorderDemo: React.FC = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  // 处理录音提交
  const handleSubmit = (file: File) => {
    setAudioFile(file);
    // 创建一个预览URL
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    
    // 演示目的，模拟提交到服务器
    message.success('录音已保存，可以进行提交');
  };

  // 模拟提交到服务器
  const handleUpload = async () => {
    if (!audioFile) {
      message.warning('请先录制语音');
      return;
    }

    setUploadStatus('uploading');
    
    // 模拟上传延迟
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    try {
      // 这里是模拟上传，实际项目中应该使用fetch或axios发送到服务器
      // const formData = new FormData();
      // formData.append('audio', audioFile);
      // const response = await fetch('/api/upload-audio', {
      //   method: 'POST',
      //   body: formData
      // });
      
      // 模拟上传成功
      setUploadStatus('success');
      message.success('语音上传成功！');
    } catch (error) {
      setUploadStatus('error');
      message.error('语音上传失败，请重试');
    }
  };

  // 重置状态
  const handleReset = () => {
    setAudioFile(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setUploadStatus('idle');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Card>
        <Title level={2}>语音录制演示</Title>
        <Paragraph>
          这个组件演示了如何使用浏览器的MediaRecorder API实现语音录制、预览和提交功能。
          点击录音按钮开始录音，完成后可以预览并提交。
        </Paragraph>
        
        <Divider />
        
        <Title level={4}>录音区域</Title>
        <Card style={{ background: '#f7f7f7', marginBottom: '20px' }}>
          <VoiceRecorder onSubmit={handleSubmit} buttonSize="large" />
        </Card>
        
        {audioFile && (
          <>
            <Title level={4}>录音信息</Title>
            <Card style={{ marginBottom: '20px' }}>
              <p><strong>文件名：</strong> {audioFile.name}</p>
              <p><strong>文件大小：</strong> {(audioFile.size / 1024).toFixed(2)} KB</p>
              <p><strong>文件类型：</strong> {audioFile.type}</p>
              {audioUrl && (
                <>
                  <Divider />
                  <p><strong>预览：</strong></p>
                  <audio controls src={audioUrl} style={{ width: '100%' }} />
                </>
              )}
            </Card>
            
            <Space style={{ marginTop: '20px' }}>
              <Button 
                type="primary" 
                onClick={handleUpload} 
                loading={uploadStatus === 'uploading'}
                disabled={uploadStatus === 'success'}
              >
                {uploadStatus === 'uploading' ? '上传中...' : 
                 uploadStatus === 'success' ? '上传成功' : '提交到服务器'}
              </Button>
              
              <Button onClick={handleReset}>
                重置
              </Button>
            </Space>
            
            {uploadStatus === 'success' && (
              <Alert
                message="上传成功"
                description="您的语音已成功上传到服务器，可以继续下一步操作。"
                type="success"
                showIcon
                style={{ marginTop: '20px' }}
              />
            )}
            
            {uploadStatus === 'error' && (
              <Alert
                message="上传失败"
                description="语音上传失败，请检查网络连接后重试。"
                type="error"
                showIcon
                style={{ marginTop: '20px' }}
              />
            )}
          </>
        )}
        
        <Divider />
        
        <Title level={4}>使用说明</Title>
        <Paragraph>
          <ol>
            <li>点击麦克风按钮开始录音（需要授予麦克风权限）</li>
            <li>录音过程中会显示录音时间</li>
            <li>点击停止按钮结束录音</li>
            <li>可以播放、删除或提交录音</li>
            <li>提交后会在上方显示录音信息和预览</li>
            <li>点击"提交到服务器"模拟上传流程</li>
          </ol>
        </Paragraph>
      </Card>
    </div>
  );
};

export default VoiceRecorderDemo; 