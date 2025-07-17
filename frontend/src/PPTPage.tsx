import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Form, InputNumber, List, Card, Typography, message, Modal, Tree, Select, Row, Col, Spin, Tooltip, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, SaveOutlined, CloseOutlined, FileTextOutlined, AudioOutlined, LoadingOutlined, QuestionCircleOutlined, PlayCircleOutlined, PauseCircleOutlined } from '@ant-design/icons';
import PPTProgressPreview from './PPTProgressPreview';
import AudioRecorder from './components/AudioRecorder';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const API = '/api/resource';

// 删除这里的AudioRecorder组件定义和AudioRecorderProps接口定义

interface TemplateInfo {
  name: string;
  value: string;
  description: string;
  previewUrl: string;
  icon: string;
}

// 修复 TreeNode 接口中 children 的类型
interface TreeNode {
  key: string;
  title: string | React.ReactNode;
  children?: TreeNode[]; // 保持可选
}

export default function PPTPage() {
  const [treeData, setTreeData] = useState<TreeNode[]>([
    {
      key: '0',
      title: '章节1',
      children: [
        {
          key: '0-0',
          title: '小节1',
          children: [
            { key: '0-0-0', title: '要点1' },
            { key: '0-0-1', title: '要点2' }
          ]
        }
      ]
    }
  ]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [topic, setTopic] = useState('');
  const [background, setBackground] = useState('');
  const [pages, setPages] = useState(8);
  const [templates, setTemplates] = useState<string[]>([]);
  const [templateInfo, setTemplateInfo] = useState<TemplateInfo[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  // 在组件中添加使用指南状态
  const [showVoiceGuide, setShowVoiceGuide] = useState(false);

  // 获取模板列表
  useEffect(() => {
    fetchTemplates();
  }, []);

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
      setTemplateInfo(templates);
      setTemplates(data.templates);
      
      // 设置默认选中的模板
      if (templates.length > 0) {
        setSelectedTemplate(templates[0].value);
      }
      
      setLoadingTemplates(false);
    } catch (error) {
      console.error('获取模板列表失败:', error);
      message.error('获取模板列表失败');
      setLoadingTemplates(false);
    }
  };

  // 递归渲染树节点
  const renderTreeNodes = (data: TreeNode[]): any[] =>
    data.map(item => {
      if (item.children) {
        return {
          ...item,
          title: (
            <span>
              {editingKey === item.key ? (
                <>
                  <Input
                    size="small"
                    value={editingValue}
                    onChange={e => setEditingValue(e.target.value)}
                    onPressEnter={() => saveEdit(item.key)}
                    style={{ width: 120, marginRight: 4 }}
                    addonAfter={
                      <AudioRecorder onAudioText={(text) => {
                        setEditingValue(text);
                      }} buttonText="" placeholder="语音输入" />
                    }
                  />
                  <Button icon={<SaveOutlined />} size="small" onClick={() => saveEdit(item.key)} />
                  <Button icon={<CloseOutlined />} size="small" onClick={cancelEdit} style={{ marginLeft: 4 }} />
                </>
              ) : (
                <>
                  {item.title}
                  <Button icon={<EditOutlined />} size="small" onClick={() => startEdit(item.key, item.title as string)} style={{ marginLeft: 8 }} />
                  <Button icon={<PlusOutlined />} size="small" onClick={() => addNode(item.key)} style={{ marginLeft: 4 }} />
                  <Button icon={<DeleteOutlined />} size="small" onClick={() => deleteNode(item.key)} style={{ marginLeft: 4 }} />
                </>
              )}
            </span>
          ),
          children: renderTreeNodes(item.children)
        };
      }
      return {
        ...item,
        title: (
          <span>
            {editingKey === item.key ? (
              <>
                <Input
                  size="small"
                  value={editingValue}
                  onChange={e => setEditingValue(e.target.value)}
                  onPressEnter={() => saveEdit(item.key)}
                  style={{ width: 120, marginRight: 4 }}
                  addonAfter={
                    <AudioRecorder onAudioText={(text) => {
                      setEditingValue(text);
                    }} buttonText="" placeholder="语音输入" />
                  }
                />
                <Button icon={<SaveOutlined />} size="small" onClick={() => saveEdit(item.key)} />
                <Button icon={<CloseOutlined />} size="small" onClick={cancelEdit} style={{ marginLeft: 4 }} />
              </>
            ) : (
              <>
                {item.title}
                <Button icon={<EditOutlined />} size="small" onClick={() => startEdit(item.key, item.title as string)} style={{ marginLeft: 8 }} />
                <Button icon={<DeleteOutlined />} size="small" onClick={() => deleteNode(item.key)} style={{ marginLeft: 4 }} />
              </>
            )}
          </span>
        )
      };
    });

  // 编辑相关
  const startEdit = (key: string, value: any) => {
    setEditingKey(key);
    // 确保 value 是字符串
    setEditingValue(typeof value === 'string' ? value : '');
  };
  const saveEdit = (key: string) => {
    const update = (data: TreeNode[]): TreeNode[] => data.map(item => {
      if (item.key === key) return { ...item, title: editingValue, children: item.children ? update(item.children) : undefined };
      if (item.children) return { ...item, children: update(item.children) };
      return item;
    });
    setTreeData(update(treeData));
    setEditingKey(null);
    setEditingValue('');
  };
  const cancelEdit = () => {
    setEditingKey(null);
    setEditingValue('');
  };

  // 增删节点
  const addNode = (key: string) => {
    const add = (data: TreeNode[]): TreeNode[] => data.map(item => {
      if (item.key === key) {
        const newKey = key + '-' + (item.children ? item.children.length : 0);
        return {
          ...item,
          children: [...(item.children || []), { key: newKey, title: '新节点' }]
        };
      }
      if (item.children) return { ...item, children: add(item.children) };
      return item;
    });
    setTreeData(add(treeData));
  };
  const deleteNode = (key: string) => {
    const del = (data: TreeNode[]): TreeNode[] => data.filter(item => {
      if (item.key === key) return false;
      if (item.children) item.children = del(item.children);
      return true;
    });
    setTreeData(del(treeData));
  };

  // 拖拽排序
  const onDrop = (info: any) => {
    const dropKey = info.node.key;
    const dragKey = info.dragNode.key;
    const dropPos = info.node.pos.split('-');
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);
    
    // 修复 loop 函数
    const loop = (data: TreeNode[], key: string, callback: (arr: TreeNode[], index: number) => void) => {
      for (let i = 0; i < data.length; i++) {
        if (data[i].key === key) {
          return callback(data, i);
        }
        if (data[i].children) {
          loop(data[i].children || [], key, callback);
        }
      }
    };
    
    const data = [...treeData];
    let dragObj: TreeNode = {} as TreeNode;
    
    loop(data, dragKey, (arr, index) => {
      dragObj = arr.splice(index, 1)[0];
    });
    
    if (!info.dropToGap) {
      loop(data, dropKey, (arr, index) => {
        arr[index].children = arr[index].children || [];
        arr[index].children.unshift(dragObj);
      });
    } else if (
      (info.node.children || []).length > 0 && info.node.expanded && dropPosition === 1
    ) {
      loop(data, dropKey, (arr, index) => {
        arr[index].children = arr[index].children || [];
        arr[index].children.unshift(dragObj);
      });
    } else {
      let ar: TreeNode[] = [];
      let i: number = 0;
      loop(data, dropKey, (arr, index) => {
        ar = arr;
        i = index;
      });
      ar.splice(i + (dropPosition === -1 ? 0 : 1), 0, dragObj);
    }
    setTreeData(data);
  };

  // 获取特定模板的信息
  const getTemplateInfo = (templateName: string) => {
    return templateInfo.find(info => info.value === templateName);
  };

  // 处理语音识别结果 - 标题
  const handleTopicVoiceInput = (text: string) => {
    setTopic(text);
    message.success('语音输入成功: ' + text);
  };
  
  // 处理语音识别结果 - 背景描述
  const handleBackgroundVoiceInput = (text: string) => {
    setBackground(text);
    message.success('语音输入成功: ' + text);
  };

  // 生成PPT
  const handleGeneratePPT = async () => {
    if (!topic) {
      message.warning('请填写课程主题');
      return;
    }
    setShowProgress(true);
  };

  // 显示语音指南
  const showVoiceInputGuide = () => {
    Modal.info({
      title: '语音输入使用指南',
      width: 600,
      content: (
        <div style={{ padding: '10px 0' }}>
          <h3>如何使用语音输入功能</h3>
          <p>1. 点击"语音输入"按钮开始录音</p>
          <p>2. 清晰地说出您想要输入的内容</p>
          <p>3. 点击"停止录音"按钮结束录音</p>
          <p>4. 系统会自动将您的语音转换为文字</p>
          <p>5. 您可以点击"播放"按钮听取录音内容</p>
          <p>6. 如需重新录制，请点击"删除"按钮后重新开始</p>
          <br />
          <h3>使用技巧</h3>
          <p>• 请在安静的环境中录音，避免背景噪音</p>
          <p>• 说话语速适中，发音清晰</p>
          <p>• 录音时与麦克风保持适当距离(15-30厘米)</p>
          <p>• 如识别结果不准确，可尝试重新录制</p>
        </div>
      ),
      okText: '我知道了'
    });
  };

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <Title level={3}>结构化PPT大纲编辑器</Title>
      <Row gutter={24}>
        <Col span={16}>
          {/* 课程参数输入区 - 增加语音输入按钮和使用指南 */}
          <div style={{ background: '#fafdff', borderRadius: 8, padding: 18, marginBottom: 18, boxShadow: '0 1px 4px #e0e7ff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 500 }}>课程信息设置</div>
              <Button 
                type="text" 
                icon={<QuestionCircleOutlined />} 
                onClick={showVoiceInputGuide}
              >
                语音输入指南
              </Button>
            </div>
            <Form layout="inline">
              <Form.Item label="课程主题">
                <Input.Group compact>
                  <Input
                    style={{ width: 'calc(100% - 120px)' }}
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="请输入课程主题"
                  />
                  <AudioRecorder
                    onAudioText={(text) => {
                      setTopic(text);
                      message.success('语音输入成功: ' + text);
                    }}
                    buttonText="语音输入"
                    placeholder="点击开始录制课程主题"
                  />
                </Input.Group>
              </Form.Item>
              <Form.Item label="页数">
                <InputNumber min={3} max={20} value={pages} onChange={v => setPages(Number(v))} style={{ width: 80 }} />
              </Form.Item>
              <Form.Item label="补充说明">
                <Input.Group compact>
                  <TextArea
                    style={{ width: 'calc(100% - 120px)' }}
                    rows={4}
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    placeholder="请输入补充说明（选填）"
                  />
                  <div style={{ marginTop: 8 }}>
                    <AudioRecorder
                      onAudioText={(text) => {
                        setBackground(text);
                        message.success('语音输入成功: ' + text);
                      }}
                      buttonText="语音输入"
                      placeholder="点击开始录制补充说明"
                    />
                  </div>
                </Input.Group>
              </Form.Item>
            </Form>
          </div>
          {/* 进度与预览弹窗 */}
          {showProgress && <PPTProgressPreview outline={treeData} onClose={() => setShowProgress(false)} pages={pages} topic={topic} background={background} />}
          {/* 主体内容 */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, minHeight: 400, boxShadow: '0 1px 4px #e0e7ff' }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 500 }}>大纲结构</span>
              <Button 
                type="default" 
                icon={<AudioOutlined />} 
                onClick={showVoiceInputGuide}
              >
                使用语音编辑节点
              </Button>
            </div>
            <Tree
              draggable
              blockNode
              treeData={renderTreeNodes(treeData)}
              onDrop={onDrop}
              onSelect={(keys) => {
                if (keys.length > 0) {
                  setSelectedKey(keys[0].toString());
                }
              }}
              defaultExpandAll
            />
            <Button type="dashed" icon={<PlusOutlined />} style={{ marginTop: 16 }} onClick={() => addNode(null)}>新增章节</Button>
          </div>
          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Button type="primary" size="large" loading={loading} onClick={handleGeneratePPT}>生成PPT</Button>
          </div>
        </Col>
        <Col span={8}>
          {/* 模板选择区域 */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px #e0e7ff' }}>
            <div style={{ 
              fontWeight: 600, 
              fontSize: 16, 
              marginBottom: 16, 
              color: '#333',
              display: 'flex',
              alignItems: 'center',
              gap: 8 
            }}>
              <FileTextOutlined /> 选择PPT模板
            </div>
            
            {/* 模板预览 */}
            <div style={{ marginBottom: 20 }}>
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
                    src={getTemplateInfo(selectedTemplate)?.previewUrl || '/default-pic.png'} 
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
            
            {/* 模板列表 */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 500, marginBottom: 8 }}>可用模板</div>
              {loadingTemplates ? (
                <Spin />
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(2, 1fr)', 
                  gap: 12,
                  maxHeight: 300,
                  overflowY: 'auto',
                  padding: '4px 0'
                }}>
                  {templateInfo.map(template => (
                    <Card
                      key={template.value}
                      size="small"
                      hoverable
                      style={{ 
                        cursor: 'pointer',
                        border: selectedTemplate === template.value ? '2px solid #1890ff' : '1px solid #eee',
                        background: selectedTemplate === template.value ? '#e6f7ff' : '#fff'
                      }}
                      onClick={() => setSelectedTemplate(template.value)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontSize: 18 }}>{template.icon}</div>
                        <div style={{ fontSize: 13 }}>{template.name}</div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            
            {/* 模板描述 */}
            {selectedTemplate && getTemplateInfo(selectedTemplate) && (
              <div style={{ marginTop: 16, padding: 12, background: '#f0f7ff', borderRadius: 6, fontSize: 13, color: '#666' }}>
                <div style={{ fontWeight: 500, marginBottom: 4, color: '#333' }}>模板说明</div>
                <div>{getTemplateInfo(selectedTemplate)?.description}</div>
              </div>
            )}
          </div>
        </Col>
      </Row>
      {/* 语音输入使用指南模态框 */}
      <Modal
        title="语音输入使用指南"
        open={showVoiceGuide}
        onCancel={() => setShowVoiceGuide(false)}
        footer={[
          <Button key="close" onClick={() => setShowVoiceGuide(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        <div style={{ padding: '10px 0' }}>
          <Title level={4}>如何使用语音输入</Title>
          <div style={{ marginBottom: 16 }}>
            <p>语音输入功能可以帮助您更快速地创建PPT内容。以下是使用步骤：</p>
            <ol style={{ paddingLeft: 24 }}>
              <li>在输入框旁边的麦克风图标按钮上点击</li>
              <li>开始录音后，清晰地说出您想要输入的内容</li>
              <li>点击停止录音按钮结束录音</li>
              <li>系统会自动识别您的语音并填入相应的输入框</li>
            </ol>
          </div>
          
          <Title level={4}>语音输入位置</Title>
          <div style={{ marginBottom: 16 }}>
            <p>当前页面中，您可以在以下位置使用语音输入：</p>
            <ul style={{ paddingLeft: 24 }}>
              <li>课程主题输入框</li>
              <li>补充说明输入框</li>
              <li>编辑大纲节点时（点击节点的编辑图标后）</li>
            </ul>
          </div>
          
          <Title level={4}>使用技巧</Title>
          <div style={{ marginBottom: 16 }}>
            <ul style={{ paddingLeft: 24 }}>
              <li>尽量在安静的环境中录音，减少背景噪音</li>
              <li>清晰地发音，适中的语速可提高识别准确率</li>
              <li>较短的内容（10-15秒）识别效果更好</li>
              <li>如果识别结果不理想，可以多次尝试或手动修改</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
} 