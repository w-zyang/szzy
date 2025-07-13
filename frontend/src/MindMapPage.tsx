import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Card, Form, Row, Col, Divider, Spin, message, Modal } from 'antd';
import { 
  BranchesOutlined, FileTextOutlined, DownloadOutlined, 
  SettingOutlined, BulbOutlined, EyeOutlined, 
  StarOutlined, HeartOutlined, ShareAltOutlined 
} from '@ant-design/icons';

const { TextArea } = Input;
const { Option } = Select;

interface MindMapNode {
  id: string;
  title: string;
  level: number;
  children?: MindMapNode[];
  color?: string;
}

function MindMapPage() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [mindMapData, setMindMapData] = useState<MindMapNode[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [generationStats, setGenerationStats] = useState({
    totalNodes: 0,
    depth: 0,
    branches: 0
  });

  const styles = [
    { label: '经典分支', value: 'classic', color: '#1890ff' },
    { label: '现代简约', value: 'modern', color: '#52c41a' },
    { label: '创意彩色', value: 'creative', color: '#eb2f96' },
    { label: '商务专业', value: 'business', color: '#8c8c8c' },
    { label: '手绘风格', value: 'hand-drawn', color: '#fa8c16' },
    { label: '科技感', value: 'tech', color: '#722ed1' }
  ];

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/mindmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: values.topic,
          depth: values.depth,
          style: values.style,
          format: values.format,
          includeImages: values.includeImages,
          language: values.language
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMindMapData(data.mindMap);
        setGenerationStats({
          totalNodes: data.totalNodes,
          depth: data.depth,
          branches: data.branches
        });
        setPreviewVisible(true);
        message.success('思维导图生成成功！');
      } else {
        throw new Error('生成失败');
      }
    } catch (error) {
      message.error('生成失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const downloadMindMap = () => {
    message.success('思维导图下载中...');
  };

  const renderMindMapNode = (node: MindMapNode, level: number = 0) => {
    const colors = ['#1890ff', '#52c41a', '#eb2f96', '#fa8c16', '#722ed1', '#13c2c2'];
    const color = colors[level % colors.length];
    
    return (
      <div 
        key={node.id}
        style={{
          marginLeft: level * 30,
          marginBottom: 8,
          padding: '8px 12px',
          borderRadius: 20,
          background: `linear-gradient(135deg, ${color}20, ${color}10)`,
          borderLeft: `4px solid ${color}`,
          fontSize: 14 - level * 1,
          fontWeight: 500 - level * 50
        }}
      >
        {node.title}
        {node.children && (
          <div style={{ marginTop: 8 }}>
            {node.children.map(child => renderMindMapNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const features = [
    { icon: <BranchesOutlined />, title: '智能分支', desc: 'AI自动生成逻辑结构' },
    { icon: <BulbOutlined />, title: '创意思维', desc: '激发创新思维模式' },
    { icon: <SettingOutlined />, title: '自定义样式', desc: '多种专业模板选择' },
    { icon: <FileTextOutlined />, title: '多格式导出', desc: '支持多种文件格式' }
  ];

  const statistics = [
    { label: '已生成', value: '12,358', suffix: '个导图' },
    { label: '用户满意度', value: '98.5', suffix: '%' },
    { label: '平均节点', value: '45', suffix: '个' },
    { label: '平均深度', value: '5.2', suffix: '层' }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 装饰背景 */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: 200,
        height: 200,
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        zIndex: 1
      }} />
      <div style={{
        position: 'absolute',
        top: '60%',
        right: '15%',
        width: 150,
        height: 150,
        background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        zIndex: 1
      }} />

      <div style={{ padding: '40px', position: 'relative', zIndex: 2 }}>
        {/* 头部标题 */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: 40,
          color: '#fff'
        }}>
          <h1 style={{ 
            fontSize: 42, 
            fontWeight: 700, 
            margin: 0,
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
            background: 'linear-gradient(45deg, #fff, #e6f3ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            <BranchesOutlined style={{ marginRight: 16 }} />
            思维导图生成器
          </h1>
          <p style={{ 
            fontSize: 18, 
            margin: '16px 0 0', 
            opacity: 0.9,
            textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
          }}>
            AI驱动的智能思维导图创作工具
          </p>
        </div>

        <Row gutter={[24, 24]} style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* 左侧表单 */}
          <Col xs={24} lg={14}>
            <Card 
              style={{ 
                borderRadius: 30,
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(20px)',
                border: 'none',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ 
                padding: '20px 0',
                borderBottom: '2px solid #f0f0f0',
                marginBottom: 30
              }}>
                <h2 style={{ 
                  fontSize: 24, 
                  fontWeight: 700,
                  color: '#667eea',
                  margin: 0,
                  textAlign: 'center'
                }}>
                  智能生成配置
                </h2>
              </div>

              <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{
                  depth: 4,
                  style: 'classic',
                  format: 'png',
                  includeImages: false,
                  language: 'zh'
                }}
              >
                <Form.Item
                  label={<span style={{ fontSize: 16, fontWeight: 600 }}>主题内容</span>}
                  name="topic"
                  rules={[{ required: true, message: '请输入主题内容' }]}
                >
                  <TextArea 
                    rows={4}
                    placeholder="请输入要生成思维导图的主题内容，如：人工智能的发展历程、项目管理流程、学习方法等..."
                    style={{ 
                      borderRadius: 15,
                      fontSize: 14,
                      background: 'rgba(102, 126, 234, 0.05)',
                      border: '2px solid #e6f3ff'
                    }}
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label={<span style={{ fontSize: 16, fontWeight: 600 }}>思维深度</span>}
                      name="depth"
                    >
                      <Select style={{ borderRadius: 15 }}>
                        <Option value={3}>3层 - 简单</Option>
                        <Option value={4}>4层 - 标准</Option>
                        <Option value={5}>5层 - 详细</Option>
                        <Option value={6}>6层 - 深入</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label={<span style={{ fontSize: 16, fontWeight: 600 }}>视觉风格</span>}
                      name="style"
                    >
                      <Select style={{ borderRadius: 15 }}>
                        {styles.map(style => (
                          <Option key={style.value} value={style.value}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <div style={{ 
                                width: 12, 
                                height: 12, 
                                backgroundColor: style.color,
                                borderRadius: '50%',
                                marginRight: 8
                              }} />
                              {style.label}
                            </div>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label={<span style={{ fontSize: 16, fontWeight: 600 }}>导出格式</span>}
                      name="format"
                    >
                      <Select style={{ borderRadius: 15 }}>
                        <Option value="png">PNG图片</Option>
                        <Option value="jpg">JPG图片</Option>
                        <Option value="pdf">PDF文档</Option>
                        <Option value="svg">SVG矢量图</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label={<span style={{ fontSize: 16, fontWeight: 600 }}>语言</span>}
                      name="language"
                    >
                      <Select style={{ borderRadius: 15 }}>
                        <Option value="zh">中文</Option>
                        <Option value="en">英文</Option>
                        <Option value="auto">自动识别</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item style={{ marginTop: 30 }}>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    block
                    style={{
                      height: 56,
                      borderRadius: 28,
                      fontSize: 18,
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)'
                    }}
                  >
                    <BranchesOutlined style={{ marginRight: 8 }} />
                    {loading ? '生成中...' : '生成思维导图'}
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          {/* 右侧信息 */}
          <Col xs={24} lg={10}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* 功能特色 */}
              <Card 
                style={{ 
                  borderRadius: 20,
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(20px)',
                  border: 'none',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                }}
              >
                <h3 style={{ 
                  fontSize: 20, 
                  fontWeight: 700,
                  color: '#667eea',
                  marginBottom: 20,
                  textAlign: 'center'
                }}>
                  功能特色
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {features.map((feature, index) => (
                    <div key={index} style={{ 
                      textAlign: 'center',
                      padding: 16,
                      borderRadius: 15,
                      background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f3ff 100%)'
                    }}>
                      <div style={{ 
                        fontSize: 28, 
                        color: '#667eea',
                        marginBottom: 8
                      }}>
                        {feature.icon}
                      </div>
                      <div style={{ 
                        fontSize: 14, 
                        fontWeight: 600,
                        color: '#333',
                        marginBottom: 4
                      }}>
                        {feature.title}
                      </div>
                      <div style={{ 
                        fontSize: 12, 
                        color: '#666'
                      }}>
                        {feature.desc}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 统计数据 */}
              <Card 
                style={{ 
                  borderRadius: 20,
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(20px)',
                  border: 'none',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                }}
              >
                <h3 style={{ 
                  fontSize: 20, 
                  fontWeight: 700,
                  color: '#667eea',
                  marginBottom: 20,
                  textAlign: 'center'
                }}>
                  平台数据
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {statistics.map((stat, index) => (
                    <div key={index} style={{ 
                      textAlign: 'center',
                      padding: 16,
                      borderRadius: 15,
                      background: 'linear-gradient(135deg, #fff1f0 0%, #ffe7e6 100%)'
                    }}>
                      <div style={{ 
                        fontSize: 24, 
                        fontWeight: 700,
                        color: '#f5222d',
                        marginBottom: 4
                      }}>
                        {stat.value}
                      </div>
                      <div style={{ 
                        fontSize: 12, 
                        color: '#666'
                      }}>
                        {stat.label}{stat.suffix}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </Col>
        </Row>

        {/* 预览模态框 */}
        <Modal
          title={
            <div style={{ 
              fontSize: 20, 
              fontWeight: 700,
              color: '#667eea',
              textAlign: 'center'
            }}>
              <BranchesOutlined style={{ marginRight: 8 }} />
              思维导图预览
            </div>
          }
          open={previewVisible}
          onCancel={() => setPreviewVisible(false)}
          width={800}
          footer={[
            <Button key="download" type="primary" onClick={downloadMindMap}>
              <DownloadOutlined />
              下载
            </Button>,
            <Button key="share" onClick={() => message.success('分享功能开发中')}>
              <ShareAltOutlined />
              分享
            </Button>
          ]}
        >
          <div style={{ 
            maxHeight: 500, 
            overflowY: 'auto',
            background: '#f8f9fa',
            borderRadius: 15,
            padding: 20
          }}>
            {mindMapData.map(node => renderMindMapNode(node))}
          </div>
          
          <div style={{ 
            marginTop: 20,
            padding: 16,
            background: '#f0f5ff',
            borderRadius: 10,
            display: 'flex',
            justifyContent: 'space-around'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#667eea' }}>
                {generationStats.totalNodes}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>总节点</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#667eea' }}>
                {generationStats.depth}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>层数</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#667eea' }}>
                {generationStats.branches}
              </div>
              <div style={{ fontSize: 12, color: '#666' }}>分支数</div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default MindMapPage; 