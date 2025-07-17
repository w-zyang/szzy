import React, { useState, useRef, useEffect } from 'react';
import { Button, message, Space, Tooltip, Progress } from 'antd';
import { AudioOutlined, LoadingOutlined, PlayCircleOutlined, PauseCircleOutlined, DeleteOutlined } from '@ant-design/icons';

interface AudioRecorderProps {
  onAudioText: (text: string) => void;
  buttonText?: string;
  placeholder?: string;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  onAudioText, 
  buttonText = "语音输入", 
  placeholder = "点击开始录音..." 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [processingAudio, setProcessingAudio] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recognizedText, setRecognizedText] = useState<string>("");
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // 清理资源
  const cleanupResources = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };
  
  // 开始录音
  const startRecording = async () => {
    try {
      // 清理之前的资源
      cleanupResources();
      setAudioBlob(null);
      setAudioUrl("");
      setRecognizedText("");
      
      // 请求麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // 创建MediaRecorder实例
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      // 设置数据处理事件
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // 设置录音结束事件处理
      mediaRecorderRef.current.onstop = () => {
        if (audioChunksRef.current.length > 0) {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          setAudioBlob(blob);
          const url = URL.createObjectURL(blob);
          setAudioUrl(url);
          
          // 停止所有轨道
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }
          
          // 处理录音文件
          const audioFile = new File([blob], 'recording.wav', { type: 'audio/wav' });
          processAudioFile(audioFile);
        } else {
          message.error('录音失败，未捕获到音频数据');
        }
      };
      
      // 开始录音
      mediaRecorderRef.current.start(100); // 每100ms触发一次ondataavailable事件
      setIsRecording(true);
      message.success('开始录音');
      
      // 开始计时
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('录音错误:', error);
      message.error('无法访问麦克风，请检查权限设置');
    }
  };
  
  // 停止录音
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      try {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        message.success('录音完成');
        
        // 停止计时
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } catch (error) {
        console.error('停止录音错误:', error);
        message.error('停止录音时发生错误');
      }
    }
  };
  
  // 播放录音
  const playRecording = () => {
    if (audioRef.current && audioUrl) {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(error => {
          console.error('播放录音错误:', error);
          message.error('播放录音失败');
        });
    }
  };
  
  // 暂停播放
  const pauseRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };
  
  // 处理音频播放结束
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };
  
  // 删除录音
  const deleteRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl("");
    setRecognizedText("");
  };
  
  // 格式化时间显示
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // 处理音频文件并转换为文本
  const processAudioFile = async (file: File) => {
    setProcessingAudio(true);
    
    try {
      console.log('开始处理音频文件:', file.name, file.size, file.type);
      
      // 创建FormData对象
      const formData = new FormData();
      formData.append('audio', file);
      
      console.log('发送语音识别请求...');
      
      // 发送到后端进行语音识别
      const response = await fetch('/api/voice/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('语音上传失败:', response.status, errorText);
        throw new Error(`语音上传失败: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log('语音识别结果:', result);
      
      if (result.success && result.text) {
        // 设置识别结果
        setRecognizedText(result.text);
        
        // 调用回调函数，将识别结果传递给父组件
        onAudioText(result.text);
        message.success('语音识别成功');
      } else {
        throw new Error(result.error || '无法识别语音内容');
      }
    } catch (error: any) {
      console.error('语音处理错误:', error);
      message.error(`语音处理失败: ${error.message}`);
    } finally {
      setProcessingAudio(false);
    }
  };
  
  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, []);
  
  return (
    <div className="audio-recorder">
      {/* 隐藏的音频元素用于播放 */}
      {audioUrl && (
        <audio 
          ref={audioRef} 
          src={audioUrl} 
          onEnded={handleAudioEnded}
          style={{ display: 'none' }}
        />
      )}
      
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 录音状态和时间显示 */}
        {isRecording && (
          <div style={{ marginBottom: 8 }}>
            <Progress 
              percent={Math.min(recordingTime * 3.33, 100)} 
              status="active" 
              showInfo={false} 
              strokeColor="#ff4d4f" 
            />
            <div style={{ textAlign: 'center', marginTop: 4 }}>
              正在录音 {formatTime(recordingTime)}
            </div>
          </div>
        )}
        
        {/* 录音控制按钮 */}
        <Space>
          <Tooltip title={isRecording ? "点击停止录音" : placeholder}>
            <Button 
              icon={isRecording ? <LoadingOutlined /> : <AudioOutlined />}
              type={isRecording ? "primary" : "default"}
              danger={isRecording}
              onClick={isRecording ? stopRecording : startRecording}
              loading={processingAudio}
            >
              {isRecording ? "停止录音" : buttonText}
            </Button>
          </Tooltip>
          
          {audioUrl && !isRecording && (
            <>
              <Button
                icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                onClick={isPlaying ? pauseRecording : playRecording}
              >
                {isPlaying ? "暂停" : "播放"}
              </Button>
              
              <Button
                icon={<DeleteOutlined />}
                onClick={deleteRecording}
              >
                删除
              </Button>
            </>
          )}
        </Space>
        
        {/* 识别结果显示 */}
        {recognizedText && (
          <div style={{ marginTop: 8, padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>识别结果:</div>
            <div>{recognizedText}</div>
          </div>
        )}
      </Space>
    </div>
  );
};

export default AudioRecorder; 