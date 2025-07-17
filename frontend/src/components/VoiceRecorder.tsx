import React, { useState, useRef } from 'react';
import { Button, message, Space, Typography } from 'antd';
import { AudioOutlined, StopOutlined, LoadingOutlined, PlayCircleOutlined, DeleteOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface VoiceRecorderProps {
  onSubmit: (audioFile: File) => void;
  buttonSize?: 'large' | 'middle' | 'small';
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSubmit, buttonSize = 'middle' }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 开始录音
  const startRecording = async () => {
    try {
      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // 创建MediaRecorder实例
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      // 设置数据处理事件
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      // 设置录音结束事件处理
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
        setAudioFile(audioFile);
        
        // 释放麦克风
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // 停止计时
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };
      
      // 开始录音
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setAudioFile(null);
      message.success('开始录音');
      
      // 开始计时
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      message.error('无法访问麦克风，请检查权限设置');
      console.error('录音错误:', error);
    }
  };
  
  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      message.success('录音完成');
    }
  };
  
  // 播放录音
  const playRecording = () => {
    if (audioFile) {
      const audioUrl = URL.createObjectURL(audioFile);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };
  
  // 停止播放
  const stopPlaying = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };
  
  // 删除录音
  const deleteRecording = () => {
    setAudioFile(null);
    if (audioRef.current) {
      audioRef.current.src = '';
    }
  };
  
  // 提交录音
  const submitRecording = () => {
    if (audioFile) {
      onSubmit(audioFile);
      message.success('语音提交成功');
    } else {
      message.warning('请先录制语音');
    }
  };
  
  // 格式化时间
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 处理录音播放结束事件
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="voice-recorder" style={{ textAlign: 'center', padding: '20px 0' }}>
      {/* 隐藏的音频元素用于播放 */}
      <audio ref={audioRef} onEnded={handleAudioEnded} style={{ display: 'none' }} />
      
      {/* 录音状态显示 */}
      <div style={{ marginBottom: 10 }}>
        {isRecording ? (
          <Text type="danger" style={{ fontSize: 16 }}>
            正在录音... {formatTime(recordingTime)}
          </Text>
        ) : audioFile ? (
          <Text type="success" style={{ fontSize: 16 }}>
            录音完成 {audioRef.current?.duration ? formatTime(Math.floor(audioRef.current.duration)) : ''}
          </Text>
        ) : (
          <Text type="secondary" style={{ fontSize: 16 }}>
            点击按钮开始录音
          </Text>
        )}
      </div>
      
      {/* 录音控制按钮 */}
      <div style={{ marginBottom: 15 }}>
        {!isRecording && !audioFile && (
          <Button 
            type="primary" 
            icon={<AudioOutlined />} 
            size={buttonSize} 
            onClick={startRecording}
            style={{ height: buttonSize === 'large' ? 80 : 60, width: buttonSize === 'large' ? 80 : 60, borderRadius: '50%' }}
          >
            录音
          </Button>
        )}
        
        {isRecording && (
          <Button 
            danger
            type="primary"
            icon={<StopOutlined />} 
            size={buttonSize} 
            onClick={stopRecording}
            style={{ height: buttonSize === 'large' ? 80 : 60, width: buttonSize === 'large' ? 80 : 60, borderRadius: '50%' }}
          >
            停止
          </Button>
        )}
      </div>
      
      {/* 录音控制和提交按钮 */}
      {audioFile && !isRecording && (
        <Space size="middle">
          {!isPlaying ? (
            <Button 
              type="default" 
              icon={<PlayCircleOutlined />} 
              onClick={playRecording}
            >
              播放
            </Button>
          ) : (
            <Button 
              type="default" 
              icon={<StopOutlined />} 
              onClick={stopPlaying}
            >
              停止
            </Button>
          )}
          
          <Button 
            danger
            icon={<DeleteOutlined />} 
            onClick={deleteRecording}
          >
            删除
          </Button>
          
          <Button 
            type="primary" 
            icon={<CheckCircleOutlined />} 
            onClick={submitRecording}
          >
            提交
          </Button>
        </Space>
      )}
    </div>
  );
};

export default VoiceRecorder; 