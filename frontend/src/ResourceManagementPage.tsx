import React, { useState, useEffect } from 'react';
import { 
  Card, Row, Col, Input, Select, Button, Typography, List, Avatar, Tag, Modal, Space, 
  Divider, DatePicker, Pagination, Upload, message, Tabs, Statistic, Progress, Tooltip,
  Table, Form, Switch, Rate, Checkbox, TreeSelect, Badge, Dropdown, Menu, Popconfirm,
  Drawer, Timeline, Alert, Empty, Image
} from 'antd';
import { 
  SearchOutlined, FilterOutlined, EyeOutlined, DownloadOutlined, DeleteOutlined, 
  FileTextOutlined, VideoCameraOutlined, AudioOutlined, FileImageOutlined, 
  RobotOutlined, QuestionCircleOutlined, FolderOutlined, PlusOutlined, EditOutlined,
  StarOutlined, ShareAltOutlined, SettingOutlined, BarChartOutlined, CloudUploadOutlined,
  TagsOutlined, UserOutlined, CalendarOutlined, SyncOutlined, ExclamationCircleOutlined,
  HeartOutlined, CommentOutlined, LikeOutlined, MoreOutlined, AppstoreOutlined,
  UnorderedListOutlined, TableOutlined, CopyOutlined, FolderAddOutlined, CheckCircleOutlined,
  LinkOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { TextArea } = Input;

// 资源接口定义
interface ResourceItem {
  id: string;
  title: string;
  type: 'ppt' | 'video' | 'audio' | 'image' | 'document' | 'question' | 'case';
  category: string;
  subCategory?: string;
  tags: string[];
  description: string;
  coverUrl: string;
  fileUrl: string;
  linkUrl?: string;  // 添加超链接字段
  size: string;
  format: string;
  createdAt: string;
  updatedAt: string;
  author: string;
  authorId: string;
  downloadCount: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  isPublic: boolean;
  isFeatured: boolean;
  status: 'active' | 'pending' | 'archived' | 'draft';
  quality: number;
  version: string;
  thumbnails?: string[];
  metadata?: any;
  expiresAt?: string;
  keywords: string[];
  subject: string;
  gradeLevel: string;
  difficulty: 'easy' | 'medium' | 'hard';
  duration?: number;
  language: string;
}

// 分类接口定义
interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  parentId?: string;
  children?: Category[];
  count: number;
}

// 模拟数据
const mockCategories: Category[] = [
  {
    id: 'math',
    name: '数学',
    icon: '📐',
    color: '#1890ff',
    description: '数学学科相关资源',
    count: 156,
    children: [
      { id: 'math-basic', name: '基础数学', icon: '🔢', color: '#1890ff', description: '', count: 45 },
      { id: 'math-advanced', name: '高等数学', icon: '∫', color: '#1890ff', description: '', count: 67 },
      { id: 'math-geometry', name: '几何学', icon: '📐', color: '#1890ff', description: '', count: 44 }
    ]
  },
  {
    id: 'physics',
    name: '物理',
    icon: '⚛️',
    color: '#52c41a',
    description: '物理学科相关资源',
    count: 128,
    children: [
      { id: 'physics-mechanics', name: '力学', icon: '🏗️', color: '#52c41a', description: '', count: 38 },
      { id: 'physics-optics', name: '光学', icon: '🌈', color: '#52c41a', description: '', count: 42 },
      { id: 'physics-quantum', name: '量子物理', icon: '🔬', color: '#52c41a', description: '', count: 48 }
    ]
  },
  {
    id: 'chemistry',
    name: '化学',
    icon: '🧪',
    color: '#fa8c16',
    description: '化学学科相关资源',
    count: 89,
    children: [
      { id: 'chemistry-organic', name: '有机化学', icon: '🧬', color: '#fa8c16', description: '', count: 34 },
      { id: 'chemistry-inorganic', name: '无机化学', icon: '⚗️', color: '#fa8c16', description: '', count: 28 },
      { id: 'chemistry-physical', name: '物理化学', icon: '🔥', color: '#fa8c16', description: '', count: 27 }
    ]
  },
  {
    id: 'biology',
    name: '生物',
    icon: '🧬',
    color: '#13c2c2',
    description: '生物学科相关资源',
    count: 94,
    children: [
      { id: 'biology-cell', name: '细胞生物学', icon: '🦠', color: '#13c2c2', description: '', count: 31 },
      { id: 'biology-ecology', name: '生态学', icon: '🌿', color: '#13c2c2', description: '', count: 35 },
      { id: 'biology-genetics', name: '遗传学', icon: '🧬', color: '#13c2c2', description: '', count: 28 }
    ]
  }
];

const mockResources: ResourceItem[] = [
  {
    id: '1',
    title: '高等数学微积分基础课件',
    type: 'ppt',
    category: 'math',
    subCategory: 'math-advanced',
    tags: ['微积分', '导数', '积分', '极限'],
    description: '涵盖微积分的基本概念、导数计算、积分运算和实际应用，适合大学一年级学生学习',
    coverUrl: '/default-pic.png',
    fileUrl: '/uploads/calculus-basics.pptx',
    linkUrl: 'https://www.khanacademy.org/math/differential-calculus',
    size: '4.2MB',
    format: 'PPTX',
    createdAt: '2024-01-15 10:30:00',
    updatedAt: '2024-01-16 14:20:00',
    author: '张教授',
    authorId: 'teacher001',
    downloadCount: 342,
    viewCount: 1250,
    likeCount: 89,
    commentCount: 23,
    favoriteCount: 156,
    isPublic: true,
    isFeatured: true,
    status: 'active',
    quality: 4.8,
    version: '2.1',
    keywords: ['数学', '微积分', '高等数学', '导数', '积分'],
    subject: '数学',
    gradeLevel: '大学',
    difficulty: 'medium',
    language: '中文'
  },
  {
    id: '2',
    title: '物理实验：光的干涉现象演示',
    type: 'video',
    category: 'physics',
    subCategory: 'physics-optics',
    tags: ['光学', '干涉', '实验', '演示'],
    description: '详细演示光的干涉现象，包括双缝干涉、薄膜干涉等经典实验，配有理论解释',
    coverUrl: '/default-pic.png',
    fileUrl: '/uploads/light-interference.mp4',
    linkUrl: 'https://phet.colorado.edu/sims/html/wave-interference/latest/wave-interference_zh_CN.html',
    size: '156.8MB',
    format: 'MP4',
    createdAt: '2024-01-14 16:45:00',
    updatedAt: '2024-01-14 16:45:00',
    author: '李教授',
    authorId: 'teacher002',
    downloadCount: 218,
    viewCount: 890,
    likeCount: 67,
    commentCount: 15,
    favoriteCount: 123,
    isPublic: true,
    isFeatured: false,
    status: 'active',
    quality: 4.6,
    version: '1.0',
    duration: 1280,
    keywords: ['物理', '光学', '干涉', '实验'],
    subject: '物理',
    gradeLevel: '高中',
    difficulty: 'medium',
    language: '中文'
  },
  {
    id: '3',
    title: '英语口语练习：日常对话集',
    type: 'audio',
    category: 'english',
    tags: ['英语', '口语', '对话', '练习'],
    description: '包含20个日常生活场景的英语对话，配有标准发音和中文翻译',
    coverUrl: '/default-pic.png',
    fileUrl: '/uploads/english-dialogue.mp3',
    linkUrl: 'https://www.bbc.co.uk/learningenglish/english/features/6-minute-english',
    size: '28.5MB',
    format: 'MP3',
    createdAt: '2024-01-13 09:15:00',
    updatedAt: '2024-01-13 09:15:00',
    author: '王老师',
    authorId: 'teacher003',
    downloadCount: 445,
    viewCount: 1120,
    likeCount: 134,
    commentCount: 38,
    favoriteCount: 267,
    isPublic: true,
    isFeatured: true,
    status: 'active',
    quality: 4.9,
    version: '1.5',
    duration: 1800,
    keywords: ['英语', '口语', '对话', '听力'],
    subject: '英语',
    gradeLevel: '初中',
    difficulty: 'easy',
    language: '英文'
  }
];

const ResourceManagementPage: React.FC = () => {
  // 状态管理
  const [resources, setResources] = useState<ResourceItem[]>(mockResources);
  const [categories, setCategories] = useState<Category[]>(mockCategories);
  const [filteredResources, setFilteredResources] = useState<ResourceItem[]>(mockResources);
  const [loading, setLoading] = useState(false);
  
  // 搜索和过滤状态
  const [searchText, setSearchText] = useState('');
  const [advancedSearch, setAdvancedSearch] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    tags: [] as string[],
    quality: [0, 5] as [number, number],
    dateRange: null as any,
    author: '',
    difficulty: 'all',
    status: 'all',
    language: 'all'
  });
  
  // 排序和分页
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'table'>('grid');
  
  // 模态框和抽屉状态
  const [previewVisible, setPreviewVisible] = useState(false);
  const [uploadVisible, setUploadVisible] = useState(false);
  const [categoryManageVisible, setCategoryManageVisible] = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  
  // 选中的资源
  const [selectedResource, setSelectedResource] = useState<ResourceItem | null>(null);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  
  // 统计数据
  const [statistics, setStatistics] = useState({
    totalResources: 0,
    totalSize: '0MB',
    totalDownloads: 0,
    activeUsers: 0,
    todayUploads: 0,
    pendingReviews: 0
  });

  // 获取所有标签
  const allTags = Array.from(new Set(resources.flatMap(r => r.tags)));
  
  // 计算统计数据
  useEffect(() => {
    const totalSize = resources.reduce((sum, r) => {
      const size = parseFloat(r.size);
      return sum + (isNaN(size) ? 0 : size);
    }, 0);
    
    const totalDownloads = resources.reduce((sum, r) => sum + r.downloadCount, 0);
    const pendingReviews = resources.filter(r => r.status === 'pending').length;
    
    setStatistics({
      totalResources: resources.length,
      totalSize: `${totalSize.toFixed(1)}MB`,
      totalDownloads,
      activeUsers: 156, // 模拟数据
      todayUploads: 12, // 模拟数据
      pendingReviews
    });
  }, [resources]);

  // 过滤和排序逻辑
  useEffect(() => {
    let filtered = [...resources];

    // 文本搜索
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(searchLower) ||
        r.description.toLowerCase().includes(searchLower) ||
        r.author.toLowerCase().includes(searchLower) ||
        r.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        r.keywords.some(keyword => keyword.toLowerCase().includes(searchLower))
      );
    }

    // 高级过滤
    if (filters.type !== 'all') {
      filtered = filtered.filter(r => r.type === filters.type);
    }
    
    if (filters.category !== 'all') {
      filtered = filtered.filter(r => r.category === filters.category || r.subCategory === filters.category);
    }
    
    if (filters.tags.length > 0) {
      filtered = filtered.filter(r => 
        filters.tags.some(tag => r.tags.includes(tag))
      );
    }
    
    if (filters.difficulty !== 'all') {
      filtered = filtered.filter(r => r.difficulty === filters.difficulty);
    }
    
    if (filters.status !== 'all') {
      filtered = filtered.filter(r => r.status === filters.status);
    }
    
    if (filters.language !== 'all') {
      filtered = filtered.filter(r => r.language === filters.language);
    }
    
    // 质量过滤
    filtered = filtered.filter(r => 
      r.quality >= filters.quality[0] && r.quality <= filters.quality[1]
    );
    
    // 日期过滤
    if (filters.dateRange && filters.dateRange.length === 2) {
      const [start, end] = filters.dateRange;
      filtered = filtered.filter(r => {
        const resourceDate = new Date(r.createdAt);
        return resourceDate >= start && resourceDate <= end;
      });
    }
    
    // 作者过滤
    if (filters.author) {
      filtered = filtered.filter(r => 
        r.author.toLowerCase().includes(filters.author.toLowerCase())
      );
    }

    // 排序
    filtered.sort((a, b) => {
      let aValue = a[sortBy as keyof ResourceItem] as any;
      let bValue = b[sortBy as keyof ResourceItem] as any;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredResources(filtered);
    setCurrentPage(1);
  }, [resources, searchText, filters, sortBy, sortOrder]);

  // 处理函数
  const handlePreview = (resource: ResourceItem) => {
    setSelectedResource(resource);
    setPreviewVisible(true);
  };

  const handleDownload = async (resource: ResourceItem) => {
    try {
      message.success(`开始下载：${resource.title}`);
      // 更新下载计数
      setResources(prev => prev.map(r => 
        r.id === resource.id 
          ? { ...r, downloadCount: r.downloadCount + 1 }
          : r
      ));
    } catch (error) {
      message.error('下载失败');
    }
  };

  const handleDelete = (resourceId: string) => {
    setResources(prev => prev.filter(r => r.id !== resourceId));
    message.success('删除成功');
  };

  const handleFavorite = (resourceId: string) => {
    setResources(prev => prev.map(r => 
      r.id === resourceId 
        ? { ...r, favoriteCount: r.favoriteCount + 1 }
        : r
    ));
    message.success('已添加到收藏');
  };

  const handleLike = (resourceId: string) => {
    setResources(prev => prev.map(r => 
      r.id === resourceId 
        ? { ...r, likeCount: r.likeCount + 1 }
        : r
    ));
  };

  const handleLink = (url: string) => {
    window.open(url, '_blank');
  };

  const typeIcons = {
    ppt: <FileTextOutlined />,
    video: <VideoCameraOutlined />,
    audio: <AudioOutlined />,
    image: <FileImageOutlined />,
    document: <FileTextOutlined />,
    question: <QuestionCircleOutlined />,
    case: <RobotOutlined />
  };

  const typeColors = {
    ppt: '#1890ff',
    video: '#722ed1',
    audio: '#fa8c16',
    image: '#52c41a',
    document: '#13c2c2',
    question: '#f5222d',
    case: '#eb2f96'
  };

  // 资源卡片组件
  const ResourceCard: React.FC<{ resource: ResourceItem }> = ({ resource }) => (
    <Card
      hoverable
      style={{ 
        marginBottom: 16,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(248,250,252,0.9) 100%)',
        border: '1px solid rgba(0,0,0,0.06)',
        borderRadius: 16,
        overflow: 'hidden'
      }}
      cover={
        <div style={{ 
          position: 'relative', 
          height: 180, 
          background: `linear-gradient(135deg, ${typeColors[resource.type]}20 0%, ${typeColors[resource.type]}10 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ fontSize: 48, color: typeColors[resource.type] }}>
            {typeIcons[resource.type]}
          </div>
          <div style={{
            position: 'absolute',
            top: 12,
            right: 12,
            display: 'flex',
            gap: 8
          }}>
            {resource.isFeatured && (
              <Badge.Ribbon text="精选" color="gold" />
            )}
            <Tag color={typeColors[resource.type]}>
              {resource.type.toUpperCase()}
            </Tag>
          </div>
          <div style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            display: 'flex',
            gap: 8
          }}>
            <Rate disabled defaultValue={resource.quality} style={{ fontSize: 12 }} />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {resource.quality.toFixed(1)}
            </Text>
          </div>
        </div>
      }
      actions={[
        <Tooltip title="预览">
          <EyeOutlined onClick={() => handlePreview(resource)} />
        </Tooltip>,
        <Tooltip title="下载">
          <DownloadOutlined onClick={() => handleDownload(resource)} />
        </Tooltip>,
        ...(resource.linkUrl ? [
          <Tooltip title="访问链接">
            <LinkOutlined onClick={() => handleLink(resource.linkUrl!)} />
          </Tooltip>
        ] : []),
        <Tooltip title="收藏">
          <HeartOutlined onClick={() => handleFavorite(resource.id)} />
        </Tooltip>,
        <Tooltip title="更多">
          <MoreOutlined onClick={() => {
            setSelectedResource(resource);
            setDetailDrawerVisible(true);
          }} />
        </Tooltip>
      ]}
    >
      <Card.Meta
        title={
          <div>
            <Text ellipsis style={{ fontSize: 16, fontWeight: 600 }}>
              {resource.title}
            </Text>
            <div style={{ marginTop: 4 }}>
              {resource.tags.slice(0, 3).map(tag => (
                <Tag key={tag} style={{ fontSize: 10 }}>
                  {tag}
                </Tag>
              ))}
              {resource.tags.length > 3 && (
                <Tag style={{ fontSize: 10 }}>
                  +{resource.tags.length - 3}
                </Tag>
              )}
            </div>
          </div>
        }
        description={
          <div>
            <Paragraph
              ellipsis={{ rows: 2 }}
              style={{ fontSize: 12, color: '#666', margin: '8px 0' }}
            >
              {resource.description}
            </Paragraph>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              fontSize: 11,
              color: '#999'
            }}>
              <div>
                <UserOutlined /> {resource.author}
              </div>
              <div>
                <DownloadOutlined /> {resource.downloadCount}
              </div>
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              fontSize: 11,
              color: '#999',
              marginTop: 4
            }}>
              <div>
                {resource.size} • {resource.format}
              </div>
              <div>
                <CalendarOutlined /> {resource.updatedAt.split(' ')[0]}
              </div>
            </div>
          </div>
        }
      />
    </Card>
  );

  // 分页数据
  const paginatedResources = filteredResources.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div style={{ 
      padding: '24px',
      background: 'linear-gradient(135deg, #f0f2f5 0%, #ffffff 100%)',
      minHeight: '100vh'
    }}>
      {/* 页面标题和统计 */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)',
          borderRadius: 16,
          padding: '32px',
          color: 'white',
          marginBottom: 24
        }}>
          <Title level={1} style={{ color: 'white', marginBottom: 16, fontSize: 32 }}>
            📚 智能资源管理中心
          </Title>
          <Paragraph style={{ 
            color: 'rgba(255,255,255,0.9)', 
            fontSize: 18,
            marginBottom: 24
          }}>
            全方位的教学资源管理平台，支持分类存储、智能检索、在线预览和协作分享
          </Paragraph>
          
          <Row gutter={[24, 16]}>
            <Col xs={12} sm={8} md={4}>
              <Statistic
                title="总资源数"
                value={statistics.totalResources}
                valueStyle={{ color: 'white' }}
                prefix={<FolderOutlined />}
              />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic
                title="总大小"
                value={statistics.totalSize}
                valueStyle={{ color: 'white' }}
                prefix={<CloudUploadOutlined />}
              />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic
                title="总下载"
                value={statistics.totalDownloads}
                valueStyle={{ color: 'white' }}
                prefix={<DownloadOutlined />}
              />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic
                title="活跃用户"
                value={statistics.activeUsers}
                valueStyle={{ color: 'white' }}
                prefix={<UserOutlined />}
              />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic
                title="今日上传"
                value={statistics.todayUploads}
                valueStyle={{ color: 'white' }}
                prefix={<PlusOutlined />}
              />
            </Col>
            <Col xs={12} sm={8} md={4}>
              <Statistic
                title="待审核"
                value={statistics.pendingReviews}
                valueStyle={{ color: 'white' }}
                prefix={<ExclamationCircleOutlined />}
              />
            </Col>
          </Row>
        </div>
      </div>

      {/* 搜索和工具栏 */}
      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索资源名称、描述、作者、标签..."
              allowClear
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button
              type={advancedSearch ? 'primary' : 'default'}
              icon={<FilterOutlined />}
              onClick={() => setAdvancedSearch(!advancedSearch)}
              size="large"
              style={{ width: '100%' }}
            >
              高级搜索
            </Button>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              onClick={() => setUploadVisible(true)}
              size="large"
              style={{ width: '100%' }}
            >
              上传资源
            </Button>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button
              icon={<FolderAddOutlined />}
              onClick={() => setCategoryManageVisible(true)}
              size="large"
              style={{ width: '100%' }}
            >
              分类管理
            </Button>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Space.Compact size="large" style={{ width: '100%', display: 'flex' }}>
              <Button 
                type={viewMode === 'grid' ? 'primary' : 'default'}
                icon={<AppstoreOutlined />}
                onClick={() => setViewMode('grid')}
                style={{ flex: 1 }}
              />
              <Button 
                type={viewMode === 'list' ? 'primary' : 'default'}
                icon={<UnorderedListOutlined />}
                onClick={() => setViewMode('list')}
                style={{ flex: 1 }}
              />
              <Button 
                type={viewMode === 'table' ? 'primary' : 'default'}
                icon={<TableOutlined />}
                onClick={() => setViewMode('table')}
                style={{ flex: 1 }}
              />
            </Space.Compact>
          </Col>
        </Row>

        {/* 高级搜索面板 */}
        {advancedSearch && (
          <div style={{ 
            marginTop: 24, 
            padding: 24, 
            background: '#fafafa', 
            borderRadius: 8 
          }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <Text strong>资源类型</Text>
                <Select
                  value={filters.type}
                  onChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  <Option value="all">全部类型</Option>
                  <Option value="ppt">PPT课件</Option>
                  <Option value="video">教学视频</Option>
                  <Option value="audio">音频资料</Option>
                  <Option value="image">图像素材</Option>
                  <Option value="document">文档资料</Option>
                  <Option value="question">习题练习</Option>
                  <Option value="case">教学案例</Option>
                </Select>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text strong>学科分类</Text>
                <TreeSelect
                  value={filters.category}
                  onChange={(value) => setFilters(prev => ({ ...prev, category: value || 'all' }))}
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder="选择学科分类"
                  allowClear
                  treeData={[
                    { title: '全部分类', value: 'all' },
                    ...categories.map(cat => ({
                      title: `${cat.icon} ${cat.name}`,
                      value: cat.id,
                      children: cat.children?.map(sub => ({
                        title: `${sub.icon} ${sub.name}`,
                        value: sub.id
                      }))
                    }))
                  ]}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text strong>难度等级</Text>
                <Select
                  value={filters.difficulty}
                  onChange={(value) => setFilters(prev => ({ ...prev, difficulty: value }))}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  <Option value="all">全部难度</Option>
                  <Option value="easy">简单</Option>
                  <Option value="medium">中等</Option>
                  <Option value="hard">困难</Option>
                </Select>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text strong>资源状态</Text>
                <Select
                  value={filters.status}
                  onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  <Option value="all">全部状态</Option>
                  <Option value="active">已发布</Option>
                  <Option value="pending">待审核</Option>
                  <Option value="draft">草稿</Option>
                  <Option value="archived">已归档</Option>
                </Select>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text strong>标签</Text>
                <Select
                  mode="multiple"
                  value={filters.tags}
                  onChange={(value) => setFilters(prev => ({ ...prev, tags: value }))}
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder="选择标签"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {allTags.map(tag => (
                    <Option key={tag} value={tag}>{tag}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text strong>创建日期</Text>
                <RangePicker
                  value={filters.dateRange}
                  onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
                  style={{ width: '100%', marginTop: 8 }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text strong>作者</Text>
                <Input
                  value={filters.author}
                  onChange={(e) => setFilters(prev => ({ ...prev, author: e.target.value }))}
                  placeholder="输入作者姓名"
                  style={{ width: '100%', marginTop: 8 }}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Text strong>语言</Text>
                <Select
                  value={filters.language}
                  onChange={(value) => setFilters(prev => ({ ...prev, language: value }))}
                  style={{ width: '100%', marginTop: 8 }}
                >
                  <Option value="all">全部语言</Option>
                  <Option value="中文">中文</Option>
                  <Option value="英文">英文</Option>
                  <Option value="日文">日文</Option>
                  <Option value="韩文">韩文</Option>
                </Select>
              </Col>
            </Row>
            <Row style={{ marginTop: 16 }}>
              <Col span={24}>
                <Button
                  onClick={() => setFilters({
                    type: 'all',
                    category: 'all',
                    tags: [],
                    quality: [0, 5],
                    dateRange: null,
                    author: '',
                    difficulty: 'all',
                    status: 'all',
                    language: 'all'
                  })}
                >
                  清空筛选
                </Button>
              </Col>
            </Row>
          </div>
        )}
      </Card>

      {/* 资源列表 */}
      <Row gutter={[16, 16]}>
        {/* 左侧分类导航 */}
        <Col xs={24} lg={6}>
          <Card title="📁 学科分类" style={{ borderRadius: 12 }}>
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              <div
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  borderRadius: 8,
                  background: filters.category === 'all' ? '#e6f7ff' : 'transparent',
                  marginBottom: 8
                }}
                onClick={() => setFilters(prev => ({ ...prev, category: 'all' }))}
              >
                <Text strong>📚 全部资源 ({statistics.totalResources})</Text>
              </div>
              {categories.map(category => (
                <div key={category.id}>
                  <div
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderRadius: 8,
                      background: filters.category === category.id ? '#e6f7ff' : 'transparent',
                      marginBottom: 4
                    }}
                    onClick={() => setFilters(prev => ({ ...prev, category: category.id }))}
                  >
                    <Text>
                      {category.icon} {category.name} ({category.count})
                    </Text>
                  </div>
                  {category.children?.map(sub => (
                    <div
                      key={sub.id}
                      style={{
                        padding: '6px 12px 6px 24px',
                        cursor: 'pointer',
                        borderRadius: 8,
                        background: filters.category === sub.id ? '#e6f7ff' : 'transparent',
                        marginBottom: 2,
                        fontSize: 12
                      }}
                      onClick={() => setFilters(prev => ({ ...prev, category: sub.id }))}
                    >
                      <Text type="secondary">
                        {sub.icon} {sub.name} ({sub.count})
                      </Text>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* 右侧资源展示区 */}
        <Col xs={24} lg={18}>
          {/* 排序和视图控制 */}
          <div style={{ 
            marginBottom: 16, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text>共找到 {filteredResources.length} 个资源</Text>
              {batchMode && selectedResources.length > 0 && (
                <Text type="success">已选择 {selectedResources.length} 个</Text>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text>排序：</Text>
              <Select
                value={sortBy}
                onChange={setSortBy}
                style={{ width: 120 }}
                size="small"
              >
                <Option value="updatedAt">更新时间</Option>
                <Option value="createdAt">创建时间</Option>
                <Option value="title">标题</Option>
                <Option value="downloadCount">下载量</Option>
                <Option value="quality">质量评分</Option>
                <Option value="size">文件大小</Option>
              </Select>
              <Select
                value={sortOrder}
                onChange={setSortOrder}
                style={{ width: 80 }}
                size="small"
              >
                <Option value="desc">降序</Option>
                <Option value="asc">升序</Option>
              </Select>
              <Switch
                checked={batchMode}
                onChange={setBatchMode}
                checkedChildren="批量"
                unCheckedChildren="单选"
              />
            </div>
          </div>

          {/* 资源网格显示 */}
          {viewMode === 'grid' && (
            <Row gutter={[16, 16]}>
              {paginatedResources.map(resource => (
                <Col key={resource.id} xs={24} sm={12} lg={8} xl={6}>
                  <ResourceCard resource={resource} />
                </Col>
              ))}
            </Row>
          )}

          {/* 空状态 */}
          {filteredResources.length === 0 && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="没有找到匹配的资源"
              style={{ padding: '60px 0' }}
            >
              <Button type="primary" onClick={() => setUploadVisible(true)}>
                上传第一个资源
              </Button>
            </Empty>
          )}

          {/* 分页 */}
          {filteredResources.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={filteredResources.length}
                onChange={setCurrentPage}
                onShowSizeChange={(current, size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                showSizeChanger
                showQuickJumper
                showTotal={(total, range) => 
                  `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                }
                pageSizeOptions={['12', '24', '36', '48']}
                size="small"
              />
            </div>
          )}
        </Col>
      </Row>

      {/* 资源预览模态框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 24, color: selectedResource ? typeColors[selectedResource.type] : '#666' }}>
              {selectedResource && typeIcons[selectedResource.type]}
            </div>
            <div>
              <Text strong style={{ fontSize: 18 }}>
                {selectedResource?.title}
              </Text>
              <div style={{ fontSize: 14, color: '#666' }}>
                {selectedResource?.author} • {selectedResource?.createdAt.split(' ')[0]}
              </div>
            </div>
          </div>
        }
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={800}
        footer={[
          <Button key="download" type="primary" icon={<DownloadOutlined />} onClick={() => selectedResource && handleDownload(selectedResource)}>
            下载
          </Button>,
          <Button key="favorite" icon={<HeartOutlined />} onClick={() => selectedResource && handleFavorite(selectedResource.id)}>
            收藏
          </Button>,
          <Button key="share" icon={<ShareAltOutlined />}>
            分享
          </Button>,
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            关闭
          </Button>
        ]}
        style={{ top: 20 }}
      >
        {selectedResource && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <Tag color={typeColors[selectedResource.type]} style={{ fontSize: 12 }}>
                  {selectedResource.type.toUpperCase()}
                </Tag>
                <Tag color="blue">{selectedResource.category}</Tag>
                <Tag color="green">{selectedResource.difficulty}</Tag>
                <Tag color="orange">{selectedResource.language}</Tag>
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
                <Text><FileTextOutlined /> {selectedResource.size}</Text>
                <Text><DownloadOutlined /> {selectedResource.downloadCount}</Text>
                <Text><EyeOutlined /> {selectedResource.viewCount}</Text>
                <Text><LikeOutlined /> {selectedResource.likeCount}</Text>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Text>质量评分：</Text>
                <Rate disabled defaultValue={selectedResource.quality} style={{ fontSize: 16 }} />
                <Text>{selectedResource.quality.toFixed(1)}</Text>
              </div>
            </div>
            
            <Divider />
            
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
                📄 资源描述
              </Text>
              <Paragraph>{selectedResource.description}</Paragraph>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
                🏷️ 标签
              </Text>
              <div>
                {selectedResource.tags.map(tag => (
                  <Tag key={tag} color="processing">{tag}</Tag>
                ))}
              </div>
            </div>
            
            {selectedResource.linkUrl && (
              <div style={{ marginBottom: 16 }}>
                <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
                  🔗 相关链接
                </Text>
                <div style={{ 
                  background: '#f0f5ff', 
                  padding: 12, 
                  borderRadius: 8,
                  border: '1px solid #d6e4ff'
                }}>
                  <a 
                    href={selectedResource.linkUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8,
                      color: '#1890ff',
                      textDecoration: 'none'
                    }}
                  >
                    <LinkOutlined />
                    {selectedResource.linkUrl}
                  </a>
                </div>
              </div>
            )}
            
            <div style={{ marginBottom: 16 }}>
              <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 8 }}>
                📊 统计信息
              </Text>
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic title="下载次数" value={selectedResource.downloadCount} />
                </Col>
                <Col span={6}>
                  <Statistic title="查看次数" value={selectedResource.viewCount} />
                </Col>
                <Col span={6}>
                  <Statistic title="点赞数" value={selectedResource.likeCount} />
                </Col>
                <Col span={6}>
                  <Statistic title="收藏数" value={selectedResource.favoriteCount} />
                </Col>
              </Row>
            </div>
            
            {/* 预览区域 */}
            <div style={{ 
              background: '#f5f5f5', 
              padding: 24, 
              borderRadius: 8,
              textAlign: 'center',
              minHeight: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <div>
                <div style={{ fontSize: 48, marginBottom: 16, color: typeColors[selectedResource.type] }}>
                  {typeIcons[selectedResource.type]}
                </div>
                <Text type="secondary">
                  {selectedResource.type === 'video' && '视频预览功能开发中...'}
                  {selectedResource.type === 'audio' && '音频预览功能开发中...'}
                  {selectedResource.type === 'image' && '图片预览功能开发中...'}
                  {selectedResource.type === 'ppt' && 'PPT预览功能开发中...'}
                  {selectedResource.type === 'document' && '文档预览功能开发中...'}
                  {selectedResource.type === 'question' && '题目预览功能开发中...'}
                  {selectedResource.type === 'case' && '案例预览功能开发中...'}
                </Text>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 资源上传模态框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <CloudUploadOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            <Text strong style={{ fontSize: 18 }}>上传教学资源</Text>
          </div>
        }
        open={uploadVisible}
        onCancel={() => setUploadVisible(false)}
        width={800}
        footer={null}
      >
        <Form layout="vertical" onFinish={(values) => {
          console.log('上传资源：', values);
          message.success('资源上传成功！');
          setUploadVisible(false);
        }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="资源标题" name="title" rules={[{ required: true, message: '请输入资源标题' }]}>
                <Input placeholder="请输入资源标题" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="资源类型" name="type" rules={[{ required: true, message: '请选择资源类型' }]}>
                <Select placeholder="请选择资源类型">
                  <Option value="ppt">PPT课件</Option>
                  <Option value="video">教学视频</Option>
                  <Option value="audio">音频资料</Option>
                  <Option value="image">图像素材</Option>
                  <Option value="document">文档资料</Option>
                  <Option value="question">习题练习</Option>
                  <Option value="case">教学案例</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="学科分类" name="category" rules={[{ required: true, message: '请选择学科分类' }]}>
                <TreeSelect
                  placeholder="请选择学科分类"
                  treeData={categories.map(cat => ({
                    title: `${cat.icon} ${cat.name}`,
                    value: cat.id,
                    children: cat.children?.map(sub => ({
                      title: `${sub.icon} ${sub.name}`,
                      value: sub.id
                    }))
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="难度等级" name="difficulty" rules={[{ required: true, message: '请选择难度等级' }]}>
                <Select placeholder="请选择难度等级">
                  <Option value="easy">简单</Option>
                  <Option value="medium">中等</Option>
                  <Option value="hard">困难</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="资源描述" name="description" rules={[{ required: true, message: '请输入资源描述' }]}>
                <TextArea rows={4} placeholder="请详细描述资源内容、适用对象、使用方法等" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="标签" name="tags">
                <Select
                  mode="tags"
                  placeholder="请输入标签，支持自定义标签"
                  style={{ width: '100%' }}
                  options={allTags.map(tag => ({ value: tag, label: tag }))}
                />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item 
                label="相关链接" 
                name="linkUrl"
                rules={[
                  { type: 'url', message: '请输入有效的网址' }
                ]}
              >
                <Input 
                  placeholder="请输入相关链接网址（可选）" 
                  prefix={<LinkOutlined />}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="语言" name="language" initialValue="中文">
                <Select>
                  <Option value="中文">中文</Option>
                  <Option value="英文">英文</Option>
                  <Option value="日文">日文</Option>
                  <Option value="韩文">韩文</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="年级水平" name="gradeLevel">
                <Select placeholder="请选择年级水平">
                  <Option value="小学">小学</Option>
                  <Option value="初中">初中</Option>
                  <Option value="高中">高中</Option>
                  <Option value="大学">大学</Option>
                  <Option value="职业">职业教育</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="文件上传" name="files" rules={[{ required: true, message: '请上传资源文件' }]}>
                <Upload.Dragger
                  name="files"
                  multiple
                  action="/api/upload"
                  onChange={(info) => {
                    const { status } = info.file;
                    if (status === 'done') {
                      message.success(`${info.file.name} 上传成功`);
                    } else if (status === 'error') {
                      message.error(`${info.file.name} 上传失败`);
                    }
                  }}
                  style={{ padding: '20px' }}
                >
                  <p className="ant-upload-drag-icon">
                    <CloudUploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                  </p>
                  <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
                  <p className="ant-upload-hint">
                    支持单个或批量上传。支持PPT、PDF、Word、视频、音频、图片等格式
                  </p>
                </Upload.Dragger>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item>
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="isPublic" valuePropName="checked">
                      <Checkbox>公开资源（其他用户可见）</Checkbox>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="isFeatured" valuePropName="checked">
                      <Checkbox>推荐资源（首页展示）</Checkbox>
                    </Form.Item>
                  </Col>
                </Row>
              </Form.Item>
            </Col>
          </Row>
          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Button onClick={() => setUploadVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              上传资源
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 分类管理模态框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FolderOutlined style={{ fontSize: 24, color: '#52c41a' }} />
            <Text strong style={{ fontSize: 18 }}>分类管理</Text>
          </div>
        }
        open={categoryManageVisible}
        onCancel={() => setCategoryManageVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setCategoryManageVisible(false)}>
            关闭
          </Button>
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => {
            message.success('添加分类功能开发中...');
          }}>
            添加分类
          </Button>
        </div>
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {categories.map(category => (
            <Card key={category.id} size="small" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 24 }}>{category.icon}</span>
                  <div>
                    <Text strong>{category.name}</Text>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {category.description} • {category.count} 个资源
                    </div>
                  </div>
                </div>
                <div>
                  <Button size="small" icon={<EditOutlined />} onClick={() => {
                    message.success('编辑分类功能开发中...');
                  }}>
                    编辑
                  </Button>
                  <Button size="small" danger icon={<DeleteOutlined />} onClick={() => {
                    message.success('删除分类功能开发中...');
                  }} style={{ marginLeft: 8 }}>
                    删除
                  </Button>
                </div>
              </div>
              {category.children && category.children.length > 0 && (
                <div style={{ marginTop: 12, marginLeft: 36 }}>
                  {category.children.map(sub => (
                    <div key={sub.id} style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#f9f9f9',
                      borderRadius: 4,
                      marginBottom: 4
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>{sub.icon}</span>
                        <Text>{sub.name}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          ({sub.count})
                        </Text>
                      </div>
                      <div>
                        <Button size="small" type="text" icon={<EditOutlined />} />
                        <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      </Modal>

      {/* 资源详情抽屉 */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 24, color: selectedResource ? typeColors[selectedResource.type] : '#666' }}>
              {selectedResource && typeIcons[selectedResource.type]}
            </div>
            <div>
              <Text strong style={{ fontSize: 18 }}>
                {selectedResource?.title}
              </Text>
              <div style={{ fontSize: 14, color: '#666' }}>
                资源详情与管理
              </div>
            </div>
          </div>
        }
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
        width={500}
        placement="right"
      >
        {selectedResource && (
          <div>
            <Tabs defaultActiveKey="1">
              <TabPane tab="基本信息" key="1">
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    📋 基本信息
                  </Text>
                  <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 8 }}>
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary">资源ID：</Text>
                      <Text copyable>{selectedResource.id}</Text>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary">文件大小：</Text>
                      <Text>{selectedResource.size}</Text>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary">文件格式：</Text>
                      <Text>{selectedResource.format}</Text>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary">版本号：</Text>
                      <Text>{selectedResource.version}</Text>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary">创建时间：</Text>
                      <Text>{selectedResource.createdAt}</Text>
                    </div>
                    <div>
                      <Text type="secondary">更新时间：</Text>
                      <Text>{selectedResource.updatedAt}</Text>
                    </div>
                  </div>
                </div>
                
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    👤 作者信息
                  </Text>
                  <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar size={48} icon={<UserOutlined />} />
                      <div>
                        <Text strong>{selectedResource.author}</Text>
                        <div style={{ fontSize: 12, color: '#666' }}>
                          教师 • ID: {selectedResource.authorId}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    🏷️ 分类标签
                  </Text>
                  <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 8 }}>
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary">主分类：</Text>
                      <Tag color="blue">{selectedResource.category}</Tag>
                    </div>
                    {selectedResource.subCategory && (
                      <div style={{ marginBottom: 8 }}>
                        <Text type="secondary">子分类：</Text>
                        <Tag color="cyan">{selectedResource.subCategory}</Tag>
                      </div>
                    )}
                    <div style={{ marginBottom: 8 }}>
                      <Text type="secondary">难度等级：</Text>
                      <Tag color="orange">{selectedResource.difficulty}</Tag>
                    </div>
                    <div>
                      <Text type="secondary">标签：</Text>
                      <div style={{ marginTop: 4 }}>
                        {selectedResource.tags.map(tag => (
                          <Tag key={tag} color="processing">{tag}</Tag>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {selectedResource.linkUrl && (
                  <div style={{ marginBottom: 16 }}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                      🔗 相关链接
                    </Text>
                    <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <LinkOutlined style={{ color: '#1890ff' }} />
                        <a 
                          href={selectedResource.linkUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ color: '#1890ff', textDecoration: 'none' }}
                        >
                          {selectedResource.linkUrl}
                        </a>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <Button 
                          type="primary" 
                          size="small" 
                          icon={<LinkOutlined />}
                          onClick={() => handleLink(selectedResource.linkUrl!)}
                        >
                          访问链接
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </TabPane>
              
              <TabPane tab="统计数据" key="2">
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    📊 使用统计
                  </Text>
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Card size="small">
                        <Statistic
                          title="下载次数"
                          value={selectedResource.downloadCount}
                          prefix={<DownloadOutlined />}
                          valueStyle={{ color: '#1890ff' }}
                        />
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small">
                        <Statistic
                          title="浏览次数"
                          value={selectedResource.viewCount}
                          prefix={<EyeOutlined />}
                          valueStyle={{ color: '#52c41a' }}
                        />
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small">
                        <Statistic
                          title="点赞数"
                          value={selectedResource.likeCount}
                          prefix={<LikeOutlined />}
                          valueStyle={{ color: '#fa8c16' }}
                        />
                      </Card>
                    </Col>
                    <Col span={12}>
                      <Card size="small">
                        <Statistic
                          title="收藏数"
                          value={selectedResource.favoriteCount}
                          prefix={<HeartOutlined />}
                          valueStyle={{ color: '#eb2f96' }}
                        />
                      </Card>
                    </Col>
                  </Row>
                </div>
                
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    ⭐ 质量评分
                  </Text>
                  <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                      <Rate disabled defaultValue={selectedResource.quality} />
                      <Text strong>{selectedResource.quality.toFixed(1)}</Text>
                    </div>
                    <Progress
                      percent={selectedResource.quality * 20}
                      strokeColor={{
                        '0%': '#108ee9',
                        '100%': '#87d068',
                      }}
                      showInfo={false}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      基于用户评价和系统评估
                    </Text>
                  </div>
                </div>
                
                <div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    📈 趋势分析
                  </Text>
                  <div style={{ background: '#f9f9f9', padding: 16, borderRadius: 8 }}>
                    <Timeline>
                      <Timeline.Item color="green">
                        <Text style={{ fontSize: 12 }}>
                          今日新增 12 次下载
                        </Text>
                      </Timeline.Item>
                      <Timeline.Item color="blue">
                        <Text style={{ fontSize: 12 }}>
                          本周新增 89 次浏览
                        </Text>
                      </Timeline.Item>
                      <Timeline.Item color="red">
                        <Text style={{ fontSize: 12 }}>
                          本月新增 23 次收藏
                        </Text>
                      </Timeline.Item>
                    </Timeline>
                  </div>
                </div>
              </TabPane>
              
              <TabPane tab="管理操作" key="3">
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    🛠️ 快速操作
                  </Text>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Button block icon={<EditOutlined />} onClick={() => {
                      message.success('编辑资源功能开发中...');
                    }}>
                      编辑资源信息
                    </Button>
                    <Button block icon={<CopyOutlined />} onClick={() => {
                      message.success('复制资源功能开发中...');
                    }}>
                      复制资源
                    </Button>
                    <Button block icon={<ShareAltOutlined />} onClick={() => {
                      message.success('分享资源功能开发中...');
                    }}>
                      分享资源
                    </Button>
                    <Button block icon={<SyncOutlined />} onClick={() => {
                      message.success('同步资源功能开发中...');
                    }}>
                      同步到其他平台
                    </Button>
                  </div>
                </div>
                
                <div style={{ marginBottom: 16 }}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    ⚙️ 状态管理
                  </Text>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text>公开状态</Text>
                      <Switch checked={selectedResource.isPublic} onChange={(checked) => {
                        setResources(prev => prev.map(r => 
                          r.id === selectedResource.id 
                            ? { ...r, isPublic: checked }
                            : r
                        ));
                        message.success(checked ? '已设为公开' : '已设为私有');
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text>推荐状态</Text>
                      <Switch checked={selectedResource.isFeatured} onChange={(checked) => {
                        setResources(prev => prev.map(r => 
                          r.id === selectedResource.id 
                            ? { ...r, isFeatured: checked }
                            : r
                        ));
                        message.success(checked ? '已设为推荐' : '已取消推荐');
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text>资源状态</Text>
                      <Select
                        value={selectedResource.status}
                        onChange={(value) => {
                          setResources(prev => prev.map(r => 
                            r.id === selectedResource.id 
                              ? { ...r, status: value }
                              : r
                          ));
                          message.success('状态更新成功');
                        }}
                        size="small"
                        style={{ width: 100 }}
                      >
                        <Option value="active">已发布</Option>
                        <Option value="pending">待审核</Option>
                        <Option value="draft">草稿</Option>
                        <Option value="archived">已归档</Option>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    ⚠️ 危险操作
                  </Text>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Popconfirm
                      title="确定要删除这个资源吗？"
                      description="删除后无法恢复，请谨慎操作。"
                      onConfirm={() => {
                        handleDelete(selectedResource.id);
                        setDetailDrawerVisible(false);
                      }}
                      okText="确定"
                      cancelText="取消"
                    >
                      <Button danger block icon={<DeleteOutlined />}>
                        删除资源
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
              </TabPane>
            </Tabs>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default ResourceManagementPage; 