import React, { useState, useRef } from 'react';
import { Input, Upload, Button, Card, Typography, message, Tabs, Row, Col, Space } from 'antd';
import { AudioOutlined, CameraOutlined, FileImageOutlined, SoundOutlined, StopOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Title, Text } = Typography;

interface MultimodalInputProps {
  onSubmit: (data: {
    type: 'text' | 'voice' | 'image';
    content: string;
    file?: File;
  }) => void;
  placeholder?: string;
  loading?: boolean;
}

export default function MultimodalInput({ onSubmit, placeholder = "请输入内容或选择其他输入方式", loading = false }: MultimodalInputProps) {
  const [activeTab, setActiveTab] = useState('text');
  const [textContent, setTextContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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

  // 语音录制处理
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
        setAudioFile(audioFile);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      message.success('开始录音...');
    } catch (error) {
      message.error('无法访问麦克风，请检查权限设置');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      message.success('录音完成');
    }
  };

  const handleVoiceSubmit = () => {
    if (!audioFile) {
      message.warning('请先录制语音');
      return;
    }
    onSubmit({
      type: 'voice',
      content: '语音输入内容',
      file: audioFile
    });
  };

  // 图像上传处理
  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      message.error('请上传图像文件');
      return false;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    setImageFile(file);
    return false; // 阻止默认上传行为
  };

  const handleImageSubmit = () => {
    if (!imageFile) {
      message.warning('请先上传图像');
      return;
    }
    onSubmit({
      type: 'image',
      content: '图像输入内容',
      file: imageFile
    });
  };

  const tabItems = [
    {
      key: 'text',
      label: (
        <Space>
          <FileImageOutlined />
          文本输入
        </Space>
      ),
      children: (
        <div>
          <TextArea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder={placeholder}
            rows={6}
            style={{ marginBottom: 16 }}
          />
          <Button
            type="primary"
            onClick={handleTextSubmit}
            loading={loading}
            size="large"
          >
            提交文本
          </Button>
        </div>
      )
    },
    {
      key: 'voice',
      label: (
        <Space>
          <AudioOutlined />
          语音输入
        </Space>
      ),
      children: (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ marginBottom: 20 }}>
            <Text type="secondary">点击按钮开始录音，支持语音转文本</Text>
          </div>
          <Space direction="vertical" size="large">
            <Button
              type={isRecording ? "danger" : "primary"}
              icon={isRecording ? <StopOutlined /> : <SoundOutlined />}
              size="large"
              onClick={isRecording ? stopRecording : startRecording}
              style={{ width: 120, height: 120, borderRadius: '50%' }}
            >
              {isRecording ? '停止录音' : '开始录音'}
            </Button>
            {audioFile && (
              <div>
                <audio controls src={URL.createObjectURL(audioFile)} style={{ marginBottom: 16 }} />
                <br />
                <Button
                  type="primary"
                  onClick={handleVoiceSubmit}
                  loading={loading}
                  size="large"
                >
                  提交语音
                </Button>
              </div>
            )}
          </Space>
        </div>
      )
    },
    {
      key: 'image',
      label: (
        <Space>
          <CameraOutlined />
          图像输入
        </Space>
      ),
      children: (
        <div>
          <Row gutter={16}>
            <Col span={12}>
              <Upload
                accept="image/*"
                beforeUpload={handleImageUpload}
                showUploadList={false}
                style={{ width: '100%' }}
              >
                <Button
                  icon={<FileImageOutlined />}
                  size="large"
                  style={{ width: '100%', height: 100 }}
                >
                  点击上传图像
                </Button>
              </Upload>
            </Col>
            <Col span={12}>
              {imagePreview && (
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={imagePreview}
                    alt="预览"
                    style={{ maxWidth: '100%', maxHeight: 150, objectFit: 'contain' }}
                  />
                </div>
              )}
            </Col>
          </Row>
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Text type="secondary">支持图像识别、OCR文字提取等功能</Text>
          </div>
          {imageFile && (
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button
                type="primary"
                onClick={handleImageSubmit}
                loading={loading}
                size="large"
              >
                提交图像
              </Button>
            </div>
          )}
        </div>
      )
    }
  ];

  return (
    <Card title="多模态输入" style={{ marginBottom: 24 }}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
      />
    </Card>
  );
} 