import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Button, Space, Tag, Badge, Modal, Divider, Input, Statistic, Progress, Timeline, List, Avatar, Tooltip, Carousel, Tabs } from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  FileTextOutlined, VideoCameraOutlined, BulbOutlined, QuestionCircleOutlined, 
  DatabaseOutlined, RobotOutlined, AudioOutlined, CameraOutlined, 
  ThunderboltOutlined, ExperimentOutlined, BookOutlined, StarOutlined,
  ReadOutlined, FileSearchOutlined, RocketOutlined, CrownOutlined,
  FireOutlined, TrophyOutlined, HeartOutlined, GlobalOutlined,
  CloudOutlined, SecurityScanOutlined, UserOutlined, TeamOutlined,
  CalendarOutlined, ClockCircleOutlined, LikeOutlined, DownloadOutlined,
  EyeOutlined, MessageOutlined, ShareAltOutlined, GiftOutlined,
  ToolOutlined, ApiOutlined, SafetyOutlined, BulbFilled,
  LineChartOutlined, BarChartOutlined, PieChartOutlined, DashboardOutlined,
  PlayCircleOutlined, PauseCircleOutlined, FastForwardOutlined,
  MobileOutlined, TabletOutlined, DesktopOutlined, CloudServerOutlined,
  AppstoreAddOutlined, SettingOutlined, BellOutlined, MailOutlined,
  EditOutlined
} from '@ant-design/icons';
import PPTProgressPreview from './PPTProgressPreview';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

// 1. 全局主色、圆角、阴影等样式变量
const MAIN_GRADIENT = 'linear-gradient(135deg, #5b8cfa 0%, #764ba2 100%)';
const CARD_RADIUS = 24;
const CARD_SHADOW = '0 8px 32px rgba(91,140,250,0.10)';
const BTN_GRADIENT = 'linear-gradient(90deg, #5b8cfa 0%, #764ba2 100%)';
const BTN_RADIUS = 25;
const BTN_HEIGHT = 48;
const PRIMARY_COLOR = '#5b8cfa';

export default function MainContentHome() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [currentTime, setCurrentTime] = useState(new Date());

  // PPT生成相关状态
  const [pptModalOpen, setPptModalOpen] = useState(false);
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

  // 思维导图生成相关状态
  const [mindMapModalOpen, setMindMapModalOpen] = useState(false);
  const [mindMapContent, setMindMapContent] = useState('');
  const [mindMapSubject, setMindMapSubject] = useState('');
  const [mindMapChapter, setMindMapChapter] = useState('');
  const [mindMapResult, setMindMapResult] = useState<any>('');
  const [mindMapLoading, setMindMapLoading] = useState(false);
  const [keyPointsResult, setKeyPointsResult] = useState<any>('');
  const [keyPointsLoading, setKeyPointsLoading] = useState(false);

  // 定时更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogin = () => {
    navigate('/login');
  };

  // 生成思维导图
  const handleGenerateMindMap = async () => {
    if (!mindMapContent.trim()) {
      alert('请输入课本内容');
      return;
    }
    
    setMindMapLoading(true);
    setMindMapResult('');
    
    try {
      const response = await fetch('/api/resource/mindmap/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          content: mindMapContent,
          subject: mindMapSubject,
          chapter: mindMapChapter
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setMindMapResult(data.mindMap);
      } else {
        setMindMapResult('思维导图生成失败，请重试');
      }
    } catch (error) {
      console.error('生成思维导图出错:', error);
      setMindMapResult('思维导图生成失败，请重试');
    }
    
    setMindMapLoading(false);
  };

  // 生成上课重难点
  const handleGenerateKeyPoints = async () => {
    if (!mindMapContent.trim()) {
      alert('请输入课本内容');
      return;
    }
    
    setKeyPointsLoading(true);
    setKeyPointsResult('');
    
    try {
      const response = await fetch('/api/resource/keypoints/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          content: mindMapContent,
          subject: mindMapSubject,
          chapter: mindMapChapter
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setKeyPointsResult(data.keyPoints);
      } else {
        setKeyPointsResult('重难点生成失败，请重试');
      }
    } catch (error) {
      console.error('生成重难点出错:', error);
      setKeyPointsResult('重难点生成失败，请重试');
    }
    
    setKeyPointsLoading(false);
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
        
        let children = item.children || [];
        // 如果children是字符串数组，转为对象数组
        if (Array.isArray(children) && children.length > 0 && typeof children[0] === 'string') {
          children = children.map(str => ({ title: str, children: [] }));
        } else if (Array.isArray(children) && children.length > 0) {
          children = normalizeOutline(children, visited);
        }
        return { ...item, children };
      });
    }
    
    outlineData = normalizeOutline(outlineData);
    console.log('发送给PPT生成的outline:', outlineData);
    console.log('发送给PPT生成的页数:', pptPages);
    setShowProgress(true);
    setPptGenLoading(false);
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

  // 核心功能区 - 重新设计更丰富的布局
  const primaryFeatures = [
    {
      title: '🎨 数字资源创作中心',
      description: '一站式教学资源生成',
      subtitle: 'AI驱动的多模态内容创作平台',
      route: '/creation-center',
      features: ['PPT课件', '教学案例', '试题习题', '教学视频', '音频素材', '图像素材'],
      color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      stats: { templates: '1000+', users: '50K+', satisfaction: '99%' }
    },
    {
      title: '📚 资源管理中心', 
      description: '智能分类与搜索',
      subtitle: '高效管理您的教学资源库',
      route: '/resources',
      features: ['智能分类', '快速搜索', '批量管理', '共享协作'],
      color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      stats: { resources: '100K+', categories: '50+', downloads: '1M+' }
    }
  ];

  // 快捷工具栏 - 增加更多实用功能
  const quickTools = [
    {
      title: '快速PPT',
      description: '3分钟生成',
      icon: <FileTextOutlined style={{ fontSize: 20, color: '#1890ff' }} />,
      color: '#e6f7ff',
      onClick: () => setPptModalOpen(true),
      badge: 'HOT'
    },
    {
      title: 'AI问答',
      description: '智能助手',
      icon: <BulbFilled style={{ fontSize: 20, color: '#fa8c16' }} />,
      color: '#fff7e6',
      route: '/ai-chat',
      badge: 'NEW'
    },
    {
      title: '模板库',
      description: '精选模板',
      icon: <DatabaseOutlined style={{ fontSize: 20, color: '#52c41a' }} />,
      color: '#f6ffed',
      route: '/templates'
    },
    {
      title: '协作空间',
      description: '团队协作',
      icon: <TeamOutlined style={{ fontSize: 20, color: '#722ed1' }} />,
      color: '#f9f0ff',
      route: '/collaboration'
    },
    {
      title: '素材库',
      description: '海量素材',
      icon: <CameraOutlined style={{ fontSize: 20, color: '#eb2f96' }} />,
      color: '#fff0f6',
      route: '/materials'
    },
    {
      title: '数据分析',
      description: '使用统计',
      icon: <BarChartOutlined style={{ fontSize: 20, color: '#13c2c2' }} />,
      color: '#e6fffb',
      route: '/analytics'
    },
    {
      title: 'AI语音',
      description: '智能配音',
      icon: <AudioOutlined style={{ fontSize: 20, color: '#ff7a45' }} />,
      color: '#fff2e8',
      route: '/voice',
      badge: 'NEW'
    },
    {
      title: '在线编辑',
      description: '实时编辑',
      icon: <EditOutlined style={{ fontSize: 20, color: '#9254de' }} />,
      color: '#f9f0ff',
      route: '/editor'
    },
    {
      title: '云存储',
      description: '无限空间',
      icon: <CloudOutlined style={{ fontSize: 20, color: '#36cfc9' }} />,
      color: '#e6fffb',
      route: '/storage'
    },
    {
      title: '思维导图',
      description: '课本分析',
      icon: <BookOutlined style={{ fontSize: 20, color: '#52c41a' }} />,
      color: '#f6ffed',
      onClick: () => setMindMapModalOpen(true),
      badge: 'NEW'
    }
  ];

  // 学习资源推荐
  const learningResources = [
    {
      title: 'PPT设计进阶教程',
      category: '设计教程',
      duration: '45分钟',
      level: '中级',
      thumbnail: '/default-pic.png',
      author: '设计大师',
      views: 12840,
      rating: 4.9,
      tags: ['设计', '进阶', '实用']
    },
    {
      title: 'AI工具使用指南',
      category: 'AI教程',
      duration: '30分钟',
      level: '初级',
      thumbnail: '/default-pic.png',
      author: 'AI专家',
      views: 8956,
      rating: 4.8,
      tags: ['AI', '入门', '实用']
    },
    {
      title: '高效教学方法分享',
      category: '教学技巧',
      duration: '60分钟',
      level: '高级',
      thumbnail: '/default-pic.png',
      author: '教育专家',
      views: 15672,
      rating: 4.9,
      tags: ['教学', '方法', '高效']
    }
  ];

  // 社区互动数据
  const communityStats = [
    { title: '社区话题', value: 2847, icon: <MessageOutlined />, color: '#1890ff' },
    { title: '用户分享', value: 1596, icon: <ShareAltOutlined />, color: '#52c41a' },
    { title: '点赞互动', value: 8423, icon: <HeartOutlined />, color: '#ff4d4f' },
    { title: '专家答疑', value: 634, icon: <UserOutlined />, color: '#fa8c16' }
  ];

  // 最新资讯
  const latestNews = [
    {
      title: '🎉 平台用户突破10万！感谢大家的支持与信任',
      time: '2024-01-15',
      type: '平台动态',
      hot: true
    },
    {
      title: '🚀 新增AI视频生成功能，支持多种风格定制',
      time: '2024-01-14',
      type: '功能更新',
      hot: true
    },
    {
      title: '📚 教师节特别活动：免费模板大放送开始啦',
      time: '2024-01-13',
      type: '活动公告',
      hot: false
    },
    {
      title: '🏆 恭喜获得"最佳教育科技产品"奖项',
      time: '2024-01-12',
      type: '荣誉资讯',
      hot: false
    }
  ];

  // 用户作品展示
  const userWorks = [
    {
      title: '中国古代文学史课件',
      author: '李教授',
      category: '文学教育',
      thumbnail: '/default-pic.png',
      likes: 156,
      views: 2340,
      downloads: 89,
      featured: true
    },
    {
      title: '数学函数概念讲解',
      author: '王老师',
      category: '数学教育',
      thumbnail: '/default-pic.png',
      likes: 234,
      views: 3450,
      downloads: 123,
      featured: true
    },
    {
      title: '英语语法练习题集',
      author: '张老师',
      category: '英语教育',
      thumbnail: '/default-pic.png',
      likes: 189,
      views: 1890,
      downloads: 67,
      featured: false
    }
  ];

  // 实时数据展示 - 扩展更多统计数据
  const realtimeStats = [
    { 
      title: '今日生成', 
      value: 1234, 
      suffix: '个',
      icon: <FireOutlined style={{ color: '#ff4d4f' }} />,
      trend: '+12%'
    },
    { 
      title: '在线用户', 
      value: 3567, 
      suffix: '人',
      icon: <UserOutlined style={{ color: '#52c41a' }} />,
      trend: '+8%'
    },
    { 
      title: '累计下载', 
      value: 89765, 
      suffix: '次',
      icon: <DownloadOutlined style={{ color: '#1890ff' }} />,
      trend: '+15%'
    },
    { 
      title: '用户满意度', 
      value: 98.5, 
      suffix: '%',
      icon: <LikeOutlined style={{ color: '#fa8c16' }} />,
      trend: '+2%'
    }
  ];

  // 扩展统计数据 - 第二行
  const extendedStats = [
    { 
      title: '资源总数', 
      value: 125840, 
      suffix: '个',
      icon: <DatabaseOutlined style={{ color: '#722ed1' }} />,
      trend: '+18%'
    },
    { 
      title: '活跃教师', 
      value: 8965, 
      suffix: '人',
      icon: <TeamOutlined style={{ color: '#13c2c2' }} />,
      trend: '+5%'
    },
    { 
      title: 'AI对话次数', 
      value: 45672, 
      suffix: '次',
      icon: <RobotOutlined style={{ color: '#eb2f96' }} />,
      trend: '+25%'
    },
    { 
      title: '模板使用率', 
      value: 87.2, 
      suffix: '%',
      icon: <TrophyOutlined style={{ color: '#fa541c' }} />,
      trend: '+3%'
    }
  ];

  // 趋势数据图表
  const trendData = [
    { month: '1月', value: 1200 },
    { month: '2月', value: 1890 },
    { month: '3月', value: 2340 },
    { month: '4月', value: 2980 },
    { month: '5月', value: 3560 },
    { month: '6月', value: 4230 }
  ];

  // 最新动态
  const recentActivities = [
    {
      type: 'success',
      title: '新功能上线',
      description: 'AI视频生成功能正式发布',
      time: '2分钟前',
      icon: <VideoCameraOutlined style={{ color: '#52c41a' }} />
    },
    {
      type: 'info', 
      title: '系统升级',
      description: '模板库新增100+精美模板',
      time: '30分钟前',
      icon: <AppstoreAddOutlined style={{ color: '#1890ff' }} />
    },
    {
      type: 'warning',
      title: '维护通知',
      description: '今晚23:00-24:00系统维护',
      time: '1小时前',
      icon: <ToolOutlined style={{ color: '#fa8c16' }} />
    }
  ];

  // 个人成就数据（登录用户）
  const userAchievements = [
    { label: '创作资源', value: 45, total: 100, color: '#1890ff' },
    { label: '获得点赞', value: 128, total: 200, color: '#52c41a' },
    { label: '分享次数', value: 23, total: 50, color: '#fa8c16' },
    { label: '等级经验', value: 750, total: 1000, color: '#722ed1' }
  ];

  // 热门模板推荐
  const popularTemplates = [
    {
      title: '商务汇报模板',
      category: 'PPT模板',
      downloads: 1234,
      rating: 4.9,
      thumbnail: '/default-pic.png',
      tags: ['商务', '汇报', '简约']
    },
    {
      title: '教学课件模板', 
      category: 'PPT模板',
      downloads: 956,
      rating: 4.8,
      thumbnail: '/default-pic.png',
      tags: ['教学', '课件', '生动']
    },
    {
      title: '数学练习题库',
      category: '题库资源',
      downloads: 782,
      rating: 4.7,
      thumbnail: '/default-pic.png',
      tags: ['数学', '练习', '题库']
    }
  ];

  const handleQuickFeatureClick = (feature: any) => {
    if (!token) {
      handleLogin();
      return;
    }
    
    if (feature.onClick) {
      feature.onClick();
    } else if (feature.route) {
      navigate(feature.route);
    }
  };

  return (
    <div style={{ 
      padding: 0, 
      background: MAIN_GRADIENT, 
      minHeight: '100vh',
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

      {/* 顶部欢迎区 */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '48px 24px 0 24px', position: 'relative', zIndex: 2 }}>
        <Card style={{
          marginBottom: 40,
          borderRadius: CARD_RADIUS,
          background: MAIN_GRADIENT,
          border: 'none',
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: CARD_SHADOW
        }}>
          <Row align="middle">
            <Col xs={24} md={16}>
              <div style={{ position: 'relative', zIndex: 2 }}>
                <Title level={1} style={{ color: 'white', fontSize: 54, fontWeight: 800, marginBottom: 12 }}>
                  {token ? '欢迎回来！' : '欢迎来到数字资源生成平台'}
                </Title>
                <Paragraph style={{ color: 'rgba(255,255,255,0.92)', fontSize: 22, marginBottom: 32 }}>
                  {token 
                    ? '继续您的创作之旅，探索AI驱动的教学资源生成新体验' 
                    : '基于多模态大模型技术，为您提供智能化的教学资源创作服务'}
                </Paragraph>
                <Space size="large">
                  <Button 
                    type="primary" 
                    size="large" 
                    icon={<RocketOutlined />}
                    style={{
                      background: BTN_GRADIENT,
                      border: 'none',
                      borderRadius: BTN_RADIUS,
                      height: BTN_HEIGHT,
                      padding: '0 32px',
                      fontWeight: 700,
                      fontSize: 20,
                      boxShadow: '0 4px 16px #5b8cfa30',
                    }}
                    onClick={() => token ? navigate('/creation-center') : handleLogin()}
                  >
                    {token ? '开始创作' : '立即体验'}
                  </Button>
                  {!token && (
                    <Button 
                      size="large"
                      style={{
                        background: 'transparent',
                        border: '2px solid rgba(255,255,255,0.5)',
                        color: 'white',
                        borderRadius: BTN_RADIUS,
                        height: BTN_HEIGHT,
                        padding: '0 32px',
                        fontWeight: 700,
                        fontSize: 20
                      }}
                      onClick={() => navigate('/tutorial')}
                    >
                      了解更多
                    </Button>
                  )}
                </Space>
              </div>
            </Col>
            <Col xs={0} md={8} style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 120, opacity: 0.18, marginRight: 16 }}>
                <RocketOutlined />
              </div>
            </Col>
          </Row>
        </Card>
      </div>

      {/* 统计区 */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', zIndex: 2, position: 'relative' }}>
        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          {realtimeStats.map((stat, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Card style={{ 
                borderRadius: CARD_RADIUS, 
                textAlign: 'center',
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                boxShadow: CARD_SHADOW
              }}>
                <div style={{ marginBottom: 12, fontSize: 32, color: PRIMARY_COLOR }}>
                  {stat.icon}
                </div>
                <Statistic 
                  title={<span style={{ color: '#333', fontWeight: 600 }}>{stat.title}</span>}
                  value={stat.value}
                  suffix={stat.suffix}
                  valueStyle={{ fontSize: 28, fontWeight: 800, color: PRIMARY_COLOR }}
                />
                <Text type="success" style={{ fontSize: 14, color: PRIMARY_COLOR }}>
                  {stat.trend} 较昨日
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* 快捷入口区 */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', zIndex: 2, position: 'relative' }}>
        <Row gutter={[24, 24]} style={{ marginBottom: 40 }}>
          {quickTools.map((tool, idx) => (
            <Col xs={24} sm={12} md={6} key={idx}>
              <Card
                hoverable
                style={{
                  borderRadius: CARD_RADIUS,
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.98)',
                  boxShadow: CARD_SHADOW,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  minHeight: 160
                }}
                onClick={() => handleQuickFeatureClick(tool)}
              >
                <div style={{ fontSize: 36, marginBottom: 12, color: PRIMARY_COLOR }}>{tool.icon}</div>
                <div style={{ fontWeight: 700, fontSize: 18, color: '#333', marginBottom: 4 }}>{tool.title}</div>
                <div style={{ color: '#888', fontSize: 15 }}>{tool.description}</div>
                {tool.badge && <Tag color={PRIMARY_COLOR} style={{ borderRadius: 12, marginTop: 8 }}>{tool.badge}</Tag>}
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* 推荐内容/作品区 */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px 48px 24px', zIndex: 2, position: 'relative' }}>
        <Title level={3} style={{ color: PRIMARY_COLOR, fontWeight: 700, marginBottom: 24 }}>推荐内容</Title>
        <Row gutter={[24, 24]}>
          {userWorks.map((work, idx) => (
            <Col xs={24} sm={12} md={8} key={idx}>
              <Card
                hoverable
                style={{
                  borderRadius: CARD_RADIUS,
                  boxShadow: CARD_SHADOW,
                  minHeight: 260,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: 'rgba(255,255,255,0.98)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                  <Avatar src={work.thumbnail} size={64} style={{ boxShadow: '0 2px 8px #5b8cfa22' }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 18, color: '#333' }}>{work.title}</div>
                    <div style={{ color: '#888', fontSize: 15 }}>{work.author} · {work.category}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
                  <Button type="primary" size="small" style={{ background: BTN_GRADIENT, border: 'none', borderRadius: 16, fontWeight: 600 }}>查看</Button>
                  <Button size="small" style={{ border: `1px solid ${PRIMARY_COLOR}33`, color: PRIMARY_COLOR, borderRadius: 16, fontWeight: 600 }}>下载</Button>
                  <Tag color={PRIMARY_COLOR} style={{ borderRadius: 12 }}>{work.featured ? '精选' : '普通'}</Tag>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
} 