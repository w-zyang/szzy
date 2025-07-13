import React, { useState } from 'react';
import { Card, Row, Col, Form, Input, Select, Button, Typography, Steps, Space, Tag, Modal, List, Divider, Progress } from 'antd';
import { BookOutlined, BulbOutlined, ExperimentOutlined, FileTextOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import MultimodalInput from './components/MultimodalInput';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

interface CaseData {
  id: string;
  title: string;
  subject: string;
  level: string;
  type: string;
  background: string;
  objectives: string[];
  content: string;
  questions: string[];
  activities: string[];
  resources: string[];
  assessment: string;
  createdAt: string;
}

const caseTypes = [
  { value: 'problem-solving', label: '问题解决型案例', icon: '🔍' },
  { value: 'scenario-based', label: '情景模拟型案例', icon: '🎭' },
  { value: 'project-based', label: '项目实践型案例', icon: '🚀' },
  { value: 'case-study', label: '案例研究型案例', icon: '📚' },
  { value: 'debate', label: '辩论讨论型案例', icon: '💭' },
  { value: 'experiment', label: '实验探究型案例', icon: '🔬' }
];

const subjects = [
  '数学', '物理', '化学', '生物', '语文', '英语', '历史', '地理', '政治', '计算机', '经济学', '心理学', '管理学'
];

const levels = [
  { value: 'elementary', label: '小学' },
  { value: 'middle', label: '初中' },
  { value: 'high', label: '高中' },
  { value: 'undergraduate', label: '大学本科' },
  { value: 'graduate', label: '研究生' }
];

export default function CaseGenerationPage() {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [generatedCase, setGeneratedCase] = useState<CaseData | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  // 处理多模态输入
  const handleMultimodalInput = (data: any) => {
    if (data.type === 'text') {
      form.setFieldsValue({
        background: data.content
      });
    } else if (data.type === 'voice') {
      // 模拟语音转文本
      form.setFieldsValue({
        background: '通过语音输入的案例背景描述...'
      });
    } else if (data.type === 'image') {
      // 模拟图像识别
      form.setFieldsValue({
        background: '基于上传图像分析的案例背景...'
      });
    }
  };

  // 生成案例
  const generateCase = async (values: any) => {
    setLoading(true);
    setProgress(0);
    
    // 模拟AI生成过程
    const steps = [
      '分析输入需求...',
      '生成案例框架...',
      '完善案例内容...',
      '生成配套资源...',
      '优化案例结构...'
    ];
    
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress((i + 1) * 20);
    }
    
    // 模拟生成的案例数据
    const mockCase: CaseData = {
      id: Date.now().toString(),
      title: values.title || '智能生成的教学案例',
      subject: values.subject,
      level: values.level,
      type: values.type,
      background: values.background,
      objectives: [
        '掌握核心概念和原理',
        '培养分析问题的能力',
        '提高实践应用技能',
        '增强团队协作意识'
      ],
      content: `
## 案例背景
${values.background}

## 核心问题
本案例旨在通过实际情境，让学生深入理解${values.subject}中的关键概念，并培养解决实际问题的能力。

## 案例描述
这是一个基于${values.type}的教学案例，适用于${values.level}阶段的学生。案例通过生动的情境设置，引导学生主动探索和思考。

## 关键知识点
- 理论基础与实践应用
- 问题分析与解决方法
- 创新思维与批判性思考
- 团队合作与沟通技巧

## 实施建议
1. 课前准备：学生预习相关理论知识
2. 课堂讨论：小组分析案例情境
3. 方案设计：制定解决方案
4. 成果展示：汇报讨论结果
5. 反思总结：评估学习效果
      `,
      questions: [
        '如何分析案例中的核心问题？',
        '有哪些可能的解决方案？',
        '如何评估方案的可行性？',
        '从中能学到什么经验和教训？'
      ],
      activities: [
        '小组讨论：分析案例背景',
        '角色扮演：模拟实际情境',
        '头脑风暴：提出解决方案',
        '方案评估：比较不同方案',
        '成果汇报：展示分析结果'
      ],
      resources: [
        '相关理论资料',
        '参考案例库',
        '多媒体素材',
        '评估工具'
      ],
      assessment: '通过学生的参与度、分析质量、方案创新性和团队合作表现进行综合评估',
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    setGeneratedCase(mockCase);
    setCurrentStep(2);
    setLoading(false);
    setProgress(100);

    // === 新增：自动保存案例到后端 ===
    try {
      await fetch('/api/resource', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          type: 'case',
          title: mockCase.title,
          content: mockCase.content,
          desc: mockCase.background,
          cover: '/default-pic.png'
        })
      });
    } catch (e) {}
  };

  // 保存案例
  const saveCase = async () => {
    if (!generatedCase) return;
    
    try {
      const response = await fetch('/api/resource', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          type: 'case',
          title: generatedCase.title,
          content: generatedCase.content,
          desc: generatedCase.background,
          cover: '/default-pic.png'
        })
      });
      
      if (response.ok) {
        Modal.success({
          title: '保存成功',
          content: '案例已保存到资源库中',
          onOk: () => {
            form.resetFields();
            setCurrentStep(0);
            setGeneratedCase(null);
            setProgress(0);
          }
        });
      } else {
        throw new Error('保存失败');
      }
    } catch (error) {
      Modal.error({
        title: '保存失败',
        content: '请检查网络连接后重试'
      });
    }
  };

  const steps = [
    {
      title: '输入需求',
      icon: <BookOutlined />,
      content: (
        <Card title="案例生成需求">
          <Form form={form} layout="vertical" onFinish={generateCase}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="title" label="案例标题" rules={[{ required: true, message: '请输入案例标题' }]}>
                  <Input placeholder="请输入案例标题" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="subject" label="学科" rules={[{ required: true, message: '请选择学科' }]}>
                  <Select placeholder="请选择学科">
                    {subjects.map(subject => (
                      <Option key={subject} value={subject}>{subject}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="level" label="适用阶段" rules={[{ required: true, message: '请选择适用阶段' }]}>
                  <Select placeholder="请选择适用阶段">
                    {levels.map(level => (
                      <Option key={level.value} value={level.value}>{level.label}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="type" label="案例类型" rules={[{ required: true, message: '请选择案例类型' }]}>
                  <Select placeholder="请选择案例类型">
                    {caseTypes.map(type => (
                      <Option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Form.Item name="background" label="案例背景" rules={[{ required: true, message: '请输入案例背景' }]}>
              <TextArea rows={4} placeholder="请描述案例的背景信息、教学目标等" />
            </Form.Item>
            
            <div style={{ marginTop: 16 }}>
              <MultimodalInput onSubmit={handleMultimodalInput} placeholder="您也可以通过语音或图像方式输入案例背景" />
            </div>
            
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} size="large">
                生成案例
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )
    },
    {
      title: '生成中',
      icon: <LoadingOutlined />,
      content: (
        <Card title="AI正在生成案例">
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Progress 
              type="circle" 
              percent={progress} 
              status={loading ? 'active' : 'success'}
              size={120}
            />
            <div style={{ marginTop: 20 }}>
              <Text>正在使用多模态大模型生成教学案例...</Text>
            </div>
          </div>
        </Card>
      )
    },
    {
      title: '查看结果',
      icon: <CheckCircleOutlined />,
      content: generatedCase && (
        <Card title="生成的教学案例" extra={
          <Space>
            <Button onClick={() => setPreviewVisible(true)}>预览</Button>
            <Button type="primary" onClick={saveCase}>保存到资源库</Button>
          </Space>
        }>
          <Row gutter={16}>
            <Col span={16}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Title level={4}>{generatedCase.title}</Title>
                  <Space>
                    <Tag color="blue">{generatedCase.subject}</Tag>
                    <Tag color="green">{levels.find(l => l.value === generatedCase.level)?.label}</Tag>
                    <Tag color="purple">{caseTypes.find(t => t.value === generatedCase.type)?.label}</Tag>
                  </Space>
                </div>
                <Divider />
                <div>
                  <Text strong>教学目标：</Text>
                  <List
                    size="small"
                    dataSource={generatedCase.objectives}
                    renderItem={(item) => <List.Item>• {item}</List.Item>}
                  />
                </div>
                <Divider />
                <div>
                  <Text strong>核心问题：</Text>
                  <List
                    size="small"
                    dataSource={generatedCase.questions}
                    renderItem={(item) => <List.Item>• {item}</List.Item>}
                  />
                </div>
              </Space>
            </Col>
            <Col span={8}>
              <Card size="small" title="案例信息">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>创建时间：</Text>
                    <Text>{generatedCase.createdAt}</Text>
                  </div>
                  <div>
                    <Text strong>配套活动：</Text>
                    <div>
                      {generatedCase.activities.map((activity, index) => (
                        <Tag key={index} style={{ marginTop: 4 }}>{activity}</Tag>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Text strong>所需资源：</Text>
                    <div>
                      {generatedCase.resources.map((resource, index) => (
                        <Tag key={index} style={{ marginTop: 4 }}>{resource}</Tag>
                      ))}
                    </div>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>
        </Card>
      )
    }
  ];

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Title level={2}>AI教学案例生成</Title>
        <Paragraph>
          利用多模态大模型技术，智能生成符合教学需求的案例，支持文本、语音、图像等多种输入方式。
        </Paragraph>
        
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          {steps.map((step, index) => (
            <Step key={index} title={step.title} icon={step.icon} />
          ))}
        </Steps>
        
        <div style={{ marginTop: 24 }}>
          {steps[currentStep].content}
        </div>
        
        {/* 案例预览模态框 */}
        <Modal
          title="案例预览"
          open={previewVisible}
          onCancel={() => setPreviewVisible(false)}
          footer={null}
          width={800}
        >
          {generatedCase && (
            <div>
              <Title level={3}>{generatedCase.title}</Title>
              <Space>
                <Tag color="blue">{generatedCase.subject}</Tag>
                <Tag color="green">{levels.find(l => l.value === generatedCase.level)?.label}</Tag>
                <Tag color="purple">{caseTypes.find(t => t.value === generatedCase.type)?.label}</Tag>
              </Space>
              <Divider />
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {generatedCase.content}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
} 