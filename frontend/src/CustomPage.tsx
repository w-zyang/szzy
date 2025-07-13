import React, { useState } from 'react';
import { 
  Card, Row, Col, Typography, Button, Form, Upload, Radio, Input, Select, 
  Steps, Progress, Avatar, List, Tag, Modal, Space, Divider, Tabs, Badge,
  Slider, Switch, message
} from 'antd';
import { 
  RobotOutlined, UserOutlined, AudioOutlined, CameraOutlined, PlayCircleOutlined,
  UploadOutlined, EditOutlined, DeleteOutlined, EyeOutlined, PlusOutlined,
  SettingOutlined, HeartOutlined, StarOutlined, ThunderboltOutlined,
  VideoCameraOutlined, BulbOutlined, CrownOutlined,
  FileImageOutlined, SoundOutlined, ExperimentOutlined, CheckCircleOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

interface DigitalPerson {
  id: string;
  name: string;
  type: 'teacher' | 'assistant' | 'presenter' | 'custom';
  avatar: string;
  voice: string;
  personality: string;
  skills: string[];
  status: 'active' | 'training' | 'inactive';
  usage: number;
  rating: number;
  createdAt: string;
}

const digitalPersonTemplates = [
  {
    id: '1',
    name: '智慧教师小李',
    type: 'teacher',
    avatar: '/avatars/teacher-female.jpg',
    personality: '温和耐心，善于引导',
    skills: ['数学教学', '互动答疑', '课堂管理'],
    description: '专业的数学教师形象，擅长复杂概念的简化讲解'
  },
  {
    id: '2',
    name: '科技助手小智',
    type: 'assistant',
    avatar: '/avatars/tech-assistant.jpg',
    personality: '专业高效，逻辑清晰',
    skills: ['技术支持', '问题解答', '操作指导'],
    description: '技术专家助手，帮助解决各种技术问题'
  },
  {
    id: '3',
    name: '演讲大师小王',
    type: 'presenter',
    avatar: '/avatars/presenter-male.jpg',
    personality: '自信大方，表达力强',
    skills: ['演讲展示', '内容讲解', '互动主持'],
    description: '专业演讲者，适合重要场合的内容展示'
  },
  {
    id: '4',
    name: '创意设计师小美',
    type: 'custom',
    avatar: '/avatars/designer-female.jpg',
    personality: '创新活泼，富有想象力',
    skills: ['创意设计', '美学指导', '灵感启发'],
    description: '创意设计专家，为您提供美学和设计指导'
  }
];

const voiceTemplates = [
  { id: '1', name: '温暖女声', type: 'female', age: 'young', style: 'warm', preview: '/voice/warm-female.mp3' },
  { id: '2', name: '专业男声', type: 'male', age: 'middle', style: 'professional', preview: '/voice/professional-male.mp3' },
  { id: '3', name: '活力少女', type: 'female', age: 'young', style: 'energetic', preview: '/voice/energetic-female.mp3' },
  { id: '4', name: '沉稳男声', type: 'male', age: 'mature', style: 'calm', preview: '/voice/calm-male.mp3' }
];

const creationSteps = [
  { title: '选择类型', description: '选择数字人的基础类型' },
  { title: '形象设计', description: '定制外观和特征' },
  { title: '声音配置', description: '设置语音和语调' },
  { title: '个性设定', description: '配置性格和技能' },
  { title: '测试优化', description: '测试效果并优化' }
];

export default function CustomPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedVoice, setSelectedVoice] = useState<any>(null);
  const [creationModal, setCreationModal] = useState(false);
  const [previewModal, setPreviewModal] = useState(false);
  const [myDigitalPersons, setMyDigitalPersons] = useState<DigitalPerson[]>([
    {
      id: '1',
      name: '我的专属教师',
      type: 'teacher',
      avatar: '/avatars/my-teacher.jpg',
      voice: '温暖女声',
      personality: '温和耐心',
      skills: ['数学', '物理', '化学'],
      status: 'active',
      usage: 85,
      rating: 4.8,
      createdAt: '2024-01-15'
    }
  ]);

  const handleCreateDigitalPerson = () => {
    setCreationModal(true);
    setCurrentStep(0);
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setCurrentStep(1);
  };

  const handleVoiceSelect = (voice: any) => {
    setSelectedVoice(voice);
  };

  const handleNextStep = () => {
    if (currentStep < creationSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <Title level={4}>选择数字人类型</Title>
            <Row gutter={[16, 16]}>
              {digitalPersonTemplates.map(template => (
                <Col span={12} key={template.id}>
                  <Card
                    hoverable
                    className={selectedTemplate?.id === template.id ? 'selected' : ''}
                    onClick={() => handleTemplateSelect(template)}
                    style={{ 
                      border: selectedTemplate?.id === template.id ? '2px solid #1890ff' : '1px solid #d9d9d9' 
                    }}
                  >
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <Avatar size={64} icon={<RobotOutlined />} />
                    </div>
                    <Card.Meta
                      title={template.name}
                      description={template.description}
                    />
                    <div style={{ marginTop: 12 }}>
                      <Space wrap>
                        {template.skills.map(skill => (
                          <Tag key={skill}>{skill}</Tag>
                        ))}
                      </Space>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        );
      case 1:
        return (
          <div>
            <Title level={4}>形象设计</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Card title="基础设置">
                  <Form layout="vertical">
                    <Form.Item label="性别">
                      <Radio.Group defaultValue="female">
                        <Radio value="female">女性</Radio>
                        <Radio value="male">男性</Radio>
                      </Radio.Group>
                    </Form.Item>
                    <Form.Item label="年龄段">
                      <Select defaultValue="young" style={{ width: '100%' }}>
                        <Option value="young">青年 (20-30岁)</Option>
                        <Option value="middle">中年 (30-45岁)</Option>
                        <Option value="mature">成熟 (45-60岁)</Option>
                      </Select>
                    </Form.Item>
                    <Form.Item label="风格">
                      <Select defaultValue="professional" style={{ width: '100%' }}>
                        <Option value="professional">专业</Option>
                        <Option value="friendly">友好</Option>
                        <Option value="energetic">活力</Option>
                        <Option value="elegant">优雅</Option>
                      </Select>
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="外观预览">
                  <div style={{ 
                    height: 200, 
                    background: '#f5f5f5', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderRadius: 8
                  }}>
                    <Avatar size={120} icon={<UserOutlined />} />
                  </div>
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <Button icon={<UploadOutlined />}>上传自定义头像</Button>
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        );
      case 2:
        return (
          <div>
            <Title level={4}>声音配置</Title>
            <Row gutter={[16, 16]}>
              {voiceTemplates.map(voice => (
                <Col span={12} key={voice.id}>
                  <Card
                    hoverable
                    className={selectedVoice?.id === voice.id ? 'selected' : ''}
                    onClick={() => handleVoiceSelect(voice)}
                    style={{ 
                      border: selectedVoice?.id === voice.id ? '2px solid #1890ff' : '1px solid #d9d9d9' 
                    }}
                    actions={[
                      <Button 
                        icon={<PlayCircleOutlined />} 
                        type="link"
                        onClick={(e) => {
                          e.stopPropagation();
                          // 播放语音预览
                        }}
                      >
                        试听
                      </Button>
                    ]}
                  >
                    <Card.Meta
                      title={voice.name}
                      description={
                        <Space>
                          <Tag>{voice.type === 'male' ? '男声' : '女声'}</Tag>
                          <Tag>{voice.style}</Tag>
                        </Space>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
            <Divider />
            <Card title="高级语音设置">
              <Row gutter={16}>
                <Col span={8}>
                  <div>
                    <Text>语速调节</Text>
                    <Slider defaultValue={50} />
                  </div>
                </Col>
                <Col span={8}>
                  <div>
                    <Text>音调调节</Text>
                    <Slider defaultValue={50} />
                  </div>
                </Col>
                <Col span={8}>
                  <div>
                    <Text>音量调节</Text>
                    <Slider defaultValue={80} />
                  </div>
                </Col>
              </Row>
            </Card>
          </div>
        );
      case 3:
        return (
          <div>
            <Title level={4}>个性设定</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Card title="基础信息">
                  <Form layout="vertical">
                    <Form.Item label="数字人名称">
                      <Input placeholder="为您的数字人起个名字" />
                    </Form.Item>
                    <Form.Item label="个性描述">
                      <TextArea 
                        rows={3} 
                        placeholder="描述数字人的性格特点，如：温和耐心、专业严谨等" 
                      />
                    </Form.Item>
                    <Form.Item label="专业领域">
                      <Select mode="multiple" placeholder="选择专业领域" style={{ width: '100%' }}>
                        <Option value="math">数学</Option>
                        <Option value="physics">物理</Option>
                        <Option value="chemistry">化学</Option>
                        <Option value="biology">生物</Option>
                        <Option value="chinese">语文</Option>
                        <Option value="english">英语</Option>
                      </Select>
                    </Form.Item>
                  </Form>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="互动设置">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text>启用表情动画</Text>
                      <Switch defaultChecked />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text>启用手势动作</Text>
                      <Switch defaultChecked />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text>智能对话</Text>
                      <Switch defaultChecked />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text>情感识别</Text>
                      <Switch />
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </div>
        );
      case 4:
        return (
          <div>
            <Title level={4}>测试与优化</Title>
            <Row gutter={16}>
              <Col span={16}>
                <Card title="数字人预览">
                  <div style={{ 
                    height: 300, 
                    background: '#f5f5f5', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderRadius: 8,
                    position: 'relative'
                  }}>
                    <Avatar size={200} icon={<RobotOutlined />} />
                    <Button 
                      type="primary" 
                      icon={<PlayCircleOutlined />}
                      style={{ position: 'absolute', bottom: 20 }}
                    >
                      开始测试对话
                    </Button>
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card title="配置总结">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div><Text strong>名称：</Text>{selectedTemplate?.name || '未设置'}</div>
                    <div><Text strong>类型：</Text>{selectedTemplate?.type || '未选择'}</div>
                    <div><Text strong>声音：</Text>{selectedVoice?.name || '未选择'}</div>
                    <div><Text strong>技能：</Text>
                      <div style={{ marginTop: 4 }}>
                        {selectedTemplate?.skills.map((skill: string) => (
                          <Tag key={skill}>{skill}</Tag>
                        ))}
                      </div>
                    </div>
                  </Space>
                  <Divider />
                  <Button 
                    type="primary" 
                    block 
                    onClick={() => {
                      message.success('数字人创建成功！');
                      setCreationModal(false);
                    }}
                  >
                    完成创建
                  </Button>
                </Card>
              </Col>
            </Row>
          </div>
        );
      default:
        return null;
    }
  };

  const tabItems = [
    {
      key: 'overview',
      label: '概览',
      children: (
        <div>
          {/* 功能介绍横幅 */}
          <Card 
            style={{ 
              marginBottom: 24, 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              color: 'white'
            }}
          >
            <Row align="middle">
              <Col span={16}>
                <Title level={2} style={{ color: 'white', marginBottom: 8 }}>
                  <RobotOutlined style={{ marginRight: 12 }} />
                  数字人定制中心
                </Title>
                <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, marginBottom: 16 }}>
                  利用先进的AI技术，创造专属的数字教师和助手，为您的教学提供个性化支持
                </Paragraph>
                <Space size="large">
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold' }}>50+</div>
                    <div style={{ fontSize: 12 }}>预置模板</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold' }}>20+</div>
                    <div style={{ fontSize: 12 }}>声音选择</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 24, fontWeight: 'bold' }}>10000+</div>
                    <div style={{ fontSize: 12 }}>用户创建</div>
                  </div>
                </Space>
              </Col>
              <Col span={8} style={{ textAlign: 'center' }}>
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<PlusOutlined />}
                  onClick={handleCreateDigitalPerson}
                  style={{ 
                    background: 'rgba(255,255,255,0.2)', 
                    border: '1px solid rgba(255,255,255,0.3)',
                    height: 48
                  }}
                >
                  创建数字人
                </Button>
              </Col>
            </Row>
          </Card>

          {/* 功能特色 */}
          <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
            <Col span={6}>
              <Card style={{ textAlign: 'center', height: 200 }}>
                <Avatar 
                  size={64} 
                  style={{ background: '#1890ff', marginBottom: 16 }} 
                  icon={<UserOutlined />} 
                />
                <Title level={4}>智能形象生成</Title>
                <Paragraph style={{ color: '#666' }}>
                  AI驱动的形象设计，支持多种风格定制
                </Paragraph>
              </Card>
            </Col>
            <Col span={6}>
              <Card style={{ textAlign: 'center', height: 200 }}>
                <Avatar 
                  size={64} 
                  style={{ background: '#52c41a', marginBottom: 16 }} 
                  icon={<AudioOutlined />} 
                />
                <Title level={4}>语音克隆技术</Title>
                <Paragraph style={{ color: '#666' }}>
                  高度还原的语音合成，支持多语言
                </Paragraph>
              </Card>
            </Col>
            <Col span={6}>
              <Card style={{ textAlign: 'center', height: 200 }}>
                <Avatar 
                  size={64} 
                  style={{ background: '#fa8c16', marginBottom: 16 }} 
                  icon={<ExperimentOutlined />} 
                />
                <Title level={4}>智能互动</Title>
                <Paragraph style={{ color: '#666' }}>
                  自然的对话交互，情感表达丰富
                </Paragraph>
              </Card>
            </Col>
            <Col span={6}>
              <Card style={{ textAlign: 'center', height: 200 }}>
                <Avatar 
                  size={64} 
                  style={{ background: '#722ed1', marginBottom: 16 }} 
                  icon={<ThunderboltOutlined />} 
                />
                <Title level={4}>实时渲染</Title>
                <Paragraph style={{ color: '#666' }}>
                  高性能实时渲染，流畅的动画效果
                </Paragraph>
              </Card>
            </Col>
          </Row>

          {/* 模板展示 */}
          <Card title="热门数字人模板" extra={<Button type="link">查看全部</Button>}>
            <Row gutter={[16, 16]}>
              {digitalPersonTemplates.map(template => (
                <Col span={6} key={template.id}>
                  <Card
                    hoverable
                    cover={
                      <div style={{ 
                        height: 120, 
                        background: 'linear-gradient(45deg, #f0f2f5, #d9d9d9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Avatar size={64} icon={<RobotOutlined />} />
                      </div>
                    }
                    actions={[
                      <Button 
                        key="preview" 
                        type="link" 
                        icon={<EyeOutlined />}
                        onClick={() => setPreviewModal(true)}
                      >
                        预览
                      </Button>,
                      <Button 
                        key="use" 
                        type="link" 
                        icon={<PlusOutlined />}
                        onClick={handleCreateDigitalPerson}
                      >
                        使用
                      </Button>
                    ]}
                  >
                    <Card.Meta
                      title={template.name}
                      description={
                        <div>
                          <Tag color="blue">{template.type}</Tag>
                          <div style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                            {template.description}
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </div>
      )
    },
    {
      key: 'my-digital-persons',
      label: '我的数字人',
      children: (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4}>我的数字人 ({myDigitalPersons.length})</Title>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreateDigitalPerson}
            >
              创建新的数字人
            </Button>
          </div>
          
          <Row gutter={[16, 16]}>
            {myDigitalPersons.map(person => (
              <Col span={8} key={person.id}>
                <Card
                  cover={
                    <div style={{ 
                      height: 160, 
                      background: 'linear-gradient(45deg, #f0f2f5, #d9d9d9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative'
                    }}>
                      <Avatar size={80} icon={<RobotOutlined />} />
                      <Badge 
                        status={person.status === 'active' ? 'success' : 'default'} 
                        text={person.status === 'active' ? '运行中' : '未激活'}
                        style={{ position: 'absolute', top: 10, right: 10 }}
                      />
                    </div>
                  }
                  actions={[
                    <Button key="edit" type="link" icon={<EditOutlined />}>编辑</Button>,
                    <Button key="preview" type="link" icon={<EyeOutlined />}>预览</Button>,
                    <Button key="delete" type="link" danger icon={<DeleteOutlined />}>删除</Button>
                  ]}
                >
                  <Card.Meta
                    title={person.name}
                    description={
                      <div>
                        <div style={{ marginBottom: 8 }}>
                          <Tag color="blue">{person.type}</Tag>
                          <Tag color="green">评分 {person.rating}</Tag>
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <Text strong>使用率：</Text>
                          <Progress percent={person.usage} size="small" />
                        </div>
                        <div>
                          <Text strong>技能：</Text>
                          <Space wrap style={{ marginTop: 4 }}>
                            {person.skills.map(skill => (
                              <Tag key={skill}>{skill}</Tag>
                            ))}
                          </Space>
                        </div>
                      </div>
                    }
                  />
                </Card>
              </Col>
            ))}
            
            {/* 创建新数字人的占位卡片 */}
            <Col span={8}>
              <Card
                style={{ 
                  height: 400, 
                  border: '2px dashed #d9d9d9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                onClick={handleCreateDigitalPerson}
                hoverable
              >
                <div style={{ textAlign: 'center' }}>
                  <PlusOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                  <div style={{ color: '#999' }}>创建新的数字人</div>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      )
    },
    {
      key: 'voice-lab',
      label: '声音实验室',
      children: (
        <div>
          <Card title="声音克隆实验室" style={{ marginBottom: 24 }}>
            <Paragraph>
              上传您的声音样本，AI将学习并复制您的声音特征，创造专属的数字声音。
            </Paragraph>
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="录制声音样本">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button icon={<AudioOutlined />} size="large" type="primary">
                      开始录制
                    </Button>
                    <Text type="secondary">建议录制3-5分钟，内容丰富的语音样本</Text>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="上传音频文件">
                  <Upload.Dragger>
                    <p className="ant-upload-drag-icon">
                      <SoundOutlined />
                    </p>
                    <p className="ant-upload-text">点击或拖拽音频文件到这里</p>
                    <p className="ant-upload-hint">支持 MP3, WAV, M4A 格式</p>
                  </Upload.Dragger>
                </Card>
              </Col>
            </Row>
          </Card>

          <Card title="预设声音库">
            <Row gutter={[16, 16]}>
              {voiceTemplates.map(voice => (
                <Col span={6} key={voice.id}>
                  <Card
                    size="small"
                    hoverable
                    actions={[
                      <Button key="play" type="link" icon={<PlayCircleOutlined />}>试听</Button>,
                      <Button key="use" type="link">使用</Button>
                    ]}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <Avatar 
                        size={48} 
                        icon={voice.type === 'male' ? <UserOutlined /> : <UserOutlined />}
                        style={{ marginBottom: 12 }}
                      />
                      <div style={{ fontWeight: 'bold' }}>{voice.name}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        {voice.type === 'male' ? '男声' : '女声'} · {voice.style}
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </div>
      )
    }
  ];

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
        
        {/* 创建数字人模态框 */}
        <Modal
          title="创建数字人"
          open={creationModal}
          onCancel={() => setCreationModal(false)}
          footer={null}
          width={800}
          destroyOnHidden
        >
          <Steps current={currentStep} style={{ marginBottom: 24 }}>
            {creationSteps.map((step, index) => (
              <Step key={index} title={step.title} description={step.description} />
            ))}
          </Steps>
          
          <div style={{ marginBottom: 24 }}>
            {renderStepContent()}
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <Space>
              {currentStep > 0 && (
                <Button onClick={handlePrevStep}>上一步</Button>
              )}
              {currentStep < creationSteps.length - 1 && (
                <Button type="primary" onClick={handleNextStep}>下一步</Button>
              )}
            </Space>
          </div>
        </Modal>

        {/* 预览模态框 */}
        <Modal
          title="数字人预览"
          open={previewModal}
          onCancel={() => setPreviewModal(false)}
          footer={null}
          width={600}
        >
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Avatar size={120} icon={<RobotOutlined />} style={{ marginBottom: 20 }} />
            <Title level={4}>数字教师演示</Title>
            <Paragraph>这是一个数字人预览演示...</Paragraph>
            <Button type="primary" icon={<PlayCircleOutlined />}>
              开始对话演示
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
} 