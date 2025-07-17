import React, { useState } from 'react';
import { 
  Card, Row, Col, Form, Input, Select, Button, Typography, Space, Tag, 
  Modal, Progress, notification, Tabs, Steps, Divider, Alert, Upload, 
  Radio, InputNumber, Checkbox, List, Avatar, Tooltip, Badge, Spin, message
} from 'antd';
import { 
  FileTextOutlined, VideoCameraOutlined, QuestionCircleOutlined, BulbOutlined, 
  RobotOutlined, AudioOutlined, PictureOutlined, DownloadOutlined, EyeOutlined,
  ThunderboltOutlined, StarOutlined, BookOutlined, SettingOutlined, 
  FileImageOutlined, SoundOutlined, CloudUploadOutlined, SendOutlined,
  CheckCircleOutlined, LoadingOutlined, FileWordOutlined, PlayCircleOutlined,
  DeleteOutlined, EditOutlined, CopyOutlined, ShareAltOutlined, 
  HeartOutlined, FireOutlined, CrownOutlined, RocketOutlined, PlusOutlined
} from '@ant-design/icons';
import AudioRecorder from './components/AudioRecorder';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface GeneratedResource {
  id: string;
  type: 'ppt' | 'case' | 'question' | 'video' | 'audio' | 'image';
  title: string;
  description: string;
  content: any;
  downloadUrl?: string;
  createdAt: string;
  status: 'generating' | 'completed' | 'failed';
  progress: number;
}

const resourceTypes = [
  {
    key: 'ppt',
    title: 'PPT课件',
    description: '制作精美的演示文稿',
    icon: <FileTextOutlined />,
    gradient: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
    color: '#1976d2',
    darkColor: '#0d47a1'
  },
  {
    key: 'case',
    title: '教学案例',
    description: '创建实用的案例分析',
    icon: <BulbOutlined />,
    gradient: 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
    color: '#7b1fa2',
    darkColor: '#4a148c'
  },
  {
    key: 'question',
    title: '习题练习',
    description: '生成各类测试题目',
    icon: <QuestionCircleOutlined />,
    gradient: 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%)',
    color: '#388e3c',
    darkColor: '#1b5e20'
  },
  {
    key: 'video',
    title: '教学视频',
    description: '制作生动的视频内容',
    icon: <VideoCameraOutlined />,
    gradient: 'linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%)',
    color: '#f57c00',
    darkColor: '#e65100'
  },
  {
    key: 'audio',
    title: '音频素材',
    description: '创作高质量音频',
    icon: <SoundOutlined />,
    gradient: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%)',
    color: '#c2185b',
    darkColor: '#880e4f'
  },
  {
    key: 'image',
    title: '图像素材',
    description: '设计专业的图片',
    icon: <PictureOutlined />,
    gradient: 'linear-gradient(135deg, #e0f2f1 0%, #b2dfdb 100%)',
    color: '#00796b',
    darkColor: '#004d40'
  }
];

const subjects = [
  '数学', '物理', '化学', '生物', '语文', '英语', '历史', '地理', '政治', 
  '计算机', '经济学', '心理学', '管理学', '艺术', '音乐', '体育', '哲学'
];

// 1. 全局主色、圆角、阴影等样式变量
const MAIN_GRADIENT = 'linear-gradient(135deg, #5b8cfa 0%, #764ba2 100%)';
const CARD_RADIUS = 24;
const CARD_SHADOW = '0 8px 32px rgba(91,140,250,0.10)';
const TAB_BG = 'rgba(255,255,255,0.92)';
const TAB_BLUR = 'blur(18px)';
const TAB_HEIGHT = 72;
const TAB_FONT = 20;
const TAB_ACTIVE_COLOR = '#5b8cfa';
const TAB_INACTIVE_COLOR = '#888';
const BTN_GRADIENT = 'linear-gradient(90deg, #5b8cfa 0%, #764ba2 100%)';
const BTN_RADIUS = 25;
const BTN_HEIGHT = 48;

export default function ResourceCreationCenter() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedType, setSelectedType] = useState<string>('');
  const [form] = Form.useForm();
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedResources, setGeneratedResources] = useState<GeneratedResource[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [availableTemplates, setAvailableTemplates] = useState<{
    name: string;
    value: string;
    icon: string;
    previewUrl: string;
  }[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [topicRecognizedText, setTopicRecognizedText] = useState('');

  // 模板预览图映射 - 默认预览图，实际应从服务器获取
  const templatePreviewImages: Record<string, string> = {
    'default': 'https://img.freepik.com/free-vector/business-presentation-template_1096-187.jpg',
  };

  // 获取可用的PPT模板列表
  const fetchTemplates = async () => {
    try {
      setLoadingTemplates(true);
      
      // 调用API获取模板列表
      const response = await fetch('/api/aiPpt/ppt/templates');
      const data = await response.json();
      
      if (!data.templates || data.templates.length === 0) {
        message.warning('未找到PPT模板');
        setLoadingTemplates(false);
        return;
      }
      
      // 处理模板数据
      const templates = data.templates.map((template: string, index: number) => {
        const templateName = template.replace(/\.pptx$/, '');
        const templateInfo = data.templateInfo?.find((info: any) => info.name === template);
        
        // 根据模板名称确定emoji图标
        const getIconForTemplate = (name: string) => {
          const iconMap: Record<string, string> = {
            '绿色圆点': '🟢',
            '蓝色简约': '🔵',
            '商务经典': '🏢',
            '科技风格': '💻',
            '教育教学': '📚',
            '自然清新': '🌿',
            '创意图形': '🎨',
            '医学健康': '🏥',
            '深色主题': '🌑',
            '数据分析': '📊'
          };
          
          // 尝试精确匹配
          for (const [key, icon] of Object.entries(iconMap)) {
            if (name.includes(key)) return icon;
          }
          
          // 根据index分配一个默认图标
          const defaultIcons = ['📊', '📈', '📝', '📑', '📋', '📂', '🗂️', '📒', '📕', '📗', '📘', '📙'];
          return defaultIcons[index % defaultIcons.length];
        };
        
        return {
          name: templateName,
          value: template,
          icon: getIconForTemplate(templateName),
          description: templateInfo?.description || `${templateName}模板`,
          previewUrl: templateInfo?.previewUrl || '/default-pic.png'
        };
      });
      
      // 更新模板列表
      setAvailableTemplates(templates);
      
      // 设置默认选中的模板
      if (templates.length > 0) {
        setSelectedTemplate(templates[0].value);
        // 如果表单中已经有值，不要覆盖
        form.setFieldsValue({ template: templates[0].value });
      }
      
      setLoadingTemplates(false);
    } catch (error) {
      console.error('获取模板列表失败:', error);
      message.error('获取模板列表失败');
      setLoadingTemplates(false);
    }
  };
  
  // 组件挂载时加载模板列表
  React.useEffect(() => {
    if (selectedType === 'ppt') {
      fetchTemplates();
    }
  }, [selectedType]);

  const MultimodalInput = ({ onInput }: { onInput: (data: any) => void }) => {
    const [inputType, setInputType] = useState<'text' | 'voice' | 'image'>('text');
    const [textInput, setTextInput] = useState('');
    const [recognizedText, setRecognizedText] = useState('');

    const handleTextInput = () => {
      if (textInput.trim()) {
        onInput({ type: 'text', content: textInput });
        setTextInput('');
      }
    };

    const handleVoiceSubmit = (audioFile: File) => {
      // 创建FormData对象
      const formData = new FormData();
      formData.append('audio', audioFile);
      
      // 调用后端API进行语音识别
      fetch('/api/voice/upload', {
        method: 'POST',
        body: formData
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('语音上传失败');
        }
        return response.json();
      })
      .then(result => {
        if (result.success && result.text) {
          // 设置识别结果
          setRecognizedText(result.text);
          
          // 传递给父组件
          onInput({ type: 'voice', content: result.text });
          message.success('语音识别成功');
        } else {
          throw new Error(result.error || '无法识别语音内容');
        }
      })
      .catch(error => {
        console.error('语音处理错误:', error);
        message.error('语音处理失败: ' + error.message);
      });
    };

    const handleAudioText = (text: string) => {
      setRecognizedText(text);
      onInput({ type: 'voice', content: text });
    };

    const handleImageUpload = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        onInput({ 
          type: 'image', 
          content: e.target?.result,
          fileName: file.name 
        });
      };
      reader.readAsDataURL(file);
    };

    return (
      <div style={{ 
        background: '#f8f9fa',
        borderRadius: 12,
        padding: 20,
        border: '1px solid #e9ecef'
      }}>
        <div style={{ marginBottom: 16 }}>
          <Radio.Group 
            value={inputType} 
            onChange={(e) => setInputType(e.target.value)}
            buttonStyle="solid"
            size="large"
          >
            <Radio.Button value="text">📝 文字</Radio.Button>
            <Radio.Button value="voice">🎤 语音</Radio.Button>
            <Radio.Button value="image">📷 图片</Radio.Button>
          </Radio.Group>
        </div>

        {inputType === 'text' && (
          <div style={{ display: 'flex', gap: 12 }}>
            <Input.TextArea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="描述您想要创建的内容..."
              rows={3}
              style={{ 
                borderRadius: 8,
                fontSize: 16
              }}
            />
            <Button 
              type="primary" 
              icon={<SendOutlined />}
              onClick={handleTextInput}
              disabled={!textInput.trim()}
              style={{ 
                height: 'auto',
                borderRadius: 8
              }}
            >
              发送
            </Button>
          </div>
        )}

        {inputType === 'voice' && (
          <div style={{ padding: '10px 0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
              <AudioRecorder onAudioText={handleAudioText} buttonText="开始录音" placeholder="点击按钮开始录音" />
            </div>
            {recognizedText && (
              <div style={{ marginTop: 16, padding: 12, background: '#f0f7ff', borderRadius: 8, border: '1px solid #d7e6ff' }}>
                <div style={{ fontWeight: 'bold', marginBottom: 4 }}>语音识别结果:</div>
                <div style={{ fontSize: 16 }}>{recognizedText}</div>
              </div>
            )}
          </div>
        )}

        {inputType === 'image' && (
          <Upload.Dragger
            accept="image/*"
            beforeUpload={(file) => {
              handleImageUpload(file);
              return false;
            }}
            showUploadList={false}
            style={{ 
              borderRadius: 8,
              background: '#fff'
            }}
          >
            <div style={{ padding: 20 }}>
              <PictureOutlined style={{ fontSize: 48, color: '#1890ff' }} />
              <div style={{ marginTop: 16, fontSize: 16 }}>
                上传图片或拖拽到此处
              </div>
            </div>
          </Upload.Dragger>
        )}
      </div>
    );
  };

  const handleMultimodalInput = (data: any) => {
    console.log('多模态输入:', data);
    notification.success({
      message: '输入成功',
      description: `已接收${data.type === 'text' ? '文字' : data.type === 'voice' ? '语音' : '图片'}输入`,
      placement: 'topRight'
    });
  };

  const generateResource = async (values: any) => {
    setGenerating(true);
    setProgress(0);

    const newResource: GeneratedResource = {
      id: Date.now().toString(),
      type: selectedType as any,
      title: selectedType === 'ppt' ? values.topic : (values.title || `新建${resourceTypes.find(t => t.key === selectedType)?.title}`),
      description: values.description || '',
      content: values,
      createdAt: new Date().toISOString(),
      status: 'generating',
      progress: 0
    };

    setGeneratedResources(prev => [newResource, ...prev]);

    // 模拟生成进度
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setGenerating(false);
          
          // 不在这里更新downloadUrl，而是在API调用成功后更新
          setGeneratedResources(prevResources => 
            prevResources.map(resource => 
              resource.id === newResource.id 
                ? { ...resource, status: 'completed', progress: 100 }
                : resource
            )
          );

          notification.success({
            message: '生成成功',
            description: `${resourceTypes.find(t => t.key === selectedType)?.title}已生成完成`,
            placement: 'topRight'
          });

          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 500);

    try {
      // 调用后端API
      if (selectedType === 'ppt') {
        const result = await generatePPTFile(values);
        
        // 更新资源状态，使用后端返回的实际URL
        setGeneratedResources(prevResources => 
          prevResources.map(resource => 
            resource.id === newResource.id 
              ? { ...resource, status: 'completed', progress: 100, downloadUrl: result.pptUrl }
              : resource
          )
        );
      }
      // 其他类型的生成逻辑...
    } catch (error) {
      console.error('生成失败:', error);
      setGenerating(false);
      clearInterval(progressInterval);
      
      setGeneratedResources(prevResources => 
        prevResources.map(resource => 
          resource.id === newResource.id 
            ? { ...resource, status: 'failed' }
            : resource
        )
      );

      notification.error({
        message: '生成失败',
        description: '请检查网络连接或联系技术支持',
        placement: 'topRight'
      });
    }
  };

  const generatePPTFile = async (values: any) => {
    try {
      const formData = new FormData();
      formData.append('topic', values.topic || '');
      formData.append('pages', values.pages?.toString() || '10');
      formData.append('style', values.style || 'business');
      formData.append('color', values.color || 'blue');
      formData.append('animation', values.animation || 'moderate');
      formData.append('font', values.font || 'modern');
      formData.append('format', values.format || 'pptx');
      // 默认不使用深度思考，提高生成速度
      formData.append('deepThink', (values.deepThink === true).toString());
      formData.append('subject', values.subject || '');
  
      // 使用RAG增强功能
      console.log("开始RAG增强...");
      let enhancedContext = '';
      
      // 提取关键词用于知识检索
      const extractKeywords = (text: string): string[] => {
        // 简单的关键词提取，仅用于演示
        const words = text.replace(/[^\w\s\u4e00-\u9fff]/g, '').split(/\s+/);
        return words.filter(word => word.length > 1).slice(0, 5);
      };
      
      try {
        const ragResponse = await fetch('/api/aiPpt/enhance-with-rag', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            topic: values.topic,
            subject: values.subject,
            keywords: extractKeywords(values.topic)
          })
        });
        
        if (ragResponse.ok) {
          const ragData = await ragResponse.json();
          console.log("RAG增强成功:", ragData);
          
          if (ragData.hasContent) {
            enhancedContext = ragData.relevantContent;
            console.log("已获取相关知识:", enhancedContext.substring(0, 100) + "...");
            // 确保将RAG检索到的知识添加到表单数据中
            formData.append('enhancedContext', enhancedContext);
          } else {
            console.log("未找到相关知识库内容");
          }
        } else {
          console.warn("RAG增强调用失败，将继续使用标准流程");
        }
      } catch (e) {
        console.warn("RAG增强过程出错，将继续使用标准流程:", e);
      }
  
      // 获取大纲
      console.log("开始获取大纲...");
      const outlineResponse = await fetch('/api/aiPpt/generate-outline', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: formData
      });
  
      if (!outlineResponse.ok) {
        const errorText = await outlineResponse.text();
        console.error("大纲生成失败:", errorText);
        
        // 检查是否包含代理错误或连接问题
        let errorMessage = '大纲生成失败';
        try {
          const errorObj = JSON.parse(errorText);
          if (errorObj.error && (
            errorObj.error.includes('ProxyError') || 
            errorObj.error.includes('Max retries exceeded') || 
            errorObj.error.includes('Failed to establish')
          )) {
            errorMessage = '网络连接问题：无法连接到AI服务，请检查网络或代理设置';
          }
        } catch (e) {
          // 解析JSON失败，使用默认错误消息
        }
        
        throw new Error(errorMessage);
      }
  
      const outlineResult = await outlineResponse.json();
      console.log("大纲生成成功，页数:", outlineResult.outline?.length || 0);
      
      // 检查大纲是否为空或格式错误，并限制页数范围
      let outline = [];
      if (outlineResult.outline && Array.isArray(outlineResult.outline) && outlineResult.outline.length > 0) {
        // 确保大纲格式正确
        outline = outlineResult.outline.map((slide: any) => {
          // 检查并修复可能的JSON字符串问题
          if (typeof slide === 'string') {
            try {
              slide = JSON.parse(slide);
            } catch (e) {
              // 解析失败，创建基本结构
              slide = { title: slide, content: "" };
            }
          }
          
          // 确保对象格式正确
          if (!slide || typeof slide !== 'object') {
            slide = { title: values.topic || "未命名幻灯片", content: "" };
          }
          
          // 确保标题和内容是字符串
          const title = typeof slide.title === 'string' ? slide.title : String(slide.title || values.topic || '');
          const content = typeof slide.content === 'string' ? slide.content : String(slide.content || '');
          
          // 确保layout字段存在
          const layout = slide.layout || 'keypoints';
          
          // 处理keypoints字段
          let keypoints = slide.keypoints || [];
          if (!Array.isArray(keypoints)) {
            if (typeof keypoints === 'string') {
              keypoints = keypoints.split('\n').filter((k: string) => k.trim());
            } else {
              keypoints = [];
            }
          }
          
          // 如果没有keypoints但有content，可以从content中提取
          if (keypoints.length === 0 && content) {
            keypoints = content.split('\n').filter((line: string) => line.trim())
              .map((line: string) => line.replace(/^[•\-\*]\s*/, '').trim())  // 移除可能的项目符号
              .filter((line: string) => line.length > 0);
          }
          
          return {
            title: title.replace(/\\"/g, '"').replace(/^"|"$/g, ''),
            content: content.replace(/\\"/g, '"'),
            layout: layout,
            type: slide.type || '',
            keypoints: keypoints
          };
        });
        
        // 根据用户输入限制页数，设置最大上限为50页
        const requestedPages = parseInt(values.pages || '10', 10);
        const maxAllowedPages = 50; // 系统最大允许页数
        const maxPages = Math.min(requestedPages, maxAllowedPages);
        if (outline.length > maxPages) {
          outline = outline.slice(0, maxPages);
          console.log(`大纲页数已限制为${maxPages}页，用户请求页数: ${requestedPages}`);
        }
      } else {
        // 使用备用大纲
        console.log("使用备用大纲");
        outline = createFallbackOutline(values.topic, values);
      }
      
      // 确保大纲至少有一页
      if (outline.length === 0) {
        outline.push({
          title: values.topic || "未命名演示文稿",
          content: "请在此处添加内容",
          layout: "cover"
        });
      }
      
      console.log("最终大纲数据:", outline);
      
      // 然后生成PPT
      console.log("开始生成PPT...");
      // 获取用户选择的模板或使用默认模板
      const templateName = values.template || '绿色圆点.pptx';
      console.log("使用模板:", templateName);
      
      const pptResponse = await fetch('/api/aiPpt/gen-pptx-python', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          outline: outline,
          template: templateName,
          topic: values.topic || '未命名',
          fillContent: true, // 明确指定需要填充内容
          style: values.style || 'business',
          color: values.color || 'blue'
        })
      });
      
      if (!pptResponse.ok) {
        const errorText = await pptResponse.text();
        console.error("PPT生成失败:", errorText);
        throw new Error('PPT生成失败，请稍后重试');
      }
      
      const pptResult = await pptResponse.json();
      
      if (!pptResult.pptUrl) {
        console.error("PPT URL不存在");
        throw new Error('PPT生成失败，未返回下载链接');
      }
      
      // 确保URL是完整的URL
      if (!pptResult.pptUrl.startsWith('http')) {
        pptResult.pptUrl = `${window.location.origin}${pptResult.pptUrl}`;
      }
      
      console.log('生成的PPT URL:', pptResult.pptUrl);
      
      // 不再调用/api/resource接口，直接返回结果
      return pptResult;
    } catch (error) {
      console.error("PPT生成过程中出错:", error);
      
      // 显示更友好的错误通知
      notification.error({
        message: 'PPT生成失败',
        description: error instanceof Error ? error.message : '生成过程中遇到问题，请稍后重试',
        placement: 'topRight',
        duration: 8
      });
      
      throw error;
    }
  };
  
  // 创建一个备用大纲，用于API调用失败时的后备方案
  const createFallbackOutline = (topic: string, values?: any) => {
    // 获取用户请求的页数，默认为10
    const requestedPages = parseInt(values?.pages || '10', 10);
    // 设置系统允许的最大页数
    const maxAllowedPages = 50;
    // 限制页数范围在3到用户请求页数之间，但不超过系统最大限制
    const actualPageCount = Math.min(maxAllowedPages, Math.max(3, requestedPages));
    
    // 动态生成标题和内容
    const outline = [];
    
    // 第一页总是封面
    outline.push({
      title: topic || '主题',
      content: `关于${topic || '主题'}的介绍`,
      layout: 'cover',
      type: 'cover'
    });
    
    // 第二页是目录
      outline.push({
      title: '目录',
      content: '本PPT的主要内容',
      layout: 'toc',
      type: 'toc'
      });
    
    // 根据页数生成中间内容页
    const middlePageCount = actualPageCount - 3; // 减去封面、目录和总结
    
    // 根据不同主题类型生成不同的内容结构
    const layouts = ['keypoints', 'content', 'comparison', 'image', 'diagram'];
    
    if (topic?.includes('细胞') || topic?.includes('生物')) {
      // 生物相关主题
      outline.push({
        title: `${topic} 的结构`,
        content: `详细介绍${topic}的结构组成和基本特征`,
        layout: 'diagram',
        type: 'content'
      });
      
      if (middlePageCount > 1) {
        outline.push({
          title: `${topic} 的功能`,
          content: `详细介绍${topic}的主要功能和生物学意义`,
          layout: 'content',
          type: 'content'
        });
      }
      
      if (middlePageCount > 2) {
        outline.push({
          title: `${topic} 的分类`,
          content: `不同类型的${topic}及其特点比较`,
          layout: 'comparison',
          type: 'content'
        });
      }
    } else if (topic?.includes('数学') || topic?.includes('公式') || topic?.includes('定理')) {
      // 数学相关主题
      outline.push({
        title: `${topic} 的定义`,
        content: `${topic}的数学定义和基本概念`,
        layout: 'keypoints',
        type: 'content'
      });
      
      if (middlePageCount > 1) {
        outline.push({
          title: `${topic} 的应用`,
          content: `${topic}在实际问题中的应用举例`,
          layout: 'content',
          type: 'content'
        });
      }
      
      if (middlePageCount > 2) {
        outline.push({
          title: `${topic} 的证明`,
          content: `${topic}的数学证明和推导过程`,
          layout: 'diagram',
          type: 'content'
        });
      }
    } else {
      // 通用主题结构
      // 动态生成中间页内容
      for (let i = 0; i < middlePageCount; i++) {
        const layoutIndex = i % layouts.length;
        outline.push({
          title: `${topic} - 要点 ${i + 1}`,
          content: `关于${topic}的重要内容点 ${i + 1}`,
          layout: layouts[layoutIndex],
          type: 'content'
        });
      }
    }
    
    // 最后一页总是总结
    outline.push({
      title: `${topic || '主题'} - 总结`,
      content: `对${topic || '主题'}的主要内容进行回顾和总结`,
      layout: 'summary',
      type: 'summary'
    });
    
    return outline;
  };

  const downloadResource = async (resource: GeneratedResource) => {
    try {
      if (resource.downloadUrl) {
        // 确保URL是完整的URL
        let downloadUrl = resource.downloadUrl;
        if (!downloadUrl.startsWith('http')) {
          // 如果是相对路径，添加基础URL
          downloadUrl = `${window.location.origin}${downloadUrl}`;
        }
        
        console.log("开始下载文件:", downloadUrl);
        
        // 使用fetch检查URL是否可访问
        try {
          const response = await fetch(downloadUrl, { method: 'HEAD' });
          if (!response.ok) {
            console.error("文件访问失败:", response.status, response.statusText);
            throw new Error(`文件访问失败: ${response.status} ${response.statusText}`);
          }
        } catch (error) {
          console.error("文件访问检查失败:", error);
          notification.error({
            message: '下载失败',
            description: '文件不存在或无法访问，请重新生成',
            placement: 'topRight'
          });
          return;
        }
        
        // 直接打开URL，而不是使用下载链接
        window.open(downloadUrl, '_blank');
        
        notification.success({
          message: '下载成功',
          description: `${resource.title}已开始下载`,
          placement: 'topRight'
        });
      } else {
        notification.error({
          message: '下载失败',
          description: '资源链接不存在，请重新生成',
          placement: 'topRight'
        });
      }
    } catch (error) {
      console.error("下载过程中出错:", error);
      notification.error({
        message: '下载失败',
        description: '请稍后重试',
        placement: 'topRight'
      });
    }
  };

  // 添加删除资源的函数
  const deleteResource = async (resource: GeneratedResource) => {
    try {
      console.log("开始删除资源:", resource);
      
      // 如果没有downloadUrl，无法删除
      if (!resource.downloadUrl) {
        notification.error({
          message: '删除失败',
          description: '找不到资源文件路径',
          placement: 'topRight'
        });
        return;
      }
      
      // 从URL中提取文件名
      const filename = resource.downloadUrl.split('/').pop();
      if (!filename) {
        notification.error({
          message: '删除失败',
          description: '无法解析文件名',
          placement: 'topRight'
        });
        return;
      }
      
      // 调用后端API删除文件
      const response = await fetch('/api/aiPpt/delete-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ filename })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      
      // 从本地状态中移除该资源
      setGeneratedResources(prev => prev.filter(r => r.id !== resource.id));
      
      notification.success({
        message: '删除成功',
        description: '资源已成功删除',
        placement: 'topRight'
      });
    } catch (error) {
      console.error("删除资源失败:", error);
      notification.error({
        message: '删除失败',
        description: error instanceof Error ? error.message : '删除过程中遇到问题，请稍后重试',
        placement: 'topRight'
      });
    }
  };

  const previewResource = (resource: GeneratedResource) => {
    // 实现预览逻辑
    if (resource.downloadUrl) {
      // 确保URL是完整的URL
      let previewUrl = resource.downloadUrl;
      if (!previewUrl.startsWith('http')) {
        // 如果是相对路径，添加基础URL
        previewUrl = `${window.location.origin}${previewUrl}`;
      }
      
      console.log("预览文件:", previewUrl);
      
      // 创建一个模态框来预览PPT
      Modal.info({
        title: `预览 - ${resource.title}`,
        width: 800,
        content: (
          <div style={{ height: 600 }}>
            <iframe 
              src={previewUrl} 
              width="100%" 
              height="100%" 
              title={`预览 - ${resource.title}`}
              style={{ border: 'none' }}
              onError={(e) => {
                console.error("预览加载失败:", e);
                notification.error({
                  message: '预览失败',
                  description: '文件无法加载，请尝试下载查看',
                  placement: 'topRight'
                });
              }}
            />
          </div>
        ),
        okText: '关闭',
        maskClosable: true
      });
    } else {
      notification.error({
        message: '预览失败',
        description: '资源链接不存在，请重新生成',
        placement: 'topRight'
      });
    }
  };

  const renderResourceTypes = () => (
    <div style={{ padding: '40px 0' }}>
      <Row gutter={[32, 32]}>
        {resourceTypes.map((type, index) => (
          <Col key={type.key} xs={24} sm={12} lg={8} xl={8}>
            <Card
              hoverable
              onClick={() => {
                setSelectedType(type.key);
                setActiveTab('create');
              }}
              style={{
                height: 320,
                borderRadius: 24,
                border: 'none',
                background: 'rgba(255,255,255,0.95)',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                backdropFilter: 'blur(10px)',
                transform: 'translateY(0)',
                animation: `slideUp ${0.5 + index * 0.1}s ease-out`
              }}
              styles={{ body: { padding: 0 } }}
              className="resource-type-card"
            >
              {/* 顶部彩色条纹 */}
              <div style={{
                height: 6,
                background: type.gradient,
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 3
              }} />
              
              <div style={{
                padding: 32,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
                zIndex: 2
              }}>
                {/* 增强的图标设计 */}
                <div style={{
                  width: 90,
                  height: 90,
                  borderRadius: '50%',
                  background: type.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 24,
                  boxShadow: `0 8px 32px ${type.color}40`,
                  position: 'relative'
                }}>
                  <div style={{ 
                    fontSize: 40, 
                    color: 'white',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
                  }}>
                    {type.icon}
                  </div>
                  
                  {/* 脉冲动画环 */}
                  <div style={{
                    position: 'absolute',
                    width: '120%',
                    height: '120%',
                    borderRadius: '50%',
                    border: `2px solid ${type.color}30`,
                    animation: 'pulse 2s infinite'
                  }} />
                </div>
                
                <Title level={3} style={{ 
                  color: type.darkColor, 
                  margin: '0 0 12px 0',
                  fontWeight: 700,
                  fontSize: 20
                }}>
                  {type.title}
                </Title>
                <Text style={{ 
                  color: '#666', 
                  fontSize: 16,
                  fontWeight: 500,
                  marginBottom: 20
                }}>
                  {type.description}
                </Text>
                
                {/* 增强的特色功能标签 */}
                <div style={{ 
                  marginTop: 16,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  justifyContent: 'center'
                }}>
                  {type.key === 'ppt' && (
                    <>
                      <Tag style={{ borderRadius: 16, border: `1px solid ${type.color}30`, color: type.color, background: `${type.color}10` }}>📊 50+ 模板</Tag>
                      <Tag style={{ borderRadius: 16, border: `1px solid ${type.color}30`, color: type.color, background: `${type.color}10` }}>🤖 AI 布局</Tag>
                      <Tag style={{ borderRadius: 16, border: `1px solid ${type.color}30`, color: type.color, background: `${type.color}10` }}>✨ 动画效果</Tag>
                    </>
                  )}
                  {type.key === 'case' && (
                    <>
                      <Tag style={{ borderRadius: 16, border: `1px solid ${type.color}30`, color: type.color, background: `${type.color}10` }}>📚 真实案例</Tag>
                      <Tag style={{ borderRadius: 16, border: `1px solid ${type.color}30`, color: type.color, background: `${type.color}10` }}>🎯 互动设计</Tag>
                      <Tag style={{ borderRadius: 16, border: `1px solid ${type.color}30`, color: type.color, background: `${type.color}10` }}>🎭 情景模拟</Tag>
                    </>
                  )}
                  {type.key === 'question' && (
                    <>
                      <Tag style={{ borderRadius: 16, border: `1px solid ${type.color}30`, color: type.color, background: `${type.color}10` }}>📝 多种题型</Tag>
                      <Tag style={{ borderRadius: 16, border: `1px solid ${type.color}30`, color: type.color, background: `${type.color}10` }}>🧠 智能组卷</Tag>
                      <Tag style={{ borderRadius: 16, border: `1px solid ${type.color}30`, color: type.color, background: `${type.color}10` }}>💡 详细解析</Tag>
                    </>
                  )}
                  {type.key === 'video' && (
                    <>
                      <Tag style={{ borderRadius: 16, border: `1px solid ${type.color}30`, color: type.color, background: `${type.color}10` }}>🎬 4K 画质</Tag>
                      <Tag style={{ borderRadius: 16, border: `1px solid ${type.color}30`, color: type.color, background: `${type.color}10` }}>🎤 AI 配音</Tag>
                      <Tag style={{ borderRadius: 16, border: `1px solid ${type.color}30`, color: type.color, background: `${type.color}10` }}>🎨 多风格</Tag>
                    </>
                  )}
                  {type.key === 'audio' && (
                    <>
                      <Tag style={{ borderRadius: 16, border: `1px solid ${type.color}30`, color: type.color, background: `${type.color}10` }}>🎵 多音色</Tag>
                      <Tag style={{ borderRadius: 16, border: `1px solid ${type.color}30`, color: type.color, background: `${type.color}10` }}>🎶 背景音</Tag>
                      <Tag style={{ borderRadius: 16, border: `1px solid ${type.color}30`, color: type.color, background: `${type.color}10` }}>💎 高品质</Tag>
                    </>
                  )}
                  {type.key === 'image' && (
                    <>
                      <Tag style={{ borderRadius: 16, border: `1px solid ${type.color}30`, color: type.color, background: `${type.color}10` }}>🎨 多风格</Tag>
                      <Tag style={{ borderRadius: 16, border: `1px solid ${type.color}30`, color: type.color, background: `${type.color}10` }}>📸 高分辨率</Tag>
                      <Tag style={{ borderRadius: 16, border: `1px solid ${type.color}30`, color: type.color, background: `${type.color}10` }}>🤖 AI 创作</Tag>
                    </>
                  )}
                </div>

                {/* 创建按钮 */}
                <Button
                  type="primary"
                  size="large"
                  style={{
                    marginTop: 20,
                    borderRadius: 20,
                    background: type.gradient,
                    border: 'none',
                    boxShadow: `0 4px 16px ${type.color}30`,
                    fontWeight: 600,
                    height: 44,
                    paddingLeft: 24,
                    paddingRight: 24
                  }}
                  icon={<PlusOutlined />}
                >
                  开始创作
                </Button>
              </div>
              
              {/* 装饰性背景元素 */}
              <div style={{
                position: 'absolute',
                top: -40,
                right: -40,
                width: 120,
                height: 120,
                borderRadius: '50%',
                background: `${type.color}08`,
                zIndex: 1
              }} />
              <div style={{
                position: 'absolute',
                bottom: -50,
                left: -50,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: `${type.color}05`,
                zIndex: 1
              }} />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );

  const renderCreateForm = () => {
    if (!selectedType) return null;

    const currentType = resourceTypes.find(t => t.key === selectedType);
    
    const handleTopicVoiceText = (text: string) => {
      setTopicRecognizedText(text);
      // 更新表单中的topic字段
      form.setFieldsValue({ topic: text });
    };
    
    const getTypeSpecificForm = () => {
      switch (selectedType) {
        case 'ppt':
          return (
            <div>
              <Form.Item name="topic" label={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>主题内容</span>
                  <Tooltip title="使用语音输入">
                    <Button 
                      type="text" 
                      icon={<AudioOutlined />}
                      onClick={() => {
                        Modal.confirm({
                          title: '语音输入',
                          width: 500,
                          icon: <AudioOutlined style={{ color: '#1890ff' }} />,
                          content: (
                            <div style={{ padding: '20px 0' }}>
                              <AudioRecorder 
                                onAudioText={handleTopicVoiceText} 
                                buttonText="开始录音" 
                                placeholder="点击按钮开始语音输入PPT主题"
                              />
                            </div>
                          ),
                          footer: null
                        });
                      }}
                      size="small"
                    />
                  </Tooltip>
                </div>
              } rules={[{ required: true, message: '请输入主题内容' }]}>
                <TextArea rows={4} placeholder="请输入PPT的主题和主要内容..." />
              </Form.Item>
              
              {topicRecognizedText && (
                <div style={{ 
                  marginTop: -16, 
                  marginBottom: 16, 
                  padding: 10, 
                  background: '#f0f7ff', 
                  borderRadius: 4, 
                  fontSize: 14,
                  color: '#0057b7'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>最近的语音输入:</span>
                    <Button 
                      type="text" 
                      size="small" 
                      icon={<DeleteOutlined />} 
                      onClick={() => setTopicRecognizedText('')}
                    >
                      清除
                    </Button>
                  </div>
                  <div style={{ marginTop: 4 }}>{topicRecognizedText}</div>
                </div>
              )}
              
              {/* 模板预览 */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ 
                  fontWeight: 600, 
                  fontSize: 16, 
                  marginBottom: 12, 
                  color: '#333',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8 
                }}>
                  <FileTextOutlined /> 模板预览
                </div>
                <div style={{ 
                  padding: '16px', 
                  border: '1px solid #eee', 
                  borderRadius: 8,
                  background: '#f9f9f9',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  {loadingTemplates ? (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: 200 
                    }}>
                      <Spin tip="加载模板..." />
                    </div>
                  ) : selectedTemplate ? (
                    <img 
                      src={availableTemplates.find(t => t.value === selectedTemplate)?.previewUrl || templatePreviewImages['default']} 
                      alt="模板预览" 
                      style={{ 
                        maxWidth: '100%', 
                        height: 200, 
                        objectFit: 'contain',
                        borderRadius: 4,
                        border: '1px solid #ddd'
                      }} 
                    />
                  ) : (
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: 200,
                      color: '#999'
                    }}>
                      请选择模板
                    </div>
                  )}
                  <div style={{ fontSize: 14, color: '#666', marginTop: 8, textAlign: 'center' }}>
                    {selectedTemplate ? (
                      <>当前选择：{selectedTemplate.replace('.pptx', '')}（选择不同模板可预览效果）</>
                    ) : (
                      <>选择一个模板以查看预览效果</>
                    )}
                  </div>
                </div>
              </div>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="pages" label="页数" initialValue={10}>
                    <InputNumber min={1} max={100} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item 
                    name="template" 
                    label="PPT模板" 
                    tooltip="选择不同的模板会改变PPT的整体设计风格"
                  >
                    <Select 
                      onChange={(value) => setSelectedTemplate(value)}
                      loading={loadingTemplates}
                      placeholder="请选择模板"
                    >
                      {availableTemplates.map(template => (
                        <Option key={template.value} value={template.value}>
                          {template.icon} {template.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="style" label="内容风格" initialValue="business">
                    <Select>
                      <Option value="business">🏢 商务风格</Option>
                      <Option value="academic">🎓 学术风格</Option>
                      <Option value="creative">🎨 创意风格</Option>
                      <Option value="simple">✨ 简约风格</Option>
                      <Option value="technology">💻 科技风格</Option>
                      <Option value="nature">🌿 自然风格</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="color" label="配色方案" initialValue="blue">
                    <Select>
                      <Option value="blue">🔵 蓝色系</Option>
                      <Option value="green">🟢 绿色系</Option>
                      <Option value="orange">🟠 橙色系</Option>
                      <Option value="purple">🟣 紫色系</Option>
                      <Option value="red">🔴 红色系</Option>
                      <Option value="gray">⚫ 灰色系</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="animation" label="动画效果" initialValue="moderate">
                    <Select>
                      <Option value="none">无动画</Option>
                      <Option value="subtle">轻微动画</Option>
                      <Option value="moderate">适中动画</Option>
                      <Option value="dynamic">动态效果</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="font" label="字体风格" initialValue="modern">
                    <Select>
                      <Option value="modern">现代字体</Option>
                      <Option value="classic">经典字体</Option>
                      <Option value="creative">创意字体</Option>
                      <Option value="professional">专业字体</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="format" label="输出格式" initialValue="pptx">
                    <Select>
                      <Option value="pptx">PowerPoint (.pptx)</Option>
                      <Option value="pdf">PDF 文档</Option>
                      <Option value="html">网页格式</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="language" label="语言" initialValue="chinese">
                    <Select>
                      <Option value="chinese">中文</Option>
                      <Option value="english">English</Option>
                      <Option value="bilingual">中英双语</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="difficulty" label="内容难度" initialValue="medium">
                    <Select>
                      <Option value="beginner">入门级</Option>
                      <Option value="medium">中级</Option>
                      <Option value="advanced">高级</Option>
                      <Option value="expert">专家级</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="subject" label="学科领域" tooltip="选择学科可以获取相关专业知识">
                    <Select>
                      <Option value="生物">🧬 生物学</Option>
                      <Option value="物理">⚛️ 物理学</Option>
                      <Option value="化学">🧪 化学</Option>
                      <Option value="数学">🔢 数学</Option>
                      <Option value="">📚 其他领域</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item name="features" label="附加功能">
                <Checkbox.Group>
                  <Row>
                    <Col span={8}><Checkbox value="notes">演讲者备注</Checkbox></Col>
                    <Col span={8}><Checkbox value="handout">讲义模式</Checkbox></Col>
                    <Col span={8}><Checkbox value="interactive">互动元素</Checkbox></Col>
                    <Col span={8}><Checkbox value="references">参考文献</Checkbox></Col>
                    <Col span={8}><Checkbox value="glossary">术语表</Checkbox></Col>
                    <Col span={8}><Checkbox value="quiz">小测验</Checkbox></Col>
                  </Row>
                </Checkbox.Group>
              </Form.Item>
              
              <Form.Item name="deepThink" valuePropName="checked">
                <Checkbox>
                  <Tooltip title="开启后生成质量更高但速度更慢">
                    深度思考模式
                  </Tooltip>
                </Checkbox>
              </Form.Item>
            </div>
          );

        case 'case':
          return (
            <div>
              <Form.Item name="subject" label="学科领域" rules={[{ required: true, message: '请选择学科' }]}>
                <Select placeholder="选择学科">
                  {subjects.map(subject => (
                    <Option key={subject} value={subject}>{subject}</Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item name="topic" label="案例主题" rules={[{ required: true, message: '请输入案例主题' }]}>
                <Input placeholder="请输入案例的主题..." />
              </Form.Item>
              
              <Form.Item name="description" label="详细描述">
                <TextArea rows={4} placeholder="描述案例的背景、目标、要求等..." />
              </Form.Item>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="type" label="案例类型" initialValue="case_study">
                    <Select>
                      <Option value="simulation">🎭 情景模拟</Option>
                      <Option value="problem_solving">🧩 问题解决</Option>
                      <Option value="project">🚀 项目实践</Option>
                      <Option value="case_study">📖 案例分析</Option>
                      <Option value="discussion">💬 讨论互动</Option>
                      <Option value="experiment">🔬 实验探究</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="difficulty" label="难度等级" initialValue="medium">
                    <Select>
                      <Option value="beginner">🟢 入门级</Option>
                      <Option value="intermediate">🟡 中级</Option>
                      <Option value="advanced">🟠 高级</Option>
                      <Option value="expert">🔴 专家级</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="interaction" label="互动方式" initialValue="group">
                    <Select>
                      <Option value="individual">个人思考</Option>
                      <Option value="pair">双人讨论</Option>
                      <Option value="group">小组协作</Option>
                      <Option value="class">全班互动</Option>
                      <Option value="online">在线互动</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="duration" label="建议时长" initialValue="45">
                    <Select>
                      <Option value="15">15分钟</Option>
                      <Option value="30">30分钟</Option>
                      <Option value="45">45分钟</Option>
                      <Option value="90">90分钟</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="assessment" label="评估方式" initialValue="discussion">
                    <Select>
                      <Option value="discussion">口头讨论</Option>
                      <Option value="report">书面报告</Option>
                      <Option value="presentation">演示汇报</Option>
                      <Option value="peer_review">同伴评议</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="materials" label="配套材料" initialValue="basic">
                    <Select>
                      <Option value="basic">基础材料</Option>
                      <Option value="multimedia">多媒体资料</Option>
                      <Option value="interactive">互动工具</Option>
                      <Option value="comprehensive">综合套装</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="learning_objectives" label="学习目标">
                    <TextArea rows={3} placeholder="请输入本案例的学习目标..." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="key_concepts" label="核心概念">
                    <TextArea rows={3} placeholder="请输入需要掌握的核心概念..." />
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item name="features" label="特色功能">
                <Checkbox.Group>
                  <Row>
                    <Col span={8}><Checkbox value="role_play">角色扮演</Checkbox></Col>
                    <Col span={8}><Checkbox value="decision_tree">决策树</Checkbox></Col>
                    <Col span={8}><Checkbox value="timeline">时间轴</Checkbox></Col>
                    <Col span={8}><Checkbox value="data_analysis">数据分析</Checkbox></Col>
                    <Col span={8}><Checkbox value="ethical_dilemma">伦理困境</Checkbox></Col>
                    <Col span={8}><Checkbox value="real_world">真实场景</Checkbox></Col>
                  </Row>
                </Checkbox.Group>
              </Form.Item>
            </div>
          );

        case 'question':
          return (
            <div>
              <Form.Item name="subject" label="学科" rules={[{ required: true, message: '请选择学科' }]}>
                <Select placeholder="选择学科">
                  {subjects.map(subject => (
                    <Option key={subject} value={subject}>{subject}</Option>
                  ))}
                </Select>
              </Form.Item>
              
              <Form.Item name="topic" label="知识点" rules={[{ required: true, message: '请输入知识点' }]}>
                <Input placeholder="请输入相关知识点..." />
              </Form.Item>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="question_types" label="题型选择" initialValue={["multiple"]}>
                    <Select mode="multiple" placeholder="选择题型">
                      <Option value="multiple">📋 单项选择</Option>
                      <Option value="multiple_choice">☑️ 多项选择</Option>
                      <Option value="true_false">✅ 判断题</Option>
                      <Option value="fill_blank">✏️ 填空题</Option>
                      <Option value="short_answer">📝 简答题</Option>
                      <Option value="essay">📚 论述题</Option>
                      <Option value="calculation">🔢 计算题</Option>
                      <Option value="analysis">🔍 分析题</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="difficulty" label="难度分布" initialValue="mixed">
                    <Select>
                      <Option value="easy">🟢 简单为主</Option>
                      <Option value="medium">🟡 中等为主</Option>
                      <Option value="hard">🔴 困难为主</Option>
                      <Option value="mixed">🎯 难度混合</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="count" label="题目数量" initialValue={10}>
                    <InputNumber min={1} max={200} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="knowledge_scope" label="知识点范围" initialValue="focused">
                    <Select>
                      <Option value="focused">单一知识点</Option>
                      <Option value="chapter">章节内容</Option>
                      <Option value="unit">单元综合</Option>
                      <Option value="comprehensive">综合测试</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="answer_detail" label="答案详细程度" initialValue="detailed">
                    <Select>
                      <Option value="simple">简单答案</Option>
                      <Option value="basic">基础解析</Option>
                      <Option value="detailed">详细解析</Option>
                      <Option value="comprehensive">全面分析</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="export_format" label="导出格式" initialValue="docx">
                    <Select>
                      <Option value="docx">Word文档</Option>
                      <Option value="pdf">PDF文件</Option>
                      <Option value="html">网页格式</Option>
                      <Option value="excel">Excel表格</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="time_limit" label="建议时间" initialValue="60">
                    <Select>
                      <Option value="30">30分钟</Option>
                      <Option value="60">60分钟</Option>
                      <Option value="90">90分钟</Option>
                      <Option value="120">120分钟</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="question_order" label="题目排序" initialValue="difficulty">
                    <Select>
                      <Option value="difficulty">按难度排序</Option>
                      <Option value="type">按题型排序</Option>
                      <Option value="random">随机排序</Option>
                      <Option value="knowledge">按知识点排序</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="score_system" label="评分系统" initialValue="standard">
                    <Select>
                      <Option value="standard">标准评分</Option>
                      <Option value="weighted">加权评分</Option>
                      <Option value="percentage">百分制</Option>
                      <Option value="grade">等级制</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item name="additional_content" label="附加内容">
                <TextArea rows={3} placeholder="请输入其他要求或说明..." />
              </Form.Item>
              
              <Form.Item name="features" label="特色功能">
                <Checkbox.Group>
                  <Row>
                    <Col span={8}><Checkbox value="images">图片题目</Checkbox></Col>
                    <Col span={8}><Checkbox value="charts">图表分析</Checkbox></Col>
                    <Col span={8}><Checkbox value="case_study">案例分析</Checkbox></Col>
                    <Col span={8}><Checkbox value="formula">公式编辑</Checkbox></Col>
                    <Col span={8}><Checkbox value="code">代码题目</Checkbox></Col>
                    <Col span={8}><Checkbox value="listening">听力材料</Checkbox></Col>
                  </Row>
                </Checkbox.Group>
              </Form.Item>
            </div>
          );

        case 'video':
          return (
            <div>
              <Form.Item name="topic" label="视频主题" rules={[{ required: true, message: '请输入视频主题' }]}>
                <Input placeholder="请输入视频的主题..." />
              </Form.Item>
              
              <Form.Item name="script" label="脚本内容">
                <TextArea rows={6} placeholder="请输入视频脚本或大纲..." />
              </Form.Item>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="style" label="视频风格" initialValue="animation">
                    <Select>
                      <Option value="animation">🎬 动画风格</Option>
                      <Option value="presenter">🎭 虚拟主播</Option>
                      <Option value="mixed">🎨 混合风格</Option>
                      <Option value="documentary">📹 纪录片式</Option>
                      <Option value="interactive">🎮 互动式</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="resolution" label="分辨率" initialValue="1080p">
                    <Select>
                      <Option value="720p">720P HD</Option>
                      <Option value="1080p">1080P FHD</Option>
                      <Option value="4k">4K UHD</Option>
                      <Option value="8k">8K UHD</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="duration" label="视频时长" initialValue="5-10">
                    <Select>
                      <Option value="1-3">1-3分钟</Option>
                      <Option value="5-10">5-10分钟</Option>
                      <Option value="10-20">10-20分钟</Option>
                      <Option value="20-30">20-30分钟</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="subtitles" label="字幕设置" initialValue="auto">
                    <Select>
                      <Option value="none">无字幕</Option>
                      <Option value="auto">自动生成</Option>
                      <Option value="manual">手动输入</Option>
                      <Option value="bilingual">双语字幕</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="background_music" label="背景音乐" initialValue="soft">
                    <Select>
                      <Option value="none">无背景音乐</Option>
                      <Option value="soft">轻柔音乐</Option>
                      <Option value="upbeat">欢快音乐</Option>
                      <Option value="professional">专业配乐</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="export_format" label="导出格式" initialValue="mp4">
                    <Select>
                      <Option value="mp4">MP4 视频</Option>
                      <Option value="mov">MOV 视频</Option>
                      <Option value="webm">WebM 视频</Option>
                      <Option value="gif">GIF 动图</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="voice_type" label="配音类型" initialValue="ai">
                    <Select>
                      <Option value="ai">AI 配音</Option>
                      <Option value="human">真人配音</Option>
                      <Option value="mix">混合配音</Option>
                      <Option value="silent">无配音</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="animation_speed" label="动画速度" initialValue="normal">
                    <Select>
                      <Option value="slow">慢速</Option>
                      <Option value="normal">正常</Option>
                      <Option value="fast">快速</Option>
                      <Option value="custom">自定义</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="color_scheme" label="色彩方案" initialValue="vibrant">
                    <Select>
                      <Option value="vibrant">鲜艳</Option>
                      <Option value="professional">专业</Option>
                      <Option value="pastel">淡雅</Option>
                      <Option value="monochrome">单色</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item name="learning_objectives" label="学习目标">
                <TextArea rows={3} placeholder="请输入本视频的学习目标..." />
              </Form.Item>
              
              <Form.Item name="features" label="特色功能">
                <Checkbox.Group>
                  <Row>
                    <Col span={8}><Checkbox value="quiz">视频测验</Checkbox></Col>
                    <Col span={8}><Checkbox value="chapters">章节标记</Checkbox></Col>
                    <Col span={8}><Checkbox value="notes">笔记功能</Checkbox></Col>
                    <Col span={8}><Checkbox value="replay">重点回放</Checkbox></Col>
                    <Col span={8}><Checkbox value="speed_control">倍速播放</Checkbox></Col>
                    <Col span={8}><Checkbox value="download">离线下载</Checkbox></Col>
                  </Row>
                </Checkbox.Group>
              </Form.Item>
            </div>
          );

        case 'audio':
          return (
            <div>
              <Form.Item name="content" label="音频内容" rules={[{ required: true, message: '请输入音频内容' }]}>
                <TextArea rows={4} placeholder="请输入要转换为音频的文本内容..." />
              </Form.Item>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="voice_type" label="声音类型" initialValue="female">
                    <Select>
                      <Option value="male">👨 男声</Option>
                      <Option value="female">👩 女声</Option>
                      <Option value="child">🧒 童声</Option>
                      <Option value="elderly">👴 老年声</Option>
                      <Option value="professional">🎯 专业播音</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="speed" label="语速" initialValue="normal">
                    <Select>
                      <Option value="very_slow">极慢</Option>
                      <Option value="slow">慢速</Option>
                      <Option value="normal">正常</Option>
                      <Option value="fast">快速</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="tone" label="音调" initialValue="natural">
                    <Select>
                      <Option value="low">低沉</Option>
                      <Option value="natural">自然</Option>
                      <Option value="high">明亮</Option>
                      <Option value="warm">温暖</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="background_music" label="背景音效" initialValue="none">
                    <Select>
                      <Option value="none">无背景音</Option>
                      <Option value="soft">轻柔音乐</Option>
                      <Option value="upbeat">欢快音乐</Option>
                      <Option value="calm">平静音乐</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="quality" label="音频质量" initialValue="high">
                    <Select>
                      <Option value="standard">标准品质</Option>
                      <Option value="high">高品质</Option>
                      <Option value="studio">录音室品质</Option>
                      <Option value="hifi">Hi-Fi 品质</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="format" label="导出格式" initialValue="mp3">
                    <Select>
                      <Option value="mp3">MP3 音频</Option>
                      <Option value="wav">WAV 音频</Option>
                      <Option value="flac">FLAC 无损</Option>
                      <Option value="aac">AAC 音频</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="emotion" label="情感色彩" initialValue="neutral">
                    <Select>
                      <Option value="neutral">中性</Option>
                      <Option value="happy">愉快</Option>
                      <Option value="serious">严肃</Option>
                      <Option value="friendly">友好</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="emphasis" label="重音设置" initialValue="auto">
                    <Select>
                      <Option value="auto">自动识别</Option>
                      <Option value="manual">手动标记</Option>
                      <Option value="none">无重音</Option>
                      <Option value="enhanced">增强重音</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="pause_control" label="停顿控制" initialValue="natural">
                    <Select>
                      <Option value="minimal">最少停顿</Option>
                      <Option value="natural">自然停顿</Option>
                      <Option value="extended">延长停顿</Option>
                      <Option value="custom">自定义</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item name="pronunciation_notes" label="发音说明">
                <TextArea rows={3} placeholder="请输入特殊发音要求或说明..." />
              </Form.Item>
              
              <Form.Item name="features" label="特色功能">
                <Checkbox.Group>
                  <Row>
                    <Col span={8}><Checkbox value="noise_reduction">降噪处理</Checkbox></Col>
                    <Col span={8}><Checkbox value="voice_clone">声音克隆</Checkbox></Col>
                    <Col span={8}><Checkbox value="multi_language">多语言</Checkbox></Col>
                    <Col span={8}><Checkbox value="ssml">SSML 标记</Checkbox></Col>
                    <Col span={8}><Checkbox value="phonetic">音标标注</Checkbox></Col>
                    <Col span={8}><Checkbox value="batch_process">批量处理</Checkbox></Col>
                  </Row>
                </Checkbox.Group>
              </Form.Item>
            </div>
          );

        case 'image':
          return (
            <div>
              <Form.Item name="description" label="图片描述" rules={[{ required: true, message: '请输入图片描述' }]}>
                <TextArea rows={4} placeholder="请详细描述您想要生成的图片..." />
              </Form.Item>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="style" label="绘画风格" initialValue="realistic">
                    <Select>
                      <Option value="realistic">📸 写实风格</Option>
                      <Option value="cartoon">🎨 卡通风格</Option>
                      <Option value="sketch">✏️ 素描风格</Option>
                      <Option value="watercolor">🎭 水彩风格</Option>
                      <Option value="oil">🖼️ 油画风格</Option>
                      <Option value="abstract">🌈 抽象风格</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="size" label="图像尺寸" initialValue="1024x1024">
                    <Select>
                      <Option value="512x512">512×512 (小)</Option>
                      <Option value="1024x1024">1024×1024 (标准)</Option>
                      <Option value="1920x1080">1920×1080 (高清)</Option>
                      <Option value="2048x2048">2048×2048 (4K)</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="color_style" label="色彩风格" initialValue="colorful">
                    <Select>
                      <Option value="colorful">彩色</Option>
                      <Option value="monochrome">黑白</Option>
                      <Option value="sepia">复古</Option>
                      <Option value="vibrant">鲜艳</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="purpose" label="图像用途" initialValue="general">
                    <Select>
                      <Option value="general">通用图片</Option>
                      <Option value="illustration">插图配图</Option>
                      <Option value="icon">图标设计</Option>
                      <Option value="background">背景图片</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="background" label="背景设置" initialValue="default">
                    <Select>
                      <Option value="default">默认背景</Option>
                      <Option value="transparent">透明背景</Option>
                      <Option value="white">白色背景</Option>
                      <Option value="custom">自定义</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="format" label="导出格式" initialValue="png">
                    <Select>
                      <Option value="png">PNG 图片</Option>
                      <Option value="jpg">JPG 图片</Option>
                      <Option value="svg">SVG 矢量</Option>
                      <Option value="webp">WebP 图片</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="lighting" label="光照效果" initialValue="natural">
                    <Select>
                      <Option value="natural">自然光</Option>
                      <Option value="studio">影棚光</Option>
                      <Option value="dramatic">戏剧性</Option>
                      <Option value="soft">柔和光</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="perspective" label="视角透视" initialValue="normal">
                    <Select>
                      <Option value="normal">正常视角</Option>
                      <Option value="bird">鸟瞰视角</Option>
                      <Option value="worm">仰视视角</Option>
                      <Option value="side">侧面视角</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="mood" label="情绪氛围" initialValue="neutral">
                    <Select>
                      <Option value="neutral">中性</Option>
                      <Option value="happy">欢快</Option>
                      <Option value="serious">严肃</Option>
                      <Option value="mysterious">神秘</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>
              
              <Form.Item name="negative_prompt" label="排除元素">
                <TextArea rows={2} placeholder="请输入不想要出现的元素..." />
              </Form.Item>
              
              <Form.Item name="reference_style" label="参考风格">
                <TextArea rows={2} placeholder="请输入参考的艺术家、作品或风格..." />
              </Form.Item>
              
              <Form.Item name="features" label="特色功能">
                <Checkbox.Group>
                  <Row>
                    <Col span={8}><Checkbox value="hdr">HDR 效果</Checkbox></Col>
                    <Col span={8}><Checkbox value="upscale">分辨率提升</Checkbox></Col>
                    <Col span={8}><Checkbox value="variations">生成变体</Checkbox></Col>
                    <Col span={8}><Checkbox value="inpainting">局部修复</Checkbox></Col>
                    <Col span={8}><Checkbox value="outpainting">画面扩展</Checkbox></Col>
                    <Col span={8}><Checkbox value="style_transfer">风格转换</Checkbox></Col>
                  </Row>
                </Checkbox.Group>
              </Form.Item>
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 0' }}>
        <div style={{
          background: currentType?.gradient,
          borderRadius: 16,
          padding: 40,
          marginBottom: 32,
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>
            {currentType?.icon}
          </div>
          <Title level={2} style={{ color: 'white', margin: 0 }}>
            创建{currentType?.title}
          </Title>
        </div>

        <Card 
          style={{ 
            borderRadius: 24, 
            border: 'none',
            boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            padding: '20px'
          }}
        >
          <Form 
            form={form} 
            layout="vertical" 
            onFinish={generateResource}
            size="large"
          >
            <div style={{ 
              marginBottom: 32,
              padding: '24px',
              background: 'linear-gradient(135deg, #f8fafc 0%, #e3f2fd 100%)',
              borderRadius: 16,
              border: '1px solid rgba(0,0,0,0.05)'
            }}>
              <Title level={4} style={{ 
                marginBottom: 16, 
                color: '#1976d2',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                📝 输入内容
                <Badge count="智能输入" style={{ backgroundColor: '#52c41a', fontSize: 10 }} />
              </Title>
              <MultimodalInput onInput={handleMultimodalInput} />
            </div>

            <Divider style={{ margin: '32px 0', borderColor: '#e8f5e8' }} />

            <div style={{ 
              marginBottom: 32,
              padding: '24px',
              background: 'linear-gradient(135deg, #f9f0ff 0%, #e8f5e8 100%)',
              borderRadius: 16,
              border: '1px solid rgba(0,0,0,0.05)'
            }}>
              <Title level={4} style={{ 
                marginBottom: 20, 
                color: '#722ed1',
                display: 'flex',
                alignItems: 'center',
                gap: 12
              }}>
                ⚙️ 详细设置
                <Badge count="专业配置" style={{ backgroundColor: '#722ed1', fontSize: 10 }} />
              </Title>
              {getTypeSpecificForm()}
            </div>

            <div style={{ 
              textAlign: 'center', 
              paddingTop: 32,
              borderTop: '2px dashed #e8f5e8',
              marginTop: 32
            }}>
              {!generating && (
                <Text 
                  type="secondary" 
                  style={{ 
                    display: 'block', 
                    marginTop: 16, 
                    fontSize: 14 
                  }}
                >
                  💡 预计生成时间：2-5分钟，请耐心等待
                </Text>
              )}
            </div>
          </Form>
        </Card>

        {generating && (
          <Card style={{ 
            marginTop: 32, 
            borderRadius: 24,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 12px 48px rgba(0,0,0,0.15)',
            border: 'none',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {/* 顶部彩色条纹 */}
            <div style={{
              height: 6,
              background: currentType?.gradient,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 3
            }} />
            
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px',
              position: 'relative'
            }}>
              {/* 背景装饰 */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '200px',
                height: '200px',
                background: `${currentType?.color}08`,
                borderRadius: '50%',
                zIndex: 1
              }} />
              
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: currentType?.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  boxShadow: `0 8px 32px ${currentType?.color}40`,
                  animation: 'pulse 2s infinite'
                }}>
                  <Spin size="large" style={{ color: 'white' }} />
                </div>
                
                <Title level={3} style={{ 
                  margin: '0 0 12px 0',
                  color: currentType?.darkColor,
                  fontWeight: 700
                }}>
                  🚀 AI正在创作中...
                </Title>
                
                <Text style={{ 
                  fontSize: 16, 
                  color: '#666',
                  display: 'block',
                  marginBottom: 24
                }}>
                  正在为您生成专业的{currentType?.title}，请稍候
                </Text>
                
                <div style={{ 
                  maxWidth: 400, 
                  margin: '0 auto',
                  background: '#f8fafc',
                  borderRadius: 16,
                  padding: '20px'
                }}>
                  <Progress 
                    percent={Math.round(progress)} 
                    strokeColor={{
                      '0%': currentType?.color || '#1890ff',
                      '100%': currentType?.darkColor || '#0050b3'
                    }}
                    trailColor="#e8f5e8"
                    strokeWidth={12}
                    format={(percent) => (
                      <span style={{ 
                        color: currentType?.darkColor,
                        fontWeight: 600,
                        fontSize: 16
                      }}>
                        {percent}%
                      </span>
                    )}
                  />
                  
                  <div style={{ 
                    marginTop: 16,
                    fontSize: 14,
                    color: '#999',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>⏱️ 预计还需 {Math.max(1, Math.ceil((100 - progress) / 20))} 分钟</span>
                    <span>🎯 质量优先</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    );
  };

  const renderHistory = () => (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 0' }}>
      <div style={{ marginBottom: 32 }}>
        <Title level={2}>我的作品</Title>
        <Text type="secondary">查看和管理您创建的所有资源</Text>
      </div>

      {generatedResources.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: 60, borderRadius: 16 }}>
          <div style={{ fontSize: 64, marginBottom: 24, opacity: 0.3 }}>
            📁
          </div>
          <Title level={3} type="secondary">暂无作品</Title>
          <Text type="secondary">开始创建您的第一个资源吧！</Text>
          <div style={{ marginTop: 24 }}>
            <Button 
              type="primary" 
              size="large"
              onClick={() => setActiveTab('overview')}
              style={{ borderRadius: 25 }}
            >
              立即创建
            </Button>
          </div>
        </Card>
      ) : (
        <Row gutter={[24, 24]}>
          {generatedResources.map((resource) => {
            const typeInfo = resourceTypes.find(t => t.key === resource.type);
            return (
              <Col key={resource.id} xs={24} sm={12} lg={8}>
                <Card
                  hoverable
                  style={{ 
                    borderRadius: 16,
                    height: 280
                  }}
                  cover={
                    <div style={{
                      height: 140,
                      background: typeInfo?.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '16px 16px 0 0'
                    }}>
                      <div style={{ fontSize: 48, color: 'white' }}>
                        {typeInfo?.icon}
                      </div>
                    </div>
                  }
                  actions={[
                    <Tooltip title="预览">
                      <EyeOutlined onClick={() => previewResource(resource)} />
                    </Tooltip>,
                    <Tooltip title="下载">
                      <DownloadOutlined 
                        onClick={() => downloadResource(resource)}
                        style={{ 
                          color: resource.status === 'completed' ? '#52c41a' : '#d9d9d9'
                        }}
                      />
                    </Tooltip>,
                    <Tooltip title="删除">
                      <DeleteOutlined 
                        onClick={() => {
                          Modal.confirm({
                            title: '确定要删除这个资源吗？',
                            content: '删除后将无法恢复，请谨慎操作。',
                            okText: '确定删除',
                            okType: 'danger',
                            cancelText: '取消',
                            onOk: () => deleteResource(resource)
                          });
                        }}
                        style={{ color: '#ff4d4f' }} 
                      />
                    </Tooltip>
                  ]}
                >
                  <Card.Meta
                    title={
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Text ellipsis style={{ flex: 1 }}>{resource.title}</Text>
                        <Badge 
                          status={
                            resource.status === 'completed' ? 'success' : 
                            resource.status === 'generating' ? 'processing' : 'error'
                          }
                          text={
                            resource.status === 'completed' ? '完成' : 
                            resource.status === 'generating' ? '生成中' : '失败'
                          }
                        />
                      </div>
                    }
                    description={
                      <div>
                        <Text type="secondary" ellipsis>
                          {resource.description || typeInfo?.description}
                        </Text>
                        <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                          {new Date(resource.createdAt).toLocaleString()}
                        </div>
                      </div>
                    }
                  />
                  
                  {resource.status === 'generating' && (
                    <Progress 
                      percent={resource.progress} 
                      size="small" 
                      style={{ marginTop: 8 }}
                    />
                  )}
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh',
      background: MAIN_GRADIENT,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 背景装饰 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
        background: 'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.12) 0%, transparent 60%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.10) 0%, transparent 60%)',
      }} />

      {/* 头部导航Tabs */}
      <div style={{
        background: TAB_BG,
        backdropFilter: TAB_BLUR,
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 4px 32px rgba(0,0,0,0.08)',
        height: TAB_HEIGHT,
        display: 'flex',
        alignItems: 'center',
      }}>
        <div style={{ 
          maxWidth: 1200, 
          margin: '0 auto', 
          padding: '0 24px',
          width: '100%'
        }}>
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            centered
            size="large"
            style={{ border: 'none', fontWeight: 700, fontSize: TAB_FONT }}
            tabBarStyle={{ height: TAB_HEIGHT, fontWeight: 700 }}
            moreIcon={null}
          >
            <Tabs.TabPane tab={<span style={{color: activeTab==='overview'?TAB_ACTIVE_COLOR:TAB_INACTIVE_COLOR, fontWeight:700}}>🏠 创作中心</span>} key="overview" />
            <Tabs.TabPane tab={<span style={{color: activeTab==='create'?TAB_ACTIVE_COLOR:TAB_INACTIVE_COLOR, fontWeight:700}}>✨ 开始创作</span>} key="create" disabled={!selectedType} />
            <Tabs.TabPane tab={<span style={{color: activeTab==='history'?TAB_ACTIVE_COLOR:TAB_INACTIVE_COLOR, fontWeight:700}}>📂 我的作品</span>} key="history" />
          </Tabs>
        </div>
      </div>

      {/* 主要内容区 */}
      <div style={{ padding: '48px 0', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          {activeTab === 'overview' && (
            <div>
              {/* 标题区 */}
              <div style={{ 
                textAlign: 'center', 
                marginBottom: 60,
                padding: '80px 0',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '320px',
                  height: '320px',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.13) 0%, transparent 70%)',
                  borderRadius: '50%',
                  zIndex: -1
                }} />
                <div style={{
                  display: 'inline-block',
                  padding: '24px',
                  background: 'rgba(255,255,255,0.13)',
                  borderRadius: '24px',
                  marginBottom: '30px',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.18)'
                }}>
                  <RocketOutlined style={{ fontSize: 56, color: '#fff' }} />
                </div>
                <Title 
                  level={1} 
                  style={{ 
                    fontSize: 56, 
                    color: '#fff',
                    fontWeight: 800,
                    marginBottom: 16
                  }}
                >AI 教学资源创作中心</Title>
                <Paragraph style={{ color: 'rgba(255,255,255,0.92)', fontSize: 20, marginBottom: 0 }}>
                  基于前沿AI技术的智能化教学资源生成平台，让创作变得简单高效，专业工具助您轻松制作各类教学资源
                </Paragraph>
              </div>
              {/* 资源类型卡片区 */}
              <div style={{ marginBottom: 64 }}>
                {renderResourceTypes()}
              </div>
            </div>
          )}
          {activeTab === 'create' && (
            <div style={{
              maxWidth: 800,
              margin: '0 auto',
              background: 'rgba(255,255,255,0.98)',
              borderRadius: CARD_RADIUS,
              boxShadow: CARD_SHADOW,
              padding: '48px 40px',
              marginBottom: 48
            }}>
              <Title level={2} style={{ color: TAB_ACTIVE_COLOR, fontWeight: 700, marginBottom: 32 }}>✨ 开始创作</Title>
              <Form
                form={form}
                layout="vertical"
                onFinish={generateResource}
                style={{ marginTop: 24 }}
              >
                {renderCreateForm()}
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    style={{
                      width: '100%',
                      background: BTN_GRADIENT,
                      border: 'none',
                      borderRadius: BTN_RADIUS,
                      height: BTN_HEIGHT,
                      fontWeight: 700,
                      fontSize: 18,
                      boxShadow: '0 4px 16px #5b8cfa30',
                      marginTop: 24
                    }}
                  >
                    立即生成
                  </Button>
                </Form.Item>
              </Form>
            </div>
          )}
          {activeTab === 'history' && (
            <div style={{ marginTop: 32 }}>{renderHistory()}</div>
          )}
        </div>
      </div>
    </div>
  );
} 