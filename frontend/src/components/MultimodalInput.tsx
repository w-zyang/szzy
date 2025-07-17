import React, { useState, useRef } from 'react';
import { Tabs, Input, Button, Upload, message, Space, Typography } from 'antd';
import { FileImageOutlined, SoundOutlined, FileTextOutlined, UploadOutlined, StopOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import AudioRecorder from './AudioRecorder';

const { TextArea } = Input;
const { Text } = Typography;

interface MultimodalInputProps {
  onSubmit: (data: {type: string, content: string | File}) => void;
  placeholder?: string;
  loading?: boolean;
}

export default function MultimodalInput({ onSubmit, placeholder = "请输入内容或选择其他输入方式", loading = false }: MultimodalInputProps) {
  const [activeTab, setActiveTab] = useState('text');
  const [textContent, setTextContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 文本输入处理
  const handleTextSubmit = () => {
    if (!textContent.trim()) {
      message.warning('请输入文本内容');
      return;
    }
    onSubmit({
      type: 'text',
      content: textContent
    });
  };

  // 语音输入处理
  const handleVoiceSubmit = (text: string) => {
    if (!text.trim()) {
      message.warning('语音识别内容为空');
      return;
    }
    
    onSubmit({
      type: 'text',
      content: text
    });
  };

  // 图片上传处理
  const handleImageChange: UploadProps['onChange'] = (info) => {
    if (info.file.status === 'done') {
      message.success(`${info.file.name} 上传成功`);
      setImageFile(info.file.originFileObj as File);
      
      // 创建预览URL
      if (info.file.originFileObj) {
        const url = URL.createObjectURL(info.file.originFileObj);
        setImagePreview(url);
      }
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} 上传失败`);
    }
  };

  const handleImageSubmit = () => {
    if (!imageFile) {
      message.warning('请先上传图片');
      return;
    }
    onSubmit({
      type: 'image',
      content: imageFile
    });
  };

  const tabItems = [
    {
      key: 'text',
      label: (
        <span>
          <FileTextOutlined />
          文字
        </span>
      ),
      children: (
        <div style={{ padding: '20px 0' }}>
          <TextArea
            rows={4}
            value={textContent}
            onChange={e => setTextContent(e.target.value)}
            placeholder={placeholder}
            style={{ marginBottom: 16 }}
          />
          <Button type="primary" onClick={handleTextSubmit} loading={loading}>
            提交文本
          </Button>
        </div>
      )
    },
    {
      key: 'voice',
      label: (
        <span>
          <SoundOutlined />
          语音
        </span>
      ),
      children: (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <AudioRecorder 
            onAudioText={handleVoiceSubmit}
            buttonText="开始录音"
            placeholder="点击开始录音，支持语音转文本"
          />
        </div>
      )
    },
    {
      key: 'image',
      label: (
        <span>
          <FileImageOutlined />
          图片
        </span>
      ),
      children: (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Space direction="vertical" size="large">
            <Upload
              name="file"
              action="/api/upload"
              onChange={handleImageChange}
              showUploadList={false}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />} size="large">
                选择图片
              </Button>
            </Upload>
            
            {imagePreview && (
              <div style={{ marginTop: 16 }}>
                <img 
                  src={imagePreview} 
                  alt="预览" 
                  style={{ maxWidth: '100%', maxHeight: 200 }} 
                />
                <br />
                <Button
                  type="primary"
                  onClick={handleImageSubmit}
                  style={{ marginTop: 16 }}
                  loading={loading}
                >
                  提交图片
                </Button>
              </div>
            )}
          </Space>
        </div>
      )
    }
  ];

  return (
    <div className="multimodal-input">
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        items={tabItems}
      />
    </div>
  );
} 