import React, { useEffect, useRef, useState } from 'react';
import { Button, Steps, Card, Spin, message } from 'antd';
import { FullscreenOutlined, DownloadOutlined, RollbackOutlined, FilePdfOutlined } from '@ant-design/icons';

const WS_URL = 'ws://localhost:5000/api/aiPpt/generate-ppt-ws';

interface TemplateInfo {
  name: string;
  description: string;
  previewUrl: string;
}

export default function PPTProgressPreview({ outline, onClose, pages = 3, topic = '', background = '', template = '' }: { outline: any, onClose: () => void, pages?: number, topic?: string, background?: string, template?: string }) {
  const [steps, setSteps] = useState<string[]>([]);
  const [current, setCurrent] = useState(0);
  const [pptUrl, setPptUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [templates, setTemplates] = useState<string[]>([]);
  const [templateInfo, setTemplateInfo] = useState<TemplateInfo[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState(template || '');
  const [pdfUrl, setPdfUrl] = useState('');
  const [isFull, setIsFull] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // 获取模板列表和描述
  useEffect(() => {
    fetch('/api/aiPpt/ppt/templates').then(r => r.json()).then(res => {
      if (res.templates && res.templates.length > 0) {
        setTemplates(res.templates);
        // 如果没有指定模板，则使用第一个模板
        if (!selectedTemplate && res.templates.length > 0) {
          setSelectedTemplate(res.templates[0]);
        }
      }
      
      if (res.templateInfo && res.templateInfo.length > 0) {
        setTemplateInfo(res.templateInfo);
      }
    }).catch(err => {
      console.error('获取模板列表失败:', err);
      message.error('获取模板列表失败');
    });
  }, [selectedTemplate]);

  // WebSocket连接与进度
  useEffect(() => {
    const socket = new window.WebSocket(WS_URL);
    setWs(socket);
    socket.onopen = () => {
      socket.send(JSON.stringify({ outline, template: selectedTemplate, pages, topic, background }));
    };
    socket.onmessage = async (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'step' || data.type === 'img') {
        setSteps(prev => [...prev, data.msg]);
        setCurrent(prev => prev + 1);
      } else if (data.type === 'done') {
        setPptUrl(data.pptUrl);
        setLoading(false);
        setSteps(prev => [...prev, 'PPT生成完成']);
        // 新增：生成完成后获取pdfUrl
        if (data.pptUrl) {
          const pptName = data.pptUrl.split('/').pop();
          if (pptName) {
            const res = await fetch(`/api/aiPpt/preview-pdf?ppt=${pptName}`);
            const pdfData = await res.json();
            if (pdfData.pdfUrl) setPdfUrl(pdfData.pdfUrl);
          }
        }
      } else if (data.type === 'error') {
        setLoading(false);
        message.error(data.msg);
      }
    };
    socket.onerror = () => { console.warn('WebSocket连接失败'); };
    return () => socket.close();
    // eslint-disable-next-line
  }, [outline, selectedTemplate]);

  // 切换模板重新生成
  const handleTemplateChange = (tpl: string) => {
    setSteps([]); setCurrent(0); setPptUrl(''); setLoading(true); setSelectedTemplate(tpl);
  };

  // 全屏切换
  const handleFullScreen = () => {
    const el = previewRef.current;
    if (el) {
      if (!document.fullscreenElement) {
        el.requestFullscreen();
        setIsFull(true);
      } else {
        document.exitFullscreen();
        setIsFull(false);
      }
    }
  };

  const handleGenPPTByTemplate = async () => {
    try {
      setLoading(true);
      setSteps(prev => [...prev, `使用模板 ${selectedTemplate} 生成PPT...`]);
      setCurrent(prev => prev + 1);
      
      const res = await fetch('/api/aiPpt/gen-pptx-python', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outline,
          template: selectedTemplate,
          topic,
          background
        })
      });
      const data = await res.json();
      if (data.pptUrl) {
        setPptUrl(data.pptUrl);
        setSteps(prev => [...prev, 'PPT生成完成']);
        setCurrent(prev => prev + 1);
        
        // 获取PDF预览
        const pptName = data.pptUrl.split('/').pop();
        if (pptName) {
          try {
            const res = await fetch(`/api/aiPpt/preview-pdf?ppt=${pptName}`);
            const pdfData = await res.json();
            if (pdfData.pdfUrl) setPdfUrl(pdfData.pdfUrl);
          } catch (e) {
            console.error('获取PDF预览失败', e);
          }
        }
        
        setLoading(false);
        message.success('PPT生成成功！');
      } else {
        setLoading(false);
        message.error(data.error || 'PPT生成失败');
        setSteps(prev => [...prev, `生成失败: ${data.error || '未知错误'}`]);
        setCurrent(prev => prev + 1);
      }
    } catch (e) {
      setLoading(false);
      message.error('PPT生成失败');
      setSteps(prev => [...prev, '生成失败: 网络错误']);
      setCurrent(prev => prev + 1);
    }
  };

  // 获取特定模板的信息
  const getTemplateInfo = (templateName: string) => {
    return templateInfo.find(info => info.name === templateName);
  };

  // 模板卡片组件
  const TemplateCard = ({ tpl, selected, onClick }: { tpl: string, selected: boolean, onClick: () => void }) => {
    const info = getTemplateInfo(tpl);
    const templateTitle = tpl.replace(/\.[^.]+$/, '');
    const previewUrl = info?.previewUrl || '';
    const description = info?.description || '';
    
    return (
      <Card
        hoverable
        style={{
          width: 180,
          border: selected ? '3px solid #2176c7' : '1px solid #e0e7ff',
          cursor: 'pointer',
          textAlign: 'center',
          boxShadow: selected ? '0 0 12px #2176c7' : undefined,
          position: 'relative',
          transition: 'all 0.2s',
          overflow: 'hidden',
        }}
        onClick={onClick}
        cover={
          <div style={{ 
            height: 120, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: '#f4f8ff',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <img 
              src={previewUrl} 
              alt={templateTitle} 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%', 
                objectFit: 'cover',
              }}
              onError={(e) => {
                // 图片加载失败时的处理
                (e.target as HTMLImageElement).src = '/default-pic.png';
              }}
            />
            {selected && (
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                width: '100%', 
                height: '100%', 
                background: 'rgba(33, 118, 199, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: '50%', 
                  background: '#2176c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 20
                }}>
                  ✓
                </div>
              </div>
            )}
          </div>
        }
      >
        <div style={{ fontWeight: 500 }}>{templateTitle}</div>
        {description && (
          <div style={{ 
            color: '#888', 
            fontSize: 11, 
            marginTop: 4, 
            height: 32,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {description}
          </div>
        )}
      </Card>
    );
  };

  return (
    <div style={{ display: 'flex', height: 600, width: 1100, background: '#f7faff', borderRadius: 16, boxShadow: '0 2px 16px #e0e7ff', overflow: 'hidden' }}>
      {/* 左侧进度区 */}
      <div style={{ flex: 1, minWidth: 260, background: '#fff', padding: 32, borderRight: '1.5px solid #e0e7ff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontWeight: 700, fontSize: 20, color: '#2176c7', marginBottom: 18 }}>AI生成进度</div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <Steps direction="vertical" size="small" current={current} items={steps.map((s, i) => ({ title: s }))} />
        </div>
        <Button style={{ marginTop: 24 }} onClick={onClose}>返回</Button>
      </div>
      {/* 右侧PPT预览区 */}
      <div style={{ flex: 2.2, minWidth: 500, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', background: '#fafdff' }}>
        <div style={{ fontWeight: 700, fontSize: 20, color: '#2176c7', marginBottom: 18 }}>PPT预览</div>
        <div ref={previewRef} style={{ width: isFull ? '100%' : 600, height: isFull ? '100%' : 420, background: '#fff', borderRadius: 16, boxShadow: '0 4px 24px #e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'all 0.3s' }}>
          {loading ? (
            <Spin size="large"><div style={{ padding: 40, fontSize: 18, color: '#b0b0b0' }}>AI生成中，请稍候...</div></Spin>
          ) : pdfUrl ? (
            <iframe src={pdfUrl} title="pdf预览" width={isFull ? '100%' : 560} height={isFull ? '100%' : 380} style={{ border: 'none', borderRadius: 12, boxShadow: '0 2px 12px #e0e7ff', background: '#fff', transition: 'all 0.3s' }} />
          ) : (
            <div style={{ textAlign: 'center', color: '#b0b0b0', fontSize: 18, padding: 40 }}>
              <FilePdfOutlined style={{ fontSize: 48, marginBottom: 12 }} />
              <div>未生成PPT或PDF预览失败</div>
            </div>
          )}
        </div>
        {/* 操作按钮区 */}
        <div style={{ marginTop: 28, display: 'flex', gap: 18, justifyContent: 'center', alignItems: 'center' }}>
          <Button type="primary" icon={<DownloadOutlined />} href={pptUrl} target="_blank" size="large" disabled={!pptUrl}>下载PPT</Button>
          <Button icon={<FullscreenOutlined />} onClick={handleFullScreen} size="large" disabled={!pdfUrl}>全屏预览</Button>
          <Button icon={<RollbackOutlined />} onClick={onClose} size="large">返回</Button>
          <Button type="primary" onClick={handleGenPPTByTemplate} style={{ marginLeft: 8 }}>用模板高质量生成PPT</Button>
        </div>
        {/* 模板切换区 */}
        <div style={{ marginTop: 32, width: '100%' }}>
          <div style={{ fontWeight: 600, color: '#2176c7', marginBottom: 12 }}>选择PPT模板风格：</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', maxHeight: 420, overflowY: 'auto' }}>
            {templates.map(tpl => (
              <TemplateCard
                key={tpl}
                tpl={tpl}
                selected={tpl === selectedTemplate}
                onClick={() => handleTemplateChange(tpl)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 