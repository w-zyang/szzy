import React, { useState } from 'react';
import { Form, Input, Button, Select, Typography, List, Card, message, Modal, Space, Tag, Row, Col, InputNumber, Checkbox, Radio, Divider, Progress, Alert, notification } from 'antd';
import { QuestionCircleOutlined, BulbOutlined, SaveOutlined, EyeOutlined, DownloadOutlined, PlusOutlined, SettingOutlined, FileTextOutlined, LoadingOutlined } from '@ant-design/icons';
import MultimodalInput from './components/MultimodalInput';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const API = '/api/resource';

const questionTypes = [
  { label: '单选题', value: 'single', desc: '一个正确答案的选择题', icon: '🔘' },
  { label: '多选题', value: 'multi', desc: '多个正确答案的选择题', icon: '☑️' },
  { label: '判断题', value: 'judge', desc: '判断对错的题目', icon: '✓' },
  { label: '填空题', value: 'blank', desc: '填写空白处的题目', icon: '📝' },
  { label: '简答题', value: 'short', desc: '简要回答的题目', icon: '💭' },
  { label: '论述题', value: 'essay', desc: '详细阐述的题目', icon: '📄' },
  { label: '计算题', value: 'calculate', desc: '数学计算类题目', icon: '🔢' },
  { label: '分析题', value: 'analysis', desc: '分析问题的题目', icon: '🔍' }
];

const difficulties = [
  { label: '简单', value: 'easy', color: 'green', desc: '基础知识点，适合初学者' },
  { label: '中等', value: 'medium', color: 'orange', desc: '综合应用，适合进阶学习' },
  { label: '困难', value: 'hard', color: 'red', desc: '深度思考，适合高水平学习' }
];

const subjects = [
  '数学', '物理', '化学', '生物', '语文', '英语', '历史', '地理', '政治', 
  '计算机', '经济学', '心理学', '管理学', '艺术', '音乐', '体育'
];

const knowledgePoints = {
  '数学': ['代数', '几何', '三角函数', '微积分', '概率统计'],
  '物理': ['力学', '电学', '光学', '热学', '原子物理'],
  '化学': ['无机化学', '有机化学', '物理化学', '分析化学'],
  '生物': ['细胞生物学', '遗传学', '生态学', '生理学'],
  '计算机': ['编程基础', '数据结构', '算法', '数据库', '网络']
};

interface Question {
  id: string;
  type: string;
  subject: string;
  knowledgePoint: string;
  difficulty: string;
  title: string;
  content: string;
  options?: string[];
  answer: any;
  explanation: string;
  createdAt: string;
}

export default function QuestionPage() {
  const [form] = Form.useForm();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [detail, setDetail] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedKnowledgePoints, setSelectedKnowledgePoints] = useState<string[]>([]);
  const token = localStorage.getItem('token');

  // 处理多模态输入
  const handleMultimodalSubmit = (data: any) => {
    if (data.type === 'text') {
      form.setFieldsValue({ requirement: data.content });
    } else if (data.type === 'voice') {
      form.setFieldsValue({ requirement: '通过语音输入的出题要求...' });
      message.info('语音输入已转换为文本');
    } else if (data.type === 'image') {
      form.setFieldsValue({ requirement: '基于图像内容生成相关题目...' });
      message.info('图像内容已识别，将生成相关题目');
    }
  };

  // 智能生成试题
  const generateIntelligentQuestions = async (values: any) => {
    setGenerating(true);
    setProgress(0);
    
    const steps = [
      '分析题目要求...',
      '生成题目框架...',
      '完善题目内容...',
      '生成参考答案...',
      '优化题目质量...'
    ];
    
    // 模拟AI生成过程
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress((i + 1) * 20);
    }
    
    // 生成题目数据
    const questionCount = values.count || 1;
    const newQuestions: Question[] = [];
    
    for (let i = 0; i < questionCount; i++) {
      const question: Question = {
        id: Date.now().toString() + i,
        type: values.type,
        subject: values.subject,
        knowledgePoint: values.knowledgePoint,
        difficulty: values.difficulty,
        title: `${values.subject} - ${questionTypes.find(t => t.value === values.type)?.label}`,
        content: generateQuestionContent(values.type, values.requirement, values.subject, i + 1),
        options: ['single', 'multi'].includes(values.type) ? [
          'A. 选项一',
          'B. 选项二', 
          'C. 选项三',
          'D. 选项四'
        ] : undefined,
        answer: generateAnswer(values.type),
        explanation: '这道题考查的是...',
        createdAt: new Date().toISOString()
      };
      
      newQuestions.push(question);
    }
    
    setQuestions([...questions, ...newQuestions]);
    setGenerating(false);
    setProgress(100);

    // === 新增：自动保存所有新生成的题目到后端 ===
    for (const question of newQuestions) {
      await saveQuestion(question);
    }

    notification.success({
      message: '生成成功',
      description: `成功生成 ${questionCount} 道题目！`
    });
  };

  // 生成题目内容
  const generateQuestionContent = (type: string, requirement: string, subject: string, index: number) => {
    const templates = {
      single: `关于${subject}的第${index}题：${requirement}，以下选项中正确的是：`,
      multi: `关于${subject}的第${index}题：${requirement}，以下选项中正确的有：`,
      judge: `关于${subject}的第${index}题：${requirement}。请判断此说法是否正确。`,
      blank: `关于${subject}的第${index}题：${requirement}，请在空白处填入正确答案。`,
      short: `关于${subject}的第${index}题：请简要回答：${requirement}`,
      essay: `关于${subject}的第${index}题：请详细论述：${requirement}`,
      calculate: `关于${subject}的第${index}题：计算题 - ${requirement}`,
      analysis: `关于${subject}的第${index}题：分析题 - ${requirement}`
    };
    
    return templates[type as keyof typeof templates] || `${requirement}`;
  };

  // 生成答案
  const generateAnswer = (type: string) => {
    switch (type) {
      case 'single':
        return 'A';
      case 'multi':
        return ['A', 'B'];
      case 'judge':
        return true;
      case 'blank':
        return '答案';
      case 'short':
      case 'essay':
      case 'calculate':
      case 'analysis':
        return '参考答案：根据题目要求，答案应该是...';
      default:
        return '答案';
    }
  };

  // 保存单个题目
  const saveQuestion = async (question: Question) => {
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          type: 'question',
          title: question.title,
          content: JSON.stringify(question),
          desc: question.explanation,
        })
      });
      
      if (res.ok) {
        message.success('题目已保存到"我的试题"');
      } else {
        throw new Error('保存失败');
      }
    } catch (error) {
      message.error('保存失败，请重试');
    }
  };

  // 批量保存题目
  const batchSaveQuestions = async () => {
    setLoading(true);
    try {
      for (const question of questions) {
        await saveQuestion(question);
      }
      message.success(`成功保存 ${questions.length} 道题目`);
    } catch (error) {
      message.error('批量保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 导出题目
  const exportQuestions = () => {
    const content = questions.map(q => ({
      题目类型: questionTypes.find(t => t.value === q.type)?.label,
      学科: q.subject,
      难度: difficulties.find(d => d.value === q.difficulty)?.label,
      题目内容: q.content,
      选项: q.options,
      答案: q.answer,
      解析: q.explanation
    }));
    
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `试题_${new Date().toLocaleDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ padding: 32, background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* 页面标题 */}
        <Card style={{ marginBottom: 24, background: 'linear-gradient(135deg, #fa8c16 0%, #faad14 100%)', border: 'none' }}>
          <div style={{ color: 'white', textAlign: 'center' }}>
            <Title level={2} style={{ color: 'white', marginBottom: 8 }}>
              <QuestionCircleOutlined style={{ marginRight: 12 }} />
              AI智能出题系统
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, marginBottom: 0 }}>
              支持多种题型和多模态输入，智能生成高质量试题
            </Paragraph>
          </div>
        </Card>

        {/* 出题表单 */}
        <Card title="智能出题" style={{ marginBottom: 24 }}>
          <Form form={form} layout="vertical" onFinish={generateIntelligentQuestions}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="subject" label="学科" rules={[{ required: true, message: '请选择学科' }]}>
                  <Select placeholder="请选择学科" onChange={(value) => {
                    const points = knowledgePoints[value as keyof typeof knowledgePoints] || [];
                    setSelectedKnowledgePoints(points);
                    form.setFieldsValue({ knowledgePoint: undefined });
                  }}>
                    {subjects.map(subject => (
                      <Option key={subject} value={subject}>{subject}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="knowledgePoint" label="知识点">
                  <Select placeholder="请选择知识点" allowClear>
                    {selectedKnowledgePoints.map(point => (
                      <Option key={point} value={point}>{point}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="type" label="题型" initialValue="single" rules={[{ required: true }]}>
                  <Select>
                    {questionTypes.map(type => (
                      <Option key={type.value} value={type.value}>
                        <Space>
                          <span>{type.icon}</span>
                          <span>{type.label}</span>
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="difficulty" label="难度" initialValue="medium" rules={[{ required: true }]}>
                  <Select>
                    {difficulties.map(diff => (
                      <Option key={diff.value} value={diff.value}>
                        <Tag color={diff.color}>{diff.label}</Tag>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="count" label="题目数量" initialValue={1}>
                  <InputNumber min={1} max={20} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            
            {/* 多模态输入 */}
            <Form.Item label="智能输入">
              <MultimodalInput onSubmit={handleMultimodalSubmit} />
            </Form.Item>
            
            <Form.Item name="requirement" label="出题要求" rules={[{ required: true, message: '请输入出题要求' }]}>
              <TextArea 
                rows={4} 
                placeholder="请详细描述出题要求，如：生成一道关于函数的单选题，考查学生对函数性质的理解..." 
              />
            </Form.Item>
            
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" loading={generating} icon={<BulbOutlined />}>
                  {generating ? '正在生成...' : '智能生成'}
                </Button>
                <Button onClick={() => setBatchMode(!batchMode)} icon={<SettingOutlined />}>
                  {batchMode ? '单题模式' : '批量模式'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
          
          {generating && (
            <div style={{ marginTop: 16 }}>
              <Progress percent={progress} status="active" />
              <Text style={{ marginTop: 8, display: 'block' }}>
                AI正在智能生成试题，请稍候...
              </Text>
            </div>
          )}
        </Card>

        {/* 生成的题目列表 */}
        {questions.length > 0 && (
          <Card 
            title={`生成的题目 (${questions.length}道)`}
            extra={
              <Space>
                <Button type="primary" onClick={batchSaveQuestions} loading={loading} icon={<SaveOutlined />}>
                  批量保存
                </Button>
                <Button onClick={exportQuestions} icon={<DownloadOutlined />}>
                  导出题目
                </Button>
              </Space>
            }
          >
            <List
              dataSource={questions}
              renderItem={(item, index) => (
                <List.Item
                  actions={[
                    <Button key="preview" type="link" icon={<EyeOutlined />} onClick={() => setDetail(item)}>
                      预览
                    </Button>,
                    <Button key="save" type="link" icon={<SaveOutlined />} onClick={() => saveQuestion(item)}>
                      保存
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<div style={{ fontSize: 24 }}>{questionTypes.find(t => t.value === item.type)?.icon}</div>}
                    title={
                      <Space>
                        <span>{index + 1}. {item.title}</span>
                        <Tag color="blue">{questionTypes.find(t => t.value === item.type)?.label}</Tag>
                        <Tag color={difficulties.find(d => d.value === item.difficulty)?.color}>
                          {difficulties.find(d => d.value === item.difficulty)?.label}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: 8 }}>{item.content}</div>
                        <Space>
                          <Tag>{item.subject}</Tag>
                          {item.knowledgePoint && <Tag color="purple">{item.knowledgePoint}</Tag>}
                        </Space>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        )}
        
        {/* 题目详情预览 */}
        <Modal 
          open={!!detail} 
          onCancel={() => setDetail(null)} 
          footer={null} 
          width={700}
          title={
            <Space>
              <span>{questionTypes.find(t => t.value === detail?.type)?.icon}</span>
              <span>题目详情</span>
            </Space>
          }
        >
          {detail && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <Space>
                  <Tag color="blue">{questionTypes.find(t => t.value === detail.type)?.label}</Tag>
                  <Tag color={difficulties.find(d => d.value === detail.difficulty)?.color}>
                    {difficulties.find(d => d.value === detail.difficulty)?.label}
                  </Tag>
                  <Tag>{detail.subject}</Tag>
                  {detail.knowledgePoint && <Tag color="purple">{detail.knowledgePoint}</Tag>}
                </Space>
              </div>
              
              <Divider orientation="left">题目内容</Divider>
              <div style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 16 }}>
                {detail.content}
              </div>
              
              {detail.options && (
                <>
                  <Divider orientation="left">选项</Divider>
                  <div style={{ marginBottom: 16 }}>
                    {detail.options.map((option, index) => (
                      <div key={index} style={{ marginBottom: 8, fontSize: 14 }}>
                        {option}
                      </div>
                    ))}
                  </div>
                </>
              )}
              
              <Divider orientation="left">参考答案</Divider>
              <div style={{ 
                background: '#f6f8fa', 
                padding: 12, 
                borderRadius: 6, 
                marginBottom: 16,
                fontFamily: 'monospace'
              }}>
                {Array.isArray(detail.answer) ? detail.answer.join(', ') : detail.answer?.toString()}
              </div>
              
              <Divider orientation="left">题目解析</Divider>
              <div style={{ fontSize: 14, color: '#666' }}>
                {detail.explanation}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
} 