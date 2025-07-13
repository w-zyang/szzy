import React, { useState } from 'react';
import { Card, Row, Col, Typography, Steps, Button, Collapse, Tag, Input, Space, Avatar, Progress, List, Divider, Badge, Tabs } from 'antd';
import { 
  PlayCircleOutlined, 
  FileTextOutlined, 
  VideoCameraOutlined, 
  BookOutlined,
  RobotOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  UserOutlined,
  StarOutlined,
  BulbOutlined,
  QuestionCircleOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  CodeOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ExperimentOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { Step } = Steps;
const { Panel } = Collapse;
const { Search } = Input;

interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'video' | 'document' | 'interactive';
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  views: number;
  rating: number;
  author: string;
  tags: string[];
  content?: string;
  videoUrl?: string;
  steps?: string[];
}

const tutorialData: Tutorial[] = [
  {
    id: '1',
    title: '平台快速入门指南',
    description: '了解平台的基本功能和使用方法，快速上手数字资源生成',
    category: '入门指南',
    type: 'video',
    level: 'beginner',
    duration: '15分钟',
    views: 1250,
    rating: 4.8,
    author: '平台官方',
    tags: ['入门', '基础', '快速上手'],
    videoUrl: '/demo/platform-intro.mp4',
    steps: [
      '注册和登录账户',
      '熟悉主界面布局',
      '了解核心功能模块',
      '创建第一个资源'
    ]
  },
  {
    id: '2',
    title: '多模态输入完全指南',
    description: '深入学习文本、语音、图像等多种输入方式的使用技巧',
    category: '核心功能',
    type: 'document',
    level: 'intermediate',
    duration: '25分钟',
    views: 980,
    rating: 4.9,
    author: '技术专家',
    tags: ['多模态', '输入方式', '进阶'],
    content: `
## 多模态输入技术介绍

### 1. 文本输入
- 支持富文本编辑
- 智能语法检查
- 自动格式化

### 2. 语音输入
- 高精度语音识别
- 实时转写功能
- 多语言支持

### 3. 图像输入
- OCR文字识别
- 图像内容理解
- 智能标注功能
    `
  },
  {
    id: '3',
    title: 'AI智能PPT生成教程',
    description: '学习如何使用AI技术快速生成高质量的PPT课件',
    category: '核心功能',
    type: 'interactive',
    level: 'beginner',
    duration: '20分钟',
    views: 1580,
    rating: 4.7,
    author: '教学专家',
    tags: ['PPT', 'AI生成', '教学'],
    steps: [
      '输入主题和要求',
      '选择模板和风格',
      'AI生成大纲',
      '优化和调整内容',
      '导出和分享'
    ]
  },
  {
    id: '4',
    title: '视频制作进阶技巧',
    description: '掌握视频编辑、特效添加、音频处理等高级功能',
    category: '高级功能',
    type: 'video',
    level: 'advanced',
    duration: '35分钟',
    views: 720,
    rating: 4.6,
    author: '视频专家',
    tags: ['视频编辑', '特效', '音频'],
    videoUrl: '/demo/video-advanced.mp4'
  },
  {
    id: '5',
    title: '教学案例设计方法',
    description: '学习如何设计有效的教学案例，提高教学质量',
    category: '教学方法',
    type: 'document',
    level: 'intermediate',
    duration: '30分钟',
    views: 660,
    rating: 4.8,
    author: '教育专家',
    tags: ['案例设计', '教学方法', '教育'],
    content: `
## 教学案例设计原则

### 1. 真实性原则
- 案例应基于真实情境
- 贴近学生实际经验
- 具有现实意义

### 2. 启发性原则
- 能够引发思考
- 激发学习兴趣
- 促进主动学习

### 3. 层次性原则
- 难度递进
- 循序渐进
- 适合不同水平学生
    `
  },
  {
    id: '6',
    title: '资源管理最佳实践',
    description: '学习如何有效管理和组织数字教学资源',
    category: '管理技巧',
    type: 'interactive',
    level: 'beginner',
    duration: '18分钟',
    views: 890,
    rating: 4.5,
    author: '管理专家',
    tags: ['资源管理', '组织', '效率'],
    steps: [
      '建立分类体系',
      '使用标签系统',
      '定期整理归档',
      '共享和协作',
      '版本控制'
    ]
  }
];

const categories = ['全部', '入门指南', '核心功能', '高级功能', '教学方法', '管理技巧'];

const quickStartSteps = [
  {
    title: '注册登录',
    description: '创建账户并完善个人信息',
    icon: <UserOutlined />
  },
  {
    title: '熟悉界面',
    description: '了解主要功能模块和操作方式',
    icon: <ExperimentOutlined />
  },
  {
    title: '体验功能',
    description: '尝试创建第一个教学资源',
    icon: <BulbOutlined />
  },
  {
    title: '深入学习',
    description: '查看详细教程掌握高级功能',
    icon: <BookOutlined />
  }
];

const faqs = [
  {
    question: '如何开始使用平台？',
    answer: '首先注册账户，然后观看"平台快速入门指南"视频教程，按照步骤操作即可快速上手。'
  },
  {
    question: '多模态输入是什么意思？',
    answer: '多模态输入是指平台支持文本、语音、图像等多种输入方式，您可以根据需要选择最适合的输入方式。'
  },
  {
    question: '生成的资源质量如何保证？',
    answer: '平台使用先进的AI技术，并提供多种模板和优化选项，您可以根据需要调整和完善生成的内容。'
  },
  {
    question: '如何管理我的教学资源？',
    answer: '平台提供完善的资源管理系统，支持分类、标签、搜索等功能，帮助您高效管理所有资源。'
  }
];

export default function TutorialPage() {
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [searchText, setSearchText] = useState('');
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [activeTab, setActiveTab] = useState('tutorials');

  const filteredTutorials = tutorialData.filter(tutorial => {
    const matchCategory = selectedCategory === '全部' || tutorial.category === selectedCategory;
    const matchSearch = tutorial.title.toLowerCase().includes(searchText.toLowerCase()) ||
                       tutorial.description.toLowerCase().includes(searchText.toLowerCase());
    return matchCategory && matchSearch;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'green';
      case 'intermediate': return 'orange';
      case 'advanced': return 'red';
      default: return 'blue';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <VideoCameraOutlined />;
      case 'document': return <FileTextOutlined />;
      case 'interactive': return <ExperimentOutlined />;
      default: return <BookOutlined />;
    }
  };

  const renderTutorialCard = (tutorial: Tutorial) => (
    <Card
      key={tutorial.id}
      hoverable
      style={{ marginBottom: 16 }}
      cover={
        <div style={{ 
          height: 120, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 32
        }}>
          {getTypeIcon(tutorial.type)}
        </div>
      }
      actions={[
        <Button key="view" type="primary" onClick={() => setSelectedTutorial(tutorial)}>
          查看详情
        </Button>
      ]}
    >
      <Card.Meta
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{tutorial.title}</span>
            <Tag color={getLevelColor(tutorial.level)}>
              {tutorial.level === 'beginner' ? '入门' : 
               tutorial.level === 'intermediate' ? '进阶' : '高级'}
            </Tag>
          </div>
        }
        description={
          <div>
            <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 8 }}>
              {tutorial.description}
            </Paragraph>
            <Space split={<Divider type="vertical" />}>
              <span><ClockCircleOutlined /> {tutorial.duration}</span>
              <span><UserOutlined /> {tutorial.views} 观看</span>
              <span><StarOutlined /> {tutorial.rating}</span>
            </Space>
            <div style={{ marginTop: 8 }}>
              {tutorial.tags.map(tag => (
                <Tag key={tag} size="small">{tag}</Tag>
              ))}
            </div>
          </div>
        }
      />
    </Card>
  );

  const tabItems = [
    {
      key: 'tutorials',
      label: '教程库',
      children: (
        <div>
          {/* 搜索和过滤 */}
          <Card style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Search
                  placeholder="搜索教程..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  enterButton={<SearchOutlined />}
                />
              </Col>
              <Col span={12}>
                <Space wrap>
                  {categories.map(category => (
                    <Button
                      key={category}
                      type={selectedCategory === category ? 'primary' : 'default'}
                      onClick={() => setSelectedCategory(category)}
                      size="small"
                    >
                      {category}
                    </Button>
                  ))}
                </Space>
              </Col>
            </Row>
          </Card>

          {/* 教程列表 */}
          <Row gutter={[16, 16]}>
            {filteredTutorials.map(tutorial => (
              <Col xs={24} sm={12} md={8} key={tutorial.id}>
                {renderTutorialCard(tutorial)}
              </Col>
            ))}
          </Row>
        </div>
      )
    },
    {
      key: 'quickstart',
      label: '快速开始',
      children: (
        <div>
          {/* 快速开始步骤 */}
          <Card title="四步快速上手" style={{ marginBottom: 24 }}>
            <Steps size="small" current={-1}>
              {quickStartSteps.map((step, index) => (
                <Step
                  key={index}
                  title={step.title}
                  description={step.description}
                  icon={step.icon}
                />
              ))}
            </Steps>
          </Card>

          {/* 推荐教程 */}
          <Card title="推荐教程">
            <List
              dataSource={tutorialData.slice(0, 3)}
              renderItem={(tutorial) => (
                <List.Item
                  actions={[
                    <Button key="view" type="link" onClick={() => setSelectedTutorial(tutorial)}>
                      查看
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={getTypeIcon(tutorial.type)} />}
                    title={tutorial.title}
                    description={tutorial.description}
                  />
                  <div>
                    <Tag color={getLevelColor(tutorial.level)}>
                      {tutorial.level === 'beginner' ? '入门' : 
                       tutorial.level === 'intermediate' ? '进阶' : '高级'}
                    </Tag>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </div>
      )
    },
    {
      key: 'faq',
      label: '常见问题',
      children: (
        <div>
          <Card title="常见问题解答">
            <Collapse>
              {faqs.map((faq, index) => (
                <Panel
                  key={index}
                  header={
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <QuestionCircleOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                      {faq.question}
                    </div>
                  }
                >
                  <Paragraph>{faq.answer}</Paragraph>
                </Panel>
              ))}
            </Collapse>
          </Card>

          {/* 联系支持 */}
          <Card title="需要更多帮助？" style={{ marginTop: 24, textAlign: 'center' }}>
            <Paragraph>
              如果您在使用过程中遇到问题，可以通过以下方式获得帮助：
            </Paragraph>
            <Space size="large">
              <Button type="primary" icon={<BookOutlined />}>
                查看文档
              </Button>
              <Button icon={<VideoCameraOutlined />}>
                观看视频
              </Button>
              <Button icon={<UserOutlined />}>
                联系客服
              </Button>
            </Space>
          </Card>
        </div>
      )
    }
  ];

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2}>
            <BookOutlined style={{ color: '#1890ff', marginRight: 8 }} />
            教程中心
          </Title>
          <Paragraph style={{ fontSize: 16, color: '#666' }}>
            全面的使用指南，帮助您快速掌握平台功能
          </Paragraph>
        </div>

        {/* 统计数据 */}
        <Row gutter={16} style={{ marginBottom: 32 }}>
          <Col span={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, color: '#1890ff', marginBottom: 8 }}>
                  <BookOutlined />
                </div>
                <div style={{ fontSize: 20, fontWeight: 'bold' }}>12+</div>
                <div style={{ color: '#666' }}>教程总数</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, color: '#52c41a', marginBottom: 8 }}>
                  <VideoCameraOutlined />
                </div>
                <div style={{ fontSize: 20, fontWeight: 'bold' }}>8+</div>
                <div style={{ color: '#666' }}>视频教程</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, color: '#fa8c16', marginBottom: 8 }}>
                  <UserOutlined />
                </div>
                <div style={{ fontSize: 20, fontWeight: 'bold' }}>5000+</div>
                <div style={{ color: '#666' }}>学习人数</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, color: '#722ed1', marginBottom: 8 }}>
                  <ClockCircleOutlined />
                </div>
                <div style={{ fontSize: 20, fontWeight: 'bold' }}>300+</div>
                <div style={{ color: '#666' }}>学习时长(小时)</div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 主要内容 */}
        <Card>
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
        </Card>

        {/* 教程详情模态框 */}
        {selectedTutorial && (
          <Card
            title={selectedTutorial.title}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1000,
              margin: 0,
              borderRadius: 0,
              overflow: 'auto'
            }}
            extra={
              <Button onClick={() => setSelectedTutorial(null)}>
                关闭
              </Button>
            }
          >
            <Row gutter={24}>
              <Col span={16}>
                <div style={{ marginBottom: 16 }}>
                  <Space>
                    <Tag color={getLevelColor(selectedTutorial.level)}>
                      {selectedTutorial.level === 'beginner' ? '入门' : 
                       selectedTutorial.level === 'intermediate' ? '进阶' : '高级'}
                    </Tag>
                    <span><ClockCircleOutlined /> {selectedTutorial.duration}</span>
                    <span><UserOutlined /> {selectedTutorial.views} 观看</span>
                    <span><StarOutlined /> {selectedTutorial.rating}</span>
                  </Space>
                </div>
                
                <Paragraph style={{ fontSize: 16, marginBottom: 24 }}>
                  {selectedTutorial.description}
                </Paragraph>

                {selectedTutorial.type === 'video' && (
                  <div style={{ 
                    width: '100%', 
                    height: 400, 
                    background: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 24
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <PlayCircleOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                      <div style={{ marginTop: 8 }}>视频播放器</div>
                    </div>
                  </div>
                )}

                {selectedTutorial.content && (
                  <div style={{ 
                    background: '#fafafa', 
                    padding: 16, 
                    borderRadius: 8,
                    whiteSpace: 'pre-wrap',
                    marginBottom: 24
                  }}>
                    {selectedTutorial.content}
                  </div>
                )}

                {selectedTutorial.steps && (
                  <div>
                    <Title level={4}>学习步骤</Title>
                    <Steps direction="vertical" size="small" current={-1}>
                      {selectedTutorial.steps.map((step, index) => (
                        <Step
                          key={index}
                          title={`步骤 ${index + 1}`}
                          description={step}
                          icon={<CheckCircleOutlined />}
                        />
                      ))}
                    </Steps>
                  </div>
                )}
              </Col>
              <Col span={8}>
                <Card size="small" title="教程信息">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div><strong>作者：</strong>{selectedTutorial.author}</div>
                    <div><strong>分类：</strong>{selectedTutorial.category}</div>
                    <div><strong>时长：</strong>{selectedTutorial.duration}</div>
                    <div><strong>观看数：</strong>{selectedTutorial.views}</div>
                    <div><strong>评分：</strong>{selectedTutorial.rating}/5.0</div>
                  </Space>
                </Card>
                
                <Card size="small" title="标签" style={{ marginTop: 16 }}>
                  <Space wrap>
                    {selectedTutorial.tags.map(tag => (
                      <Tag key={tag}>{tag}</Tag>
                    ))}
                  </Space>
                </Card>
              </Col>
            </Row>
          </Card>
        )}
      </div>
    </div>
  );
} 