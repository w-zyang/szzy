import React, { useState } from 'react';
import { Layout, Menu, Card, Row, Col, Button, Typography, Divider, Badge, Modal, message } from 'antd';
import {
  UserOutlined, FileTextOutlined, VideoCameraOutlined, RobotOutlined, FileSearchOutlined, GiftOutlined, TeamOutlined, AppstoreOutlined, StarOutlined, CrownOutlined, ReadOutlined, BookOutlined
} from '@ant-design/icons';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import PPTPage from './PPTPage';
import VideoPage from './VideoPage';
import CustomPage from './CustomPage';
import QuestionPage from './QuestionPage';
import WordPPTPage from './WordPPTPage';
import LoginPage from './LoginPage';
import TutorialPage from './TutorialPage';
import MyPPTPage from './MyPPTPage';
import MyVideoPage from './MyVideoPage';
import MyCustomPage from './MyCustomPage';
import MyQuestionPage from './MyQuestionPage';
import RegisterPage from './RegisterPage';
import ProfilePage from './ProfilePage';
import PPTProgressPreview from './PPTProgressPreview';
import ResourceManagementPage from './ResourceManagementPage';
import CaseGenerationPage from './CaseGenerationPage';
import ResourceCreationCenter from './ResourceCreationCenter';
import MindMapPage from './MindMapPage';
import './App.css';

const { Header, Sider, Content } = Layout;
const { Title, Paragraph } = Typography;

const menuGroups = [
  {
    label: '个人',
    children: [
      { key: 'profile', icon: <UserOutlined />, label: '个人中心' }
    ]
  },
  {
    label: '功能区',
    children: [
      { key: 'space', icon: <AppstoreOutlined />, label: '创作空间' },
      { key: 'creation', icon: <StarOutlined />, label: '资源创作中心' },
      { key: 'mindmap', icon: <BookOutlined />, label: '思维导图生成' },
      { key: 'resources', icon: <FileSearchOutlined />, label: '资源管理中心' },
      { key: 'tutorial', icon: <ReadOutlined />, label: '教程中心' },
      { key: 'digital', icon: <RobotOutlined />, label: '数字人专区' },
    ]
  },
  {
    label: '我的内容',
    children: [
      { key: 'video', icon: <VideoCameraOutlined />, label: '我的视频' },
      { key: 'ppt', icon: <FileTextOutlined />, label: '我的PPT' },
      { key: 'custom', icon: <TeamOutlined />, label: '我的定制' },
      { key: 'question', icon: <GiftOutlined />, label: '我的试题' },
    ]
  }
];

function BookIcon() {
  return <svg width="1em" height="1em" fill="currentColor" viewBox="0 0 1024 1024"><path d="M832 112H192a64 64 0 0 0-64 64v672a64 64 0 0 0 64 64h640a64 64 0 0 0 64-64V176a64 64 0 0 0-64-64zm0 736H192V176h640v672z" /></svg>;
}

const mainFeatures = [
  { title: '数字资源创作中心', desc: '一站式教学资源生成', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', btn: '开始创作', icon: <StarOutlined style={{ fontSize: 32, color: '#fff' }} />, route: '/creation-center' },
  { title: '资源管理', desc: '智能分类与搜索', color: '#f9f0ff', btn: '管理资源', icon: <FileSearchOutlined style={{ fontSize: 32, color: '#eb2f96' }} />, route: '/resources' },
  { title: '数字人专区', desc: '个性化形象定制', color: '#e6fffb', btn: '立即定制', icon: <RobotOutlined style={{ fontSize: 32, color: '#13c2c2' }} />, route: '/custom' },
];

const hotRecommends = [
  { title: '教程中心', desc: '学习平台使用指南', icon: <ReadOutlined />, color: '#f6ffed', route: '/tutorial' },
  { title: '资源管理', desc: '智能管理你的资源', icon: <FileSearchOutlined />, color: '#f9f0ff', route: '/resources' },
  { title: 'Word转PPT', desc: '上传word文档生成PPT', icon: <FileTextOutlined />, color: '#f0f5ff', route: '/wordppt' },
  { title: 'PPT转视频', desc: 'PPT一键转讲解视频', icon: <VideoCameraOutlined />, color: '#fff1f0', route: '/video' },
];

function MainLayout() {
  const [selected, setSelected] = React.useState('space');
  const navigate = useNavigate();
  const location = useLocation();
  React.useEffect(() => {
    if (location.pathname.startsWith('/profile')) setSelected('profile');
    else if (location.pathname.startsWith('/tutorial')) setSelected('tutorial');
    else if (location.pathname.startsWith('/creation-center')) setSelected('creation');
    else if (location.pathname.startsWith('/mindmap')) setSelected('mindmap');
    else if (location.pathname.startsWith('/resources')) setSelected('resources');
    else if (location.pathname.startsWith('/myppt')) setSelected('ppt');
    else if (location.pathname.startsWith('/myvideo')) setSelected('video');
    else if (location.pathname.startsWith('/mycustom')) setSelected('custom');
    else if (location.pathname.startsWith('/myquestion')) setSelected('question');
    else if (location.pathname.startsWith('/custom')) setSelected('digital');
    else setSelected('space');
  }, [location]);
  const handleMenu = (e: any) => {
    setSelected(e.key);
    switch (e.key) {
      case 'profile': navigate('/profile'); break;
      case 'tutorial': navigate('/tutorial'); break;
      case 'space': navigate('/'); break;
      case 'creation': navigate('/creation-center'); break;
      case 'mindmap': navigate('/mindmap'); break;
      case 'resources': navigate('/resources'); break;
      case 'digital': navigate('/custom'); break;
      case 'video': navigate('/myvideo'); break;
      case 'ppt': navigate('/myppt'); break;
      case 'custom': navigate('/mycustom'); break;
      case 'question': navigate('/myquestion'); break;
      default: navigate('/');
    }
  };
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0" style={{ background: '#112346', padding: 0 }}>
        <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#112346', marginBottom: 8 }}>
          <img src="/logo192.png" alt="logo" style={{ width: 28, marginRight: 8 }} />
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 16, letterSpacing: 1 }}>数字资源生成</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selected]}
          onClick={handleMenu}
          style={{ background: '#112346', fontSize: 14, lineHeight: '40px' }}
          items={menuGroups.map(group => ({
            key: group.label,
            label: <span style={{ color: '#8ca6db', fontSize: 12, fontWeight: 600 }}>{group.label}</span>,
            children: group.children.map(item => ({
              key: item.key,
              icon: item.icon,
              label: item.label,
              style: { borderRadius: 6, margin: '2px 0', fontWeight: selected === item.key ? 700 : 400, background: selected === item.key ? 'linear-gradient(90deg,#3b82f6 0%,#60a5fa 100%)' : undefined, color: selected === item.key ? '#fff' : undefined, height: 40 }
            }))
          }))}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: 0, fontSize: 18, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', fontWeight: 600, letterSpacing: 1, height: 48, lineHeight: '48px' }}>
          数字资源生成平台
        </Header>
                  <Content style={{ margin: '16px 16px 0', background: '#f5f6fa', minHeight: 360, borderRadius: 12, boxShadow: '0 2px 16px #f0f1f6' }}>
            <MainContent />
          </Content>
      </Layout>
    </Layout>
  );
}

function MainContent() {
  return (
    <div style={{ flex: 1, background: '#f5f6fa', minHeight: 'calc(100vh - 48px)', padding: '0 0 0 20px' }}>
      <Routes>
        <Route path="/" element={<MainContentHome />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/tutorial" element={<TutorialPage />} />
        <Route path="/myppt" element={<MyPPTPage />} />
        <Route path="/myvideo" element={<MyVideoPage />} />
        <Route path="/mycustom" element={<MyCustomPage />} />
        <Route path="/myquestion" element={<MyQuestionPage />} />
        <Route path="/ppt" element={<PPTPage />} />
        <Route path="/video" element={<VideoPage />} />
        <Route path="/custom" element={<CustomPage />} />
        <Route path="/question" element={<QuestionPage />} />
        <Route path="/wordppt" element={<WordPPTPage />} />
        <Route path="/resources" element={<ResourceManagementPage />} />
        <Route path="/case" element={<CaseGenerationPage />} />
        <Route path="/creation-center" element={<ResourceCreationCenter />} />
        <Route path="/mindmap" element={<MindMapPage />} />
      </Routes>
    </div>
  );
}

function MainContentHome() {
  const navigate = useNavigate();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const [pptModalOpen, setPptModalOpen] = useState(false);
  // AI大纲相关状态
  const [pptTopic, setPptTopic] = useState('');
  const [pptBackground, setPptBackground] = useState('');
  const [pptPages, setPptPages] = useState('8');
  const [pptRole, setPptRole] = useState('');
  const [pptScene, setPptScene] = useState('');
  const [pptDeepThink, setPptDeepThink] = useState(false);
  const [pptWebSearch, setPptWebSearch] = useState(false);
  const [pptOutline, setPptOutline] = useState<any>('');
  const [pptLoading, setPptLoading] = useState(false);
  const [pptGenLoading, setPptGenLoading] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [templates, setTemplates] = useState<string[]>([]);
  const [templateInfo, setTemplateInfo] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // 获取模板列表
  React.useEffect(() => {
    if (pptModalOpen) {
      fetchTemplates();
    }
  }, [pptModalOpen]);

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

  // 获取特定模板的信息
  const getTemplateInfo = (templateName: string) => {
    return templateInfo.find(info => info.value === templateName);
  };

  // 生成大纲
  const handleGenerateOutline = async () => {
    setPptLoading(true);
    setPptOutline('');
    try {
      const res = await fetch('/api/aiPpt/generate-outline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: pptTopic,
          background: pptBackground,
          pages: pptPages,
          role: pptRole,
          scene: pptScene,
          deepThink: pptDeepThink,
          webSearch: pptWebSearch
        })
      }).then(r => r.json());
      setPptOutline(res.outline || 'AI未返回大纲');
    } catch (e) {
      setPptOutline('AI大纲生成失败，请重试');
    }
    setPptLoading(false);
  };
  // 生成PPT
  const handleGeneratePPT = async () => {
    setPptGenLoading(true);
    let outlineData = pptOutline;
    
    // 如果是字符串，尝试解析为JSON，失败则使用文本解析
    if (typeof pptOutline === 'string') {
      try {
        // 尝试解析JSON
        const jsonMatch = pptOutline.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          outlineData = JSON.parse(jsonMatch[0]);
        } else {
          outlineData = parseOutline(pptOutline);
        }
      } catch (e) {
        outlineData = parseOutline(pptOutline);
      }
    }
    
    // 修正：递归将children中的字符串转为对象，增加visited保护防止循环引用
    function normalizeOutline(arr: any[], visited = new Set()): any[] {
      if (!Array.isArray(arr)) return [];
      return arr.map(item => {
        // 防止循环引用
        if (visited.has(item)) {
          return { title: '循环引用节点', children: [] };
        }
        visited.add(item);
        
        // 如果item本身是字符串，转为对象
        if (typeof item === 'string') {
          return { title: item, children: [] };
        }
        
        // 如果item不是对象，转为默认对象
        if (typeof item !== 'object' || item === null) {
          return { title: '无效节点', children: [] };
        }
        
        // 处理children
        if (Array.isArray(item.children)) {
          return { ...item, children: normalizeOutline(item.children, visited) };
        }
        
        return item;
      });
    }
    
    try {
      // 规范化大纲数据
      outlineData = normalizeOutline(outlineData);
      
      // 显示进度预览
      setShowProgress(true);
      setPptModalOpen(false);
      setPptGenLoading(false);
      
      // 注意：实际的PPT生成是在PPTProgressPreview组件中通过WebSocket完成的
    } catch (e) {
      console.error('处理大纲数据失败', e);
      setPptGenLoading(false);
      message.error('处理大纲数据失败，请重试');
    }
  };

  // 解析大纲文本为分层结构
  function parseOutline(text: string) {
    if (!text) return [];
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const result: any[] = [];
    let currentChapter: any = null;
    
    lines.forEach(line => {
      // 跳过markdown格式和分隔符
      if (line.startsWith('#') || line.startsWith('---') || line === '') {
        return;
      }
      
      if (/^(第[一二三四五六七八九十]+[章节]|章节[\d]+|[\d]+[\.、])/.test(line)) {
        // 新章节
        currentChapter = { title: line, children: [] };
        result.push(currentChapter);
      } else if (/^[\d]+[\.、]/.test(line) || line.startsWith('-') || line.startsWith('•')) {
        // 要点
        if (currentChapter) {
          currentChapter.children.push(line);
        } else {
          result.push({ title: line, children: [] });
        }
      } else if (line.length > 0) {
        // 主题或摘要
        result.push({ title: line, children: [] });
      }
    });
    
    // 过滤掉无效的节点
    return result.filter(item => item.title && item.title.trim().length > 0);
  }

  function OutlineTree({ outline }: { outline: string | any[] }) {
    let data;
    if (typeof outline === 'string') {
      data = parseOutline(outline);
    } else if (Array.isArray(outline)) {
      data = outline;
    } else {
      data = [];
    }
    
    const renderNode = (item: any, level: number = 0) => {
      return (
        <div key={item.title || level} style={{ marginBottom: 8, marginLeft: level * 16 }}>
          <div style={{ 
            fontWeight: level === 0 ? 700 : 600, 
            color: level === 0 ? '#2176c7' : '#333', 
            fontSize: level === 0 ? 16 : 15 
          }}>
            {item.title}
          </div>
          {item.children && Array.isArray(item.children) && item.children.length > 0 && (
            <div style={{ marginLeft: 16, marginTop: 4 }}>
              {item.children.map((child: any, i: number) => renderNode(child, level + 1))}
            </div>
          )}
        </div>
      );
    };
    
    return (
      <div>
        {data.map((item, idx) => renderNode(item, 0))}
      </div>
    );
  }

  return (
    <div style={{ padding: 12 }}>
      <div style={{ textAlign: 'right', marginBottom: 12 }}>
        {!token && (
          <>
            <Button type="primary" style={{ marginRight: 8 }} onClick={() => navigate('/login')}>登录</Button>
            <Button onClick={() => navigate('/register')}>注册</Button>
          </>
        )}
      </div>
      {/* 主功能区块：左大右两小 */}
      <Row gutter={[12, 12]}>
        {/* 左侧大卡片 */}
        <Col xs={24} md={16}>
          <Card style={{ background: mainFeatures[0].color, borderRadius: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', cursor: 'pointer' }} variant="borderless"
            onClick={() => token ? navigate(mainFeatures[0].route) : navigate('/login')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 32, width: '100%', justifyContent: 'center' }}>
              {mainFeatures[0].icon}
              <div style={{ textAlign: 'left', color: 'white' }}>
                <Title level={3} style={{ margin: 0, color: 'white' }}>{mainFeatures[0].title}</Title>
                <Paragraph style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: 18 }}>{mainFeatures[0].desc}</Paragraph>
                <Button type="primary" style={{ 
                  marginTop: 24, 
                  borderRadius: 20, 
                  padding: '8px 40px', 
                  fontWeight: 600, 
                  fontSize: 18,
                  background: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white'
                }} onClick={(e) => { e.stopPropagation(); token ? navigate(mainFeatures[0].route) : navigate('/login'); }}>
                  {mainFeatures[0].btn}
                </Button>
              </div>
            </div>
          </Card>
        </Col>
        {/* 右侧两小卡片 */}
        <Col xs={24} md={8}>
          <Row gutter={[12, 12]}>
            {mainFeatures.slice(1).map((f, i) => (
              <Col span={24} key={i}>
                <Card style={{ background: f.color, borderRadius: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.06)', minHeight: 104, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }} variant="borderless">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', justifyContent: 'center' }}>
                    {f.icon}
                    <div style={{ textAlign: 'left' }}>
                      <Title level={5} style={{ margin: 0 }}>{f.title}</Title>
                      <Paragraph style={{ margin: 0, color: '#888' }}>{f.desc}</Paragraph>
                      <Button type="primary" style={{ marginTop: 12, borderRadius: 20, padding: '4px 24px', fontWeight: 500, fontSize: 15 }} onClick={() => navigate(f.route)}>{f.btn}</Button>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>

      {/* 弹窗：输入PPT主题创作 */}
      <Modal
        open={pptModalOpen}
        onCancel={() => setPptModalOpen(false)}
        footer={null}
        width={1200}
        title={null}
        centered
        styles={{ body: { background: '#eaf6ff', borderRadius: 16 } }}
      >
        <div style={{ display: 'flex', gap: 24, minHeight: 520 }}>
          {/* 左侧表单 */}
          <div style={{ flex: 2, minWidth: 480 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#2176c7' }}>根据主题要求创作PPT</div>
                <div style={{ color: '#6b7b8d', marginTop: 4 }}>输入您想要生成PPT的主题，AI帮您生成大纲和内容，您可以根据需求进行编辑和修改</div>
              </div>
              <img src="/ppt-form-banner.png" alt="banner" style={{ width: 120, marginLeft: 16 }} />
            </div>
            <div style={{ background: '#fff', borderRadius: 16, padding: '16px 24px', display: 'flex', alignItems: 'center', marginBottom: 18, boxShadow: '0 1px 4px #e0e7ff' }}>
              <input
                placeholder="输入您想要生成PPT的主题（必填）"
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: 18, background: 'transparent' }}
                maxLength={60}
                value={pptTopic}
                onChange={e => setPptTopic(e.target.value)}
              />
              <Button type="primary" icon={<FileTextOutlined />} style={{ marginLeft: 16, borderRadius: 20, fontWeight: 600 }}
                loading={pptLoading}
                onClick={handleGenerateOutline}
                disabled={!pptTopic.trim()}
              >
                生成大纲
              </Button>
            </div>
            <div style={{ background: '#fff', borderRadius: 16, padding: '16px 24px', marginBottom: 18, boxShadow: '0 1px 4px #e0e7ff' }}>
              <textarea
                placeholder="在此输入生成要求或背景信息（选填）"
                style={{ width: '100%', minHeight: 120, border: 'none', outline: 'none', fontSize: 16, background: 'transparent', resize: 'none' }}
                maxLength={1200}
                value={pptBackground}
                onChange={e => setPptBackground(e.target.value)}
              />
              <div style={{ textAlign: 'right', color: '#b0b0b0', fontSize: 13, marginTop: 4 }}>T 字数: {pptBackground.length} / 1200</div>
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 18 }}>
              <input 
                type="number" 
                min="3" 
                max="20" 
                style={{ flex: 1, borderRadius: 8, border: '1px solid #d0e2f5', padding: '6px 12px', fontSize: 15, color: '#2176c7' }} 
                placeholder="页数 (3-20)" 
                value={pptPages} 
                onChange={e => setPptPages(e.target.value)} 
              />
              <input style={{ flex: 1, borderRadius: 8, border: '1px solid #d0e2f5', padding: '6px 12px', fontSize: 15, color: '#2176c7' }} placeholder="演讲角色 请输⼊" value={pptRole} onChange={e => setPptRole(e.target.value)} />
              <input style={{ flex: 1, borderRadius: 8, border: '1px solid #d0e2f5', padding: '6px 12px', fontSize: 15, color: '#2176c7' }} placeholder="演讲场景 请输⼊" value={pptScene} onChange={e => setPptScene(e.target.value)} />
            </div>
            <div style={{ margin: '18px 0 0 0', borderTop: '1px solid #e0e7ff', paddingTop: 12 }}>
              <div style={{ color: '#2176c7', fontWeight: 500, marginBottom: 8 }}>
                <span role="img" aria-label="light">💡</span> 预设主题
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                {['产品介绍','大学生职业规划','商业计划书','个人介绍','历史事件解读','竞争对手分析','新市场进入策略','新品上市计划','地理知识介绍','员工培训计划','工作汇报','团建活动策划/奖'].map((tag, idx) => (
                  <span key={idx} style={{ background: '#f4faff', color: '#2176c7', borderRadius: 16, padding: '6px 18px', fontSize: 15, cursor: 'pointer', border: '1px solid #e0e7ff', marginBottom: 4 }}
                    onClick={() => setPptTopic(tag)}>{tag}</span>
                ))}
              </div>
            </div>
            
            {/* 模板选择区域 */}
            <div style={{ margin: '18px 0 0 0', borderTop: '1px solid #e0e7ff', paddingTop: 12 }}>
              <div style={{ color: '#2176c7', fontWeight: 500, marginBottom: 8 }}>
                <span role="img" aria-label="palette">🎨</span> 选择模板
              </div>
              
              {loadingTemplates ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: 36, marginBottom: 8 }}>⏳</div>
                  <div>加载模板中...</div>
                </div>
              ) : (
                <>
                  {/* 模板预览 */}
                  {selectedTemplate && (
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ 
                        border: '1px solid #e0e7ff', 
                        borderRadius: 8, 
                        padding: 8,
                        background: '#f9faff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                      }}>
                        <img 
                          src={getTemplateInfo(selectedTemplate)?.previewUrl || '/default-pic.png'} 
                          alt="模板预览" 
                          style={{ 
                            maxWidth: '100%', 
                            height: 120, 
                            objectFit: 'contain',
                            borderRadius: 4,
                            marginBottom: 8
                          }} 
                        />
                        <div style={{ fontSize: 13, color: '#666', textAlign: 'center' }}>
                          当前选择：{getTemplateInfo(selectedTemplate)?.name || selectedTemplate.replace('.pptx', '')}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* 模板列表 */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr)', 
                    gap: 8,
                    maxHeight: 120,
                    overflowY: 'auto',
                    padding: '4px 0'
                  }}>
                    {templateInfo.map(template => (
                      <div
                        key={template.value}
                        style={{ 
                          cursor: 'pointer',
                          border: selectedTemplate === template.value ? '2px solid #2176c7' : '1px solid #e0e7ff',
                          background: selectedTemplate === template.value ? '#e6f7ff' : '#fff',
                          borderRadius: 6,
                          padding: '6px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                        onClick={() => setSelectedTemplate(template.value)}
                      >
                        <div style={{ fontSize: 16 }}>{template.icon}</div>
                        <div style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {template.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          {/* 右侧AI大纲展示 */}
          <div style={{ flex: 2, minWidth: 420, background: '#fff', borderRadius: 12, padding: 24, minHeight: 480, boxShadow: '0 1px 4px #e0e7ff', display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#2176c7', marginBottom: 12 }}>AI生成大纲</div>
            <div style={{ flex: 1, height: '100%', minHeight: 400, overflowY: 'auto', background: '#fff', borderRadius: 8, padding: 8, border: '1px solid #f0f0f0' }}>
              {pptLoading ? 'AI正在生成大纲...' : (pptOutline
                ? <OutlineTree outline={pptOutline} />
                : '请先输入主题并点击生成大纲')}
            </div>
            <div style={{ textAlign: 'right', marginTop: 18 }}>
              <Button type="primary" size="large" style={{ borderRadius: 20, padding: '0 48px', fontWeight: 600, fontSize: 18 }}
                onClick={handleGeneratePPT} disabled={!pptOutline || pptLoading} loading={pptGenLoading}>
                生成PPT
              </Button>
            </div>
          </div>
        </div>
      </Modal>
      {showProgress && <PPTProgressPreview outline={typeof pptOutline === 'string' ? parseOutline(pptOutline) : pptOutline} onClose={() => setShowProgress(false)} pages={Number(pptPages)} topic={pptTopic} background={pptBackground} template={selectedTemplate} />}
      <Divider orientation="left" style={{ margin: '32px 0 16px' }}>热门推荐</Divider>
      {/* 热门推荐区块：两行三列 */}
      <Row gutter={[12, 12]}>
        {hotRecommends.slice(0, 6).map((f, i) => (
          <Col xs={24} sm={12} md={8} lg={8} key={i}>
            <Card style={{ background: f.color, borderRadius: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.06)', cursor: 'pointer', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }} variant="borderless" onClick={() => navigate(f.route)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', justifyContent: 'center' }}>
                {f.icon}
                <div style={{ textAlign: 'center' }}>
                  <Title level={5} style={{ margin: 0 }}>{f.title}</Title>
                  <Paragraph style={{ margin: 0, color: '#888' }}>{f.desc}</Paragraph>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!token) {
    window.location.href = '/login';
    return null;
  }
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/*" element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        } />
      </Routes>
    </Router>
  );
} 