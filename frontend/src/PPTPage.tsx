import React, { useState, useEffect } from 'react';
import { Input, Button, Form, InputNumber, List, Card, Typography, message, Modal, Tree, Select, Row, Col, Spin } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined, SaveOutlined, CloseOutlined, FileTextOutlined } from '@ant-design/icons';
import PPTProgressPreview from './PPTProgressPreview';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const API = '/api/resource';

interface TemplateInfo {
  name: string;
  value: string;
  description: string;
  previewUrl: string;
  icon: string;
}

export default function PPTPage() {
  const [treeData, setTreeData] = useState([
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
  const [editingKey, setEditingKey] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [selectedKey, setSelectedKey] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [topic, setTopic] = useState('');
  const [background, setBackground] = useState('');
  const [pages, setPages] = useState(8);
  const [templates, setTemplates] = useState<string[]>([]);
  const [templateInfo, setTemplateInfo] = useState<TemplateInfo[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);

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
  const renderTreeNodes = data =>
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
                  />
                  <Button icon={<SaveOutlined />} size="small" onClick={() => saveEdit(item.key)} />
                  <Button icon={<CloseOutlined />} size="small" onClick={cancelEdit} style={{ marginLeft: 4 }} />
                </>
              ) : (
                <>
                  {item.title}
                  <Button icon={<EditOutlined />} size="small" onClick={() => startEdit(item.key, item.title)} style={{ marginLeft: 8 }} />
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
                />
                <Button icon={<SaveOutlined />} size="small" onClick={() => saveEdit(item.key)} />
                <Button icon={<CloseOutlined />} size="small" onClick={cancelEdit} style={{ marginLeft: 4 }} />
              </>
            ) : (
              <>
                {item.title}
                <Button icon={<EditOutlined />} size="small" onClick={() => startEdit(item.key, item.title)} style={{ marginLeft: 8 }} />
                <Button icon={<DeleteOutlined />} size="small" onClick={() => deleteNode(item.key)} style={{ marginLeft: 4 }} />
              </>
            )}
          </span>
        )
      };
    });

  // 编辑相关
  const startEdit = (key, value) => {
    setEditingKey(key);
    setEditingValue(value);
  };
  const saveEdit = key => {
    const update = (data) => data.map(item => {
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
  const addNode = key => {
    const add = (data) => data.map(item => {
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
  const deleteNode = key => {
    const del = (data) => data.filter(item => {
      if (item.key === key) return false;
      if (item.children) item.children = del(item.children);
      return true;
    });
    setTreeData(del(treeData));
  };

  // 拖拽排序
  const onDrop = info => {
    const dropKey = info.node.key;
    const dragKey = info.dragNode.key;
    const dropPos = info.node.pos.split('-');
    const dropPosition = info.dropPosition - Number(dropPos[dropPos.length - 1]);
    const loop = (data, key, callback) => {
      for (let i = 0; i < data.length; i++) {
        if (data[i].key === key) {
          return callback(data, i);
        }
        if (data[i].children) {
          loop(data[i].children, key, callback);
        }
      }
    };
    const data = [...treeData];
    let dragObj;
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
      let ar;
      let i;
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

  // 生成PPT
  const handleGeneratePPT = async () => {
    if (!topic) {
      message.warning('请填写课程主题');
      return;
    }
    setShowProgress(true);
  };

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <Title level={3}>结构化PPT大纲编辑器</Title>
      <Row gutter={24}>
        <Col span={16}>
          {/* 课程参数输入区 */}
          <div style={{ background: '#fafdff', borderRadius: 8, padding: 18, marginBottom: 18, boxShadow: '0 1px 4px #e0e7ff' }}>
            <Form layout="inline">
              <Form.Item label="课程主题" required>
                <Input value={topic} onChange={e => setTopic(e.target.value)} placeholder="如：微积分基础" style={{ width: 180 }} />
              </Form.Item>
              <Form.Item label="页数">
                <InputNumber min={3} max={20} value={pages} onChange={v => setPages(Number(v))} style={{ width: 80 }} />
              </Form.Item>
              <Form.Item label="补充说明">
                <Input value={background} onChange={e => setBackground(e.target.value)} placeholder="如：面向大一新生，突出应用" style={{ width: 220 }} />
              </Form.Item>
            </Form>
          </div>
          {/* 进度与预览弹窗 */}
          {showProgress && <PPTProgressPreview outline={treeData} onClose={() => setShowProgress(false)} pages={pages} topic={topic} background={background} />}
          {/* 主体内容 */}
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, minHeight: 400, boxShadow: '0 1px 4px #e0e7ff' }}>
            <Tree
              draggable
              blockNode
              treeData={renderTreeNodes(treeData)}
              onDrop={onDrop}
              onSelect={keys => setSelectedKey(keys[0])}
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
    </div>
  );
} 